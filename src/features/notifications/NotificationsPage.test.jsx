import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useLocation } from "react-router-dom";

vi.mock("socket.io-client", () => ({
  io: () => ({ onAny() {}, offAny() {}, disconnect() {} }),
}));

import { renderWithProviders } from "../../test/render.jsx";
import { createQueryClient } from "../../shared/query/queryClient.js";
import { NotificationsPage } from "./NotificationsPage.jsx";

const notificationId = "11111111-1111-4111-8111-111111111111";
const invitationId = "22222222-2222-4222-8222-222222222222";
const leagueId = "33333333-3333-4333-8333-333333333333";
const teamId = "44444444-4444-4444-8444-444444444444";
const tradeId = "55555555-5555-4555-8555-555555555555";
const seasonId = "66666666-6666-4666-8666-666666666666";
const fadId = "77777777-7777-4777-8777-777777777777";
const cardId = "88888888-8888-4888-8888-888888888888";
const allocationId = "99999999-9999-4999-8999-999999999999";
const auctionId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const playerId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const recoveryId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const operationId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const helpRequestId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const exemptionId = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const config = { appEnv: "local", apiOrigin: "http://localhost:4000", socketOrigin: "http://localhost:4000", buildId: null };

function envelope(data) {
  return new Response(JSON.stringify({ data, meta: { requestId: "request-1" } }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function fadDestination(kind) {
  if (kind === "private_card") {
    return { kind, leagueId, fadId, teamId, cardId };
  }
  if (kind === "commissioner_fad") {
    return { kind, leagueId, seasonId };
  }
  if (kind === "fad_results" || kind === "fad_overview") {
    return { kind, leagueId, fadId };
  }
  if (kind === "auction") return { kind, leagueId, auctionId };
  return { kind, leagueId, fadId, recoveryId };
}

function fadMessageData() {
  const common = { leagueId, seasonId };
  return {
    fad_cards_opened: {
      ...common,
      fadId,
      teamId,
      cardId,
      candidateDeadlineAtMs: 1_800_000_000_000,
      destination: fadDestination("private_card"),
    },
    fad_readiness_blocked: {
      ...common,
      readinessOperationId: operationId,
      errorCodes: ["ENTRY_DRAFT_INCOMPLETE"],
      destination: fadDestination("commissioner_fad"),
    },
    fad_deadline_approaching: {
      ...common,
      fadId,
      teamId,
      cardId,
      candidateDeadlineAtMs: 1_800_000_000_000,
      completenessCode: "incomplete",
      missingMandatoryCount: 2,
      destination: fadDestination("private_card"),
    },
    fad_help_requested: {
      ...common,
      fadId,
      teamId,
      cardId,
      helpRequestId,
      requestingUserId: operationId,
      requestingDisplayName: "Current Manager",
      destination: fadDestination("private_card"),
    },
    fad_cards_locked: {
      ...common,
      fadId,
      destination: fadDestination("fad_results"),
    },
    fad_automatic_result: {
      ...common,
      fadId,
      teamId,
      automaticWins: 4,
      losses: 5,
      restrictedPending: 1,
      invalidOffers: 0,
      destination: fadDestination("fad_results"),
    },
    fad_restricted_eligible: {
      ...common,
      fadId,
      teamId,
      allocationId,
      auctionId,
      playerId,
      destination: fadDestination("auction"),
    },
    fad_restricted_fallback_opened: {
      ...common,
      fadId,
      teamId,
      allocationId,
      auctionId,
      playerId,
      resolvesAtMs: 1_800_000_100_000,
      destination: fadDestination("auction"),
    },
    fad_rapid_auction_result: {
      ...common,
      fadId,
      teamId,
      allocationId: null,
      auctionId,
      playerId,
      outcomeCode: "no_winner",
      destination: fadDestination("auction"),
    },
    fad_correction_required: {
      ...common,
      fadId,
      allocationId,
      auctionId: null,
      recoveryId,
      playerId,
      errorCode: "OWNERSHIP_CHANGED",
      destination: fadDestination("fad_recovery"),
    },
    fad_week1_recovered: {
      ...common,
      fadId,
      scheduleRecoveryOperationId: operationId,
      competitionFirstMatchupStartsAtMs: 1_800_000_200_000,
      destination: fadDestination("fad_overview"),
    },
    fad_completed: {
      ...common,
      fadId,
      completedAtMs: 1_800_000_300_000,
      destination: fadDestination("fad_overview"),
    },
    fad_setup_exemption_authorized: {
      ...common,
      exemptionId,
      destination: fadDestination("commissioner_fad"),
    },
  };
}

function fadNotifications() {
  return Object.entries(fadMessageData()).map(([type, messageData], index) => ({
    id: `${String(index + 1).padStart(8, "0")}-1111-4111-8111-111111111111`,
    leagueId,
    type,
    messageData,
    related: null,
    deliveryStatus: "delivered",
    createdAtMs: index + 1,
    readAtMs: null,
    deliveredAtMs: index + 1,
    version: 1,
  }));
}

function sessionData() {
  return {
    csrfToken: "D".repeat(43),
    session: { id: "session-1", userId: "user-1", status: "active", createdAtMs: 1, lastUsedAtMs: 1, idleExpiresAtMs: 2, absoluteExpiresAtMs: 3, version: 1 },
    user: { id: "user-1", displayName: "Manager", status: "active", version: 1 },
  };
}

function visibleLeagueData() {
  return {
    code: "LEAGUES_FOUND",
    leagues: [{
      id: leagueId,
      name: "Notification League",
      status: "active",
      version: 1,
      membership: {
        id: invitationId,
        status: "active",
        permissionCategory: "manager",
        version: 1,
      },
      currentSeason: null,
    }],
  };
}

function LocationProbe() {
  return <output data-testid="location">{useLocation().pathname + useLocation().search}</output>;
}

describe("M5-11 owner notifications", () => {
  it("renders the unread batch, acknowledges exactly those rows, and keeps them visible", async () => {
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
          notifications: [
            { id: notificationId, leagueId: null, type: "account_notice", messageData: { message: "A private account notice." }, related: null, deliveryStatus: "delivered", createdAtMs: 1, readAtMs: read ? 2 : null, deliveredAtMs: 1, version: read ? 2 : 1 },
            { id: invitationId, leagueId: null, type: "internal_unknown_event", messageData: {}, related: null, deliveryStatus: "delivered", createdAtMs: 2, readAtMs: read ? 2 : null, deliveredAtMs: 2, version: read ? 2 : 1 },
          ],
          page: { limit: 25, nextCursor: null },
        });
      }
      if (path === "/api/v1/notifications/read-batch") {
        expect(JSON.parse(options.body)).toEqual({
          notificationIds: [notificationId, invitationId],
        });
        read = true;
        return envelope({
          code: "NOTIFICATIONS_READ",
          changedCount: 2,
          notificationIds: [notificationId, invitationId],
          readAtMs: 2,
        });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    const view = renderWithProviders(<NotificationsPage />, {
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    });
    expect(await screen.findByText("A private account notice.")).toBeInTheDocument();
    expect(screen.getByText("Other notification")).toBeInTheDocument();
    expect(screen.queryByText("internal unknown event")).not.toBeInTheDocument();
    const initialNotificationCalls = fetchImpl.mock.calls.filter(([url]) => new URL(url).pathname === "/api/v1/notifications");
    expect(initialNotificationCalls).toHaveLength(1);
    expect(initialNotificationCalls[0][1]?.method).toBe("GET");
    expect(new URL(initialNotificationCalls[0][0]).searchParams.get("readStatus"))
      .toBe("unread");
    await waitFor(() => expect(fetchImpl.mock.calls.some(([url, options]) =>
      new URL(url).pathname === "/api/v1/notifications/read-batch" &&
      options.method === "POST" &&
      options.headers.get("X-CSRF-Token") === "D".repeat(43)
    )).toBe(true));
    expect(screen.getByText("A private account notice.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark read/i })).not.toBeInTheDocument();
    await view.user.click(
      screen.getByRole("button", { name: "Previous notifications" })
    );
    await waitFor(() =>
      expect(
        fetchImpl.mock.calls.some(
          ([url]) => new URL(url).searchParams.get("readStatus") === "read"
        )
      ).toBe(true)
    );
    expect(await screen.findAllByText("Read")).toHaveLength(2);
  });

  it("links a received-trade notification to its acceptance preview", async () => {
    const fetchImpl = vi.fn(async (url, options = {}) => {
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
      if (path === "/api/v1/notifications/read-batch" && options.method === "POST") {
        return envelope({ code: "NOTIFICATIONS_READ", changedCount: 1 });
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

  it("renders every approved FAD copy and exact destination route", async () => {
    const fetchImpl = vi.fn(async (url, options = {}) => {
      const path = new URL(url).pathname;
      if (path === "/api/v1/session") return envelope(sessionData());
      if (path === "/api/v1/notifications") {
        return envelope({
          code: "NOTIFICATIONS_FOUND",
          notifications: fadNotifications(),
          page: { limit: 25, nextCursor: null },
        });
      }
      if (path === "/api/v1/notifications/read-batch" && options.method === "POST") {
        return envelope({
          code: "NOTIFICATIONS_READ",
          changedCount: fadNotifications().length,
        });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    renderWithProviders(<NotificationsPage />, {
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    });

    for (const copy of [
      "Your Candidate Card is ready.",
      "Free Agent Draft readiness requires commissioner attention.",
      "Your Candidate Card deadline is approaching.",
      "A manager has requested Candidate Card help.",
      "Candidate Cards are locked and results are available.",
      "Your Candidate Card results are available.",
      "You are eligible to bid in a restricted Free Agent Draft auction.",
      "A league-wide Free Agent Draft fallback auction is open.",
      "A Free Agent Draft auction has finished.",
      "Free Agent Draft recovery requires commissioner attention.",
      "Week 1 moved to complete the Free Agent Draft fairly.",
      "The Free Agent Draft is complete.",
      "Initial Season 2 Free Agent Draft exemption authorized.",
    ]) {
      expect(await screen.findByText(copy)).toBeInTheDocument();
    }

    expect(
      screen.getByRole("link", { name: /Your Candidate Card is ready/i })
    ).toHaveAttribute(
      "href",
      `/leagues/${leagueId}/free-agent-draft/${fadId}/cards/${teamId}`
    );
    expect(
      screen.getByRole("link", {
        name: /readiness requires commissioner attention/i,
      })
    ).toHaveAttribute("href", `/leagues/${leagueId}/commissioner`);
    expect(
      screen.getByRole("link", { name: /Cards are locked/i })
    ).toHaveAttribute(
      "href",
      `/leagues/${leagueId}/free-agent-draft/${fadId}/results`
    );
    expect(
      screen.getByRole("link", { name: /eligible to bid/i })
    ).toHaveAttribute("href", `/leagues/${leagueId}/auctions/${auctionId}`);
    expect(
      screen.getByRole("link", { name: /recovery requires/i })
    ).toHaveAttribute(
      "href",
      `/leagues/${leagueId}/commissioner?fadId=${fadId}&recoveryId=${recoveryId}`
    );
  });

  it("clears target-league private caches and rechecks membership before navigation", async () => {
    let resolveLeagues;
    let notificationRead = false;
    const fetchImpl = vi.fn(async (url, options = {}) => {
      const path = new URL(url).pathname;
      if (path === "/api/v1/session") return envelope(sessionData());
      if (path === "/api/v1/notifications") {
        return envelope({
          code: "NOTIFICATIONS_FOUND",
          notifications: [
            {
              ...fadNotifications()[0],
              readAtMs: notificationRead ? 2 : null,
              version: notificationRead ? 2 : 1,
            },
          ],
          page: { limit: 25, nextCursor: null },
        });
      }
      if (path === "/api/v1/leagues") {
        return new Promise((resolve) => {
          resolveLeagues = () => resolve(envelope(visibleLeagueData()));
        });
      }
      if (path === "/api/v1/notifications/read-batch" && options.method === "POST") {
        notificationRead = true;
        return envelope({ code: "NOTIFICATIONS_READ", changedCount: 1 });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    const queryClient = createQueryClient();
    const privateKey = [
      "league",
      leagueId,
      "free-agent-draft",
      fadId,
      "private-card",
      teamId,
    ];
    const otherLeagueKey = [
      "league",
      invitationId,
      "free-agent-draft",
      fadId,
      "private-card",
      teamId,
    ];
    queryClient.setQueryDefaults(privateKey, {
      meta: { private: true, leagueId },
    });
    queryClient.setQueryDefaults(otherLeagueKey, {
      meta: { private: true, leagueId: invitationId },
    });
    queryClient.setQueryData(privateKey, { privateCard: true });
    queryClient.setQueryData(otherLeagueKey, { otherPrivateCard: true });
    const view = renderWithProviders(
      <>
        <NotificationsPage />
        <LocationProbe />
      </>,
      {
        enableSession: true,
        config,
        queryClient,
        sessionOptions: { fetchImpl },
      }
    );

    await view.user.click(
      await screen.findByRole("link", { name: /Your Candidate Card is ready/i })
    );
    await waitFor(() =>
      expect(queryClient.getQueryData(privateKey)).toBeUndefined()
    );
    expect(queryClient.getQueryData(otherLeagueKey)).toEqual({
      otherPrivateCard: true,
    });
    expect(screen.getByTestId("location")).toHaveTextContent("/");

    resolveLeagues();
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        `/leagues/${leagueId}/free-agent-draft/${fadId}/cards/${teamId}`
      )
    );
    expect(
      fetchImpl.mock.calls.filter(
        ([url]) => new URL(url).pathname === "/api/v1/leagues"
      )
    ).toHaveLength(1);
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
      if (path === "/api/v1/notifications/read-batch" && options.method === "POST") {
        notificationRead = true;
        return envelope({ code: "NOTIFICATIONS_READ", changedCount: 1 });
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
