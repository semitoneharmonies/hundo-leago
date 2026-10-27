import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionContext } from "../session/sessionContext.js";
import { PublicTipJarPage } from "./TipJarPage.jsx";
import { TIP_JAR_PROTOCOL } from "./tipJarBridge.js";

const runId = "55555555-5555-4555-8555-555555555555";
const requestId = "44444444-4444-4444-8444-444444444444";
const run = { runId, seed: 8, rulesetVersion: "campaign-v1", createdAt: 1 };
const result = { runId, highestLevelCompleted: 1, shotsToCompletion: 3, shotsUsed: 3,
  level: 2, pucks: 37, completed: false, failed: false, levelResults: [{ level: 1, shots: 3, totalShots: 3 }], qualifies: true, named: false };
const shots = Array.from({ length: 3 }, (_, time) => ({ time, x: 0, height: .3, power: 40 }));
function message(frame, data) {
  fireEvent(window, new MessageEvent("message", { origin: window.location.origin, source: frame.contentWindow,
    data: { protocol: TIP_JAR_PROTOCOL, ...data } }));
}
function setup({ qualifies = true, named = false, failName = false, stallName = false, failSave = false } = {}) {
  let playerName = null, failedName = false, failedSave = false;
  const request = vi.fn(async (path, options) => {
    let data;
    if (path === "/api/v1/games/tip-jar/leaderboard") data = { rulesetVersion: "campaign-v1", entries: playerName ? [{ rank: 1, playerId: "guest:opaque", playerName, isGuest: true, highestLevelCompleted: 1, shotsToCompletion: 3, completed: false, updatedAt: 1 }] : [] };
    else if (path.endsWith("/runs")) data = run;
    else if (path.endsWith("/checkpoint")) {
      if (failSave && !failedSave) { failedSave = true; throw Error("network"); }
      data = { ...result, qualifies, named };
    } else if (path.endsWith("/name")) {
      if (stallName && !failedName) { failedName = true; return new Promise(() => {}); }
      if (failName && !failedName) { failedName = true; throw Error("network"); }
      playerName = options.body.name;
      data = { saved: true, qualifies: true };
    } else throw Error(`Private or unexpected request: ${path}`);
    options.validateData(data);
    return { data };
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(<QueryClientProvider client={queryClient}><SessionContext.Provider value={{ status: "unauthenticated", httpClient: { request } }}>
    <MemoryRouter><PublicTipJarPage /></MemoryRouter>
  </SessionContext.Provider></QueryClientProvider>);
  return { ...view, request };
}
async function play() {
  const frame = await screen.findByTitle("Tip Jar hockey game");
  message(frame, { type: "start", requestId });
  await screen.findByText("Run ready.");
  message(frame, { type: "checkpoint", runId, shots });
  return frame;
}
beforeEach(() => localStorage.clear());
afterEach(() => vi.useRealTimers());

describe("public Tip Jar", () => {
  it("allows anonymous viewing with only a public read and creates no identity until play", async () => {
    const test = setup();
    await screen.findByText("No runs yet. Be the first to play.");
    expect(screen.getByTitle("Tip Jar hockey game")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hundo Leago leaderboard" })).toBeInTheDocument();
    expect(test.request.mock.calls.map(([path]) => path)).toEqual(["/api/v1/games/tip-jar/leaderboard"]);
    expect(localStorage.getItem("hl:tipjar:guest:v1")).toBeNull();
    expect(screen.queryByLabelText("Leaderboard name")).toBeNull();
  });

  it("prompts a qualifying guest, retries naming, and renders an explicit Guest suffix without exposing capability to the frame", async () => {
    const test = setup({ failName: true });
    const frame = await screen.findByTitle("Tip Jar hockey game");
    const post = vi.spyOn(frame.contentWindow, "postMessage");
    await play();
    const input = await screen.findByLabelText("Leaderboard name");
    fireEvent.change(input, { target: { value: "  Ice Friend  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save name" }));
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Leaderboard name")).toHaveValue("  Ice Friend  ");
    fireEvent.click(screen.getByRole("button", { name: "Save name" }));
    await screen.findByText("Your name is on the Hundo Leago leaderboard.");
    const board = screen.getByRole("region", { name: "Hundo Leago leaderboard" });
    expect(await within(board).findByText("Ice Friend")).toBeInTheDocument();
    expect(within(board).getByText("(Guest)")).toBeInTheDocument();
    const writes = test.request.mock.calls.filter(([, options]) => options.method === "POST");
    const key = writes[0][1].body.guestKey;
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(writes.every(([, options]) => !options.authenticated && options.body.guestKey === key)).toBe(true);
    expect(writes.at(-1)[1].body.name).toBe("Ice Friend");
    expect(JSON.stringify(post.mock.calls)).not.toContain(key);
    expect(localStorage.getItem("hl:tipjar:guest-claim:v1")).toBeNull();
  });

  it.each([{ qualifies: false, named: false }, { qualifies: true, named: true }])("does not prompt when qualification/name state is %j", async (options) => {
    setup(options); await play();
    await screen.findByText("Progress saved.");
    expect(screen.queryByLabelText("Leaderboard name")).toBeNull();
  });

  it("keeps an uncertain guest checkpoint retryable with the same owner and transcript", async () => {
    const test = setup({ failSave: true }); await play();
    await screen.findByRole("button", { name: "Retry save" });
    expect(screen.queryByLabelText("Leaderboard name")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry save" }));
    await screen.findByLabelText("Leaderboard name");
    const saves = test.request.mock.calls.filter(([path]) => path.endsWith("/checkpoint"));
    expect(saves).toHaveLength(2);
    expect(saves[1][1].body).toEqual(saves[0][1].body);
  });

  it("retains an unclaimed qualifying result across page visits without another write on viewing", async () => {
    const first = setup(); await play(); await screen.findByLabelText("Leaderboard name"); first.unmount();
    const next = setup();
    await screen.findByLabelText("Leaderboard name");
    await waitFor(() => expect(next.request).toHaveBeenCalledTimes(1));
    expect(next.request.mock.calls[0][1].method).toBeUndefined();
  });

  it("makes a stalled name request retryable instead of leaving its button disabled", async () => {
    const test = setup({ stallName: true }); await play();
    fireEvent.change(await screen.findByLabelText("Leaderboard name"), { target: { value: "Ice Friend" } });
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Save name" }));
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    await act(async () => vi.advanceTimersByTime(15000));
    expect(screen.getByRole("alert")).toHaveTextContent("Saving your name timed out");
    expect(screen.getByRole("button", { name: "Save name" })).toBeEnabled();
    expect(test.request.mock.calls.find(([path]) => path.endsWith("/name"))[1].signal.aborted).toBe(true);
    vi.useRealTimers();
    fireEvent.click(screen.getByRole("button", { name: "Save name" }));
    await screen.findByText("Your name is on the Hundo Leago leaderboard.");
  });
});
