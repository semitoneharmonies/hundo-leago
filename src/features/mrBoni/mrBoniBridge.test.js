import { describe, expect, it, vi } from "vitest";
import { createMrBoniBridge, MR_BONI_PROTOCOL } from "./mrBoniBridge.js";
import { createMrBoniOutbox } from "./mrBoniOutbox.js";
import { copyMrBoniCommands, extendsMrBoniTranscript } from "./mrBoniTranscript.js";

const origin = "https://hundoleago.com";
const requestId = "11111111-1111-4111-8111-111111111111";
const commands = [[0, 60, 1, 0, 0], [1, 0], [2]];
const run = { runId: "run-one", rulesetVersion: "resurface-v1", createdAt: 1 };
const tick = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
function setup(options = {}) {
  const frameWindow = { postMessage: vi.fn() };
  const startRun = vi.fn(async () => run);
  const saveCheckpoint = vi.fn(async (runId, commands) => ({ runId, commandsProcessed: commands.length }));
  const onState = vi.fn();
  const bridge = createMrBoniBridge({ origin, frameWindow, startRun, saveCheckpoint, onState, ...options });
  const send = (data, overrides = {}) => bridge.receive({ origin, source: frameWindow, data: { protocol: MR_BONI_PROTOCOL, ...data }, ...overrides });
  return { bridge, frameWindow, startRun, saveCheckpoint, send, onState };
}
function storage() {
  const data = new Map();
  return { get length() { return data.size; }, key: (i) => [...data.keys()][i], getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
}

describe("Mr. Boni command boundary", () => {
  it("checks readiness on reconnect without creating or changing a run", () => {
    const onReady = vi.fn();
    const test = setup({ onReady });
    expect(test.frameWindow.postMessage).toHaveBeenCalledWith({ protocol: MR_BONI_PROTOCOL, type: "hello" }, origin);
    expect(test.startRun).not.toHaveBeenCalled();
    expect(test.saveCheckpoint).not.toHaveBeenCalled();
    test.send({ type: "ready" });
    expect(onReady).toHaveBeenCalledOnce();
    expect(test.onState).toHaveBeenLastCalledWith({ kind: "ready", message: "Ready to play." });
    test.bridge.dispose();
  });

  it("bounds commands and preserves an immutable exact prefix", () => {
    const source = structuredClone(commands);
    const copied = copyMrBoniCommands(source);
    source[0][1] = 500;
    expect(copied[0][1]).toBe(60);
    expect(Object.isFrozen(copied[0])).toBe(true);
    expect(extendsMrBoniTranscript(commands, commands.slice(0, 1))).toBe(true);
    expect(extendsMrBoniTranscript([[0, 59, 1, 0, 0]], commands.slice(0, 1))).toBe(false);
    for (const invalid of [[], [[0, 601, 1, 0, 0]], [[0, 60, 2, 0, 0]], [[1, 3]], [[2, 1]], [[5]], [[0, 1.5, 0, 0, 0]], Array.from({ length: 361 }, () => [0, 600, 1, 0, 0]), Array.from({ length: 24001 }, () => [2])]) {
      expect(copyMrBoniCommands(invalid)).toBeNull();
    }
  });

  it("rejects other windows/origins/protocols and relays visible status without credentials", async () => {
    const onLeaderboard = vi.fn();
    const test = setup({ onLeaderboard });
    for (const overrides of [{ origin: "https://other.example" }, { source: {} }]) test.send({ type: "start", requestId }, overrides);
    test.send({ type: "start", requestId, protocol: "tipjar-league-v1" });
    expect(test.startRun).not.toHaveBeenCalled();
    test.send({ type: "start", requestId }); await tick();
    expect(test.frameWindow.postMessage).toHaveBeenCalledWith({ protocol: MR_BONI_PROTOCOL, type: "start", requestId, run }, origin);
    expect(test.frameWindow.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: "state", kind: "ready" }), origin);
    test.send({ type: "leaderboard" }, { source: {} });
    expect(onLeaderboard).not.toHaveBeenCalled();
    test.send({ type: "leaderboard" }); expect(onLeaderboard).toHaveBeenCalledOnce();
    test.bridge.dispose();
  });

  it("serializes checkpoints, rejects rewritten commands and retries the exact uncertain write first", async () => {
    let finish;
    const saveCheckpoint = vi.fn().mockRejectedValueOnce(Error("offline")).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }))
      .mockImplementation(async (runId, commands) => ({ runId, commandsProcessed: commands.length }));
    const test = setup({ saveCheckpoint });
    test.send({ type: "start", requestId }); await tick();
    test.send({ type: "checkpoint", runId: run.runId, commands: commands.slice(0, 1) }); await tick();
    test.send({ type: "checkpoint", runId: run.runId, commands: [[0, 59, 1, 0, 0], [2]] });
    test.send({ type: "checkpoint", runId: run.runId, commands });
    expect(saveCheckpoint).toHaveBeenCalledTimes(1);
    expect(test.onState).toHaveBeenLastCalledWith(expect.objectContaining({ kind: "save-error" }));
    test.bridge.retry(); await tick();
    expect(saveCheckpoint.mock.calls[1][1]).toEqual(commands.slice(0, 1));
    finish({ runId: run.runId, commandsProcessed: 1 }); await tick();
    expect(saveCheckpoint.mock.calls[2][1]).toEqual(commands);
    expect(test.bridge.hasPending).toBe(false);
    test.bridge.dispose();
  });

  it("recovers pending progress only for the same manager, league and ruleset", async () => {
    const store = storage();
    const scope = { userId: "manager-a", leagueId: "league-a", rulesetVersion: "resurface-v1", storage: store };
    const outbox = createMrBoniOutbox(scope);
    outbox.save(run.runId, commands);
    outbox.save(run.runId, commands.slice(0, 1));
    expect(outbox.load().commands).toEqual(commands);
    for (const different of [{ userId: "manager-b" }, { leagueId: "league-b" }, { rulesetVersion: "future" }]) {
      expect(createMrBoniOutbox({ ...scope, ...different }).load()).toBeNull();
    }
    const test = setup({ outbox }); await tick();
    expect(test.saveCheckpoint).not.toHaveBeenCalled();
    test.bridge.retry(); await tick();
    expect(test.saveCheckpoint).toHaveBeenCalledWith(run.runId, commands, expect.any(AbortSignal));
    expect(outbox.load()).toBeNull();
    expect(test.startRun).not.toHaveBeenCalled();
    test.bridge.dispose();
  });
});
