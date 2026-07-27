import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { createQueryClient } from "../../shared/query/queryClient.js";
import { renderWithProviders } from "../../test/render.jsx";
import {
  LeagueOverviewPage,
  LeagueSelectionPage,
  LeagueTeamsPage,
  TeamWorkspacePage,
} from "./LeaguePages.jsx";
import { removeInaccessibleLeagueQueries } from "./leagueQueries.js";
import {
  clearUnauthorizedLeaguePreference,
  readLeaguePreference,
  writeLeaguePreference,
} from "./leaguePreference.js";

const leagueOneId = "11111111-1111-4111-8111-111111111111";
const leagueTwoId = "22222222-2222-4222-8222-222222222222";
const teamId = "33333333-3333-4333-8333-333333333333";
const seasonId = "44444444-4444-4444-8444-444444444444";
const playerId = "55555555-5555-4555-8555-555555555555";
const config = Object.freeze({
  appEnv: "local",
  apiOrigin: "http://localhost:4000",
  socketOrigin: "http://localhost:4000",
  buildId: null,
});

function response(data, requestId = "request-1") {
  return new Response(JSON.stringify({ data, meta: { requestId } }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(code, status = 403) {
  return new Response(
    JSON.stringify({
      error: { code, message: "Request denied.", requestId: "request-error" },
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

function sessionData() {
  return {
    csrfToken: "D".repeat(43),
    session: {
      id: "session-league",
      userId: "user-league",
      status: "active",
      createdAtMs: 1,
      lastUsedAtMs: 2,
      idleExpiresAtMs: 3,
      absoluteExpiresAtMs: 4,
      version: 1,
    },
    user: {
      id: "user-league",
      displayName: "League Manager",
      status: "active",
      version: 1,
    },
  };
}

function league(id, name) {
  return {
    id,
    name,
    status: "setup",
    timezone: "America/Vancouver",
    currentSeason: null,
    membership: {
      id: `membership-${id.slice(0, 8)}`,
      permissionCategory: "manager",
      status: "active",
      version: 1,
    },
    version: 1,
  };
}

function fetchScenario(
  leagues,
  { managerAssigned = true, platformAdmin = false } = {}
) {
  return vi.fn(async (url, options = {}) => {
    const path = new URL(url).pathname;
    if (path === "/api/v1/session") {
      return response(sessionData(), "request-session");
    }
    if (path === "/api/v1/leagues") {
      return response({ code: "LEAGUES_FOUND", leagues }, "request-leagues");
    }
    if (path === "/api/v1/admin/users") {
      return platformAdmin
        ? response({
            code: "ADMIN_USERS_FOUND",
            users: [
              {
                id: playerId,
                displayName: "Commissioner Candidate",
                email: "candidate@example.test",
                status: "active",
              },
            ],
          })
        : errorResponse("PLATFORM_ADMINISTRATOR_REQUIRED");
    }
    if (
      platformAdmin &&
      path === "/api/v1/admin/leagues" &&
      options.method === "POST"
    ) {
      return response({
        code: "LEAGUE_CREATED",
        league: {
          id: leagueOneId,
          name: "New Review League",
          status: "setup",
          timezone: "America/Vancouver",
          currentSeasonId: seasonId,
          version: 1,
        },
      });
    }
    if (
      platformAdmin &&
      path ===
        `/api/v1/admin/leagues/${leagueOneId}/commissioner-assignments` &&
      options.method === "POST"
    ) {
      return response({ code: "COMMISSIONER_ASSIGNMENT_PROPOSED" });
    }
    if (path === `/api/v1/leagues/${leagueOneId}`) {
      return response(
        { code: "LEAGUE_FOUND", league: leagues[0] },
        "request-league"
      );
    }
    if (path === `/api/v1/leagues/${leagueOneId}/teams`) {
      return response(
        {
          code: "TEAMS_FOUND",
          teams: [
            {
              id: teamId,
              leagueId: leagueOneId,
              name: "Target Owls",
              status: "active",
              primaryColour: null,
              secondaryColour: null,
              logoReference: null,
              createdAtMs: 1,
              updatedAtMs: 1,
              version: 1,
              currentManager: managerAssigned
                ? {
                    assignmentId: "assignment-1",
                    userId: "user-league",
                    displayName: "League Manager",
                    acceptedAtMs: 1,
                    version: 1,
                  }
                : null,
            },
          ],
        },
        "request-teams"
      );
    }
    if (path === `/api/v1/leagues/${leagueOneId}/teams/${teamId}`) {
      const teamsResponse = await fetchScenario(leagues)(
        `http://localhost:4000/api/v1/leagues/${leagueOneId}/teams`
      );
      const body = await teamsResponse.json();
      return response(
        { code: "TEAM_FOUND", team: body.data.teams[0] },
        "request-team"
      );
    }
    if (
      path ===
      `/api/v1/leagues/${leagueOneId}/teams/${teamId}/roster`
    ) {
      return response(
        {
          code: "TEAM_WORKSPACE_FOUND",
          canManage: true,
          orderVersion: 0,
          league: { id: leagueOneId, name: leagues[0].name },
          season: { id: seasonId, label: "2026-27" },
          team: {
            id: teamId,
            name: "Target Owls",
            primaryColour: null,
            secondaryColour: null,
            logoReference: null,
            version: 1,
          },
          players: [
            {
              ownershipId: "66666666-6666-4666-8666-666666666666",
              ownershipVersion: 1,
              playerId,
              name: "Connected Player",
              normalizedPosition: "F",
              rosterCategory: "Active",
              ownershipKind: "Contract",
              slotNumber: 1,
              displayOrder: 0,
              age: 25,
              contract: {
                id: "77777777-7777-4777-8777-777777777777",
                version: 1,
                type: "Standard",
                originalTotalValueCents: 1_000,
                originalTermYears: 2,
                aavCents: 500,
                remainingYears: 2,
              },
              statistics: null,
            },
          ],
          cap: {
            limitCents: 10_000,
            usageCents: 500,
            spaceCents: 9_500,
            activePlayerCents: 500,
            retainedSalaryCents: 0,
            buyoutPenaltyCents: 0,
            retentionSlotsUsed: 0,
            retentionSlotLimit: 3,
            complete: true,
            issues: [],
          },
          draftPicks: [],
          tradeAssets: {
            contracts: [],
            prospects: [],
            draftPicks: [],
            retentions: [],
            buyouts: [],
            futureConsiderations: [],
          },
        },
        "request-team-workspace"
      );
    }
    if (
      path ===
      `/api/v1/public/leagues/${leagueOneId}/teams/${teamId}/roster`
    ) {
      return response(
        {
          code: "PUBLIC_ROSTER_FOUND",
          roster: {
            league: { id: leagueOneId, name: leagues[0].name },
            season: { id: seasonId, label: "2026-27" },
            team: {
              id: teamId,
              name: "Target Owls",
              primaryColour: null,
              secondaryColour: null,
              logoReference: null,
            },
            players: [
              {
                playerReference: playerId,
                name: "Connected Player",
                normalizedPosition: "F",
                rosterCategory: "Active",
                aavCents: 500,
                remainingContractYears: 2,
                age: 25,
                seasonStatistics: null,
              },
            ],
            cap: {
              capLimitCents: 10_000,
              capUsageCents: 500,
              capSpaceCents: 9_500,
              retainedSalaryTotalCents: 0,
              buyoutPenaltyTotalCents: 0,
            },
            updatedAt: 1,
          },
        },
        "request-roster"
      );
    }
    throw new Error(`Unexpected request: ${path}`);
  });
}

function renderLeagueRoutes(initialEntry, fetchImpl) {
  return renderWithProviders(
    <Routes>
      <Route path="/leagues" element={<LeagueSelectionPage />} />
      <Route path="/leagues/:leagueId" element={<LeagueOverviewPage />} />
      <Route path="/leagues/:leagueId/teams" element={<LeagueTeamsPage />} />
      <Route
        path="/leagues/:leagueId/teams/:teamId/roster"
        element={<TeamWorkspacePage />}
      />
    </Routes>,
    {
      initialEntries: [initialEntry],
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    }
  );
}

describe("league selection", () => {
  it("shows an explicit zero-membership state", async () => {
    renderLeagueRoutes("/leagues", fetchScenario([]));
    expect(
      await screen.findByRole("heading", { name: "No league memberships yet" })
    ).toBeInTheDocument();
  });

  it("lets a platform administrator create a league and assign its commissioner", async () => {
    const fetchImpl = fetchScenario([], { platformAdmin: true });
    const view = renderLeagueRoutes("/leagues", fetchImpl);

    expect(
      await screen.findByRole("heading", { name: "Create a league" })
    ).toBeInTheDocument();
    await view.user.type(
      screen.getByRole("textbox", { name: "League name" }),
      "New Review League"
    );
    await view.user.click(
      screen.getByRole("button", { name: "Create league" })
    );
    expect(
      await screen.findByRole("heading", {
        name: "Assign commissioner for New Review League",
      })
    ).toBeInTheDocument();
    await view.user.selectOptions(
      screen.getByRole("combobox", { name: "Commissioner" }),
      playerId
    );
    await view.user.click(
      screen.getByRole("button", {
        name: "Send commissioner assignment",
      })
    );
    expect(
      await screen.findByText(
        "Commissioner assignment sent to Commissioner Candidate. It becomes active after acceptance."
      )
    ).toBeInTheDocument();
  });

  it("automatically enters exactly one visible league and offers its team", async () => {
    renderLeagueRoutes(
      "/leagues",
      fetchScenario([league(leagueOneId, "Only League")])
    );
    expect(
      await screen.findByRole("heading", { name: "Only League" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Target Owls" })
    ).toHaveAttribute(
      "href",
      `/leagues/${leagueOneId}/teams/${teamId}/roster`
    );
    expect(screen.getByRole("link", { name: "Target Owls" })).toHaveClass(
      "hl-team-grid__team"
    );
    expect(screen.getByRole("link", { name: "Target Owls" })).toHaveStyle({
      "--team-primary": "#16324f",
      "--team-secondary": "#f7f7f7",
    });
    expect(screen.getByText(/managed by you/i)).toBeInTheDocument();
  });

  it("renders a distinct teams index with roster links", async () => {
    renderLeagueRoutes(
      `/leagues/${leagueOneId}/teams`,
      fetchScenario([league(leagueOneId, "Only League")])
    );
    expect(
      await screen.findByRole("heading", { name: "Teams" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Target Owls" })).toHaveAttribute(
      "href",
      `/leagues/${leagueOneId}/teams/${teamId}/roster`
    );
    expect(
      screen.getByRole("link", { name: "Target Owls" })
    ).toHaveStyle({
      "--team-primary": "#16324f",
      "--team-secondary": "#f7f7f7",
    });
  });

  it("does not give a commissioner an implicit dashboard team", async () => {
    const commissionerLeague = league(leagueOneId, "Commissioner League");
    commissionerLeague.membership.permissionCategory = "commissioner";
    renderLeagueRoutes(
      `/leagues/${leagueOneId}`,
      fetchScenario([commissionerLeague], { managerAssigned: false })
    );

    expect(
      await screen.findByRole("heading", { name: "Commissioner League" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Commissioner overview",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Members and invitations" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Managed roster" })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Your team")).not.toBeInTheDocument();
  });

  it("shows a chooser for two visible leagues", async () => {
    const fetchImpl = fetchScenario([
      league(leagueOneId, "First League"),
      league(leagueTwoId, "Second League"),
    ]);
    renderLeagueRoutes("/leagues", fetchImpl);

    expect(
      await screen.findByRole("link", { name: "First League" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Second League" })).toBeInTheDocument();
    expect(
      fetchImpl.mock.calls.some(([url]) =>
        new URL(url).pathname.includes(`${leagueOneId}/teams`)
      )
    ).toBe(false);
  });

  it("does not request an unknown league from a stale URL", async () => {
    const fetchImpl = fetchScenario([league(leagueOneId, "Visible League")]);
    renderLeagueRoutes(`/leagues/${leagueTwoId}`, fetchImpl);

    expect(
      await screen.findByRole("heading", { name: "League access unavailable" })
    ).toBeInTheDocument();
    expect(
      fetchImpl.mock.calls.some(([url]) => new URL(url).pathname.includes(leagueTwoId))
    ).toBe(false);
  });

  it("loads the authoritative roster, contract, and cap projection for a visible team", async () => {
    const fetchImpl = fetchScenario([league(leagueOneId, "Visible League")]);
    renderLeagueRoutes(
      `/leagues/${leagueOneId}/teams/${teamId}/roster`,
      fetchImpl
    );
    expect(
      await screen.findByRole("heading", { name: "Target Owls" })
    ).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "Connected Player" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Salary cap" })).toBeInTheDocument();
    expect(
      fetchImpl.mock.calls.some(
        ([url]) =>
          new URL(url).pathname ===
          `/api/v1/leagues/${leagueOneId}/teams/${teamId}/roster`
      )
    ).toBe(true);
  });
});

describe("league cache and preference isolation", () => {
  it("removes only private data for leagues no longer authorized", () => {
    const queryClient = createQueryClient();
    queryClient.getQueryCache().build(queryClient, {
      queryKey: ["league", leagueOneId],
      queryFn: async () => null,
      meta: { private: true, leagueId: leagueOneId },
    }).setData({ id: leagueOneId });
    queryClient.getQueryCache().build(queryClient, {
      queryKey: ["league", leagueTwoId],
      queryFn: async () => null,
      meta: { private: true, leagueId: leagueTwoId },
    }).setData({ id: leagueTwoId });

    removeInaccessibleLeagueQueries(queryClient, [leagueOneId]);
    expect(queryClient.getQueryData(["league", leagueOneId])).toEqual({
      id: leagueOneId,
    });
    expect(queryClient.getQueryData(["league", leagueTwoId])).toBeUndefined();
  });

  it("uses remembered league IDs only while they remain authorized", () => {
    expect(writeLeaguePreference(leagueOneId)).toBe(true);
    expect(readLeaguePreference()).toBe(leagueOneId);
    expect(clearUnauthorizedLeaguePreference([leagueOneId])).toBe(false);
    expect(clearUnauthorizedLeaguePreference([leagueTwoId])).toBe(true);
    expect(readLeaguePreference()).toBeNull();
  });
});
