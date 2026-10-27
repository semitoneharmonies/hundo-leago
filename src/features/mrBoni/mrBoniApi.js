import { queryOptions } from "@tanstack/react-query";
import { ResponseContractError } from "../../shared/api/responseContracts.js";

export const MR_BONI_RULESET = "resurface-v1";
export const mrBoniKey = (leagueId) => ["league", leagueId, "mr-boni", MR_BONI_RULESET];
export const publicMrBoniKey = ["games", "mr-boni", "public", MR_BONI_RULESET];
const path = (leagueId) => leagueId === null ? "/api/v1/games/mr-boni" : `/api/v1/leagues/${encodeURIComponent(leagueId)}/mr-boni`;
const integer = (value, minimum, maximum = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(value) && value >= minimum && value <= maximum;
const timestamp = (value) => (typeof value === "string" && Number.isFinite(Date.parse(value))) || integer(value, 0);
function requireContract(condition) {
  if (!condition) throw new ResponseContractError("The Mr. Boni response could not be verified.");
}
function validateResult(entry) {
  requireContract(integer(entry?.highestLevelCompleted, 0, 3) && entry.completed === (entry.highestLevelCompleted === 3));
  requireContract(entry.highestLevelCompleted === 0 ? entry.cumulativeTimeMs === null : integer(entry.cumulativeTimeMs, 1, 3600000));
}
export function validateMrBoniEntry(entry) {
  requireContract(typeof entry?.managerId === "string" && entry.managerId.length > 0 &&
    typeof entry.managerName === "string" && entry.managerName.trim().length > 0 &&
    integer(entry.rank, 1, 100000) && timestamp(entry.updatedAt));
  validateResult(entry);
  return true;
}
export function mrBoniLeaderboardQuery(client, leagueId) {
  return queryOptions({
    queryKey: mrBoniKey(leagueId), meta: { private: true, leagueId }, staleTime: 15000,
    queryFn: async ({ signal }) => (await client.request(`${path(leagueId)}/leaderboard`, {
      authenticated: true, dataKind: "object", signal,
      validateData(data) {
        requireContract(data?.rulesetVersion === MR_BONI_RULESET && Array.isArray(data.entries));
        data.entries.forEach(validateMrBoniEntry);
        requireContract(new Set(data.entries.map((entry) => entry.managerId)).size === data.entries.length);
        if (data.personalBest != null) validateMrBoniEntry(data.personalBest);
        return true;
      },
    })).data,
  });
}
export function publicMrBoniLeaderboardQuery(client) {
  return queryOptions({
    queryKey: publicMrBoniKey, staleTime: 15000,
    queryFn: async ({ signal }) => (await client.request(`${path(null)}/leaderboard`, {
      dataKind: "object", signal,
      validateData(data) {
        requireContract(data?.rulesetVersion === MR_BONI_RULESET && Array.isArray(data.entries));
        data.entries.forEach((entry) => {
          requireContract(typeof entry?.isGuest === "boolean" && entry.highestLevelCompleted > 0);
          validateMrBoniEntry({ ...entry, managerId: entry.playerId, managerName: entry.playerName });
        });
        requireContract(new Set(data.entries.map((entry) => entry.playerId)).size === data.entries.length);
        return true;
      },
    })).data,
  });
}
export async function startMrBoniRun(client, leagueId, clientRunId, signal, guestKey) {
  return (await client.request(`${path(leagueId)}/runs`, {
    method: "POST", authenticated: leagueId !== null, dataKind: "object", signal,
    body: { clientRunId, ...(leagueId === null ? { guestKey } : {}) }, idempotencyKey: `mrboni-start:${clientRunId}`,
    validateData(data) {
      requireContract(typeof data?.runId === "string" && data.runId.length > 0 && data.rulesetVersion === MR_BONI_RULESET && timestamp(data.createdAt));
      return true;
    },
  })).data;
}
export async function saveMrBoniCheckpoint(client, leagueId, runId, commands, signal, guestKey) {
  return (await client.request(`${path(leagueId)}/runs/${encodeURIComponent(runId)}/checkpoint`, {
    method: "POST", authenticated: leagueId !== null, dataKind: "object", signal,
    body: { commands, ...(leagueId === null ? { guestKey } : {}) }, idempotencyKey: `mrboni-checkpoint:${runId}:${commands.length}`,
    validateData(data) {
      requireContract(data?.runId === runId && data.rulesetVersion === MR_BONI_RULESET && integer(data.commandsProcessed, commands.length, 24000));
      validateResult(data);
      if (leagueId === null) requireContract(typeof data.qualifies === "boolean" && typeof data.named === "boolean" && (!data.qualifies || data.highestLevelCompleted > 0));
      return true;
    },
  })).data;
}
export async function nameMrBoniGuest(client, runId, guestKey, name, signal) {
  return (await client.request(`${path(null)}/runs/${encodeURIComponent(runId)}/name`, {
    method: "POST", dataKind: "object", signal, body: { guestKey, name },
    validateData(data) {
      requireContract(typeof data?.saved === "boolean" && typeof data.qualifies === "boolean");
      return true;
    },
  })).data;
}
