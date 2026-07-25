import { queryOptions } from "@tanstack/react-query";

import { ResponseContractError } from "../../shared/api/responseContracts.js";
import {
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
