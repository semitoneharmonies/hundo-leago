import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import {
  EmptyBlock,
  LoadingBlock,
  PageHeading,
  StatusBadge,
  Surface,
} from "../../components/HundoUi.jsx";
import { visibleLeaguesQuery } from "../leagues/leagueQueries.js";
import { useSession } from "../session/sessionContext.js";
import {
  leaguePlayerDetailQuery,
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

function usePlayerContext(leagueId) {
  const session = useSession();
  const leagues = useQuery({
    ...visibleLeaguesQuery(session.httpClient),
    enabled: session.status === "authenticated",
  });
  const league = leagues.data?.find(({ id }) => id === leagueId) || null;
  return { session, leagues, league };
}

function PlayerGate({ context, title, children }) {
  if (context.session.status === "unauthenticated") {
    return <Navigate to={routePaths.home} replace state={{ reason: "sign-in" }} />;
  }
  if (context.session.status === "unknown" || context.leagues.isPending) {
    return (
      <main className="hl-page">
        <Surface>
          <LoadingBlock>Checking secure league access…</LoadingBlock>
        </Surface>
      </main>
    );
  }
  if (context.leagues.isError) {
    return (
      <main className="hl-page">
        <Surface className="hl-state-surface">
        <ErrorMessage error={context.leagues.error} />
        </Surface>
      </main>
    );
  }
  if (!context.league) {
    return (
      <main className="hl-page">
        <PageHeading eyebrow="Players" title={title} />
        <p className="hl-form-message is-error" role="alert">This league is not in your active memberships.</p>
      </main>
    );
  }
  return (
    <main className="hl-page hl-page--wide">
      <PageHeading
        eyebrow={context.league.name}
        title={title}
        description={
          title === "Players"
            ? "Search and inspect the authoritative player database."
            : "Authoritative player identity and provider details."
        }
      />
      {children}
    </main>
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
  if (typeof birthDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return "—";
  }
  const [year, month, day] = birthDate.split("-").map(Number);
  const beforeBirthday =
    now.getUTCMonth() + 1 < month ||
    (now.getUTCMonth() + 1 === month && now.getUTCDate() < day);
  return String(now.getUTCFullYear() - year - (beforeBirthday ? 1 : 0));
}

function displayStatistics(statistics) {
  if (!statistics) return "Not available";
  return `${statistics.gamesPlayed} GP · ${statistics.goals} G · ${statistics.assists} A · ${statistics.nhlPoints} P`;
}

function statisticsSourceLabel(statistics) {
  if (statistics?.provider === "sportsdataio-discovery-lab") {
    return "SportsDataIO Discovery Lab last-season data";
  }
  if (statistics?.provider === "release_qa_fixture") {
    return "Synthetic Release QA fixture data";
  }
  return "Statistics source unavailable";
}

function money(cents) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

function ownershipLabel(player) {
  const ownership = player.league.ownership;
  if (!ownership) return "Free agent";
  return `${ownership.team.name} · ${ownership.category}`;
}

function contractLabel(player) {
  const contract = player.league.activeContract;
  if (!contract) return "No active contract";
  return `${money(contract.aavCents)} AAV · ${contract.remainingYears} ${
    contract.remainingYears === 1 ? "year" : "years"
  } remaining`;
}

export function LegacyPlayersPage() {
  const { leagueId } = useParams();
  const context = usePlayerContext(leagueId);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("active");
  const [cursor, setCursor] = useState(null);
  const [cursorHistory, setCursorHistory] = useState([]);
  const enabled =
    context.session.status === "authenticated" && Boolean(context.league);
  const players = useQuery({
    ...leaguePlayerSearchQuery(context.session.httpClient, leagueId, {
      query,
      status,
      limit: 25,
      cursor,
    }),
    enabled,
  });

  function resetPage() {
    setCursor(null);
    setCursorHistory([]);
  }

  function submitSearch(event) {
    event.preventDefault();
    setQuery(searchInput.trim());
    resetPage();
  }

  function nextPage() {
    if (!players.data?.page.nextCursor) return;
    setCursorHistory((current) => [...current, cursor]);
    setCursor(players.data.page.nextCursor);
  }

  function previousPage() {
    if (cursorHistory.length === 0) return;
    setCursor(cursorHistory[cursorHistory.length - 1]);
    setCursorHistory((current) => current.slice(0, -1));
  }

  return (
    <PlayerGate context={context} title="Players">
      <Surface as="section" className="hl-player-search" aria-label="Player search">
      <form onSubmit={submitSearch} className="hl-filter-bar">
        <label className="hl-field">
          Search by player name
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>
        <label className="hl-field">
          Player status
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              resetPage();
            }}
          >
            <option value="active">Active players</option>
            <option value="all">All players</option>
            <option value="historical">Historical players</option>
          </select>
        </label>
        <button className="hl-button hl-button--primary" type="submit">Search</button>
      </form>
      <p>Read-only. Player identity and status come from the authenticated league service.</p>
      </Surface>

      {players.isPending ? (
        <Surface className="hl-feature-section">
          <LoadingBlock>Loading players…</LoadingBlock>
        </Surface>
      ) : players.isError ? (
        <Surface className="hl-state-surface">
          <ErrorMessage error={players.error} />
        </Surface>
      ) : players.data.players.length === 0 ? (
        <Surface className="hl-feature-section">
          <EmptyBlock title="No players match this search" />
        </Surface>
      ) : (
        <Surface className="hl-feature-section">
        <div className="hl-table-scroll">
          <table className="hl-data-table hl-player-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Position</th>
                <th>NHL team</th>
                <th>Age</th>
                <th>Last-season stats</th>
                <th>League assignment</th>
                <th>Contract / cap</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {players.data.players.map((player) => (
                <tr key={player.id}>
                  <th scope="row">
                    <Link to={routePaths.player(leagueId, player.id)}>
                      {player.fullName}
                    </Link>
                  </th>
                  <td>{displayPosition(player)}</td>
                  <td>{player.provider?.nhlTeamAbbreviation || "—"}</td>
                  <td>{ageFromBirthDate(player.birthDate)}</td>
                  <td>
                    {displayStatistics(player.statistics)}
                    {player.statistics?.provider === "release_qa_fixture" ? (
                      <span className="hl-player-stat-source">Synthetic fixture</span>
                    ) : null}
                  </td>
                  <td>{ownershipLabel(player)}</td>
                  <td>{contractLabel(player)}</td>
                  <td>
                    <StatusBadge tone={player.status === "active" ? "success" : "neutral"}>
                      {player.status === "active" ? "Active" : "Historical"}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </Surface>
      )}

      {!players.isPending && !players.isError && (
        <nav aria-label="Player results pages" className="hl-pagination">
          <button
            className="hl-button hl-button--quiet"
            type="button"
            onClick={previousPage}
            disabled={cursorHistory.length === 0}
          >
            Previous
          </button>
          <button
            className="hl-button hl-button--quiet"
            type="button"
            onClick={nextPage}
            disabled={!players.data.page.hasMore}
          >
            Next
          </button>
        </nav>
      )}
      <p className="hl-page-backlink">
        <Link to={routePaths.league(leagueId)}>Back to dashboard</Link>
      </p>
    </PlayerGate>
  );
}

export { PlayersCatalogPage as PlayersPage } from "./PlayersCatalogPage.jsx";

export function PlayerDetailPage() {
  const { leagueId, playerId } = useParams();
  const context = usePlayerContext(leagueId);
  const enabled =
    context.session.status === "authenticated" && Boolean(context.league);
  const player = useQuery({
    ...leaguePlayerDetailQuery(
      context.session.httpClient,
      leagueId,
      playerId
    ),
    enabled,
  });

  return (
    <PlayerGate context={context} title="Player details">
      {player.isPending ? (
        <p role="status">Loading player…</p>
      ) : player.isError ? (
        <ErrorMessage error={player.error} />
      ) : (
        <Surface className="hl-player-profile">
          <div className="hl-player-profile__heading">
            <span className="hl-position-tag">{displayPosition(player.data)}</span>
            <h2>{player.data.fullName}</h2>
            <StatusBadge tone={player.data.status === "active" ? "success" : "neutral"}>
              {player.data.status === "active" ? "Active" : "Historical"}
            </StatusBadge>
          </div>
          <dl className="hl-detail-list">
            <dt>Position</dt>
            <dd>{displayPosition(player.data)}</dd>
            <dt>NHL team</dt>
            <dd>{player.data.provider?.nhlTeamAbbreviation || "—"}</dd>
            <dt>Birth date</dt>
            <dd>{player.data.birthDate || "—"}</dd>
            <dt>Age</dt>
            <dd>{ageFromBirthDate(player.data.birthDate)}</dd>
            <dt>Status</dt>
            <dd>
              {player.data.status === "active" ? "Active" : "Historical"}
            </dd>
          </dl>
          <section
            className="hl-profile-statistics"
            aria-labelledby="league-player-status-heading"
          >
            <h3 id="league-player-status-heading">
              {context.league.name} ownership and contract
            </h3>
            {player.data.league.ownership ? (
              <dl className="hl-detail-list">
                <dt>Team</dt>
                <dd>{player.data.league.ownership.team.name}</dd>
                <dt>Roster category</dt>
                <dd>{player.data.league.ownership.category}</dd>
                <dt>Ownership kind</dt>
                <dd>{player.data.league.ownership.kind}</dd>
              </dl>
            ) : (
              <p>This player is a free agent in the selected league.</p>
            )}
            {player.data.league.activeContract ? (
              <dl className="hl-detail-list">
                <dt>Cap charge (AAV)</dt>
                <dd>{money(player.data.league.activeContract.aavCents)}</dd>
                <dt>Total contract value</dt>
                <dd>
                  {money(
                    player.data.league.activeContract
                      .originalTotalValueCents
                  )}
                </dd>
                <dt>Original term</dt>
                <dd>
                  {player.data.league.activeContract.originalTermYears} years
                </dd>
                <dt>Remaining term</dt>
                <dd>
                  {player.data.league.activeContract.remainingYears} years
                </dd>
              </dl>
            ) : (
              <p>No active contract is recorded in the selected league.</p>
            )}
            {!player.data.league.ownership &&
              player.data.status === "active" &&
              player.data.provider?.active !== false && (
                <p>
                  <Link
                    className="hl-button hl-button--primary"
                    to={routePaths.leagueAuctionForPlayer(
                      leagueId,
                      player.data.id
                    )}
                  >
                    Start an auction for {player.data.fullName}
                  </Link>
                </p>
              )}
          </section>
          <section className="hl-profile-statistics" aria-labelledby="last-season-statistics-heading">
            <h3 id="last-season-statistics-heading">Last-season statistics</h3>
            {player.data.statistics ? (
              <dl className="hl-detail-list">
                <dt>Season</dt>
                <dd>{player.data.statistics.nhlSeasonKey.slice(0, 4)}–{player.data.statistics.nhlSeasonKey.slice(6, 8)}</dd>
                <dt>Data source</dt>
                <dd>{statisticsSourceLabel(player.data.statistics)}</dd>
                <dt>Games played</dt>
                <dd>{player.data.statistics.gamesPlayed}</dd>
                <dt>Goals</dt>
                <dd>{player.data.statistics.goals}</dd>
                <dt>Assists</dt>
                <dd>{player.data.statistics.assists}</dd>
                <dt>NHL points</dt>
                <dd>{player.data.statistics.nhlPoints}</dd>
                <dt>Fantasy points</dt>
                <dd>{(player.data.statistics.fantasyPointsHundredths / 100).toFixed(2)}</dd>
              </dl>
            ) : (
              <p>Last-season statistics are not available for this player.</p>
            )}
          </section>
          {player.data.externalIds.length > 0 && (
            <section className="hl-profile-identifiers" aria-labelledby="provider-identifiers-heading">
              <h3 id="provider-identifiers-heading">Provider identifiers</h3>
              <ul>
                {player.data.externalIds.map((externalId) => (
                  <li
                    key={`${externalId.provider}:${externalId.externalValue}`}
                  >
                    {externalId.provider}: {externalId.externalValue}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </Surface>
      )}
      <p className="hl-page-backlink">
        <Link to={routePaths.leaguePlayers(leagueId)}>Back to players</Link>
      </p>
    </PlayerGate>
  );
}
