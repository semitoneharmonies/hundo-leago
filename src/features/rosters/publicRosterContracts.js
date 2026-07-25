import { ResponseContractError } from "../../shared/api/responseContracts.js";

const STABLE_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const COLOUR = /^#[0-9a-f]{6}$/;
const CATEGORIES = new Set(["Active", "Bench", "Injured Reserve", "Prospect"]);

function contract(condition, message) {
  if (!condition) throw new ResponseContractError(message);
}

function exactKeys(value, keys, message) {
  contract(value !== null && typeof value === "object" && !Array.isArray(value), message);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  contract(actual.length === expected.length && actual.every((key, index) => key === expected[index]), message);
}

function stableId(value, message) {
  contract(typeof value === "string" && STABLE_ID.test(value), message);
}

function text(value, message) {
  contract(typeof value === "string" && value.trim().length > 0, message);
}

function integer(value, { minimum = Number.MIN_SAFE_INTEGER, maximum = Number.MAX_SAFE_INTEGER } = {}) {
  return Number.isSafeInteger(value) && value >= minimum && value <= maximum;
}

function validateStatistics(value) {
  if (value === null) return;
  exactKeys(value, ["gamesPlayed", "goals", "assists", "nhlPoints", "fantasyPointsHundredths"], "The player statistics are invalid.");
  for (const field of ["gamesPlayed", "goals", "assists", "nhlPoints", "fantasyPointsHundredths"]) {
    contract(integer(value[field], { minimum: 0 }), `The player ${field} value is invalid.`);
  }
  contract(value.nhlPoints === value.goals + value.assists, "The player NHL points do not reconcile.");
}

function validatePlayer(value) {
  exactKeys(value, ["playerReference", "name", "normalizedPosition", "rosterCategory", "aavCents", "remainingContractYears", "age", "seasonStatistics"], "The public roster player is invalid.");
  stableId(value.playerReference, "The player reference is invalid.");
  text(value.name, "The player name is invalid.");
  contract(["F", "D"].includes(value.normalizedPosition), "The player position is invalid.");
  contract(CATEGORIES.has(value.rosterCategory), "The roster category is invalid.");
  contract(value.aavCents === null || integer(value.aavCents, { minimum: 1 }), "The player AAV is invalid.");
  contract(integer(value.remainingContractYears, { minimum: 0, maximum: 3 }), "The remaining contract years are invalid.");
  contract(value.age === null || integer(value.age, { minimum: 0, maximum: 150 }), "The player age is invalid.");
  validateStatistics(value.seasonStatistics);
}

export function validatePublicRosterResponse(data) {
  exactKeys(data, ["code", "roster"], "The public roster response is invalid.");
  contract(data.code === "PUBLIC_ROSTER_FOUND", "The public roster response code is invalid.");
  const { roster } = data;
  exactKeys(roster, ["league", "season", "team", "players", "cap", "updatedAt"], "The public roster projection is invalid.");
  exactKeys(roster.league, ["id", "name"], "The public league identity is invalid.");
  stableId(roster.league.id, "The public league ID is invalid.");
  text(roster.league.name, "The public league name is invalid.");
  exactKeys(roster.season, ["id", "label"], "The public season identity is invalid.");
  stableId(roster.season.id, "The public season ID is invalid.");
  text(roster.season.label, "The public season label is invalid.");
  exactKeys(roster.team, ["id", "name", "primaryColour", "secondaryColour", "logoReference"], "The public team identity is invalid.");
  stableId(roster.team.id, "The public team ID is invalid.");
  text(roster.team.name, "The public team name is invalid.");
  for (const value of [roster.team.primaryColour, roster.team.secondaryColour]) {
    contract(value === null || (typeof value === "string" && COLOUR.test(value)), "The team colour is invalid.");
  }
  contract(roster.team.logoReference === null || (typeof roster.team.logoReference === "string" && roster.team.logoReference.startsWith("/api/v1/public/leagues/")), "The public team logo reference is invalid.");
  contract(Array.isArray(roster.players), "The public roster players are invalid.");
  roster.players.forEach(validatePlayer);
  contract(new Set(roster.players.map(({ playerReference }) => playerReference)).size === roster.players.length, "The public roster contains duplicate players.");
  exactKeys(roster.cap, ["capLimitCents", "capUsageCents", "capSpaceCents", "retainedSalaryTotalCents", "buyoutPenaltyTotalCents"], "The public cap summary is invalid.");
  for (const field of ["capLimitCents", "capUsageCents", "retainedSalaryTotalCents", "buyoutPenaltyTotalCents"]) {
    contract(integer(roster.cap[field], { minimum: 0 }), `The ${field} value is invalid.`);
  }
  contract(integer(roster.cap.capSpaceCents), "The cap space is invalid.");
  contract(roster.cap.capSpaceCents === roster.cap.capLimitCents - roster.cap.capUsageCents, "The public cap totals do not reconcile.");
  contract(integer(roster.updatedAt, { minimum: 0 }), "The public roster update time is invalid.");
  return true;
}
