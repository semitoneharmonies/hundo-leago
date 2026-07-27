import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../test/render.jsx";
import TopBar from "./TopBar.jsx";

const leagueId = "11111111-1111-4111-8111-111111111111";
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
  effectiveAuthority = permissionCategory
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
        leagues: [
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
  effectiveAuthority = permissionCategory
) {
  const result = renderWithProviders(<TopBar />, {
    initialEntries: [`/leagues/${leagueId}/standings`],
    enableSession: true,
    config,
    sessionOptions: {
      fetchImpl: fetchScenario(
        permissionCategory,
        effectiveAuthority
      ),
    },
    socketFactory,
  });
  const logo = await screen.findByRole("link", { name: "Hundo Leago" });
  await waitFor(() =>
    expect(logo).toHaveAttribute("href", `/leagues/${leagueId}`)
  );
  await result.user.click(screen.getByRole("button", { name: "Menu" }));
  return result;
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
  });
});
