import { queryOptions } from "@tanstack/react-query";

import {
  validateLeagueDetail,
  validateLeagueList,
  validateLeagueSeasonList,
  validateMembershipList,
  validateInvitableUsers,
  validateAdminUsers,
  validateTeamDetail,
  validateTeamList,
} from "./leagueContracts.js";

export const leagueKeys = Object.freeze({
  all: ["leagues"],
  detail: (leagueId) => ["league", leagueId],
  seasons: (leagueId) => ["league", leagueId, "seasons"],
  teams: (leagueId) => ["league", leagueId, "teams"],
  team: (leagueId, teamId) => ["league", leagueId, "team", teamId],
  memberships: (leagueId) => ["league", leagueId, "memberships"],
  invitableUsers: (leagueId) => ["league", leagueId, "invitable-users"],
  adminUsers: ["admin", "users"],
});

export function visibleLeaguesQuery(httpClient) {
  return queryOptions({
    queryKey: leagueKeys.all,
    queryFn: async ({ signal }) => {
      const response = await httpClient.request("/api/v1/leagues", {
        authenticated: true,
        dataKind: "object",
        validateData: validateLeagueList,
        signal,
      });
      return response.data.leagues;
    },
    meta: { private: true },
    staleTime: 30_000,
  });
}

export function leagueMembershipsQuery(httpClient, leagueId) {
  return queryOptions({
    queryKey: leagueKeys.memberships(leagueId),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(
        `/api/v1/leagues/${encodeURIComponent(leagueId)}/memberships`,
        {
          authenticated: true,
          dataKind: "object",
          validateData: validateMembershipList,
          signal,
        }
      );
      return response.data.memberships;
    },
    meta: { private: true, leagueId },
    staleTime: 10_000,
  });
}

export function invitableUsersQuery(httpClient, leagueId) {
  return queryOptions({
    queryKey: leagueKeys.invitableUsers(leagueId),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(
        `/api/v1/leagues/${encodeURIComponent(leagueId)}/invitable-users`,
        {
          authenticated: true,
          dataKind: "object",
          validateData: validateInvitableUsers,
          signal,
        }
      );
      return response.data.users;
    },
    meta: { private: true, leagueId },
    staleTime: 10_000,
  });
}

export function adminUsersQuery(httpClient) {
  return queryOptions({
    queryKey: leagueKeys.adminUsers,
    queryFn: async ({ signal }) => {
      const response = await httpClient.request("/api/v1/admin/users", {
        authenticated: true,
        dataKind: "object",
        validateData: validateAdminUsers,
        signal,
      });
      return response.data.users;
    },
    meta: { private: true },
    staleTime: 30_000,
  });
}

export async function inviteLeagueUser(
  httpClient,
  leagueId,
  input,
  idempotencyKey
) {
  return (
    await httpClient.request(
      `/api/v1/leagues/${encodeURIComponent(leagueId)}/invitations`,
      {
        method: "POST",
        authenticated: true,
        body: input,
        idempotencyKey,
        dataKind: "object",
      }
    )
  ).data;
}

export async function removeLeagueMembership(
  httpClient,
  leagueId,
  membershipId,
  expectedVersion
) {
  return (
    await httpClient.request(
      `/api/v1/leagues/${encodeURIComponent(
        leagueId
      )}/memberships/${encodeURIComponent(membershipId)}`,
      {
        method: "DELETE",
        authenticated: true,
        body: { confirmed: true, expectedVersion },
        dataKind: "object",
      }
    )
  ).data;
}

export async function removeTeamManagerAssignment(
  httpClient,
  leagueId,
  teamId,
  assignmentId,
  expectedVersion,
  idempotencyKey
) {
  return (
    await httpClient.request(
      `/api/v1/leagues/${encodeURIComponent(
        leagueId
      )}/teams/${encodeURIComponent(teamId)}/manager-assignment`,
      {
        method: "DELETE",
        authenticated: true,
        body: { assignmentId },
        version: expectedVersion,
        idempotencyKey,
        dataKind: "object",
      }
    )
  ).data;
}

export async function createLeague(
  httpClient,
  name,
  idempotencyKey
) {
  return (
    await httpClient.request("/api/v1/admin/leagues", {
      method: "POST",
      authenticated: true,
      body: { name },
      idempotencyKey,
      dataKind: "object",
    })
  ).data;
}

export async function assignLeagueCommissioner(
  httpClient,
  leagueId,
  userId,
  idempotencyKey
) {
  return (
    await httpClient.request(
      `/api/v1/admin/leagues/${encodeURIComponent(
        leagueId
      )}/commissioner-assignments`,
      {
        method: "POST",
        authenticated: true,
        body: { userId },
        idempotencyKey,
        dataKind: "object",
      }
    )
  ).data;
}

export function leagueDetailQuery(httpClient, leagueId) {
  return queryOptions({
    queryKey: leagueKeys.detail(leagueId),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(`/api/v1/leagues/${leagueId}`, {
        authenticated: true,
        dataKind: "object",
        validateData: validateLeagueDetail,
        signal,
      });
      return response.data.league;
    },
    meta: { private: true, leagueId },
    staleTime: 15_000,
  });
}

export function leagueSeasonsQuery(httpClient, leagueId) {
  return queryOptions({
    queryKey: leagueKeys.seasons(leagueId),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(
        `/api/v1/leagues/${encodeURIComponent(leagueId)}/seasons`,
        {
          authenticated: true,
          dataKind: "object",
          validateData: (data) =>
            validateLeagueSeasonList(data, leagueId),
          signal,
        }
      );
      return response.data.seasons;
    },
    meta: { private: true, leagueId },
    staleTime: 5 * 60_000,
  });
}

export function leagueTeamsQuery(httpClient, leagueId) {
  return queryOptions({
    queryKey: leagueKeys.teams(leagueId),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(
        `/api/v1/leagues/${leagueId}/teams`,
        {
          authenticated: true,
          dataKind: "object",
          validateData: validateTeamList,
          signal,
        }
      );
      return response.data.teams;
    },
    meta: { private: true, leagueId },
    staleTime: 15_000,
  });
}

export function teamDetailQuery(httpClient, leagueId, teamId) {
  return queryOptions({
    queryKey: leagueKeys.team(leagueId, teamId),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(
        `/api/v1/leagues/${leagueId}/teams/${teamId}`,
        {
          authenticated: true,
          dataKind: "object",
          validateData: validateTeamDetail,
          signal,
        }
      );
      return response.data.team;
    },
    meta: { private: true, leagueId },
    staleTime: 15_000,
  });
}

export function removeInaccessibleLeagueQueries(queryClient, authorizedIds) {
  const allowed = new Set(authorizedIds);
  queryClient.removeQueries({
    predicate: (query) =>
      query.meta?.private === true &&
      typeof query.meta?.leagueId === "string" &&
      !allowed.has(query.meta.leagueId),
  });
}
