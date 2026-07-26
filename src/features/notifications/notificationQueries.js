import { queryOptions } from "@tanstack/react-query";

import {
  validateLeagueInvitation,
  validateNotifications,
} from "./notificationContracts.js";

export const notificationKeys = Object.freeze({
  all: ["notifications"],
  page: (cursor = null) => ["notifications", cursor],
  invitation: (invitationId) => ["notifications", "league-invitation", invitationId],
});

export function notificationsQuery(httpClient, cursor = null) {
  const query = new URLSearchParams({ limit: "25" });
  if (cursor) query.set("cursor", cursor);
  return queryOptions({
    queryKey: notificationKeys.page(cursor),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(`/api/v1/notifications?${query}`, {
        authenticated: true,
        dataKind: "object",
        validateData: validateNotifications,
        signal,
      });
      return response.data;
    },
    meta: { private: true },
    staleTime: 10_000,
  });
}

export async function markNotificationRead(httpClient, notificationId) {
  return (await httpClient.request(
    `/api/v1/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: "POST", body: {}, authenticated: true, dataKind: "object" }
  )).data;
}

export async function markAllNotificationsRead(httpClient) {
  return (await httpClient.request("/api/v1/notifications/read-all", {
    method: "POST", body: {}, authenticated: true, dataKind: "object",
  })).data;
}

export function leagueInvitationQuery(httpClient, invitationId) {
  return queryOptions({
    queryKey: notificationKeys.invitation(invitationId),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(
        `/api/v1/league-invitations/${encodeURIComponent(invitationId)}`,
        {
          authenticated: true,
          dataKind: "object",
          validateData: validateLeagueInvitation,
          signal,
        }
      );
      return response.data;
    },
    meta: { private: true },
    staleTime: 5_000,
  });
}

export async function acceptLeagueInvitation(
  httpClient,
  invitationId,
  body = {}
) {
  const response = await httpClient.request(
    `/api/v1/league-invitations/${encodeURIComponent(invitationId)}/accept`,
    {
      method: "POST",
      body,
      authenticated: true,
      dataKind: "object",
      validateData: validateLeagueInvitation,
    }
  );
  return response.data;
}

export async function declineLeagueInvitation(httpClient, invitationId) {
  const response = await httpClient.request(
    `/api/v1/league-invitations/${encodeURIComponent(invitationId)}/decline`,
    {
      method: "POST",
      body: {},
      authenticated: true,
      dataKind: "object",
      validateData: validateLeagueInvitation,
    }
  );
  return response.data;
}
