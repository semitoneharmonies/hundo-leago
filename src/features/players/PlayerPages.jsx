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
  playerDetailQuery,
  playerSearchQuery,
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

export function PlayersPage() {
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
    ...playerSearchQuery(context.session.httpClient, {
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
                <th>Birth date</th>
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
                  <td>{player.birthDate || "—"}</td>
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

export function PlayerDetailPage() {
  const { leagueId, playerId } = useParams();
  const context = usePlayerContext(leagueId);
  const enabled =
    context.session.status === "authenticated" && Boolean(context.league);
  const player = useQuery({
    ...playerDetailQuery(context.session.httpClient, playerId),
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
            <dt>Status</dt>
            <dd>
              {player.data.status === "active" ? "Active" : "Historical"}
            </dd>
          </dl>
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
