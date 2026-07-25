import { screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("socket.io-client", () => ({
  io: () => ({ onAny() {}, offAny() {}, disconnect() {} }),
}));

import { renderWithProviders } from "../../test/render.jsx";
import { ActivityPage, AuctionsPage, TradeDetailPage, TradesPage } from "./TransactionPages.jsx";

const leagueId = "11111111-1111-4111-8111-111111111111";
const seasonId = "22222222-2222-4222-8222-222222222222";
const teamA = "33333333-3333-4333-8333-333333333333";
const teamB = "44444444-4444-4444-8444-444444444444";
const tradeId = "55555555-5555-4555-8555-555555555555";
const auctionId = "66666666-6666-4666-8666-666666666666";
const assetId = "77777777-7777-4777-8777-777777777777";
const playerSearchId = "88888888-8888-4888-8888-888888888888";
const actorUserId = "99999999-9999-4999-8999-999999999999";
const correctionId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const actorMembershipId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ownershipId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const config = { appEnv: "local", apiOrigin: "http://localhost:4000", socketOrigin: "http://localhost:4000", buildId: null };

function envelope(data) {
  return new Response(JSON.stringify({ data, meta: { requestId: "request-1" } }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function pageEnvelope(data) {
  return new Response(JSON.stringify({
    data,
    page: { nextCursor: null, hasMore: false },
    meta: { requestId: "request-1" },
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function session() {
  return { csrfToken: "D".repeat(43), session: { id: assetId, userId: "user-1", status: "active", createdAtMs: 1, lastUsedAtMs: 1, idleExpiresAtMs: 2, absoluteExpiresAtMs: 3, version: 1 }, user: { id: "user-1", displayName: "Manager", status: "active", version: 1 } };
}

function baseFetch(extra) {
  return vi.fn(async (url, options = {}) => {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname;
    if (path === "/api/v1/session") return envelope(session());
    if (path === "/api/v1/leagues") return envelope({ code: "LEAGUES_FOUND", leagues: [{ id: leagueId, name: "Test League", status: "active", timezone: "America/Vancouver", currentSeason: null, membership: { id: assetId, permissionCategory: "manager", status: "active", version: 1 }, version: 1 }] });
    if (path === `/api/v1/leagues/${leagueId}/teams`) return envelope({ code: "TEAMS_FOUND", teams: [
      { id: teamA, leagueId, name: "Managed Team", status: "active", primaryColour: null, secondaryColour: null, logoReference: null, createdAtMs: 1, updatedAtMs: 1, version: 1, currentManager: { assignmentId: assetId, userId: "user-1", displayName: "Manager", acceptedAtMs: 1, version: 1 } },
      { id: teamB, leagueId, name: "Other Team", status: "active", primaryColour: null, secondaryColour: null, logoReference: null, createdAtMs: 1, updatedAtMs: 1, version: 1, currentManager: null },
    ] });
    return extra(path, options, parsedUrl);
  });
}

function renderPage(path, route, element, fetchImpl) {
  return renderWithProviders(<Routes><Route path={route} element={element} /></Routes>, {
    initialEntries: [path], enableSession: true, config, sessionOptions: { fetchImpl },
  });
}

describe("M5-11 authenticated transaction pages", () => {
  it("redirects a signed-out protected route without waiting on a disabled league query", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      error: { code: "SESSION_MISSING", message: "Sign in required." },
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }));
    renderWithProviders(
      <Routes>
        <Route path="/" element={<p>Sign in required</p>} />
        <Route path="/leagues/:leagueId/activity" element={<ActivityPage />} />
      </Routes>,
      {
        initialEntries: [`/leagues/${leagueId}/activity`],
        enableSession: true,
        config,
        sessionOptions: { fetchImpl },
      }
    );
    expect(await screen.findByText("Sign in required")).toBeInTheDocument();
    expect(screen.queryByText("Checking secure league access…")).not.toBeInTheDocument();
  });

  it("renders only the caller's sealed bid value while naming participants", async () => {
    let bidBody = null;
    const fetchImpl = baseFetch((path, options) => {
      if (path === `/api/v1/leagues/${leagueId}/auctions/${auctionId}/bids/mine`) {
        bidBody = JSON.parse(options.body);
        return envelope({ code: "AUCTION_BID_SAVED" });
      }
      if (path === `/api/v1/leagues/${leagueId}/auctions`) return envelope({ code: "ACTIVE_AUCTIONS_FOUND", auctions: [{ id: auctionId, leagueId, seasonId, player: { id: assetId, fullName: "Auction Player", positionGroup: "F" }, status: "Active", openedAtMs: 1, bidClosesAtMs: 99, participantCount: 2, participants: [{ teamId: teamA, teamName: "Managed Team" }, { teamId: teamB, teamName: "Other Team" }], ownBid: { id: assetId, teamId: teamA, totalValueCents: 500, termYears: 2, aavCents: 250, firstSubmittedAtMs: 1, lastEditedAtMs: 1, editCount: 0, version: 1 } }] });
      throw new Error(`Unexpected request: ${path}`);
    });
    const view = renderPage(`/leagues/${leagueId}/auctions`, "/leagues/:leagueId/auctions", <AuctionsPage />, fetchImpl);
    expect(await screen.findByRole("heading", { name: "Auction Player (F)" })).toBeInTheDocument();
    expect(screen.getByText(/Your sealed bid: \$5\.00/)).toBeInTheDocument();
    expect(screen.getByText(/Participants: Managed Team, Other Team/)).toBeInTheDocument();
    const dollarInputs = screen.getAllByLabelText("Total value (dollars)");
    expect(dollarInputs[1]).toHaveValue(5);
    expect(screen.queryByText(/value \(cents\)/i)).not.toBeInTheDocument();
    await view.user.clear(dollarInputs[1]);
    await view.user.type(dollarInputs[1], "6");
    await view.user.click(screen.getByRole("button", { name: "Update my bid" }));
    await waitFor(() => {
      expect(bidBody).toMatchObject({
        teamId: teamA,
        totalValueCents: 600,
        termYears: 2,
      });
    });
  });

  it("searches eligible player names and converts opening dollars to integer cents", async () => {
    let playerRequest = null;
    let auctionBody = null;
    const fetchImpl = baseFetch((path, options, url) => {
      if (path === "/api/v1/players") {
        playerRequest = url;
        return pageEnvelope([{
          id: playerSearchId,
          firstName: "Fixture",
          lastName: "Player",
          fullName: "Fixture Player",
          birthDate: "1999-01-02",
          status: "active",
          provider: {
            provider: "nhl",
            sourcePosition: "C",
            normalizedPosition: "F",
            nhlTeamAbbreviation: "VAN",
            active: true,
            sourceVersion: "2026-07-22",
            effectiveAtMs: 1,
          },
          statistics: null,
          version: 1,
        }]);
      }
      if (path === `/api/v1/leagues/${leagueId}/auctions`) {
        if (options.method === "POST") {
          auctionBody = JSON.parse(options.body);
          return envelope({ code: "AUCTION_STARTED" });
        }
        return envelope({ code: "ACTIVE_AUCTIONS_FOUND", auctions: [] });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    const view = renderPage(`/leagues/${leagueId}/auctions`, "/leagues/:leagueId/auctions", <AuctionsPage />, fetchImpl);
    const playerInput = await screen.findByRole("combobox", { name: "Player" });
    expect(screen.queryByText("Player ID")).not.toBeInTheDocument();
    await view.user.type(playerInput, "fixture");
    await view.user.click(await screen.findByRole("option", { name: /Fixture Player/ }));
    const dollars = screen.getByLabelText("Total value (dollars)");
    await view.user.clear(dollars);
    await view.user.type(dollars, "4.25");
    await view.user.click(screen.getByRole("button", { name: "Start auction" }));
    await waitFor(() => {
      expect(playerRequest.searchParams.get("query")).toBe("Fixture Player");
      expect(playerRequest.searchParams.get("leagueId")).toBe(leagueId);
      expect(playerRequest.searchParams.get("auctionEligible")).toBe("true");
      expect(auctionBody).toEqual({
        teamId: teamA,
        playerId: playerSearchId,
        totalValueCents: 425,
        termYears: 1,
      });
    });
  });

  it("renders the typed proposal builder and excludes expired proposals", async () => {
    const fetchImpl = baseFetch((path) => {
      if (path === `/api/v1/leagues/${leagueId}/trades`) return envelope({ code: "TRADE_PROPOSALS_FOUND", proposals: [{ id: tradeId, leagueId, seasonId, proposingTeam: { id: teamA, name: "Managed Team" }, receivingTeam: { id: teamB, name: "Other Team" }, proposingUserId: "user-1", status: "Expired", storageStatus: "expired", createdAtMs: 1, expiresAtMs: 2, tradeDeadlineAtMs: null, effectiveDeadlineAtMs: 2, respondedAtMs: 2, completedAtMs: null, commissionerCompletionReference: null, version: 2 }] });
      throw new Error(`Unexpected request: ${path}`);
    });
    renderPage(`/leagues/${leagueId}/trades`, "/leagues/:leagueId/trades", <TradesPage />, fetchImpl);
    expect(await screen.findByRole("heading", { name: "New trade proposal" })).toBeInTheDocument();
    expect(screen.getAllByRole("option", { name: "Requested retention" })).toHaveLength(2);
    expect(screen.getByText("No proposals in this view.")).toBeInTheDocument();
  });

  it("requires an acceptance preview before showing the confirm command", async () => {
    const fetchImpl = baseFetch((path) => {
      if (path === `/api/v1/leagues/${leagueId}/trades/${tradeId}`) return envelope({ code: "TRADE_PROPOSAL_FOUND", proposal: { id: tradeId, leagueId, seasonId, proposingTeam: { id: teamB, name: "Other Team" }, receivingTeam: { id: teamA, name: "Managed Team" }, proposingUserId: "user-2", status: "Pending", storageStatus: "proposed", createdAtMs: 1, expiresAtMs: 99, tradeDeadlineAtMs: null, effectiveDeadlineAtMs: 99, respondedAtMs: null, completedAtMs: null, commissionerCompletionReference: null, version: 1, assets: [{ id: assetId, type: "contract", snapshot: { type: "contract", player: { name: "Trade Player" } } }], history: [{ id: assetId, actorUserId: "user-2", type: "proposal_created", reason: null, metadata: {}, occurredAtMs: 1 }] } });
      if (path.endsWith("/acceptance-preview")) return envelope({ code: "TRADE_ACCEPTANCE_PREVIEWED", proposal: { id: tradeId }, assets: [], teams: {}, generallyIllegal: false });
      throw new Error(`Unexpected request: ${path}`);
    });
    const view = renderPage(`/leagues/${leagueId}/trades/${tradeId}`, "/leagues/:leagueId/trades/:tradeId", <TradeDetailPage />, fetchImpl);
    const preview = await screen.findByRole("button", { name: "Preview acceptance" });
    expect(screen.queryByRole("button", { name: "Confirm and accept trade" })).not.toBeInTheDocument();
    await view.user.click(preview);
    expect(await screen.findByRole("button", { name: "Confirm and accept trade" })).toBeInTheDocument();
  });

  it("renders commissioner correction attribution, scope, result, and reason without raw metadata", async () => {
    const occurredAtMs = Date.parse("2026-07-25T18:30:00.000Z");
    const fetchImpl = baseFetch((path) => {
      if (path === `/api/v1/leagues/${leagueId}/activity`) return envelope({
        code: "LEAGUE_ACTIVITY_FOUND",
        activity: [{
          id: assetId,
          leagueId,
          seasonId,
          type: "commissioner_roster_corrected",
          actor: {
            userId: actorUserId,
            authority: "commissioner",
          },
          teamId: teamA,
          playerId: playerSearchId,
          related: {
            type: "player_ownership",
            id: ownershipId,
          },
          summary: "Commissioner corrected a roster assignment.",
          reason: "Manual release acceptance correction",
          metadata: {
            correctionId,
            actorMembershipId,
            before: {
              rosterCategory: "Active",
              positionGroup: "F",
              slotNumber: 1,
              privateNote: "hidden before-state note",
            },
            after: {
              rosterCategory: "Bench",
              positionGroup: "F",
              slotNumber: null,
              privateNote: "hidden result-state note",
            },
            warnings: [{
              code: "TEAM_ROSTER_ILLEGAL",
              privateMessage: "hidden warning details",
            }],
            unsafeDiagnostic: "hidden operational detail",
          },
          occurredAtMs,
        }],
        page: { limit: 25, nextCursor: null },
      });
      throw new Error(`Unexpected request: ${path}`);
    });
    renderPage(`/leagues/${leagueId}/activity`, "/leagues/:leagueId/activity", <ActivityPage />, fetchImpl);
    const entry = (
      await screen.findByText("Commissioner corrected a roster assignment.")
    ).closest("li");
    const audit = within(entry);

    expect(audit.getByText("Commissioner roster corrected")).toBeInTheDocument();
    expect(audit.getByText("Commissioner")).toBeInTheDocument();
    for (const visibleId of [
      actorUserId,
      leagueId,
      seasonId,
      teamA,
      playerSearchId,
      correctionId,
    ]) {
      expect(audit.getByText(visibleId)).toBeInTheDocument();
    }
    expect(
      audit.getByText(`Player ownership · ${ownershipId}`)
    ).toBeInTheDocument();
    expect(audit.getByText(/Roster category: Active/)).toBeInTheDocument();
    expect(audit.getByText(/Roster category: Bench/)).toBeInTheDocument();
    expect(audit.getByText("TEAM ROSTER ILLEGAL")).toBeInTheDocument();
    expect(
      audit.getByText("Manual release acceptance correction")
    ).toBeInTheDocument();
    expect(entry.querySelector("time")).toHaveAttribute(
      "dateTime",
      new Date(occurredAtMs).toISOString()
    );
    for (const hiddenValue of [
      actorMembershipId,
      "hidden before-state note",
      "hidden result-state note",
      "hidden warning details",
      "hidden operational detail",
      "unsafeDiagnostic",
    ]) {
      expect(entry).not.toHaveTextContent(hiddenValue);
    }
  });
});
