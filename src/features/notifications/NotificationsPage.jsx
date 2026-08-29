import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  PageHeading,
  StatusBadge,
  Surface,
} from "../../components/HundoUi.jsx";
import { leagueKeys } from "../leagues/leagueQueries.js";
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
  return (
    notification.messageData.message ||
    notification.messageData.summary ||
    "Other notification"
  );
}

function notificationDestination(notification) {
  if (notification.type !== "trade_proposal_received") return null;
  return routePaths.tradeAcceptance(
    notification.messageData.leagueId,
    notification.messageData.tradeId
  );
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
  const queryClient = useQueryClient();
  const [view, setView] = useState("unread");
  const [cursor, setCursor] = useState(null);
  const [unreadSnapshots, setUnreadSnapshots] = useState({});
  const acknowledgedBatches = useRef(new Set());
  const pageKey = `${view}:${cursor || "first"}`;
  const notifications = useQuery({
    ...notificationsQuery(session.httpClient, cursor, view),
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
        {notifications.isPending ? (
          <LoadingBlock>Loading notifications...</LoadingBlock>
        ) : notifications.isError ? (
          <ErrorBlock
            error={notifications.error}
            fallback="Notifications could not be loaded."
            impact="Your notifications remain saved, but this list is incomplete."
            recovery="Try this page again in a moment."
          />
        ) : !displayedData || displayedData.notifications.length === 0 ? (
          <EmptyBlock
            title={
              view === "unread"
                ? "You're all caught up"
                : "No previous notifications"
            }
          />
        ) : (
          <ul className="hl-notification-list">
            {displayedData.notifications.map((notification) => {
              const destination = notificationDestination(notification);
              const category = notificationCategory(notification.type);
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
                  {fadNotification ? (
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
                        <small>Open the trade acceptance preview</small>
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
