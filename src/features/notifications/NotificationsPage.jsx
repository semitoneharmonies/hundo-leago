import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import { validateCommissionerAssignment } from "./notificationContracts.js";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  PageHeading,
  StatusBadge,
  Surface,
} from "../../components/HundoUi.jsx";
import { leagueKeys, visibleLeaguesQuery } from "../leagues/leagueQueries.js";
import { auctionDetailQuery } from "../auctions/auctionQueries.js";
import { money } from "../../shared/hundoFormat.js";
import { useSession } from "../session/sessionContext.js";
import {
  getFreeAgentDraftNotificationListCopy,
  isFreeAgentDraftNotificationType,
} from "./notificationContracts.js";
import {
  freeAgentDraftDestinationLabel,
  freeAgentDraftDestinationPath,
  prepareFreeAgentDraftDestination,
} from "./notificationDestinations.js";
import {
  acceptLeagueInvitation,
  declineLeagueInvitation,
  leagueInvitationQuery,
  markNotificationsReadBatch,
  markNotificationRead,
  notificationKeys,
  notificationsQuery,
} from "./notificationQueries.js";

function message(notification) {
  if (isFreeAgentDraftNotificationType(notification.type)) {
    return getFreeAgentDraftNotificationListCopy(notification.type);
  }
  if (notification.type === "league_invitation_created") {
    return `Invitation to ${notification.messageData.leagueName}`;
  }
  if (notification.type === "commissioner_assignment_proposed") return `Commissioner invitation for ${notification.messageData.leagueName}`;
  if (notification.type === "trade_proposal_received") return `${notification.messageData.proposingTeamName} proposed a trade with ${notification.messageData.receivingTeamName}`;
  return (
    notification.messageData.message ||
    notification.messageData.summary ||
    (notification.messageData.leagueName ? `Update from ${notification.messageData.leagueName}` : "Account update")
  );
}

function notificationDestination(notification) {
  if (notification.type === "commissioner_assignment_proposed") return `${routePaths.leagues}?assignmentId=${encodeURIComponent(notification.messageData.assignmentId)}`;
  if (notification.type !== "trade_proposal_received") return null;
  return routePaths.tradeAcceptance(
    notification.messageData.leagueId,
    notification.messageData.tradeId
  );
}

function CommissionerAssignmentActions({ assignmentId, session, onAccepted }) {
  const queryClient = useQueryClient();
  const path = `/api/v1/commissioner-assignments/${encodeURIComponent(assignmentId)}`;
  const assignment = useQuery({
    queryKey: ["commissioner-assignment", assignmentId],
    queryFn: async ({ signal }) => (await session.httpClient.request(path, { authenticated: true, dataKind: "object", signal, validateData: (data) => validateCommissionerAssignment(data, assignmentId) })).data,
    meta: { private: true },
  });
  const action = useMutation({
    mutationFn: async () => (await session.httpClient.request(`${path}/accept`, { method: "POST", body: {}, authenticated: true, dataKind: "object", validateData: (data) => validateCommissionerAssignment(data, assignmentId) })).data,
    onSuccess: async (data) => {
      onAccepted?.(data.league);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["commissioner-assignment", assignmentId] }),
        queryClient.invalidateQueries({ queryKey: leagueKeys.all }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
      ]);
    },
  });
  if (assignment.isPending) return <LoadingBlock>Loading commissioner invitation…</LoadingBlock>;
  if (assignment.isError) return <ErrorBlock error={assignment.error} fallback="This commissioner invitation is no longer available to your account." recovery="Ask the league administrator to review the assignment." />;
  const data = action.data || assignment.data;
  return <div className="hl-notification-invitation">
    <p>You have been invited to serve as commissioner of <strong>{data.league.name}</strong>.</p>
    {data.assignment.status === "pending" ? <>
      <p>Accept to manage league setup, invite managers and use commissioner tools.</p>
      <button type="button" className="hl-button hl-button--primary" disabled={action.isPending} onClick={() => action.mutate()}>
        {action.isPending ? "Accepting…" : "Accept commissioner role"}
      </button>
    </> : data.assignment.status === "accepted" ? <>
      <p role="status">Commissioner role accepted.</p>
      <Link className="hl-button hl-button--primary" to={routePaths.league(data.league.id)}>Continue league setup</Link>
    </> : <p>This commissioner invitation is no longer pending. Ask the administrator if you still need access.</p>}
    {action.error && <ErrorBlock error={action.error} fallback="The commissioner assignment could not be accepted." recovery="Refresh the assignment and try again." />}
  </div>;
}

export function PendingLeagueAccess({ session }) {
  const [searchParams] = useSearchParams();
  const [cursor, setCursor] = useState(null);
  const [acceptedLeague, setAcceptedLeague] = useState(null);
  const requested = searchParams.get("assignmentId");
  const pending = useQuery({
    ...notificationsQuery(session.httpClient, cursor, "all", { pendingLeagueAccess: true }),
    enabled: session.status === "authenticated",
  });
  const items = pending.data?.notifications || [];
  return <Surface>
    <h2>Invitations and commissioner assignments</h2>
    {acceptedLeague && <p role="status">You accepted the commissioner role for {acceptedLeague.name}. <Link to={routePaths.league(acceptedLeague.id)}>Continue league setup</Link></p>}
    {pending.isPending ? <LoadingBlock>Loading pending invitations…</LoadingBlock>
      : pending.isError ? <ErrorBlock error={pending.error} fallback="Pending league invitations could not be loaded." recovery="Refresh this page to try again." />
      : items.length === 0 && !requested ? <p>No pending league invitations or commissioner assignments.</p> : null}
    {requested && !items.some((item) => item.messageData.assignmentId === requested) &&
      <CommissionerAssignmentActions assignmentId={requested} session={session} />}
    {items.map((notification) => <details className="hl-rules-section" key={notification.id} open={requested === notification.messageData.assignmentId}>
      <summary>{message(notification)} — Review</summary>
      {notification.type === "commissioner_assignment_proposed"
        ? <CommissionerAssignmentActions assignmentId={notification.messageData.assignmentId} session={session} onAccepted={setAcceptedLeague} />
        : <LeagueInvitationActions notification={notification} session={session} />}
    </details>)}
    {pending.data?.page.nextCursor && <button type="button" className="hl-button hl-button--quiet" onClick={() => setCursor(pending.data.page.nextCursor)}>More invitations</button>}
    {cursor && <button type="button" className="hl-button hl-button--quiet" onClick={() => setCursor(null)}>First page</button>}
  </Surface>;
}

function notificationCategory(type) {
  const value = String(type || "").toLowerCase();
  if (value.includes("trade")) return { label: "Trade", tone: "trade" };
  if (value.includes("auction")) return { label: "Auction", tone: "auction" };
  if (value.startsWith("fad_") || value.includes("draft")) {
    return { label: "Draft milestone", tone: "draft" };
  }
  if (
    value.includes("league") ||
    value.includes("team") ||
    value.includes("assignment")
  ) {
    return { label: "League", tone: "league" };
  }
  return { label: "Account", tone: "account" };
}

function CompletedAuctionNotification({ notification, notificationMessage, timestamp }) {
  const session = useSession();
  const [expanded, setExpanded] = useState(false);
  const leagueId = notification.leagueId || notification.messageData.leagueId;
  const auctionId = notification.messageData.destination?.auctionId || notification.messageData.auctionId || notification.related?.recordId;
  const auction = useQuery({
    ...auctionDetailQuery(session.httpClient, leagueId, auctionId),
    enabled: expanded && session.status === "authenticated",
  });
  const result = auction.data?.result;
  return <details className="hl-notification-auction-result" onToggle={(event) => setExpanded(event.currentTarget.open)}>
    <summary><strong>{notificationMessage}</strong><small className="hl-notification-category is-auction">Auction result</small>{timestamp}<small>{expanded ? "Hide result" : "View result"}</small></summary>
    {expanded && (auction.isPending ? <LoadingBlock>Loading auction result…</LoadingBlock>
      : auction.isError ? <ErrorBlock error={auction.error} fallback="This auction result is no longer available to your account." recovery="Check your league membership or ask the commissioner." />
      : result ? <div className="hl-notification-auction-summary">
        <strong>{auction.data.player.fullName}</strong>
        {result.winningTeam ? <dl>
          <div><dt>Winning team</dt><dd>{result.winningTeam.name || result.winningTeam.displayName}</dd></div>
          <div><dt>Final contract total</dt><dd>{money(result.finalContractValueCents)}</dd></div>
          <div><dt>Term and AAV</dt><dd>{result.submittedTermYears} {result.submittedTermYears === 1 ? "year" : "years"} at {money(result.finalAavCents)} per year</dd></div>
        </dl> : <p>{result.outcomeCode === "cancelled" ? "This auction was cancelled." : "No contract was awarded."}</p>}
        {result.drawEvidence?.orderedBidIds?.length > 1 && <p>An equal top offer was settled by a draw between {result.drawEvidence.orderedBidIds.length} tied bids.</p>}
      </div> : <p>The final result is not available yet. It may need commissioner review.</p>)}
  </details>;
}

function FadNotificationDestination({
  category,
  notification,
  notificationMessage,
  timestamp,
}) {
  const session = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [destinationError, setDestinationError] = useState(null);
  const destination = notification.messageData.destination;
  const path = freeAgentDraftDestinationPath(destination);
  const destinationLabel = freeAgentDraftDestinationLabel(destination);

  const followDestination = async (event) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    if (checkingAccess) return;
    setCheckingAccess(true);
    setDestinationError(null);
    try {
      const authorizedPath = await prepareFreeAgentDraftDestination({
        destination,
        httpClient: session.httpClient,
        queryClient,
      });
      navigate(authorizedPath);
    } catch (error) {
      setDestinationError(error);
      setCheckingAccess(false);
    }
  };

  return (
    <>
      <Link
        aria-busy={checkingAccess || undefined}
        className="hl-notification-list__link"
        to={path}
        onClick={followDestination}
      >
        <span>
          <strong>{notificationMessage}</strong>
          <small className={`hl-notification-category is-${category.tone}`}>
            {category.label}
          </small>
          {timestamp}
          <small>
            {checkingAccess ? "Checking current access..." : destinationLabel}
          </small>
        </span>
        <ChevronRight aria-hidden="true" />
      </Link>
      {destinationError && (
        <ErrorBlock
          error={destinationError}
          fallback="This notification destination could not be opened."
          impact="Your notification is still available and no league data changed."
          recovery="Check your current league access, then try the notification again."
          action={
            <button
              className="hl-button hl-button--quiet"
              type="button"
              onClick={() => setDestinationError(null)}
            >
              Dismiss
            </button>
          }
        />
      )}
    </>
  );
}

function LeagueInvitationActions({ notification, session }) {
  const queryClient = useQueryClient();
  const invitationId = notification.messageData.invitationId;
  const [teamName, setTeamName] = useState("");
  const [completedMessage, setCompletedMessage] = useState("");
  const invitation = useQuery(
    leagueInvitationQuery(session.httpClient, invitationId)
  );
  const action = useMutation({
    mutationFn: (actionName) =>
      actionName === "accept"
        ? acceptLeagueInvitation(
            session.httpClient,
            invitationId,
            invitation.data.invitation.workflow === "create_team"
              ? { teamName: teamName.trim() }
              : {}
          )
        : declineLeagueInvitation(session.httpClient, invitationId),
    onSuccess: async (result, actionName) => {
      setCompletedMessage(
        actionName === "accept"
          ? `You joined ${result.league.name}.`
          : `You declined the invitation to ${result.league.name}.`
      );
      await markNotificationRead(session.httpClient, notification.id).catch(
        () => null
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: notificationKeys.invitation(invitationId),
        }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
        queryClient.invalidateQueries({ queryKey: leagueKeys.all }),
      ]);
    },
  });

  if (invitation.isPending) {
    return (
      <div className="hl-notification-invitation">
        <span>Loading invitation details...</span>
      </div>
    );
  }
  if (invitation.isError) {
    return (
      <ErrorBlock
        error={invitation.error}
        fallback="The invitation details could not be loaded."
        impact="You cannot accept or decline this invitation yet."
        recovery="Try again after the invitation details reload."
      />
    );
  }
  if (invitation.data.invitation.status !== "pending") {
    return (
      <div className="hl-notification-invitation">
        <StatusBadge>{invitation.data.invitation.status}</StatusBadge>
        {completedMessage && <span>{completedMessage}</span>}
      </div>
    );
  }

  const createsTeam =
    invitation.data.invitation.workflow === "create_team";
  return (
    <div className="hl-notification-invitation">
      <span>
        {createsTeam
          ? `Join ${invitation.data.league.name} and create your team.`
          : `Join ${invitation.data.league.name} as manager of ${invitation.data.team.name}.`}
      </span>
      {createsTeam && (
        <label className="hl-field">
          Team name
          <input
            value={teamName}
            maxLength={80}
            onChange={(event) => setTeamName(event.target.value)}
          />
        </label>
      )}
      <div className="hl-notification-invitation__actions">
        <button
          className="hl-button hl-button--primary"
          type="button"
          disabled={
            action.isPending || (createsTeam && teamName.trim() === "")
          }
          onClick={() => action.mutate("accept")}
        >
          {action.isPending ? "Saving..." : "Accept invitation"}
        </button>
        <button
          className="hl-button hl-button--danger"
          type="button"
          disabled={action.isPending}
          onClick={() => {
            if (
              globalThis.confirm(
                `Decline the invitation to ${invitation.data.league.name}?`
              )
            ) {
              action.mutate("decline");
            }
          }}
        >
          Decline invitation
        </button>
      </div>
      {action.error && (
        <ErrorBlock
          error={action.error}
          fallback="The invitation response could not be saved."
          impact="Your invitation remains unchanged."
          recovery="Review the invitation and try again."
        />
      )}
    </div>
  );
}

export function NotificationsPage() {
  const session = useSession();
  const leagues = useQuery({ ...visibleLeaguesQuery(session.httpClient), enabled: session.status === "authenticated", retry: false });
  const queryClient = useQueryClient();
  const [view, setView] = useState("unread");
  const [cursor, setCursor] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [unreadSnapshots, setUnreadSnapshots] = useState({});
  const acknowledgedBatches = useRef(new Set());
  const pageKey = `${view}:${categoryFilter}:${cursor || "first"}`;
  const notifications = useQuery({
    ...notificationsQuery(session.httpClient, cursor, view, { category: categoryFilter }),
    enabled: session.status === "authenticated",
  });
  const acknowledge = useMutation({
    mutationFn: (notificationIds) =>
      markNotificationsReadBatch(session.httpClient, notificationIds),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications", "read"] }),
  });
  const acknowledgeBatch = acknowledge.mutate;

  if (view === "unread" && notifications.data && !unreadSnapshots[pageKey]) {
    setUnreadSnapshots({
      ...unreadSnapshots,
      [pageKey]: notifications.data,
    });
  }

  const displayedData =
    view === "unread"
      ? unreadSnapshots[pageKey] || notifications.data
      : notifications.data;
  const displayedNotifications = view === "unread" && !cursor && displayedData
    ? [...new Map([
        ...Object.entries(unreadSnapshots).filter(([key]) => key.endsWith(":first")).flatMap(([, page]) => page.notifications),
        ...displayedData.notifications,
      ].filter((notification) => categoryFilter === "all" || notificationCategory(notification.type).tone === categoryFilter)
        .map((notification) => [notification.id, notification])).values()]
      .sort((left, right) => right.createdAtMs - left.createdAtMs || right.id.localeCompare(left.id))
    : displayedData?.notifications || [];

  useEffect(() => {
    if (view !== "unread" || !displayedData?.notifications?.length) return;
    const notificationIds = displayedData.notifications.map(({ id }) => id);
    const signature = notificationIds.join("|");
    if (acknowledgedBatches.current.has(signature)) return;
    acknowledgedBatches.current.add(signature);
    acknowledgeBatch(notificationIds);
  }, [acknowledgeBatch, displayedData, view]);

  if (session.status === "unknown") {
    return (
      <main className="hl-page hl-page--narrow">
        <Surface>
          <LoadingBlock>Checking secure session...</LoadingBlock>
        </Surface>
      </main>
    );
  }
  if (session.status === "unauthenticated") {
    return (
      <Navigate
        to={routePaths.home}
        replace
        state={{ reason: "sign-in" }}
      />
    );
  }

  return (
    <main className="hl-page" aria-labelledby="notifications-title">
      <PageHeading
        eyebrow="Account inbox"
        title="Notifications"
        id="notifications-title"
        actions={
          <div className="hl-segmented-control" aria-label="Notification view">
            <button
              className="hl-button hl-button--secondary"
              type="button"
              aria-pressed={view === "unread"}
              onClick={() => {
                setView("unread");
                setCursor(null);
              }}
            >
              Unread
            </button>
            <button
              className="hl-button hl-button--secondary"
              type="button"
              aria-pressed={view === "read"}
              onClick={() => {
                setView("read");
                setCursor(null);
              }}
            >
              Previous notifications
            </button>
          </div>
        }
      />

      <Surface className="hl-notifications-panel">
        <label className="hl-field hl-compact-filter">Notification type
          <select value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setCursor(null); }}>
            <option value="all">All notifications</option><option value="auction">Auctions</option>
            <option value="trade">Trades</option><option value="league">Leagues and commissioner assignments</option>
            <option value="draft">Drafts</option><option value="account">Account and other updates</option>
          </select>
        </label>
        {notifications.isPending ? (
          <LoadingBlock>Loading notifications...</LoadingBlock>
        ) : notifications.isError ? (
          <ErrorBlock
            error={notifications.error}
            fallback="Notifications could not be loaded."
            impact="Your notifications remain saved, but this list is incomplete."
            recovery="Try this page again in a moment."
          />
        ) : !displayedData || displayedNotifications.length === 0 ? (
          <EmptyBlock
            title={
              view === "unread"
                ? "You're all caught up"
                : "No previous notifications"
            }
          />
        ) : (
          <ul className="hl-notification-list">
            {displayedNotifications.map((notification) => {
              const destination = notificationDestination(notification);
              const baseCategory = notificationCategory(notification.type);
              const leagueName = notification.messageData.leagueName || leagues.data?.find(({ id }) => id === notification.leagueId)?.name;
              const category = { ...baseCategory, label: leagueName ? `${baseCategory.label} · ${leagueName}` : baseCategory.label };
              const fadNotification = isFreeAgentDraftNotificationType(
                notification.type
              );
              const notificationMessage = message(notification);
              const timestamp = (
                <time
                  dateTime={new Date(
                    notification.createdAtMs
                  ).toISOString()}
                >
                  {new Date(notification.createdAtMs).toLocaleString()}
                </time>
              );
              return (
                <li
                  className={`${view === "unread" ? "is-unread " : ""}is-${category.tone}`}
                  key={notification.id}
                >
                  <span
                    className="hl-notification-list__indicator"
                    aria-hidden="true"
                  />
                  {notification.type === "fad_rapid_auction_result" ? (
                    <CompletedAuctionNotification notification={notification} notificationMessage={notificationMessage} timestamp={timestamp} />
                  ) : fadNotification ? (
                    <FadNotificationDestination
                      category={category}
                      notification={notification}
                      notificationMessage={notificationMessage}
                      timestamp={timestamp}
                    />
                  ) : destination ? (
                    <Link
                      className="hl-notification-list__link"
                      to={destination}
                    >
                      <span>
                        <strong>{notificationMessage}</strong>
                        <small className={`hl-notification-category is-${category.tone}`}>
                          {category.label}
                        </small>
                        {timestamp}
                        <small>{notification.type === "commissioner_assignment_proposed" ? "Review and accept commissioner role" : "Open the trade acceptance preview"}</small>
                      </span>
                      <ChevronRight aria-hidden="true" />
                    </Link>
                  ) : (
                    <div>
                      <strong>{notificationMessage}</strong>
                      <small className={`hl-notification-category is-${category.tone}`}>
                        {category.label}
                      </small>
                      {timestamp}
                      {notification.type === "league_invitation_created" && (
                        <LeagueInvitationActions
                          notification={notification}
                          session={session}
                        />
                      )}
                    </div>
                  )}
                  {view === "read" && <StatusBadge>Read</StatusBadge>}
                </li>
              );
            })}
          </ul>
        )}
      </Surface>

      {!notifications.isPending && !notifications.isError && (
        <nav className="hl-pagination" aria-label="Notification pages">
          {displayedData?.page.nextCursor && (
            <button
              className="hl-button hl-button--quiet"
              onClick={() => setCursor(displayedData.page.nextCursor)}
            >
              Next page
            </button>
          )}
          {cursor && (
            <button
              className="hl-button hl-button--quiet"
              onClick={() => setCursor(null)}
            >
              First page
            </button>
          )}
        </nav>
      )}

      {acknowledge.isError && view === "unread" && (
        <div className="hl-form-message is-error" role="alert">
          <span>
            These notifications could not be moved to Previous notifications.
            They are still safe in your unread inbox.
          </span>
          <button
            className="hl-button hl-button--quiet"
            type="button"
            disabled={
              acknowledge.isPending || !acknowledge.variables?.length
            }
            onClick={() => acknowledgeBatch(acknowledge.variables)}
          >
            Try again
          </button>
        </div>
      )}
    </main>
  );
}
