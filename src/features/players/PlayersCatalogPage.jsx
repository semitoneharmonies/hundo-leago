import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import {
  EmptyBlock,
  LoadingBlock,
  PageHeading,
  Surface,
} from "../../components/HundoUi.jsx";
import { visibleLeaguesQuery } from "../leagues/leagueQueries.js";
import { useSession } from "../session/sessionContext.js";
import { leaguePlayerSearchQuery } from "./playerQueries.js";

function ErrorMessage({ error }) {
  if (!error) return null;
  return (
    <div role="alert">
      <p>{error.message || "The player request could not be completed."}</p>
      {error.requestId && <p>Request ID: {error.requestId}</p>}
    </div>
  );
}

function displayPosition(player) {
  return (
    player.provider?.normalizedPosition ||
    player.provider?.sourcePosition ||
    "—"
  );
}

function ageFromBirthDate(birthDate, now = new Date()) {
  if (
    typeof birthDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)
  ) {
    return "—";
  }
  const [year, month, day] = birthDate.split("-").map(Number);
  const beforeBirthday =
    now.getUTCMonth() + 1 < month ||
    (now.getUTCMonth() + 1 === month && now.getUTCDate() < day);
  return String(now.getUTCFullYear() - year - (beforeBirthday ? 1 : 0));
}

function ownershipLabel(player) {
  const ownership = player.league.ownership;
  if (!ownership) return "Free agent";
  return `${ownership.team.name} · ${ownership.category}`;
}

function contractLabel(player) {
  const contract = player.league.activeContract;
  if (!contract) return "—";
  return `$${(contract.aavCents / 100).toFixed(2)} AAV · ${contract.remainingYears} years remaining`;
}

function SortHeading({ activeSort, label, sortKey, onSort }) {
  return (
    <button
      type="button"
      className="hl-sort-button"
      onClick={() => onSort(sortKey)}
      aria-label={`Sort by ${label}`}
    >
      {label}
      {activeSort.key === sortKey
        ? activeSort.direction === "asc"
          ? " ↑"
          : " ↓"
        : ""}
    </button>
  );
}

export function PlayersCatalogPage() {
  const { leagueId } = useParams();
  const session = useSession();
  const leagues = useQuery({
    ...visibleLeaguesQuery(session.httpClient),
    enabled: session.status === "authenticated",
  });
  const league = leagues.data?.find(({ id }) => id === leagueId) || null;
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("all");
  const [nhlTeam, setNhlTeam] = useState("all");
  const [ownership, setOwnership] = useState("all");
  const [minimumGames, setMinimumGames] = useState("0");
  const [sort, setSort] = useState({
    key: "fantasyPoints",
    direction: "desc",
  });
  const [comparedIds, setComparedIds] = useState(() => new Set());
  const players = useQuery({
    ...leaguePlayerSearchQuery(session.httpClient, leagueId, {
      query,
      status: "active",
      limit: 100,
      fetchAll: true,
    }),
    enabled: session.status === "authenticated" && Boolean(league),
  });

  const availablePlayers = useMemo(
    () =>
      (players.data?.players || []).filter(
        (player) =>
          player.status === "active" && player.provider?.active !== false
      ),
    [players.data]
  );
  const nhlTeams = useMemo(
    () =>
      [
        ...new Set(
          availablePlayers
            .map((player) => player.provider?.nhlTeamAbbreviation)
            .filter(Boolean)
        ),
      ].sort(),
    [availablePlayers]
  );
  const visiblePlayers = useMemo(() => {
    const minimum = Number(minimumGames);
    const value = (player, key) => {
      switch (key) {
        case "player":
          return player.fullName.toLowerCase();
        case "position":
          return displayPosition(player);
        case "nhlTeam":
          return player.provider?.nhlTeamAbbreviation || "";
        case "age":
          return Number(ageFromBirthDate(player.birthDate)) || -1;
        case "gamesPlayed":
          return player.statistics?.gamesPlayed ?? -1;
        case "goals":
          return player.statistics?.goals ?? -1;
        case "assists":
          return player.statistics?.assists ?? -1;
        case "nhlPoints":
          return player.statistics?.nhlPoints ?? -1;
        case "fantasyPoints":
          return player.statistics?.fantasyPointsHundredths ?? -1;
        case "assignment":
          return player.league.ownership?.team.name || "";
        case "contract":
          return player.league.activeContract?.aavCents ?? -1;
        default:
          return "";
      }
    };
    return availablePlayers
      .filter(
        (player) =>
          (position === "all" || displayPosition(player) === position) &&
          (nhlTeam === "all" ||
            player.provider?.nhlTeamAbbreviation === nhlTeam) &&
          (ownership === "all" ||
            (ownership === "free" && !player.league.ownership) ||
            (ownership === "owned" && Boolean(player.league.ownership))) &&
          (player.statistics?.gamesPlayed ?? 0) >= minimum
      )
      .sort((left, right) => {
        const leftValue = value(left, sort.key);
        const rightValue = value(right, sort.key);
        const comparison =
          typeof leftValue === "string"
            ? leftValue.localeCompare(rightValue)
            : leftValue - rightValue;
        return (
          (sort.direction === "asc" ? comparison : -comparison) ||
          left.fullName.localeCompare(right.fullName)
        );
      });
  }, [
    availablePlayers,
    minimumGames,
    nhlTeam,
    ownership,
    position,
    sort,
  ]);
  const comparedPlayers = availablePlayers.filter((player) =>
    comparedIds.has(player.id)
  );

  function changeSort(key) {
    setSort((current) =>
      current.key === key
        ? {
            key,
            direction: current.direction === "asc" ? "desc" : "asc",
          }
        : {
            key,
            direction: [
              "gamesPlayed",
              "goals",
              "assists",
              "nhlPoints",
              "fantasyPoints",
            ].includes(key)
              ? "desc"
              : "asc",
          }
    );
  }

  function toggleCompare(playerId) {
    setComparedIds((current) => {
      const next = new Set(current);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  }

  if (session.status === "unauthenticated") {
    return (
      <Navigate to={routePaths.home} replace state={{ reason: "sign-in" }} />
    );
  }
  if (session.status === "unknown" || leagues.isPending) {
    return (
      <main className="hl-page">
        <Surface>
          <LoadingBlock>Checking secure league access…</LoadingBlock>
        </Surface>
      </main>
    );
  }
  if (leagues.isError || !league) {
    return (
      <main className="hl-page">
        <PageHeading eyebrow="Players" title="Player access unavailable" />
        <ErrorMessage error={leagues.error} />
      </main>
    );
  }

  return (
    <main className="hl-page hl-page--wide">
      <PageHeading
        eyebrow={league.name}
        title="Players"
        description="Filter, sort, compare, and open an auction for an available free agent."
      />
      <Surface
        as="section"
        className="hl-player-search"
        aria-label="Player filters"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(searchInput.trim());
          }}
          className="hl-filter-bar hl-player-filters"
        >
          <label className="hl-field">
            Search by player name
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>
          <label className="hl-field">
            Position
            <select
              value={position}
              onChange={(event) => setPosition(event.target.value)}
            >
              <option value="all">All positions</option>
              <option value="F">Forwards</option>
              <option value="D">Defence</option>
            </select>
          </label>
          <label className="hl-field">
            NHL team
            <select
              value={nhlTeam}
              onChange={(event) => setNhlTeam(event.target.value)}
            >
              <option value="all">All NHL teams</option>
              {nhlTeams.map((team) => (
                <option value={team} key={team}>
                  {team}
                </option>
              ))}
            </select>
          </label>
          <label className="hl-field">
            League assignment
            <select
              value={ownership}
              onChange={(event) => setOwnership(event.target.value)}
            >
              <option value="all">All available players</option>
              <option value="free">Free agents only</option>
              <option value="owned">Rostered / prospects</option>
            </select>
          </label>
          <label className="hl-field">
            Minimum games
            <select
              value={minimumGames}
              onChange={(event) => setMinimumGames(event.target.value)}
            >
              <option value="0">Any</option>
              <option value="10">10+</option>
              <option value="25">25+</option>
              <option value="50">50+</option>
            </select>
          </label>
          <button className="hl-button hl-button--primary" type="submit">
            Search
          </button>
        </form>
        <p>
          Unavailable provider records are hidden. Total fantasy points is the
          default sort.
        </p>
      </Surface>

      {players.isPending ? (
        <Surface>
          <LoadingBlock>Loading players…</LoadingBlock>
        </Surface>
      ) : players.isError ? (
        <Surface className="hl-state-surface">
          <ErrorMessage error={players.error} />
        </Surface>
      ) : visiblePlayers.length === 0 ? (
        <Surface>
          <EmptyBlock title="No available players match these filters" />
        </Surface>
      ) : (
        <Surface className="hl-feature-section">
          <div className="hl-table-scroll">
            <table className="hl-data-table hl-player-table">
              <thead>
                <tr>
                  <th>
                    <SortHeading activeSort={sort} label="Player" sortKey="player" onSort={changeSort} />
                  </th>
                  <th>
                    <SortHeading activeSort={sort} label="Pos" sortKey="position" onSort={changeSort} />
                  </th>
                  <th>
                    <SortHeading activeSort={sort} label="NHL" sortKey="nhlTeam" onSort={changeSort} />
                  </th>
                  <th>
                    <SortHeading activeSort={sort} label="Age" sortKey="age" onSort={changeSort} />
                  </th>
                  {[
                    ["GP", "gamesPlayed"],
                    ["G", "goals"],
                    ["A", "assists"],
                    ["P", "nhlPoints"],
                    ["FP", "fantasyPoints"],
                  ].map(([label, sortKey]) => (
                    <th key={sortKey}>
                      <SortHeading activeSort={sort} label={label} sortKey={sortKey} onSort={changeSort} />
                    </th>
                  ))}
                  <th>
                    <SortHeading activeSort={sort} label="League assignment" sortKey="assignment" onSort={changeSort} />
                  </th>
                  <th>
                    <SortHeading activeSort={sort} label="Contract" sortKey="contract" onSort={changeSort} />
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visiblePlayers.map((player) => (
                  <tr key={player.id}>
                    <th scope="row">
                      <Link to={routePaths.player(leagueId, player.id)}>
                        {player.fullName}
                      </Link>
                    </th>
                    <td>{displayPosition(player)}</td>
                    <td>{player.provider?.nhlTeamAbbreviation || "—"}</td>
                    <td>{ageFromBirthDate(player.birthDate)}</td>
                    <td>{player.statistics?.gamesPlayed ?? "—"}</td>
                    <td>{player.statistics?.goals ?? "—"}</td>
                    <td>{player.statistics?.assists ?? "—"}</td>
                    <td>{player.statistics?.nhlPoints ?? "—"}</td>
                    <td>
                      {player.statistics
                        ? (
                            player.statistics.fantasyPointsHundredths / 100
                          ).toFixed(2)
                        : "—"}
                    </td>
                    <td>{ownershipLabel(player)}</td>
                    <td>{contractLabel(player)}</td>
                    <td>
                      <div className="hl-player-actions">
                        <label>
                          <input
                            type="checkbox"
                            checked={comparedIds.has(player.id)}
                            onChange={() => toggleCompare(player.id)}
                          />
                          Compare
                        </label>
                        {!player.league.ownership && (
                          <Link
                            className="hl-button hl-button--quiet"
                            to={routePaths.leagueAuctionForPlayer(
                              leagueId,
                              player.id
                            )}
                          >
                            Start auction
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      )}

      {comparedPlayers.length > 0 && (
        <Surface
          as="section"
          className="hl-player-compare"
          aria-labelledby="compare-title"
        >
          <div className="hl-roster-category__heading">
            <div>
              <p className="hl-eyebrow">Selected players</p>
              <h2 id="compare-title">Compare ({comparedPlayers.length})</h2>
            </div>
            <button
              type="button"
              className="hl-button hl-button--quiet"
              onClick={() => setComparedIds(new Set())}
            >
              Clear list
            </button>
          </div>
          <div className="hl-table-scroll">
            <table className="hl-data-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Pos</th>
                  <th>NHL</th>
                  <th>GP</th>
                  <th>G</th>
                  <th>A</th>
                  <th>P</th>
                  <th>FP</th>
                  <th>League status</th>
                  <th>Contract</th>
                </tr>
              </thead>
              <tbody>
                {comparedPlayers.map((player) => (
                  <tr key={player.id}>
                    <th scope="row">{player.fullName}</th>
                    <td>{displayPosition(player)}</td>
                    <td>{player.provider?.nhlTeamAbbreviation || "—"}</td>
                    <td>{player.statistics?.gamesPlayed ?? "—"}</td>
                    <td>{player.statistics?.goals ?? "—"}</td>
                    <td>{player.statistics?.assists ?? "—"}</td>
                    <td>{player.statistics?.nhlPoints ?? "—"}</td>
                    <td>
                      {player.statistics
                        ? (
                            player.statistics.fantasyPointsHundredths / 100
                          ).toFixed(2)
                        : "—"}
                    </td>
                    <td>{ownershipLabel(player)}</td>
                    <td>{contractLabel(player)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      )}

      <p className="hl-page-backlink">
        <Link to={routePaths.league(leagueId)}>Back to dashboard</Link>
      </p>
    </main>
  );
}
