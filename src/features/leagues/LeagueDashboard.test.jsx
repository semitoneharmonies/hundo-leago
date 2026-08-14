import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../test/render.jsx";
import { CommissionerMembersPanel } from "./LeagueDashboard.jsx";
import { validateTeamList } from "./leagueContracts.js";

const leagueId = "11111111-1111-4111-8111-111111111111";
const commissionerId = "22222222-2222-4222-8222-222222222222";
const managerId = "33333333-3333-4333-8333-333333333333";
const teamOneId = "44444444-4444-4444-8444-444444444444";
const teamTwoId = "55555555-5555-4555-8555-555555555555";
const teamThreeId = "66666666-6666-4666-8666-666666666666";

function manager(assignmentId, version) {
  return {
    assignmentId,
    userId: managerId,
    displayName: "Test Manager",
    acceptedAtMs: 1,
    version,
  };
}

function setup() {
  const request = vi.fn(async (path, options = {}) => {
    if (path === `/api/v1/leagues/${leagueId}/memberships`) {
      return {
        data: {
          code: "LEAGUE_MEMBERSHIPS_FOUND",
          memberships: [
            {
              id: "77777777-7777-4777-8777-777777777777",
              version: 1,
              status: "active",
              permissionCategory: "commissioner",
              user: {
                id: commissionerId,
                displayName: "League Commissioner",
              },
            },
            {
              id: "88888888-8888-4888-8888-888888888888",
              version: 2,
              status: "active",
              permissionCategory: "manager",
              user: { id: managerId, displayName: "Test Manager" },
            },
          ],
        },
      };
    }
    if (path === `/api/v1/leagues/${leagueId}/invitable-users`) {
      return {
        data: { code: "INVITABLE_LEAGUE_USERS_FOUND", users: [] },
      };
    }
    if (
      path ===
        `/api/v1/leagues/${leagueId}/teams/${teamOneId}/manager-assignment` &&
      options.method === "DELETE"
    ) {
      return {
        data: {
          code: "TEAM_MANAGER_ASSIGNMENT_REMOVED",
          assignment: { id: "assignment-team-one", status: "ended" },
        },
      };
    }
    throw new Error(`Unexpected request: ${options.method || "GET"} ${path}`);
  });
  const teams = [
    {
      id: teamOneId,
      name: "Alpha One",
      currentManager: manager("assignment-team-one", 4),
    },
    {
      id: teamTwoId,
      name: "Alpha Two",
      currentManager: manager("assignment-team-two", 7),
    },
    { id: teamThreeId, name: "Alpha Three", currentManager: null },
  ];
  const view = renderWithProviders(
    <CommissionerMembersPanel
      league={{ id: leagueId, name: "Alpha League", status: "active" }}
      teams={teams}
      session={{
        user: { id: commissionerId },
        httpClient: { request },
      }}
    />
  );
  return { ...view, request };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("commissioner team assignments", () => {
  it("requires a stable assignment ID for every displayed current manager", () => {
    const team = {
      id: teamOneId,
      version: 1,
      leagueId,
      name: "Alpha One",
      currentManager: manager("assignment-team-one", 4),
    };
    expect(
      validateTeamList({ code: "TEAMS_FOUND", teams: [team] })
    ).toBe(true);
    expect(() =>
      validateTeamList({
        code: "TEAMS_FOUND",
        teams: [
          {
            ...team,
            currentManager: { ...team.currentManager, assignmentId: undefined },
          },
        ],
      })
    ).toThrow("The team manager is invalid.");
  });

  it("unassigns one team without removing the member or targeting their other team", async () => {
    const confirm = vi.fn(() => true);
    vi.stubGlobal("confirm", confirm);
    const { request, user } = setup();

    expect(
      await screen.findByRole("heading", { name: "Team managers" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Managed by Test Manager", { selector: "small" })
    ).toHaveLength(2);
    expect(screen.getByText("No manager assigned")).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Remove from league" })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Unassign Test Manager from Alpha One",
      })
    );

    expect(confirm).toHaveBeenCalledWith(
      "Unassign Test Manager from Alpha One? They will remain a member of Alpha League and keep any other team assignments."
    );
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(
        `/api/v1/leagues/${leagueId}/teams/${teamOneId}/manager-assignment`,
        expect.objectContaining({
          method: "DELETE",
          authenticated: true,
          body: { assignmentId: "assignment-team-one" },
          version: 4,
          idempotencyKey: expect.any(String),
        })
      )
    );
    expect(
      request.mock.calls.some(
        ([path, options]) =>
          options?.method === "DELETE" && path.includes("/memberships/")
      )
    ).toBe(false);
    expect(
      screen.getByRole("button", {
        name: "Unassign Test Manager from Alpha Two",
      })
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        "Test Manager was unassigned from Alpha One. Their league membership and other team assignments are unchanged."
      )
    ).toBeInTheDocument();
  });
});
