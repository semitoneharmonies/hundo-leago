import { afterEach, describe, expect, it, vi } from "vitest";
import { ANALYTICS_PAGE_CATALOG, ANALYTICS_EXCLUDED_PAGES } from "./analyticsPageCatalog.js";
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
    expect(analyticsCategory("/leagues/private-league/teams/private-team/roster")).toEqual({ product: "leago", category: "team_roster" });
    expect(analyticsCategory("/leagues/secret/drafts/free-agent/private/cards/private")).toEqual({ product: "leago", category: "draft_card" });
    expect(analyticsCategory("/public/leagues/a/teams/b/roster")).toEqual({ product: "leago", category: "public_roster" });
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


describe("complete fixed page catalog", () => {
  const routes = [
    ["shared", "home", "/"], ["shared", "leagues", "/leagues"], ["shared", "account", "/account"],
    ["shared", "notifications", "/notifications"], ["shared", "install", "/install"],
    ["shared", "tip_jar", "/games/tip-jar"], ["shared", "mr_boni", "/games/mr-boni"],
    ["daily", "lobby", "/daily"], ["daily", "room", "/daily/rooms/private"],
    ...["history", "profile", "notifications", "create", "practice"].map(category => ["daily", category, "/daily/" + category]),
    ["leago", "dashboard", "/leagues/private"],
    ...["teams", "matchups", "standings", "activity"].map(category => ["leago", category, "/leagues/private/" + category]),
    ["leago", "team_roster", "/leagues/private/teams/private/roster"],
    ["leago", "public_roster", "/public/leagues/private/teams/private/roster"],
    ["leago", "players_list", "/leagues/private/players"], ["leago", "player_detail", "/leagues/private/players/private"],
    ["leago", "auctions_list", "/leagues/private/auctions"], ["leago", "auction_detail", "/leagues/private/auctions/private"],
    ["leago", "trades_list", "/leagues/private/trades"], ["leago", "trade_detail", "/leagues/private/trades/private"],
    ["leago", "drafts_free_agent", "/leagues/private/drafts"], ["leago", "drafts_entry", "/leagues/private/drafts/entry"],
    ["leago", "draft_current", "/leagues/private/free-agent-draft"], ["leago", "draft_room", "/leagues/private/free-agent-draft/private"],
    ["leago", "draft_results", "/leagues/private/free-agent-draft/private/results"],
    ["leago", "draft_allocation_results", "/leagues/private/drafts/free-agent/private/results"],
    ["leago", "draft_card", "/leagues/private/drafts/free-agent/private/cards/private"],
    ["leago", "commissioner_overview", "/leagues/private/commissioner"],
    ...["calendar", "scoring", "auctions", "rosters", "fad", "communications", "readiness", "history", "help", "recovery", "pause", "season", "export"]
      .map(section => ["leago", "commissioner_" + section, "/leagues/private/commissioner/" + section]),
  ];
  it("covers each current page type once and leaves historical combined categories separate", () => {
    expect(routes).toHaveLength(48);
    expect(ANALYTICS_PAGE_CATALOG).toHaveLength(55);
    expect(routes.map(([product,category])=>product+"/"+category).sort()).toEqual(
      ANALYTICS_PAGE_CATALOG.filter(row=>row.kind!=="legacy").map(row=>row.product+"/"+row.category).sort());
    expect(ANALYTICS_PAGE_CATALOG.filter(row=>row.kind==="legacy")).toHaveLength(7);
    expect(ANALYTICS_EXCLUDED_PAGES).toContain("Admin analytics");
    for (const [product,category,pathname] of routes) {
      expect(analyticsCategory(pathname), pathname).toEqual({product,category});
      if (pathname !== "/") expect(analyticsCategory(pathname+"/"), pathname+"/").toEqual({product,category});
    }
  });
  it("shares canonical page types across equivalent aliases and separates each mini game", () => {
    expect(analyticsCategory("/leagues/private/drafts/free-agent")).toEqual({product:"leago",category:"drafts_free_agent"});
    expect(analyticsCategory("/leagues/private/free-agent-draft/private/cards/private")).toEqual({product:"leago",category:"draft_card"});
    for(const [route,category]of [["tip-jar","tip_jar"],["mr-boni","mr_boni"]]) {
      expect(analyticsCategory("/leagues/private/"+route)).toEqual({product:"shared",category});
      expect(analyticsCategory("/games/"+route)).toEqual({product:"shared",category});
    }
  });
  it("excludes unrecognized suffixes, redirect-only routes and all private action routes", () => {
    for(const pathname of ["/free-agents","/standings","/matchups","/leagues/a/drafts/unknown","/leagues/a/drafts/free-agent/private/unknown","/leagues/a/commissioner/private-secret","/daily/rooms/id/private","/admin/analytics","/verify-email/token","/reset-password/token"]){
      expect(analyticsCategory(pathname),pathname).toBeNull();
    }
  });
  it("refuses a raw URL or unknown category before it can leave the browser", () => {
    const fetchImpl=vi.fn();const send=createAggregateSender("https://api.example.test",fetchImpl);
    for(const input of [{product:"shared",category:"/games/private?email=private"},{product:"daily",category:"player_detail"},{product:"private",category:"home"}]) send({...input,pageViews:1,activeSeconds:0});
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
