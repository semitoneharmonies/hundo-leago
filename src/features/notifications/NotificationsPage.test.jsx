import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("socket.io-client", () => ({
  io: () => ({ onAny() {}, offAny() {}, disconnect() {} }),
}));

import { renderWithProviders } from "../../test/render.jsx";
import { NotificationsPage } from "./NotificationsPage.jsx";

const notificationId = "11111111-1111-4111-8111-111111111111";
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
});
