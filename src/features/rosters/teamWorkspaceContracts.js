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
  if (data.legality !== undefined) {
    object(data.legality, "The roster legality is invalid.");
    contract(
      typeof data.legality.legal === "boolean",
      "The roster legal state is invalid."
    );
    object(data.legality.counts, "The roster legality counts are invalid.");
    object(data.legality.limits, "The roster legality limits are invalid.");
    object(data.legality.cap, "The roster legality cap is invalid.");
    contract(
      Array.isArray(data.legality.reasons) &&
        data.legality.reasons.every(
          (reason) =>
            reason &&
            typeof reason === "object" &&
            typeof reason.code === "string" &&
            reason.code.length > 0
        ),
      "The roster legality reasons are invalid."
    );
  }
  contract(Array.isArray(data.draftPicks), "The draft-pick list is invalid.");
  for (const pick of data.draftPicks) {
    object(pick, "A draft pick is invalid.");
    contract(ID.test(pick.id || ""), "A draft-pick ID is invalid.");
    integer(pick.version, "A draft-pick version is invalid.");
    object(pick.targetSeason, "A draft-pick season is invalid.");
    contract(
      ID.test(pick.targetSeason.id || "") &&
        typeof pick.targetSeason.label === "string" &&
        pick.targetSeason.label.trim().length > 0,
      "A draft-pick season is invalid."
    );
    integer(pick.round, "A draft-pick round is invalid.");
    integer(pick.position, "A draft-pick position is invalid.");
    object(pick.originalTeam, "A draft-pick original team is invalid.");
    contract(
      ID.test(pick.originalTeam.id || "") &&
        typeof pick.originalTeam.name === "string" &&
        pick.originalTeam.name.trim().length > 0,
      "A draft-pick original team is invalid."
    );
  }
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
