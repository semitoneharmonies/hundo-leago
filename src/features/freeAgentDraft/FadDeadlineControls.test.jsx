import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { SessionContext } from "../session/sessionContext.js";
import { FadDeadlineControls } from "./FadDeadlineControls.jsx";

const leagueId = "11111111-1111-4111-8111-111111111111";
const fadId = "22222222-2222-4222-8222-222222222222";
const status = { leagueId, fadId, held: true, processingAuthorized: false, canProceed: true,
  total: 2, complete: 1, unfinishedTeams: [{ teamId: "team-2", teamName: "Team North", status: "empty" }],
  blockedReason: null, deadlineAtMs: 1000, serverNowMs: 2000 };

function setup({ data = status, failFirst = false } = {}) {
  let attempts = 0;
  const request = vi.fn(async (url, options = {}) => {
    let result = data;
    if (url.endsWith("/preview")) result = { ...data, reason: options.body.reason, previewHash: "a".repeat(64) };
    if (url.endsWith("/proceed")) {
      attempts += 1;
      if (failFirst && attempts === 1) throw new Error("Connection interrupted");
      result = { leagueId, fadId, accepted: true, replayed: attempts > 1, id: "receipt" };
    }
    options.validateData?.(result);
    return { data: result };
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const user = userEvent.setup();
  render(<QueryClientProvider client={client}><SessionContext.Provider value={{ status: "authenticated", httpClient: { request } }}>
    <FadDeadlineControls leagueId={leagueId} fadId={fadId} />
  </SessionContext.Provider></QueryClientProvider>);
  return { user, request };
}
async function preview(user) {
  await user.type(await screen.findByRole("textbox", { name: "Reason for proceeding" }), "League agrees to proceed");
  await user.click(screen.getByRole("button", { name: "Review processing" }));
  return screen.findByRole("region", { name: "Deadline processing preview" });
}

describe("FAD deadline controls", () => {
  it("shows status without writes or hidden-card requests", async () => {
    const { request } = setup();
    expect(await screen.findByText("Processing is on hold")).toBeInTheDocument();
    expect(screen.getByText("1 of 2 cards are complete and valid.")).toBeInTheDocument();
    expect(request.mock.calls.every(([url, options]) => !options.method && url.endsWith("/deadline-control"))).toBe(true);
  });
  it("previews unfinished teams and keeps waiting without authorizing processing", async () => {
    const { user, request } = setup();
    const review = await preview(user);
    expect(within(review).getByText("Team North — Empty")).toBeInTheDocument();
    expect(request.mock.calls.some(([url]) => url.endsWith("/proceed"))).toBe(false);
    await user.click(within(review).getByRole("button", { name: "Keep waiting" }));
    expect(screen.queryByRole("button", { name: "Confirm processing" })).not.toBeInTheDocument();
    expect(request.mock.calls.some(([url]) => url.includes("candidate-cards") || url.includes("bids") || url.endsWith("/proceed"))).toBe(false);
  });
  it("discards the preview when the reason changes", async () => {
    const { user } = setup();
    await preview(user);
    await user.type(screen.getByRole("textbox", { name: "Reason for proceeding" }), " now");
    expect(screen.queryByRole("button", { name: "Confirm processing" })).not.toBeInTheDocument();
  });
  it("retries an uncertain confirmation with the same reviewed request", async () => {
    const { user, request } = setup({ failFirst: true });
    await preview(user);
    await user.click(screen.getByRole("button", { name: "Confirm processing" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Confirm processing" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Confirm processing" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Processing authorized.");
    const sends = request.mock.calls.filter(([url]) => url.endsWith("/proceed"));
    expect(sends).toHaveLength(2);
    expect(sends[0][1].body).toEqual(sends[1][1].body);
    expect(sends[0][1].idempotencyKey).toBe(sends[1][1].idempotencyKey);
  });
  it("prevents processing when timing requires attention", async () => {
    setup({ data: { ...status, canProceed: false, blockedReason: "Update draft timing before proceeding." } });
    expect(await screen.findByText("Update draft timing before proceeding.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Review processing" })).not.toBeInTheDocument();
  });
  it("rejects a status response belonging to another league", async () => {
    setup({ data: { ...status, leagueId: fadId } });
    expect(await screen.findByRole("alert")).toHaveTextContent("Deadline status is unavailable.");
    expect(screen.queryByRole("button", { name: "Review processing" })).not.toBeInTheDocument();
  });
});
