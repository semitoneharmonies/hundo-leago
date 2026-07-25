import { screen } from "@testing-library/react";
import { Route } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../test/render.jsx";
import { routePaths } from "./routePaths.js";
import { ApplicationRoutes } from "./router.jsx";

function BrokenPage() {
  throw new Error("private implementation detail");
}

describe("application routes", () => {
  it("preserves a declared visible route", () => {
    renderWithProviders(
      <ApplicationRoutes>
        <Route path="/standings" element={<h1>Standings</h1>} />
      </ApplicationRoutes>,
      { initialEntries: ["/standings"] }
    );

    expect(screen.getByRole("heading", { name: "Standings" })).toBeInTheDocument();
  });

  it("renders accessible not-found behavior", () => {
    renderWithProviders(<ApplicationRoutes />, {
      initialEntries: ["/missing"],
    });

    expect(
      screen.getByRole("heading", { name: "Page not found" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return home" })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("renders a non-sensitive route error page", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    renderWithProviders(
      <ApplicationRoutes>
        <Route path="/broken" element={<BrokenPage />} />
      </ApplicationRoutes>,
      { initialEntries: ["/broken"] }
    );

    expect(
      screen.getByRole("heading", {
        name: "This page could not be displayed",
      })
    ).toBeInTheDocument();
    expect(screen.queryByText("private implementation detail")).toBeNull();
    consoleError.mockRestore();
  });
});

describe("route paths", () => {
  it("uses stable encoded IDs for league and team routes", () => {
    expect(routePaths.teamRoster("league-1", "team/2")).toBe(
      "/leagues/league-1/teams/team%2F2/roster"
    );
    expect(routePaths.leagueStandings("league-1")).toBe(
      "/leagues/league-1/standings"
    );
    expect(() => routePaths.league(" ")).toThrow("League ID");
  });
});
