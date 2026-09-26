import { queryOptions } from "@tanstack/react-query";

import {
  validateAcceptancePreview,
  validateDraftTradePreview,
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
  activity: (leagueId, category = "all", cursor = null) => [
    "league",
    leagueId,
    "activity",
    category,
    cursor,
  ],
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

export function activityQuery(
  httpClient,
  leagueId,
  cursor = null,
  category = "all"
) {
  const query = new URLSearchParams({ limit: "25", category });
  if (cursor) query.set("cursor", cursor);
  return queryOptions({
    queryKey: transactionKeys.activity(leagueId, category, cursor),
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

export async function previewDraftTrade(httpClient, leagueId, input, signal) {
  return (await httpClient.request(`/api/v1/leagues/${part(leagueId)}/trades/preview`, {
    method: "POST", body: input, signal, authenticated: true, dataKind: "object", validateData: validateDraftTradePreview,
  })).data;
}

export function draftTradePreviewQuery(httpClient, leagueId, userId, body) {
  return {
    queryKey: ["league", leagueId, "trade-draft-preview", userId, body ? JSON.stringify(body) : null],
    queryFn: async ({ signal }) => {
      const result = await previewDraftTrade(httpClient, leagueId, body, signal);
      const ids = body.participants?.map(p => p.teamId) || [body.proposingTeamId, body.receivingTeamId];
      const returned = new Set(result.teams.map(team => team.teamId));
      if (result.leagueId !== leagueId || result.teams.length !== ids.length || returned.size !== ids.length || ids.some(id => !returned.has(id))) throw new Error("The impact preview does not match the selected teams.");
      return result;
    },
    enabled: Boolean(body && userId), staleTime: 0, retry: false,
    meta: { private: true, leagueId },
  };
}

export async function previewTradeAcceptance(httpClient, leagueId, tradeId, respondingTeamId) {
  return (await httpClient.request(
    `/api/v1/leagues/${part(leagueId)}/trades/${part(tradeId)}/acceptance-preview${respondingTeamId ? `?respondingTeamId=${part(respondingTeamId)}` : ""}`,
    { authenticated: true, dataKind: "object", validateData: validateAcceptancePreview }
  )).data;
}

export async function counterTrade(httpClient, leagueId, tradeId, input, idempotencyKey) {
  return (await httpClient.request(
    `/api/v1/leagues/${part(leagueId)}/trades/${part(tradeId)}/counter`,
    { method: "POST", body: input, authenticated: true, idempotencyKey, dataKind: "object" }
  )).data;
}

async function emptyTradeCommand(httpClient, leagueId, tradeId, action, idempotencyKey, respondingTeamId) {
  return (await httpClient.request(
    `/api/v1/leagues/${part(leagueId)}/trades/${part(tradeId)}/${action}`,
    { method: "POST", body: respondingTeamId ? { respondingTeamId } : {}, authenticated: true, idempotencyKey, dataKind: "object" }
  )).data;
}

export const acceptTrade = (client, leagueId, tradeId, key, teamId) =>
  emptyTradeCommand(client, leagueId, tradeId, "accept", key, teamId);
export const acknowledgeTrade = (client, leagueId, tradeId, key, teamId) =>
  emptyTradeCommand(client, leagueId, tradeId, "acknowledge", key, teamId);
export const approveTrade = (client, leagueId, tradeId, key) =>
  emptyTradeCommand(client, leagueId, tradeId, "approve", key);
export const declineTrade = (client, leagueId, tradeId, key, teamId) =>
  emptyTradeCommand(client, leagueId, tradeId, "decline", key, teamId);
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
