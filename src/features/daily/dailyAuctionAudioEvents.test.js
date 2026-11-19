import { describe, expect, it, vi } from "vitest";
import { createAuctionAudioTracker } from "./dailyAuctionAudioEvents.js";

const at = ms => new Date(ms).toISOString();
function room(overrides = {}) {
  return { id: "room", joined: true, phase: "auction", auctionStartsAt: at(10_000), auctionEndsAt: at(70_000),
    auctions: [], members: [{ id: "me", roster: [] }, { id: "other", roster: [] }], ...overrides };
}
function setup() {
  let time = 0;
  const play = vi.fn();
  const tracker = createAuctionAudioTracker({ play, now: () => time });
  return { tracker, play, setTime: value => { time = value; }, sounds: () => play.mock.calls.map(([cue]) => cue) };
}

describe("Daily auction audio observations", () => {
  it("seeds initial lots and rosters silently and only slots newly observed lots once", () => {
    const { tracker, sounds } = setup();
    const first = room({ auctions: [{ id: "old", ownBid: 2 }], members: [{ id: "me", roster: [{ id: "signed" }] }] });
    tracker.observe(first, "me");
    expect(sounds()).toEqual([]);
    const next = { ...first, auctions: [...first.auctions, { id: "new", ownBid: null }] };
    tracker.observe(next, "me"); tracker.observe(next, "me"); tracker.observe(first, "me"); tracker.observe(next, "me");
    expect(sounds()).toEqual(["slot"]);
  });
  it("requires a known own bid and an authoritative roster award for win or denied", () => {
    const { tracker, sounds } = setup();
    tracker.observe(room({ auctions: [{ id: "win", ownBid: 4 }, { id: "lose", ownBid: 7 }, { id: "not-mine", ownBid: null }] }), "me");
    tracker.observe(room(), "me");
    expect(sounds()).toEqual([]); // Missing lots are not evidence of a loss.
    const awarded = room({ members: [{ id: "me", roster: [{ id: "win" }] }, { id: "other", roster: [{ id: "lose" }, { id: "not-mine" }] }] });
    tracker.observe(awarded, "me"); tracker.observe(awarded, "me");
    expect(sounds()).toEqual(["win", "denied"]);
  });
  it("confirms only the explicit successful-bid callback and remembers fast awards", () => {
    const { tracker, sounds } = setup();
    tracker.observe(room(), "me");
    tracker.confirmedBid("room", "fast");
    tracker.observe(room({ members: [{ id: "me", roster: [{ id: "fast" }] }] }), "me");
    expect(sounds()).toEqual(["confirmed", "win"]);
  });
  it("beeps once per remaining second for the final five seconds before starting", () => {
    const { tracker, sounds, setTime } = setup();
    tracker.observe(room({ phase: "waiting" }), "me");
    for (const time of [4000, 5000, 5100, 6000, 7000, 8000, 9000, 10000]) { setTime(time); tracker.tick(); }
    expect(sounds()).toEqual(Array(5).fill("countdown"));
    tracker.observe(room(), "me"); tracker.observe(room(), "me");
    expect(sounds().at(-1)).toBe("start");
    expect(sounds().filter(cue => cue === "start")).toHaveLength(1);
  });
  it("uses beep-and-heartbeat closing cues and the authoritative final horn", () => {
    const { tracker, sounds, setTime } = setup();
    tracker.observe(room(), "me");
    for (let second = 65; second <= 70; second++) { setTime(second * 1000); tracker.tick(); }
    expect(sounds()).toEqual(Array(5).fill("closing"));
    tracker.observe(room({ phase: "locked" }), "me"); tracker.observe(room({ phase: "finished" }), "me");
    expect(sounds()).toEqual([...Array(5).fill("closing"), "end"]);
  });
  it("ends early without a pretend countdown and ignores an older auction response", () => {
    const { tracker, sounds, setTime } = setup();
    tracker.observe(room(), "me");
    setTime(20_000); tracker.observe(room({ phase: "locked" }), "me");
    tracker.observe(room({ auctions: [{ id: "late", ownBid: 3 }] }), "me");
    setTime(66_000); tracker.tick();
    expect(sounds()).toEqual(["end"]);
  });
  it("does not replay elapsed countdown seconds or background outcomes", () => {
    const { tracker, sounds, setTime } = setup();
    tracker.observe(room({ phase: "waiting", auctions: [{ id: "old", ownBid: 4 }] }), "me");
    setTime(8000); tracker.tick();
    expect(sounds()).toEqual(["countdown"]);
    tracker.rebaseline();
    tracker.observe(room({ phase: "locked", members: [{ id: "other", roster: [{ id: "old" }] }] }), "me");
    expect(sounds()).toEqual(["countdown"]);
  });
  it("isolates rooms and does not announce a room reopened from history", () => {
    const { tracker, sounds } = setup();
    tracker.observe(room(), "me"); tracker.observe(room({ id: "second" }), "me");
    tracker.observe(room({ id: "second", auctions: [{ id: "new" }] }), "me");
    tracker.forget("second");
    tracker.observe(room({ id: "second", phase: "finished", members: [{ id: "me", roster: [{ id: "new" }] }] }), "me");
    tracker.observe(room({ id: "outsider", joined: false, phase: "waiting" }), "me");
    tracker.observe(room({ id: "outsider", joined: false }), "me");
    expect(sounds()).toEqual(["slot"]);
  });
  it("starts a newly created practice room once, without replaying on navigation", () => {
    const { tracker, sounds } = setup();
    const created = room({ mode: "practice" });
    tracker.roomCreated(created,"me"); tracker.roomCreated(created,"me");
    tracker.observe(created,"me"); tracker.forget(created.id); tracker.observe(created,"me");
    tracker.roomCreated(room({id:"scheduled",phase:"waiting"}),"me");
    expect(sounds()).toEqual(["start"]);
  });
});
