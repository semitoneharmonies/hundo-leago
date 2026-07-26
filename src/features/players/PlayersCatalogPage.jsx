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
import {
  leagueTeamsQuery,
  visibleLeaguesQuery,
} from "../leagues/leagueQueries.js";
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

function fantasyPointsPerGame(statistics) {
  if (!statistics) return null;
  if (statistics.gamesPlayed === 0) return 0;
  return statistics.fantasyPointsHundredths / 100 / statistics.gamesPlayed;
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

function HockeyHelmetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="hl-hockey-helmet"
    >
      <path
        d="M4.5 12.5V10a7.5 7.5 0 0 1 15 0v3.5h-4.2v-2.2H8.7v4.4H5.8a1.3 1.3 0 0 1-1.3-1.3v-1.9Z"
        fill="currentColor"
      />
      <path
        d="M8.7 11.3h6.6v5.5a2.2 2.2 0 0 1-2.2 2.2h-2.2a2.2 2.2 0 0 1-2.2-2.2v-5.5Zm6.6 2.2h4.2v2.2h-4.2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path d="M5 9.2h14" stroke="currentColor" strokeWidth="1.6" />
    </svg>
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
      query: "",
      status: "active",
      limit: 100,
      fetchAll: true,
    }),
    enabled: session.status === "authenticated" && Boolean(league),
  });
  const teams = useQuery({
    ...leagueTeamsQuery(session.httpClient, leagueId),
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
  const leagueTeams = useMemo(() => {
    if (teams.data) return teams.data;
    const byId = new Map();
    for (const player of availablePlayers) {
      const team = player.league.ownership?.team;
      if (team) byId.set(team.id, team);
    }
    return [...byId.values()].sort((left, right) =>
      left.name.localeCompare(right.name)
    );
  }, [availablePlayers, teams.data]);
  const visiblePlayers = useMemo(() => {
    const minimum = Number(minimumGames);
    const normalizedQuery = query.trim().toLowerCase();
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
        case "fantasyPointsPerGame":
          return fantasyPointsPerGame(player.statistics) ?? -1;
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
          (!normalizedQuery ||
            player.fullName.toLowerCase().includes(normalizedQuery)) &&
          (position === "all" || displayPosition(player) === position) &&
          (nhlTeam === "all" ||
            player.provider?.nhlTeamAbbreviation === nhlTeam) &&
          (ownership === "all" ||
            (ownership === "free" && !player.league.ownership) ||
            (ownership === "favourites" && comparedIds.has(player.id)) ||
            (ownership === "prospects" &&
              (player.league.ownership?.category === "Prospect" ||
                player.league.ownership?.kind === "Prospect Right")) ||
            (ownership.startsWith("team:") &&
              player.league.ownership?.team.id === ownership.slice(5))) &&
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
    comparedIds,
    minimumGames,
    nhlTeam,
    ownership,
    position,
    query,
    sort,
  ]);
  const autocompletePlayers = useMemo(() => {
    const needle = searchInput.trim().toLowerCase();
    if (needle.length < 2 || needle === query.toLowerCase()) return [];
    return availablePlayers
      .filter((player) => player.fullName.toLowerCase().includes(needle))
      .slice(0, 8);
  }, [availablePlayers, query, searchInput]);

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
              "fantasyPointsPerGame",
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
        description="Filter and compare the league player catalog, then open an auction for an eligible free agent."
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
          <div className="hl-field hl-player-autocomplete">
            <label htmlFor="player-name-search">Search by player name</label>
            <input
              id="player-name-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls="player-name-suggestions"
              aria-expanded={autocompletePlayers.length > 0}
            />
            {autocompletePlayers.length > 0 && (
              <ul
                id="player-name-suggestions"
                className="hl-player-suggestions"
                role="listbox"
                aria-label="Matching players"
              >
                {autocompletePlayers.map((player) => (
                  <li key={player.id} role="option">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput(player.fullName);
                        setQuery(player.fullName);
                      }}
                    >
                      <strong>{player.fullName}</strong>
                      <span>
                        {displayPosition(player)} ·{" "}
                        {player.provider?.nhlTeamAbbreviation ||
                          "NHL team unavailable"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
              <option value="all">All Players</option>
              <option value="free">Free Agents</option>
              <option value="favourites">
                Favourites ({comparedIds.size})
              </option>
              {leagueTeams.map((team) => (
                <option value={`team:${team.id}`} key={team.id}>
                  {team.name}
                </option>
              ))}
              <option value="prospects">Prospects</option>
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
          <EmptyBlock title="No players match these filters" />
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
                    ["FPG", "fantasyPointsPerGame"],
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
                    <td>
                      {player.statistics
                        ? fantasyPointsPerGame(player.statistics).toFixed(2)
                        : "—"}
                    </td>
                    <td>{ownershipLabel(player)}</td>
                    <td>{contractLabel(player)}</td>
                    <td>
                      <div className="hl-player-actions">
                        <button
                          type="button"
                          className={`hl-player-favourite${
                            comparedIds.has(player.id) ? " is-active" : ""
                          }`}
                          aria-pressed={comparedIds.has(player.id)}
                          aria-label={`${
                            comparedIds.has(player.id) ? "Remove" : "Add"
                          } ${player.fullName} ${
                            comparedIds.has(player.id) ? "from" : "to"
                          } favourites`}
                          title={`${
                            comparedIds.has(player.id)
                              ? "Remove from"
                              : "Add to"
                          } favourites`}
                          onClick={() => toggleCompare(player.id)}
                        >
                          <HockeyHelmetIcon />
                        </button>
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

      <p className="hl-page-backlink">
        <Link to={routePaths.league(leagueId)}>Back to dashboard</Link>
      </p>
    </main>
  );
}
