import { queryOptions } from "@tanstack/react-query";
import { ResponseContractError } from "../../shared/api/responseContracts.js";

export const TIP_JAR_RULESET = "campaign-v1";
export const tipJarKey = (leagueId) => ["league", leagueId, "tip-jar", TIP_JAR_RULESET];
const path = (leagueId) => `/api/v1/leagues/${encodeURIComponent(leagueId)}/tip-jar`;
const integer = (value, minimum, maximum) => Number.isSafeInteger(value) && value >= minimum && value <= maximum;
const timestamp = (value) => (typeof value === "string" && Number.isFinite(Date.parse(value))) || (Number.isSafeInteger(value) && value >= 0);
function requireContract(condition) {
  if (!condition) throw new ResponseContractError("The Tip Jar response could not be verified.");
}

export function validateTipJarEntry(entry) {
  requireContract(entry && typeof entry.managerId === "string" && entry.managerId.length > 0 &&
    typeof entry.managerName === "string" && entry.managerName.trim().length > 0 &&
    integer(entry.rank, 1, 100000) && integer(entry.highestLevelCompleted, 0, 3) &&
    entry.completed === (entry.highestLevelCompleted === 3) && timestamp(entry.updatedAt));
  requireContract(entry.highestLevelCompleted === 0
    ? entry.shotsToCompletion === null || entry.shotsToCompletion === 0
    : integer(entry.shotsToCompletion, 1, 60));
  return true;
}

export function tipJarLeaderboardQuery(client, leagueId) {
  return queryOptions({
    queryKey: tipJarKey(leagueId),
    meta: { private: true, leagueId },
    staleTime: 15000,
    queryFn: async ({ signal }) => (await client.request(`${path(leagueId)}/leaderboard`, {
      authenticated: true, dataKind: "object", signal,
      validateData(data) {
        requireContract(data?.rulesetVersion === TIP_JAR_RULESET && Array.isArray(data.entries));
        data.entries.forEach(validateTipJarEntry);
        requireContract(new Set(data.entries.map((entry) => entry.managerId)).size === data.entries.length);
        if (data.personalBest != null) validateTipJarEntry(data.personalBest);
        return true;
      },
    })).data,
  });
}

export async function startTipJarRun(client, leagueId, clientRunId, signal) {
  return (await client.request(`${path(leagueId)}/runs`, {
    method: "POST", authenticated: true, dataKind: "object", signal,
    body: { clientRunId }, idempotencyKey: `tipjar-start:${clientRunId}`,
    validateData(data) {
      requireContract(typeof data?.runId === "string" && data.runId.length > 0 &&
        integer(data.seed, 0, 0xffffffff) && data.rulesetVersion === TIP_JAR_RULESET && timestamp(data.createdAt));
      return true;
    },
  })).data;
}

export async function saveTipJarCheckpoint(client, leagueId, runId, shots, signal) {
  return (await client.request(`${path(leagueId)}/runs/${encodeURIComponent(runId)}/checkpoint`, {
    method: "POST", authenticated: true, dataKind: "object", signal,
    body: { shots }, idempotencyKey: `tipjar-checkpoint:${runId}:${shots.length}`,
    validateData(data) {
      // A matching stale prefix can return the run's newer authoritative state.
      requireContract(data?.runId === runId && integer(data.shotsUsed, shots.length, 60) &&
        integer(data.highestLevelCompleted, 0, 3) && integer(data.level, 1, 3) && integer(data.pucks, 0, 60) &&
        typeof data.failed === "boolean" && data.completed === (data.highestLevelCompleted === 3) &&
        !(data.failed && data.completed) && Array.isArray(data.levelResults));
      requireContract(data.highestLevelCompleted === 0
        ? data.shotsToCompletion === null || data.shotsToCompletion === 0
        : integer(data.shotsToCompletion, 1, data.shotsUsed));
      let cumulative = 0;
      requireContract(data.levelResults.length === data.highestLevelCompleted);
      data.levelResults.forEach((result, index) => {
        cumulative += result.shots;
        requireContract(result.level === index + 1 && integer(result.shots, 1, 60) && result.totalShots === cumulative);
      });
      if (data.highestLevelCompleted > 0) requireContract(cumulative === data.shotsToCompletion);
      return true;
    },
  })).data;
}
