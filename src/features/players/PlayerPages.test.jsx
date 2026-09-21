import { screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("socket.io-client", () => ({
  io: () => ({ onAny() {}, offAny() {}, disconnect() {} }),
}));

import { renderWithProviders } from "../../test/render.jsx";
import { PlayerDetailPage, PlayersPage } from "./PlayerPages.jsx";
import { validateLeaguePlayerDetail } from "./playerContracts.js";

const leagueId = "11111111-1111-4111-8111-111111111111";
const playerOneId = "22222222-2222-4222-8222-222222222222";
const playerTwoId = "33333333-3333-4333-8333-333333333333";
const membershipId = "44444444-4444-4444-8444-444444444444";
const teamId = "55555555-5555-4555-8555-555555555555";
const config = {
  appEnv: "local",
  apiOrigin: "http://localhost:4000",
  socketOrigin: "http://localhost:4000",
  buildId: null,
};

function envelope(data, page) {
  return new Response(
    JSON.stringify({
      data,
      ...(page ? { page } : {}),
      meta: { requestId: "request-1" },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

function player(id, fullName) {
  const [firstName, ...lastName] = fullName.split(" ");
  return {
    id,
    firstName,
    lastName: lastName.join(" "),
    fullName,
    birthDate: "1997-01-02",
    status: "active",
    provider: {
      provider: "nhl",
      sourcePosition: "C",
      normalizedPosition: "F",
      nhlTeamAbbreviation: "VAN",
      active: true,
      sourceVersion: "2026-07-22",
      effectiveAtMs: 1,
    },
    statistics: {
      provider: "sportsdataio-discovery-lab",
      nhlSeasonKey: "20252026",
      gamesPlayed: 82,
      goals: 40,
      assists: 50,
      nhlPoints: 90,
      fantasyPointsHundredths: 10000,
      sourceUpdatedAtMs: 1,
    },
    league: {
      id: leagueId,
      ownership:
        id === playerOneId
          ? {
              kind: "Rostered",
              category: "Active",
              team: { id: teamId, name: "Player Team" },
            }
          : null,
      activeContract:
        id === playerOneId
          ? {
              originalTotalValueCents: 900,
              originalTermYears: 3,
              aavCents: 300,
              remainingYears: 2,
            }
          : null,
    },
    version: 1,
  };
}

function session() {
  return {
    csrfToken: "D".repeat(43),
    session: {
      id: membershipId,
      userId: "user-1",
      status: "active",
      createdAtMs: 1,
      lastUsedAtMs: 1,
      idleExpiresAtMs: 2,
      absoluteExpiresAtMs: 3,
      version: 1,
    },
    user: {
      id: "user-1",
      displayName: "Manager",
      status: "active",
      version: 1,
    },
  };
}

function leagues() {
  return {
    code: "LEAGUES_FOUND",
    leagues: [
      {
        id: leagueId,
        name: "Player League",
        status: "active",
        timezone: "America/Vancouver",
        currentSeason: null,
        membership: {
          id: membershipId,
          permissionCategory: "manager",
          status: "active",
          version: 1,
        },
        version: 1,
      },
    ],
  };
}

function baseFetch(extra) {
  return vi.fn(async (url) => {
    const parsed = new URL(url);
    if (parsed.pathname === "/api/v1/session") return envelope(session());
    if (parsed.pathname === "/api/v1/leagues") return envelope(leagues());
    return extra(parsed);
  });
}

function renderPage(initialEntry, route, element, fetchImpl) {
  return renderWithProviders(
    <Routes>
      <Route path={route} element={element} />
    </Routes>,
    {
      initialEntries: [initialEntry],
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    }
  );
}

describe("authenticated player pages", () => {
  it("searches by name and links results through stable player IDs", async () => {
    const fetchImpl = baseFetch((parsed) => {
      if (
        parsed.pathname ===
        `/api/v1/leagues/${leagueId}/players`
      ) {
        const query = parsed.searchParams.get("query");
        const players =
          query === "alex"
            ? [player(playerOneId, "Alex Example")]
            : [
                player(playerOneId, "Alex Example"),
                player(playerTwoId, "Blair Example"),
              ];
        return envelope(players, { nextCursor: null, hasMore: false });
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    const view = renderPage(
      `/leagues/${leagueId}/players`,
      "/leagues/:leagueId/players",
      <PlayersPage />,
      fetchImpl
    );

    expect(
      await screen.findByRole("link", { name: "Alex Example" })
    ).toHaveAttribute(
      "href",
      `/leagues/${leagueId}/players/${playerOneId}`
    );
    await view.user.type(
      screen.getByRole("combobox", { name: "Search by player name" }),
      "alex"
    );
    await view.user.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("link", { name: "Blair Example" })
      ).toBeNull()
    );
    expect(
      fetchImpl.mock.calls.some(([url]) => {
        const parsed = new URL(url);
        return (
          parsed.pathname === `/api/v1/leagues/${leagueId}/players` &&
          parsed.searchParams.get("query") === "alex"
        );
      })
    ).toBe(true);
    expect(screen.queryByRole("link", { name: "Blair Example" })).toBeNull();
    const playerRow = screen.getByRole("row", { name: /Alex Example/ });
    expect(within(playerRow).getByText("VAN")).toBeInTheDocument();
    expect(playerRow.querySelector(".hl-player-col-aav")).toHaveTextContent(
      "$3.00"
    );
    expect(playerRow.querySelector(".hl-player-col-years")).toHaveTextContent(
      "2"
    );
    expect(
      within(playerRow).queryByText("Player Team · Active")
    ).not.toBeInTheDocument();
  });

  it("renders useful player details without exposing provider identifiers", async () => {
    const fetchImpl = baseFetch((parsed) => {
      if (
        parsed.pathname ===
        `/api/v1/leagues/${leagueId}/players/${playerOneId}`
      ) {
        return envelope({
          ...player(playerOneId, "Alex Example"),
          externalIds: [
            { provider: "nhl", externalValue: "8470001", createdAtMs: 1 },
          ],
        });
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    renderPage(
      `/leagues/${leagueId}/players/${playerOneId}`,
      "/leagues/:leagueId/players/:playerId",
      <PlayerDetailPage />,
      fetchImpl
    );

    expect(
      await screen.findByRole("heading", { name: "Alex Example" })
    ).toBeInTheDocument();
    expect(screen.queryByText("nhl: 8470001")).not.toBeInTheDocument();
    expect(screen.queryByText("Provider identifiers")).not.toBeInTheDocument();
    expect(screen.queryByText(/authoritative/i)).not.toBeInTheDocument();
    expect(screen.getByText("Season statistics")).toBeInTheDocument();
    expect(screen.getByText("SportsDataIO historical data")).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Player League ownership and contract",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Player Team")).toBeInTheDocument();
    expect(screen.getByText("Cap charge (AAV)")).toBeInTheDocument();
    expect(screen.getByText("$3.00")).toBeInTheDocument();
    expect(screen.getByText("$9.00")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to players" })).toHaveAttribute(
      "href",
      `/leagues/${leagueId}/players`
    );
  });

  it.each([
    { label: "preseason zero totals", gamesPlayed: 0, goals: 0, assists: 0, fantasyPointsHundredths: 0 },
    { label: "completed-game totals", gamesPlayed: 2, goals: 2, assists: 3, fantasyPointsHundredths: 550 },
  ])("renders NHL $label with the exact season and source", async (totals) => {
    const { label: _label, ...values } = totals;
    const detail = {
      ...player(playerOneId, "Alex Example"),
      externalIds: [],
      statistics: {
        provider: "nhl-completed-games",
        nhlSeasonKey: "20262027",
        ...values,
        nhlPoints: values.goals + values.assists,
        sourceUpdatedAtMs: 1,
      },
    };
    const fetchImpl = baseFetch((parsed) => {
      if (parsed.pathname === `/api/v1/leagues/${leagueId}/players/${playerOneId}`) return envelope(detail);
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    renderPage(`/leagues/${leagueId}/players/${playerOneId}`, "/leagues/:leagueId/players/:playerId", <PlayerDetailPage />, fetchImpl);
    const statistics = await screen.findByRole("region", { name: "Season statistics" });
    expect(within(statistics).getByText("2026–27")).toBeInTheDocument();
    expect(within(statistics).getByText("NHL completed games")).toBeInTheDocument();
    expect(within(statistics).getByText((values.fantasyPointsHundredths / 100).toFixed(2))).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(/Last-season/)).not.toBeInTheDocument();
  });

  it("loads current-season NHL player search results through the shared contract", async () => {
    const current = player(playerOneId, "Alex Example");
    current.statistics = { ...current.statistics, provider: "nhl-completed-games", nhlSeasonKey: "20262027" };
    const fetchImpl = baseFetch((parsed) => {
      if (parsed.pathname === `/api/v1/leagues/${leagueId}/players`) return envelope([current], { nextCursor: null, hasMore: false });
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    renderPage(`/leagues/${leagueId}/players`, "/leagues/:leagueId/players", <PlayersPage />, fetchImpl);
    expect(await screen.findByRole("row", { name: /Alex Example/ })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each([
    { label: "fixture", statistics: { ...player(playerOneId, "Alex Example").statistics, provider: "release_qa_fixture", nhlSeasonKey: "20262027" } },
    { label: "unavailable", statistics: null },
  ])("keeps $label statistics distinct from completed NHL games", async ({ statistics }) => {
    const fetchImpl = baseFetch((parsed) => {
      if (parsed.pathname === `/api/v1/leagues/${leagueId}/players/${playerOneId}`) return envelope({ ...player(playerOneId, "Alex Example"), statistics, externalIds: [] });
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    renderPage(`/leagues/${leagueId}/players/${playerOneId}`, "/leagues/:leagueId/players/:playerId", <PlayerDetailPage />, fetchImpl);
    const region = await screen.findByRole("region", { name: "Season statistics" });
    expect(within(region).getByText(statistics ? "Synthetic Release QA fixture data" : "Statistics are not available for this player.")).toBeInTheDocument();
    expect(within(region).queryByText("NHL completed games")).not.toBeInTheDocument();
  });

  it("retains strict source, season and numeric validation for NHL statistics", () => {
    const detail = { ...player(playerOneId, "Alex Example"), externalIds: [] };
    detail.statistics = { ...detail.statistics, provider: "nhl-completed-games", nhlSeasonKey: "20262027" };
    expect(validateLeaguePlayerDetail(detail, leagueId)).toBe(true);
    for (const invalid of [{ provider: "unapproved-provider" }, { nhlSeasonKey: "2026" }, { gamesPlayed: -1 }, { nhlPoints: 999 }]) {
      expect(() => validateLeaguePlayerDetail({ ...detail, statistics: { ...detail.statistics, ...invalid } }, leagueId)).toThrow();
    }
  });
});
