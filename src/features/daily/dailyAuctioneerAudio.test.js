import { describe, expect, it, vi } from "vitest";
import { AUCTIONEER_URL, createAuctioneerLoop } from "./dailyAuctioneerAudio.js";

const untilSettled = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

function harness() {
  let time = 10_000, enabled = true;
  const sources = [], gains = [], statuses = [];
  const doc = { visibilityState: "visible" };
  const context = {
    state: "running", currentTime: 2, destination: {},
    decodeAudioData: vi.fn().mockResolvedValue({ duration: 106.22 }),
    createGain: vi.fn(() => {
      const gain = { gain: { setValueAtTime: vi.fn(), setTargetAtTime: vi.fn(), cancelScheduledValues: vi.fn() },
        connect: vi.fn(), disconnect: vi.fn() };
      gains.push(gain); return gain;
    }),
    createBufferSource: vi.fn(() => {
      const source = { connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), loop: false };
      sources.push(source); return source;
    }),
  };
  const browser = { fetch: vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }) };
  const loop = createAuctioneerLoop({ now: () => time, browser, doc, getContext: () => context,
    isEnabled: () => enabled, onStatus: value => statuses.push(value) });
  const live = (id = "room") => ({ id, joined: true, phase: "auction", auctionEndsAt: new Date(time + 60_000).toISOString() });
  return { loop, browser, doc, context, sources, gains, statuses, live,
    setTime: value => { time = value; }, setEnabled: value => { enabled = value; } };
}

describe("shared auctioneer background loop", () => {
  it("waits for a running context and a joined live unexpired room before loading", async () => {
    const h = harness();
    h.context.state = "suspended";
    h.loop.observe(h.live());
    expect(h.browser.fetch).not.toHaveBeenCalled();
    h.context.state = "running";
    h.loop.observe({ ...h.live(), joined: false });
    h.loop.observe({ ...h.live("waiting"), phase: "waiting" });
    h.loop.observe({ ...h.live("expired"), auctionEndsAt: new Date(9_999).toISOString() });
    h.loop.observe({ ...h.live("invalid"), auctionEndsAt: "invalid" });
    expect(h.browser.fetch).not.toHaveBeenCalled();
    h.loop.observe(h.live());
    await untilSettled();
    expect(h.browser.fetch).toHaveBeenCalledOnce();
    expect(h.browser.fetch).toHaveBeenCalledWith(AUCTIONEER_URL, expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(h.sources).toHaveLength(1);
    expect(h.sources[0].loop).toBe(true);
    expect(h.sources[0].start).toHaveBeenCalledOnce();
    expect(h.gains[0].gain.setTargetAtTime).toHaveBeenCalledWith(.10, 2, .04);
  });

  it("uses one recording for multiple rooms and stops only after the last live room ends", async () => {
    const h = harness();
    h.loop.observe(h.live("one"));
    h.loop.observe(h.live("two"));
    await untilSettled();
    h.loop.observe(h.live("one")); h.loop.sync();
    expect(h.sources).toHaveLength(1);
    expect(h.browser.fetch).toHaveBeenCalledOnce();
    h.loop.observe({ ...h.live("one"), phase: "locked" });
    expect(h.sources[0].stop).not.toHaveBeenCalled();
    h.loop.forget("two");
    expect(h.sources[0].stop).toHaveBeenCalledOnce();
    expect(h.statuses.at(-1)).toBe("idle");
    h.sources[0].onended();
    expect(h.sources[0].disconnect).toHaveBeenCalledOnce();
    expect(h.gains[0].disconnect).toHaveBeenCalledOnce();
    h.loop.observe(h.live("one")); // A late response cannot reopen a locked room.
    expect(h.sources).toHaveLength(1);
  });

  it.each(["locked", "finished", "void", "closed"])("stops on %s without replaying a late auction response", async phase => {
    const h = harness();
    h.loop.observe(h.live()); await untilSettled();
    h.loop.observe({ ...h.live(), phase });
    h.loop.observe(h.live());
    expect(h.sources[0].stop).toHaveBeenCalledOnce();
    expect(h.sources).toHaveLength(1);
  });

  it("stops at the known deadline even before a room response arrives", async () => {
    const h = harness();
    h.loop.observe(h.live()); await untilSettled();
    h.setTime(70_000); h.loop.sync();
    expect(h.sources[0].stop).toHaveBeenCalledOnce();
    expect(h.statuses.at(-1)).toBe("idle");
  });

  it("uses the puck-drop fallback and removes a room when membership is lost", async () => {
    const h = harness();
    h.loop.observe({ ...h.live(), auctionEndsAt: undefined, firstGameAt: new Date(70_000).toISOString() });
    await untilSettled();
    expect(h.sources).toHaveLength(1);
    h.loop.observe({ ...h.live(), joined: false });
    expect(h.sources[0].stop).toHaveBeenCalledOnce();
  });

  it("pauses while hidden or muted and reuses the decoded recording on resume", async () => {
    const h = harness();
    h.loop.observe(h.live()); await untilSettled();
    h.doc.visibilityState = "hidden"; h.loop.sync();
    expect(h.sources[0].stop).toHaveBeenCalledOnce();
    h.loop.sync(); expect(h.sources).toHaveLength(1);
    h.doc.visibilityState = "visible"; h.loop.sync();
    expect(h.sources).toHaveLength(2);
    h.setEnabled(false); h.loop.sync();
    expect(h.sources[1].stop).toHaveBeenCalledOnce();
    h.setEnabled(true); h.loop.sync();
    expect(h.sources).toHaveLength(3);
    expect(h.browser.fetch).toHaveBeenCalledOnce();
    expect(h.context.decodeAudioData).toHaveBeenCalledOnce();
  });

  it.each(["network", "http", "decode"])("retries %s failures only after an explicit retry", async failure => {
    const h = harness();
    if (failure === "network") h.browser.fetch.mockRejectedValueOnce(new Error("offline"));
    if (failure === "http") h.browser.fetch.mockResolvedValueOnce({ ok: false });
    if (failure === "decode") h.context.decodeAudioData.mockRejectedValueOnce(new Error("bad media"));
    h.loop.observe(h.live()); await untilSettled();
    expect(h.statuses.at(-1)).toBe("error");
    h.loop.sync(); h.loop.sync(); await untilSettled();
    expect(h.browser.fetch).toHaveBeenCalledOnce();
    expect(h.sources).toHaveLength(0);
    h.loop.retry(); await untilSettled();
    expect(h.browser.fetch).toHaveBeenCalledTimes(2);
    expect(h.sources).toHaveLength(1);
    expect(h.statuses.at(-1)).toBe("playing");
  });

  it("does not start when a pending decode completes after mute", async () => {
    const h = harness(), decoding = deferred();
    h.context.decodeAudioData.mockReturnValueOnce(decoding.promise);
    h.loop.observe(h.live()); await untilSettled();
    h.setEnabled(false); h.loop.sync();
    decoding.resolve({ duration: 106.22 }); await untilSettled();
    expect(h.sources).toHaveLength(0);
    h.setEnabled(true); h.loop.sync();
    expect(h.sources).toHaveLength(1);
    expect(h.browser.fetch).toHaveBeenCalledOnce();
  });

  it("aborts loading and ignores old decode completion after cleanup and reconnect", async () => {
    const h = harness(), decoding = deferred();
    h.context.decodeAudioData.mockReturnValueOnce(decoding.promise);
    h.loop.observe(h.live()); await untilSettled();
    const signal = h.browser.fetch.mock.calls[0][1].signal;
    h.loop.disconnect();
    expect(signal.aborted).toBe(true);
    expect(h.statuses.at(-1)).toBe("idle");
    h.loop.observe(h.live("new-room")); await untilSettled();
    expect(h.sources).toHaveLength(1);
    decoding.resolve({ duration: 999 }); await untilSettled();
    expect(h.sources).toHaveLength(1);
    expect(h.sources[0].buffer.duration).toBe(106.22);
    h.loop.disconnect();
    expect(h.sources[0].stop).toHaveBeenCalledOnce();
  });
});
