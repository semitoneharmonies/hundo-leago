import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../test/render.jsx";
import { LeagueDashboard } from "./LeagueDashboard.jsx";

const leagueId = "11111111-1111-4111-8111-111111111111";
const seasonId = "22222222-2222-4222-8222-222222222222";
const teamId = "33333333-3333-4333-8333-333333333333";
const playerId = "44444444-4444-4444-8444-444444444444";

function teamWorkspace() {
  return {
    code: "TEAM_WORKSPACE_FOUND", canManage: true, orderVersion: 0,
    league: { id: leagueId, name: "Setup League" },
    season: { id: seasonId, label: "2026" },
    team: { id: teamId, name: "Preview Team" },
    players: [{
      ownershipId: "55555555-5555-4555-8555-555555555555", ownershipVersion: 1,
      playerId, name: "Example Player", normalizedPosition: "F", rosterCategory: "Active",
      age: 25, nhlTeamAbbreviation: "VAN",
      contract: { aavCents: 500, remainingYears: 2 },
      statistics: { gamesPlayed: 2, goals: 1, assists: 2, nhlPoints: 3, fantasyPointsHundredths: 350 },
    }],
    cap: { limitCents: 10000, usageCents: 700, spaceCents: 9300, activePlayerCents: 500, retainedSalaryCents: 100, buyoutPenaltyCents: 100, retentionSlotsUsed: 1, retentionSlotLimit: 3, complete: true, issues: [] },
    draftPicks: [],
    tradeAssets: { contracts: [], prospects: [], draftPicks: [], retentions: [], buyouts: [], futureConsiderations: [] },
  };
}

function setup({ currentWeek = async () => ({ week: null }), hasSeason = true, hasTeam = false, leagueStatus = "setup", workspace = async () => teamWorkspace() } = {}) {
  const request = vi.fn(async (path, options = {}) => {
    if (options.method && options.method !== "GET") throw new Error("Dashboard reads must not mutate state.");
    if (path === `/api/v1/leagues/${leagueId}/teams/${teamId}/roster`) {
      if (options.authenticated !== true) throw new Error("The team workspace requires authentication.");
      const data = await workspace();
      options.validateData(data);
      return { data };
    }
    if (path.endsWith("/matchup-weeks/current")) return { data: await currentWeek() };
    if (path.endsWith("/standings")) return { data: { rows: [] } };
    if (path.endsWith("/trades")) return { data: { proposals: [] } };
    if (path.includes("/auctions?")) return { data: [], page: { nextCursor: null, hasMore: false }, actions: { startTeams: [] } };
    if (path.includes("/activity?")) return { data: { activity: [] } };
    throw new Error(`Unexpected dashboard request: ${path}`);
  });
  renderWithProviders(<LeagueDashboard
    league={{ id: leagueId, name: "Setup League", status: leagueStatus, currentSeason: hasSeason ? { id: seasonId, label: "2026" } : null, membership: { permissionCategory: "manager" } }}
    teams={hasTeam ? [{ id: teamId, name: "Preview Team", status: leagueStatus, currentManager: { userId: "manager" } }] : []}
    session={{ user: { id: "manager" }, httpClient: { request } }}
  />, { config: { appEnv: "local", apiOrigin: "http://localhost:4000", socketOrigin: "http://localhost:4000", buildId: null } });
  return request;
}

describe("dashboard current-week loading", () => {
  it("shows the empty state when the current week resolves to null", async () => {
    const request = setup();
    expect(await screen.findByRole("heading", { name: "No current matchup week" })).toBeInTheDocument();
    expect(screen.queryByText("Loading the current matchup week…")).not.toBeInTheDocument();
    expect(request.mock.calls.filter(([path]) => path.includes("/matchups/"))).toHaveLength(0);
  });

  it("shows a current-week request error instead of loading forever", async () => {
    setup({ currentWeek: async () => { throw new Error("Week lookup failed"); } });
    expect(await screen.findByText(/The current matchup week could not be loaded/)).toBeInTheDocument();
    expect(screen.queryByText("Loading the current matchup week…")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "No current matchup week" })).not.toBeInTheDocument();
  });

  it("keeps the loading message until an active week lookup finishes", async () => {
    let release;
    const pending = new Promise((resolve) => { release = resolve; });
    setup({ currentWeek: () => pending });
    expect(screen.getByText("Loading the current matchup week…")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "No current matchup week" })).not.toBeInTheDocument();
    release({ week: null });
    await waitFor(() => expect(screen.getByRole("heading", { name: "No current matchup week" })).toBeInTheDocument());
  });

  it("does not start competition queries before a season is configured", async () => {
    const request = setup({ hasSeason: false });
    expect(screen.getByText("No active season is configured")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No current matchup week" })).toBeInTheDocument();
    expect(screen.queryByText("Loading the current matchup week…")).not.toBeInTheDocument();
    await waitFor(() => expect(request).not.toHaveBeenCalled());
  });
});

describe("dashboard authenticated roster reads", () => {
  it.each(["setup", "active"])("shows authoritative team totals and player statistics for a %s league", async (leagueStatus) => {
    const request = setup({ hasTeam: true, leagueStatus });
    const team = await screen.findByRole("region", { name: "Preview Team" });
    expect(within(team).getByRole("progressbar", { name: "$7.00 used of $100.00" })).toHaveAttribute("aria-valuenow", "700");
    expect(within(team).getByText("$93.00 available")).toBeInTheDocument();
    expect(within(team).getByText("Retained").nextElementSibling).toHaveTextContent("$1.00");
    expect(within(team).getByText("Buyouts").nextElementSibling).toHaveTextContent("$1.00");
    const player = screen.getByRole("link", { name: "Example Player" });
    expect(player).toHaveAttribute("href", `/leagues/${leagueId}/players/${playerId}`);
    const row = within(player.closest("tr"));
    for (const value of ["$5.00", "25", "VAN", "3.50", "1.75"]) expect(row.getByRole("cell", { name: value, exact: true })).toBeInTheDocument();
    expect(screen.queryByText(/Team status could not be loaded/)).not.toBeInTheDocument();
    expect(request.mock.calls.filter(([path]) => path.includes("/public/"))).toHaveLength(0);
    expect(request).toHaveBeenCalledWith(`/api/v1/leagues/${leagueId}/teams/${teamId}/roster`, expect.objectContaining({ authenticated: true, validateData: expect.any(Function) }));
  });

  it("keeps a failed authenticated read visible without falling back to public data", async () => {
    const request = setup({ hasTeam: true, workspace: async () => { throw new Error("Workspace unavailable"); } });
    expect(await screen.findByText(/Team status could not be loaded/)).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(request.mock.calls.filter(([path]) => path.includes("/public/"))).toHaveLength(0);
  });

  it("rejects an invalid workspace instead of displaying invented cap values", async () => {
    setup({ hasTeam: true, workspace: async () => ({ ...teamWorkspace(), cap: { limitCents: 10000 } }) });
    expect(await screen.findByText(/Team status could not be loaded/)).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText("$93.00 available")).not.toBeInTheDocument();
  });

  it("keeps an incomplete cap projection unavailable", async () => {
    const incomplete = teamWorkspace();
    incomplete.cap.complete = false;
    setup({ hasTeam: true, workspace: async () => incomplete });
    expect(await screen.findByText(/Team status could not be loaded/)).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText("$93.00 available")).not.toBeInTheDocument();
  });

  it("does not request a team workspace for an unassigned manager", async () => {
    const request = setup();
    expect(await screen.findByRole("heading", { name: "No current matchup week" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No team is assigned to this account" })).toBeInTheDocument();
    expect(request.mock.calls.filter(([path]) => path.endsWith("/roster"))).toHaveLength(0);
  });

  it("does not request the managed team's workspace before a season exists", async () => {
    const request = setup({ hasTeam: true, hasSeason: false });
    expect(screen.getByText("No active season is configured")).toBeInTheDocument();
    await waitFor(() => expect(request).not.toHaveBeenCalled());
  });
});
