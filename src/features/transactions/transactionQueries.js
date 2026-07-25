import { queryOptions } from "@tanstack/react-query";

import {
  validateAcceptancePreview,
  validateActivityPage,
  validateAuctionDetail,
  validateAuctionList,
  validateReversalPreview,
  validateTradeDetail,
  validateTradeList,
} from "./transactionContracts.js";

const part = (value) => encodeURIComponent(value);

export const transactionKeys = Object.freeze({
  auctions: (leagueId) => ["league", leagueId, "auctions"],
  auction: (leagueId, auctionId) => ["league", leagueId, "auction", auctionId],
  trades: (leagueId) => ["league", leagueId, "trades"],
  trade: (leagueId, tradeId) => ["league", leagueId, "trade", tradeId],
  activity: (leagueId, cursor = null) => ["league", leagueId, "activity", cursor],
});

export function auctionsQuery(httpClient, leagueId) {
  return queryOptions({
    queryKey: transactionKeys.auctions(leagueId),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(`/api/v1/leagues/${part(leagueId)}/auctions`, {
        authenticated: true,
        dataKind: "object",
        validateData: validateAuctionList,
        signal,
      });
      return response.data.auctions;
    },
    meta: { private: true, leagueId },
    staleTime: 10_000,
  });
}

export function auctionQuery(httpClient, leagueId, auctionId) {
  return queryOptions({
    queryKey: transactionKeys.auction(leagueId, auctionId),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(
        `/api/v1/leagues/${part(leagueId)}/auctions/${part(auctionId)}`,
        { authenticated: true, dataKind: "object", validateData: validateAuctionDetail, signal }
      );
      return response.data.auction;
    },
    meta: { private: true, leagueId },
  });
}

export function tradesQuery(httpClient, leagueId) {
  return queryOptions({
    queryKey: transactionKeys.trades(leagueId),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(`/api/v1/leagues/${part(leagueId)}/trades`, {
        authenticated: true,
        dataKind: "object",
        validateData: validateTradeList,
        signal,
      });
      return response.data.proposals;
    },
    meta: { private: true, leagueId },
    staleTime: 10_000,
  });
}

export function tradeQuery(httpClient, leagueId, tradeId) {
  return queryOptions({
    queryKey: transactionKeys.trade(leagueId, tradeId),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(
        `/api/v1/leagues/${part(leagueId)}/trades/${part(tradeId)}`,
        { authenticated: true, dataKind: "object", validateData: validateTradeDetail, signal }
      );
      return response.data.proposal;
    },
    meta: { private: true, leagueId },
  });
}

export function activityQuery(httpClient, leagueId, cursor = null) {
  const query = new URLSearchParams({ limit: "25" });
  if (cursor) query.set("cursor", cursor);
  return queryOptions({
    queryKey: transactionKeys.activity(leagueId, cursor),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(
        `/api/v1/leagues/${part(leagueId)}/activity?${query}`,
        { authenticated: true, dataKind: "object", validateData: validateActivityPage, signal }
      );
      return response.data;
    },
    meta: { private: true, leagueId },
    staleTime: 10_000,
  });
}

export async function startAuction(httpClient, leagueId, input, idempotencyKey) {
  return (await httpClient.request(`/api/v1/leagues/${part(leagueId)}/auctions`, {
    method: "POST", body: input, authenticated: true, idempotencyKey, dataKind: "object",
  })).data;
}

export async function putOwnBid(httpClient, leagueId, auctionId, input, { version, idempotencyKey }) {
  return (await httpClient.request(
    `/api/v1/leagues/${part(leagueId)}/auctions/${part(auctionId)}/bids/mine`,
    { method: "PUT", body: input, authenticated: true, version, idempotencyKey, dataKind: "object" }
  )).data;
}

export async function createTrade(httpClient, leagueId, input, idempotencyKey) {
  return (await httpClient.request(`/api/v1/leagues/${part(leagueId)}/trades`, {
    method: "POST", body: input, authenticated: true, idempotencyKey, dataKind: "object",
  })).data;
}

export async function previewTradeAcceptance(httpClient, leagueId, tradeId) {
  return (await httpClient.request(
    `/api/v1/leagues/${part(leagueId)}/trades/${part(tradeId)}/acceptance-preview`,
    { authenticated: true, dataKind: "object", validateData: validateAcceptancePreview }
  )).data;
}

async function emptyTradeCommand(httpClient, leagueId, tradeId, action, idempotencyKey) {
  return (await httpClient.request(
    `/api/v1/leagues/${part(leagueId)}/trades/${part(tradeId)}/${action}`,
    { method: "POST", body: {}, authenticated: true, idempotencyKey, dataKind: "object" }
  )).data;
}

export const acceptTrade = (client, leagueId, tradeId, key) =>
  emptyTradeCommand(client, leagueId, tradeId, "accept", key);
export const declineTrade = (client, leagueId, tradeId, key) =>
  emptyTradeCommand(client, leagueId, tradeId, "decline", key);
export const cancelTrade = (client, leagueId, tradeId, key) =>
  emptyTradeCommand(client, leagueId, tradeId, "cancel", key);

export async function previewTradeReversal(httpClient, leagueId, tradeId) {
  return (await httpClient.request(
    `/api/v1/leagues/${part(leagueId)}/trades/${part(tradeId)}/reversal-preview`,
    { authenticated: true, dataKind: "object", validateData: validateReversalPreview }
  )).data;
}

export async function recoverTrade(httpClient, leagueId, tradeId, action, idempotencyKey) {
  return (await httpClient.request(
    `/api/v1/leagues/${part(leagueId)}/trades/${part(tradeId)}/${part(action)}`,
    { method: "POST", body: { confirmed: true }, authenticated: true, idempotencyKey, dataKind: "object" }
  )).data;
}
