import { describe, expect, it } from "vitest";

import { ResponseContractError } from "../../shared/api/responseContracts.js";
import {
  validateAuction,
  validateAuctionActions,
  validateAuctionBidResult,
  validateAuctionBidRemovalResult,
  validateAuctionCancellationResult,
  validateAuctionCollection,
  validateAuctionPage,
  validateAuctionResolutionRequest,
  validateAuctionStartResult,
} from "./auctionContracts.js";

const id = (number) =>
  `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`;
const IDS = Object.freeze({
  league: id(1),
  season: id(2),
  auction: id(3),
  fad: id(4),
  rollover: id(5),
  player: id(6),
  team: id(7),
  teamTwo: id(8),
  bid: id(9),
  bidTwo: id(10),
  contract: id(11),
  ownership: id(12),
  activity: id(13),
  queue: id(14),
  user: id(15),
  event: id(16),
  recovery: id(17),
  allocation: id(18),
  operation: id(19),
});
const NOW_MS = 1_800_000_000_000;
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

function viewerBid({ fad = false } = {}) {
  return {
    bidId: IDS.bid,
    version: 1,
    status: "active",
    totalValueCents: 600,
    termYears: 2,
    aavCents: 300,
    editCount: 0,
    editLimit: 1,
    cooldownEndsAtMs: NOW_MS + 4_500_000,
    ...(fad ? { bindingIllegalityConfirmedAtMs: NOW_MS } : {}),
  };
}

function ordinaryActive() {
  return {
    auctionId: IDS.auction,
    leagueId: IDS.league,
    seasonId: IDS.season,
    version: 1,
    player: player(),
    status: "active",
    openedAtMs: NOW_MS,
    resolvesAtMs: NOW_MS + DAY_MS,
    resolvedAtMs: null,
    updatedAtMs: NOW_MS,
    bidCount: 1,
    participatingTeamCount: 1,
    sourceKind: "ordinary_weekly",
    fadOrigin: null,
    fadId: null,
    fadRolloverId: null,
    targetRolloverAtMs: null,
    creationCutoffAtMs: null,
    eligibleTeams: [],
    minimumContract: null,
    drawCommitment: null,
    viewerTeams: [
      {
        teamId: IDS.team,
        team: team(),
        eligible: true,
        participantStatus: null,
        bid: viewerBid(),
        join: denied("ENTRY_NOT_EDITABLE"),
        edit: allowed(),
      },
    ],
    administrativeBids: [],
    result: null,
    capabilities: {
      view: allowed(),
      adminCancel: denied(),
      adminResolve: denied(),
    },
  };
}

function restrictedActive() {
  const auction = ordinaryActive();
  return {
    ...auction,
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
  };
}

function resolvedFad() {
  const auction = ordinaryActive();
  const resolvedAtMs = NOW_MS + DAY_MS;
  return {
    ...auction,
    version: 4,
    status: "resolved",
    resolvedAtMs,
    updatedAtMs: resolvedAtMs,
    bidCount: 2,
    participatingTeamCount: 2,
    sourceKind: "fad_open_rapid",
    fadOrigin: "manager_nomination",
    fadId: IDS.fad,
    fadRolloverId: IDS.rollover,
    targetRolloverAtMs: resolvedAtMs,
    creationCutoffAtMs: resolvedAtMs - 3_600_000,
    drawCommitment: "a".repeat(64),
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
  };
}

function queuedNomination() {
  return {
    queueId: IDS.queue,
    fadId: IDS.fad,
    teamId: IDS.team,
    player: player(),
    totalValueCents: 600,
    termYears: 2,
    aavCents: 300,
    bindingIllegalityConfirmedAtMs: NOW_MS,
    acceptedAtMs: NOW_MS,
    openingRolloverId: IDS.rollover,
    resolutionRolloverId: null,
    status: "queued",
    version: 1,
  };
}

function terminalWithoutWinner(auction, status, { recoveryId = null } = {}) {
  const resolvedAtMs = auction.resolvesAtMs;
  const fad = auction.sourceKind !== "ordinary_weekly";
  return {
    ...auction,
    version: auction.version + 1,
    status,
    resolvedAtMs,
    updatedAtMs: resolvedAtMs,
    result: {
      outcomeCode: status,
      winningTeam: null,
      submittedTotalValueCents: null,
      submittedTermYears: null,
      submittedAavCents: null,
      finalContractValueCents: null,
      finalAavCents: null,
      contractId: null,
      ownershipId: null,
      activityId: IDS.activity,
      recoveryId,
      drawEvidence: fad
        ? {
            commitmentHex: auction.drawCommitment,
            reveal: status === "correction_required"
              ? null
              : {
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
          }
        : null,
      resolvedAtMs,
    },
  };
}

function correctionAllocation() {
  return {
    allocationId: IDS.allocation,
    allocationVersion: 2,
    player: player(),
    status: "correction_required",
    decisionCode: "restricted_auction_cancelled",
    rankedOffers: [],
    winner: null,
    restricted: { auctionId: IDS.auction, status: "correction_required" },
    fallback: null,
    draws: [],
    recoveryStatus: "correction_required",
    resolvedAtMs: null,
  };
}

describe("auction response contracts", () => {
  it("accepts exact ordinary, restricted, and terminal FAD auction projections", () => {
    expect(validateAuction(ordinaryActive())).toBe(true);
    expect(validateAuction(restrictedActive())).toBe(true);
    expect(validateAuction(resolvedFad())).toBe(true);
    expect(validateAuctionCollection([ordinaryActive(), resolvedFad()])).toBe(true);
  });

  it("accepts a restricted manager projection with the eligible-team identities hidden", () => {
    const auction = restrictedActive();
    auction.eligibleTeams = [];

    expect(validateAuction(auction)).toBe(true);
    expect(auction.viewerTeams[0].participantStatus).toBe("active");
  });

  it("keeps restricted minimums distinct from bids and rejects leaked administrative values", () => {
    const auction = restrictedActive();
    auction.administrativeBids = [
      {
        bidId: IDS.bid,
        teamId: IDS.team,
        team: team(),
        version: 1,
        status: "active",
        participantStatus: "active",
        capabilities: {
          adminEditBid: allowed(),
          adminRemoveBid: allowed(),
        },
      },
    ];
    expect(validateAuction(auction)).toBe(true);

    auction.administrativeBids[0].totalValueCents = 9_999;
    expect(() => validateAuction(auction)).toThrow(ResponseContractError);

    const unauthorized = restrictedActive();
    unauthorized.administrativeBids = [
      {
        bidId: IDS.bid,
        teamId: IDS.team,
        team: team(),
        version: 1,
        status: "active",
        participantStatus: "active",
        capabilities: {
          adminEditBid: denied(),
          adminRemoveBid: denied(),
        },
      },
    ];
    expect(() => validateAuction(unauthorized)).toThrow(
      "lack authorization evidence"
    );
  });

  it("rejects mismatched restricted eligibility, FAD confirmation, and draw selection", () => {
    const eligibility = restrictedActive();
    eligibility.viewerTeams[0].eligible = false;
    expect(() => validateAuction(eligibility)).toThrow("eligible is inconsistent");

    const confirmation = restrictedActive();
    confirmation.viewerTeams[0].bid = viewerBid();
    confirmation.bidCount = 1;
    confirmation.participatingTeamCount = 1;
    expect(() => validateAuction(confirmation)).toThrow(ResponseContractError);

    const draw = resolvedFad();
    draw.result.drawEvidence.reveal.selectedBidId = IDS.bidTwo;
    expect(() => validateAuction(draw)).toThrow("selectedBidId is inconsistent");
  });

  it("rejects a FAD projection whose target rollover differs from resolution", () => {
    const auction = restrictedActive();
    auction.targetRolloverAtMs += 60_000;
    auction.creationCutoffAtMs += 60_000;
    expect(() => validateAuction(auction)).toThrow(
      "target rollover is inconsistent"
    );
  });

  it("validates collection start capabilities and exact long opaque cursor pages", () => {
    const actions = {
      startTeams: [
        {
          teamId: IDS.team,
          team: team(),
          sourceKind: "fad_open_rapid",
          fadId: IDS.fad,
          fadRolloverId: IDS.rollover,
          targetRolloverAtMs: NOW_MS + DAY_MS,
          creationCutoffAtMs: NOW_MS + DAY_MS - 3_600_000,
          startAuction: allowed(),
        },
      ],
    };
    expect(validateAuctionActions(actions)).toBe(true);
    expect(
      validateAuctionPage({ nextCursor: "a".repeat(256), hasMore: true })
    ).toBe(true);
    expect(validateAuctionPage({ nextCursor: null, hasMore: false })).toBe(true);
  });

  it("rejects missing, extra, oversized, and noncanonical cursor page fields", () => {
    for (const page of [
      { hasMore: false },
      { nextCursor: null, hasMore: false, extra: true },
      { nextCursor: "a".repeat(1_025), hasMore: true },
      { nextCursor: "abc=", hasMore: true },
      { nextCursor: "abc+d", hasMore: true },
      { nextCursor: "abcde", hasMore: true },
      { nextCursor: "cursor", hasMore: false },
    ]) {
      expect(() => validateAuctionPage(page)).toThrow(ResponseContractError);
    }
  });

  it("accepts direct and queued FAD starts plus exact bid receipts", () => {
    expect(
      validateAuctionStartResult({
        kind: "auction_opened",
        auction: {
          ...restrictedActive(),
          sourceKind: "fad_open_rapid",
          fadOrigin: "manager_nomination",
          eligibleTeams: [],
          minimumContract: null,
          viewerTeams: [],
        },
        queuedNomination: null,
      })
    ).toBe(true);
    expect(
      validateAuctionStartResult({
        kind: "nomination_queued",
        auction: null,
        queuedNomination: queuedNomination(),
      })
    ).toBe(true);
    expect(
      validateAuctionBidResult({
        code: "AUCTION_BID_SUBMITTED",
        replayed: false,
        auction: {
          id: IDS.auction,
          leagueId: IDS.league,
          seasonId: IDS.season,
          status: "open",
          openedAtMs: NOW_MS,
          bidClosesAtMs: NOW_MS + DAY_MS,
        },
        bid: {
          id: IDS.bid,
          teamId: IDS.team,
          totalValueCents: 600,
          termYears: 2,
          aavCents: 300,
          firstSubmittedAtMs: NOW_MS,
          lastEditedAtMs: NOW_MS,
          editCount: 0,
          status: "active",
          version: 1,
        },
      })
    ).toBe(true);
  });

  it("retains the existing ordinary start receipt for managers and blind commissioners", () => {
    const auction = {
      id: IDS.auction,
      leagueId: IDS.league,
      seasonId: IDS.season,
      playerId: IDS.player,
      status: "Active",
      openedAtMs: NOW_MS,
      bidClosesAtMs: NOW_MS + DAY_MS,
      scheduledResolutionAtMs: NOW_MS + DAY_MS,
      openedByUserId: IDS.user,
      version: 1,
    };
    const event = {
      id: IDS.event,
      type: "auction_started",
      occurredAtMs: NOW_MS,
    };
    const fullBid = {
      id: IDS.bid,
      teamId: IDS.team,
      submittedByUserId: IDS.user,
      totalValueCents: 600,
      termYears: 2,
      aavCents: 300,
      firstSubmittedAtMs: NOW_MS,
      lastEditedAtMs: NOW_MS,
      editCount: 0,
      status: "active",
      version: 1,
    };
    expect(
      validateAuctionStartResult({
        code: "AUCTION_STARTED",
        replayed: false,
        auction,
        openingBid: fullBid,
        event,
      })
    ).toBe(true);
    expect(
      validateAuctionStartResult({
        code: "AUCTION_STARTED",
        replayed: true,
        auction,
        openingBid: {
          id: IDS.bid,
          teamId: IDS.team,
          status: "active",
          version: 1,
        },
        event,
      })
    ).toBe(true);
  });

  it("rejects extra queued receipt fields and inconsistent bid-result actions", () => {
    const queued = queuedNomination();
    queued.activationJobRunId = IDS.event;
    expect(() =>
      validateAuctionStartResult({
        kind: "nomination_queued",
        auction: null,
        queuedNomination: queued,
      })
    ).toThrow(ResponseContractError);

    const edited = {
      code: "AUCTION_BID_EDITED",
      replayed: false,
      auction: {
        id: IDS.auction,
        leagueId: IDS.league,
        seasonId: IDS.season,
        status: "open",
        openedAtMs: NOW_MS,
        bidClosesAtMs: NOW_MS + DAY_MS,
      },
      bid: {
        id: IDS.bid,
        teamId: IDS.team,
        totalValueCents: 600,
        termYears: 2,
        aavCents: 300,
        firstSubmittedAtMs: NOW_MS,
        lastEditedAtMs: NOW_MS,
        editCount: 0,
        status: "active",
        version: 1,
      },
    };
    expect(() => validateAuctionBidResult(edited)).toThrow("action is inconsistent");
  });

  it("validates exact commissioner bid-removal results in ordinary and restricted contexts", () => {
    expect(
      validateAuctionBidRemovalResult({
        auction: ordinaryActive(),
        removedBidId: IDS.bid,
        restrictedParticipantStatus: null,
        fadAllocationVersion: null,
      })
    ).toBe(true);
    expect(
      validateAuctionBidRemovalResult({
        auction: restrictedActive(),
        removedBidId: IDS.bid,
        restrictedParticipantStatus: "removed",
        fadAllocationVersion: 2,
      })
    ).toBe(true);

    const mismatched = {
      auction: restrictedActive(),
      removedBidId: IDS.bid,
      restrictedParticipantStatus: null,
      fadAllocationVersion: null,
    };
    expect(() => validateAuctionBidRemovalResult(mismatched)).toThrow(
      "inconsistent with its auction context"
    );
  });

  it("validates ordinary, open-FAD, and restricted-FAD cancellation combinations", () => {
    expect(
      validateAuctionCancellationResult({
        auction: terminalWithoutWinner(ordinaryActive(), "cancelled"),
        fadAllocation: null,
        recoveryId: null,
      })
    ).toBe(true);
    expect(
      validateAuctionCancellationResult({
        auction: terminalWithoutWinner(
          {
            ...restrictedActive(),
            sourceKind: "fad_open_rapid",
            fadOrigin: "manager_nomination",
            eligibleTeams: [],
            minimumContract: null,
            viewerTeams: [],
          },
          "cancelled",
          { recoveryId: IDS.recovery }
        ),
        fadAllocation: null,
        recoveryId: IDS.recovery,
      })
    ).toBe(true);
    expect(
      validateAuctionCancellationResult({
        auction: terminalWithoutWinner(restrictedActive(), "correction_required", {
          recoveryId: IDS.recovery,
        }),
        fadAllocation: correctionAllocation(),
        recoveryId: IDS.recovery,
      })
    ).toBe(true);

    const leaked = correctionAllocation();
    leaked.currentBidValueCents = 9_999;
    expect(() =>
      validateAuctionCancellationResult({
        auction: terminalWithoutWinner(restrictedActive(), "correction_required", {
          recoveryId: IDS.recovery,
        }),
        fadAllocation: leaked,
        recoveryId: IDS.recovery,
      })
    ).toThrow(ResponseContractError);
  });

  it("validates resolution receipts and binds their occurrence and poll identities", () => {
    const receipt = {
      operationId: IDS.operation,
      occurrenceKey: `auction:${IDS.auction}:${NOW_MS + DAY_MS}`,
      auctionId: IDS.auction,
      status: "pending",
      acceptedAtMs: NOW_MS + DAY_MS,
      pollDescriptor: {
        kind: "auction",
        leagueId: IDS.league,
        auctionId: IDS.auction,
      },
    };
    expect(validateAuctionResolutionRequest(receipt)).toBe(true);
    expect(() =>
      validateAuctionResolutionRequest({
        ...receipt,
        occurrenceKey: `auction:${IDS.auction}:01`,
      })
    ).toThrow("occurrenceKey");
    expect(() =>
      validateAuctionResolutionRequest({
        ...receipt,
        pollDescriptor: { ...receipt.pollDescriptor, auctionId: IDS.fad },
      })
    ).toThrow("mismatched");
  });
});
