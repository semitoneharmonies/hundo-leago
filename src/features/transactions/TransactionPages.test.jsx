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

function teamWorkspace(teamId) {
  return {
    code: "TEAM_WORKSPACE_FOUND",
    canManage: teamId === teamA,
    orderVersion: 0,
    league: { id: leagueId, name: "Test League" },
    season: { id: seasonId, label: "2026-27" },
    team: {
      id: teamId,
      name: teamId === teamA ? "Managed Team" : "Other Team",
      primaryColour: null,
      secondaryColour: null,
      logoReference: null,
      version: 1,
    },
    players: [],
    cap: {
      limitCents: 10_000,
      usageCents: 0,
      spaceCents: 10_000,
      activePlayerCents: 0,
      retainedSalaryCents: 0,
      buyoutPenaltyCents: 0,
      retentionSlotsUsed: 0,
      retentionSlotLimit: 3,
      complete: true,
      issues: [],
    },
    draftPicks: [],
    tradeAssets: {
      contracts: [{ id: assetId, label: "Trade Player · $5.00 AAV · 2y" }],
      prospects: [],
      draftPicks: [],
      retentions: [],
      buyouts: teamId === teamA ? [{
        id: correctionId,
        label: "Bought Out Player · $1.25 penalty · 3y",
        playerName: "Bought Out Player",
        annualPenaltyCents: 125,
        remainingYears: 3,
      }] : [],
      futureConsiderations: [],
    },
  };
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
    const workspaceMatch = path.match(
      new RegExp(`^/api/v1/leagues/${leagueId}/teams/([^/]+)/roster$`)
    );
    if (workspaceMatch) return envelope(teamWorkspace(workspaceMatch[1]));
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
    expect(screen.getAllByRole("option", { name: "Retention" })).toHaveLength(2);
    expect(screen.getByText("No proposals in this view.")).toBeInTheDocument();
  });

  it("highlights a pending proposal awaiting the receiving manager", async () => {
    const fetchImpl = baseFetch((path) => {
      if (path === `/api/v1/leagues/${leagueId}/trades`) {
        return envelope({
          code: "TRADE_PROPOSALS_FOUND",
          proposals: [{
            id: tradeId,
            leagueId,
            seasonId,
            proposingTeam: { id: teamB, name: "Other Team" },
            receivingTeam: { id: teamA, name: "Managed Team" },
            proposingUserId: "user-2",
            status: "Pending",
            storageStatus: "proposed",
            createdAtMs: 1,
            expiresAtMs: 2,
            tradeDeadlineAtMs: null,
            effectiveDeadlineAtMs: 2,
            respondedAtMs: null,
            completedAtMs: null,
            commissionerCompletionReference: null,
            version: 1,
          }],
        });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    renderPage(
      `/leagues/${leagueId}/trades`,
      "/leagues/:leagueId/trades",
      <TradesPage />,
      fetchImpl
    );

    const responseLabel = await screen.findByText("Awaiting your response");
    expect(responseLabel.closest("li")).toHaveClass("is-awaiting-you");
  });

  it("preloads another roster's stable asset on the requested side", async () => {
    const fetchImpl = baseFetch((path) => {
      if (path === `/api/v1/leagues/${leagueId}/trades`) {
        return envelope({ code: "TRADE_PROPOSALS_FOUND", proposals: [] });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    renderPage(
      `/leagues/${leagueId}/trades?assetDirection=requested&assetType=contract&assetId=${assetId}&sourceTeamId=${teamB}&proposingTeamId=${teamA}`,
      "/leagues/:leagueId/trades",
      <TradesPage />,
      fetchImpl
    );

    await screen.findAllByRole("option", { name: /Trade Player/ });
    expect(screen.getByRole("combobox", { name: "Proposing team" })).toHaveValue(
      teamA
    );
    expect(screen.getByRole("combobox", { name: "Receiving team" })).toHaveValue(
      teamB
    );
    expect(
      screen.getByRole("combobox", {
        name: "Proposing team sends asset 1",
      })
    ).toHaveValue("");
    expect(
      screen.getByRole("combobox", {
        name: "Receiving team sends asset 1",
      })
    ).toHaveValue(assetId);
  });

  it("adds optional retention to a contract and uses notes for Future Considerations", async () => {
    let submitted = null;
    const fetchImpl = baseFetch((path, options) => {
      if (path === `/api/v1/leagues/${leagueId}/trades`) {
        if (options.method === "POST") {
          submitted = JSON.parse(options.body);
          return envelope({ code: "TRADE_PROPOSAL_CREATED" });
        }
        return envelope({ code: "TRADE_PROPOSALS_FOUND", proposals: [] });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    const view = renderPage(
      `/leagues/${leagueId}/trades`,
      "/leagues/:leagueId/trades",
      <TradesPage />,
      fetchImpl
    );

    await screen.findByRole("heading", { name: "New trade proposal" });
    await screen.findAllByRole("option", { name: /Trade Player/ });
    await view.user.selectOptions(
      screen.getByRole("combobox", {
        name: "Proposing team sends asset 1",
      }),
      assetId
    );
    await view.user.type(
      screen.getByRole("spinbutton", {
        name: "Proposing team sends asset 1 retained AAV dollars",
      }),
      "1.25"
    );
    await view.user.selectOptions(
      screen.getByRole("combobox", {
        name: "Receiving team sends asset 1 type",
      }),
      "future_considerations"
    );
    expect(
      screen.queryByRole("combobox", {
        name: "Receiving team sends asset 1 Future Considerations kind",
      })
    ).not.toBeInTheDocument();
    await view.user.type(
      screen.getByRole("textbox", {
        name: "Receiving team sends asset 1 notes",
      }),
      "Conditional 2027 consideration"
    );
    await view.user.click(
      screen.getByRole("button", { name: "Send proposal" })
    );

    await waitFor(() => {
      expect(submitted).toEqual({
        proposingTeamId: teamA,
        receivingTeamId: teamB,
        proposingAssets: [
          { type: "contract", contractId: assetId },
          {
            type: "requested_retention",
            contractId: assetId,
            retainedAavCents: 125,
          },
        ],
        receivingAssets: [
          {
            type: "future_consideration_instruction",
            description: "Conditional 2027 consideration",
          },
        ],
      });
    });
  });

  it("identifies the exact buyout obligation and transfers its full remaining schedule", async () => {
    let submitted = null;
    const fetchImpl = baseFetch((path, options) => {
      if (path === `/api/v1/leagues/${leagueId}/trades`) {
        if (options.method === "POST") {
          submitted = JSON.parse(options.body);
          return envelope({ code: "TRADE_PROPOSAL_CREATED" });
        }
        return envelope({ code: "TRADE_PROPOSALS_FOUND", proposals: [] });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    const view = renderPage(
      `/leagues/${leagueId}/trades`,
      "/leagues/:leagueId/trades",
      <TradesPage />,
      fetchImpl
    );

    await screen.findByRole("heading", { name: "New trade proposal" });
    await view.user.selectOptions(
      screen.getByRole("combobox", {
        name: "Proposing team sends asset 1 type",
      }),
      "buyout_obligation"
    );
    await view.user.selectOptions(
      screen.getByRole("combobox", {
        name: "Proposing team sends asset 1",
      }),
      correctionId
    );
    expect(
      screen.getByText(
        (_, node) =>
          node?.tagName === "P" &&
          node.textContent.includes(
            "Bought Out Player buyout · $1.25 AAV · 3 seasons remaining"
          )
      )
    ).toBeInTheDocument();
    await view.user.selectOptions(
      screen.getByRole("combobox", {
        name: "Receiving team sends asset 1 type",
      }),
      "future_considerations"
    );
    await view.user.type(
      screen.getByRole("textbox", {
        name: "Receiving team sends asset 1 notes",
      }),
      "Completes the obligation-only trade"
    );
    await view.user.click(
      screen.getByRole("button", { name: "Send proposal" })
    );

    await waitFor(() => {
      expect(submitted?.proposingAssets).toEqual([
        {
          type: "buyout_obligation",
          buyoutObligationId: correctionId,
        },
      ]);
    });
  });

  it("opens a notification deep link directly into the acceptance preview", async () => {
    const fetchImpl = baseFetch((path) => {
      if (path === `/api/v1/leagues/${leagueId}/trades/${tradeId}`) return envelope({ code: "TRADE_PROPOSAL_FOUND", proposal: { id: tradeId, leagueId, seasonId, proposingTeam: { id: teamB, name: "Other Team" }, receivingTeam: { id: teamA, name: "Managed Team" }, proposingUserId: "user-2", status: "Pending", storageStatus: "proposed", createdAtMs: 1, expiresAtMs: 99, tradeDeadlineAtMs: null, effectiveDeadlineAtMs: 99, respondedAtMs: null, completedAtMs: null, commissionerCompletionReference: null, version: 1, assets: [{ id: assetId, type: "contract", snapshot: { type: "contract", player: { name: "Trade Player" } } }], history: [{ id: assetId, actorUserId: "user-2", type: "proposal_created", reason: null, metadata: {}, occurredAtMs: 1 }] } });
      if (path.endsWith("/acceptance-preview")) return envelope({
        code: "TRADE_ACCEPTANCE_PREVIEWED",
        proposal: { id: tradeId },
        assets: [],
        teams: [{
          teamId: teamA,
          rosterCounts: {},
          cap: {
            salaryCapCents: 10_000,
            usageCents: 10_100,
            spaceCents: -100,
          },
          retentionSlots: 0,
          issues: [{
            code: "SALARY_CAP_EXCEEDED",
            usageCents: 10_100,
            limitCents: 10_000,
          }],
          generallyIllegal: true,
        }],
        generallyIllegal: true,
      });
      throw new Error(`Unexpected request: ${path}`);
    });
    renderPage(`/leagues/${leagueId}/trades/${tradeId}?preview=acceptance`, "/leagues/:leagueId/trades/:tradeId", <TradeDetailPage />, fetchImpl);
    expect(await screen.findByText(
      "This trade would leave at least one roster generally illegal."
    )).toBeInTheDocument();
    expect(screen.getByText("SALARY CAP EXCEEDED")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Confirm and accept trade" })).toBeInTheDocument();
  });

  it("groups requested retention with its player contract while keeping draft picks separate", async () => {
    const retentionAssetId = correctionId;
    const draftPickId = ownershipId;
    const fetchImpl = baseFetch((path) => {
      if (path === `/api/v1/leagues/${leagueId}/trades/${tradeId}`) {
        return envelope({
          code: "TRADE_PROPOSAL_FOUND",
          proposal: {
            id: tradeId,
            leagueId,
            seasonId,
            proposingTeam: { id: teamA, name: "Managed Team" },
            receivingTeam: { id: teamB, name: "Other Team" },
            proposingUserId: "user-1",
            status: "Pending",
            storageStatus: "proposed",
            createdAtMs: 1,
            expiresAtMs: 99,
            tradeDeadlineAtMs: null,
            effectiveDeadlineAtMs: 99,
            respondedAtMs: null,
            completedAtMs: null,
            commissionerCompletionReference: null,
            version: 1,
            assets: [
              {
                id: assetId,
                type: "contract",
                sourceTeamId: teamA,
                snapshot: {
                  type: "contract",
                  player: { name: "Adam Pelech" },
                  contract: {
                    id: assetId,
                    aavCents: 200,
                    originalTermYears: 1,
                  },
                  ownership: { rosterCategory: "Active" },
                },
              },
              {
                id: retentionAssetId,
                type: "requested_retention",
                sourceTeamId: teamA,
                snapshot: {
                  type: "requested_retention",
                  contractId: assetId,
                  retainedAavCents: 100,
                },
              },
              {
                id: draftPickId,
                type: "draft_pick",
                sourceTeamId: teamA,
                snapshot: {
                  type: "draft_pick",
                  targetSeasonLabel: "2027-28",
                  roundNumber: 1,
                  positionNumber: 4,
                },
              },
            ],
            history: [
              {
                id: retentionAssetId,
                actorUserId: "user-1",
                type: "proposal_created",
                reason: null,
                metadata: {},
                occurredAtMs: 1,
              },
            ],
          },
        });
      }
      throw new Error(`Unexpected request: ${path}`);
    });

    renderPage(
      `/leagues/${leagueId}/trades/${tradeId}`,
      "/leagues/:leagueId/trades/:tradeId",
      <TradeDetailPage />,
      fetchImpl
    );

    const contract = await screen.findByText("Adam Pelech");
    const contractCard = contract.closest(".hl-trade-asset-card");
    expect(contractCard).not.toBeNull();
    expect(within(contractCard).getByText("Contract + retention")).toBeInTheDocument();
    expect(
      within(contractCard).getByText(
        "$2.00 AAV · 1-year original term · Active · with $1.00 retained salary"
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Requested salary retention")
    ).not.toBeInTheDocument();
    expect(screen.getByText("2027-28 Round 1")).toBeInTheDocument();
    expect(screen.getByText("Pick 4")).toBeInTheDocument();
    expect(document.querySelectorAll(".hl-trade-asset-card")).toHaveLength(2);
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

    expect(audit.getByText("Managed Team")).toBeInTheDocument();
    expect(audit.getByText("Technical record")).toBeInTheDocument();
    expect(audit.getByText("Commissioner roster corrected")).toBeInTheDocument();
    expect(audit.getByText("Commissioner")).toBeInTheDocument();
    expect(audit.getByText(assetId)).toBeInTheDocument();
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
      actorUserId,
      leagueId,
      seasonId,
      teamA,
      playerSearchId,
      correctionId,
      ownershipId,
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
