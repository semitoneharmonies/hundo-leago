import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDailyAudio } from "./dailyAuctionSounds.js";

function harness(saved) {
  const contexts = [], storage = new Map(saved ? [["hundo-daily-sound:me", saved]] : []);
  const doc = new EventTarget(); doc.visibilityState = "visible";
  const param = () => ({ value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn(), setTargetAtTime: vi.fn() });
  class AudioContext {
    constructor() { this.state = "suspended"; this.currentTime = 1; this.destination = {}; this.oscillators = []; this.gains = []; contexts.push(this); }
    resume() { this.state = "running"; return Promise.resolve(); }
    close() { this.state = "closed"; return Promise.resolve(); }
    createGain() { const node = { gain: param(), connect: vi.fn(), disconnect: vi.fn() }; this.gains.push(node); return node; }
    createOscillator() { const node = { frequency: param(), connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn() }; this.oscillators.push(node); return node; }
  }
  const browser = { AudioContext, localStorage: { getItem: key => storage.get(key), setItem: (key,value) => storage.set(key,value) } };
  const audio = createDailyAudio({ userId: "me", now: () => Date.now(), browser, doc });
  return { audio, browser, doc, contexts, storage };
}
const room = (auctions = []) => ({ id: "r", joined: true, phase: "auction", auctions, members: [], auctionEndsAt: new Date(Date.now()+100_000).toISOString() });

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe("quiet, user-controlled Daily sounds", () => {
  it("defaults on without creating audio until unlocked and never replays old events", async () => {
    const { audio, contexts } = harness();
    expect(audio.getSnapshot()).toEqual({ enabled: true, available: true });
    audio.observe(room(), "me"); audio.observe(room([{id:"already-seen"}]), "me");
    await vi.advanceTimersByTimeAsync(100); expect(contexts).toHaveLength(0);
    await audio.unlock(); await vi.advanceTimersByTimeAsync(100);
    expect(contexts[0].oscillators).toHaveLength(0);
    audio.observe(room([{id:"already-seen"},{id:"new"}]), "me");
    await vi.advanceTimersByTimeAsync(100);
    expect(contexts[0].oscillators).toHaveLength(2);
    expect(contexts[0].gains[0].gain.value).toBe(.12);
    expect(contexts[0].oscillators.every(node => node.type === "sine")).toBe(true);
  });
  it("respects saved off, persists preference and immediately silences queued cues", async () => {
    const { audio, contexts, storage } = harness("off");
    await audio.unlock(); expect(contexts).toHaveLength(0);
    audio.setEnabled(true); await Promise.resolve();
    audio.observe(room(), "me"); audio.confirmedBid("r","p"); audio.setEnabled(false);
    await vi.advanceTimersByTimeAsync(100);
    expect(contexts[0].oscillators).toHaveLength(0);
    expect(storage.get("hundo-daily-sound:me")).toBe("off");
  });
  it("coalesces simultaneous confirmations and new-lot cues across rooms", async () => {
    const { audio, contexts } = harness(); await audio.unlock();
    audio.observe(room(),"me"); audio.observe({...room(),id:"other"},"me");
    audio.observe(room([{id:"p"}]),"me"); audio.observe({...room([{id:"q"}]),id:"other"},"me");
    audio.confirmedBid("r","p"); audio.confirmedBid("other","q");
    await vi.advanceTimersByTimeAsync(100);
    const frequencies = contexts[0].oscillators.map(node=>node.frequency.setValueAtTime.mock.calls[0][0]);
    expect(frequencies).toEqual([490,740]);
  });
  it("stops playing voices on mute and suppresses hidden-tab events", async () => {
    const { audio, contexts, doc } = harness();
    const disconnect = audio.connect(); await audio.unlock();
    audio.observe(room(),"me"); audio.confirmedBid("r","p"); await vi.advanceTimersByTimeAsync(100);
    const voices = contexts[0].oscillators;
    expect(voices).toHaveLength(2);
    audio.setEnabled(false);
    expect(voices.every(node=>node.stop.mock.calls.length === 2)).toBe(true);
    audio.setEnabled(true);
    doc.visibilityState = "hidden"; doc.dispatchEvent(new Event("visibilitychange"));
    audio.confirmedBid("r","q"); await vi.advanceTimersByTimeAsync(500);
    expect(voices).toHaveLength(2);
    disconnect(); expect(contexts[0].state).toBe("closed");
  });
  it("handles missing Web Audio and rejected resume without affecting navigation or bids", async () => {
    const { browser, doc } = harness(); delete browser.AudioContext;
    const unavailable = createDailyAudio({ userId:"me", now:Date.now, browser, doc });
    expect(unavailable.getSnapshot().available).toBe(false);
    await expect(unavailable.unlock()).resolves.toBeUndefined();
    const blocked = harness(); blocked.browser.AudioContext.prototype.resume = () => Promise.reject(new Error("autoplay"));
    await expect(blocked.audio.unlock()).resolves.toBeUndefined();
    blocked.audio.confirmedBid("r","p"); await vi.advanceTimersByTimeAsync(100);
    expect(blocked.contexts[0].oscillators).toHaveLength(0);
  });
});
