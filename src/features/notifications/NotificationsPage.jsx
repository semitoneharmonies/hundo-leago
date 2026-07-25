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
import { useSession } from "../session/sessionContext.js";
import {
  markAllNotificationsRead,
  markNotificationRead,
  notificationKeys,
  notificationsQuery,
} from "./notificationQueries.js";

function message(notification) {
  return (
    notification.messageData.message ||
    notification.messageData.summary ||
    notification.type.replaceAll("_", " ")
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
