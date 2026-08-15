import { ResponseContractError } from "../../shared/api/responseContracts.js";
import {
  AUCTION_PUBLIC_STATUSES,
  AUCTION_SOURCE_KINDS,
  validateAuction,
  validateAuctionActions,
  validateAuctionBidResult,
  validateAuctionBidRemovalResult,
  validateAuctionCancellationResult,
  validateAuctionCollection,
  validateAuctionPage,
  validateAuctionResolutionRequest,
  validateAuctionStartResult,
} from "./auctionContracts.js";

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const IDEMPOTENCY_KEY = /^[\x21-\x7E]{1,128}$/;
const BASE64URL = /^[A-Za-z0-9_-]+$/;
const part = (value) => encodeURIComponent(value);

function exactInput(value, fields, description) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getOwnPropertySymbols(value).length !== 0 ||
    Object.keys(value).sort().join("|") !== [...fields].sort().join("|")
  ) {
    throw new TypeError(`${description} is invalid.`);
  }
  return value;
}

function stableId(value, description) {
  if (typeof value !== "string" || !UUID_V4.test(value)) {
    throw new TypeError(`${description} is invalid.`);
  }
  return value;
}

function idempotencyKey(value) {
  if (
    typeof value !== "string" ||
    value !== value.trim() ||
    !IDEMPOTENCY_KEY.test(value)
  ) {
    throw new TypeError("The auction idempotency key is invalid.");
  }
  return value;
}

function normalizedSearch(value) {
  if (
    typeof value !== "string" ||
    Array.from(value).some((character) => {
      const codePoint = character.codePointAt(0);
      return (
        codePoint <= 31 ||
          (codePoint >= 127 && codePoint <= 159) ||
          codePoint === 8_232 ||
          codePoint === 8_233
      );
    })
  ) {
    throw new TypeError("The auction search is invalid.");
  }
  const normalized = value.replace(/\s+/gu, " ").trim().toLowerCase();
  if (Array.from(normalized).length > 200) {
    throw new TypeError("The auction search is invalid.");
  }
  return normalized;
}

function pageLimit(value) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 100) {
    throw new TypeError("The auction page limit is invalid.");
  }
  return value;
}

function canonicalCursor(value) {
  if (value === null) return null;
  if (
    typeof value !== "string" ||
    Array.from(value).length < 1 ||
    Array.from(value).length > 1_024 ||
    !BASE64URL.test(value) ||
    value.length % 4 === 1
  ) {
    throw new TypeError("The auction cursor is invalid.");
  }
  return value;
}

export function normalizeAuctionFilters(input = {}) {
  const allowedFields = ["fadId", "limit", "q", "sourceKind", "statuses"];
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.getOwnPropertySymbols(input).length !== 0 ||
    Object.keys(input).some((field) => !allowedFields.includes(field))
  ) {
    throw new TypeError("The auction filters are invalid.");
  }
  const {
    sourceKind = null,
    fadId = null,
    statuses = ["active"],
    q = "",
    limit = 50,
  } = input;
  if (sourceKind !== null && !AUCTION_SOURCE_KINDS.includes(sourceKind)) {
    throw new TypeError("The auction source kind is invalid.");
  }
  if (fadId !== null) stableId(fadId, "Auction FAD ID");
  if (fadId !== null && sourceKind === "ordinary_weekly") {
    throw new TypeError("An ordinary auction filter cannot include a FAD ID.");
  }
  if (
    !Array.isArray(statuses) ||
    statuses.length < 1 ||
    Object.getOwnPropertySymbols(statuses).length !== 0 ||
    Object.keys(statuses).length !== statuses.length
  ) {
    throw new TypeError("The auction statuses are invalid.");
  }
  const selected = new Set();
  for (const status of statuses) {
    if (!AUCTION_PUBLIC_STATUSES.includes(status)) {
      throw new TypeError("The auction statuses are invalid.");
    }
    selected.add(status);
  }
  const canonicalStatuses = Object.freeze(
    AUCTION_PUBLIC_STATUSES.filter((status) => selected.has(status))
  );
  return Object.freeze({
    sourceKind,
    fadId,
    statuses: canonicalStatuses,
    q: normalizedSearch(q),
    limit: pageLimit(limit),
  });
}

function listOptions(value = {}) {
  const fields = ["cursor", "fadId", "limit", "q", "signal", "sourceKind", "statuses"];
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getOwnPropertySymbols(value).length !== 0 ||
    Object.keys(value).some((field) => !fields.includes(field))
  ) {
    throw new TypeError("The auction list options are invalid.");
  }
  return value;
}

function auctionPath(leagueId) {
  return `/api/v1/leagues/${part(stableId(leagueId, "League ID"))}/auctions`;
}

function validateContractTerms(input, fields, description) {
  exactInput(input, fields, description);
  if (
    !Number.isSafeInteger(input.termYears) ||
    input.termYears < 1 ||
    input.termYears > 3 ||
    !Number.isSafeInteger(input.aavCents) ||
    input.aavCents < 100 ||
    input.aavCents % 25 !== 0
  ) {
    throw new TypeError(`${description} contract is invalid.`);
  }
  return input;
}

function startBody(input) {
  const fields = Object.hasOwn(input || {}, "bindingIllegalityConfirmed")
    ? [
        "bindingIllegalityConfirmed",
        "playerId",
        "teamId",
        "termYears",
        "aavCents",
      ]
    : ["playerId", "teamId", "termYears", "aavCents"];
  validateContractTerms(input, fields, "Auction start body");
  stableId(input.playerId, "Auction player ID");
  stableId(input.teamId, "Auction team ID");
  if (
    Object.hasOwn(input, "bindingIllegalityConfirmed") &&
    input.bindingIllegalityConfirmed !== true
  ) {
    throw new TypeError("The binding FAD auction confirmation is invalid.");
  }
  return input;
}

function bidBody(input) {
  const fields = Object.hasOwn(input || {}, "bindingIllegalityConfirmed")
    ? ["bindingIllegalityConfirmed", "teamId", "termYears", "aavCents"]
    : ["teamId", "termYears", "aavCents"];
  validateContractTerms(input, fields, "Auction bid body");
  stableId(input.teamId, "Auction team ID");
  if (
    Object.hasOwn(input, "bindingIllegalityConfirmed") &&
    input.bindingIllegalityConfirmed !== true
  ) {
    throw new TypeError("The binding FAD auction confirmation is invalid.");
  }
  return input;
}

function administrationBidBody(input) {
  validateContractTerms(
    input,
    ["teamId", "termYears", "aavCents"],
    "Auction commissioner bid body"
  );
  stableId(input.teamId, "Auction team ID");
  return input;
}

function writeOptions(value, { optionalVersion = false } = {}) {
  exactInput(value, ["idempotencyKey", "version"], "Auction write options");
  idempotencyKey(value.idempotencyKey);
  if (
    value.version !== null &&
    (!Number.isSafeInteger(value.version) || value.version < 1)
  ) {
    throw new TypeError("The auction write version is invalid.");
  }
  if (!optionalVersion && value.version === null) {
    throw new TypeError("The auction write version is required.");
  }
  return value;
}

function same(actual, expected, description) {
  if (actual !== expected) {
    throw new ResponseContractError(`${description} identity is mismatched.`);
  }
}

export async function listAuctions(httpClient, leagueId, options = {}) {
  const input = listOptions(options);
  const filters = normalizeAuctionFilters({
    sourceKind: input.sourceKind,
    fadId: input.fadId,
    statuses: input.statuses,
    q: input.q,
    limit: input.limit,
  });
  const cursor = canonicalCursor(input.cursor ?? null);
  const search = new URLSearchParams();
  if (filters.sourceKind !== null) search.set("sourceKind", filters.sourceKind);
  if (filters.fadId !== null) search.set("fadId", filters.fadId);
  const usesDefaultActiveScope =
    filters.statuses.length === 1 && filters.statuses[0] === "active";
  if (!usesDefaultActiveScope) {
    for (const status of filters.statuses) search.append("status", status);
  }
  if (filters.q) search.set("q", filters.q);
  search.set("limit", String(filters.limit));
  if (cursor !== null) search.set("cursor", cursor);
  const response = await httpClient.request(`${auctionPath(leagueId)}?${search}`, {
    authenticated: true,
    dataKind: "array",
    validateData: validateAuctionCollection,
    actionsKind: "object",
    validateActions: validateAuctionActions,
    validatePage: validateAuctionPage,
    signal: input.signal,
  });
  for (const auction of response.data) {
    same(auction.leagueId, leagueId, "Auction league");
    if (filters.sourceKind !== null) {
      same(auction.sourceKind, filters.sourceKind, "Auction source");
    }
    if (filters.fadId !== null) same(auction.fadId, filters.fadId, "Auction FAD");
    if (!filters.statuses.includes(auction.status)) {
      throw new ResponseContractError("Auction status filter is mismatched.");
    }
  }
  return Object.freeze({
    items: Object.freeze([...response.data]),
    actions: Object.freeze({
      startTeams: Object.freeze([...response.actions.startTeams]),
    }),
    page: response.page,
  });
}

export async function getAuction(httpClient, leagueId, auctionId, { signal } = {}) {
  stableId(auctionId, "Auction ID");
  const response = await httpClient.request(
    `${auctionPath(leagueId)}/${part(auctionId)}`,
    {
      authenticated: true,
      dataKind: "object",
      validateData: validateAuction,
      signal,
    }
  );
  same(response.data.leagueId, leagueId, "Auction league");
  same(response.data.auctionId, auctionId, "Auction");
  return response.data;
}

export async function startAuction(httpClient, leagueId, input, options) {
  startBody(input);
  exactInput(options, ["idempotencyKey"], "Auction start options");
  const key = options.idempotencyKey;
  idempotencyKey(key);
  const response = await httpClient.request(auctionPath(leagueId), {
    method: "POST",
    authenticated: true,
    body: input,
    idempotencyKey: key,
    dataKind: "object",
    validateData: validateAuctionStartResult,
  });
  const result = response.data;
  if (Object.hasOwn(result, "kind")) {
    const resource = result.auction ?? result.queuedNomination;
    if (result.auction !== null) same(result.auction.leagueId, leagueId, "Auction league");
    same(resource.player.playerId, input.playerId, "Auction player");
    if (result.queuedNomination !== null) {
      same(result.queuedNomination.teamId, input.teamId, "Auction team");
    }
  } else {
    same(result.auction.leagueId, leagueId, "Auction league");
    same(result.auction.playerId, input.playerId, "Auction player");
    same(result.openingBid.teamId, input.teamId, "Auction team");
  }
  return result;
}

export async function putMyAuctionBid(
  httpClient,
  leagueId,
  auctionId,
  input,
  options
) {
  stableId(auctionId, "Auction ID");
  bidBody(input);
  const command = writeOptions(options, { optionalVersion: true });
  const response = await httpClient.request(
    `${auctionPath(leagueId)}/${part(auctionId)}/bids/mine`,
    {
      method: "PUT",
      authenticated: true,
      body: input,
      ...(command.version === null ? {} : { version: command.version }),
      idempotencyKey: command.idempotencyKey,
      dataKind: "object",
      validateData: validateAuctionBidResult,
    }
  );
  same(response.data.auction.leagueId, leagueId, "Auction bid league");
  same(response.data.auction.id, auctionId, "Auction bid auction");
  same(response.data.bid.teamId, input.teamId, "Auction bid team");
  return response.data;
}

export async function editAuctionBidAsCommissioner(
  httpClient,
  leagueId,
  auctionId,
  bidId,
  input,
  options
) {
  stableId(auctionId, "Auction ID");
  stableId(bidId, "Auction bid ID");
  administrationBidBody(input);
  const command = writeOptions(options);
  const response = await httpClient.request(
    `${auctionPath(leagueId)}/${part(auctionId)}/bids/${part(bidId)}`,
    {
      method: "PATCH",
      authenticated: true,
      body: input,
      version: command.version,
      idempotencyKey: command.idempotencyKey,
      dataKind: "object",
      validateData: validateAuction,
    }
  );
  same(response.data.leagueId, leagueId, "Auction administration league");
  same(response.data.auctionId, auctionId, "Auction administration auction");
  const editedBid = response.data.administrativeBids.find(
    (bid) => bid.bidId === bidId
  );
  if (!editedBid) {
    throw new ResponseContractError("Edited auction bid is missing from the response.");
  }
  same(editedBid.teamId, input.teamId, "Auction administration team");
  return response.data;
}

export async function removeAuctionBidAsCommissioner(
  httpClient,
  leagueId,
  auctionId,
  bidId,
  options
) {
  stableId(auctionId, "Auction ID");
  stableId(bidId, "Auction bid ID");
  const command = writeOptions(options);
  const body = { confirmation: "REMOVE AUCTION BID" };
  const response = await httpClient.request(
    `${auctionPath(leagueId)}/${part(auctionId)}/bids/${part(bidId)}`,
    {
      method: "DELETE",
      authenticated: true,
      body,
      version: command.version,
      idempotencyKey: command.idempotencyKey,
      dataKind: "object",
      validateData: validateAuctionBidRemovalResult,
    }
  );
  same(response.data.auction.leagueId, leagueId, "Auction administration league");
  same(response.data.auction.auctionId, auctionId, "Auction administration auction");
  same(response.data.removedBidId, bidId, "Removed auction bid");
  return response.data;
}

export async function cancelAuctionAsCommissioner(
  httpClient,
  leagueId,
  auctionId,
  options
) {
  stableId(auctionId, "Auction ID");
  const command = writeOptions(options);
  const body = { confirmation: "CANCEL AUCTION" };
  const response = await httpClient.request(
    `${auctionPath(leagueId)}/${part(auctionId)}/cancel`,
    {
      method: "POST",
      authenticated: true,
      body,
      version: command.version,
      idempotencyKey: command.idempotencyKey,
      dataKind: "object",
      validateData: validateAuctionCancellationResult,
    }
  );
  same(response.data.auction.leagueId, leagueId, "Auction cancellation league");
  same(response.data.auction.auctionId, auctionId, "Auction cancellation auction");
  return response.data;
}

export async function requestAuctionResolutionAsCommissioner(
  httpClient,
  leagueId,
  auctionId,
  options
) {
  stableId(auctionId, "Auction ID");
  const command = writeOptions(options);
  const body = { confirmation: "RESOLVE AUCTION" };
  const response = await httpClient.request(
    `${auctionPath(leagueId)}/${part(auctionId)}/resolve`,
    {
      method: "POST",
      authenticated: true,
      body,
      version: command.version,
      idempotencyKey: command.idempotencyKey,
      dataKind: "object",
      validateData: validateAuctionResolutionRequest,
    }
  );
  same(response.data.auctionId, auctionId, "Auction resolution auction");
  same(
    response.data.pollDescriptor.leagueId,
    leagueId,
    "Auction resolution league"
  );
  return response.data;
}
