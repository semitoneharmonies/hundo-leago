import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { ResponseContractError } from "../../shared/api/responseContracts.js";

export const quoteRotationKey = (leagueId) => ["league", leagueId, "quotes"];
const reviewPath = (leagueId, global) => global ? "/api/v1/admin/quote-submissions" : `/api/v1/leagues/${encodeURIComponent(leagueId)}/quote-submissions`;
function validateQuote(item, reviewing) {
  if (!item || typeof item.id !== "string" || typeof item.text !== "string" || !item.text.trim() || item.text.length > 500 ||
    typeof item.author !== "string" || !item.author.trim() || item.author.length > 80 ||
    !(reviewing ? ["pending", "league", "global"] : ["league", "global"]).includes(item.scope) ||
    (reviewing && (!Number.isSafeInteger(item.version) || item.version < 1))) {
    throw new ResponseContractError("The quote could not be read.");
  }
}
async function readPage(client, path, cursor, signal, reviewing) {
  const params = new URLSearchParams({ limit: reviewing ? "10" : "100" });
  if (cursor) params.set("cursor", cursor);
  return (await client.request(`${path}?${params}`, { authenticated: true, dataKind: "object", signal,
    validateData(data) {
      if (data?.code !== "QUOTES_FOUND" || !Array.isArray(data.quotes) || !data.page ||
        !(data.page.nextCursor === null || typeof data.page.nextCursor === "string")) throw new ResponseContractError("The quotes could not be read.");
      data.quotes.forEach((item) => validateQuote(item, reviewing));
    } })).data;
}
export function quoteRotationQuery(client, leagueId) {
  return queryOptions({ queryKey: quoteRotationKey(leagueId), enabled: Boolean(leagueId),
    meta: { private: true, leagueId }, staleTime: 15_000, refetchInterval: 30_000,
    queryFn: async ({ signal }) => {
      const items = [];
      const seen = new Set();
      let cursor = null;
      do {
        const page = await readPage(client, `/api/v1/leagues/${encodeURIComponent(leagueId)}/quotes`, cursor, signal, false);
        items.push(...page.quotes);
        cursor = page.page.nextCursor;
        if (cursor && seen.has(cursor)) throw new ResponseContractError("The quote list could not be completed.");
        if (cursor) seen.add(cursor);
      } while (cursor);
      return items;
    } });
}
export function quoteReviewQuery(client, leagueId, global) {
  return infiniteQueryOptions({ queryKey: global ? ["quote-review", "global"] : ["league", leagueId, "quote-review"],
    initialPageParam: null, meta: { private: true, leagueId: global ? null : leagueId },
    queryFn: ({ signal, pageParam }) => readPage(client, reviewPath(leagueId, global), pageParam, signal, true),
    getNextPageParam: (page) => page.page.nextCursor ?? undefined, staleTime: 0 });
}
export async function submitQuote(client, leagueId, input, idempotencyKey) {
  return (await client.request(`/api/v1/leagues/${encodeURIComponent(leagueId)}/quotes`, {
    method: "POST", authenticated: true, dataKind: "object", body: input, idempotencyKey,
    validateData(data) { if (data?.code !== "QUOTE_SUBMITTED") throw new ResponseContractError("The quote submission was not confirmed."); validateQuote(data.quote, true); },
  })).data;
}
export async function reviewQuote(client, leagueId, global, item, decision, idempotencyKey) {
  return (await client.request(`${reviewPath(leagueId, global)}/${encodeURIComponent(item.id)}/review`, {
    method: "POST", authenticated: true, dataKind: "object", body: { decision, version: item.version }, idempotencyKey,
    validateData(data) { if (data?.code !== "QUOTE_REVIEWED") throw new ResponseContractError("The review was not confirmed."); validateQuote(data.quote, true); },
  })).data;
}
