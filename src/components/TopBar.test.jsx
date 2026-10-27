import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../test/render.jsx";
import TopBar from "./TopBar.jsx";
import { readLeaguePreference } from "../features/leagues/leaguePreference.js";

const leagueId = "11111111-1111-4111-8111-111111111111";
const fadId = "22222222-2222-4222-8222-222222222222";
const seasonId = "33333333-3333-4333-8333-333333333333";
const teamId = "44444444-4444-4444-8444-444444444444";
const cardId = "55555555-5555-4555-8555-555555555555";
const assignmentId = "66666666-6666-4666-8666-666666666666";
const unauthorizedLeagueId = "77777777-7777-4777-8777-777777777777";
const otherLeagueId = "88888888-8888-4888-8888-888888888888";
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
    if(path===`/api/v1/leagues/${leagueId}/help`)return response({leagueId,canManage:false,teams:[{id:teamId,name:'North Stars'}],requests:[],cardHelp:[],nextCursor:null});
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
    if ([leagueId, otherLeagueId].some((id) => path === `/api/v1/leagues/${id}/free-agent-drafts/navigation`)) {
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
    openMenu = true,
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
  if (openMenu) await result.user.click(screen.getByRole("button", { name: "Menu" }));
  return { ...result, fetchImpl };
}

describe("top bar navigation", () => {
  it.each([false, true])("switches leagues from the title and restores its keyboard focus (desktop: %s)", async (desktop) => {
    const previousPreference = localStorage.getItem("hundo:league-preference:v1");
    vi.stubGlobal("matchMedia", vi.fn((query) => ({ matches: desktop && query === "(min-width: 1024px)", addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    const visibleLeagues = [leagueId, otherLeagueId].map((id, index) => ({
      id, name: index ? "Second League" : "Navigation League", status: "active", currentSeason: null, version: 1,
      membership: { id: `membership-${index}`, permissionCategory: "manager", effectiveAuthority: "manager", status: "active", version: 1 },
    }));
    try {
      const view = await renderTopBar("manager", "manager", { visibleLeagues, openMenu: !desktop });
      const title = screen.getByRole("button", { name: "Navigation League", exact: true });
      expect(title).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("button", { name: "Switch league", exact: true })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Switch league", exact: true })).not.toBeInTheDocument();
      await view.user.click(title);
      const picker = screen.getByRole("region", { name: "Your leagues" });
      expect(title).toHaveAttribute("aria-expanded", "true");
      expect(within(picker).getByRole("link", { name: /Navigation League/ })).toHaveAttribute("aria-current", "true");
      const destination = within(picker).getByRole("link", { name: /Second League/ });
      expect(destination).toHaveAttribute("href", `/leagues/${otherLeagueId}`);
      expect(within(picker).getByRole("link", { name: "League access and invitations" })).toHaveAttribute("href", "/leagues");
      expect(within(picker).getAllByText("Manager")).toHaveLength(2);
      await view.user.keyboard("{Escape}");
      expect(title).toHaveFocus();
      expect(title).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("region", { name: "Your leagues" })).not.toBeInTheDocument();
      await view.user.keyboard("{Enter}");
      await view.user.click(screen.getByRole("link", { name: /Second League/ }));
      expect(readLeaguePreference()).toBe(otherLeagueId);
      await waitFor(() => expect(screen.getByRole("link", { name: "Hundo Leago" })).toHaveAttribute("href", `/leagues/${otherLeagueId}`));
      expect(screen.queryByRole("region", { name: "Your leagues" })).not.toBeInTheDocument();
      if (!desktop) expect(screen.queryByRole("dialog", { name: "Mobile navigation" })).not.toBeInTheDocument();
      await view.user.click(screen.getByRole("button", { name: "Account menu" }));
      const accountMenu = document.querySelector(".hl-account-menu");
      expect(within(accountMenu).queryByRole("link", { name: /Switch league|Your league/ })).not.toBeInTheDocument();
    } finally {
      vi.unstubAllGlobals();
      if (previousPreference === null) localStorage.removeItem("hundo:league-preference:v1");
      else localStorage.setItem("hundo:league-preference:v1", previousPreference);
    }
  });

  it('opens the manager Help form from the bottom menu without commissioner tools',async()=>{
    const view=await renderTopBar('manager');
    expect(screen.queryByRole('button',{name:/Commissioner tools/})).not.toBeInTheDocument();
    expect(view.fetchImpl.mock.calls.some(([url])=>new URL(url).pathname.endsWith('/help'))).toBe(false);
    await view.user.click(screen.getByRole('button',{name:'Help',exact:true}));
    expect(await screen.findByLabelText('What needs attention?')).toBeVisible();
    expect(screen.getByLabelText('Your team')).toBeVisible();
    await view.user.click(screen.getByRole('button',{name:'Close help'}));
    expect(screen.queryByLabelText('What needs attention?')).not.toBeInTheDocument();
  });
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
      Drafts: `/leagues/${leagueId}/drafts`,
      Players: `/leagues/${leagueId}/players`,
      Auctions: `/leagues/${leagueId}/auctions`,
      Trades: `/leagues/${leagueId}/trades`,
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
    // Teams and Matchups open their accepted mobile submenus.
    for (const name of ["Teams", "Matchups", "Mini Games"]) {
      expect(within(navigation).getByRole("button", { name })).toHaveAttribute("aria-expanded", "false");
    }
    expect(screen.queryByRole("link", { name: "Commissioner tools" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Roster operations" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Free Agent Draft" })).toBeNull();
  });

  it("keeps Tip Jar in the selected league and marks its navigation active", async () => {
    await renderTopBar("manager", "manager", { initialEntry: `/leagues/${leagueId}/tip-jar` });
    fireEvent.click(screen.getByRole("button", { name: "Mini Games" }));
    const link = screen.getByRole("link", { name: "Play Tip Jar" });
    expect(link).toHaveAttribute("href", `/leagues/${leagueId}/tip-jar`);
    expect(link).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Play Mr. Boni" })).toHaveAttribute("href", `/leagues/${leagueId}/mr-boni`);
    fireEvent.keyDown(document.activeElement, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Mini Games" })).toHaveFocus();
  });

  it("opens Mini Games in the desktop sidebar and marks Mr. Boni active", async () => {
    vi.stubGlobal("matchMedia", vi.fn((query) => ({ matches: query === "(min-width: 1024px)", addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    try {
      await renderTopBar("manager", "manager", { initialEntry: `/leagues/${leagueId}/mr-boni`, openMenu: false });
      const sidebar = await screen.findByRole("complementary", { name: "League sidebar" });
      fireEvent.click(within(sidebar).getByRole("button", { name: "Mini Games" }));
      const link = within(sidebar).getByRole("link", { name: "Play Mr. Boni" });
      expect(link).toHaveAttribute("href", `/leagues/${leagueId}/mr-boni`);
      expect(link).toHaveAttribute("aria-current", "page");
      expect(within(sidebar).getByRole("link", { name: "Play Tip Jar" })).toHaveAttribute("href", `/leagues/${leagueId}/tip-jar`);
    } finally { vi.unstubAllGlobals(); }
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
    const view = await renderTopBar("commissioner");

    await view.user.click(screen.getByRole("button", { name: /Commissioner tools/ }));
    expect(screen.getByRole("link", { name: "All tools" })).toHaveAttribute("href", `/leagues/${leagueId}/commissioner`);
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

    await view.user.click(screen.getByRole("button", { name: /Commissioner tools/ }));
    expect(screen.getByRole("link", { name: "All tools" })).toHaveAttribute("href", `/leagues/${leagueId}/commissioner`);
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
