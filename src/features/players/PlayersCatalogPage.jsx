import { useDeferredValue, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Gavel } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import {
  EmptyBlock,
  LoadingBlock,
  PageHeading,
  PositionTag,
  Surface,
  TableScroll,
} from "../../components/HundoUi.jsx";
import {
  leagueTeamsQuery,
  visibleLeaguesQuery,
} from "../leagues/leagueQueries.js";
import { useSession } from "../session/sessionContext.js";
import {
  leaguePlayerInfiniteQuery,
  leaguePlayerSearchQuery,
} from "./playerQueries.js";

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

function playerAavLabel(player) {
  const contract = player.league.activeContract;
  if (contract) return `$${(contract.aavCents / 100).toFixed(2)}`;
  return player.league.ownership ? "—" : "FA";
}

function playerYearsLabel(player) {
  return player.league.activeContract?.remainingYears ?? "—";
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

function SortableColumnHeading({
  activeSort,
  className,
  label,
  sortKey,
  onSort,
}) {
  return (
    <th
      className={className}
      scope="col"
      aria-sort={
        activeSort.key === sortKey
          ? activeSort.direction === "asc"
            ? "ascending"
            : "descending"
          : undefined
      }
    >
      <SortHeading
        activeSort={activeSort}
        label={label}
        sortKey={sortKey}
        onSort={onSort}
      />
    </th>
  );
}

function HockeyStickIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="hl-hockey-stick"
    >
      <path
        d="M18.8 2.8 8.1 18.1c-.8 1.1-1.9 1.7-3.3 1.7H2.7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
      <path
        d="m16.6 5.9 2.7 1.9M14.7 8.7l2.6 1.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
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
  const deferredSearchInput = useDeferredValue(searchInput.trim());
  const players = useInfiniteQuery({
    ...leaguePlayerInfiniteQuery(session.httpClient, leagueId, {
      query,
      status: "active",
      limit: 100,
      sort: "fantasyPoints",
    }),
    enabled: session.status === "authenticated" && Boolean(league),
  });
  const autocomplete = useQuery({
    ...leaguePlayerSearchQuery(session.httpClient, leagueId, {
      query: deferredSearchInput,
      status: "active",
      limit: 8,
      sort: "name",
    }),
    enabled:
      session.status === "authenticated" &&
      Boolean(league) &&
      deferredSearchInput.length >= 2 &&
      deferredSearchInput.toLowerCase() !== query.toLowerCase(),
  });
  const teams = useQuery({
    ...leagueTeamsQuery(session.httpClient, leagueId),
    enabled: session.status === "authenticated" && Boolean(league),
  });

  const loadedPlayers = useMemo(() => {
    const playersById = new Map();
    for (const page of players.data?.pages || []) {
      for (const player of page.players) {
        playersById.set(player.id, player);
      }
    }
    return [...playersById.values()];
  }, [players.data]);
  const availablePlayers = useMemo(
    () =>
      loadedPlayers.filter(
        (player) =>
          player.status === "active" && player.provider?.active !== false
      ),
    [loadedPlayers]
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
    return (autocomplete.data?.players || [])
      .filter(
        (player) =>
          player.status === "active" &&
          player.provider?.active !== false &&
          player.fullName.toLowerCase().includes(needle)
      )
      .slice(0, 8);
  }, [autocomplete.data, query, searchInput]);

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
          <TableScroll label="Player catalog">
            <table className="hl-data-table hl-player-row-table hl-player-table">
              <thead>
                <tr>
                  <th className="hl-player-col-order" scope="col">Order</th>
                  <SortableColumnHeading className="hl-player-col-position" activeSort={sort} label="Pos" sortKey="position" onSort={changeSort} />
                  <SortableColumnHeading className="hl-player-col-name" activeSort={sort} label="Player" sortKey="player" onSort={changeSort} />
                  <SortableColumnHeading className="hl-player-col-aav" activeSort={sort} label="AAV / FA" sortKey="contract" onSort={changeSort} />
                  <th className="hl-player-col-years" scope="col">Years</th>
                  <SortableColumnHeading className="hl-player-col-age" activeSort={sort} label="Age" sortKey="age" onSort={changeSort} />
                  <SortableColumnHeading className="hl-player-col-nhl" activeSort={sort} label="NHL" sortKey="nhlTeam" onSort={changeSort} />
                  {[
                    ["GP", "gamesPlayed"],
                    ["G", "goals"],
                    ["A", "assists"],
                    ["P", "nhlPoints"],
                    ["FP", "fantasyPoints"],
                    ["FPG", "fantasyPointsPerGame"],
                  ].map(([label, sortKey]) => (
                    <SortableColumnHeading
                      activeSort={sort}
                      className="hl-player-col-stat"
                      key={sortKey}
                      label={label}
                      sortKey={sortKey}
                      onSort={changeSort}
                    />
                  ))}
                  <th className="hl-player-col-actions" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visiblePlayers.map((player) => (
                  <tr key={player.id}>
                    <td className="hl-player-col-order">
                      <span className="hl-player-row-placeholder" aria-hidden="true">
                        —
                      </span>
                    </td>
                    <td className="hl-player-col-position">
                      <PositionTag
                        position={displayPosition(player)}
                        category={
                          player.league.ownership?.category || "Free Agent"
                        }
                      />
                    </td>
                    <th className="hl-player-col-name" scope="row">
                      <Link to={routePaths.player(leagueId, player.id)}>
                        {player.fullName}
                      </Link>
                    </th>
                    <td className="hl-player-col-aav is-mono">
                      {playerAavLabel(player)}
                    </td>
                    <td className="hl-player-col-years">
                      {playerYearsLabel(player)}
                    </td>
                    <td className="hl-player-col-age">
                      {ageFromBirthDate(player.birthDate)}
                    </td>
                    <td className="hl-player-col-nhl">
                      {player.provider?.nhlTeamAbbreviation || "—"}
                    </td>
                    <td className="hl-player-col-stat">{player.statistics?.gamesPlayed ?? "—"}</td>
                    <td className="hl-player-col-stat">{player.statistics?.goals ?? "—"}</td>
                    <td className="hl-player-col-stat">{player.statistics?.assists ?? "—"}</td>
                    <td className="hl-player-col-stat">{player.statistics?.nhlPoints ?? "—"}</td>
                    <td className="hl-player-col-stat">
                      {player.statistics
                        ? (
                            player.statistics.fantasyPointsHundredths / 100
                          ).toFixed(2)
                        : "—"}
                    </td>
                    <td className="hl-player-col-stat">
                      {player.statistics
                        ? fantasyPointsPerGame(player.statistics).toFixed(2)
                        : "—"}
                    </td>
                    <td className="hl-player-col-actions">
                      <div className="hl-player-actions">
                        <button
                          type="button"
                          className={`hl-player-action hl-player-favourite${
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
                          <HockeyStickIcon />
                          <span>Favourites</span>
                        </button>
                        {!player.league.ownership && (
                          <Link
                            className="hl-player-action hl-player-auction-action"
                            to={routePaths.leagueAuctionForPlayer(
                              leagueId,
                              player.id
                            )}
                          >
                            <Gavel aria-hidden="true" />
                            <span>Start auction</span>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        </Surface>
      )}

      {!players.isPending && !players.isError && (
        <div className="hl-player-pagination" aria-live="polite">
          <p>
            Showing {visiblePlayers.length} of {availablePlayers.length} loaded
            players.
          </p>
          {players.hasNextPage ? (
            <button
              type="button"
              className="hl-button hl-button--secondary"
              onClick={() => players.fetchNextPage()}
              disabled={players.isFetchingNextPage}
            >
              {players.isFetchingNextPage
                ? "Loading next 100 players..."
                : "Load next 100 players"}
            </button>
          ) : (
            <span>All matching players loaded.</span>
          )}
        </div>
      )}

      <p className="hl-page-backlink">
        <Link to={routePaths.league(leagueId)}>Back to dashboard</Link>
      </p>
    </main>
  );
}
