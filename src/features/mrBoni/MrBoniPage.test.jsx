import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { SessionContext } from "../session/sessionContext.js";
import { MrBoniPage } from "./MrBoniPage.jsx";
import { MR_BONI_PROTOCOL } from "./mrBoniBridge.js";

const leagueA = "11111111-1111-4111-8111-111111111111";
const leagueB = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
const requestId = "44444444-4444-4444-8444-444444444444";
const run = { runId: "55555555-5555-4555-8555-555555555555", seed: 8, rulesetVersion: "resurface-v1", createdAt: 1 };
const league = (id, name) => ({ id, name, status: "active", version: 1, currentSeason: null,
  membership: { id: userId, version: 1, status: "active", permissionCategory: "manager" } });
const entries = [
  { rank: 1, managerId: userId, managerName: "Winning Manager", highestLevelCompleted: 3, cumulativeTimeMs: 360001, completed: true, updatedAt: 1 },
  { rank: 2, managerId: "other", managerName: "Almost There", highestLevelCompleted: 2, cumulativeTimeMs: 240001, completed: false, updatedAt: 1 },
  { rank: 3, managerId: "new", managerName: "New Player", highestLevelCompleted: 0, cumulativeTimeMs: null, completed: false, updatedAt: 1 },
];
function setup({ status = "authenticated", allowed = true, failSave = false, startDeferred = null } = {}) {
  let saves = 0;
  const request = vi.fn(async (path, options) => {
    let data;
    if (path === "/api/v1/leagues") data = { code: "LEAGUES_FOUND", leagues: allowed ? [league(leagueA, "Alpha League"), league(leagueB, "Beta League")] : [] };
    else if (path.endsWith("/leaderboard")) data = { rulesetVersion: "resurface-v1", entries: path.includes(leagueA) ? entries : [] };
    else if (path.endsWith("/runs")) data = startDeferred ? await startDeferred : run;
    else if (path.endsWith("/checkpoint")) {
      if (failSave && saves++ === 0) throw Error("network");
      data = { runId: run.runId, rulesetVersion: "resurface-v1", highestLevelCompleted: 0, cumulativeTimeMs: null, commandsProcessed: 1,
        completed: false };
    } else throw Error(`Unexpected request ${path}`);
    options.validateData(data);
    return { data };
  });
  const httpClient = { request };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const session = { status, httpClient, user: { id: userId }, session: { id: "session-one" } };
  const view = (value = session) => <QueryClientProvider client={queryClient}><SessionContext.Provider value={value}>
    <MemoryRouter initialEntries={[`/leagues/${leagueA}/mr-boni`]}>
      <Link to={`/leagues/${leagueB}/mr-boni`}>Switch to Beta</Link>
      <Routes><Route path="/leagues/:leagueId/mr-boni" element={<MrBoniPage />} /><Route path="/" element={<h1>Sign in</h1>} /></Routes>
    </MemoryRouter>
  </SessionContext.Provider></QueryClientProvider>;
  const rendered = render(view());
  return { ...rendered, request, queryClient, session, view };
}
function message(frame, data) {
  fireEvent(window, new MessageEvent("message", { origin: window.location.origin, source: frame.contentWindow,
    data: { protocol: MR_BONI_PROTOCOL, ...data } }));
}

describe("Mr. Boni league page", () => {
  it("uses a full-viewport fallback without remounting the game and restores the surrounding page", async () => {
    const test = setup();
    const frame = await screen.findByTitle("Mr. Boni ice resurfacing game");
    const post = vi.spyOn(frame.contentWindow, "postMessage");
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "scroll";
    try {
      fireEvent.click(screen.getByRole("button", { name: "Fullscreen", exact: true }));
      expect(screen.getByRole("dialog", { name: "Mr. Boni fullscreen game" })).toHaveClass("is-fullscreen");
      expect(screen.getByTitle("Mr. Boni ice resurfacing game")).toBe(frame);
      expect(document.body.style.overflow).toBe("hidden");
      expect(frame.closest("main").querySelector("header")).toHaveAttribute("inert");
      expect(post).toHaveBeenCalledWith({ protocol: MR_BONI_PROTOCOL, type: "fullscreen", active: true }, window.location.origin);
      fireEvent.click(screen.getByRole("button", { name: "Exit fullscreen" }));
      expect(screen.queryByRole("dialog", { name: "Mr. Boni fullscreen game" })).toBeNull();
      expect(document.body.style.overflow).toBe("scroll");
      expect(frame.closest("main").querySelector("header")).not.toHaveAttribute("inert");
      expect(screen.getByRole("button", { name: "Fullscreen", exact: true })).toHaveFocus();
      expect(post).toHaveBeenCalledWith({ protocol: MR_BONI_PROTOCOL, type: "pause" }, window.location.origin);
      expect(test.request.mock.calls.every(([, options]) => !options.method)).toBe(true);
    } finally { document.body.style.overflow = oldOverflow; }
  });

  it("lets a ready child enter and leave fullscreen and keeps the emergency close out of its HUD", async () => {
    setup();
    const frame = await screen.findByTitle("Mr. Boni ice resurfacing game");
    const post = vi.spyOn(frame.contentWindow, "postMessage");
    message(frame, { type: "ready" });
    message(frame, { type: "fullscreen", active: true });
    expect(screen.getByRole("dialog", { name: "Mr. Boni fullscreen game" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Exit fullscreen" })).toBeNull();
    message(frame, { type: "fullscreen", active: false });
    expect(screen.queryByRole("dialog", { name: "Mr. Boni fullscreen game" })).toBeNull();
    expect(post).toHaveBeenCalledWith({ protocol: MR_BONI_PROTOCOL, type: "fullscreen", active: false }, window.location.origin);
    message(frame, { type: "fullscreen", active: true });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Mr. Boni fullscreen game" })).toBeNull();
    expect(post).toHaveBeenCalledWith({ protocol: MR_BONI_PROTOCOL, type: "pause" }, window.location.origin);
  });

  it("leaves the fallback when native fullscreen exits without touching an unrelated fullscreen element", async () => {
    setup();
    const frame = await screen.findByTitle("Mr. Boni ice resurfacing game");
    const viewport = frame.parentElement;
    let native = null;
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => native });
    viewport.requestFullscreen = vi.fn(async () => { native = viewport; fireEvent(document, new Event("fullscreenchange")); });
    try {
      fireEvent.click(screen.getByRole("button", { name: "Fullscreen", exact: true }));
      await waitFor(() => expect(viewport.requestFullscreen).toHaveBeenCalledOnce());
      expect(viewport).toHaveClass("is-fullscreen");
      native = null;
      fireEvent(document, new Event("fullscreenchange"));
      expect(viewport).not.toHaveClass("is-fullscreen");
      native = document.createElement("div");
      fireEvent(document, new Event("fullscreenchange"));
      expect(viewport).not.toHaveClass("is-fullscreen");
    } finally { delete document.fullscreenElement; }
  });

  it("restores scroll and ignores a removed fullscreen frame on account replacement", async () => {
    const test = setup();
    const oldFrame = await screen.findByTitle("Mr. Boni ice resurfacing game");
    const oldOverflow = document.body.style.overflow;
    message(oldFrame, { type: "fullscreen", active: true });
    expect(document.body.style.overflow).toBe("hidden");
    test.rerender(test.view({ ...test.session, user: { id: "replacement" } }));
    await waitFor(() => expect(screen.getByTitle("Mr. Boni ice resurfacing game")).not.toBe(oldFrame));
    expect(document.body.style.overflow).toBe(oldOverflow);
    expect(screen.queryByRole("dialog", { name: "Mr. Boni fullscreen game" })).toBeNull();
    message(oldFrame, { type: "fullscreen", active: true });
    expect(screen.queryByRole("dialog", { name: "Mr. Boni fullscreen game" })).toBeNull();
  });

  it("shows authoritative cumulative scores and loads only read endpoints on viewing", async () => {
    const test = setup();
    const frame = await screen.findByTitle("Mr. Boni ice resurfacing game");
    expect(frame).toHaveAttribute("src", "/games/mr-boni/resurface-v1/index.html?league=1");
    expect(screen.getByRole("heading", { name: "Alpha League leaderboard" })).toBeInTheDocument();
    await screen.findByText("Almost There");
    const row = screen.getByText("Almost There").closest("tr");
    expect(within(row).getByText("Level 2 completed")).toBeInTheDocument();
    expect(within(row).getByText("4:00.001")).toBeInTheDocument();
    expect(screen.getByText("Level 3 completed")).toBeInTheDocument();
    expect(within(screen.getByText("New Player").closest("tr")).getByText("—")).toBeInTheDocument();
    expect(test.request.mock.calls.every(([, options]) => !options.method)).toBe(true);
  });

  it("does not load the game or leaderboard without league access", async () => {
    const test = setup({ allowed: false });
    await screen.findByRole("heading", { name: "League access unavailable" });
    expect(screen.queryByTitle("Mr. Boni ice resurfacing game")).toBeNull();
    expect(test.request.mock.calls.some(([path]) => path.includes("mr-boni"))).toBe(false);
  });

  it("redirects a signed-out viewer without loading private data", async () => {
    const test = setup({ status: "unauthenticated" });
    await screen.findByRole("heading", { name: "Sign in" });
    expect(test.request).not.toHaveBeenCalled();
  });

  it("displays a failed save honestly and retries the same transcript and idempotency key", async () => {
    const test = setup({ failSave: true });
    const frame = await screen.findByTitle("Mr. Boni ice resurfacing game");
    message(frame, { type: "start", requestId });
    await screen.findByText("League run ready.");
    const commands = [[0,60,1,0,0]];
    message(frame, { type: "checkpoint", runId: run.runId, commands });
    await screen.findByText("Progress has not been saved. Keep this page open and retry.");
    expect(screen.queryByText("Progress saved to your league.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry save" }));
    await screen.findByText("Progress saved to your league.");
    const writes = test.request.mock.calls.filter(([path]) => path.endsWith("/checkpoint"));
    expect(writes).toHaveLength(2);
    expect(writes[0][1].body).toEqual(writes[1][1].body);
    expect(writes[0][1].idempotencyKey).toBe(writes[1][1].idempotencyKey);
  });

  it("tears down the old league frame and discards late start replies when switching leagues", async () => {
    let resolve;
    const pending = new Promise((done) => { resolve = done; });
    const test = setup({ startDeferred: pending });
    const oldFrame = await screen.findByTitle("Mr. Boni ice resurfacing game");
    const post = vi.spyOn(oldFrame.contentWindow, "postMessage");
    message(oldFrame, { type: "start", requestId });
    await screen.findByText("Starting your league run…");
    fireEvent.click(screen.getByRole("link", { name: "Switch to Beta" }));
    await screen.findByRole("heading", { name: "Beta League leaderboard" });
    expect(screen.getByTitle("Mr. Boni ice resurfacing game")).not.toBe(oldFrame);
    await act(async () => resolve(run));
    expect(post.mock.calls.some(([value]) => value.type === "start")).toBe(false);
    expect(post).toHaveBeenCalledWith({ protocol: MR_BONI_PROTOCOL, type: "pause" }, window.location.origin);
    expect(screen.queryByText("Almost There")).toBeNull();
    expect(test.request.mock.calls.find(([path]) => path.endsWith("/runs"))[1].signal.aborted).toBe(true);
  });

  it("removes the iframe and aborts pending work on session loss or account replacement", async () => {
    const test = setup();
    const firstFrame = await screen.findByTitle("Mr. Boni ice resurfacing game");
    const post = vi.spyOn(firstFrame.contentWindow, "postMessage");
    test.rerender(test.view({ ...test.session, user: { id: "replacement" } }));
    await waitFor(() => expect(screen.getByTitle("Mr. Boni ice resurfacing game")).not.toBe(firstFrame));
    expect(post).toHaveBeenCalledWith({ protocol: MR_BONI_PROTOCOL, type: "pause" }, window.location.origin);
    test.rerender(test.view({ ...test.session, status: "unauthenticated" }));
    await screen.findByRole("heading", { name: "Sign in" });
    expect(screen.queryByTitle("Mr. Boni ice resurfacing game")).toBeNull();
  });
});
