import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render.jsx";
import { applyRealtimeInvalidation, parseRealtimeEnvelope, REALTIME_RELATED_ID_KEYS } from "../../shared/realtime/realtimeInvalidation.js";
import { PendingLeagueAccess } from "./NotificationsPage.jsx";
import { TeamManagerAssignmentActions } from "./TeamManagerAssignmentActions.jsx";

const assignmentId = "11111111-1111-4111-8111-111111111111";
const leagueId = "22222222-2222-4222-8222-222222222222";
const teamId = "33333333-3333-4333-8333-333333333333";
const userId = "44444444-4444-4444-8444-444444444444";
const otherLeagueId = "55555555-5555-4555-8555-555555555555";
const config = { appEnv: "local", apiOrigin: "http://localhost:4000", socketOrigin: "http://localhost:4000", buildId: null };

describe("assignment updates received in another open tab", () => {
  it.each([
    ["team-manager", "accepted", "You now manage Second Team. Your other team assignments stay the same."],
    ["team-manager", "declined", "Team assignment declined. Your existing teams stay assigned."],
    ["commissioner", "accepted", "Commissioner role accepted."],
    ["commissioner", "declined", "Commissioner invitation declined."],
  ])("refreshes the %s card after %s without submitting a response", async (kind, resultingStatus, message) => {
    let status = "pending";
    const path = `/api/v1/${kind}-assignments/${assignmentId}`;
    const request = vi.fn(async (url, options) => {
      expect(options.method).not.toBe("POST");
      const data = url.startsWith("/api/v1/notifications?")
        ? { code: "NOTIFICATIONS_FOUND", notifications: [], page: { limit: 25, nextCursor: null } }
        : { code: "TEAM_MANAGER_ASSIGNMENT_FOUND", assignment: { id: assignmentId, status },
            league: { id: leagueId, name: "Alpha League" }, team: { id: teamId, name: "Second Team" }, proposedUser: { id: userId } };
      if (!url.startsWith("/api/v1/notifications?")) expect(url).toBe(path);
      options.validateData(data);
      return { data };
    });
    const session = { status: "authenticated", user: { id: userId }, httpClient: { request } };
    const view = renderWithProviders(kind === "team-manager"
      ? <TeamManagerAssignmentActions notification={{ messageData: { assignmentId, leagueId, teamId } }} session={session} />
      : <PendingLeagueAccess session={session} />, { config, initialEntries: [`/leagues?assignmentId=${assignmentId}`] });
    const outsideKey = ["league", otherLeagueId, "teams"];
    view.queryClient.setQueryData(outsideKey, { untouched: true });
    const acceptLabel = kind === "team-manager" ? "Accept team assignment" : "Accept commissioner role";
    await screen.findByRole("button", { name: acceptLabel });
    status = resultingStatus;
    await applyRealtimeInvalidation(view.queryClient, parseRealtimeEnvelope("league.changed", {
      eventId: assignmentId, type: "league.changed", leagueId, resourceId: assignmentId, version: 2,
      reasonCode: kind === "team-manager" ? "manager_assignment_changed" : "commissioner_assignment_changed",
      occurredAt: 1_800_000_000_000,
      related: Object.fromEntries(REALTIME_RELATED_ID_KEYS.map(key => [key, key === "teamId" && kind === "team-manager" ? teamId : null])),
    }));
    expect(await screen.findByText(message)).toBeVisible();
    expect(screen.queryByRole("button", { name: acceptLabel })).not.toBeInTheDocument();
    expect(request.mock.calls.filter(([url]) => url === path)).toHaveLength(2);
    expect(view.queryClient.getQueryData(outsideKey)).toEqual({ untouched: true });
    expect(view.queryClient.getQueryState(outsideKey).isInvalidated).toBe(false);
  });
});
