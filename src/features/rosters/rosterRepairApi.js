import { ResponseContractError } from "../../shared/api/responseContracts.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const categories = new Set(["Active", "Bench", "Injured Reserve"]);
const nonnegative = (value) => Number.isSafeInteger(value) && value >= 0;
const gameCount = (value) => value === null || nonnegative(value);
const invalid = () => { throw new ResponseContractError("The roster repair response could not be verified. Request a new suggestion."); };

export const rosterRepairKey = (leagueId, teamId) => ["league", leagueId, "team", teamId, "roster-repair"];

export function validateRosterRepairPreview(data, scope) {
  if (data?.code !== "ROSTER_REPAIR_PREVIEW" || ["leagueId", "teamId", "seasonId"].some(key => data[key] !== scope[key])) invalid();
  if (!["ready", "no_solution", "unavailable", "already_legal"].includes(data.status)
    || !["scheduled_games", "legality_only"].includes(data.strategy)
    || !["before_lock", "late_lock", "future_week", "no_week"].includes(data.timing)
    || typeof data.message !== "string" || typeof data.canApply !== "boolean"
    || !Array.isArray(data.moves) || !Array.isArray(data.blockers) || data.blockers.some(item => typeof item !== "string")) invalid();
  if (data.canApply !== (data.status === "ready") || (data.canApply ? !/^[a-f0-9]{64}$/i.test(data.revision || "") : data.revision !== null)) invalid();
  for (const value of [data.before, data.after]) {
    if (!value || !nonnegative(value.capUsageCents) || !nonnegative(value.capLimitCents) || !gameCount(value.scheduledGames)) invalid();
  }
  if (data.week !== null && (!data.week || !UUID.test(data.week.id) || typeof data.week.label !== "string"
    || ![data.week.startsAtMs, data.week.endsAtMs, data.week.locksAtMs].every(nonnegative)
    || data.week.endsAtMs <= data.week.startsAtMs)) invalid();
  const ids = new Set();
  for (const move of data.moves) {
    if (!move || !UUID.test(move.ownershipId) || !UUID.test(move.playerId) || ids.has(move.ownershipId)
      || typeof move.name !== "string" || !move.name.trim() || !categories.has(move.to)
      || !categories.has(move.from) || move.from === move.to || !gameCount(move.scheduledGames)) invalid();
    ids.add(move.ownershipId);
  }
  if ((data.canApply && data.moves.length === 0) || (!data.canApply && data.moves.length !== 0)) invalid();
  return true;
}

export function validateRosterRepairApplied(data, scope) {
  if (data?.code !== "ROSTER_REPAIR_APPLIED" || ["leagueId", "teamId", "seasonId"].some(key => data[key] !== scope[key])
    || !Number.isSafeInteger(data.moved) || data.moved <= 0 || data.legality?.legal !== true
    || (scope.expectedMoves !== undefined && data.moved !== scope.expectedMoves)
    || !["not_applicable", "awaiting_data", "still_illegal", "completed"].includes(data.lateLock?.status)
    || (data.lateLock.lockId !== undefined && !UUID.test(data.lateLock.lockId))) invalid();
  return true;
}

async function request(httpClient, scope, suffix, body, validate) {
  const response = await httpClient.request(
    `/api/v1/leagues/${encodeURIComponent(scope.leagueId)}/teams/${encodeURIComponent(scope.teamId)}/roster/${suffix}`,
    { method: "POST", authenticated: true, body, dataKind: "object", validateData: data => validate(data, scope) },
  );
  validate(response.data, scope);
  return response.data;
}

export const previewRosterRepair = (httpClient, scope) => request(httpClient, scope, "repair-preview", {}, validateRosterRepairPreview);
export const applyRosterRepair = (httpClient, scope, expectedRevision, expectedMoves) => request(httpClient, { ...scope, expectedMoves }, "repair", { expectedRevision, confirmed: true }, validateRosterRepairApplied);
