import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import {
  EmptyBlock,
  LoadingBlock,
  PageHeading,
  StatusBadge,
  Surface,
} from "../../components/HundoUi.jsx";
import { TeamRosterPage } from "../rosters/TeamRosterPage.jsx";
import { teamWorkspaceQuery } from "../rosters/teamWorkspaceQueries.js";
import { useSession } from "../session/sessionContext.js";
import { LeagueDashboard } from "./LeagueDashboard.jsx";
import {
  leagueDetailQuery,
  leagueTeamsQuery,
  removeInaccessibleLeagueQueries,
  teamDetailQuery,
  visibleLeaguesQuery,
} from "./leagueQueries.js";
import {
  clearUnauthorizedLeaguePreference,
  readLeaguePreference,
  writeLeaguePreference,
} from "./leaguePreference.js";
import { leagueAuthorityLabel } from "../../shared/leagueAuthority.js";

function SafeQueryError({ error }) {
  return (
    <div role="alert">
      <p>{error?.message || "The league request could not be completed."}</p>
      {error?.requestId && <p>Request ID: {error.requestId}</p>}
    </div>
  );
}

function SessionGate({ children }) {
  const session = useSession();
  if (session.status === "unknown") {
    return <p role="status">Checking secure session…</p>;
  }
  if (session.status === "unauthenticated") {
    return <Navigate to={routePaths.home} replace state={{ reason: "sign-in" }} />;
  }
  return children;
}

function useVisibleLeagues() {
  const session = useSession();
  return useQuery({
    ...visibleLeaguesQuery(session.httpClient),
    enabled: session.status === "authenticated",
  });
}

function useAuthorizationCleanup(leagues) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!leagues) return;
    const ids = leagues.map((league) => league.id);
    removeInaccessibleLeagueQueries(queryClient, ids);
    clearUnauthorizedLeaguePreference(ids);
  }, [leagues, queryClient]);
}

export function LeagueSelectionPage() {
  const leaguesQuery = useVisibleLeagues();
  const [rememberedLeagueId] = useState(readLeaguePreference);
  useAuthorizationCleanup(leaguesQuery.data);

  return (
    <SessionGate>
      <main className="hl-page hl-page--narrow" aria-labelledby="league-selection-title">
        <PageHeading
          eyebrow="League access"
          title="Your leagues"
          description="Choose the league workspace you want to open."
          id="league-selection-title"
        />
        {leaguesQuery.isPending ? (
          <Surface>
            <LoadingBlock>Loading your leagues…</LoadingBlock>
          </Surface>
        ) : leaguesQuery.isError ? (
          <Surface className="hl-state-surface">
            <SafeQueryError error={leaguesQuery.error} />
          </Surface>
        ) : leaguesQuery.data.length === 0 ? (
          <Surface>
            <EmptyBlock title="No league memberships yet">
              Your account is active, but it does not currently have an active
              league membership. A commissioner can invite you.
            </EmptyBlock>
          </Surface>
        ) : leaguesQuery.data.length === 1 ? (
          <Navigate
            to={routePaths.league(leaguesQuery.data[0].id)}
            replace
          />
        ) : (
          <ul className="hl-league-picker">
            {leaguesQuery.data.map((league) => (
              <li key={league.id}>
                <Link
                  to={routePaths.league(league.id)}
                  aria-label={league.name}
                  onClick={() => writeLeaguePreference(league.id)}
                >
                  <span>
                    <strong>{league.name}</strong>
                    <small>{leagueAuthorityLabel(league.membership)}</small>
                  </span>
                  {rememberedLeagueId === league.id && <em>Last opened</em>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </SessionGate>
  );
}

export function LeagueOverviewPage() {
  const { leagueId } = useParams();
  const session = useSession();
  const leaguesQuery = useVisibleLeagues();
  useAuthorizationCleanup(leaguesQuery.data);
  const authorized = leaguesQuery.data?.find((league) => league.id === leagueId);
  const leagueQuery = useQuery({
    ...leagueDetailQuery(session.httpClient, leagueId),
    enabled: session.status === "authenticated" && Boolean(authorized),
  });
  const teamsQuery = useQuery({
    ...leagueTeamsQuery(session.httpClient, leagueId),
    enabled: session.status === "authenticated" && Boolean(authorized),
  });

  useEffect(() => {
    if (authorized) writeLeaguePreference(authorized.id);
  }, [authorized]);

  return (
    <SessionGate>
      <main className="hl-page hl-page--wide" aria-labelledby="league-title">
        {leaguesQuery.isPending ? (
          <p role="status">Confirming league access…</p>
        ) : leaguesQuery.isError ? (
          <SafeQueryError error={leaguesQuery.error} />
        ) : !authorized ? (
          <div role="alert">
            <h1 id="league-title">League access unavailable</h1>
            <p>This league is not in your current active memberships.</p>
            <Link to={routePaths.leagues}>Return to your leagues</Link>
          </div>
        ) : leagueQuery.isPending || teamsQuery.isPending ? (
          <p role="status">Loading {authorized.name}…</p>
        ) : leagueQuery.isError ? (
          <SafeQueryError error={leagueQuery.error} />
        ) : teamsQuery.isError ? (
          <SafeQueryError error={teamsQuery.error} />
        ) : (
          <LeagueDashboard
            league={leagueQuery.data}
            teams={teamsQuery.data}
            session={session}
          />
        )}
      </main>
    </SessionGate>
  );
}

export function LeagueTeamsPage() {
  const { leagueId } = useParams();
  const session = useSession();
  const leaguesQuery = useVisibleLeagues();
  useAuthorizationCleanup(leaguesQuery.data);
  const authorized = leaguesQuery.data?.find((league) => league.id === leagueId);
  const teamsQuery = useQuery({
    ...leagueTeamsQuery(session.httpClient, leagueId),
    enabled: session.status === "authenticated" && Boolean(authorized),
  });

  return (
    <SessionGate>
      <main className="hl-page hl-page--wide" aria-labelledby="teams-title">
        {leaguesQuery.isPending ? (
          <Surface><LoadingBlock>Confirming league access…</LoadingBlock></Surface>
        ) : leaguesQuery.isError ? (
          <Surface className="hl-state-surface"><SafeQueryError error={leaguesQuery.error} /></Surface>
        ) : !authorized ? (
          <>
            <PageHeading eyebrow="Teams" title="Team access unavailable" id="teams-title" />
            <p className="hl-form-message is-error" role="alert">
              This league is not in your current active memberships.
            </p>
          </>
        ) : teamsQuery.isPending ? (
          <Surface><LoadingBlock>Loading league teams…</LoadingBlock></Surface>
        ) : teamsQuery.isError ? (
          <Surface className="hl-state-surface"><SafeQueryError error={teamsQuery.error} /></Surface>
        ) : (
          <>
            <PageHeading
              eyebrow={authorized.name}
              title="Teams"
              description="Open any team’s authoritative roster, contracts, and cap projection."
              id="teams-title"
            />
            {teamsQuery.data.length === 0 ? (
              <Surface><EmptyBlock title="No teams have been created" /></Surface>
            ) : (
              <Surface className="hl-teams-index">
                <ul>
                  {teamsQuery.data.map((team) => {
                    const managedByUser =
                      team.currentManager?.userId === session.user.id;
                    return (
                      <li key={team.id}>
                        <Link
                          to={routePaths.teamRoster(leagueId, team.id)}
                          aria-label={team.name}
                        >
                          <span
                            className="hl-teams-index__mark"
                            aria-hidden="true"
                            style={{
                              "--team-accent": team.primaryColour || "#2563eb",
                            }}
                          >
                            {team.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span>
                            <strong>{team.name}</strong>
                            <small>
                              {team.currentManager?.displayName ||
                                "Manager unassigned"}
                            </small>
                          </span>
                          {managedByUser && (
                            <StatusBadge tone="success">Your team</StatusBadge>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Surface>
            )}
            <p className="hl-page-backlink">
              <Link to={routePaths.league(leagueId)}>Back to dashboard</Link>
            </p>
          </>
        )}
      </main>
    </SessionGate>
  );
}

export function TeamWorkspacePage() {
  const { leagueId, teamId } = useParams();
  const navigate = useNavigate();
  const session = useSession();
  const leaguesQuery = useVisibleLeagues();
  useAuthorizationCleanup(leaguesQuery.data);
  const authorized = leaguesQuery.data?.some((league) => league.id === leagueId);
  const teamQuery = useQuery({
    ...teamDetailQuery(session.httpClient, leagueId, teamId),
    enabled: session.status === "authenticated" && authorized === true,
  });
  const teamsQuery = useQuery({
    ...leagueTeamsQuery(session.httpClient, leagueId),
    enabled: session.status === "authenticated" && authorized === true,
  });
  const rosterQuery = useQuery({
    ...teamWorkspaceQuery(session.httpClient, leagueId, teamId),
    enabled: session.status === "authenticated" && authorized === true,
  });
  return (
    <SessionGate>
      <main className="hl-page hl-page--wide" aria-labelledby="team-title">
        {leaguesQuery.isPending ? (
          <p role="status">Confirming league access…</p>
        ) : !authorized ? (
          <div role="alert">
            <h1 id="team-title">Team access unavailable</h1>
            <p>This team is not available through your current league access.</p>
          </div>
        ) : teamQuery.isPending || teamsQuery.isPending || rosterQuery.isPending ? (
          <p role="status">Loading team…</p>
        ) : teamQuery.isError ? (
          <SafeQueryError error={teamQuery.error} />
        ) : teamsQuery.isError ? (
          <SafeQueryError error={teamsQuery.error} />
        ) : rosterQuery.isError ? (
          <SafeQueryError error={rosterQuery.error} />
        ) : (
          <>
            <TeamRosterPage
              workspace={rosterQuery.data}
              teams={teamsQuery.data}
              managerName={teamQuery.data.currentManager?.displayName ?? null}
              onTeamChange={(nextTeamId) =>
                navigate(routePaths.teamRoster(leagueId, nextTeamId))
              }
              httpClient={session.httpClient}
            />
            <p className="hl-page-backlink">
              <Link to={routePaths.league(leagueId)}>Back to dashboard</Link>
            </p>
          </>
        )}
      </main>
    </SessionGate>
  );
}
