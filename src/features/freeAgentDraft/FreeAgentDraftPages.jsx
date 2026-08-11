import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import {
  ErrorBlock,
  LoadingBlock,
  PageHeading,
  StatusBadge,
  Surface,
} from "../../components/HundoUi.jsx";
import { effectiveLeagueAuthority } from "../../shared/leagueAuthority.js";
import { leagueDateTime } from "../../shared/hundoFormat.js";
import { useRealtime } from "../../shared/realtime/realtimeContext.js";
import { visibleLeaguesQuery } from "../leagues/leagueQueries.js";
import { useSession } from "../session/sessionContext.js";
import { CandidateCardBuilder } from "./CandidateCardBuilder.jsx";
import {
  FreeAgentDraftResultsContent,
  PublishedCandidateCardView,
} from "./FreeAgentDraftResults.jsx";
import {
  eligibleCandidatePlayersQuery,
  freeAgentDraftKeys,
  freeAgentDraftNavigationQuery,
  freeAgentDraftOverviewQuery,
  privateCandidateCardQuery,
} from "./freeAgentDraftQueries.js";
import styles from "./FreeAgentDraftPage.module.css";

const PREPARATION_PHASES = new Set([
  "cards_open",
  "help_window",
  "deadline_processing",
]);

function useFadContext(leagueId) {
  const session = useSession();
  const leagues = useQuery({
    ...visibleLeaguesQuery(session.httpClient),
    enabled: session.status === "authenticated",
  });
  const league = leagues.data?.find(({ id }) => id === leagueId) || null;
  return { session, leagues, league };
}

function FadGate({ context, title, children }) {
  if (context.session.status === "unauthenticated") {
    return (
      <Navigate
        to={routePaths.home}
        replace
        state={{ reason: "sign-in" }}
      />
    );
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
        <Surface>
          <ErrorBlock
            error={context.leagues.error}
            fallback="League access could not be confirmed."
          />
        </Surface>
      </main>
    );
  }
  if (!context.league) {
    return (
      <main className="hl-page">
        <PageHeading eyebrow="Free Agent Draft" title={title} />
        <p className="hl-form-message is-error" role="alert">
          This league is not in your current active memberships.
        </p>
      </main>
    );
  }
  return (
    <main
      className={`hl-page hl-page--wide ${styles.page}`}
      aria-labelledby="fad-page-title"
    >
      {children}
    </main>
  );
}

function durationLabel(milliseconds) {
  if (milliseconds <= 0) return "Awaiting server confirmation";
  const minutes = Math.floor(milliseconds / 60_000);
  const days = Math.floor(minutes / 1_440);
  const hours = Math.floor((minutes % 1_440) / 60);
  const remainingMinutes = minutes % 60;
  if (days > 0) return `${days}d ${hours}h ${remainingMinutes}m`;
  if (hours > 0) return `${hours}h ${remainingMinutes}m`;
  return `${Math.max(0, remainingMinutes)}m`;
}

function useClientClockSample(observationIdentity) {
  const [sample, setSample] = useState({
    observationIdentity: null,
    clientNowMs: null,
  });
  useEffect(() => {
    if (!Number.isSafeInteger(observationIdentity) || observationIdentity <= 0) {
      return undefined;
    }
    const timer = globalThis.setTimeout(() => {
      setSample({ observationIdentity, clientNowMs: Date.now() });
    }, 0);
    return () => globalThis.clearTimeout(timer);
  }, [observationIdentity]);
  return sample.observationIdentity === observationIdentity
    ? sample.clientNowMs
    : null;
}

function ServerClock({
  serverNowMs,
  serverObservedAtClientMs,
  targetMs,
  label,
  timeZone,
}) {
  const [clientNowMs, setClientNowMs] = useState(() => Date.now());
  const estimatedServerNowMs =
    serverNowMs + (clientNowMs - serverObservedAtClientMs);

  useEffect(() => {
    const timer = globalThis.setInterval(
      () =>
        setClientNowMs(Date.now()),
      30_000
    );
    return () => globalThis.clearInterval(timer);
  }, []);

  return (
    <div className={styles.clock}>
      <span>{label}</span>
      <strong>
        {durationLabel(targetMs - estimatedServerNowMs)}
      </strong>
      <small>{leagueDateTime(targetMs, timeZone)}</small>
    </div>
  );
}

function phaseLabel(phase) {
  return {
    inactive: "Not active",
    cards_open: "Candidate Cards open",
    help_window: "Commissioner help window",
    deadline_processing: "Deadline processing",
    allocating: "Automatic allocation",
    rapid: "Rapid auctions",
    completed: "Complete",
  }[phase] || "Status unavailable";
}

function OverviewHero({
  overview,
  observedAtClientMs,
  title = "Free Agent Draft",
}) {
  return (
    <header className={styles.hero}>
      <div className={styles.heroTop}>
        <div>
          <p className="hl-eyebrow">Annual preseason workflow</p>
          <h1 id="fad-page-title">{title}</h1>
        </div>
        <StatusBadge tone={overview.phase === "completed" ? "success" : "warning"}>
          {phaseLabel(overview.phase)}
        </StatusBadge>
      </div>
      <p>
        Timing, phase, cap, eligibility, and action permissions shown here come
        from the league server.
      </p>
      <div className={styles.clockGrid}>
        <ServerClock
          serverNowMs={overview.serverNowMs}
          serverObservedAtClientMs={observedAtClientMs}
          targetMs={overview.candidateDeadlineAtMs}
          label="Candidate Card deadline"
          timeZone={overview.timeZone}
        />
        {overview.nextRolloverAtMs !== null && (
          <ServerClock
            serverNowMs={overview.serverNowMs}
            serverObservedAtClientMs={observedAtClientMs}
            targetMs={overview.nextRolloverAtMs}
            label="Next rapid rollover"
            timeZone={overview.timeZone}
          />
        )}
        <div className={styles.clock}>
          <span>FAD-anchoring Week 1</span>
          <strong>
            {leagueDateTime(
              overview.frozenFadFirstMatchupStartsAtMs,
              overview.timeZone
            )}
          </strong>
        </div>
        {overview.competitionFirstMatchupStartsAtMs !==
          overview.frozenFadFirstMatchupStartsAtMs && (
          <div className={styles.clock}>
            <span>Current competition Week 1</span>
            <strong>
              {leagueDateTime(
                overview.competitionFirstMatchupStartsAtMs,
                overview.timeZone
              )}
            </strong>
          </div>
        )}
      </div>
    </header>
  );
}

function InactiveDraft({ league }) {
  return (
    <>
      <PageHeading
        eyebrow={league.name}
        title="Free Agent Draft"
        description="Candidate Cards become available automatically after the Entry Draft or approved no-draft transition finishes and readiness succeeds."
        id="fad-page-title"
      />
      <Surface className={styles.panel}>
        <h2>No active Free Agent Draft</h2>
        <p>
          There is no manual setup or opening control. Managers will be notified
          when every Candidate Card opens in one committed readiness operation.
        </p>
      </Surface>
    </>
  );
}

export function CurrentFreeAgentDraftPage() {
  const { leagueId } = useParams();
  const context = useFadContext(leagueId);
  const navigation = useQuery({
    ...freeAgentDraftNavigationQuery(context.session.httpClient, leagueId),
    enabled:
      context.session.status === "authenticated" && Boolean(context.league),
  });

  return (
    <FadGate context={context} title="Free Agent Draft">
      {navigation.isPending ? (
        <Surface>
          <LoadingBlock>Loading Free Agent Draft navigation…</LoadingBlock>
        </Surface>
      ) : navigation.isError ? (
        <Surface>
          <ErrorBlock
            error={navigation.error}
            fallback="Free Agent Draft navigation could not be loaded."
          />
        </Surface>
      ) : navigation.data.fadId === null ? (
        <InactiveDraft league={context.league} />
      ) : PREPARATION_PHASES.has(navigation.data.phase) ? (
        navigation.data.managedCards.length === 1 ? (
          <Navigate
            replace
            to={routePaths.freeAgentDraftCard(
              leagueId,
              navigation.data.fadId,
              navigation.data.managedCards[0].teamId
            )}
          />
        ) : (
          <Navigate
            replace
            to={routePaths.freeAgentDraft(leagueId, navigation.data.fadId)}
          />
        )
      ) : (
        <Navigate
          replace
          to={routePaths.freeAgentDraftResults(
            leagueId,
            navigation.data.fadId
          )}
        />
      )}
    </FadGate>
  );
}

export function FreeAgentDraftPage() {
  const { leagueId, fadId } = useParams();
  const context = useFadContext(leagueId);
  const overview = useQuery({
    ...freeAgentDraftOverviewQuery(context.session.httpClient, leagueId, fadId),
    enabled:
      context.session.status === "authenticated" && Boolean(context.league),
  });

  return (
    <FadGate context={context} title="Free Agent Draft">
      {overview.isPending ? (
        <Surface>
          <LoadingBlock>Loading Free Agent Draft…</LoadingBlock>
        </Surface>
      ) : overview.isError ? (
        <Surface>
          <ErrorBlock error={overview.error} fallback="The Free Agent Draft could not be loaded." />
        </Surface>
      ) : !PREPARATION_PHASES.has(overview.data.phase) ? (
        <Navigate
          replace
          to={routePaths.freeAgentDraftResults(leagueId, fadId)}
        />
      ) : (
        <>
          <OverviewHero
            overview={overview.data}
            observedAtClientMs={overview.dataUpdatedAt}
          />
          <Surface
            className={styles.panel}
            aria-labelledby="managed-candidate-cards-title"
          >
            <div className={styles.panelHeader}>
              <div>
                <p className="hl-eyebrow">Private team workspaces</p>
                <h2 id="managed-candidate-cards-title">Candidate Cards</h2>
              </div>
              <StatusBadge>
                {overview.data.viewer.managedCards.length} managed
              </StatusBadge>
            </div>
            {overview.data.viewer.managedCards.length === 0 ? (
              <p>
                No Candidate Card is available through a current manager
                assignment. Commissioner help access appears only after a team
                requests it.
              </p>
            ) : (
              <div className={styles.teamSelector}>
                {overview.data.viewer.managedCards.map((managedCard) => (
                  <Link
                    className={styles.teamChoice}
                    key={managedCard.teamId}
                    to={routePaths.freeAgentDraftCard(
                      leagueId,
                      fadId,
                      managedCard.teamId
                    )}
                  >
                    <strong>{managedCard.team.name}</strong>
                    <span>{managedCard.missingMandatoryCount} mandatory slots missing</span>
                    <small>{managedCard.capStatus === "compliant" ? "Within cap" : "Over cap"}</small>
                  </Link>
                ))}
              </div>
            )}
          </Surface>

          {overview.data.viewer.commissionerCards.length > 0 && (
            <Surface
              className={styles.panel}
              aria-labelledby="commissioner-help-cards-title"
            >
              <p className="hl-eyebrow">Commissioner help</p>
              <h2 id="commissioner-help-cards-title">Team requests</h2>
              <div className={styles.teamSelector}>
                {overview.data.viewer.commissionerCards.map((candidateCard) =>
                  candidateCard.openPrivateCard.allowed ? (
                    <Link
                      className={styles.teamChoice}
                      key={candidateCard.teamId}
                      to={routePaths.freeAgentDraftCard(
                        leagueId,
                        fadId,
                        candidateCard.teamId
                      )}
                    >
                      <strong>{candidateCard.team.name}</strong>
                      <span>Scoped help access active</span>
                      <small>{candidateCard.missingMandatoryCount} mandatory slots missing</small>
                    </Link>
                  ) : (
                    <div className={styles.teamChoice} key={candidateCard.teamId}>
                      <strong>{candidateCard.team.name}</strong>
                      <span>No active help access</span>
                    </div>
                  )
                )}
              </div>
            </Surface>
          )}
        </>
      )}
    </FadGate>
  );
}

function authorizationFromDescriptor(descriptor, membership) {
  if (!descriptor || descriptor.mode !== "private_card") return null;
  if (descriptor.authorizationEvidence.kind === "manager_assignment") {
    return {
      authorizationScope: "team_manager",
      authorizationEvidence: descriptor.authorizationEvidence,
    };
  }
  return {
    authorizationScope:
      effectiveLeagueAuthority(membership) === "platform_administrator"
        ? "help_grant_platform_administrator"
        : "help_grant_commissioner",
    authorizationEvidence: descriptor.authorizationEvidence,
  };
}

function authorizationIdentity(authorization) {
  if (!authorization) return null;
  return `${authorization.authorizationScope}:${authorization.authorizationEvidence.kind}:${authorization.authorizationEvidence.id}`;
}

function AuthorizedCandidateCard({
  authorization,
  context,
  descriptor,
  fadId,
  leagueId,
  onHelpPrivacyBoundary,
  onProtectedFailure,
  overview,
  overviewObservedAtClientMs,
  teamId,
}) {
  const queryClient = useQueryClient();
  const privateCard = useQuery(
    privateCandidateCardQuery(
      context.session.httpClient,
      leagueId,
      fadId,
      teamId,
      authorization
    )
  );
  const helpScoped = authorization.authorizationScope !== "team_manager";
  const privateCardClientNowMs = useClientClockSample(
    privateCard.dataUpdatedAt
  );
  const estimatedServerNowMs =
    privateCardClientNowMs === null
      ? null
      : overview.serverNowMs +
        (privateCardClientNowMs - overviewObservedAtClientMs);
  const helpExpiresAtMs = privateCard.data?.helpContext?.expiresAtMs ?? null;
  const helpAccessExpired =
    helpScoped &&
    privateCard.data !== undefined &&
    estimatedServerNowMs !== null &&
    (privateCard.data.helpContext?.status !== "active" ||
      !Number.isSafeInteger(helpExpiresAtMs) ||
      helpExpiresAtMs <= estimatedServerNowMs);

  useEffect(() => {
    if (privateCard.isError) onProtectedFailure(privateCard.error);
  }, [onProtectedFailure, privateCard.error, privateCard.isError]);

  useEffect(() => {
    if (!helpScoped || !privateCard.data) return undefined;
    const remaining = Number.isSafeInteger(helpExpiresAtMs)
      ? helpExpiresAtMs -
        (overview.serverNowMs +
          (Date.now() - overviewObservedAtClientMs))
      : 0;
    const timer = globalThis.setTimeout(
      () => onHelpPrivacyBoundary(),
      Math.max(0, remaining)
    );
    return () => globalThis.clearTimeout(timer);
  }, [
    helpExpiresAtMs,
    helpScoped,
    onHelpPrivacyBoundary,
    overview.serverNowMs,
    overviewObservedAtClientMs,
    privateCard.data,
  ]);

  const buildEligibleQueryOptions = useCallback(
    (slotKey, filters) =>
      eligibleCandidatePlayersQuery(
        context.session.httpClient,
        leagueId,
        fadId,
        teamId,
        slotKey,
        { ...filters, authorization }
      ),
    [authorization, context.session.httpClient, fadId, leagueId, teamId]
  );

  const acceptAuthoritativeCard = useCallback(
    async (card) => {
      if (card) {
        queryClient.setQueryData(
          freeAgentDraftKeys.privateCard(leagueId, fadId, teamId),
          card
        );
      } else {
        await queryClient.invalidateQueries({
          queryKey: freeAgentDraftKeys.privateCard(leagueId, fadId, teamId),
        });
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: freeAgentDraftKeys.overview(leagueId, fadId),
        }),
        queryClient.invalidateQueries({
          queryKey: freeAgentDraftKeys.root(leagueId),
        }),
      ]);
    },
    [fadId, leagueId, queryClient, teamId]
  );

  if (helpAccessExpired) {
    return (
      <p className={styles.pendingConfirmation} role="status">
        Commissioner help authorization has reached its measured expiry. The
        private card is hidden while current authorization is rechecked.
      </p>
    );
  }
  if (helpScoped && privateCard.data && privateCardClientNowMs === null) {
    return (
      <Surface>
        <LoadingBlock>Confirming commissioner help expiry…</LoadingBlock>
      </Surface>
    );
  }
  if (privateCard.isPending) {
    return (
      <Surface>
        <LoadingBlock>Loading the authorized Candidate Card…</LoadingBlock>
      </Surface>
    );
  }
  if (privateCard.isError) {
    return (
      <Surface>
        <ErrorBlock
          error={privateCard.error}
          fallback="The Candidate Card could not be loaded."
        />
      </Surface>
    );
  }
  return (
    <CandidateCardBuilder
      key={`${descriptor.authorizationEvidence.kind}:${descriptor.authorizationEvidence.id}:${teamId}`}
      card={privateCard.data}
      httpClient={context.session.httpClient}
      timeZone={overview.timeZone}
      buildEligibleQueryOptions={buildEligibleQueryOptions}
      onAuthoritativeCard={acceptAuthoritativeCard}
      onProtectedFailure={onProtectedFailure}
    />
  );
}

export function CandidateCardPage() {
  const { leagueId, fadId, teamId } = useParams();
  const context = useFadContext(leagueId);
  const queryClient = useQueryClient();
  const realtime = useRealtime();
  const cardScope = `${fadId}:${teamId}`;
  const [deadlineGuard, setDeadlineGuard] = useState({
    scope: cardScope,
    reached: false,
  });
  const deadlineReached =
    deadlineGuard.scope === cardScope && deadlineGuard.reached;
  const overview = useQuery({
    ...freeAgentDraftOverviewQuery(context.session.httpClient, leagueId, fadId),
    enabled:
      context.session.status === "authenticated" && Boolean(context.league),
  });
  const rosterNavigationOptions = overview.data?.seasonId
    ? freeAgentDraftNavigationQuery(context.session.httpClient, leagueId, {
        rosterSeasonId: overview.data.seasonId,
        rosterTeamId: teamId,
      })
    : {
        queryKey: [
          "league",
          leagueId,
          "free-agent-draft",
          "navigation-bootstrap",
          fadId,
          teamId,
        ],
        queryFn: () => Promise.resolve(null),
      };
  const rosterNavigation = useQuery({
    ...rosterNavigationOptions,
    enabled:
      context.session.status === "authenticated" &&
      Boolean(context.league) &&
      Boolean(overview.data?.seasonId) &&
      PREPARATION_PHASES.has(overview.data?.phase),
  });
  const descriptor = rosterNavigation.data?.rosterLinks.find(
    (link) => link.fadId === fadId && link.teamId === teamId
  ) || null;
  const authorization = useMemo(
    () => authorizationFromDescriptor(descriptor, context.league?.membership),
    [context.league?.membership, descriptor]
  );
  const authorizationKey = authorizationIdentity(authorization);
  const privacyAuthorizationKey =
    authorizationKey && realtime.status !== "reauthorizing"
      ? `${realtime.privacyEpoch}:${authorizationKey}`
      : null;
  const [authorizationGate, setAuthorizationGate] = useState(null);
  const [expiredHelpGate, setExpiredHelpGate] = useState(null);
  const [protectedFailureGate, setProtectedFailureGate] = useState(null);
  const overviewClientNowMs = useClientClockSample(overview.dataUpdatedAt);
  const estimatedServerNowMs = overview.data && overviewClientNowMs !== null
    ? overview.data.serverNowMs +
      (overviewClientNowMs - overview.dataUpdatedAt)
    : null;
  const cachedDeadlineReached =
    overview.data !== undefined &&
    estimatedServerNowMs !== null &&
    estimatedServerNowMs >= overview.data.candidateDeadlineAtMs;
  const measuredDeadlineReached =
    deadlineReached || cachedDeadlineReached;

  const removeProtectedData = useCallback(async () => {
    await queryClient.cancelQueries({
      predicate: (query) =>
        query.meta?.leagueId === leagueId &&
        query.meta?.teamId === teamId &&
        (query.queryKey.includes("private-card") ||
          query.queryKey.includes("eligible-players")),
    });
    queryClient.removeQueries({
      predicate: (query) =>
        query.meta?.leagueId === leagueId &&
        query.meta?.teamId === teamId &&
        (query.queryKey.includes("private-card") ||
          query.queryKey.includes("eligible-players")),
    });
  }, [leagueId, queryClient, teamId]);

  const clearPrivateCard = useCallback(
    async ({ remove = true } = {}) => {
      if (remove) {
        await removeProtectedData();
      } else {
        await queryClient.cancelQueries({
          queryKey: freeAgentDraftKeys.privateCard(leagueId, fadId, teamId),
        });
        await queryClient.invalidateQueries({
          queryKey: freeAgentDraftKeys.privateCard(leagueId, fadId, teamId),
        });
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: freeAgentDraftKeys.overview(leagueId, fadId),
        }),
        queryClient.invalidateQueries({
          queryKey: freeAgentDraftKeys.root(leagueId),
        }),
      ]);
    },
    [fadId, leagueId, queryClient, removeProtectedData, teamId]
  );

  useEffect(() => {
    let active = true;
    const resetAuthorization = async () => {
      await removeProtectedData();
      if (privacyAuthorizationKey && overview.data?.seasonId) {
        await queryClient.invalidateQueries({
          queryKey: freeAgentDraftKeys.navigation(leagueId, {
            rosterSeasonId: overview.data.seasonId,
            rosterTeamId: teamId,
          }),
        });
      }
      if (active) setAuthorizationGate(privacyAuthorizationKey);
    };
    void resetAuthorization();
    return () => {
      active = false;
    };
  }, [
    leagueId,
    overview.data?.seasonId,
    privacyAuthorizationKey,
    queryClient,
    removeProtectedData,
    teamId,
  ]);

  useEffect(() => {
    if (!overview.data || !authorization) return undefined;
    const remaining =
      overview.data.candidateDeadlineAtMs -
      (overview.data.serverNowMs +
        (Date.now() - overview.dataUpdatedAt));
    const timer = globalThis.setTimeout(() => {
      setDeadlineGuard({ scope: cardScope, reached: true });
      void clearPrivateCard();
    }, Math.max(0, remaining));
    return () => globalThis.clearTimeout(timer);
  }, [
    authorization,
    cardScope,
    clearPrivateCard,
    overview.data,
    overview.dataUpdatedAt,
  ]);

  const handleHelpPrivacyBoundary = useCallback(() => {
    setExpiredHelpGate(privacyAuthorizationKey);
    void clearPrivateCard({ remove: true });
  }, [clearPrivateCard, privacyAuthorizationKey]);

  const handleProtectedFailure = useCallback(
    (error) => {
      const mustRemove =
        [403, 404].includes(error.status) ||
        [
          "FAD_PHASE_CONFLICT",
          "FAD_DEADLINE_PASSED",
        ].includes(error.code);
      if (mustRemove) {
        setProtectedFailureGate(privacyAuthorizationKey);
        void clearPrivateCard({ remove: true });
      } else if (
        error.status === 412 ||
        error.code === "CANDIDATE_CARD_PRECONDITION_FAILED"
      ) {
        void clearPrivateCard({ remove: false });
      }
    },
    [clearPrivateCard, privacyAuthorizationKey]
  );

  return (
    <FadGate context={context} title="Candidate Card">
      {realtime.status === "reauthorizing" ? (
        <Surface>
          <LoadingBlock>Reauthorizing league-only Candidate Card history…</LoadingBlock>
        </Surface>
      ) : overview.isPending ? (
        <Surface>
          <LoadingBlock>Loading Candidate Card history…</LoadingBlock>
        </Surface>
      ) : overview.isError ? (
        <Surface>
          <ErrorBlock error={overview.error} fallback="The Free Agent Draft could not be loaded." />
        </Surface>
      ) : !PREPARATION_PHASES.has(overview.data.phase) ? (
        <>
          <OverviewHero
            overview={overview.data}
            observedAtClientMs={overview.dataUpdatedAt}
            title="Published Candidate Card"
          />
          <PublishedCandidateCardView
            key={`${realtime.privacyEpoch}:${leagueId}:${fadId}:${teamId}`}
            httpClient={context.session.httpClient}
            leagueId={leagueId}
            fadId={fadId}
            teamId={teamId}
          />
          <p className="hl-page-backlink">
            <Link to={routePaths.freeAgentDraftResults(leagueId, fadId)}>
              Back to Free Agent Draft results
            </Link>
          </p>
        </>
      ) : rosterNavigation.isPending ? (
        <Surface>
          <LoadingBlock>
            Confirming this Candidate Card authorization…
          </LoadingBlock>
        </Surface>
      ) : rosterNavigation.isError ? (
        <Surface>
          <ErrorBlock
            error={rosterNavigation.error}
            fallback="Candidate Card access could not be confirmed."
          />
        </Surface>
      ) : !authorization ? (
        <>
          <PageHeading
            eyebrow={context.league.name}
            title="Candidate Card access unavailable"
            id="fad-page-title"
          />
          <p className={styles.error} role="alert">
            This private card is not available through a current manager
            assignment or active commissioner help grant.
          </p>
        </>
      ) : measuredDeadlineReached ? (
        <>
          <OverviewHero
            overview={overview.data}
            observedAtClientMs={overview.dataUpdatedAt}
            title="Candidate Card"
          />
          <p className={styles.pendingConfirmation} role="status">
            The measured deadline has passed. Private card data has been removed
            while the application awaits the server&apos;s publication state.
          </p>
        </>
      ) : realtime.status === "reauthorizing" ||
        overviewClientNowMs === null ||
        authorizationGate !== privacyAuthorizationKey ? (
        <Surface>
          <LoadingBlock>
            Reauthorizing this private Candidate Card…
          </LoadingBlock>
        </Surface>
      ) : expiredHelpGate === privacyAuthorizationKey ? (
        <p className={styles.pendingConfirmation} role="status">
          Commissioner help authorization has expired. The private card remains
          hidden while current authorization is rechecked.
        </p>
      ) : protectedFailureGate === privacyAuthorizationKey ? (
        <p className={styles.pendingConfirmation} role="status">
          Private Candidate Card authorization changed. The card remains hidden
          while current access is rechecked.
        </p>
      ) : (
        <>
          <OverviewHero
            overview={overview.data}
            observedAtClientMs={overview.dataUpdatedAt}
            title="Candidate Card"
          />
          {overview.data.viewer.managedCards.length > 1 && (
            <nav className={styles.teamSelector} aria-label="Managed Candidate Cards">
              {overview.data.viewer.managedCards.map((managedCard) => (
                <Link
                  key={managedCard.teamId}
                  className={`${styles.teamChoice} ${
                    managedCard.teamId === teamId ? styles.teamChoiceActive : ""
                  }`}
                  aria-current={managedCard.teamId === teamId ? "page" : undefined}
                  to={routePaths.freeAgentDraftCard(
                    leagueId,
                    fadId,
                    managedCard.teamId
                  )}
                >
                  <strong>{managedCard.team.name}</strong>
                  <span>{managedCard.missingMandatoryCount} mandatory slots missing</span>
                </Link>
              ))}
            </nav>
          )}
          <AuthorizedCandidateCard
            key={privacyAuthorizationKey}
            authorization={authorization}
            context={context}
            descriptor={descriptor}
            fadId={fadId}
            leagueId={leagueId}
            onHelpPrivacyBoundary={handleHelpPrivacyBoundary}
            onProtectedFailure={handleProtectedFailure}
            overview={overview.data}
            overviewObservedAtClientMs={overview.dataUpdatedAt}
            teamId={teamId}
          />
          <p className="hl-page-backlink">
            <Link to={routePaths.freeAgentDraft(leagueId, fadId)}>
              Back to Free Agent Draft
            </Link>
          </p>
        </>
      )}
    </FadGate>
  );
}

export function FreeAgentDraftResultsPage() {
  const { leagueId, fadId } = useParams();
  const context = useFadContext(leagueId);
  const realtime = useRealtime();
  const overview = useQuery({
    ...freeAgentDraftOverviewQuery(context.session.httpClient, leagueId, fadId),
    enabled:
      context.session.status === "authenticated" && Boolean(context.league),
  });

  return (
    <FadGate context={context} title="Free Agent Draft results">
      {realtime.status === "reauthorizing" ? (
        <Surface>
          <LoadingBlock>Reauthorizing league-only Free Agent Draft results…</LoadingBlock>
        </Surface>
      ) : overview.isPending ? (
        <Surface>
          <LoadingBlock>Loading Free Agent Draft status…</LoadingBlock>
        </Surface>
      ) : overview.isError ? (
        <Surface>
          <ErrorBlock error={overview.error} fallback="The Free Agent Draft could not be loaded." />
        </Surface>
      ) : PREPARATION_PHASES.has(overview.data.phase) ? (
        <Navigate replace to={routePaths.freeAgentDraft(leagueId, fadId)} />
      ) : (
        <>
          <OverviewHero
            overview={overview.data}
            observedAtClientMs={overview.dataUpdatedAt}
            title="Free Agent Draft results"
          />
          <Surface className={styles.panel}>
            <h2>Published history</h2>
            <p>
              Published cards and allocation results below come only from the
              immutable history and result endpoints. This route never reuses a
              private Candidate Card response.
            </p>
          </Surface>
          <FreeAgentDraftResultsContent
            key={`${realtime.privacyEpoch}:${leagueId}:${fadId}`}
            httpClient={context.session.httpClient}
            leagueId={leagueId}
            fadId={fadId}
            timeZone={overview.data.timeZone}
          />
        </>
      )}
    </FadGate>
  );
}
