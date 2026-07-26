import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import {
  EmptyBlock,
  LoadingBlock,
  PageHeading,
  StatusBadge,
  Surface,
} from "../../components/HundoUi.jsx";
import { leagueKeys } from "../leagues/leagueQueries.js";
import { useSession } from "../session/sessionContext.js";
import {
  acceptLeagueInvitation,
  declineLeagueInvitation,
  leagueInvitationQuery,
  markAllNotificationsRead,
  markNotificationRead,
  notificationKeys,
  notificationsQuery,
} from "./notificationQueries.js";

function message(notification) {
  if (notification.type === "league_invitation_created") {
    return `Invitation to ${notification.messageData.leagueName}`;
  }
  return (
    notification.messageData.message ||
    notification.messageData.summary ||
    notification.type.replaceAll("_", " ")
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
      <p className="hl-form-message is-error" role="alert">
        {invitation.error.message}
      </p>
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
        <p className="hl-form-message is-error" role="alert">
          {action.error.message}
        </p>
      )}
    </div>
  );
}

export function NotificationsPage() {
  const session = useSession();
  const queryClient = useQueryClient();
  const [cursor, setCursor] = useState(null);
  const notifications = useQuery({
    ...notificationsQuery(session.httpClient, cursor),
    enabled: session.status === "authenticated",
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  const markOne = useMutation({
    mutationFn: (id) => markNotificationRead(session.httpClient, id),
    onSuccess: refresh,
  });
  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(session.httpClient),
    onSuccess: refresh,
  });

  if (session.status === "unknown") {
    return (
      <main className="hl-page hl-page--narrow">
        <Surface>
          <LoadingBlock>Checking secure session…</LoadingBlock>
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

  const mutationError = markOne.error || markAll.error;

  return (
    <main className="hl-page" aria-labelledby="notifications-title">
      <PageHeading
        eyebrow="Account inbox"
        title="Notifications"
        description="Private league and account notices for your signed-in user."
        id="notifications-title"
        actions={
          <button
            className="hl-button hl-button--secondary"
            disabled={markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            Mark all read
          </button>
        }
      />

      <Surface className="hl-notifications-panel">
        {notifications.isPending ? (
          <LoadingBlock>Loading notifications…</LoadingBlock>
        ) : notifications.isError ? (
          <p className="hl-form-message is-error" role="alert">
            {notifications.error.message}
          </p>
        ) : notifications.data.notifications.length === 0 ? (
          <EmptyBlock title="No notifications on this page" />
        ) : (
          <ul className="hl-notification-list">
            {notifications.data.notifications.map((notification) => (
              <li
                className={notification.readAtMs === null ? "is-unread" : ""}
                key={notification.id}
              >
                <span className="hl-notification-list__indicator" aria-hidden="true" />
                <div>
                  <strong>{message(notification)}</strong>
                  <time dateTime={new Date(notification.createdAtMs).toISOString()}>
                    {new Date(notification.createdAtMs).toLocaleString()}
                  </time>
                  {notification.type === "league_invitation_created" && (
                    <LeagueInvitationActions
                      notification={notification}
                      session={session}
                    />
                  )}
                </div>
                {notification.readAtMs === null ? (
                  <button
                    className="hl-button hl-button--quiet"
                    disabled={markOne.isPending}
                    onClick={() => markOne.mutate(notification.id)}
                  >
                    Mark read
                  </button>
                ) : (
                  <StatusBadge>Read</StatusBadge>
                )}
              </li>
            ))}
          </ul>
        )}
      </Surface>

      {!notifications.isPending && !notifications.isError && (
        <nav className="hl-pagination" aria-label="Notification pages">
          {notifications.data.page.nextCursor && (
            <button
              className="hl-button hl-button--quiet"
              onClick={() => setCursor(notifications.data.page.nextCursor)}
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

      {mutationError && (
        <p className="hl-form-message is-error" role="alert">
          {mutationError.message}
        </p>
      )}
    </main>
  );
}
