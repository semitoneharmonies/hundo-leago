import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { ResponseContractError } from "../../shared/api/responseContracts.js";
import {
  validateLeaguePlayerDetail,
  validateLeaguePlayerList,
  validatePlayerDetail,
  validatePlayerList,
} from "./playerContracts.js";

const part = (value) => encodeURIComponent(value);

export const playerKeys = Object.freeze({
  searches: ["players", "search"],
  search: ({
    query,
    status,
    limit,
    cursor,
    leagueId,
    auctionEligible,
  }) => [
    "players",
    "search",
    query,
    status,
    limit,
    cursor,
    leagueId,
    auctionEligible,
  ],
  detail: (playerId) => ["players", "detail", playerId],
  leagueSearch: ({ leagueId, query, status, limit, cursor, sort }) => [
    "league",
    leagueId,
    "players",
    "search",
    query,
    status,
    limit,
    cursor,
    sort,
  ],
  leagueInfinite: ({
    leagueId,
    query,
    status,
    limit,
    sort,
    teamId,
    position,
    nhlTeam,
    ownership,
    minimumGames,
  }) => [
    "league",
    leagueId,
    "players",
    "infinite",
    query,
    status,
    limit,
    sort,
    teamId,
    position,
    nhlTeam,
    ownership,
    minimumGames,
  ],
  leagueDetail: (leagueId, playerId) => [
    "league",
    leagueId,
    "players",
    "detail",
    playerId,
  ],
});

export function playerSearchQuery(
  httpClient,
  {
    query = "",
    status = "active",
    limit = 25,
    cursor = null,
    leagueId = null,
    auctionEligible = false,
  } = {}
) {
  const search = new URLSearchParams({
    query,
    status,
    limit: String(limit),
    ...(cursor ? { cursor } : {}),
    ...(auctionEligible
      ? { leagueId, auctionEligible: "true" }
      : {}),
  });
  return queryOptions({
    queryKey: playerKeys.search({
      query,
      status,
      limit,
      cursor,
      leagueId,
      auctionEligible,
    }),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(
        `/api/v1/players?${search.toString()}`,
        {
          authenticated: true,
          dataKind: "array",
          validateData: validatePlayerList,
          signal,
        }
      );
      if (!response.page) {
        throw new ResponseContractError("The player page is missing.");
      }
      return Object.freeze({
        players: response.data,
        page: response.page,
      });
    },
    meta: { private: true },
    staleTime: 60_000,
  });
}

export function playerDetailQuery(httpClient, playerId) {
  return queryOptions({
    queryKey: playerKeys.detail(playerId),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(
        `/api/v1/players/${part(playerId)}`,
        {
          authenticated: true,
          dataKind: "object",
          validateData: validatePlayerDetail,
          signal,
        }
      );
      return response.data;
    },
    meta: { private: true },
    staleTime: 5 * 60_000,
  });
}

export function leaguePlayerSearchQuery(
  httpClient,
  leagueId,
  {
    query = "",
    status = "active",
    limit = 25,
    cursor = null,
    sort = "name",
  } = {}
) {
  const search = new URLSearchParams({
    query,
    status,
    limit: String(limit),
    sort,
    ...(cursor ? { cursor } : {}),
  });
  return queryOptions({
    queryKey: playerKeys.leagueSearch({
      leagueId,
      query,
      status,
      limit,
      cursor,
      sort,
    }),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(
        `/api/v1/leagues/${part(leagueId)}/players?${search.toString()}`,
        {
          authenticated: true,
          dataKind: "array",
          validateData: (data) =>
            validateLeaguePlayerList(data, leagueId),
          signal,
        }
      );
      if (!response.page) {
        throw new ResponseContractError("The player page is missing.");
      }
      return Object.freeze({
        players: response.data,
        page: response.page,
      });
    },
    meta: { private: true, leagueId },
    staleTime: 60_000,
  });
}

export function leaguePlayerInfiniteQuery(
  httpClient,
  leagueId,
  {
    query = "",
    status = "active",
    limit = 100,
    sort = "fantasyPoints",
    teamId = null,
    position = null,
    nhlTeam = null,
    ownership = "all",
    minimumGames = 0,
  } = {}
) {
  return infiniteQueryOptions({
    queryKey: playerKeys.leagueInfinite({
      leagueId,
      query,
      status,
      limit,
      sort,
      teamId,
      position,
      nhlTeam,
      ownership,
      minimumGames,
    }),
    initialPageParam: null,
    queryFn: async ({ pageParam, signal }) => {
      const search = new URLSearchParams({
        query,
        status,
        limit: String(limit),
        sort,
        ...(teamId ? { teamId } : {}),
        ...(position ? { position } : {}),
        ...(nhlTeam ? { nhlTeam } : {}),
        ...(ownership !== "all" ? { ownership } : {}),
        ...(minimumGames > 0
          ? { minimumGames: String(minimumGames) }
          : {}),
        ...(pageParam ? { cursor: pageParam } : {}),
      });
      const response = await httpClient.request(
        `/api/v1/leagues/${part(leagueId)}/players?${search.toString()}`,
        {
          authenticated: true,
          dataKind: "array",
          validateData: (data) =>
            validateLeaguePlayerList(data, leagueId),
          signal,
        }
      );
      if (!response.page) {
        throw new ResponseContractError("The player page is missing.");
      }
      return Object.freeze({
        players: response.data,
        page: response.page,
      });
    },
    getNextPageParam: (lastPage) =>
      lastPage.page.hasMore ? lastPage.page.nextCursor : undefined,
    meta: { private: true, leagueId },
    staleTime: 60_000,
  });
}

export function leaguePlayerDetailQuery(
  httpClient,
  leagueId,
  playerId
) {
  return queryOptions({
    queryKey: playerKeys.leagueDetail(leagueId, playerId),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(
        `/api/v1/leagues/${part(leagueId)}/players/${part(playerId)}`,
        {
          authenticated: true,
          dataKind: "object",
          validateData: (data) =>
            validateLeaguePlayerDetail(data, leagueId),
          signal,
        }
      );
      return response.data;
    },
    meta: { private: true, leagueId },
    staleTime: 5 * 60_000,
  });
}
