import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../test/render.jsx";
import TopBar from "./TopBar.jsx";

const leagueId = "11111111-1111-4111-8111-111111111111";
const fadId = "22222222-2222-4222-8222-222222222222";
const seasonId = "33333333-3333-4333-8333-333333333333";
const teamId = "44444444-4444-4444-8444-444444444444";
const cardId = "55555555-5555-4555-8555-555555555555";
const assignmentId = "66666666-6666-4666-8666-666666666666";
const unauthorizedLeagueId = "77777777-7777-4777-8777-777777777777";
const config = Object.freeze({
  appEnv: "local",
  apiOrigin: "http://localhost:4000",
  socketOrigin: "http://localhost:4000",
  buildId: null,
});

function response(data) {
  return new Response(JSON.stringify({ data, meta: { requestId: "request-1" } }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function fetchScenario(
  permissionCategory,
  effectiveAuthority = permissionCategory,
  fadNavigation = null,
  visibleLeagues = null
) {
  return vi.fn(async (url) => {
    const path = new URL(url).pathname;
    if (path === "/api/v1/session") {
      return response({
        csrfToken: "D".repeat(43),
        session: {
          id: "session-topbar",
          userId: "user-topbar",
          status: "active",
          createdAtMs: 1,
          lastUsedAtMs: 2,
          idleExpiresAtMs: 3,
          absoluteExpiresAtMs: 4,
          version: 1,
        },
        user: {
          id: "user-topbar",
          displayName: "Navigation Manager",
          status: "active",
          version: 1,
        },
      });
    }
    if (path === "/api/v1/leagues") {
      return response({
        code: "LEAGUES_FOUND",
        leagues: visibleLeagues || [
          {
            id: leagueId,
            name: "Navigation League",
            status: "active",
            currentSeason: null,
            membership: {
              effectiveAuthority,
              id: "membership-topbar",
              permissionCategory,
              status: "active",
              version: 1,
            },
            version: 1,
          },
        ],
      });
    }
    if (
      path ===
      `/api/v1/leagues/${leagueId}/free-agent-drafts/navigation`
    ) {
      return response(
        fadNavigation || {
          serverNowMs: 1,
          timeZone: "America/Vancouver",
          fadId: null,
          seasonId: null,
          phase: "inactive",
          showMainNavigation: false,
          candidateDeadlineAtMs: null,
          nextRolloverAtMs: null,
          frozenFadFirstMatchupStartsAtMs: null,
          competitionFirstMatchupStartsAtMs: null,
          managedCards: [],
          rosterLinks: [],
          urgencyCode: "NONE",
        }
      );
    }
    throw new Error(`Unexpected request: ${path}`);
  });
}

function socketFactory() {
  return {
    disconnect: vi.fn(),
    offAny: vi.fn(),
    onAny: vi.fn(),
  };
}

async function renderTopBar(
  permissionCategory = "manager",
  effectiveAuthority = permissionCategory,
  {
    fadNavigation = null,
    initialEntry = `/leagues/${leagueId}/standings`,
    visibleLeagues = null,
    expectedLogoHref = `/leagues/${leagueId}`,
  } = {}
) {
  const fetchImpl = fetchScenario(
    permissionCategory,
    effectiveAuthority,
    fadNavigation,
    visibleLeagues
  );
  const result = renderWithProviders(<TopBar />, {
    initialEntries: [initialEntry],
    enableSession: true,
    config,
    sessionOptions: {
      fetchImpl,
    },
    socketFactory,
  });
  const logo = await screen.findByRole("link", { name: "Hundo Leago" });
  await waitFor(() =>
    expect(logo).toHaveAttribute("href", expectedLogoHref)
  );
  await result.user.click(screen.getByRole("button", { name: "Menu" }));
  return { ...result, fetchImpl };
}

describe("top bar navigation", () => {
  it("keeps the logo in responsive layout flow without fixed inline sizing", async () => {
    await renderTopBar();

    const logo = screen.getByRole("link", { name: "Hundo Leago" });
    expect(logo.style.position).toBe("");
    expect(logo.style.top).toBe("");
    expect(logo.style.transform).toBe("");
    expect(logo.querySelector("img")).toBeNull();
    expect(within(logo).getByText("Hundo", { exact: false })).toBeInTheDocument();
    expect(
      screen.getByRole("region", {
        name: "Hockey quote ticker. Hover or focus to pause.",
      })
    ).toBeInTheDocument();
  });

  it("closes the primary menu with Escape and restores trigger focus", async () => {
    const view = await renderTopBar();
    const menuButton = screen.getByRole("button", { name: "Menu" });

    expect(
      screen.getByRole("navigation", { name: "Main navigation" })
    ).toBeInTheDocument();
    await view.user.keyboard("{Escape}");

    expect(
      screen.queryByRole("navigation", { name: "Main navigation" })
    ).toBeNull();
    expect(menuButton).toHaveFocus();
  });

  it("uses the selected league for every implemented manager page", async () => {
    await renderTopBar();

    const expected = {
      Dashboard: `/leagues/${leagueId}`,
      Teams: `/leagues/${leagueId}/teams`,
      Drafts: `/leagues/${leagueId}/drafts`,
      Players: `/leagues/${leagueId}/players`,
      Auctions: `/leagues/${leagueId}/auctions`,
      Trades: `/leagues/${leagueId}/trades`,
      Matchups: `/leagues/${leagueId}/matchups`,
      Standings: `/leagues/${leagueId}/standings`,
      "League activity": `/leagues/${leagueId}/activity`,
      Notifications: "/notifications",
    };
    const navigation = screen.getByRole("navigation", {
      name: "Main navigation",
    });
    for (const [name, href] of Object.entries(expected)) {
      expect(within(navigation).getByRole("link", { name })).toHaveAttribute(
        "href",
        href
      );
    }
    expect(screen.queryByRole("link", { name: "Commissioner tools" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Roster operations" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Free Agent Draft" })).toBeNull();
  });

  it("keeps the permanent Drafts area active on legacy FAD routes and retains live urgency", async () => {
    await renderTopBar("manager", "manager", {
      initialEntry: `/leagues/${leagueId}/free-agent-draft/${fadId}/cards/${teamId}`,
      fadNavigation: {
        serverNowMs: 1,
        timeZone: "America/Vancouver",
        fadId,
        seasonId,
        phase: "cards_open",
        showMainNavigation: true,
        candidateDeadlineAtMs: 100_000,
        nextRolloverAtMs: 200_000,
        frozenFadFirstMatchupStartsAtMs: 300_000,
        competitionFirstMatchupStartsAtMs: 300_000,
        managedCards: [
          {
            teamId,
            team: {
              teamId,
              name: "Navigation Owls",
              primaryColour: "#112233",
              secondaryColour: "#ffffff",
              tertiaryColour: null,
              patternTemplate: "solid",
              logoReference: null,
            },
            cardId,
            managerAssignmentId: assignmentId,
            cardVersion: 1,
            lifecycleStatus: "open",
            completenessCode: "incomplete",
            missingMandatoryCount: 1,
            conflictCount: 0,
            capStatus: "compliant",
            allocationEligibility: "eligible",
            helpRequestStatus: "not_requested",
            urgencyCode: "CARD_INCOMPLETE",
          },
        ],
        rosterLinks: [],
        urgencyCode: "CARD_INCOMPLETE",
      },
    });

    const link = screen.getByRole("link", { name: "Drafts" });
    expect(link).toHaveAttribute(
      "href",
      `/leagues/${leagueId}/drafts`
    );
    expect(link).toHaveAttribute("aria-current", "page");
    expect(link).toHaveTextContent("Candidate Card incomplete");
  });

  it("does not substitute another league on an unauthorized league URL", async () => {
    const view = await renderTopBar("manager", "manager", {
      initialEntry: `/leagues/${unauthorizedLeagueId}/free-agent-draft`,
      expectedLogoHref: "/leagues",
    });

    expect(screen.queryByRole("link", { name: "Drafts" })).toBeNull();
    expect(
      view.fetchImpl.mock.calls.some(([url]) =>
        new URL(url).pathname.includes("/free-agent-drafts/navigation")
      )
    ).toBe(false);
  });

  it("includes commissioner tools only for current commissioner authority", async () => {
    await renderTopBar("commissioner");

    expect(
      screen.getByRole("link", { name: "Commissioner tools" })
    ).toHaveAttribute("href", `/leagues/${leagueId}/commissioner`);
    expect(
      screen.getByRole("link", { name: "Roster operations" })
    ).toHaveAttribute(
      "href",
      `/leagues/${leagueId}/commissioner/rosters`
    );
  });

  it("includes commissioner tools for inherited platform-administrator authority", async () => {
    const view = await renderTopBar(
      "member",
      "platform_administrator"
    );

    expect(
      screen.getByRole("link", { name: "Commissioner tools" })
    ).toHaveAttribute("href", `/leagues/${leagueId}/commissioner`);
    expect(
      screen.getByRole("link", { name: "Roster operations" })
    ).toHaveAttribute(
      "href",
      `/leagues/${leagueId}/commissioner/rosters`
    );
    await view.user.click(
      screen.getByRole("button", { name: "Account menu" })
    );
    expect(
      screen.getByText(/Navigation League · Platform administrator/)
    ).toBeInTheDocument();
    const accountMenu = document.querySelector(".hl-account-menu");
    expect(
      within(accountMenu).queryByRole("link", { name: "Notifications" })
    ).toBeNull();
    expect(screen.getByRole("link", { name: "Notifications" }))
      .toHaveClass("hl-notification-link");
    expect(screen.getByRole("link", { name: "Notifications" }))
      .toHaveAttribute("href", "/notifications");
  });
});
