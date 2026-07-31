import { screen, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("socket.io-client", () => ({
  io: () => ({ onAny() {}, offAny() {}, disconnect() {} }),
}));

import { renderWithProviders } from "../../test/render.jsx";
import { PlayersCatalogPage } from "./PlayersCatalogPage.jsx";

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

function envelope(data, { page } = {}) {
  return new Response(
    JSON.stringify({
      data,
      ...(page ? { page } : {}),
      meta: { requestId: "request-1" },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
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

describe("league player catalog", () => {
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
      const path = new URL(url).pathname;
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
        return envelope(players, {
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
      "FP",
      "FPG",
      "Actions",
    ]);
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
    const nameSearch = screen.getByRole("searchbox", {
      name: "Search by player name",
    });
    await view.user.type(nameSearch, "free");
    const suggestions = await screen.findByRole("listbox");
    const suggestion = within(suggestions).getByRole("option", {
      name: /Free Agent/,
    });
    await view.user.click(within(suggestion).getByRole("button"));
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
      within(table).getByRole("rowheader", { name: "Draft Prospect" })
    ).toBeInTheDocument();
    expect(
      within(table).queryByRole("rowheader", { name: "Free Agent" })
    ).not.toBeInTheDocument();

    await view.user.selectOptions(assignmentFilter, "prospects");
    expect(
      within(table).getByRole("rowheader", { name: "Draft Prospect" })
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
