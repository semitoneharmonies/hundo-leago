import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("socket.io-client", () => ({
  io: () => ({ onAny() {}, offAny() {}, disconnect() {} }),
}));

import { renderWithProviders } from "../../test/render.jsx";
import { PlayersCatalogPage } from "./PlayersCatalogPage.jsx";
import { SCORING_CATEGORIES, EXPANDED_SCORING_VERSION } from "../../shared/scoringCategories.js";

const leagueId = "11111111-1111-4111-8111-111111111111";
const seasonId = "22222222-2222-4222-8222-222222222222";
const teamA = "33333333-3333-4333-8333-333333333333";
const teamB = "44444444-4444-4444-8444-444444444444";
const userId = "55555555-5555-4555-8555-555555555555";
const freeAgentId = "66666666-6666-4666-8666-666666666666";
const ownedPlayerId = "77777777-7777-4777-8777-777777777777";
const prospectId = "88888888-8888-4888-8888-888888888888";
const unavailableId = "99999999-9999-4999-8999-999999999999";
const config = {
  appEnv: "local",
  apiOrigin: "http://localhost:4000",
  socketOrigin: "http://localhost:4000",
  buildId: null,
};

function envelope(data, { actions, page } = {}) {
  return new Response(
    JSON.stringify({
      data,
      ...(actions ? { actions } : {}),
      ...(page ? { page } : {}),
      meta: { requestId: "request-1" },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

function auctionActions(allowed = true) {
  return {
    startTeams: [
      {
        teamId: teamA,
        team: {
          teamId: teamA,
          name: "Alpha Team",
          primaryColour: "#16324f",
          secondaryColour: "#f7f7f7",
          tertiaryColour: null,
          patternTemplate: "solid",
          logoReference: null,
        },
        sourceKind: "fad_open_rapid",
        fadId: seasonId,
        fadRolloverId: null,
        targetRolloverAtMs: null,
        creationCutoffAtMs: null,
        startAuction: {
          allowed,
          reasonCode: allowed ? null : "PHASE_CLOSED",
        },
      },
    ],
  };
}

function session() {
  return {
    csrfToken: "D".repeat(43),
    session: {
      id: userId,
      userId,
      status: "active",
      createdAtMs: 1,
      lastUsedAtMs: 1,
      idleExpiresAtMs: 2,
      absoluteExpiresAtMs: 3,
      version: 1,
    },
    user: {
      id: userId,
      displayName: "Manager",
      status: "active",
      version: 1,
    },
  };
}

function league() {
  return {
    id: leagueId,
    name: "Test League",
    status: "active",
    timezone: "America/Vancouver",
    currentSeason: {
      id: seasonId,
      label: "2026-27",
      status: "active",
      version: 1,
    },
    membership: {
      id: userId,
      permissionCategory: "manager",
      status: "active",
      version: 1,
    },
    version: 1,
  };
}

function team(id, name) {
  return {
    id,
    leagueId,
    name,
    status: "active",
    primaryColour: "#16324f",
    secondaryColour: "#f7f7f7",
    logoReference: null,
    createdAtMs: 1,
    updatedAtMs: 1,
    version: 1,
    currentManager: null,
  };
}

function player({
  id,
  name,
  active = true,
  gamesPlayed,
  fantasyPointsHundredths,
  ownership = null,
  activeContract = null,
}) {
  const [firstName, ...lastParts] = name.split(" ");
  const lastName = lastParts.join(" ");
  return {
    id,
    firstName,
    lastName,
    fullName: name,
    birthDate: "1998-01-01",
    status: "active",
    provider: {
      provider: "sportsdataio-discovery-lab",
      sourcePosition: "C",
      normalizedPosition: "F",
      nhlTeamAbbreviation: "VAN",
      active,
      sourceVersion: "2026REG",
      effectiveAtMs: 1,
    },
    statistics: {
      provider: "release_qa_fixture",
      nhlSeasonKey: "20262027",
      gamesPlayed,
      goals: 1,
      assists: 2,
      nhlPoints: 3,
      fantasyPointsHundredths,
      sourceUpdatedAtMs: 1,
    },
    version: 1,
    league: {
      id: leagueId,
      ownership,
      activeContract,
    },
  };
}

function createContractFilterTestFixture() {
  const requests = [];
  const ownership = (category = "Active", kind = "Rostered") => ({
    kind, category, team: { id: teamA, name: "Alpha Team" },
  });
  const contract = (aavCents, remainingYears) => ({
    aavCents, remainingYears, originalTermYears: 3, originalTotalValueCents: aavCents * 3,
  });
  const rows = [
    player({ id: freeAgentId, name: "Free Agent", gamesPlayed: 50, fantasyPointsHundredths: 9000 }),
    player({ id: ownedPlayerId, name: "Lower Boundary", gamesPlayed: 50, fantasyPointsHundredths: 8000, ownership: ownership(), activeContract: contract(200, 1) }),
    player({ id: unavailableId, name: "Upper Boundary", gamesPlayed: 50, fantasyPointsHundredths: 7000, ownership: ownership(), activeContract: contract(600, 2) }),
    player({ id: seasonId, name: "ELC Prospect", gamesPlayed: 5, fantasyPointsHundredths: 500, ownership: ownership("Prospect"), activeContract: contract(100, 3) }),
    player({ id: prospectId, name: "Unsigned Prospect", gamesPlayed: 0, fantasyPointsHundredths: 0, ownership: ownership("Prospect", "Prospect Right") }),
  ];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url: String(url), method: options.method || "GET" });
    const { pathname, searchParams: params } = new URL(url);
    if (pathname === "/api/v1/session") return envelope(session());
    if (pathname === "/api/v1/leagues") return envelope({ code: "LEAGUES_FOUND", leagues: [league()] });
    if (pathname.endsWith("/teams")) return envelope({ code: "TEAMS_FOUND", teams: [team(teamA, "Alpha Team")] });
    if (pathname.endsWith("/auctions")) return envelope([], { actions: { startTeams: [] }, page: { nextCursor: null, hasMore: false } });
    if (!pathname.endsWith("/players")) throw new Error(`Unexpected fixture request: ${pathname}`);
    const matches = rows.filter(({ fullName, league: { ownership: owned, activeContract: signed }, id }) =>
      (!params.get("query") || fullName.toLowerCase().includes(params.get("query").toLowerCase())) &&
      (!params.get("teamId") || owned?.team.id === params.get("teamId")) &&
      (params.get("ownership") !== "signed" || signed) &&
      (params.get("ownership") !== "free" || !owned) &&
      (params.get("ownership") !== "prospects" || owned?.category === "Prospect") &&
      (!params.has("minimumAavCents") || (signed && signed.aavCents >= Number(params.get("minimumAavCents")))) &&
      (!params.has("maximumAavCents") || (signed && signed.aavCents <= Number(params.get("maximumAavCents")))) &&
      (!params.has("remainingYears") || signed?.remainingYears === Number(params.get("remainingYears"))) &&
      (!params.has("contractType") || (signed && (params.get("contractType") === "fantasy_elc" ? id === seasonId : id !== seasonId)))
    );
    return envelope(matches, { page: { nextCursor: null, hasMore: false } });
  };
  return { fetchImpl, requests };
}

describe("league player catalog", () => {
  it("combines and resets signed, AAV, remaining-year, prospect and ELC filters with read-only requests", async () => {
    const fixture = createContractFilterTestFixture();
    const view = renderWithProviders(
      <Routes><Route path="/leagues/:leagueId/players" element={<PlayersCatalogPage />} /></Routes>,
      { initialEntries: [`/leagues/${leagueId}/players`], enableSession: true, config, sessionOptions: { fetchImpl: fixture.fetchImpl } }
    );
    await screen.findByRole("rowheader", { name: "Free Agent" });
    const assignment = screen.getByRole("combobox", { name: "League assignment" });
    const years = screen.getByRole("combobox", { name: "Contract length (remaining)" });
    const type = screen.getByRole("combobox", { name: "Contract type" });
    const range = screen.getByRole("checkbox", { name: "Filter by AAV" });
    await view.user.selectOptions(assignment, "signed");
    await screen.findByRole("rowheader", { name: "ELC Prospect" });
    expect(screen.queryByRole("rowheader", { name: "Unsigned Prospect" })).not.toBeInTheDocument();
    expect(screen.queryByRole("rowheader", { name: "Free Agent" })).not.toBeInTheDocument();
    await view.user.click(range);
    await screen.findByRole("rowheader", { name: "Upper Boundary" });
    expect(screen.getByRole("rowheader", { name: "Lower Boundary" })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("rowheader", { name: "ELC Prospect" })).not.toBeInTheDocument());
    await view.user.selectOptions(years, "1");
    await waitFor(() => expect(screen.queryByRole("rowheader", { name: "Upper Boundary" })).not.toBeInTheDocument());
    await screen.findByRole("rowheader", { name: "Lower Boundary" });
    fireEvent.change(screen.getByRole("slider", { name: "Minimum AAV slider" }), { target: { value: "3" } });
    await screen.findByText("No players match these filters");
    const minimum = screen.getByRole("spinbutton", { name: "Minimum AAV ($)" });
    fireEvent.change(minimum, { target: { value: "7" } });
    expect(await screen.findByRole("alert")).toHaveTextContent("minimum no higher than the maximum");
    fireEvent.change(minimum, { target: { value: "2" } });
    await screen.findByRole("rowheader", { name: "Lower Boundary" });
    await view.user.click(range);
    await view.user.selectOptions(years, "all");
    await view.user.selectOptions(assignment, "prospects");
    await screen.findByRole("rowheader", { name: "Unsigned Prospect" });
    await view.user.selectOptions(type, "fantasy_elc");
    await waitFor(() => expect(screen.queryByRole("rowheader", { name: "Unsigned Prospect" })).not.toBeInTheDocument());
    await screen.findByRole("rowheader", { name: "ELC Prospect" });
    await view.user.selectOptions(type, "all");
    await view.user.selectOptions(assignment, "all");
    await screen.findByRole("rowheader", { name: "Free Agent" });
    expect(fixture.requests.every(({ method }) => method === "GET")).toBe(true);
  });

  it("accepts and shows the complete expanded breakdown with negative fantasy points", async () => {
    const entry = player({ id: freeAgentId, name: "Expanded Player", gamesPlayed: 1, fantasyPointsHundredths: -50 });
    Object.assign(entry.statistics, { goals: 0, assists: 0, nhlPoints: 0, scoringRuleVersion: EXPANDED_SCORING_VERSION,
      scoringStats: { ...Object.fromEntries(SCORING_CATEGORIES.map(({ key }) => [key, 0])), giveaways: 1, penaltiesTaken: 2 } });
    const fetchImpl = async url => {
      const path = new URL(url).pathname;
      if (path === "/api/v1/session") return envelope(session());
      if (path === "/api/v1/leagues") return envelope({ code: "LEAGUES_FOUND", leagues: [league()] });
      if (path.endsWith("/teams")) return envelope({ code: "TEAMS_FOUND", teams: [] });
      if (path.endsWith("/players")) return envelope([entry], { page: { nextCursor: null, hasMore: false } });
      if (path.endsWith("/auctions")) return envelope([], { actions: auctionActions(true), page: { nextCursor: null, hasMore: false } });
      throw new Error(`Unexpected request: ${path}`);
    };
    renderWithProviders(<Routes><Route path="/leagues/:leagueId/players" element={<PlayersCatalogPage />} /></Routes>, {
      initialEntries: [`/leagues/${leagueId}/players`], enableSession: true, config, sessionOptions: { fetchImpl },
    });
    const row = (await screen.findByRole("rowheader", { name: "Expanded Player" })).closest("tr");
    expect(within(row).getAllByText("-0.50")).toHaveLength(2);
    expect(within(row).getByTitle("Giveaways")).toHaveTextContent("1");
    expect(within(row).getByTitle("Penalties taken")).toHaveTextContent("2");
    for (const { abbreviation } of SCORING_CATEGORIES) expect(screen.getByRole("button", { name: `Sort by ${abbreviation}` })).toBeInTheDocument();
  });
  it("shows FPG and filters favourites, teams, and prospects while hiding unavailable players", async () => {
    const players = [
      player({
        id: freeAgentId,
        name: "Free Agent",
        gamesPlayed: 10,
        fantasyPointsHundredths: 2500,
      }),
      player({
        id: ownedPlayerId,
        name: "Owned Player",
        gamesPlayed: 5,
        fantasyPointsHundredths: 500,
        ownership: {
          kind: "Rostered",
          category: "Active",
          team: { id: teamA, name: "Alpha Team" },
        },
        activeContract: {
          originalTotalValueCents: 1_000,
          originalTermYears: 2,
          aavCents: 500,
          remainingYears: 2,
        },
      }),
      player({
        id: prospectId,
        name: "Draft Prospect",
        gamesPlayed: 0,
        fantasyPointsHundredths: 0,
        ownership: {
          kind: "Prospect Right",
          category: "Prospect",
          team: { id: teamB, name: "Beta Team" },
        },
      }),
      player({
        id: unavailableId,
        name: "Unavailable Player",
        active: false,
        gamesPlayed: 10,
        fantasyPointsHundredths: 9999,
      }),
    ];
    const fetchImpl = vi.fn(async (url) => {
      const parsed = new URL(url);
      const path = parsed.pathname;
      if (path === "/api/v1/session") return envelope(session());
      if (path === "/api/v1/leagues") {
        return envelope({ code: "LEAGUES_FOUND", leagues: [league()] });
      }
      if (path === `/api/v1/leagues/${leagueId}/teams`) {
        return envelope({
          code: "TEAMS_FOUND",
          teams: [team(teamA, "Alpha Team"), team(teamB, "Beta Team")],
        });
      }
      if (path === `/api/v1/leagues/${leagueId}/players`) {
        const teamId = parsed.searchParams.get("teamId");
        const selectedPlayers = teamId
          ? players.filter(
              (candidate) => candidate.league.ownership?.team.id === teamId
            )
          : players;
        return envelope(selectedPlayers, {
          page: { nextCursor: null, hasMore: false },
        });
      }
      if (path === `/api/v1/leagues/${leagueId}/auctions`) {
        return envelope([], {
          actions: auctionActions(true),
          page: { nextCursor: null, hasMore: false },
        });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    const view = renderWithProviders(
      <Routes>
        <Route
          path="/leagues/:leagueId/players"
          element={<PlayersCatalogPage />}
        />
      </Routes>,
      {
        initialEntries: [`/leagues/${leagueId}/players`],
        enableSession: true,
        config,
        sessionOptions: { fetchImpl },
      }
    );

    let table = await screen.findByRole("table");
    const playerRequests = fetchImpl.mock.calls
      .map(([url]) => new URL(url))
      .filter(
        ({ pathname }) =>
          pathname === `/api/v1/leagues/${leagueId}/players`
      );
    expect(playerRequests[0].searchParams.get("limit")).toBe("100");
    expect(playerRequests[0].searchParams.get("sort")).toBe(
      "fantasyPoints"
    );
    const catalogRegion = screen.getByRole("region", {
      name: "Player catalog",
    });
    expect(catalogRegion).toHaveAttribute("tabindex", "0");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map(({ textContent }) => textContent.replace(/[ ↑↓]/g, ""))
    ).toEqual([
      "Order",
      "Pos",
      "Player",
      "AAV/FA",
      "Years",
      "Age",
      "NHL",
      "GP",
      "G",
      "A",
      "P",
      "EVG", "PPG", "SHG", "GWG", "A1", "A2", "SOG", "HIT", "BLK", "TK", "GV", "PD", "PT",
      "FP",
      "FPG",
      "Actions",
    ]);
    const nhlTeamFilter = screen.getByRole("combobox", { name: "NHL team" });
    expect(within(nhlTeamFilter).getAllByRole("option")).toHaveLength(33);
    expect(
      within(nhlTeamFilter).getByRole("option", {
        name: "Anaheim Ducks (ANA)",
      })
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("link", { name: "Free Agent" })
    ).toHaveAttribute(
      "href",
      `/leagues/${leagueId}/players/${freeAgentId}`
    );
    expect(
      within(
        within(table).getByRole("rowheader", { name: "Owned Player" })
          .closest("tr")
      ).getByText("$5.00")
    ).toBeInTheDocument();
    const fantasyPointsSort = within(table).getByRole("button", {
      name: "Sort by FP",
    });
    expect(fantasyPointsSort.closest("th")).toHaveAttribute(
      "aria-sort",
      "descending"
    );
    const fpgSort = within(table).getByRole("button", {
      name: "Sort by FPG",
    });
    expect(fpgSort.closest("th")).not.toHaveAttribute("aria-sort");
    await view.user.click(fpgSort);
    expect(fpgSort.closest("th")).toHaveAttribute(
      "aria-sort",
      "descending"
    );
    expect(fantasyPointsSort.closest("th")).not.toHaveAttribute("aria-sort");
    expect(within(table).getByText("2.50")).toBeInTheDocument();
    expect(screen.queryByText("Unavailable Player")).not.toBeInTheDocument();
    const rowNames = within(table)
      .getAllByRole("rowheader")
      .map(({ textContent }) => textContent);
    expect(rowNames.slice(0, 3)).toEqual([
      "Free Agent",
      "Owned Player",
      "Draft Prospect",
    ]);
    expect(within(table).getByRole("link", { name: "Start auction" })).toHaveAttribute(
      "href",
      `/leagues/${leagueId}/auctions?playerId=${freeAgentId}`
    );
    const nameSearch = screen.getByRole("combobox", {
      name: "Search by player name",
    });
    await view.user.type(nameSearch, "free");
    const suggestions = await screen.findByRole("listbox");
    const suggestion = within(suggestions).getByRole("option", {
      name: /Free Agent/,
    });
    const autocompleteRequest = fetchImpl.mock.calls
      .map(([url]) => new URL(url))
      .find(
        ({ pathname, searchParams }) =>
          pathname === `/api/v1/leagues/${leagueId}/players` &&
          searchParams.get("sort") === "name"
      );
    expect(autocompleteRequest.searchParams.get("limit")).toBe("100");
    await view.user.keyboard("{ArrowDown}");
    expect(suggestion).toHaveFocus();
    await view.user.keyboard("{Enter}");
    expect(nameSearch).toHaveValue("Free Agent");
    const searchedTable = await screen.findByRole("table");
    expect(
      within(searchedTable).getByRole("rowheader", { name: "Free Agent" })
    ).toBeInTheDocument();
    await view.user.clear(nameSearch);
    await view.user.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByRole("rowheader", { name: "Owned Player" });
    table = screen.getByRole("table");

    const favouriteButton = within(table).getByRole("button", {
      name: "Add Free Agent to favourites",
    });
    expect(favouriteButton.querySelector(".hl-hockey-stick")).not.toBeNull();
    await view.user.click(favouriteButton);
    const assignmentFilter = screen.getByRole("combobox", {
      name: "League assignment",
    });
    await view.user.selectOptions(assignmentFilter, "favourites");
    expect(
      within(table).getByRole("rowheader", { name: "Free Agent" })
    ).toBeInTheDocument();
    expect(
      within(table).queryByRole("rowheader", { name: "Owned Player" })
    ).not.toBeInTheDocument();

    await view.user.selectOptions(assignmentFilter, `team:${teamB}`);
    expect(
      await screen.findByRole("rowheader", { name: "Draft Prospect" })
    ).toBeInTheDocument();
    table = screen.getByRole("table");
    expect(
      within(table).queryByRole("rowheader", { name: "Free Agent" })
    ).not.toBeInTheDocument();

    await view.user.selectOptions(assignmentFilter, "prospects");
    expect(
      await screen.findByRole("rowheader", { name: "Draft Prospect" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Compare/ })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Load next 100 players" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("All matching players loaded.")).toBeInTheDocument();
  });

  it("appends the next player page only after the user requests it", async () => {
    let playerPageRequests = 0;
    const fetchImpl = vi.fn(async (url) => {
      const parsed = new URL(url);
      const { pathname, searchParams } = parsed;
      if (pathname === "/api/v1/session") return envelope(session());
      if (pathname === "/api/v1/leagues") {
        return envelope({ code: "LEAGUES_FOUND", leagues: [league()] });
      }
      if (pathname === `/api/v1/leagues/${leagueId}/teams`) {
        return envelope({
          code: "TEAMS_FOUND",
          teams: [team(teamA, "Alpha Team")],
        });
      }
      if (pathname === `/api/v1/leagues/${leagueId}/players`) {
        playerPageRequests += 1;
        if (!searchParams.get("cursor")) {
          return envelope(
            [
              player({
                id: freeAgentId,
                name: "First Page Player",
                gamesPlayed: 10,
                fantasyPointsHundredths: 2500,
              }),
            ],
            {
              page: { nextCursor: freeAgentId, hasMore: true },
            }
          );
        }
        expect(searchParams.get("cursor")).toBe(freeAgentId);
        return envelope(
          [
            player({
              id: ownedPlayerId,
              name: "Second Page Player",
              gamesPlayed: 8,
              fantasyPointsHundredths: 1500,
            }),
          ],
          { page: { nextCursor: null, hasMore: false } }
        );
      }
      if (pathname === `/api/v1/leagues/${leagueId}/auctions`) {
        return envelope([], {
          actions: auctionActions(false),
          page: { nextCursor: null, hasMore: false },
        });
      }
      throw new Error(`Unexpected request: ${pathname}`);
    });
    const view = renderWithProviders(
      <Routes>
        <Route
          path="/leagues/:leagueId/players"
          element={<PlayersCatalogPage />}
        />
      </Routes>,
      {
        initialEntries: [`/leagues/${leagueId}/players`],
        enableSession: true,
        config,
        sessionOptions: { fetchImpl },
      }
    );

    expect(
      await screen.findByRole("rowheader", { name: "First Page Player" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("rowheader", { name: "Second Page Player" })
    ).not.toBeInTheDocument();
    expect(playerPageRequests).toBe(1);
    expect(screen.queryByRole("link", { name: "Start auction" })).toBeNull();
    expect(
      screen.getByLabelText(/Start auction unavailable for First Page Player/i)
    ).toHaveAttribute("title", "This action isn’t available right now.");

    await view.user.click(
      screen.getByRole("button", { name: "Load next 100 players" })
    );

    expect(
      await screen.findByRole("rowheader", { name: "Second Page Player" })
    ).toBeInTheDocument();
    expect(playerPageRequests).toBe(2);
    expect(
      screen.queryByRole("button", { name: "Load next 100 players" })
    ).not.toBeInTheDocument();
  });
});
