import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sessionHarness = vi.hoisted(() => ({
  request: vi.fn(),
}));

vi.mock("../session/sessionContext.js", () => ({
  useSession: () => ({
    status: "authenticated",
    user: {
      id: "00000000-0000-4000-8000-000000000099",
      displayName: "Manager",
    },
    httpClient: { request: sessionHarness.request },
  }),
}));

import { renderWithProviders } from "../../test/render.jsx";
import { RealtimeContext } from "../../shared/realtime/realtimeContext.js";
import { AuctionDetailPage, AuctionsPage } from "./AuctionPages.jsx";

const id = (number) =>
  `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`;
const IDS = Object.freeze({
  league: id(1),
  season: id(2),
  auction: id(3),
  auctionTwo: id(4),
  fad: id(5),
  rollover: id(6),
  player: id(7),
  team: id(8),
  teamTwo: id(9),
  teamThree: id(18),
  teamFour: id(19),
  otherLeague: id(20),
  otherAuction: id(21),
  bid: id(10),
  bidTwo: id(11),
  contract: id(12),
  ownership: id(13),
  activity: id(14),
  queue: id(15),
  membership: id(16),
  intent: id(17),
  operation: id(22),
});
const NOW_MS = Date.UTC(2026, 7, 11, 18, 0, 0);
const DAY_MS = 86_400_000;

function allowed() {
  return { allowed: true, reasonCode: null };
}

function denied(reasonCode = "NOT_AUTHORIZED") {
  return { allowed: false, reasonCode };
}

function team(teamId = IDS.team, name = "Snow Owls") {
  return {
    teamId,
    name,
    primaryColour: "#112233",
    secondaryColour: "#ddeeff",
    tertiaryColour: null,
    patternTemplate: "solid",
    logoReference: null,
  };
}

function player() {
  return {
    playerId: IDS.player,
    fullName: "Ada Player",
    positionGroup: "F",
  };
}

function viewerBid(overrides = {}) {
  return {
    bidId: IDS.bid,
    version: 1,
    status: "active",
    totalValueCents: 600,
    termYears: 2,
    aavCents: 300,
    editCount: 0,
    editLimit: 1,
    cooldownEndsAtMs: NOW_MS - 1,
    bindingIllegalityConfirmedAtMs: NOW_MS - DAY_MS,
    ...overrides,
  };
}

function administrativeBid(overrides = {}) {
  return {
    bidId: IDS.bidTwo,
    teamId: IDS.teamFour,
    team: team(IDS.teamFour, "Administrative Competitor"),
    version: 1,
    status: "active",
    participantStatus: "active",
    capabilities: {
      adminEditBid: allowed(),
      adminRemoveBid: allowed(),
    },
    ...overrides,
  };
}

function restrictedAuction(overrides = {}) {
  return {
    auctionId: IDS.auction,
    leagueId: IDS.league,
    seasonId: IDS.season,
    version: 1,
    player: player(),
    status: "active",
    openedAtMs: NOW_MS - DAY_MS,
    resolvesAtMs: NOW_MS + DAY_MS,
    resolvedAtMs: null,
    updatedAtMs: NOW_MS,
    bidCount: 0,
    participatingTeamCount: 0,
    sourceKind: "fad_restricted",
    fadOrigin: "candidate_tie_restricted",
    fadId: IDS.fad,
    fadRolloverId: IDS.rollover,
    targetRolloverAtMs: NOW_MS + DAY_MS,
    creationCutoffAtMs: NOW_MS + DAY_MS - 3_600_000,
    eligibleTeams: [team()],
    minimumContract: {
      totalValueCents: 300,
      termYears: 3,
      aavCents: 100,
    },
    drawCommitment: "a".repeat(64),
    viewerTeams: [
      {
        teamId: IDS.team,
        team: team(),
        eligible: true,
        participantStatus: "active",
        bid: null,
        join: allowed(),
        edit: denied("ENTRY_NOT_EDITABLE"),
      },
      {
        teamId: IDS.teamTwo,
        team: team(IDS.teamTwo, "Ice Foxes"),
        eligible: false,
        participantStatus: null,
        bid: null,
        join: denied("TEAM_NOT_PARTICIPANT"),
        edit: denied("TEAM_NOT_PARTICIPANT"),
      },
    ],
    administrativeBids: [],
    result: null,
    capabilities: {
      view: allowed(),
      adminCancel: denied(),
      adminResolve: denied(),
    },
    ...overrides,
  };
}

function ordinaryAuction(overrides = {}) {
  const ownBid = viewerBid();
  delete ownBid.bindingIllegalityConfirmedAtMs;
  return {
    ...restrictedAuction(),
    sourceKind: "ordinary_weekly",
    fadOrigin: null,
    fadId: null,
    fadRolloverId: null,
    targetRolloverAtMs: null,
    creationCutoffAtMs: null,
    eligibleTeams: [],
    minimumContract: null,
    drawCommitment: null,
    bidCount: 1,
    participatingTeamCount: 1,
    viewerTeams: [
      {
        teamId: IDS.team,
        team: team(),
        eligible: true,
        participantStatus: null,
        bid: ownBid,
        join: denied("ENTRY_NOT_EDITABLE"),
        edit: allowed(),
      },
    ],
    ...overrides,
  };
}

function openRapidNoWinner(auctionId = IDS.auctionTwo) {
  const resolvedAtMs = NOW_MS + DAY_MS;
  return restrictedAuction({
    auctionId,
    sourceKind: "fad_open_rapid",
    fadOrigin: "manager_nomination",
    eligibleTeams: [],
    minimumContract: null,
    status: "no_winner",
    resolvedAtMs,
    updatedAtMs: resolvedAtMs,
    viewerTeams: [],
    result: {
      outcomeCode: "no_winner",
      winningTeam: null,
      submittedTotalValueCents: null,
      submittedTermYears: null,
      submittedAavCents: null,
      finalContractValueCents: null,
      finalAavCents: null,
      contractId: null,
      ownershipId: null,
      activityId: IDS.activity,
      recoveryId: null,
      drawEvidence: {
        commitmentHex: "a".repeat(64),
        reveal: {
          algorithmVersion: 1,
          nonceHex: "b".repeat(64),
          selectionUsed: false,
          orderedBidIds: [],
          counter: null,
          digestHex: null,
          selectedIndex: null,
          selectedBidId: null,
          selectedTeamId: null,
        },
      },
      resolvedAtMs,
    },
  });
}

function cancelledOrdinary(overrides = {}) {
  const resolvedAtMs = NOW_MS;
  return ordinaryAuction({
    version: 2,
    status: "cancelled",
    resolvedAtMs,
    updatedAtMs: resolvedAtMs,
    viewerTeams: [],
    administrativeBids: [],
    capabilities: {
      view: allowed(),
      adminCancel: denied("PHASE_CLOSED"),
      adminResolve: denied("PHASE_CLOSED"),
    },
    result: {
      outcomeCode: "cancelled",
      winningTeam: null,
      submittedTotalValueCents: null,
      submittedTermYears: null,
      submittedAavCents: null,
      finalContractValueCents: null,
      finalAavCents: null,
      contractId: null,
      ownershipId: null,
      activityId: IDS.activity,
      recoveryId: null,
      drawEvidence: null,
      resolvedAtMs,
    },
    ...overrides,
  });
}

function startTeam(teamIdValue, name, startAuctionCapability = allowed()) {
  return {
    teamId: teamIdValue,
    team: team(teamIdValue, name),
    sourceKind: "fad_open_rapid",
    fadId: IDS.fad,
    fadRolloverId: IDS.rollover,
    targetRolloverAtMs: NOW_MS + DAY_MS,
    creationCutoffAtMs: NOW_MS + DAY_MS - 3_600_000,
    startAuction: startAuctionCapability,
  };
}

function ordinaryStartTeam() {
  return {
    teamId: IDS.team,
    team: team(),
    sourceKind: "ordinary_weekly",
    fadId: null,
    fadRolloverId: null,
    targetRolloverAtMs: null,
    creationCutoffAtMs: null,
    startAuction: allowed(),
  };
}

function bidReceipt(version = 1) {
  return {
    code: version === 1 ? "AUCTION_BID_SUBMITTED" : "AUCTION_BID_EDITED",
    replayed: false,
    auction: {
      id: IDS.auction,
      leagueId: IDS.league,
      seasonId: IDS.season,
      status: "open",
      openedAtMs: NOW_MS - DAY_MS,
      bidClosesAtMs: NOW_MS + DAY_MS,
    },
    bid: {
      id: IDS.bid,
      teamId: IDS.team,
      totalValueCents: 600,
      termYears: 2,
      aavCents: 300,
      firstSubmittedAtMs: NOW_MS - DAY_MS,
      lastEditedAtMs: NOW_MS,
      editCount: version - 1,
      status: "active",
      version,
    },
  };
}

function leagueResponse() {
  return {
    data: {
      code: "LEAGUES_FOUND",
      leagues: [
        {
          id: IDS.league,
          name: "Test League",
          status: "active",
          timezone: "America/Vancouver",
          currentSeason: null,
          membership: {
            id: IDS.membership,
            permissionCategory: "manager",
            status: "active",
            version: 1,
          },
          version: 1,
        },
      ],
    },
  };
}

function listResponse(auction, startTeams = []) {
  return {
    data: auction ? [auction] : [],
    actions: { startTeams },
    page: { nextCursor: null, hasMore: false },
  };
}

function playerSearchResponse() {
  return {
    data: [
      {
        id: IDS.player,
        fullName: "Ada Player",
        provider: {
          normalizedPosition: "F",
          nhlTeamAbbreviation: "VAN",
        },
      },
    ],
    page: { nextCursor: null, hasMore: false },
  };
}

function RealtimeControls({ children, onBoundary }) {
  const [value, setValue] = useState({
    status: "connected",
    privacyEpoch: 0,
  });
  return (
    <>
      <button
        onClick={() => {
          onBoundary?.();
          setValue(({ privacyEpoch }) => ({
            status: "reauthorizing",
            privacyEpoch: privacyEpoch + 1,
          }));
        }}
      >
        Begin auction reauthorization
      </button>
      <button
        onClick={() =>
          setValue(({ privacyEpoch }) => ({
            status: "connected",
            privacyEpoch,
          }))
        }
      >
        Finish auction reauthorization
      </button>
      <RealtimeContext.Provider value={value}>
        {children}
      </RealtimeContext.Provider>
    </>
  );
}

function renderPage(path, route, element, { onPrivacyBoundary } = {}) {
  const routes = (
    <Routes>
      <Route path={route} element={element} />
    </Routes>
  );
  return renderWithProviders(
    onPrivacyBoundary ? (
      <RealtimeControls onBoundary={onPrivacyBoundary}>
        {routes}
      </RealtimeControls>
    ) : routes,
    { initialEntries: [path], enableSession: false }
  );
}

beforeEach(() => {
  vi.stubGlobal("crypto", {
    randomUUID: vi.fn(() => IDS.intent),
  });
  sessionHarness.request.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("FAD-16 auction pages", () => {
  it("uses start-team capabilities, keyboard player selection, binding confirmation, and a private queued receipt", async () => {
    const starts = [
      startTeam(IDS.team, "Snow Owls"),
      startTeam(IDS.teamTwo, "Ice Foxes", denied("PHASE_CLOSED")),
    ];
    let startBody = null;
    sessionHarness.request.mockImplementation(async (path, options = {}) => {
      if (path === "/api/v1/leagues") return leagueResponse();
      if (path.startsWith(`/api/v1/leagues/${IDS.league}/auctions?`)) {
        return listResponse(restrictedAuction(), starts);
      }
      if (path.startsWith("/api/v1/players?")) return playerSearchResponse();
      if (path === `/api/v1/leagues/${IDS.league}/auctions` && options.method === "POST") {
        startBody = options.body;
        return {
          data: {
            kind: "nomination_queued",
            auction: null,
            queuedNomination: {
              queueId: IDS.queue,
              fadId: IDS.fad,
              teamId: IDS.team,
              player: player(),
              totalValueCents: 400,
              termYears: 1,
              aavCents: 400,
              bindingIllegalityConfirmedAtMs: NOW_MS,
              acceptedAtMs: NOW_MS,
              openingRolloverId: IDS.rollover,
              resolutionRolloverId: null,
              status: "queued",
              version: 1,
            },
          },
        };
      }
      throw new Error(`Unexpected request: ${path}`);
    });

    const view = renderPage(
      `/leagues/${IDS.league}/auctions?fadId=${IDS.fad}`,
      "/leagues/:leagueId/auctions",
      <AuctionsPage />,
      { onPrivacyBoundary: () => {} }
    );

    expect(await screen.findByRole("heading", { name: "Ada Player" })).toBeInTheDocument();
    expect(screen.getByText("Candidate minimum")).toBeInTheDocument();
    expect(screen.getByText(/not a bid or leader/i)).toBeInTheDocument();
    expect(
      screen.getByText(/convenience catalog filter, not FAD eligibility authority/i)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/America\/Vancouver/).length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByText("Aug 12, 2026, 11:00 a.m. PDT (America/Vancouver)")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ada Player" })).toHaveAttribute(
      "href",
      `/leagues/${IDS.league}/auctions/${IDS.auction}`
    );

    await view.user.selectOptions(screen.getByLabelText("Team"), IDS.teamTwo);
    expect(screen.getByRole("button", { name: "Start or queue auction" })).toBeDisabled();
    expect(screen.getByText(/closed in the current league phase/i)).toBeInTheDocument();
    await view.user.selectOptions(screen.getByLabelText("Team"), IDS.team);

    const playerInput = screen.getByRole("combobox", { name: "Player" });
    await view.user.type(playerInput, "ada");
    await screen.findByRole("option", { name: /Ada Player/ });
    await view.user.keyboard("{ArrowDown}{Enter}");
    const aav = screen.getByLabelText("AAV (dollars per year)");
    await view.user.clear(aav);
    await view.user.type(aav, "4.00");
    expect(screen.getByLabelText("Total contract value")).toHaveValue("4.00");
    expect(screen.getByRole("button", { name: "Start or queue auction" })).toBeDisabled();
    await view.user.click(
      screen.getByRole("checkbox", { name: /I understand this bid is binding/i })
    );
    await view.user.click(screen.getByRole("button", { name: "Start or queue auction" }));

    expect(await screen.findByText(/Private receipt: Ada Player is queued for Snow Owls/i)).toHaveFocus();
    expect(startBody).toEqual({
      teamId: IDS.team,
      playerId: IDS.player,
      aavCents: 400,
      termYears: 1,
      bindingIllegalityConfirmed: true,
    });

    await view.user.click(
      screen.getByRole("button", { name: "Begin auction reauthorization" })
    );
    expect(
      screen.queryByText(/Private receipt: Ada Player is queued for Snow Owls/i)
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Reauthorizing private auction access/i)).toBeInTheDocument();
    await view.user.click(
      screen.getByRole("button", { name: "Finish auction reauthorization" })
    );
    expect(await screen.findByRole("heading", { name: "Ada Player" })).toBeInTheDocument();
    expect(
      screen.queryByText(/Private receipt: Ada Player is queued for Snow Owls/i)
    ).not.toBeInTheDocument();
  });

  it("preserves ordinary weekly start behavior without adding the FAD confirmation field", async () => {
    let startBody = null;
    sessionHarness.request.mockImplementation(async (path, options = {}) => {
      if (path === "/api/v1/leagues") return leagueResponse();
      if (path.startsWith(`/api/v1/leagues/${IDS.league}/auctions?`)) {
        return listResponse(ordinaryAuction(), [ordinaryStartTeam()]);
      }
      if (path.startsWith("/api/v1/players?")) return playerSearchResponse();
      if (path === `/api/v1/leagues/${IDS.league}/auctions` && options.method === "POST") {
        startBody = options.body;
        return {
          data: {
            code: "AUCTION_STARTED",
            replayed: false,
            auction: {
              id: IDS.auctionTwo,
              leagueId: IDS.league,
              seasonId: IDS.season,
              playerId: IDS.player,
              status: "Active",
              openedAtMs: NOW_MS,
              bidClosesAtMs: NOW_MS + DAY_MS,
              scheduledResolutionAtMs: NOW_MS + DAY_MS,
              openedByUserId: id(90),
              version: 1,
            },
            openingBid: {
              id: IDS.bid,
              teamId: IDS.team,
              status: "active",
              version: 1,
            },
            event: {
              id: IDS.activity,
              type: "auction_started",
              occurredAtMs: NOW_MS,
            },
          },
        };
      }
      throw new Error(`Unexpected request: ${path}`);
    });

    const view = renderPage(
      `/leagues/${IDS.league}/auctions`,
      "/leagues/:leagueId/auctions",
      <AuctionsPage />
    );
    expect(await screen.findByText("Weekly auction")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    await view.user.type(screen.getByRole("combobox", { name: "Player" }), "ada");
    await view.user.click(await screen.findByRole("option", { name: /Ada Player/ }));
    await view.user.click(screen.getByRole("button", { name: "Start auction" }));
    await waitFor(() => {
      expect(startBody).toEqual({
        teamId: IDS.team,
        playerId: IDS.player,
        aavCents: 100,
        termYears: 1,
      });
    });
  });

  it("preserves ordinary own-bid editing with If-Match version and no FAD confirmation", async () => {
    let submitted = null;
    sessionHarness.request.mockImplementation(async (path, options = {}) => {
      if (path === "/api/v1/leagues") return leagueResponse();
      if (path === `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}`) {
        return { data: ordinaryAuction() };
      }
      if (path === `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}/bids/mine`) {
        submitted = { body: options.body, version: options.version };
        return { data: bidReceipt(2) };
      }
      throw new Error(`Unexpected request: ${path}`);
    });

    const view = renderPage(
      `/leagues/${IDS.league}/auctions/${IDS.auction}`,
      "/leagues/:leagueId/auctions/:auctionId",
      <AuctionDetailPage />
    );
    expect(await screen.findByText(/Your sealed bid for Snow Owls/i)).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    await view.user.click(screen.getByRole("button", { name: "Update my bid" }));
    await waitFor(() => {
      expect(submitted).toEqual({
        body: {
          teamId: IDS.team,
          aavCents: 300,
          termYears: 2,
        },
        version: 1,
      });
    });
  });

  it("withholds stale manager bid DOM across an authorization epoch and preserves other-league caches", async () => {
    const managedAuction = restrictedAuction({
      bidCount: 1,
      participatingTeamCount: 1,
      viewerTeams: [
        {
          ...restrictedAuction().viewerTeams[0],
          bid: viewerBid(),
          join: denied("ENTRY_NOT_EDITABLE"),
          edit: allowed(),
        },
      ],
    });
    let managerLost = false;
    sessionHarness.request.mockImplementation(async (path) => {
      if (path === "/api/v1/leagues") return leagueResponse();
      if (path === `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}`) {
        return {
          data: managerLost
            ? { ...managedAuction, viewerTeams: [] }
            : managedAuction,
        };
      }
      throw new Error(`Unexpected request: ${path}`);
    });

    const view = renderPage(
      `/leagues/${IDS.league}/auctions/${IDS.auction}`,
      "/leagues/:leagueId/auctions/:auctionId",
      <AuctionDetailPage />,
      { onPrivacyBoundary: () => { managerLost = true; } }
    );
    expect(await screen.findByText(/Your sealed bid for Snow Owls/i)).toBeInTheDocument();
    const currentKey = ["league", IDS.league, "auctions", "detail", IDS.auction];
    const otherKey = [
      "league",
      IDS.otherLeague,
      "auctions",
      "detail",
      IDS.otherAuction,
    ];
    view.queryClient.setQueryDefaults(otherKey, {
      meta: { private: true, leagueId: IDS.otherLeague },
    });
    view.queryClient.setQueryData(otherKey, { marker: "other-league-private" });

    await view.user.click(
      screen.getByRole("button", { name: "Begin auction reauthorization" })
    );
    expect(screen.queryByText(/Your sealed bid for Snow Owls/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Reauthorizing private auction access/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(view.queryClient.getQueryData(currentKey)).toBeUndefined();
    });
    expect(view.queryClient.getQueryData(otherKey)).toEqual({
      marker: "other-league-private",
    });

    await view.user.click(
      screen.getByRole("button", { name: "Finish auction reauthorization" })
    );
    expect(
      await screen.findByText(/no managed-team bid view for this account/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Your sealed bid for Snow Owls/i)).not.toBeInTheDocument();
  });

  it("fails closed instead of rendering an administrative row without capability evidence", async () => {
    const current = restrictedAuction({
      viewerTeams: [],
      administrativeBids: [
        administrativeBid({
          capabilities: {
            adminEditBid: denied(),
            adminRemoveBid: denied(),
          },
        }),
      ],
    });
    sessionHarness.request.mockImplementation(async (path) => {
      if (path === "/api/v1/leagues") return leagueResponse();
      if (path === `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}`) {
        return { data: current };
      }
      throw new Error(`Unexpected request: ${path}`);
    });

    renderPage(
      `/leagues/${IDS.league}/auctions/${IDS.auction}`,
      "/leagues/:leagueId/auctions/:auctionId",
      <AuctionDetailPage />
    );
    expect(await screen.findByText(/no managed-team bid view/i)).toBeInTheDocument();
    expect(screen.queryByText("Administrative Competitor")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sealed auction controls" })).not.toBeInTheDocument();
  });

  it("clears commissioner receipts and unsent replacement values at an authorization boundary", async () => {
    let current = restrictedAuction({
      bidCount: 1,
      participatingTeamCount: 1,
      viewerTeams: [],
      administrativeBids: [administrativeBid()],
    });
    sessionHarness.request.mockImplementation(async (path, options = {}) => {
      if (path === "/api/v1/leagues") return leagueResponse();
      if (path === `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}`) {
        return { data: current };
      }
      if (
        path ===
          `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}/bids/${IDS.bidTwo}` &&
        options.method === "PATCH"
      ) {
        current = {
          ...current,
          updatedAtMs: current.updatedAtMs + 1,
          administrativeBids: [administrativeBid({ version: 2 })],
        };
        return { data: current };
      }
      throw new Error(`Unexpected request: ${path}`);
    });

    const view = renderPage(
      `/leagues/${IDS.league}/auctions/${IDS.auction}`,
      "/leagues/:leagueId/auctions/:auctionId",
      <AuctionDetailPage />,
      { onPrivacyBoundary: vi.fn() }
    );
    const replace = await screen.findByRole("button", {
      name: /replace active sealed bid for Administrative Competitor/i,
    });
    await view.user.click(replace);
    await view.user.type(screen.getByLabelText("Replacement AAV (dollars per year)"), "5.00");
    await view.user.selectOptions(screen.getByLabelText("Replacement term"), "3");
    await view.user.click(screen.getByRole("button", { name: "Replace sealed bid" }));
    expect(await screen.findByText(/sealed bid replacement was accepted/i)).toBeInTheDocument();

    await view.user.click(screen.getByRole("button", {
      name: "Begin auction reauthorization",
    }));
    expect(screen.queryByText(/sealed bid replacement was accepted/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Reauthorizing private auction access/i)).toBeInTheDocument();
    await view.user.click(screen.getByRole("button", {
      name: "Finish auction reauthorization",
    }));
    const remountedReplace = await screen.findByRole("button", {
      name: /replace active sealed bid for Administrative Competitor/i,
    });
    expect(screen.queryByText(/sealed bid replacement was accepted/i)).not.toBeInTheDocument();

    await view.user.click(remountedReplace);
    await view.user.type(screen.getByLabelText("Replacement AAV (dollars per year)"), "99.00");
    await view.user.click(screen.getByRole("button", {
      name: "Begin auction reauthorization",
    }));
    expect(screen.queryByLabelText("Replacement AAV (dollars per year)")).not.toBeInTheDocument();
    await view.user.click(screen.getByRole("button", {
      name: "Finish auction reauthorization",
    }));
    await view.user.click(await screen.findByRole("button", {
      name: /replace active sealed bid for Administrative Competitor/i,
    }));
    expect(screen.getByLabelText("Replacement AAV (dollars per year)")).toHaveValue(null);
  });

  it("renders every viewer team and submits only an eligible team’s own FAD bid", async () => {
    let current = restrictedAuction({
      administrativeBids: [administrativeBid()],
    });
    let submitted = null;
    sessionHarness.request.mockImplementation(async (path, options = {}) => {
      if (path === "/api/v1/leagues") return leagueResponse();
      if (path === `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}`) {
        return { data: current };
      }
      if (path === `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}/bids/mine`) {
        submitted = { body: options.body, version: options.version };
        current = restrictedAuction({
          bidCount: 1,
          participatingTeamCount: 1,
          viewerTeams: [
            {
              ...restrictedAuction().viewerTeams[0],
              bid: viewerBid(),
              join: denied("ENTRY_NOT_EDITABLE"),
              edit: allowed(),
            },
            restrictedAuction().viewerTeams[1],
          ],
        });
        return { data: bidReceipt(1) };
      }
      throw new Error(`Unexpected request: ${path}`);
    });

    const view = renderPage(
      `/leagues/${IDS.league}/auctions/${IDS.auction}`,
      "/leagues/:leagueId/auctions/:auctionId",
      <AuctionDetailPage />
    );
    expect(await screen.findByRole("heading", { name: "Snow Owls" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ice Foxes" })).toBeInTheDocument();
    expect(screen.getAllByText("Not eligible")).toHaveLength(2);
    expect(screen.getByText(/must actively submit a strict improvement/i)).toBeInTheDocument();
    expect(screen.getByText(/not an eligible participant/i)).toBeInTheDocument();
    expect(screen.getByText("Administrative Competitor")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /replace active sealed bid for Administrative Competitor/i })).toBeInTheDocument();
    expect(screen.queryByText(/Administrative Competitor.*\$99\.99/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /withdraw/i })).not.toBeInTheDocument();

    await view.user.click(
      screen.getByRole("checkbox", { name: /I understand this bid is binding/i })
    );
    await view.user.click(screen.getByRole("button", { name: "Join auction" }));
    expect(await screen.findByText(/opening bid was accepted/i)).toBeInTheDocument();
    expect(submitted).toEqual({
      body: {
        teamId: IDS.team,
        aavCents: 175,
        termYears: 3,
        bindingIllegalityConfirmed: true,
      },
      version: undefined,
    });
    expect(screen.getByText(/Your sealed bid for Snow Owls/i)).toBeInTheDocument();
    expect(screen.queryByText("$99.99")).not.toBeInTheDocument();
  });

  it("replaces and removes a FAD bid by sealed administrative identity with 412-safe refresh", async () => {
    let current = restrictedAuction({
      bidCount: 1,
      participatingTeamCount: 1,
      viewerTeams: [],
      administrativeBids: [administrativeBid()],
    });
    const editRequests = [];
    const removeRequests = [];
    sessionHarness.request.mockImplementation(async (path, options = {}) => {
      if (path === "/api/v1/leagues") return leagueResponse();
      if (path === `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}`) {
        return { data: current };
      }
      const bidPath = `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}/bids/${IDS.bidTwo}`;
      if (path === bidPath && options.method === "PATCH") {
        editRequests.push(options);
        if (editRequests.length === 1) {
          current = {
            ...current,
            updatedAtMs: current.updatedAtMs + 1,
            administrativeBids: [administrativeBid({ version: 2 })],
          };
          throw Object.assign(new Error("Bid version changed."), {
            status: 412,
            code: "AUCTION_PRECONDITION_FAILED",
          });
        }
        current = {
          ...current,
          updatedAtMs: current.updatedAtMs + 1,
          administrativeBids: [administrativeBid({ version: 3 })],
        };
        return { data: current };
      }
      if (path === bidPath && options.method === "DELETE") {
        removeRequests.push(options);
        current = {
          ...current,
          updatedAtMs: current.updatedAtMs + 1,
          participatingTeamCount: 0,
          administrativeBids: [
            administrativeBid({
              version: 4,
              status: "withdrawn",
              participantStatus: "removed",
              capabilities: {
                adminEditBid: denied("ENTRY_NOT_EDITABLE"),
                adminRemoveBid: denied("ENTRY_NOT_EDITABLE"),
              },
            }),
          ],
        };
        return {
          data: {
            auction: current,
            removedBidId: IDS.bidTwo,
            restrictedParticipantStatus: "removed",
            fadAllocationVersion: 2,
          },
        };
      }
      throw new Error(`Unexpected request: ${path}`);
    });

    const view = renderPage(
      `/leagues/${IDS.league}/auctions/${IDS.auction}`,
      "/leagues/:leagueId/auctions/:auctionId",
      <AuctionDetailPage />
    );
    const replaceTrigger = await screen.findByRole("button", {
      name: /replace active sealed bid for Administrative Competitor/i,
    });
    await view.user.click(replaceTrigger);
    const replacement = screen.getByLabelText("Replacement AAV (dollars per year)");
    expect(replacement).toHaveFocus();
    expect(replacement).toHaveValue(null);
    expect(document.body).not.toHaveTextContent(IDS.bidTwo);
    expect(screen.getByText(/current bid value and term are not revealed or prefilled/i)).toBeInTheDocument();
    await view.user.click(screen.getByRole("button", { name: "Keep current bid" }));
    await waitFor(() => expect(replaceTrigger).toHaveFocus());

    await view.user.click(replaceTrigger);
    const retryValue = screen.getByLabelText("Replacement AAV (dollars per year)");
    await view.user.type(retryValue, "5.00");
    await view.user.selectOptions(screen.getByLabelText("Replacement term"), "3");
    await view.user.click(screen.getByRole("button", { name: "Replace sealed bid" }));
    expect(await screen.findByText(/entered amount and term were preserved/i)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveFocus();
    expect(retryValue).toHaveValue(5);
    expect(editRequests.map(({ version }) => version)).toEqual([1]);

    await view.user.click(screen.getByRole("button", { name: "Replace sealed bid" }));
    expect(await screen.findByText(/sealed bid replacement was accepted/i)).toBeInTheDocument();
    expect(editRequests.map(({ version }) => version)).toEqual([1, 2]);
    expect(editRequests[1]).toMatchObject({
      body: {
        teamId: IDS.teamFour,
        aavCents: 500,
        termYears: 3,
      },
      idempotencyKey: `auction-admin-edit:${IDS.intent}`,
    });

    await view.user.click(screen.getByRole("button", {
      name: /remove active sealed bid for Administrative Competitor/i,
    }));
    expect(screen.getByText("Confirm bid removal")).toHaveFocus();
    const removeConfirmation = screen.getByRole("checkbox", {
      name: /remove the active sealed bid for Administrative Competitor/i,
    });
    expect(screen.getByRole("button", { name: "Remove confirmed bid" })).toBeDisabled();
    await view.user.click(removeConfirmation);
    await view.user.click(screen.getByRole("button", { name: "Remove confirmed bid" }));
    expect(await screen.findByText(/bid removal was recorded/i)).toBeInTheDocument();
    expect(removeRequests).toHaveLength(1);
    expect(removeRequests[0]).toMatchObject({
      method: "DELETE",
      body: { confirmation: "REMOVE AUCTION BID" },
      version: 3,
      idempotencyKey: `auction-admin-remove:${IDS.intent}`,
    });
    expect(document.body).not.toHaveTextContent(IDS.bidTwo);
  });

  it("requires explicit confirmation for an ordinary commissioner cancellation", async () => {
    let current = ordinaryAuction({
      viewerTeams: [],
      administrativeBids: [],
      capabilities: {
        view: allowed(),
        adminCancel: allowed(),
        adminResolve: denied("DEADLINE_PASSED"),
      },
    });
    let cancellation = null;
    sessionHarness.request.mockImplementation(async (path, options = {}) => {
      if (path === "/api/v1/leagues") return leagueResponse();
      if (path === `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}`) {
        return { data: current };
      }
      if (path === `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}/cancel`) {
        cancellation = options;
        current = cancelledOrdinary();
        return { data: { auction: current, fadAllocation: null, recoveryId: null } };
      }
      throw new Error(`Unexpected request: ${path}`);
    });

    const view = renderPage(
      `/leagues/${IDS.league}/auctions/${IDS.auction}`,
      "/leagues/:leagueId/auctions/:auctionId",
      <AuctionDetailPage />
    );
    await view.user.click(await screen.findByRole("button", { name: "Cancel auction" }));
    expect(screen.getByText("Confirm auction cancellation")).toHaveFocus();
    const submit = screen.getByRole("button", { name: "Cancel confirmed auction" });
    expect(submit).toBeDisabled();
    await view.user.click(screen.getByRole("checkbox", {
      name: /cancel this auction before a winner is assigned/i,
    }));
    await view.user.click(submit);
    expect(await screen.findByText(/auction cancellation was recorded/i)).toBeInTheDocument();
    expect(cancellation).toMatchObject({
      method: "POST",
      body: { confirmation: "CANCEL AUCTION" },
      version: 1,
      idempotencyKey: `auction-admin-cancel:${IDS.intent}`,
    });
  });

  it("requests the normal FAD resolution operation without offering winner selection", async () => {
    const current = restrictedAuction({
      resolvesAtMs: NOW_MS,
      targetRolloverAtMs: NOW_MS,
      creationCutoffAtMs: NOW_MS - 3_600_000,
      viewerTeams: [],
      administrativeBids: [],
      capabilities: {
        view: allowed(),
        adminCancel: denied("DEADLINE_PASSED"),
        adminResolve: allowed(),
      },
    });
    let resolution = null;
    sessionHarness.request.mockImplementation(async (path, options = {}) => {
      if (path === "/api/v1/leagues") return leagueResponse();
      if (path === `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}`) {
        return { data: current };
      }
      if (path === `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}/resolve`) {
        resolution = options;
        return {
          data: {
            operationId: IDS.operation,
            occurrenceKey: `auction:${IDS.auction}:${NOW_MS}`,
            auctionId: IDS.auction,
            status: "pending",
            acceptedAtMs: NOW_MS,
            pollDescriptor: {
              kind: "auction",
              leagueId: IDS.league,
              auctionId: IDS.auction,
            },
          },
        };
      }
      throw new Error(`Unexpected request: ${path}`);
    });

    const view = renderPage(
      `/leagues/${IDS.league}/auctions/${IDS.auction}`,
      "/leagues/:leagueId/auctions/:auctionId",
      <AuctionDetailPage />
    );
    await view.user.click(await screen.findByRole("button", { name: "Request resolution" }));
    expect(screen.queryByRole("textbox", { name: /winner/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /winner/i })).not.toBeInTheDocument();
    expect(screen.getByText(/does not let me select a winner/i)).toBeInTheDocument();
    await view.user.click(screen.getByRole("checkbox", {
      name: /request the normal server resolution operation/i,
    }));
    await view.user.click(screen.getByRole("button", { name: "Request confirmed resolution" }));
    expect(await screen.findByText(/resolution request was accepted/i)).toBeInTheDocument();
    expect(resolution).toMatchObject({
      method: "POST",
      body: { confirmation: "RESOLVE AUCTION" },
      version: 1,
      idempotencyKey: `auction-admin-resolve:${IDS.intent}`,
    });
  });

  it("renders removed, cooldown, and edit-limit rows without creating submit controls", async () => {
    const cooldownBid = viewerBid({ bidId: IDS.bid });
    const limitedBid = viewerBid({
      bidId: IDS.bidTwo,
      editCount: 1,
      editLimit: 1,
    });
    const auction = restrictedAuction({
      bidCount: 2,
      participatingTeamCount: 2,
      eligibleTeams: [
        team(),
        team(IDS.teamTwo, "Ice Foxes"),
        team(IDS.teamThree, "Harbour Seals"),
      ],
      viewerTeams: [
        {
          teamId: IDS.team,
          team: team(),
          eligible: true,
          participantStatus: "active",
          bid: cooldownBid,
          join: denied("ENTRY_NOT_EDITABLE"),
          edit: denied("COOLDOWN_ACTIVE"),
        },
        {
          teamId: IDS.teamTwo,
          team: team(IDS.teamTwo, "Ice Foxes"),
          eligible: true,
          participantStatus: "active",
          bid: limitedBid,
          join: denied("ENTRY_NOT_EDITABLE"),
          edit: denied("EDIT_LIMIT_REACHED"),
        },
        {
          teamId: IDS.teamThree,
          team: team(IDS.teamThree, "Harbour Seals"),
          eligible: false,
          participantStatus: "removed",
          bid: null,
          join: denied("TEAM_NOT_PARTICIPANT"),
          edit: denied("TEAM_NOT_PARTICIPANT"),
        },
      ],
    });
    sessionHarness.request.mockImplementation(async (path) => {
      if (path === "/api/v1/leagues") return leagueResponse();
      if (path === `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}`) {
        return { data: auction };
      }
      throw new Error(`Unexpected request: ${path}`);
    });

    renderPage(
      `/leagues/${IDS.league}/auctions/${IDS.auction}`,
      "/leagues/:leagueId/auctions/:auctionId",
      <AuctionDetailPage />
    );
    expect(await screen.findByText(/cooldown is still active/i)).toBeInTheDocument();
    expect(screen.getByText(/used every manager edit/i)).toBeInTheDocument();
    expect(screen.getAllByText("Removed from restricted participation")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Update my bid" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Join auction" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /withdraw/i })).not.toBeInTheDocument();
    expect(
      sessionHarness.request.mock.calls.some(([path]) => path.endsWith("/bids/mine"))
    ).toBe(false);
  });

  it("labels a fallback as league-wide with no leader while permitting an equal floor", async () => {
    const fallback = restrictedAuction({
      sourceKind: "fad_open_rapid",
      fadOrigin: "restricted_no_improvement_fallback",
      eligibleTeams: [],
      viewerTeams: [],
    });
    sessionHarness.request.mockImplementation(async (path) => {
      if (path === "/api/v1/leagues") return leagueResponse();
      if (path === `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}`) {
        return { data: fallback };
      }
      throw new Error(`Unexpected request: ${path}`);
    });

    renderPage(
      `/leagues/${IDS.league}/auctions/${IDS.auction}`,
      "/leagues/:leagueId/auctions/:auctionId",
      <AuctionDetailPage />
    );
    expect(await screen.findByText("Fallback floor")).toBeInTheDocument();
    expect(screen.getByText(/league-wide fresh auction with no initial leader/i)).toBeInTheDocument();
    expect(screen.getByText(/first bid may equal this floor/i)).toBeInTheDocument();
  });

  it("refetches after a 412, preserves safe input, and retries with the new bid version", async () => {
    const baseViewer = restrictedAuction().viewerTeams[0];
    let current = restrictedAuction({
      bidCount: 1,
      participatingTeamCount: 1,
      viewerTeams: [
        {
          ...baseViewer,
          bid: viewerBid({ version: 1 }),
          join: denied("ENTRY_NOT_EDITABLE"),
          edit: allowed(),
        },
      ],
    });
    const versions = [];
    sessionHarness.request.mockImplementation(async (path, options = {}) => {
      if (path === "/api/v1/leagues") return leagueResponse();
      if (path === `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}`) {
        return { data: current };
      }
      if (path === `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}/bids/mine`) {
        versions.push(options.version);
        if (versions.length === 1) {
          current = {
            ...current,
            version: 2,
            viewerTeams: [
              {
                ...current.viewerTeams[0],
                bid: viewerBid({ version: 2, totalValueCents: 700, aavCents: 350 }),
              },
            ],
          };
          throw Object.assign(new Error("Bid version changed."), {
            status: 412,
            code: "AUCTION_BID_VERSION_CONFLICT",
          });
        }
        return { data: bidReceipt(3) };
      }
      throw new Error(`Unexpected request: ${path}`);
    });

    const view = renderPage(
      `/leagues/${IDS.league}/auctions/${IDS.auction}`,
      "/leagues/:leagueId/auctions/:auctionId",
      <AuctionDetailPage />
    );
    const aav = await screen.findByLabelText("AAV (dollars per year)");
    await view.user.clear(aav);
    await view.user.type(aav, "9.00");
    expect(screen.getByRole("button", { name: "Update my bid" })).toBeDisabled();
    await view.user.click(
      screen.getByRole("checkbox", { name: /I understand this bid is binding/i })
    );
    await view.user.click(screen.getByRole("button", { name: "Update my bid" }));
    await screen.findByText(/entered amount and term were preserved/i);
    const conflictAlert = screen.getByRole("alert");
    expect(conflictAlert).toHaveFocus();
    expect(aav).toHaveAttribute("aria-describedby", conflictAlert.id);
    expect(aav).toHaveValue(9);
    expect(versions).toEqual([1]);

    await view.user.click(screen.getByRole("button", { name: "Update my bid" }));
    await waitFor(() => expect(versions).toEqual([1, 2]));
  });

  it("renders terminal no-winner meaning and auditable exact-top draw evidence", async () => {
    const resolvedAtMs = NOW_MS + DAY_MS;
    const resolved = restrictedAuction({
      status: "resolved",
      version: 4,
      resolvedAtMs,
      updatedAtMs: resolvedAtMs,
      bidCount: 2,
      participatingTeamCount: 2,
      viewerTeams: [],
      result: {
        outcomeCode: "resolved",
        winningTeam: team(),
        submittedTotalValueCents: 600,
        submittedTermYears: 2,
        submittedAavCents: 300,
        finalContractValueCents: 500,
        finalAavCents: 250,
        contractId: IDS.contract,
        ownershipId: IDS.ownership,
        activityId: IDS.activity,
        recoveryId: null,
        drawEvidence: {
          commitmentHex: "a".repeat(64),
          reveal: {
            algorithmVersion: 1,
            nonceHex: "b".repeat(64),
            selectionUsed: true,
            orderedBidIds: [IDS.bid, IDS.bidTwo],
            counter: 0,
            digestHex: "c".repeat(64),
            selectedIndex: 0,
            selectedBidId: IDS.bid,
            selectedTeamId: IDS.team,
          },
        },
        resolvedAtMs,
      },
    });
    sessionHarness.request.mockImplementation(async (path) => {
      if (path === "/api/v1/leagues") return leagueResponse();
      if (path === `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}`) {
        return { data: resolved };
      }
      throw new Error(`Unexpected request: ${path}`);
    });

    renderPage(
      `/leagues/${IDS.league}/auctions/${IDS.auction}`,
      "/leagues/:leagueId/auctions/:auctionId",
      <AuctionDetailPage />
    );
    expect(await screen.findByText(/2 bids remained exactly tied/i)).toBeInTheDocument();
    expect(screen.getByText("Draw used")).toBeInTheDocument();
    expect(screen.getByText(IDS.bid)).toBeInTheDocument();
    expect(screen.getByText(IDS.bidTwo)).toBeInTheDocument();
    expect(screen.getByText(/final contract value/i)).toBeInTheDocument();
  });

  it("loads a correction-required terminal auction directly without exposing recovery controls", async () => {
    const resolvedAtMs = NOW_MS + DAY_MS;
    const correction = restrictedAuction({
      status: "correction_required",
      resolvedAtMs,
      updatedAtMs: resolvedAtMs,
      viewerTeams: [],
      result: {
        outcomeCode: "correction_required",
        winningTeam: null,
        submittedTotalValueCents: null,
        submittedTermYears: null,
        submittedAavCents: null,
        finalContractValueCents: null,
        finalAavCents: null,
        contractId: null,
        ownershipId: null,
        activityId: IDS.activity,
        recoveryId: id(70),
        drawEvidence: {
          commitmentHex: "a".repeat(64),
          reveal: null,
        },
        resolvedAtMs,
      },
    });
    sessionHarness.request.mockImplementation(async (path) => {
      if (path === "/api/v1/leagues") return leagueResponse();
      if (path === `/api/v1/leagues/${IDS.league}/auctions/${IDS.auction}`) {
        return { data: correction };
      }
      throw new Error(`Unexpected request: ${path}`);
    });

    renderPage(
      `/leagues/${IDS.league}/auctions/${IDS.auction}`,
      "/leagues/:leagueId/auctions/:auctionId",
      <AuctionDetailPage />
    );
    expect(await screen.findByText(/authoritative result requires commissioner recovery/i)).toBeInTheDocument();
    expect(screen.getByText("Reveal pending")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to auctions" })).toHaveAttribute(
      "href",
      `/leagues/${IDS.league}/auctions`
    );
    expect(screen.queryByRole("button", { name: /recover|correct/i })).not.toBeInTheDocument();
  });

  it("explains that a terminal open rapid no-winner returns to the unclaimed pool", async () => {
    const noWinner = openRapidNoWinner();
    sessionHarness.request.mockImplementation(async (path) => {
      if (path === "/api/v1/leagues") return leagueResponse();
      if (path === `/api/v1/leagues/${IDS.league}/auctions/${IDS.auctionTwo}`) {
        return { data: noWinner };
      }
      throw new Error(`Unexpected request: ${path}`);
    });

    renderPage(
      `/leagues/${IDS.league}/auctions/${IDS.auctionTwo}`,
      "/leagues/:leagueId/auctions/:auctionId",
      <AuctionDetailPage />
    );
    expect(await screen.findByText(/returned to the unclaimed pool/i)).toBeInTheDocument();
    expect(screen.getByText("No draw needed")).toBeInTheDocument();
  });
});
