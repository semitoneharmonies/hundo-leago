import { afterEach, describe, expect, it, vi } from "vitest";
import { analyticsAllowed, analyticsCategory, createAggregateSender, startAggregatePageCounter } from "./aggregateCollector.js";

function harness({ visible = true } = {}) {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  const doc = new EventTarget();
  const win = new EventTarget();
  doc.visibilityState = visible ? "visible" : "hidden";
  let focused = visible;
  doc.hasFocus = () => focused;
  Object.assign(win, { setTimeout, clearTimeout, setInterval, clearInterval });
  const send = vi.fn();
  const stop = startAggregatePageCounter({ page: { product: "daily", category: "room" }, send, documentTarget: doc, windowTarget: win, now: () => Date.now() });
  return {
    send, stop, doc, win,
    visibility(value) { doc.visibilityState = value ? "visible" : "hidden"; focused = value; doc.dispatchEvent(new Event("visibilitychange")); },
    focus(value) { focused = value; win.dispatchEvent(new Event(value ? "focus" : "blur")); },
    seconds() { return send.mock.calls.reduce((sum, [body]) => sum + body.activeSeconds, 0); },
    views() { return send.mock.calls.reduce((sum, [body]) => sum + body.pageViews, 0); },
  };
}
afterEach(() => vi.useRealTimers());

describe("aggregate category privacy", () => {
  it("replaces private route identifiers with fixed categories", () => {
    expect(analyticsCategory("/daily/rooms/private-room" )).toEqual({ product: "daily", category: "room" });
    expect(analyticsCategory("/leagues/private-league/teams/private-team/roster")).toEqual({ product: "leago", category: "rosters" });
    expect(analyticsCategory("/leagues/secret/drafts/free-agent/private/cards/private")).toEqual({ product: "leago", category: "drafts" });
    expect(analyticsCategory("/public/leagues/a/teams/b/roster")).toEqual({ product: "leago", category: "rosters" });
    expect(analyticsCategory("/account")).toEqual({ product: "shared", category: "account" });
  });
  it("excludes admin, token actions, queries and unknown routes", () => {
    for (const path of ["/admin/analytics", "/verify-email", "/reset-password", "/setup-account", "/reactivate", "/account?email=secret", "/daily#secret", "/leagues/a/security", "/leagues/a/unrecognized", "/unknown"]) {
      expect(analyticsCategory(path)).toBeNull();
    }
  });
  it("respects existing privacy signals without storing a preference", () => {
    expect(analyticsAllowed({ globalPrivacyControl: true })).toBe(false);
    expect(analyticsAllowed({ doNotTrack: "1" })).toBe(false);
    expect(analyticsAllowed({})).toBe(true);
  });
});

describe("credential-free aggregate transport", () => {
  it("sends exactly four aggregate fields with no credentials or referrer", () => {
    const fetchImpl = vi.fn().mockResolvedValue({ status: 204 });
    createAggregateSender("https://api.example.test", fetchImpl)({ product: "daily", category: "room", pageViews: 1, activeSeconds: 0, userId: "secret", url: "/private" });
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.example.test/api/v1/analytics/aggregate");
    expect(options).toMatchObject({ credentials: "omit", referrerPolicy: "no-referrer", redirect: "error", cache: "no-store", keepalive: true });
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(options.body)).toEqual({ product: "daily", category: "room", pageViews: 1, activeSeconds: 0 });
  });
  it("contains failures and does not retry or persist a queue", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("offline"));
    const send = createAggregateSender("https://api.example.test", fetchImpl);
    expect(() => send({ product: "shared", category: "home", pageViews: 1, activeSeconds: 0 })).not.toThrow();
    await Promise.resolve();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe("estimated active page time", () => {
  it("caps inactivity at two minutes and resumes on interaction", () => {
    const h = harness();
    vi.advanceTimersByTime(300_000);
    expect(h.views()).toBe(1);
    expect(h.seconds()).toBe(120);
    h.doc.dispatchEvent(new Event("pointerdown"));
    vi.advanceTimersByTime(30_000);
    expect(h.seconds()).toBe(150);
    expect(h.send.mock.calls.every(([body]) => body.activeSeconds <= 60)).toBe(true);
    h.stop();
  });
  it("does not count background or unfocused time", () => {
    const h = harness();
    vi.advanceTimersByTime(10_000);
    h.visibility(false);
    vi.advanceTimersByTime(90_000);
    expect(h.seconds()).toBe(10);
    h.visibility(true);
    vi.advanceTimersByTime(10_000);
    h.focus(false);
    vi.advanceTimersByTime(90_000);
    expect(h.seconds()).toBe(20);
    h.stop();
  });
  it("counts a page opened in the background only when first visible", () => {
    const h = harness({ visible: false });
    vi.advanceTimersByTime(30_000);
    expect(h.send).not.toHaveBeenCalled();
    h.visibility(true);
    expect(h.views()).toBe(1);
    vi.advanceTimersByTime(10_000);
    h.stop();
    expect(h.seconds()).toBe(10);
  });
  it("drops suspended clock gaps and flushes only measured time", () => {
    const h = harness();
    vi.advanceTimersByTime(10_000);
    vi.setSystemTime(3_600_000);
    h.doc.dispatchEvent(new Event("keydown"));
    h.stop();
    expect(h.seconds()).toBe(10);
  });
  it("cancels StrictMode replay and removes timers/listeners on unmount", () => {
    const h = harness();
    h.stop();
    vi.advanceTimersByTime(0);
    expect(h.send).not.toHaveBeenCalled();
    vi.advanceTimersByTime(120_000);
    h.doc.dispatchEvent(new Event("pointerdown"));
    h.visibility(true);
    expect(h.send).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("flushes on pagehide without counting time while away", () => {
    const h = harness();
    vi.advanceTimersByTime(15_000);
    h.win.dispatchEvent(new Event("pagehide"));
    vi.advanceTimersByTime(60_000);
    expect(h.seconds()).toBe(15);
    h.stop();
  });
});
