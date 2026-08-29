import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  PageHeading,
  StatusBadge,
  Surface,
  TeamMark,
} from "../../components/HundoUi.jsx";
import { TeamRosterPage } from "../rosters/TeamRosterPage.jsx";
import { teamWorkspaceQuery } from "../rosters/teamWorkspaceQueries.js";
import { useSession } from "../session/sessionContext.js";
import { LeagueDashboard } from "./LeagueDashboard.jsx";
import {
  adminUsersQuery,
  assignLeagueCommissioner,
  createLeague,
  leagueDetailQuery,
  leagueKeys,
  leagueMembershipsQuery,
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
import { teamColourClass, teamColourStyle } from "../../shared/teamIdentity.js";
import { createIntentKey } from "../accounts/accountApi.js";

function PlatformAdminLeaguePanel({ httpClient, leagues, usersQuery }) {
  const queryClient = useQueryClient();
  const users = usersQuery;
  const [leagueName, setLeagueName] = useState("");
  const [createdLeague, setCreatedLeague] = useState(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState("");
  const [commissionerUserId, setCommissionerUserId] = useState("");
  const [message, setMessage] = useState("");
  const availableLeagues =
    createdLeague && !leagues.some(({ id }) => id === createdLeague.id)
      ? [...leagues, createdLeague]
      : leagues;
  const selectedLeague =
    availableLeagues.find(({ id }) => id === selectedLeagueId) || null;
  const memberships = useQuery({
    ...leagueMembershipsQuery(
      httpClient,
      selectedLeagueId || "pending"
    ),
    enabled: Boolean(selectedLeagueId),
  });
  const currentCommissioner =
    memberships.data?.find(
      ({ permissionCategory, status }) =>
        permissionCategory === "commissioner" && status === "active"
    ) || null;
  const eligibleUsers = (users.data || []).filter(
    ({ id, isPlatformAdministrator, status }) =>
      status === "active" &&
      isPlatformAdministrator !== true &&
      id !== currentCommissioner?.user.id
  );
  const createMutation = useMutation({
    mutationFn: () =>
      createLeague(
        httpClient,
        leagueName.trim(),
        createIntentKey("admin-league-create")
      ),
    onSuccess: async (result) => {
      setCreatedLeague(result.league);
      setSelectedLeagueId(result.league.id);
      setLeagueName("");
      setMessage(
        `${result.league.name} was created. Choose its commissioner below.`
      );
      await queryClient.invalidateQueries({ queryKey: ["leagues"] });
    },
    onError: () => setMessage(""),
  });
  const assignmentMutation = useMutation({
    mutationFn: () =>
      assignLeagueCommissioner(
        httpClient,
        selectedLeague.id,
        commissionerUserId,
        createIntentKey("commissioner-assignment")
      ),
    onSuccess: async () => {
      const selected = users.data?.find(
        ({ id }) => id === commissionerUserId
      );
      setMessage(
        `Commissioner assignment sent to ${
          selected?.displayName || "the selected user"
        }. It becomes active after acceptance.`
      );
      setCommissionerUserId("");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: leagueKeys.memberships(selectedLeague.id),
        }),
        queryClient.invalidateQueries({ queryKey: leagueKeys.all }),
      ]);
    },
    onError: () => setMessage(""),
  });

  return (
    <Surface as="section" className="hl-admin-league-panel">
      <p className="hl-eyebrow">Platform administration</p>
      <h2>Create a league</h2>
      <p>
        New leagues begin in Setup. Commissioner authority is assigned to an
        existing user through a separate acceptance workflow.
      </p>
      <form
        className="hl-feature-form"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage("");
          createMutation.mutate();
        }}
      >
        <label className="hl-field">
          League name
          <input
            value={leagueName}
            maxLength={120}
            required
            onChange={(event) => setLeagueName(event.target.value)}
          />
        </label>
        <button
          className="hl-button hl-button--primary"
          type="submit"
          disabled={createMutation.isPending || !leagueName.trim()}
        >
          {createMutation.isPending ? "Creating…" : "Create league"}
        </button>
      </form>
      {availableLeagues.length > 0 && (
        <label className="hl-field">
          League to manage
          <select
            value={selectedLeagueId}
            onChange={(event) => {
              setSelectedLeagueId(event.target.value);
              setCommissionerUserId("");
              setMessage("");
            }}
          >
            <option value="">Choose a league</option>
            {availableLeagues.map((league) => (
              <option key={league.id} value={league.id}>
                {league.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {selectedLeague && (
        <form
          className="hl-feature-form hl-admin-commissioner-form"
          onSubmit={(event) => {
            event.preventDefault();
            setMessage("");
            assignmentMutation.mutate();
          }}
        >
          <h3>
            {currentCommissioner ? "Transfer" : "Set initial"} commissioner
            for {selectedLeague.name}
          </h3>
          {currentCommissioner && (
            <p>
              Current commissioner: {currentCommissioner.user.displayName}.
              The transfer becomes atomic when the proposed replacement
              accepts.
            </p>
          )}
          {users.isPending || memberships.isPending ? (
            <LoadingBlock>Loading eligible users…</LoadingBlock>
          ) : users.isError || memberships.isError ? (
            <SafeQueryError error={users.error || memberships.error} />
          ) : (
            <>
              <label className="hl-field">
                Commissioner
                <select
                  value={commissionerUserId}
                  required
                  onChange={(event) =>
                    setCommissionerUserId(event.target.value)
                  }
                >
                  <option value="">Choose a user</option>
                  {eligibleUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.displayName} ({user.email})
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="hl-button hl-button--primary"
                type="submit"
                disabled={
                  assignmentMutation.isPending || !commissionerUserId
                }
              >
                {currentCommissioner
                  ? "Send commissioner transfer"
                  : "Send commissioner assignment"}
              </button>
            </>
          )}
        </form>
      )}
      {message && <p className="hl-form-message">{message}</p>}
      {(createMutation.error || assignmentMutation.error) && (
        <SafeQueryError
          error={createMutation.error || assignmentMutation.error}
        />
      )}
    </Surface>
  );
}

function SafeQueryError({ error }) {
  return (
    <ErrorBlock
      error={error}
      fallback="The league request could not be completed."
      impact="League information is unavailable until the request succeeds."
      recovery="Refresh the page and try again."
    />
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
  const session = useSession();
  const leaguesQuery = useVisibleLeagues();
  const adminUsers = useQuery({
    ...adminUsersQuery(session.httpClient),
    enabled: session.status === "authenticated",
    retry: false,
  });
  const [rememberedLeagueId] = useState(readLeaguePreference);
  useAuthorizationCleanup(leaguesQuery.data);
  const platformAdministrator =
    adminUsers.isSuccess ||
    leaguesQuery.data?.some(
      (league) =>
        league.membership.effectiveAuthority === "platform_administrator"
    );

  return (
    <SessionGate>
      <main className="hl-page hl-page--narrow" aria-labelledby="league-selection-title">
        <PageHeading
          eyebrow="League access"
          title="Your leagues"
          description="Choose the league workspace you want to open."
          id="league-selection-title"
        />
        {leaguesQuery.isPending ||
        (leaguesQuery.data?.length === 0 && adminUsers.isPending) ? (
          <Surface>
            <LoadingBlock>Loading your leagues…</LoadingBlock>
          </Surface>
        ) : leaguesQuery.isError ? (
          <Surface className="hl-state-surface">
            <SafeQueryError error={leaguesQuery.error} />
          </Surface>
        ) : leaguesQuery.data.length === 0 && !platformAdministrator ? (
          <Surface>
            <EmptyBlock title="No league memberships yet">
              Your account is active, but it does not currently have an active
              league membership. A commissioner can invite you.
            </EmptyBlock>
          </Surface>
        ) : leaguesQuery.data.length === 1 && !platformAdministrator ? (
          <Navigate
            to={routePaths.league(leaguesQuery.data[0].id)}
            replace
          />
        ) : (
          <>
            {leaguesQuery.data.length > 0 ? (
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
            ) : null}
            {platformAdministrator && (
              <PlatformAdminLeaguePanel
                httpClient={session.httpClient}
                leagues={leaguesQuery.data || []}
                usersQuery={adminUsers}
              />
            )}
          </>
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
                          style={teamColourStyle(team)}
                          className={teamColourClass(
                            "hl-teams-index__team",
                            team
                          )}
                        >
                          <TeamMark
                            team={team}
                            logoUrl={
                              team.logoReference
                                ? session.httpClient.resourceUrl(
                                    team.logoReference
                                  )
                                : null
                            }
                            className="hl-teams-index__mark"
                          />
                          <span className="hl-teams-index__identity">
                            <strong>{team.name}</strong>
                            <small>
                              {team.currentManager?.displayName ||
                                "Manager unassigned"}
                            </small>
                          </span>
                          {managedByUser && (
                            <StatusBadge
                              tone="success"
                              className="hl-teams-index__managed-badge"
                            >
                              Your team
                            </StatusBadge>
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
              currentUserId={session.user.id}
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
