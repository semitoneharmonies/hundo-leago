import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render.jsx";
import { TeamManagerAssignmentActions } from "./TeamManagerAssignmentActions.jsx";
import { validateTeamManagerAssignment } from "./notificationContracts.js";

const assignmentId = "11111111-1111-4111-8111-111111111111";
const leagueId = "22222222-2222-4222-8222-222222222222";
const teamId = "33333333-3333-4333-8333-333333333333";
const userId = "44444444-4444-4444-8444-444444444444";
const expected = { assignmentId, leagueId, teamId, userId };
const path = `/api/v1/team-manager-assignments/${assignmentId}`;
const result = (status = "pending", code = "TEAM_MANAGER_ASSIGNMENT_FOUND") => ({
  code, assignment: { id: assignmentId, status },
  league: { id: leagueId, name: "Alpha League" },
  team: { id: teamId, name: "Second Team" }, proposedUser: { id: userId },
});

function setup({ status = "pending", failFirst = false, wrongTeam = false } = {}) {
  let writes = 0;
  const request = vi.fn(async (url, options) => {
    let data = result(status);
    if (options.method === "POST") {
      writes++;
      if (failFirst && writes === 1) throw new Error("Response lost");
      status = url.endsWith("/accept") ? "accepted" : "declined";
      data = result(status, `TEAM_MANAGER_ASSIGNMENT_${status.toUpperCase()}`);
    }
    if (wrongTeam) data.team.id = userId;
    options.validateData(data);
    return { data };
  });
  const view = renderWithProviders(<TeamManagerAssignmentActions
    notification={{ id: assignmentId, messageData: { assignmentId, leagueId, teamId } }}
    session={{ user: { id: userId }, httpClient: { request } }} />);
  return { ...view, request };
}

describe("team assignment responses", () => {
  it("waits for acceptance and refreshes only the affected league", async () => {
    const { request, user, queryClient } = setup();
    queryClient.setQueryData(["league", leagueId, "teams"], { old: true });
    queryClient.setQueryData(["league", userId, "teams"], { unrelated: true });
    await screen.findByRole("button", { name: "Accept team assignment" });
    expect(request.mock.calls.some(([, options]) => options.method === "POST")).toBe(false);
    await user.click(screen.getByRole("button", { name: "Accept team assignment" }));
    expect(await screen.findByRole("status")).toHaveTextContent("You now manage Second Team");
    expect(screen.getByRole("link", { name: "View team" })).toHaveAttribute("href", `/leagues/${leagueId}/teams/${teamId}/roster`);
    expect(request).toHaveBeenCalledWith(`${path}/accept`, expect.objectContaining({
      method: "POST", body: {}, authenticated: true, idempotencyKey: expect.any(String),
    }));
    expect(queryClient.getQueryState(["league", leagueId, "teams"]).isInvalidated).toBe(true);
    expect(queryClient.getQueryState(["league", userId, "teams"]).isInvalidated).toBe(false);
  });

  it("can decline without accepting the team", async () => {
    const { request, user } = setup();
    await user.click(await screen.findByRole("button", { name: "Decline team assignment" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Team assignment declined");
    expect(request).toHaveBeenCalledWith(`${path}/decline`, expect.objectContaining({ method: "POST", body: {} }));
    expect(screen.queryByRole("link", { name: "View team" })).not.toBeInTheDocument();
  });

  it("retries an uncertain response with the same idempotency key", async () => {
    const { request, user } = setup({ failFirst: true });
    await user.click(await screen.findByRole("button", { name: "Accept team assignment" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(/You now manage/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Accept team assignment" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("You now manage"));
    const writes = request.mock.calls.filter(([, options]) => options.method === "POST");
    expect(writes).toHaveLength(2);
    expect(writes[0][1].idempotencyKey).toBe(writes[1][1].idempotencyKey);
  });

  it("offers no action for an ended assignment", async () => {
    setup({ status: "ended" });
    expect(await screen.findByText(/This team assignment is no longer active/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("does not offer acceptance for a response belonging to another team", async () => {
    setup({ wrongTeam: true });
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("rejects mismatched assignments, leagues, users and unknown states", () => {
    expect(validateTeamManagerAssignment(result(), expected)).toBe(true);
    for (const changed of [
      { ...result(), assignment: { id: teamId, status: "pending" } },
      { ...result(), assignment: { id: assignmentId, status: "unknown" } },
      { ...result(), league: { id: userId, name: "Other league" } },
      { ...result(), proposedUser: { id: teamId } },
    ]) expect(() => validateTeamManagerAssignment(changed, expected)).toThrow();
  });
});
