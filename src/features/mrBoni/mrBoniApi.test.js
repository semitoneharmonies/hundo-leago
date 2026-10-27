import { describe, expect, it, vi } from "vitest";
import { mrBoniLeaderboardQuery, publicMrBoniLeaderboardQuery, saveMrBoniCheckpoint, startMrBoniRun, validateMrBoniEntry } from "./mrBoniApi.js";

const runId = "55555555-5555-4555-8555-555555555555";
const commands = [[0, 60, 1, 0, 0]];
const client = (data) => ({ request: vi.fn(async (_path, options) => { options.validateData(data); return { data }; }) });
const score = { rank: 1, managerId: "manager", managerName: "Ice Driver", highestLevelCompleted: 2, cumulativeTimeMs: 170500, completed: false, updatedAt: 1 };

describe("Mr. Boni API contracts", () => {
  it("keeps league queries private and separate from the public board and other games", async () => {
    const api = client({ rulesetVersion: "resurface-v1", entries: [score] });
    const league = mrBoniLeaderboardQuery(api, "league-a");
    expect(league.queryKey).toEqual(["league", "league-a", "mr-boni", "resurface-v1"]);
    expect(league.meta).toEqual({ private: true, leagueId: "league-a" });
    await league.queryFn({ signal: undefined });
    expect(api.request.mock.calls[0][0]).toBe("/api/v1/leagues/league-a/mr-boni/leaderboard");
    expect(api.request.mock.calls[0][1].authenticated).toBe(true);
    expect(publicMrBoniLeaderboardQuery(api).queryKey).toEqual(["games", "mr-boni", "public", "resurface-v1"]);
  });
  it("starts an unseeded run and sends guest capability only on explicit guest writes", async () => {
    const api = client({ runId, rulesetVersion: "resurface-v1", createdAt: 1 });
    await startMrBoniRun(api, null, "request", undefined, "private-capability");
    expect(api.request.mock.calls[0][1].body).toEqual({ clientRunId: "request", guestKey: "private-capability" });
    expect(api.request.mock.calls[0][1].authenticated).toBe(false);
    await startMrBoniRun(api, "league-a", "request", undefined, "unused");
    expect(api.request.mock.calls[1][1].body).toEqual({ clientRunId: "request" });
  });
  it("sends controls without a client score and accepts authoritative completed-level time", async () => {
    const result = { runId, rulesetVersion: "resurface-v1", commandsProcessed: 2, highestLevelCompleted: 1, cumulativeTimeMs: 93123, completed: false };
    const api = client(result);
    expect(await saveMrBoniCheckpoint(api, "league-a", runId, commands)).toEqual(result);
    expect(api.request.mock.calls[0][1].body).toEqual({ commands });
    expect(api.request.mock.calls[0][1].idempotencyKey).toBe(`mrboni-checkpoint:${runId}:1`);
    for (const bad of [{ ...result, commandsProcessed: 0 }, { ...result, rulesetVersion: "other" }, { ...result, cumulativeTimeMs: -1 }, { ...result, completed: true }]) {
      await expect(saveMrBoniCheckpoint(client(bad), "league-a", runId, commands)).rejects.toThrow();
    }
  });
  it("rejects inconsistent time/level rows and empty results on the public board", async () => {
    expect(validateMrBoniEntry(score)).toBe(true);
    for (const bad of [{ ...score, cumulativeTimeMs: null }, { ...score, cumulativeTimeMs: 1.5 }, { ...score, highestLevelCompleted: 4 }, { ...score, highestLevelCompleted: 0 }]) {
      expect(() => validateMrBoniEntry(bad)).toThrow();
    }
    const api = client({ rulesetVersion: "resurface-v1", entries: [{ playerId: "guest", playerName: "Guest", isGuest: true, rank: 1, highestLevelCompleted: 0, cumulativeTimeMs: null, completed: false, updatedAt: 1 }] });
    await expect(publicMrBoniLeaderboardQuery(api).queryFn({})).rejects.toThrow();
  });
});
