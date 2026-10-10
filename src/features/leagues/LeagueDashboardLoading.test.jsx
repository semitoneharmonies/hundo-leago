import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../test/render.jsx";
import { LeagueDashboard } from "./LeagueDashboard.jsx";
import { EXPANDED_SCORING_VERSION, SCORING_CATEGORIES } from "../../shared/scoringCategories.js";
import { sampleCompletedMatchup } from "../competition/sampleCompletedMatchup.js";
import {SessionContext} from '../session/sessionContext.js';

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
      contract: { id: "66666666-6666-4666-8666-666666666666", version: 1, aavCents: 500, remainingYears: 2 },
      statistics: { gamesPlayed: 2, goals: 1, assists: 2, nhlPoints: 3, fantasyPointsHundredths: 350 },
    }],
    cap: { limitCents: 10000, usageCents: 700, spaceCents: 9300, activePlayerCents: 500, retainedSalaryCents: 100, buyoutPenaltyCents: 100, retentionSlotsUsed: 1, retentionSlotLimit: 3, complete: true, issues: [] },
    draftPicks: [],
    tradeAssets: { contracts: [], prospects: [], draftPicks: [], retentions: [], buyouts: [], futureConsiderations: [] },
  };
}

afterEach(() => vi.restoreAllMocks());

function setup({ currentWeek = async () => ({ week: null }), matchup, hasSeason = true, hasTeam = false, leagueStatus = "setup", workspace = async () => teamWorkspace(), command } = {}) {
  const request = vi.fn(async (path, options = {}) => {
    if (options.method && options.method !== "GET") {
      if (command) return command(path, options);
      throw new Error("Dashboard reads must not mutate state.");
    }
    if (path.endsWith('/communications')) return {data:{leagueId,messages:[]}};
    if (path === `/api/v1/leagues/${leagueId}/teams/${teamId}/roster`) {
      if (options.authenticated !== true) throw new Error("The team workspace requires authentication.");
      const data = await workspace();
      options.validateData(data);
      return { data };
    }
    if (path.endsWith("/matchup-weeks/current")) return { data: await currentWeek() };
    if (path.includes("/matchups/")) return { data: { matchup } };
    if (path.endsWith("/standings")) return { data: { rows: [] } };
    if (path.endsWith("/trades")) return { data: { proposals: [] } };
    if (path.includes("/auctions?")) return { data: [], page: { nextCursor: null, hasMore: false }, actions: { startTeams: [] } };
    if (path.includes("/activity?")) return { data: { activity: [] } };
    throw new Error(`Unexpected dashboard request: ${path}`);
  });
  renderWithProviders(<SessionContext.Provider value={{status:'authenticated',user:{id:'manager'},httpClient:{request}}}><LeagueDashboard
    league={{ id: leagueId, name: "Setup League", status: leagueStatus, currentSeason: hasSeason ? { id: seasonId, label: "2026" } : null, membership: { permissionCategory: "manager" } }}
    teams={hasTeam ? [{ id: teamId, name: "Preview Team", status: leagueStatus, currentManager: { userId: "manager" } }] : []}
    session={{ user: { id: "manager" }, httpClient: { request } }}
  /></SessionContext.Provider>, { config: { appEnv: "local", apiOrigin: "http://localhost:4000", socketOrigin: "http://localhost:4000", buildId: null } });
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
    await waitFor(() => expect(request.mock.calls.filter(([path])=>!path.endsWith('/communications'))).toHaveLength(0));
  });
});

describe("dashboard authenticated roster reads", () => {
  it("shows all season scoring categories, including zero counts and negative FP", async () => {
    const workspace = teamWorkspace();
    workspace.players[0].statistics = {
      gamesPlayed: 2, goals: 0, assists: 0, nhlPoints: 0, fantasyPointsHundredths: -50,
      scoringRuleVersion: EXPANDED_SCORING_VERSION,
      scoringStats: { ...Object.fromEntries(SCORING_CATEGORIES.map(({ key }) => [key, 0])), giveaways: 1, penaltiesTaken: 2 },
    };
    setup({ hasTeam: true, workspace: async () => workspace });
    const player = await screen.findByRole("link", { name: "Example Player" });
    const row = within(player.closest("tr"));
    const table = within(player.closest("table"));
    for (const { key, abbreviation, label } of SCORING_CATEGORIES) {
      expect(table.getByRole("columnheader", { name: abbreviation })).toBeInTheDocument();
      expect(row.getByTitle(label)).toHaveTextContent(String(workspace.players[0].statistics.scoringStats[key]));
    }
    expect(row.getByRole("cell", { name: "-0.50" })).toBeInTheDocument();
    expect(row.getByRole("cell", { name: "-0.25" })).toBeInTheDocument();
  });

  it.each(["available", "missing"])("ranks by season totals even when matchup stats are %s", async (dataStatus) => {
    const player = { ...sampleCompletedMatchup.scoring.home.players[0], playerId, fullName: "Example Player", dataStatus };
    const matchup = {
      ...sampleCompletedMatchup,
      homeTeam: { id: teamId, name: "Preview Team" },
      scoring: { ...sampleCompletedMatchup.scoring, home: { ...sampleCompletedMatchup.scoring.home, players: [player] } },
    };
    setup({ hasTeam: true, matchup, currentWeek: async () => ({ week: {
      id: "week", sequence: 1, status: "completed", startsAtMs: 1791183600000, endsAtMs: 1791788400000,
      matchups: [matchup], byes: [],
    } }) });
    await screen.findByText("Season statistics · Top 10 by total FP");
    const row = within((await screen.findByRole("link", { name: "Example Player" })).closest("tr"));
    for (const { label } of SCORING_CATEGORIES) {
      expect(row.getByTitle(label)).toHaveTextContent("—");
    }
    expect(row.getByRole("cell", { name: "3.50" })).toBeInTheDocument();
  });

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
    await waitFor(() => expect(request.mock.calls.filter(([path])=>!path.endsWith('/communications'))).toHaveLength(0));
  });
});


describe("dashboard roster leaders", () => {
  it("uses versioned roster commands, refreshes the row, and confirms buyouts", async () => {
    const workspace = teamWorkspace();
    const player = workspace.players[0];
    player.injuredReserveEligible = true;
    const command = vi.fn(async (path, options) => {
      if (path.endsWith("/move")) {
        player.rosterCategory = options.body.destinationCategory;
        player.ownershipVersion += 1;
      }
      return { data: {} };
    });
    setup({ hasTeam: true, workspace: async () => structuredClone(workspace), command });
    fireEvent.click(await screen.findByRole("button", { name: "Move to bench Example Player" }));
    await screen.findByRole("button", { name: "Move to active Example Player" });
    expect(command).toHaveBeenCalledWith(expect.stringContaining(`/roster/${player.ownershipId}/move`), expect.objectContaining({
      authenticated: true, method: "POST", body: { destinationCategory: "Bench", expectedVersion: 1, confirmedIllegal: false },
    }));
    const confirm = vi.spyOn(globalThis, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: "Buy out Example Player" }));
    expect(confirm).toHaveBeenCalled();
    expect(command).toHaveBeenCalledTimes(1);
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Buy out Example Player" }));
    await waitFor(() => expect(command).toHaveBeenCalledTimes(2));
    expect(command).toHaveBeenLastCalledWith(expect.stringContaining(`/contracts/${player.contract.id}/buyout`), expect.objectContaining({
      method: "POST", body: { confirmed: true, expectedContractVersion: 1, expectedOwnershipVersion: 2 },
    }));
  });

  it("ranks before limiting across every category, keeps negative points above missing data, and does not write on render", async () => {
    const workspace = teamWorkspace();
    const template = workspace.players[0];
    workspace.players = Array.from({ length: 13 }, (_, index) => ({
      ...template, playerId: `44444444-4444-4444-8444-${String(index).padStart(12, "0")}`,
      ownershipId: `55555555-5555-4555-8555-${String(index).padStart(12, "0")}`,
      name: `Player ${index}`, rosterCategory: ["Active", "Bench", "Injured Reserve", "Prospect"][index % 4],
      statistics: index === 0 ? null : { ...template.statistics, fantasyPointsHundredths: index - 14 },
    }));
    const request = setup({ hasTeam: true, workspace: async () => workspace });
    const last = await screen.findByRole("link", { name: "Player 12", exact: true });
    const rows = within(last.closest("table")).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(10);
    expect(rows.map((row) => within(row).getByRole("rowheader").textContent)).toEqual(Array.from({ length: 10 }, (_, i) => `Player ${12 - i}`));
    expect(within(rows[1]).getByRole("link", { name: "Add Player 11 to a trade" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Player 0", exact: true })).not.toBeInTheDocument();
    expect(request.mock.calls.every(([, options]) => !options.method || options.method === "GET")).toBe(true);
  });

  it("does not expose roster operations when the workspace denies management", async () => {
    const workspace = { ...teamWorkspace(), canManage: false };
    setup({ hasTeam: true, workspace: async () => workspace });
    await screen.findByRole("link", { name: "Example Player" });
    expect(screen.queryByRole("button", { name: "Buy out Example Player" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Move to bench Example Player" })).not.toBeInTheDocument();
  });
});
