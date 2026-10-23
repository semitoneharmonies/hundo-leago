import { afterEach, describe, expect, it, vi } from "vitest";
import { createTipJarBridge, TIP_JAR_PROTOCOL } from "./tipJarBridge.js";

const origin = "https://hundoleago.com";
const requestId = "11111111-1111-4111-8111-111111111111";
const otherRequest = "22222222-2222-4222-8222-222222222222";
const run = { runId: "run-one", seed: 5, rulesetVersion: "campaign-v1", createdAt: 1 };
const shot = (time) => ({ time, x: .5, height: .4, power: 50 });
const tick = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
afterEach(() => vi.useRealTimers());
function deferred() { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
function setup(options = {}) {
  const frameWindow = { postMessage: vi.fn() };
  const startRun = vi.fn(async () => run);
  const saveCheckpoint = vi.fn(async (runId, shots) => ({ runId, shotsUsed: shots.length }));
  const onState = vi.fn(); const onSaved = vi.fn();
  const bridge = createTipJarBridge({ origin, frameWindow, startRun, saveCheckpoint, onState, onSaved, ...options });
  const send = (data, overrides = {}) => bridge.receive({ origin, source: frameWindow, data: { protocol: TIP_JAR_PROTOCOL, ...data }, ...overrides });
  return { bridge, send, frameWindow, startRun, saveCheckpoint, onState, onSaved };
}

describe("Tip Jar embedded run bridge", () => {
  it("accepts fullscreen presentation requests only from the current frame and accepts booleans only", () => {
    const onFullscreen = vi.fn();
    const test = setup({ onFullscreen });
    test.send({ type: "fullscreen", active: true }, { origin: "https://other.example" });
    test.send({ type: "fullscreen", active: true }, { source: {} });
    test.send({ protocol: "wrong", type: "fullscreen", active: true });
    test.send({ type: "fullscreen", active: "yes" });
    expect(onFullscreen).not.toHaveBeenCalled();
    test.send({ type: "fullscreen", active: true });
    expect(onFullscreen).toHaveBeenCalledWith(true);
    test.bridge.fullscreen(true);
    expect(test.frameWindow.postMessage).toHaveBeenCalledWith({ protocol: TIP_JAR_PROTOCOL, type: "fullscreen", active: true }, origin);
    expect(test.startRun).not.toHaveBeenCalled();
    expect(test.saveCheckpoint).not.toHaveBeenCalled();
    test.bridge.dispose();
    test.send({ type: "fullscreen", active: false });
    expect(onFullscreen).toHaveBeenCalledTimes(1);
  });
  it("accepts messages only from the exact game window, origin and protocol", async () => {
    const test = setup(); const message = { type: "start", requestId };
    test.send(message, { origin: "https://other.example" });
    test.send(message, { source: {} });
    test.send({ ...message, protocol: "unknown" });
    test.send({ ...message, requestId: "not-a-uuid" });
    expect(test.startRun).not.toHaveBeenCalled();
    test.send(message); await tick();
    expect(test.startRun).toHaveBeenCalledTimes(1);
    expect(test.frameWindow.postMessage).toHaveBeenCalledWith({ protocol: TIP_JAR_PROTOCOL, type: "start", requestId, run }, origin);
    test.bridge.dispose();
  });

  it("deduplicates start requests and retries an uncertain start with the same ID", async () => {
    const first = deferred();
    const startRun = vi.fn().mockReturnValueOnce(first.promise).mockResolvedValue(run);
    const test = setup({ startRun });
    test.send({ type: "start", requestId }); test.send({ type: "start", requestId });
    expect(startRun).toHaveBeenCalledTimes(1);
    first.reject(Error("network")); await tick();
    expect(test.onState).toHaveBeenLastCalledWith(expect.objectContaining({ kind: "start-error" }));
    test.bridge.retry(); await tick();
    expect(startRun.mock.calls.map((args) => args[0])).toEqual([requestId, requestId]);
    test.send({ type: "start", requestId }); await tick();
    expect(startRun).toHaveBeenCalledTimes(2);
    test.bridge.dispose();
  });

  it("serializes saves and coalesces the queued transcript without changing an active write", async () => {
    const first = deferred();
    const saveCheckpoint = vi.fn().mockReturnValueOnce(first.promise).mockImplementation(async (runId, shots) => ({ runId, shotsUsed: shots.length }));
    const test = setup({ saveCheckpoint });
    test.send({ type: "start", requestId }); await tick();
    const shots = [shot(1)];
    test.send({ type: "checkpoint", runId: run.runId, shots });
    shots[0].power = 99;
    test.send({ type: "checkpoint", runId: run.runId, shots: [shot(1), shot(4)] });
    test.send({ type: "checkpoint", runId: run.runId, shots: [shot(1), shot(4), shot(7)] });
    expect(saveCheckpoint).toHaveBeenCalledTimes(1);
    expect(saveCheckpoint.mock.calls[0][1][0].power).toBe(50);
    first.resolve({ runId: run.runId, shotsUsed: 1 }); await tick();
    expect(saveCheckpoint).toHaveBeenCalledTimes(2);
    expect(saveCheckpoint.mock.calls[1][1]).toHaveLength(3);
    expect(test.onState).toHaveBeenLastCalledWith(expect.objectContaining({ kind: "saved" }));
    test.bridge.dispose();
  });

  it("keeps an uncertain save visible and retries that exact payload before newer shots", async () => {
    const saveCheckpoint = vi.fn().mockRejectedValueOnce(Error("offline")).mockImplementation(async (runId, shots) => ({ runId, shotsUsed: shots.length }));
    const test = setup({ saveCheckpoint }); test.send({ type: "start", requestId }); await tick();
    test.send({ type: "checkpoint", runId: run.runId, shots: [shot(1)] }); await tick();
    expect(test.onState).toHaveBeenLastCalledWith(expect.objectContaining({ kind: "save-error" }));
    expect(test.frameWindow.postMessage.mock.calls.some(([value]) => value.type === "saved")).toBe(false);
    test.send({ type: "checkpoint", runId: run.runId, shots: [shot(1), shot(4)] });
    expect(saveCheckpoint).toHaveBeenCalledTimes(1);
    test.bridge.retry(); await tick(); await tick();
    expect(saveCheckpoint.mock.calls.map((args) => args[1].length)).toEqual([1, 1, 2]);
    expect(saveCheckpoint.mock.calls[0][1]).toBe(saveCheckpoint.mock.calls[1][1]);
    test.bridge.dispose();
  });

  it("rejects stale run IDs, malformed shots and changed historical shots", async () => {
    const test = setup(); test.send({ type: "start", requestId }); await tick();
    for (const message of [
      { runId: "old-run", shots: [shot(1)] }, { runId: run.runId, shots: [] },
      { runId: run.runId, shots: [{ ...shot(1), power: NaN }] },
      { runId: run.runId, shots: [shot(2), shot(1)] },
    ]) test.send({ type: "checkpoint", ...message });
    expect(test.saveCheckpoint).not.toHaveBeenCalled();
    test.send({ type: "checkpoint", runId: run.runId, shots: [shot(1)] }); await tick();
    test.send({ type: "checkpoint", runId: run.runId, shots: [{ ...shot(1), power: 70 }, shot(2)] });
    test.send({ type: "checkpoint", runId: run.runId, shots: [shot(1)] });
    expect(test.saveCheckpoint).toHaveBeenCalledTimes(1);
    test.bridge.dispose();
  });

  it("waits for an unsaved prior run before allowing a restart", async () => {
    const saveCheckpoint = vi.fn().mockRejectedValueOnce(Error("offline")).mockImplementation(async (runId, shots) => ({ runId, shotsUsed: shots.length }));
    const test = setup({ saveCheckpoint }); test.send({ type: "start", requestId }); await tick();
    test.send({ type: "checkpoint", runId: run.runId, shots: [shot(1)] }); await tick();
    test.send({ type: "start", requestId: otherRequest }); await tick();
    expect(test.startRun).toHaveBeenCalledTimes(1);
    expect(test.onState).toHaveBeenLastCalledWith(expect.objectContaining({ kind: "save-error" }));
    test.bridge.retry(); await tick(); await tick();
    expect(saveCheckpoint.mock.calls[0][1]).toBe(saveCheckpoint.mock.calls[1][1]);
    expect(test.startRun).toHaveBeenLastCalledWith(otherRequest, expect.any(AbortSignal));
    test.bridge.dispose();
  });

  it("discards late start responses after restart or account/league teardown", async () => {
    const old = deferred(); const newRun = { ...run, runId: "new-run" };
    const startRun = vi.fn().mockReturnValueOnce(old.promise).mockResolvedValue(newRun);
    const test = setup({ startRun }); test.send({ type: "start", requestId });
    test.send({ type: "start", requestId: otherRequest }); await tick();
    old.resolve(run); await tick();
    expect(test.frameWindow.postMessage.mock.calls.filter(([value]) => value.type === "start")).toHaveLength(1);
    expect(startRun.mock.calls[0][1].aborted).toBe(true);
    test.bridge.dispose();
    test.send({ type: "start", requestId });
    expect(startRun).toHaveBeenCalledTimes(2);
    expect(test.frameWindow.postMessage).toHaveBeenLastCalledWith({ protocol: TIP_JAR_PROTOCOL, type: "pause" }, origin);
  });

  it("aborts and ignores a pending save after disposal", async () => {
    const pending = deferred(); const saveCheckpoint = vi.fn(() => pending.promise);
    const test = setup({ saveCheckpoint }); test.send({ type: "start", requestId }); await tick();
    test.send({ type: "checkpoint", runId: run.runId, shots: [shot(1)] });
    test.bridge.dispose(); const count = test.onState.mock.calls.length;
    pending.resolve({ runId: run.runId, shotsUsed: 1 }); await tick();
    expect(saveCheckpoint.mock.calls[0][2].aborted).toBe(true);
    expect(test.onState).toHaveBeenCalledTimes(count);
    expect(test.frameWindow.postMessage.mock.calls.some(([value]) => value.type === "saved")).toBe(false);
  });

  it("times out a hanging start, retries the same intent and ignores its late response", async () => {
    vi.useFakeTimers();
    const pending = deferred();
    const startRun = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue(run);
    const test = setup({ startRun });
    test.send({ type: "start", requestId });
    await vi.advanceTimersByTimeAsync(15000);
    expect(startRun.mock.calls[0][1].aborted).toBe(true);
    expect(test.onState).toHaveBeenLastCalledWith(expect.objectContaining({ kind: "start-error" }));
    pending.resolve({ ...run, runId: "late-run" }); await tick();
    expect(test.frameWindow.postMessage.mock.calls.some(([value]) => value.type === "start")).toBe(false);
    test.bridge.retry(); await tick(); await tick();
    expect(startRun.mock.calls.map((args) => args[0])).toEqual([requestId, requestId]);
    expect(test.frameWindow.postMessage).toHaveBeenLastCalledWith({ protocol: TIP_JAR_PROTOCOL, type: "start", requestId, run }, origin);
    test.bridge.dispose();
  });

  it("times out a hanging save and retries the identical transcript without accepting late success", async () => {
    vi.useFakeTimers();
    const pending = deferred();
    const saveCheckpoint = vi.fn().mockReturnValueOnce(pending.promise).mockImplementation(async (runId, shots) => ({ runId, shotsUsed: shots.length }));
    const test = setup({ saveCheckpoint });
    test.send({ type: "start", requestId }); await tick(); await tick();
    test.send({ type: "checkpoint", runId: run.runId, shots: [shot(1)] });
    await vi.advanceTimersByTimeAsync(15000);
    expect(saveCheckpoint.mock.calls[0][2].aborted).toBe(true);
    expect(test.onState).toHaveBeenLastCalledWith(expect.objectContaining({ kind: "save-error" }));
    pending.resolve({ runId: run.runId, shotsUsed: 1 }); await tick();
    expect(test.frameWindow.postMessage.mock.calls.some(([value]) => value.type === "saved")).toBe(false);
    test.bridge.retry(); await tick(); await tick();
    expect(saveCheckpoint.mock.calls[0][1]).toBe(saveCheckpoint.mock.calls[1][1]);
    expect(test.frameWindow.postMessage.mock.calls.filter(([value]) => value.type === "saved")).toHaveLength(1);
    test.bridge.dispose();
  });
});
