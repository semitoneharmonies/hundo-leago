import { ResponseContractError } from "../../shared/api/responseContracts.js";

const ID =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;

function contract(condition, message) {
  if (!condition) throw new ResponseContractError(message);
}

function object(value, message) {
  contract(
    value !== null && typeof value === "object" && !Array.isArray(value),
    message
  );
  return value;
}

function integer(value, message, { signed = false } = {}) {
  contract(
    Number.isSafeInteger(value) && (signed || value >= 0),
    message
  );
}

function validateChoice(choice, message) {
  object(choice, message);
  contract(ID.test(choice.id || ""), message);
  contract(
    typeof choice.label === "string" && choice.label.trim().length > 0,
    message
  );
}

export function validateTeamWorkspace(data) {
  object(data, "The team workspace is invalid.");
  contract(
    data.code === "TEAM_WORKSPACE_FOUND",
    "The team-workspace code is invalid."
  );
  contract(typeof data.canManage === "boolean", "Roster authority is invalid.");
  integer(data.orderVersion, "The roster-order version is invalid.");
  for (const scope of ["league", "season", "team"]) {
    object(data[scope], `The workspace ${scope} is invalid.`);
    contract(ID.test(data[scope].id || ""), `The workspace ${scope} ID is invalid.`);
    contract(
      typeof data[scope].name === "string" ||
        typeof data[scope].label === "string",
      `The workspace ${scope} label is invalid.`
    );
  }
  contract(Array.isArray(data.players), "The roster players are invalid.");
  for (const player of data.players) {
    object(player, "A roster player is invalid.");
    contract(ID.test(player.ownershipId || ""), "A roster ownership ID is invalid.");
    contract(ID.test(player.playerId || ""), "A roster player ID is invalid.");
    integer(player.ownershipVersion, "A roster ownership version is invalid.");
    contract(typeof player.name === "string" && player.name.length > 0, "A roster player name is invalid.");
    contract(["F", "D"].includes(player.normalizedPosition), "A roster position is invalid.");
    contract(
      ["Active", "Bench", "Injured Reserve", "Prospect"].includes(
        player.rosterCategory
      ),
      "A roster category is invalid."
    );
    contract(
      player.onTradeBlock === undefined ||
        typeof player.onTradeBlock === "boolean",
      "A roster trade-block state is invalid."
    );
    contract(
      player.injuredReserveEligible === undefined ||
        typeof player.injuredReserveEligible === "boolean",
      "A roster injured-reserve eligibility state is invalid."
    );
  }
  object(data.cap, "The team cap is invalid.");
  for (const field of [
    "limitCents",
    "usageCents",
    "activePlayerCents",
    "retainedSalaryCents",
    "buyoutPenaltyCents",
    "retentionSlotsUsed",
    "retentionSlotLimit",
  ]) {
    integer(data.cap[field], `The cap field ${field} is invalid.`);
  }
  integer(data.cap.spaceCents, "The cap space is invalid.", { signed: true });
  contract(Array.isArray(data.draftPicks), "The draft-pick list is invalid.");
  object(data.tradeAssets, "The team trade assets are invalid.");
  for (const key of [
    "contracts",
    "prospects",
    "draftPicks",
    "retentions",
    "buyouts",
    "futureConsiderations",
  ]) {
    contract(Array.isArray(data.tradeAssets[key]), `The ${key} trade choices are invalid.`);
    data.tradeAssets[key].forEach((choice) =>
      validateChoice(choice, `A ${key} trade choice is invalid.`)
    );
  }
  for (const buyout of data.tradeAssets.buyouts) {
    contract(
      typeof buyout.playerName === "string" &&
        buyout.playerName.trim().length > 0,
      "A buyout player name is invalid."
    );
    integer(
      buyout.annualPenaltyCents,
      "A buyout annual penalty is invalid."
    );
    integer(buyout.remainingYears, "A buyout remaining term is invalid.");
  }
  return true;
}
