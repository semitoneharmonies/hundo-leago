import { ResponseContractError } from "../../shared/api/responseContracts.js";

const ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const TRADE_STATUSES = new Set([
  "proposed",
  "accepted",
  "declined",
  "cancelled",
  "expired",
  "completed",
  "reversed",
  "correction_required",
]);

function contract(condition, message) {
  if (!condition) throw new ResponseContractError(message);
}

function object(value, message) {
  contract(value !== null && typeof value === "object" && !Array.isArray(value), message);
  return value;
}

function id(value, message) {
  contract(ID.test(value || ""), message);
  return value;
}

function integer(value, message, { nullable = false } = {}) {
  if (nullable && value === null) return value;
  contract(Number.isSafeInteger(value) && value >= 0, message);
  return value;
}

export function dollarsToCents(value) {
  const normalized = String(value ?? "").trim();
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) {
    throw new Error(
      "Enter a dollar amount with no more than two decimal places."
    );
  }
  const dollars = Number(match[1]);
  const cents = Number((match[2] || "").padEnd(2, "0") || "0");
  const total = dollars * 100 + cents;
  if (!Number.isSafeInteger(total)) {
    throw new Error("The dollar amount is too large.");
  }
  return total;
}

export function centsToDollarInput(value) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error("The stored auction amount is invalid.");
  }
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, "0")}`;
}

export function auctionDollarsToCents(
  value,
  { termYears, joining = false } = {}
) {
  if (!Number.isSafeInteger(termYears) || termYears < 1 || termYears > 3) {
    throw new Error("Choose an auction term from one to three years.");
  }
  const total = dollarsToCents(value);
  if (termYears > 1 && total % 100 !== 0) {
    throw new Error(
      "Two- and three-year auction totals must be whole dollars."
    );
  }
  const minimum = joining
    ? { 1: 150, 2: 300, 3: 500 }[termYears]
    : termYears * 100;
  if (total < minimum) {
    throw new Error(
      `The minimum ${joining ? "joining bid" : "opening bid"} is ${centsToDollarInput(minimum)} dollars.`
    );
  }
  return total;
}

function validateAuction(auction) {
  object(auction, "The auction is invalid.");
  id(auction.id, "The auction ID is invalid.");
  id(auction.leagueId, "The auction league is invalid.");
  id(auction.seasonId, "The auction season is invalid.");
  object(auction.player, "The auction player is invalid.");
  id(auction.player.id, "The auction player ID is invalid.");
  contract(typeof auction.player.fullName === "string" && auction.player.fullName.length > 0,
    "The auction player name is invalid.");
  integer(auction.openedAtMs, "The auction open time is invalid.");
  integer(auction.bidClosesAtMs, "The auction close time is invalid.");
  integer(auction.participantCount, "The auction participant count is invalid.");
  contract(Array.isArray(auction.participants), "The auction participants are invalid.");
  for (const participant of auction.participants) {
    object(participant, "An auction participant is invalid.");
    contract(
      Object.keys(participant).sort().join(",") === "teamId,teamName",
      "An auction participant exposed sealed bid data."
    );
    id(participant.teamId, "An auction participant team is invalid.");
    contract(typeof participant.teamName === "string", "An auction participant name is invalid.");
  }
  if (auction.ownBid !== null) {
    object(auction.ownBid, "The caller's auction bid is invalid.");
    id(auction.ownBid.id, "The caller's bid ID is invalid.");
    id(auction.ownBid.teamId, "The caller's bid team is invalid.");
    for (const field of ["totalValueCents", "termYears", "aavCents", "editCount", "version"]) {
      integer(auction.ownBid[field], `The caller's bid ${field} is invalid.`);
    }
    if (auction.ownBid.remainingManagerEdits !== undefined) {
      integer(auction.ownBid.remainingManagerEdits, "The caller's remaining edits are invalid.");
      integer(auction.ownBid.cooldownEndsAtMs, "The caller's cooldown end is invalid.");
    }
  }
  return true;
}

export function validateAuctionList(data) {
  contract(data?.code === "ACTIVE_AUCTIONS_FOUND", "The auction-list code is invalid.");
  contract(Array.isArray(data.auctions), "The auction list is invalid.");
  for (const auction of data.auctions) validateAuction(auction);
  return true;
}

export function validateAuctionDetail(data) {
  contract(data?.code === "ACTIVE_AUCTION_FOUND", "The auction-detail code is invalid.");
  return validateAuction(data.auction);
}

function validateTradeSummary(trade) {
  object(trade, "The trade proposal is invalid.");
  id(trade.id, "The trade ID is invalid.");
  id(trade.leagueId, "The trade league is invalid.");
  id(trade.seasonId, "The trade season is invalid.");
  for (const side of ["proposingTeam", "receivingTeam"]) {
    object(trade[side], `The ${side} is invalid.`);
    id(trade[side].id, `The ${side} ID is invalid.`);
    contract(typeof trade[side].name === "string" && trade[side].name.length > 0,
      `The ${side} name is invalid.`);
  }
  contract(TRADE_STATUSES.has(trade.storageStatus), "The trade status is invalid.");
  for (const field of ["createdAtMs", "expiresAtMs", "effectiveDeadlineAtMs", "version"]) {
    integer(trade[field], `The trade ${field} is invalid.`);
  }
  return true;
}

export function validateTradeList(data) {
  contract(data?.code === "TRADE_PROPOSALS_FOUND", "The trade-list code is invalid.");
  contract(Array.isArray(data.proposals), "The trade list is invalid.");
  for (const trade of data.proposals) validateTradeSummary(trade);
  return true;
}

export function validateTradeDetail(data) {
  contract(data?.code === "TRADE_PROPOSAL_FOUND", "The trade-detail code is invalid.");
  validateTradeSummary(data.proposal);
  contract(Array.isArray(data.proposal.assets), "The trade assets are invalid.");
  for (const asset of data.proposal.assets) {
    object(asset, "A trade asset is invalid.");
    id(asset.id, "A trade asset ID is invalid.");
    contract(typeof asset.type === "string" && asset.type.length > 0, "A trade asset type is invalid.");
    object(asset.snapshot, "A trade asset snapshot is invalid.");
  }
  contract(Array.isArray(data.proposal.history), "The trade history is invalid.");
  return true;
}

export function validateAcceptancePreview(data) {
  contract(data?.code === "TRADE_ACCEPTANCE_PREVIEWED", "The acceptance-preview code is invalid.");
  contract(typeof data.generallyIllegal === "boolean", "The acceptance warning is invalid.");
  contract(Array.isArray(data.assets), "The acceptance assets are invalid.");
  object(data.teams, "The acceptance team preview is invalid.");
  return true;
}

export function validateReversalPreview(data) {
  contract(data?.code === "TRADE_REVERSAL_PREVIEWED", "The reversal-preview code is invalid.");
  object(data.preview, "The reversal preview is invalid.");
  contract(typeof data.preview.recoverable === "boolean", "The recoverability flag is invalid.");
  contract(Array.isArray(data.preview.mismatches), "The reversal mismatches are invalid.");
  return true;
}

export function validateActivityPage(data) {
  contract(data?.code === "LEAGUE_ACTIVITY_FOUND", "The activity code is invalid.");
  contract(Array.isArray(data.activity), "The activity list is invalid.");
  object(data.page, "The activity page is invalid.");
  for (const item of data.activity) {
    object(item, "An activity item is invalid.");
    id(item.id, "An activity ID is invalid.");
    contract(typeof item.summary === "string" && item.summary.length > 0, "An activity summary is invalid.");
    integer(item.occurredAtMs, "An activity time is invalid.");
  }
  contract(data.page.nextCursor === null || typeof data.page.nextCursor === "string",
    "The activity cursor is invalid.");
  return true;
}

export function buildTradeAsset({ type, reference, retainedAavCents }) {
  const value = String(reference || "").trim();
  switch (type) {
    case "contract": return { type, contractId: id(value, "The contract ID is invalid.") };
    case "prospect_right": return { type, playerId: id(value, "The player ID is invalid.") };
    case "draft_pick": return { type, draftPickId: id(value, "The draft-pick ID is invalid.") };
    case "retention_obligation": return { type, retentionObligationId: id(value, "The retention ID is invalid.") };
    case "buyout_obligation": return { type, buyoutObligationId: id(value, "The buyout ID is invalid.") };
    case "future_consideration": return { type, futureConsiderationId: id(value, "The Future Considerations ID is invalid.") };
    case "future_consideration_instruction":
      contract(value.length > 0 && value.length <= 500, "The Future Considerations description is invalid.");
      return { type, description: value };
    case "requested_retention": {
      const cents = Number(retainedAavCents);
      contract(Number.isSafeInteger(cents) && cents > 0, "The retained AAV is invalid.");
      return { type, contractId: id(value, "The retained contract ID is invalid."), retainedAavCents: cents };
    }
    default:
      throw new ResponseContractError("The trade asset type is unsupported.");
  }
}
