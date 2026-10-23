import { describe, expect, it, vi } from "vitest";
import { saveTipJarCheckpoint, startTipJarRun, tipJarKey, tipJarLeaderboardQuery } from "./tipJarApi.js";
import { routePaths } from "../../app/routePaths.js";

const entry = { rank: 1, managerId: "manager-a", managerName: "Alex", highestLevelCompleted: 2, shotsToCompletion: 24, completed: false, updatedAt: 10 };
const client = (data) => ({ request: vi.fn(async (_path, options) => { options.validateData(data); return { data }; }) });
const shots = [{ time: 1, x: 0, height: .4, power: 50 }];

describe("Tip Jar API contracts", () => {
  it("uses encoded routes and private per-league cache keys", async () => {
    const http = client({ rulesetVersion: "campaign-v1", entries: [entry] });
    const query = tipJarLeaderboardQuery(http, "league/a");
    await query.queryFn({ signal: undefined });
    expect(http.request.mock.calls[0][0]).toBe("/api/v1/leagues/league%2Fa/tip-jar/leaderboard");
    expect(query.queryKey).toEqual(tipJarKey("league/a"));
    expect(query.queryKey).not.toEqual(tipJarKey("league/b"));
    expect(query.meta).toEqual({ private: true, leagueId: "league/a" });
    expect(routePaths.leagueTipJar("league/a")).toBe("/leagues/league%2Fa/tip-jar");
    expect(() => routePaths.leagueTipJar(" ")).toThrow();
  });

  it("rejects another ruleset, duplicate managers and contradictory completion results", async () => {
    for (const data of [
      { rulesetVersion: "old", entries: [] },
      { rulesetVersion: "campaign-v1", entries: [entry, entry] },
      { rulesetVersion: "campaign-v1", entries: [{ ...entry, completed: true }] },
      { rulesetVersion: "campaign-v1", entries: [{ ...entry, shotsToCompletion: -1 }] },
    ]) await expect(tipJarLeaderboardQuery(client(data), "league").queryFn({})).rejects.toThrow();
  });

  it("starts with no claimed manager identity and reuses the same intent key", async () => {
    const http = client({ runId: "run", seed: 0xffffffff, rulesetVersion: "campaign-v1", createdAt: 1 });
    await startTipJarRun(http, "league", "intent"); await startTipJarRun(http, "league", "intent");
    expect(http.request.mock.calls[0][1]).toMatchObject({ method: "POST", authenticated: true, body: { clientRunId: "intent" } });
    expect(http.request.mock.calls[0][1].idempotencyKey).toBe(http.request.mock.calls[1][1].idempotencyKey);
  });

  it("validates cumulative completion count and matching run/transcript receipts", async () => {
    const transcript = Array.from({ length: 30 }, (_, index) => ({ ...shots[0], time: index * 4 }));
    const result = { runId: "run", highestLevelCompleted: 2, shotsToCompletion: 24, shotsUsed: 30, level: 3, pucks: 30,
      completed: false, failed: false, levelResults: [{ level: 1, shots: 10, totalShots: 10 }, { level: 2, shots: 14, totalShots: 24 }] };
    await expect(saveTipJarCheckpoint(client(result), "league", "run", transcript)).resolves.toEqual(result);
    await expect(saveTipJarCheckpoint(client(result), "league", "run", transcript.slice(0, 5))).resolves.toEqual(result);
    for (const patch of [{ runId: "other" }, { shotsUsed: 29 }, { shotsUsed: 61 }, { shotsUsed: 30.5 }, { shotsToCompletion: 14 }, { shotsToCompletion: 31 }, { levelResults: [] }]) {
      await expect(saveTipJarCheckpoint(client({ ...result, ...patch }), "league", "run", transcript)).rejects.toThrow();
    }
  });
});
