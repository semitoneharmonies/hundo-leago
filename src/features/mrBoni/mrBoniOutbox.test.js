import { describe, expect, it, vi } from "vitest";
import { createMrBoniOutbox, MAX_PENDING_MR_BONI_RUNS, MR_BONI_OUTBOX_PREFIX } from "./mrBoniOutbox.js";
import { createMrBoniBridge, MR_BONI_PROTOCOL } from "./mrBoniBridge.js";

function storage() {
  const values = new Map();
  return { get length() { return values.size; }, key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}
const command = (ticks) => [0, ticks, 1, 0, 0];
const scope = { userId: "manager-a", leagueId: "league-a", rulesetVersion: "resurface-v1" };
const origin = "https://hundoleago.com";
const requestId = "11111111-1111-4111-8111-111111111111";
const tick = async () => { for (let index = 0; index < 8; index++) await Promise.resolve(); };
function deferred() { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
function bridge(outbox, saveCheckpoint) {
  const frameWindow = { postMessage: vi.fn() };
  const startRun = vi.fn(async () => ({ runId: "run-a", seed: 1, rulesetVersion: "resurface-v1", createdAt: 1 }));
  const onState = vi.fn();
  const connection = createMrBoniBridge({ origin, frameWindow, outbox, saveCheckpoint, startRun, onState });
  return { connection, frameWindow, startRun, onState,
    send: (data) => connection.receive({ origin, source: frameWindow, data: { protocol: MR_BONI_PROTOCOL, ...data } }) };
}

describe("bounded Mr. Boni recovery outbox", () => {
  it("stores only the run and transcript, preserves the latest prefix and clears only acknowledged progress", () => {
    const store = storage(); const outbox = createMrBoniOutbox({ ...scope, storage: store });
    outbox.save("run-a", [command(1)]);
    const key = store.key(0);
    expect(key).toBe(`${MR_BONI_OUTBOX_PREFIX}manager-a:league-a:resurface-v1`);
    expect(JSON.parse(store.getItem(key))).toEqual({ runId: "run-a", commands: [command(1)] });
    outbox.save("run-a", [command(1), command(4)]);
    outbox.save("run-a", [command(1)]);
    outbox.acknowledge("run-a", [command(1)]);
    expect(outbox.load().commands).toHaveLength(2);
    expect(() => outbox.save("other", [command(1)])).toThrow();
    expect(() => outbox.save("run-a", [[0, 1, 0, 0, 0]])).toThrow();
    outbox.acknowledge("run-a", [command(1), command(4)]);
    expect(outbox.load()).toBeNull();
  });

  it("caps pending records without deleting another manager or league's unsaved score", () => {
    const store = storage();
    for (let index = 0; index < MAX_PENDING_MR_BONI_RUNS; index++) {
      createMrBoniOutbox({ ...scope, userId: `manager-${index}`, storage: store }).save(`run-${index}`, [command(1)]);
    }
    const before = Array.from({ length: store.length }, (_, index) => [store.key(index), store.getItem(store.key(index))]);
    const full = createMrBoniOutbox({ ...scope, userId: "overflow", storage: store });
    expect(() => full.save("next", [command(1)])).toThrow("full");
    expect(Array.from({ length: store.length }, (_, index) => [store.key(index), store.getItem(store.key(index))])).toEqual(before);
    createMrBoniOutbox({ ...scope, userId: "manager-0", storage: store }).save("run-0", [command(1), command(4)]);
    expect(store.length).toBe(MAX_PENDING_MR_BONI_RUNS);
  });

  it("persists immediately and recovers after navigation only for the same actor, league and ruleset", async () => {
    const store = storage(); const outbox = createMrBoniOutbox({ ...scope, storage: store });
    const pending = deferred(); const firstSave = vi.fn(() => pending.promise);
    const first = bridge(outbox, firstSave);
    first.send({ type: "start", requestId }); await tick();
    first.send({ type: "checkpoint", runId: "run-a", commands: [command(1)] });
    expect(outbox.load()).toEqual({ runId: "run-a", commands: [command(1)] });
    first.connection.dispose();
    expect(firstSave.mock.calls[0][2].aborted).toBe(true);
    const otherSave = vi.fn();
    for (const different of [{ userId: "manager-b" }, { leagueId: "league-b" }, { rulesetVersion: "future" }]) {
      const other = bridge(createMrBoniOutbox({ ...scope, ...different, storage: store }), otherSave);
      other.connection.dispose();
    }
    expect(otherSave).not.toHaveBeenCalled();
    expect(outbox.load()).not.toBeNull();
    const save = vi.fn(async (runId, commands) => ({ runId, commandsProcessed: commands.length }));
    const reopened = bridge(createMrBoniOutbox({ ...scope, storage: store }), save);
    await tick();
    expect(save).not.toHaveBeenCalled();
    reopened.connection.retry(); await tick();
    expect(save).toHaveBeenCalledWith("run-a", [command(1)], expect.any(AbortSignal));
    expect(outbox.load()).toBeNull();
    pending.resolve({ runId: "run-a", commandsProcessed: 1 }); await tick();
    expect(first.frameWindow.postMessage.mock.calls.some(([value]) => value.type === "saved")).toBe(false);
    reopened.connection.dispose();
  });

  it("recovers the full latest transcript after offline failure and waits before starting another run", async () => {
    const store = storage(); const outbox = createMrBoniOutbox({ ...scope, storage: store });
    const first = bridge(outbox, vi.fn(async () => { throw Error("offline"); }));
    first.send({ type: "start", requestId }); await tick();
    first.send({ type: "checkpoint", runId: "run-a", commands: [command(1)] }); await tick();
    first.send({ type: "checkpoint", runId: "run-a", commands: [command(1), command(4)] });
    first.connection.dispose();
    const retry = deferred(); const save = vi.fn(() => retry.promise);
    const reopened = bridge(createMrBoniOutbox({ ...scope, storage: store }), save);
    expect(save).not.toHaveBeenCalled();
    reopened.send({ type: "start", requestId });
    expect(reopened.startRun).not.toHaveBeenCalled();
    expect(save.mock.calls[0][1]).toEqual([command(1), command(4)]);
    retry.resolve({ runId: "run-a", commandsProcessed: 2 }); await tick();
    expect(reopened.startRun).toHaveBeenCalledTimes(1);
    expect(outbox.load()).toBeNull();
    reopened.connection.dispose();
  });

  it("keeps storage failures visible while retaining the pending write in memory", async () => {
    const broken = { load: () => null, save: () => { throw Error("quota"); }, acknowledge: () => {} };
    const first = bridge(broken, vi.fn(async () => { throw Error("offline"); }));
    first.send({ type: "start", requestId }); await tick();
    first.send({ type: "checkpoint", runId: "run-a", commands: [command(1)] }); await tick();
    expect(first.onState).toHaveBeenLastCalledWith(expect.objectContaining({ kind: "save-error", message: expect.stringContaining("local recovery is unavailable") }));
    expect(first.connection.hasPending).toBe(true);
    first.connection.dispose();
  });

  it("verifies every queued prefix when stale recovery returns a server count ahead of local commands", async () => {
    const store = storage(); const outbox = createMrBoniOutbox({ ...scope, storage: store });
    outbox.save("run-a", [command(1)]);
    const first = deferred(); const second = deferred(); const third = deferred();
    const save = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise).mockReturnValueOnce(third.promise);
    const reopened = bridge(outbox, save);
    expect(save).not.toHaveBeenCalled();
    reopened.connection.retry();
    reopened.send({ type: "checkpoint", runId: "run-a", commands: [command(1), command(4)] });
    first.resolve({ runId: "run-a", commandsProcessed: 3 }); await tick();
    expect(outbox.load().commands).toHaveLength(2);
    expect(save.mock.calls[1][1]).toEqual([command(1), command(4)]);
    second.resolve({ runId: "run-a", commandsProcessed: 3 }); await tick();
    expect(outbox.load()).toBeNull();
    // The receipt's count alone must not accept an unverified third command.
    const fork = [command(1), command(4), [0, 7, -1, 0, 0]];
    reopened.send({ type: "checkpoint", runId: "run-a", commands: fork });
    expect(save.mock.calls[2][1]).toEqual(fork);
    third.reject(Error("Immutable transcript conflict")); await tick();
    expect(reopened.connection.hasPending).toBe(true);
    expect(outbox.load().commands).toEqual(fork);
    expect(reopened.onState).toHaveBeenLastCalledWith(expect.objectContaining({ kind: "save-error" }));
    reopened.connection.dispose();
  });
});
