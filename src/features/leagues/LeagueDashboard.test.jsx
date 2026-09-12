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

function manager(assignmentId, version, protectedAdministrator = false) {
  return {
    assignmentId,
    userId: managerId,
    displayName: "Test Manager",
    isProtectedPlatformAdministrator: protectedAdministrator,
    acceptedAtMs: 1,
    version,
  };
}

function setup({
  protectedAdministrator = false,
  leagueStatus = "active",
  assignmentError = null,
  usersError = null,
  administrator = false,
} = {}) {
  const request = vi.fn(async (path, options = {}) => {
    if (path === "/api/v1/admin/users") return { data: { code: "ADMIN_USERS_FOUND", users: [
      { id: managerId, displayName: "grae", email: "grae@example.test", status: "active" },
      { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", displayName: "Pending Account", email: "pending@example.test", status: "pending_verification" },
      { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", displayName: "Administrator", email: "admin@example.test", status: "active", isPlatformAdministrator: true },
    ] } };
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
              isProtectedPlatformAdministrator: false,
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
              isProtectedPlatformAdministrator: protectedAdministrator,
              user: { id: managerId, displayName: "Test Manager" },
            },
          ],
        },
      };
    }
    if (path === `/api/v1/leagues/${leagueId}/invitable-users`) {
      if (usersError) throw usersError;
      return {
        data: {
          code: "INVITABLE_LEAGUE_USERS_FOUND",
          users: [{ id: "99999999-9999-4999-8999-999999999999", displayName: "New Manager", email: "new@example.test" }],
        },
      };
    }
    if (path === `/api/v1/leagues/${leagueId}/teams/${teamThreeId}/manager-assignment` && options.method === "POST") {
      if (assignmentError) throw assignmentError;
      return { data: { code: "TEAM_MANAGER_ASSIGNMENT_PROPOSED", assignment: { status: "pending" } } };
    }
    if (path === `/api/v1/leagues/${leagueId}/invitations` && options.method === "POST") {
      return { data: { code: "LEAGUE_INVITATION_CREATED" } };
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
      currentManager: manager(
        "assignment-team-one",
        4,
        protectedAdministrator
      ),
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
      league={{ id: leagueId, name: "Alpha League", status: leagueStatus, membership: { effectiveAuthority: administrator ? "platform_administrator" : "commissioner" } }}
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
  it("finds every administrator account, searches case-insensitively, and keeps unavailable accounts unassignable", async () => {
    const { user, request } = setup({ administrator: true });
    const input = screen.getByRole("combobox", { name: "User", exact: true });
    await waitFor(() => expect(input).toBeEnabled());
    await user.type(input, "GR");
    expect(await screen.findByRole("option", { name: /grae/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Pending Account/ })).not.toBeInTheDocument();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(input).toHaveValue("grae");
    expect(screen.getByRole("button", { name: "Send team assignment" })).toBeDisabled();
    await user.clear(input);
    await user.type(input, "Pending");
    const pending = await screen.findByRole("option", { name: /Pending Account/ });
    expect(pending).toHaveAttribute("aria-disabled", "true");
    await user.click(pending);
    expect(screen.getByRole("button", { name: "Invite user" })).toBeDisabled();
    expect(request.mock.calls.some(([, options]) => options?.method === "POST")).toBe(false);
    await user.clear(input);
    await user.type(input, "missing name");
    expect(screen.getByText("No accounts match your search.")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("offers existing managers and sends an additional team assignment without changing their other teams", async () => {
    const { request, user } = setup();
    await waitFor(() => expect(screen.getByRole("combobox", { name: "User", exact: true })).toBeEnabled());
    await user.click(screen.getByRole("combobox", { name: "User", exact: true }));
    await user.click(await screen.findByRole("option", { name: /Test Manager/ }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Team", exact: true }), teamThreeId);
    await user.click(screen.getByRole("button", { name: "Send team assignment" }));

    expect(await screen.findByText("Team assignment sent. The user must accept it in Notifications. Their other teams stay assigned.")).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith(
      `/api/v1/leagues/${leagueId}/teams/${teamThreeId}/manager-assignment`,
      expect.objectContaining({ method: "POST", authenticated: true, body: { userId: managerId }, idempotencyKey: expect.any(String) })
    );
    expect(request.mock.calls.filter(([, options]) => options?.method === "POST")).toHaveLength(1);
    expect(request.mock.calls.some(([, options]) => options?.method === "DELETE")).toBe(false);
    expect(screen.getAllByText("Managed by Test Manager", { selector: "small" })).toHaveLength(2);
  });

  it("keeps the invitation workflow for accounts that have not joined the league", async () => {
    const { request, user } = setup();
    await waitFor(() => expect(screen.getByRole("combobox", { name: "User", exact: true })).toBeEnabled());
    await user.click(screen.getByRole("combobox", { name: "User", exact: true }));
    await user.click(await screen.findByRole("option", { name: /New Manager/ }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Team", exact: true }), teamThreeId);
    await user.click(screen.getByRole("button", { name: "Invite user" }));
    expect(await screen.findByText("Invitation sent. The user must accept it before joining.")).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith(
      `/api/v1/leagues/${leagueId}/invitations`,
      expect.objectContaining({ method: "POST", body: { userId: "99999999-9999-4999-8999-999999999999", workflow: "manage_team", teamId: teamThreeId } })
    );
  });

  it("requires an existing team for members even while the league is in setup", async () => {
    const { user } = setup({ leagueStatus: "setup" });
    await waitFor(() => expect(screen.getByRole("combobox", { name: "User", exact: true })).toBeEnabled());
    expect(screen.getByRole("option", { name: "User creates a team" })).toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: "User", exact: true }));
    await user.click(await screen.findByRole("option", { name: /Test Manager/ }));
    expect(screen.queryByRole("option", { name: "User creates a team" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send team assignment" })).toBeDisabled();
    await user.selectOptions(screen.getByRole("combobox", { name: "Team", exact: true }), teamThreeId);
    expect(screen.getByRole("button", { name: "Send team assignment" })).toBeEnabled();
  });

  it("preserves the selection and reports a rejected assignment without claiming success", async () => {
    const { user } = setup({ assignmentError: new Error("Assignment rejected") });
    await waitFor(() => expect(screen.getByRole("combobox", { name: "User", exact: true })).toBeEnabled());
    await user.click(screen.getByRole("combobox", { name: "User", exact: true }));
    await user.click(await screen.findByRole("option", { name: /Test Manager/ }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Team", exact: true }), teamThreeId);
    await user.click(screen.getByRole("button", { name: "Send team assignment" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(/Team assignment sent/)).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "User", exact: true })).toHaveValue("Test Manager");
    expect(screen.getByRole("combobox", { name: "Team", exact: true })).toHaveValue(teamThreeId);
  });

  it("disables assignment when the account list cannot be loaded", async () => {
    setup({ usersError: new Error("Accounts unavailable") });
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "User", exact: true })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Invite user" })).toBeDisabled();
  });

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

  it("does not offer membership removal or team unassignment for a protected administrator", async () => {
    setup({ protectedAdministrator: true });

    await waitFor(() => {
      expect(screen.getAllByText("Protected administrator")).toHaveLength(2);
    });
    expect(
      screen.queryByRole("button", {
        name: "Unassign Test Manager from Alpha One",
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove from league" })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Test Manager", exact: true })).not.toBeInTheDocument();
  });
});
