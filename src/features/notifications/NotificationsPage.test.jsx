import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("socket.io-client", () => ({
  io: () => ({ onAny() {}, offAny() {}, disconnect() {} }),
}));

import { renderWithProviders } from "../../test/render.jsx";
import { NotificationsPage } from "./NotificationsPage.jsx";

const notificationId = "11111111-1111-4111-8111-111111111111";
const invitationId = "22222222-2222-4222-8222-222222222222";
const leagueId = "33333333-3333-4333-8333-333333333333";
const teamId = "44444444-4444-4444-8444-444444444444";
const tradeId = "55555555-5555-4555-8555-555555555555";
const config = { appEnv: "local", apiOrigin: "http://localhost:4000", socketOrigin: "http://localhost:4000", buildId: null };

function envelope(data) {
  return new Response(JSON.stringify({ data, meta: { requestId: "request-1" } }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("M5-11 owner notifications", () => {
  it("lists without a write and explicitly marks only the selected row read", async () => {
    let read = false;
    const fetchImpl = vi.fn(async (url, options = {}) => {
      const path = new URL(url).pathname;
      if (path === "/api/v1/session") return envelope({
        csrfToken: "D".repeat(43),
        session: { id: "session-1", userId: "user-1", status: "active", createdAtMs: 1, lastUsedAtMs: 1, idleExpiresAtMs: 2, absoluteExpiresAtMs: 3, version: 1 },
        user: { id: "user-1", displayName: "Manager", status: "active", version: 1 },
      });
      if (path === "/api/v1/notifications" && (!options.method || options.method === "GET")) {
        return envelope({
          code: "NOTIFICATIONS_FOUND",
          notifications: [{ id: notificationId, leagueId: null, type: "account_notice", messageData: { message: "A private account notice." }, related: null, deliveryStatus: "delivered", createdAtMs: 1, readAtMs: read ? 2 : null, deliveredAtMs: 1, version: read ? 2 : 1 }],
          page: { limit: 25, nextCursor: null },
        });
      }
      if (path === `/api/v1/notifications/${notificationId}/read`) {
        read = true;
        return envelope({ code: "NOTIFICATION_READ", notification: {} });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    const view = renderWithProviders(<NotificationsPage />, {
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    });
    expect(await screen.findByText("A private account notice.")).toBeInTheDocument();
    const initialNotificationCalls = fetchImpl.mock.calls.filter(([url]) => new URL(url).pathname === "/api/v1/notifications");
    expect(initialNotificationCalls).toHaveLength(1);
    expect(initialNotificationCalls[0][1]?.method).toBe("GET");
    await view.user.click(screen.getByRole("button", { name: "Mark read" }));
    expect(fetchImpl.mock.calls.some(([url, options]) =>
      new URL(url).pathname.endsWith(`/${notificationId}/read`) &&
      options.method === "POST" &&
      options.headers.get("X-CSRF-Token") === "D".repeat(43)
    )).toBe(true);
  });

  it("links a received-trade notification to its acceptance preview", async () => {
    const fetchImpl = vi.fn(async (url) => {
      const path = new URL(url).pathname;
      if (path === "/api/v1/session") return envelope({
        csrfToken: "D".repeat(43),
        session: { id: "session-1", userId: "user-1", status: "active", createdAtMs: 1, lastUsedAtMs: 1, idleExpiresAtMs: 2, absoluteExpiresAtMs: 3, version: 1 },
        user: { id: "user-1", displayName: "Manager", status: "active", version: 1 },
      });
      if (path === "/api/v1/notifications") {
        return envelope({
          code: "NOTIFICATIONS_FOUND",
          notifications: [{
            id: notificationId,
            leagueId,
            type: "trade_proposal_received",
            messageData: {
              message: "Trade proposal received from Other Team.",
              tradeId,
              leagueId,
              proposingTeamId: teamId,
              proposingTeamName: "Other Team",
              receivingTeamId: invitationId,
              receivingTeamName: "Managed Team",
            },
            related: { feature: "trade", recordId: tradeId },
            deliveryStatus: "delivered",
            createdAtMs: 1,
            readAtMs: null,
            deliveredAtMs: 1,
            version: 1,
          }],
          page: { limit: 25, nextCursor: null },
        });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    renderWithProviders(<NotificationsPage />, {
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    });

    const link = await screen.findByRole("link", {
      name: /Trade proposal received from Other Team/i,
    });
    expect(link).toHaveAttribute(
      "href",
      `/leagues/${leagueId}/trades/${tradeId}?preview=acceptance`
    );
  });

  it("lets the invited user accept a pending manage-team invitation", async () => {
    let invitationStatus = "pending";
    let notificationRead = false;
    const invitationData = (code) => ({
      code,
      invitation: {
        id: invitationId,
        status: invitationStatus,
        workflow: "manage_team",
        invitedAtMs: 1,
        acceptedAtMs: invitationStatus === "accepted" ? 2 : null,
        version: invitationStatus === "accepted" ? 2 : 1,
      },
      league: {
        id: leagueId,
        name: "Release QA Alpha League",
        status: "active",
        version: 1,
      },
      invitedUser: { id: "user-1", displayName: "Manager" },
      membership: {
        id: "55555555-5555-4555-8555-555555555555",
        permissionCategory: "manager",
        status: invitationStatus === "accepted" ? "active" : "invited",
        joinedAtMs: invitationStatus === "accepted" ? 2 : null,
        version: invitationStatus === "accepted" ? 2 : 1,
      },
      team: {
        id: teamId,
        name: "Alpha Wolves",
        status: "active",
        primaryColour: "#0f172a",
        secondaryColour: "#64748b",
        logoReference: null,
        version: 1,
      },
      managerAssignment:
        invitationStatus === "accepted"
          ? {
              id: "66666666-6666-4666-8666-666666666666",
              status: "accepted",
              assignedAtMs: 2,
              acceptedAtMs: 2,
              version: 1,
            }
          : null,
    });
    const fetchImpl = vi.fn(async (url, options = {}) => {
      const path = new URL(url).pathname;
      if (path === "/api/v1/session") return envelope({
        csrfToken: "D".repeat(43),
        session: { id: "session-1", userId: "user-1", status: "active", createdAtMs: 1, lastUsedAtMs: 1, idleExpiresAtMs: 2, absoluteExpiresAtMs: 3, version: 1 },
        user: { id: "user-1", displayName: "Manager", status: "active", version: 1 },
      });
      if (path === "/api/v1/notifications" && (!options.method || options.method === "GET")) {
        return envelope({
          code: "NOTIFICATIONS_FOUND",
          notifications: [{
            id: notificationId,
            leagueId,
            type: "league_invitation_created",
            messageData: {
              invitationId,
              leagueId,
              leagueName: "Release QA Alpha League",
              workflow: "manage_team",
              teamId,
            },
            related: { feature: "league_invitation", recordId: invitationId },
            deliveryStatus: "delivered",
            createdAtMs: 1,
            readAtMs: notificationRead ? 2 : null,
            deliveredAtMs: 1,
            version: notificationRead ? 2 : 1,
          }],
          page: { limit: 25, nextCursor: null },
        });
      }
      if (
        path === `/api/v1/league-invitations/${invitationId}` &&
        (!options.method || options.method === "GET")
      ) {
        return envelope(invitationData("LEAGUE_INVITATION_FOUND"));
      }
      if (
        path === `/api/v1/league-invitations/${invitationId}/accept` &&
        options.method === "POST"
      ) {
        invitationStatus = "accepted";
        return envelope(invitationData("LEAGUE_INVITATION_ACCEPTED"));
      }
      if (path === `/api/v1/notifications/${notificationId}/read`) {
        notificationRead = true;
        return envelope({ code: "NOTIFICATION_READ", notification: {} });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    const view = renderWithProviders(<NotificationsPage />, {
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    });

    expect(
      await screen.findByText("Invitation to Release QA Alpha League")
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        "Join Release QA Alpha League as manager of Alpha Wolves."
      )
    ).toBeInTheDocument();
    await view.user.click(
      screen.getByRole("button", { name: "Accept invitation" })
    );

    await waitFor(() => {
      expect(fetchImpl.mock.calls.some(([url, options]) =>
        new URL(url).pathname.endsWith(`/${invitationId}/accept`) &&
        options.method === "POST" &&
        options.body === "{}" &&
        options.headers.get("X-CSRF-Token") === "D".repeat(43)
      )).toBe(true);
    });
    expect(
      await screen.findByText("You joined Release QA Alpha League.")
    ).toBeInTheDocument();
  });
});
