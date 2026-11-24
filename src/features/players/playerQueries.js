import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { ResponseContractError } from "../../shared/api/responseContracts.js";
import {
  validateLeaguePlayerDetail,
  validateLeaguePlayerList,
  validatePlayerDetail,
  validatePlayerList,
} from "./playerContracts.js";

const part = (value) => encodeURIComponent(value);

function periodParameters({ statsPeriod = "season", startDate, endDate, lastGames } = {}) {
  if (statsPeriod === "dateRange") return { statsPeriod, startDate, endDate };
  if (statsPeriod === "lastGames") return { statsPeriod, lastGames: String(lastGames) };
  return {};
}

function validateRequestedPeriod(player, period) {
  if (!period.statsPeriod || period.statsPeriod === "season" || player.statistics === null) return;
  const received = player.statistics?.period;
  if (received?.mode !== period.statsPeriod ||
    (period.statsPeriod === "dateRange" && (received.startDate !== period.startDate || received.endDate !== period.endDate)) ||
    (period.statsPeriod === "lastGames" && received.lastGames !== Number(period.lastGames))) {
    throw new ResponseContractError("The player statistics do not match the requested period.");
  }
}

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
    minimumAavCents,
    maximumAavCents,
    remainingYears,
    contractType,
    statsPeriod,
    startDate,
    endDate,
    lastGames,
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
    minimumAavCents,
    maximumAavCents,
    remainingYears,
    contractType,
    statsPeriod,
    startDate,
    endDate,
    lastGames,
  ],
  leagueDetail: (leagueId, playerId, period = {}) => [
    "league",
    leagueId,
    "players",
    "detail",
    playerId,
    ...(Object.keys(periodParameters(period)).length ? [periodParameters(period)] : []),
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
    minimumAavCents = null,
    maximumAavCents = null,
    remainingYears = null,
    contractType = "all",
    statsPeriod = "season",
    startDate = null,
    endDate = null,
    lastGames = null,
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
      minimumAavCents,
      maximumAavCents,
      remainingYears,
      contractType,
      statsPeriod,
      startDate,
      endDate,
      lastGames,
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
        ...(minimumAavCents !== null ? { minimumAavCents: String(minimumAavCents) } : {}),
        ...(maximumAavCents !== null ? { maximumAavCents: String(maximumAavCents) } : {}),
        ...(remainingYears !== null ? { remainingYears: String(remainingYears) } : {}),
        ...(contractType !== "all" ? { contractType } : {}),
        ...(minimumGames > 0
          ? { minimumGames: String(minimumGames) }
          : {}),
        ...(pageParam ? { cursor: pageParam } : {}),
        ...periodParameters({ statsPeriod, startDate, endDate, lastGames }),
      });
      const response = await httpClient.request(
        `/api/v1/leagues/${part(leagueId)}/players?${search.toString()}`,
        {
          authenticated: true,
          dataKind: "array",
          validateData: (data) => {
            validateLeaguePlayerList(data, leagueId);
            for (const player of data) validateRequestedPeriod(player, { statsPeriod, startDate, endDate, lastGames });
            return true;
          },
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
  playerId,
  period = {}
) {
  const search = new URLSearchParams(periodParameters(period)).toString();
  return queryOptions({
    queryKey: playerKeys.leagueDetail(leagueId, playerId, period),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(
        `/api/v1/leagues/${part(leagueId)}/players/${part(playerId)}${search ? `?${search}` : ""}`,
        {
          authenticated: true,
          dataKind: "object",
          validateData: (data) => {
            validateLeaguePlayerDetail(data, leagueId);
            validateRequestedPeriod(data, period);
            return true;
          },
          signal,
        }
      );
      return response.data;
    },
    meta: { private: true, leagueId },
    staleTime: 5 * 60_000,
  });
}
