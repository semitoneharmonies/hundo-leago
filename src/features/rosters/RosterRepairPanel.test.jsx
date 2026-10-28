import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { RosterRepairPanel } from "./RosterRepairPanel.jsx";
import { validateRosterRepairApplied, validateRosterRepairPreview } from "./rosterRepairApi.js";

const leagueId = "11111111-1111-4111-8111-111111111111";
const teamId = "22222222-2222-4222-8222-222222222222";
const seasonId = "33333333-3333-4333-8333-333333333333";
const ownershipId = "44444444-4444-4444-8444-444444444444";
const playerId = "55555555-5555-4555-8555-555555555555";
const otherId = "66666666-6666-4666-8666-666666666666";
const scope = { leagueId, teamId, seasonId };
const revision = "a".repeat(64);
const workspace = () => ({ league: { id: leagueId }, team: { id: teamId }, season: { id: seasonId },
  canManage: true, legality: { legal: false, reasons: [{ code: "SALARY_CAP_EXCEEDED" }] },
  players: [{ ownershipId, playerId, ownershipVersion: 1, rosterCategory: "Active" }], orderVersion: 1 });
const proposal = (changes = {}) => ({ code: "ROSTER_REPAIR_PREVIEW", ...scope, revision, status: "ready", canApply: true,
  strategy: "scheduled_games", timing: "future_week", message: "The current locked week is unchanged. These moves target the next week.",
  week: { id: otherId, label: "Week 4", startsAtMs: Date.parse("2026-11-02T08:00:00Z"), endsAtMs: Date.parse("2026-11-09T08:00:00Z"), locksAtMs: Date.parse("2026-11-02T08:00:00Z") },
  moves: [{ ownershipId, playerId, name: "Active Player", from: "Active", to: "Bench", scheduledGames: 2 }],
  before: { capUsageCents: 11000, capLimitCents: 10000, scheduledGames: 30 },
  after: { capUsageCents: 9900, capLimitCents: 10000, scheduledGames: 34 }, blockers: [], ...changes });
const receipt = () => ({ code: "ROSTER_REPAIR_APPLIED", ...scope, moved: 1, legality: { legal: true }, lateLock: { status: "completed", lockId: otherId } });

function setup({ data = workspace(), preview = async () => proposal(), apply = async () => receipt() } = {}) {
  const client = { request: vi.fn(async (path, options) => {
    const data = await (path.endsWith("repair-preview") ? preview : apply)(options);
    options.validateData(data);
    return { data };
  }) };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  queryClient.setQueryData(["league", leagueId, "test"], { unchanged: true });
  queryClient.setQueryData(["league", otherId, "test"], { other: true });
  const onApplied = vi.fn();
  const element = (nextData, pending = false) => <QueryClientProvider client={queryClient}>
    <RosterRepairPanel workspace={nextData} httpClient={client} pending={pending} onApplied={onApplied} />
  </QueryClientProvider>;
  const view = render(element(data));
  return { ...view, client, queryClient, onApplied, user: userEvent.setup(),
    update: (nextData, pending) => view.rerender(element(nextData, pending)),
    applies: () => client.request.mock.calls.filter(([path]) => path.endsWith("/repair")) };
}

describe("roster repair review", () => {
  it("requires authority, loads only on request, and applies once after explicit review", async () => {
    let finish;
    const view = setup({ data: { ...workspace(), canManage: false }, apply: () => new Promise(resolve => { finish = resolve; }) });
    expect(screen.queryByRole("button", { name: "Suggest a fix" })).not.toBeInTheDocument();
    expect(view.client.request).not.toHaveBeenCalled();
    view.update(workspace());
    expect(view.client.request).not.toHaveBeenCalled();
    await view.user.click(screen.getByRole("button", { name: "Suggest a fix" }));
    expect(await screen.findByText("Active Player")).toBeInTheDocument();
    expect(screen.getByText("Your locked lineup stays unchanged.")).toBeVisible();
    const cap = screen.getByText("Cap", { exact: true }).parentElement;
    expect(within(cap).getByText("$110.00")).toBeVisible();
    expect(within(cap).getByRole("definition")).toHaveTextContent("$110.00 → $99.00");
    expect(within(cap).getByText("$100.00 limit")).toBeVisible();
    expect(screen.getByText("Scheduled games", { exact: true })).toBeVisible();
    expect(screen.getByText("Available active players")).toBeVisible();
    const caveat = screen.getByText(/not guaranteed appearances/);
    expect(caveat).not.toBeVisible();
    expect(screen.getByText(/current locked week is unchanged/)).not.toBeVisible();
    await view.user.click(screen.getByText("Details", { exact: true }));
    expect(caveat).toBeVisible();
    expect(screen.getByText(/current locked week is unchanged/)).toBeVisible();
    expect(view.applies()).toHaveLength(0);
    expect(view.client.request.mock.calls[0]).toEqual([`/api/v1/leagues/${leagueId}/teams/${teamId}/roster/repair-preview`, expect.objectContaining({ method: "POST", body: {}, authenticated: true })]);
    const button = screen.getByRole("button", { name: "Apply these moves" });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(button).toBeDisabled());
    expect(view.applies()).toHaveLength(1);
    expect(view.applies()[0][1].body).toEqual({ expectedRevision: revision, confirmed: true });
    expect(screen.getByText("Active Player")).toBeInTheDocument();
    await act(async () => finish(receipt()));
    await waitFor(() => expect(view.onApplied).toHaveBeenCalledWith(expect.stringContaining("Roster fixed. 1 player was moved.")));
    expect(view.onApplied).toHaveBeenCalledWith(expect.stringContaining("A late roster lock was created; earlier games stay excluded."));
    expect(screen.queryByRole("region", { name: "Roster fix review" })).not.toBeInTheDocument();
    expect(view.queryClient.getQueryState(["league", leagueId, "test"]).isInvalidated).toBe(true);
    expect(view.queryClient.getQueryState(["league", otherId, "test"]).isInvalidated).toBe(false);
    expect(view.client.request.mock.calls.every(([path]) => /\/repair(-preview)?$/.test(path))).toBe(true);
  });

  it("retains a proposal after a failed apply and retries only when clicked", async () => {
    let attempts = 0;
    const view = setup({ apply: async () => { if (++attempts === 1) throw new Error("Private failure"); return { ...receipt(), lateLock: { status: "awaiting_data" } }; } });
    await view.user.click(screen.getByRole("button", { name: "Suggest a fix" }));
    await view.user.click(await screen.findByRole("button", { name: "Apply these moves" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("The fix could not be confirmed");
    expect(screen.getByText("Active Player")).toBeInTheDocument();
    expect(screen.queryByText("Private failure")).not.toBeInTheDocument();
    expect(view.onApplied).not.toHaveBeenCalled();
    expect(view.applies()).toHaveLength(1);
    await view.user.click(screen.getByRole("button", { name: "Apply these moves" }));
    await waitFor(() => expect(view.onApplied).toHaveBeenCalledTimes(1));
    expect(view.onApplied).toHaveBeenCalledWith(expect.stringContaining("Late roster locking is waiting for scoring data"));
    expect(view.applies()).toHaveLength(2);
  });

  it("requires a fresh review after a stale plan and uses the new revision", async () => {
    let attempts = 0;
    const view = setup({ preview: async () => proposal({ revision: attempts ? "b".repeat(64) : revision }),
      apply: async () => { if (++attempts === 1) throw Object.assign(new Error("Stale"), { code: "ROSTER_REPAIR_STALE" }); return receipt(); } });
    await view.user.click(screen.getByRole("button", { name: "Suggest a fix" }));
    await view.user.click(await screen.findByRole("button", { name: "Apply these moves" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Refresh the suggestion before applying");
    expect(screen.queryByRole("button", { name: "Apply these moves" })).not.toBeInTheDocument();
    await view.user.click(screen.getByRole("button", { name: "Refresh suggestion" }));
    expect(await screen.findByRole("button", { name: "Apply these moves" })).toBeEnabled();
    expect(view.applies()).toHaveLength(1);
    await view.user.click(screen.getByRole("button", { name: "Apply these moves" }));
    await waitFor(() => expect(view.onApplied).toHaveBeenCalledTimes(1));
    expect(view.applies()[1][1].body.expectedRevision).toBe("b".repeat(64));
  });

  it.each(["team", "league", "season", "version", "authority"])("discards a reviewed proposal after a %s change", async change => {
    const view = setup();
    await view.user.click(screen.getByRole("button", { name: "Suggest a fix" }));
    await screen.findByRole("button", { name: "Apply these moves" });
    const next = workspace();
    if (["team", "league", "season"].includes(change)) next[change].id = otherId;
    if (change === "version") next.players[0].ownershipVersion += 1;
    if (change === "authority") next.canManage = false;
    view.update(next);
    expect(screen.queryByRole("button", { name: "Apply these moves" })).not.toBeInTheDocument();
    expect(screen.queryByText("Active Player")).not.toBeInTheDocument();
    expect(view.applies()).toHaveLength(0);
  });

  it("ignores a late preview after switching teams", async () => {
    let finish;
    const view = setup({ preview: () => new Promise(resolve => { finish = resolve; }) });
    await view.user.click(screen.getByRole("button", { name: "Suggest a fix" }));
    view.update({ ...workspace(), team: { id: otherId } });
    await act(async () => finish(proposal()));
    expect(screen.queryByText("Active Player")).not.toBeInTheDocument();
    expect(view.onApplied).not.toHaveBeenCalled();
    expect(view.applies()).toHaveLength(0);
  });

  it.each(["no_solution", "unavailable", "already_legal"])("explains %s without enabling apply", async status => {
    const view = setup({ preview: async () => proposal({ status, revision: null, canApply: false, moves: [],
      strategy: "legality_only", timing: "no_week", week: null, blockers: ["Review the remaining roster issues with your commissioner."],
      before: { capUsageCents: 11000, capLimitCents: 10000, scheduledGames: null },
      after: { capUsageCents: 11000, capLimitCents: 10000, scheduledGames: null } }) });
    await view.user.click(screen.getByRole("button", { name: "Suggest a fix" }));
    const explanation = await screen.findByText("How to fix it", { exact: true });
    expect(screen.getByText("Review the remaining roster issues with your commissioner.")).not.toBeVisible();
    await view.user.click(explanation);
    expect(screen.getByText("Review the remaining roster issues with your commissioner.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Apply these moves" })).not.toBeInTheDocument();
    expect(screen.queryByText("Scheduled games", { exact: true })).not.toBeInTheDocument();
    if (status === "unavailable") expect(screen.queryByText("Cap", { exact: true })).not.toBeInTheDocument();
    else expect(screen.getByText("Cap", { exact: true })).toBeVisible();
    expect(view.applies()).toHaveLength(0);
  });

  it("shows a preview failure and retries without applying", async () => {
    let attempts = 0;
    const view = setup({ preview: async () => { if (++attempts === 1) throw new Error("Offline"); return proposal(); } });
    await view.user.click(screen.getByRole("button", { name: "Suggest a fix" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Your roster has not changed");
    await view.user.click(screen.getByRole("button", { name: "Refresh suggestion" }));
    expect(await screen.findByRole("button", { name: "Apply these moves" })).toBeEnabled();
    expect(view.applies()).toHaveLength(0);
  });

  it("preserves a reviewed proposal when only live statistics change", async () => {
    const view = setup();
    await view.user.click(screen.getByRole("button", { name: "Suggest a fix" }));
    await screen.findByRole("button", { name: "Apply these moves" });
    const next = workspace();
    next.players[0].statistics = { fantasyPointsHundredths: 200 };
    next.updatedAtMs = Date.now();
    view.update(next);
    expect(screen.getByRole("button", { name: "Apply these moves" })).toBeEnabled();
    expect(view.client.request).toHaveBeenCalledTimes(1);
  });

  it("rejects an unrelated apply receipt without reporting success", async () => {
    const view = setup({ apply: async () => ({ ...receipt(), teamId: otherId }) });
    await view.user.click(screen.getByRole("button", { name: "Suggest a fix" }));
    await view.user.click(await screen.findByRole("button", { name: "Apply these moves" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("could not be confirmed");
    expect(view.onApplied).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Apply these moves" })).not.toBeInTheDocument();
  });
});

it("rejects wrong scopes, invalid moves and malformed totals before offering a repair", () => {
  expect(validateRosterRepairPreview(proposal(), scope)).toBe(true);
  for (const changes of [{ leagueId: otherId }, { seasonId: otherId }, { revision: "old" },
    { moves: [proposal().moves[0], proposal().moves[0]] },
    { moves: [{ ...proposal().moves[0], to: "Prospect" }] },
    { after: { capUsageCents: -1, capLimitCents: 10000, scheduledGames: 1 } }]) {
    expect(() => validateRosterRepairPreview(proposal(changes), scope)).toThrow();
  }
  expect(() => validateRosterRepairApplied({ ...receipt(), seasonId: otherId }, scope)).toThrow();
  expect(() => validateRosterRepairApplied(receipt(), { ...scope, expectedMoves: 2 })).toThrow();
});
