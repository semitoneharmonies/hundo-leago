import { fireEvent, screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("socket.io-client", () => ({
  io: () => ({ onAny() {}, offAny() {}, disconnect() {} }),
}));

import { renderWithProviders } from "../../test/render.jsx";
import { AccountSettingsPage } from "./AccountSettingsPage.jsx";

const leagueId = "11111111-1111-4111-8111-111111111111";
const membershipId = "22222222-2222-4222-8222-222222222222";
const teamId = "33333333-3333-4333-8333-333333333333";
const userId = "44444444-4444-4444-8444-444444444444";
const config = {
  appEnv: "local",
  apiOrigin: "http://localhost:4000",
  socketOrigin: "http://localhost:4000",
  buildId: null,
};

function envelope(data) {
  return new Response(
    JSON.stringify({ data, meta: { requestId: "account-settings-test" } }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

function session() {
  return {
    csrfToken: "D".repeat(43),
    session: {
      id: membershipId,
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
      displayName: "Original Manager",
      status: "active",
      version: 1,
    },
  };
}

describe("account and team settings", () => {
  it("renders authorized settings and updates the display name by version", async () => {
    let profilePatch = null;
    let ifMatch = null;
    let teamName = "Alpha Ravens";
    let teamVersion = 1;
    let teamPatch = null;
    const fetchImpl = vi.fn(async (url, options = {}) => {
      const path = new URL(url).pathname;
      if (path === "/api/v1/session") return envelope(session());
      if (path === "/api/v1/account" && options.method === "PATCH") {
        profilePatch = JSON.parse(options.body);
        ifMatch = new Headers(options.headers).get("If-Match");
        return envelope({
          code: "ACCOUNT_PROFILE_UPDATED",
          user: {
            id: userId,
            email: "manager@example.test",
            displayName: profilePatch.displayName,
            status: "active",
            version: 2,
          },
        });
      }
      if (path === "/api/v1/account") {
        return envelope({
          code: "ACCOUNT_PROFILE_FOUND",
          user: {
            id: userId,
            email: "manager@example.test",
            displayName: "Original Manager",
            status: "active",
            version: 1,
          },
        });
      }
      if (path === "/api/v1/leagues") {
        return envelope({
          code: "LEAGUES_FOUND",
          leagues: [
            {
              id: leagueId,
              name: "Alpha League",
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
        });
      }
      if (path === `/api/v1/leagues/${leagueId}/teams`) {
        return envelope({
          code: "TEAMS_FOUND",
          teams: [
            {
              id: teamId,
              leagueId,
              name: teamName,
              status: "active",
              primaryColour: null,
              secondaryColour: null,
              tertiaryColour: null,
              patternTemplate: "even-two",
              logoReference: `/api/v1/leagues/${leagueId}/teams/${teamId}/logo`,
              createdAtMs: 1,
              updatedAtMs: 1,
              version: teamVersion,
              currentManager: {
                assignmentId: membershipId,
                userId,
                displayName: "Original Manager",
                acceptedAtMs: 1,
                version: 1,
              },
            },
          ],
        });
      }
      if (
        path === `/api/v1/leagues/${leagueId}/teams/${teamId}` &&
        options.method === "PATCH"
      ) {
        teamPatch = JSON.parse(options.body);
        teamName = teamPatch.name;
        teamVersion += 1;
        return envelope({
          code: "TEAM_UPDATED",
          team: {
            id: teamId,
            leagueId,
            name: teamName,
            status: "active",
            primaryColour: teamPatch.primaryColour,
            secondaryColour: teamPatch.secondaryColour,
            tertiaryColour: teamPatch.tertiaryColour,
            patternTemplate: teamPatch.patternTemplate,
            logoReference: `/api/v1/leagues/${leagueId}/teams/${teamId}/logo`,
            version: teamVersion,
          },
        });
      }
      throw new Error(`Unexpected request: ${path}`);
    });

    const view = renderWithProviders(
      <Routes>
        <Route path="/account" element={<AccountSettingsPage />} />
      </Routes>,
      {
        initialEntries: ["/account"],
        enableSession: true,
        config,
        sessionOptions: { fetchImpl },
      }
    );

    expect(
      await screen.findByRole("heading", {
        name: "Account and team settings",
      })
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("manager@example.test")).toHaveAttribute(
      "readonly"
    );
    expect(
      await screen.findByRole("heading", { name: "Alpha Ravens" })
    ).toBeInTheDocument();
    const templateSelect = screen.getByLabelText("Team template");
    expect(templateSelect).toHaveValue("even-two");
    expect(templateSelect.options).toHaveLength(35);
    expect(screen.getByLabelText("Colour 1")).toHaveValue("#16324f");
    expect(screen.getByLabelText("Colour 2")).toHaveValue("#f7f7f7");
    expect(screen.queryByLabelText("Colour 3")).not.toBeInTheDocument();
    const logo = document.querySelector(".hl-account-team-mark img");
    expect(logo).toHaveAttribute(
      "src",
      `http://localhost:4000/api/v1/leagues/${leagueId}/teams/${teamId}/logo`
    );
    expect(logo).toHaveAttribute("crossorigin", "use-credentials");

    const displayName = screen.getByLabelText("Display name");
    await view.user.clear(displayName);
    await view.user.type(displayName, "Updated Manager");
    await view.user.click(
      screen.getByRole("button", { name: "Save display name" })
    );
    await waitFor(() => {
      expect(profilePatch).toEqual({ displayName: "Updated Manager" });
      expect(ifMatch).toBe('"1"');
    });
    expect(await screen.findByText("Display name saved.")).toBeInTheDocument();

    const invalidateQueries = vi.spyOn(
      view.queryClient,
      "invalidateQueries"
    );
    await view.user.selectOptions(
      screen.getByLabelText("Team template"),
      "leopard"
    );
    expect(screen.getByLabelText("Colour 3")).toHaveValue("#f97316");
    expect(
      screen.getByRole("img", {
        name: "Leopard preview using 3 colours",
      })
    ).toBeInTheDocument();
    fireEvent.input(screen.getByLabelText("Colour 1"), {
      target: { value: "#112233" },
    });
    fireEvent.input(screen.getByLabelText("Colour 2"), {
      target: { value: "#aabbcc" },
    });
    fireEvent.input(screen.getByLabelText("Colour 3"), {
      target: { value: "#445566" },
    });
    const teamNameInput = screen.getByLabelText("Team name");
    await view.user.clear(teamNameInput);
    await view.user.type(teamNameInput, "Updated Ravens");
    await view.user.click(
      screen.getByRole("button", { name: "Save team profile" })
    );
    await waitFor(() => {
      expect(teamPatch).toMatchObject({
        name: "Updated Ravens",
        primaryColour: "#112233",
        secondaryColour: "#aabbcc",
        tertiaryColour: "#445566",
        patternTemplate: "leopard",
      });
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["league", leagueId],
    });
    expect(await screen.findByText("Team profile saved.")).toBeInTheDocument();
  });
});
