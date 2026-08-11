import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import {
  getAuction,
  listAuctions,
  normalizeAuctionFilters,
} from "./auctionApi.js";

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function identifier(value, description) {
  if (typeof value !== "string" || !UUID_V4.test(value)) {
    throw new TypeError(`${description} is invalid.`);
  }
  return value;
}

function meta(leagueId) {
  return Object.freeze({ private: true, leagueId });
}

export const auctionKeys = Object.freeze({
  root: (leagueId) => ["league", leagueId, "auctions"],
  list: (leagueId, filters) => ["league", leagueId, "auctions", filters],
  detail: (leagueId, auctionId) => [
    "league",
    leagueId,
    "auctions",
    "detail",
    auctionId,
  ],
});

export function auctionListQuery(httpClient, leagueId, filterInput = {}) {
  identifier(leagueId, "League ID");
  const filters = normalizeAuctionFilters(filterInput);
  return infiniteQueryOptions({
    queryKey: auctionKeys.list(leagueId, filters),
    initialPageParam: null,
    queryFn: ({ pageParam, signal }) =>
      listAuctions(httpClient, leagueId, {
        ...filters,
        cursor: pageParam,
        signal,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.page.hasMore ? lastPage.page.nextCursor : undefined,
    meta: meta(leagueId),
    staleTime: 5_000,
  });
}

export function auctionDetailQuery(httpClient, leagueId, auctionId) {
  identifier(leagueId, "League ID");
  identifier(auctionId, "Auction ID");
  return queryOptions({
    queryKey: auctionKeys.detail(leagueId, auctionId),
    queryFn: ({ signal }) => getAuction(httpClient, leagueId, auctionId, { signal }),
    meta: meta(leagueId),
    staleTime: 5_000,
  });
}
