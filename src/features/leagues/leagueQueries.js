import { queryOptions } from "@tanstack/react-query";

import {
  validateLeagueDetail,
  validateLeagueList,
  validateLeagueSeasonList,
  validateTeamDetail,
  validateTeamList,
} from "./leagueContracts.js";

export const leagueKeys = Object.freeze({
  all: ["leagues"],
  detail: (leagueId) => ["league", leagueId],
  seasons: (leagueId) => ["league", leagueId, "seasons"],
  teams: (leagueId) => ["league", leagueId, "teams"],
  team: (leagueId, teamId) => ["league", leagueId, "team", teamId],
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
