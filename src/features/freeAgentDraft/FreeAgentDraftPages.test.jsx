import { screen, waitFor, within } from "@testing-library/react";
import { infiniteQueryOptions } from "@tanstack/react-query";
import React from "react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("socket.io-client", () => ({
  io: () => ({ onAny() {}, offAny() {}, disconnect() {} }),
}));

import { routePaths } from "../../app/routePaths.js";
import { ApiError } from "../../shared/api/ApiError.js";
import { createQueryClient } from "../../shared/query/queryClient.js";
import { RealtimeContext } from "../../shared/realtime/realtimeContext.js";
import { renderWithProviders } from "../../test/render.jsx";
import { CandidateCardBuilder } from "./CandidateCardBuilder.jsx";
import {
  CandidateCardPage,
  CurrentFreeAgentDraftPage,
  FreeAgentDraftPage,
  FreeAgentDraftResultsPage,
} from "./FreeAgentDraftPages.jsx";
import { freeAgentDraftKeys } from "./freeAgentDraftQueries.js";

const leagueId = "11111111-1111-4111-8111-111111111111";
const seasonId = "22222222-2222-4222-8222-222222222222";
const fadId = "33333333-3333-4333-8333-333333333333";
const teamId = "44444444-4444-4444-8444-444444444444";
const secondTeamId = "55555555-5555-4555-8555-555555555555";
const cardId = "66666666-6666-4666-8666-666666666666";
const assignmentId = "77777777-7777-4777-8777-777777777777";
const helpId = "88888888-8888-4888-8888-888888888888";
const replacementHelpId = "99999999-9999-4999-8999-999999999999";
const userId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const playerId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const entryId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const revisionId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const fallbackWinnerTeamId = "abababab-abab-4bab-8bab-abababababab";
const restrictedAuctionId = "12121212-1212-4212-8212-121212121212";
const fallbackAuctionId = "13131313-1313-4313-8313-131313131313";
const winningBidId = "14141414-1414-4414-8414-141414141414";
const otherBidId = "15151515-1515-4515-8515-151515151515";
const contractId = "16161616-1616-4616-8616-161616161616";
const ownershipId = "17171717-1717-4717-8717-171717171717";
const config = Object.freeze({
  appEnv: "local",
  apiOrigin: "http://localhost:4000",
  socketOrigin: "http://localhost:4000",
  buildId: null,
});

function envelope(data, status = 200) {
  return new Response(
    JSON.stringify({ data, meta: { requestId: "request-fad-ui" } }),
    { status, headers: { "Content-Type": "application/json" } }
  );
}

function session() {
  return {
    csrfToken: "D".repeat(43),
    session: {
      id: userId,
      userId,
      status: "active",
      createdAtMs: 1,
      lastUsedAtMs: 1,
      idleExpiresAtMs: 2,
      absoluteExpiresAtMs: 3,
      version: 1,
    },
    user: {
      id: userId,
      displayName: "FAD Manager",
      status: "active",
      version: 1,
    },
  };
}

function visibleLeague(permissionCategory = "manager") {
  return {
    id: leagueId,
    name: "Candidate League",
    status: "active",
    timezone: "America/Vancouver",
    currentSeason: {
      id: seasonId,
      label: "2026-27",
      status: "active",
      version: 1,
    },
    membership: {
      effectiveAuthority: permissionCategory,
      id: userId,
      permissionCategory,
      status: "active",
      version: 1,
    },
    version: 1,
  };
}

function team(id = teamId, name = "Candidate Owls") {
  return {
    teamId: id,
    name,
    primaryColour: "#112233",
    secondaryColour: "#ffffff",
    tertiaryColour: null,
    patternTemplate: "solid",
    logoReference: null,
  };
}

function leagueTeam(id = teamId, name = "Candidate Owls") {
  return {
    id,
    leagueId,
    name,
    currentManager: null,
    version: 1,
  };
}

function teamsFound(teams = [leagueTeam()]) {
  return { code: "TEAMS_FOUND", teams };
}

function authorizationEvidence(kind = "manager_assignment", id = assignmentId) {
  return { kind, id };
}

function descriptor({
  mode = "private_card",
  evidence = authorizationEvidence(),
} = {}) {
  return {
    mode,
    seasonId,
    fadId,
    teamId,
    cardId,
    authorizationEvidence: mode === "private_card" ? evidence : null,
  };
}

function managedCard({ includeDescriptor = true } = {}) {
  return {
    teamId,
    team: team(),
    cardId,
    managerAssignmentId: assignmentId,
    cardVersion: 1,
    lifecycleStatus: "open",
    completenessCode: "incomplete",
    missingMandatoryCount: 17,
    conflictCount: 0,
    capStatus: "compliant",
    allocationEligibility: "eligible",
    helpRequestStatus: "not_requested",
    ...(includeDescriptor ? { cardDescriptor: descriptor() } : {}),
  };
}

function overview({
  serverNowMs = 1_000_000,
  candidateDeadlineAtMs = serverNowMs + 60_000,
  managedCards = [managedCard()],
  commissionerCards = [],
} = {}) {
  return {
    leagueId,
    seasonId,
    fadId,
    version: 1,
    status: "cards_open",
    phase: "cards_open",
    serverNowMs,
    timeZone: "America/Vancouver",
    openedAtMs: serverNowMs - 10_000,
    reminderAtMs: serverNowMs + 10_000,
    helpOpensAtMs: serverNowMs + 20_000,
    candidateDeadlineAtMs,
    deadlineLockedAtMs: null,
    allocationCompletedAtMs: null,
    nextRolloverAtMs: serverNowMs + 70_000,
    frozenFadFirstMatchupStartsAtMs: serverNowMs + 100_000,
    competitionFirstMatchupStartsAtMs: serverNowMs + 100_000,
    scheduleRecoveryOperationId: null,
    completedAtMs: null,
    counts: {
      participatingTeams: 1,
      cardsLocked: 0,
      allocationsPending: 0,
      allocationsAutomatic: 0,
      restrictedPending: 0,
      restrictedFallbackPending: 0,
      rapidAuctionsOpen: 0,
      rolloversPersisted: 7,
      rolloversCompleted: 0,
      recoveriesOpen: 0,
    },
    viewer: {
      managedCards,
      commissionerCards,
      queuedNominations: [],
    },
    presentation: null,
    capabilities: {
      viewPublishedCards: { allowed: false, reasonCode: "PHASE_CLOSED" },
      viewRecovery: { allowed: false, reasonCode: "NOT_AUTHORIZED" },
      completeRecoveryAction: {
        allowed: false,
        reasonCode: "NOT_AUTHORIZED",
      },
    },
  };
}

function navigation({
  rosterLinks = [],
  managedCards = [
    { ...managedCard({ includeDescriptor: false }), urgencyCode: "CARD_INCOMPLETE" },
  ],
} = {}) {
  return {
    serverNowMs: 1_000_000,
    timeZone: "America/Vancouver",
    fadId,
    seasonId,
    phase: "cards_open",
    showMainNavigation: true,
    candidateDeadlineAtMs: 1_060_000,
    nextRolloverAtMs: 1_070_000,
    frozenFadFirstMatchupStartsAtMs: 1_100_000,
    competitionFirstMatchupStartsAtMs: 1_100_000,
    managedCards,
    rosterLinks,
    urgencyCode: "CARD_INCOMPLETE",
  };
}

const denied = (reasonCode = "ENTRY_NOT_EDITABLE") => ({
  allowed: false,
  reasonCode,
});

function emptySlot(slotKey) {
  const group = slotKey[0];
  return {
    slotKey,
    slotGroup: group,
    required: group !== "B",
    occupantKind: "empty",
    entryId: null,
    entryVersion: null,
    player: null,
    authoritativeRosterCategory: null,
    locked: false,
    totalValueCents: null,
    termYears: null,
    aavCents: null,
    remainingYears: null,
    validation: { status: "valid", codes: [] },
    outcome: null,
    lastEditedAtMs: null,
    lastEditedBy: null,
    capabilities: {
      addCandidate: { allowed: true, reasonCode: null },
      editCandidate: denied(),
      moveCandidate: denied(),
      moveCarryover: denied(),
      removeCandidate: denied(),
    },
  };
}

function slotKeys() {
  return [
    ...Array.from({ length: 12 }, (_, index) => `F${String(index + 1).padStart(2, "0")}`),
    ...Array.from({ length: 6 }, (_, index) => `D${String(index + 1).padStart(2, "0")}`),
    ...Array.from({ length: 4 }, (_, index) => `B${String(index + 1).padStart(2, "0")}`),
  ];
}

function candidateCard({
  accessReason = "team_manager",
  evidence = authorizationEvidence(),
  helpContext = null,
  privatePlayerName = null,
  candidatePlayerName = null,
} = {}) {
  const slots = slotKeys().map(emptySlot);
  if (privatePlayerName) {
    slots[0] = {
      ...emptySlot("F01"),
      occupantKind: "carryover",
      entryId,
      entryVersion: 1,
      player: { playerId, fullName: privatePlayerName, positionGroup: "F" },
      authoritativeRosterCategory: "Active",
      locked: true,
      totalValueCents: 1_200,
      termYears: 3,
      aavCents: 400,
      remainingYears: 2,
      lastEditedAtMs: 1,
      lastEditedBy: {
        userId: null,
        displayName: null,
        authority: "system",
      },
      capabilities: {
        addCandidate: denied("SLOT_OCCUPIED"),
        editCandidate: denied("SLOT_LOCKED"),
        moveCandidate: denied("SLOT_LOCKED"),
        moveCarryover: { allowed: true, reasonCode: null },
        removeCandidate: denied("SLOT_LOCKED"),
      },
    };
  }
  if (candidatePlayerName) {
    slots[1] = {
      ...emptySlot("F02"),
      occupantKind: "candidate",
      entryId,
      entryVersion: 1,
      player: { playerId, fullName: candidatePlayerName, positionGroup: "F" },
      locked: false,
      totalValueCents: 600,
      termYears: 1,
      aavCents: 600,
      lastEditedAtMs: 2,
      lastEditedBy: {
        userId,
        displayName: "FAD Manager",
        authority: "manager",
      },
      capabilities: {
        addCandidate: denied("SLOT_OCCUPIED"),
        editCandidate: { allowed: true, reasonCode: null },
        moveCandidate: { allowed: true, reasonCode: null },
        moveCarryover: denied("ENTRY_NOT_EDITABLE"),
        removeCandidate: { allowed: true, reasonCode: null },
      },
    };
  }
  return {
    leagueId,
    seasonId,
    fadId,
    teamId,
    cardId,
    cardVersion: 1,
    phase: "cards_open",
    visibilityMode: "private_editable",
    accessReason,
    authorizationEvidence: evidence,
    lifecycleStatus: "open",
    completeness: {
      code: "incomplete",
      filledMandatoryCount:
        (privatePlayerName ? 1 : 0) + (candidatePlayerName ? 1 : 0),
      missingMandatoryCount:
        18 - (privatePlayerName ? 1 : 0) - (candidatePlayerName ? 1 : 0),
      filledBenchCount: 0,
      emptyBenchCount: 4,
      blockingValidationCount: 0,
      structuralConflictCount: 0,
      carriedRosterStructuralConflictCount: 0,
    },
    capProjection: {
      capLimitCents: 10_000,
      carriedActivePlayerAmountCents: privatePlayerName ? 400 : 0,
      retentionObligationCents: 0,
      buyoutPenaltyCents: 0,
      carriedCapUsageCents: privatePlayerName ? 400 : 0,
      proposedCandidateAavCents: candidatePlayerName ? 600 : 0,
      maximumPossibleCapCents:
        (privatePlayerName ? 400 : 0) + (candidatePlayerName ? 600 : 0),
      maximumCapSpaceCents:
        10_000 -
        (privatePlayerName ? 400 : 0) -
        (candidatePlayerName ? 600 : 0),
    },
    capStatus: "compliant",
    allocationEligibility: "eligible",
    allocationExclusionReason: null,
    slots,
    conflicts: [],
    helpContext,
    commissionerInterventions: [],
    capabilities: {
      editCard: { allowed: true, reasonCode: null },
      requestHelp: { allowed: true, reasonCode: null },
      viewPublishedHistory: denied("PHASE_CLOSED"),
    },
  };
}

function publishedOverview() {
  const data = overview({ managedCards: [] });
  return {
    ...data,
    status: "allocating",
    phase: "allocating",
    deadlineLockedAtMs: data.serverNowMs - 5_000,
    counts: {
      ...data.counts,
      cardsLocked: 1,
      allocationsPending: 1,
    },
    capabilities: {
      viewPublishedCards: { allowed: true, reasonCode: null },
      viewRecovery: denied("NOT_AUTHORIZED"),
      completeRecoveryAction: denied("NOT_AUTHORIZED"),
    },
  };
}

function publishedCandidateCard() {
  const card = candidateCard({
    privatePlayerName: "Published Carryover",
    candidatePlayerName: "Published Candidate",
  });
  return {
    ...card,
    phase: "allocating",
    visibilityMode: "published_history",
    accessReason: "published_league_history",
    authorizationEvidence: null,
    lifecycleStatus: "locked_incomplete",
    slots: card.slots.map((slot) => ({
      ...slot,
      outcome:
        slot.occupantKind === "carryover"
          ? { code: "carryover", allocationId: null, auctionId: null }
          : null,
      capabilities: {
        addCandidate: denied("PHASE_CLOSED"),
        editCandidate: denied("PHASE_CLOSED"),
        moveCandidate: denied("PHASE_CLOSED"),
        moveCarryover: denied("PHASE_CLOSED"),
        removeCandidate: denied("PHASE_CLOSED"),
      },
    })),
    helpContext: null,
    capabilities: {
      editCard: denied("PHASE_CLOSED"),
      requestHelp: denied("PHASE_CLOSED"),
      viewPublishedHistory: { allowed: true, reasonCode: null },
    },
  };
}

function publishedSummary() {
  return {
    leagueId,
    seasonId,
    fadId,
    teamId,
    team: team(),
    snapshotId: revisionId,
    lockedCardVersion: 1,
    lifecycleStatus: "locked_incomplete",
    completeness: publishedCandidateCard().completeness,
    capStatus: "compliant",
    allocationEligibility: "eligible",
    allocationExclusionReason: null,
    maximumPossibleCapCents: 1_000,
    carriedCapUsageCents: 400,
    counts: {
      carryovers: 1,
      candidates: 1,
      emptyMandatory: 16,
      emptyBench: 4,
      conflicts: 0,
    },
    outcomeCounts: {
      automaticWins: 0,
      restrictedPending: 0,
      restrictedWins: 0,
      fallbackPending: 0,
      fallbackWins: 0,
      fallbackNoWinner: 0,
      losses: 0,
      invalidOffers: 0,
    },
    commissionerInterventionCount: 0,
    historyDescriptor: {
      mode: "published_card",
      seasonId,
      fadId,
      teamId,
      cardId,
    },
  };
}

function pendingAllocationResult() {
  return {
    allocationId: helpId,
    allocationVersion: 1,
    player: { playerId, fullName: "Pending Player", positionGroup: "F" },
    status: "pending",
    decisionCode: null,
    rankedOffers: [
      {
        snapshotEntryId: entryId,
        teamId,
        team: team(),
        slotKey: "F02",
        totalValueCents: 600,
        termYears: 1,
        aavCents: 600,
        valid: true,
        validationCode: null,
        rank: null,
        outcomeCode: "pending",
      },
    ],
    winner: null,
    restricted: null,
    fallback: null,
    draws: [],
    recoveryStatus: null,
    resolvedAtMs: null,
  };
}

function terminalOffer(id, idTeam, name) {
  return {
    snapshotEntryId: id,
    teamId: idTeam,
    team: team(idTeam, name),
    slotKey: "F02",
    totalValueCents: 600,
    termYears: 2,
    aavCents: 300,
    valid: true,
    validationCode: null,
    rank: 1,
    outcomeCode: "restricted_tied",
  };
}

function noSelectionDraw(auctionId, auctionType) {
  return {
    auctionId,
    auctionType,
    drawCommitment: "a".repeat(64),
    drawReveal: {
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
  };
}

function fallbackNoWinnerAllocationResult() {
  return {
    allocationId: helpId,
    allocationVersion: 7,
    player: { playerId, fullName: "Unclaimed Player", positionGroup: "F" },
    status: "fallback_open_resolved",
    decisionCode: "fallback_open_no_winner",
    rankedOffers: [
      terminalOffer(entryId, teamId, "Candidate Owls"),
      terminalOffer(revisionId, secondTeamId, "Second Team"),
    ],
    winner: null,
    restricted: {
      auctionId: restrictedAuctionId,
      status: "no_winner",
      participantTeamIds: [teamId, secondTeamId],
      minimumTotalValueCents: 600,
      minimumTermYears: 2,
      minimumAavCents: 300,
    },
    fallback: {
      auctionId: fallbackAuctionId,
      status: "no_winner",
      minimumTotalValueCents: 600,
      winningBidId: null,
      contractId: null,
      ownershipId: null,
      noWinnerReason: "no_winner",
    },
    draws: [
      noSelectionDraw(restrictedAuctionId, "fad_restricted"),
      noSelectionDraw(fallbackAuctionId, "fad_open_rapid"),
    ],
    recoveryStatus: "resolved",
    resolvedAtMs: 2_000,
  };
}

function fallbackWinnerAllocationResult() {
  const result = fallbackNoWinnerAllocationResult();
  return {
    ...result,
    player: { ...result.player, fullName: "Fallback Winner" },
    decisionCode: "fallback_open_result",
    winner: {
      teamId: fallbackWinnerTeamId,
      snapshotEntryId: null,
      contractId,
      ownershipId,
      slotKey: "F02",
      totalValueCents: 700,
      termYears: 1,
      aavCents: 700,
    },
    fallback: {
      ...result.fallback,
      status: "resolved",
      winningBidId,
      contractId,
      ownershipId,
      noWinnerReason: null,
    },
    draws: [
      result.draws[0],
      {
        auctionId: fallbackAuctionId,
        auctionType: "fad_open_rapid",
        drawCommitment: "a".repeat(64),
        drawReveal: {
          algorithmVersion: 1,
          nonceHex: "b".repeat(64),
          selectionUsed: true,
          orderedBidIds: [winningBidId, otherBidId],
          counter: 0,
          digestHex: "c".repeat(64),
          selectedIndex: 0,
          selectedBidId: winningBidId,
          selectedTeamId: fallbackWinnerTeamId,
        },
      },
    ],
  };
}

function collectionEnvelope(data, page = { nextCursor: null, hasMore: false }) {
  return new Response(
    JSON.stringify({ data, page, meta: { requestId: "request-fad-ui" } }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

function helpContext(expiresAtMs) {
  return {
    helpRequestId: helpId,
    status: "active",
    message: "Please help with this card.",
    requestedByUserId: userId,
    requestedByDisplayName: "FAD Manager",
    requestedAtMs: expiresAtMs - 1_000,
    expiresAtMs,
  };
}

function baseFetch(extra, permissionCategory = "manager") {
  return vi.fn(async (url, options = {}) => {
    const parsed = new URL(url);
    if (parsed.pathname === "/api/v1/session") return envelope(session());
    if (parsed.pathname === "/api/v1/leagues") {
      return envelope({ code: "LEAGUES_FOUND", leagues: [visibleLeague(permissionCategory)] });
    }
    return extra(parsed, options);
  });
}

function renderRoute({
  path = `/leagues/${leagueId}/free-agent-draft/${fadId}/cards/${teamId}`,
  route = "/leagues/:leagueId/free-agent-draft/:fadId/cards/:teamId",
  element = <CandidateCardPage />,
  fetchImpl,
  queryClient,
  realtime = { status: "disconnected", privacyEpoch: 0 },
}) {
  return renderWithProviders(
    <RealtimeContext.Provider value={realtime}>
      <Routes>
        <Route path={route} element={element} />
      </Routes>
    </RealtimeContext.Provider>,
    {
      initialEntries: [path],
      queryClient,
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    }
  );
}

describe("FAD-15 Candidate Card frontend", () => {
  it("resolves the current route from T-126 to the one authorized stable card", async () => {
    const fetchImpl = baseFetch((parsed) => {
      if (parsed.pathname.endsWith("/free-agent-drafts/navigation")) {
        return envelope(navigation());
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    renderWithProviders(
      <RealtimeContext.Provider value={{ status: "disconnected", privacyEpoch: 0 }}>
        <Routes>
          <Route
            path="/leagues/:leagueId/free-agent-draft"
            element={<CurrentFreeAgentDraftPage />}
          />
          <Route
            path="/leagues/:leagueId/free-agent-draft/:fadId/cards/:teamId"
            element={<p>Stable Candidate Card route</p>}
          />
        </Routes>
      </RealtimeContext.Provider>,
      {
        initialEntries: [routePaths.leagueFreeAgentDraft(leagueId)],
        enableSession: true,
        config,
        sessionOptions: { fetchImpl },
      }
    );

    expect(await screen.findByText("Stable Candidate Card route")).toBeInTheDocument();
  });

  it("keeps multiple managed teams on the stable selector instead of inferring one global team", async () => {
    const second = {
      ...managedCard(),
      teamId: secondTeamId,
      team: team(secondTeamId, "Second Team"),
      cardId: replacementHelpId,
      managerAssignmentId: helpId,
      cardDescriptor: {
        ...descriptor(),
        teamId: secondTeamId,
        cardId: replacementHelpId,
        authorizationEvidence: authorizationEvidence("manager_assignment", helpId),
      },
    };
    const data = overview({ managedCards: [managedCard(), second] });
    const fetchImpl = baseFetch((parsed) => {
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) return envelope(data);
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    renderRoute({
      path: routePaths.freeAgentDraft(leagueId, fadId),
      route: "/leagues/:leagueId/free-agent-draft/:fadId",
      element: <FreeAgentDraftPage />,
      fetchImpl,
    });

    expect(await screen.findByRole("link", { name: /Candidate Owls/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Second Team/ })).toBeInTheDocument();
  });

  it("does not request scoped navigation until T-129 supplies the exact season ID", async () => {
    let resolveOverview;
    const overviewResponse = new Promise((resolve) => {
      resolveOverview = resolve;
    });
    const requests = [];
    const fetchImpl = baseFetch((parsed) => {
      requests.push(parsed);
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) {
        return overviewResponse;
      }
      if (parsed.pathname.endsWith("/free-agent-drafts/navigation")) {
        return envelope(navigation({ rosterLinks: [descriptor()] }));
      }
      if (parsed.pathname.endsWith(`/candidate-cards/${teamId}/private`)) {
        return envelope(candidateCard({ privatePlayerName: "Sequenced Carryover" }));
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    renderRoute({ fetchImpl });

    await waitFor(() =>
      expect(
        requests.some((request) => request.pathname.endsWith(`/free-agent-drafts/${fadId}`))
      ).toBe(true)
    );
    expect(
      requests.some((request) => request.pathname.endsWith("/navigation"))
    ).toBe(false);

    resolveOverview(envelope(overview()));
    expect(await screen.findByText("Sequenced Carryover")).toBeInTheDocument();
    const scoped = requests.filter((request) => request.pathname.endsWith("/navigation"));
    expect(scoped.length).toBeGreaterThan(0);
    for (const request of scoped) {
      expect(request.searchParams.get("rosterSeasonId")).toBe(seasonId);
      expect(request.searchParams.get("rosterTeamId")).toBe(teamId);
      expect(request.search).not.toContain(fadId);
    }
  });

  it("withholds the old same-team private DOM across an evidence rotation and realtime epoch", async () => {
    let rotated = false;
    const managerEvidence = authorizationEvidence();
    const rotatedEvidence = authorizationEvidence("help_request", replacementHelpId);
    const fetchImpl = baseFetch((parsed) => {
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) {
        return envelope(overview());
      }
      if (parsed.pathname.endsWith("/free-agent-drafts/navigation")) {
        return envelope(
          navigation({
            rosterLinks: [
              descriptor({ evidence: rotated ? rotatedEvidence : managerEvidence }),
            ],
          })
        );
      }
      if (parsed.pathname.endsWith(`/candidate-cards/${teamId}/private`)) {
        return envelope(
          rotated
            ? candidateCard({
                accessReason: "help_grant_commissioner",
                evidence: rotatedEvidence,
                helpContext: helpContext(1_100_000),
                privatePlayerName: "Replacement Help View",
              })
            : candidateCard({
                evidence: managerEvidence,
                privatePlayerName: "Old Manager View",
              })
        );
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    }, "commissioner");

    function RealtimeHarness() {
      const [value, setValue] = React.useState({
        status: "disconnected",
        privacyEpoch: 0,
      });
      return (
        <>
          <button
            onClick={() => {
              rotated = true;
              setValue({ status: "reauthorizing", privacyEpoch: 1 });
            }}
          >
            Rotate evidence
          </button>
          <button onClick={() => setValue({ status: "connected", privacyEpoch: 1 })}>
            Finish reauthorization
          </button>
          <RealtimeContext.Provider value={value}>
            <Routes>
              <Route
                path="/leagues/:leagueId/free-agent-draft/:fadId/cards/:teamId"
                element={<CandidateCardPage />}
              />
            </Routes>
          </RealtimeContext.Provider>
        </>
      );
    }

    const view = renderWithProviders(<RealtimeHarness />, {
      initialEntries: [routePaths.freeAgentDraftCard(leagueId, fadId, teamId)],
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    });
    expect(await screen.findByText("Old Manager View")).toBeInTheDocument();
    await view.user.click(screen.getByRole("button", { name: "Rotate evidence" }));
    expect(screen.queryByText("Old Manager View")).toBeNull();
    expect(screen.getByText(/Reauthorizing.*Candidate Card/i)).toBeInTheDocument();
    await view.user.click(screen.getByRole("button", { name: "Finish reauthorization" }));
    expect(await screen.findByText("Replacement Help View")).toBeInTheDocument();
    expect(screen.queryByText("Old Manager View")).toBeNull();
  });

  it("fails closed on a remount-style cached overview whose measured deadline already passed", async () => {
    const queryClient = createQueryClient();
    const staleOverview = overview({
      serverNowMs: 1_000_000,
      candidateDeadlineAtMs: 1_001_000,
    });
    queryClient.setQueryData(
      freeAgentDraftKeys.overview(leagueId, fadId),
      staleOverview,
      { updatedAt: Date.now() - 4_000 }
    );
    const requests = [];
    const fetchImpl = baseFetch((parsed) => {
      requests.push(parsed.pathname);
      if (parsed.pathname.endsWith("/free-agent-drafts/navigation")) {
        return envelope(navigation({ rosterLinks: [descriptor()] }));
      }
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) {
        return new Promise(() => {});
      }
      if (parsed.pathname.endsWith(`/candidate-cards/${teamId}/private`)) {
        return envelope(candidateCard({ privatePlayerName: "Must Stay Hidden" }));
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    renderRoute({ fetchImpl, queryClient });

    expect(
      await screen.findByText(/measured deadline has passed/i)
    ).toBeInTheDocument();
    expect(screen.queryByText("Must Stay Hidden")).toBeNull();
    expect(
      requests.some((path) => path.endsWith(`/candidate-cards/${teamId}/private`))
    ).toBe(false);
  });

  it("hides a help-authorized card at its measured grant expiry without relying on a socket event", async () => {
    const helpEvidence = authorizationEvidence("help_request", helpId);
    const serverNowMs = 1_000_000;
    const fetchImpl = baseFetch((parsed) => {
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) {
        return envelope(overview({ serverNowMs }));
      }
      if (parsed.pathname.endsWith("/free-agent-drafts/navigation")) {
        return envelope(
          navigation({ rosterLinks: [descriptor({ evidence: helpEvidence })] })
        );
      }
      if (parsed.pathname.endsWith(`/candidate-cards/${teamId}/private`)) {
        return envelope(
          candidateCard({
            accessReason: "help_grant_commissioner",
            evidence: helpEvidence,
            helpContext: helpContext(serverNowMs + 250),
            privatePlayerName: "Temporary Help View",
          })
        );
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    }, "commissioner");
    renderRoute({ fetchImpl });

    expect(await screen.findByText("Temporary Help View")).toBeInTheDocument();
    expect(
      await screen.findByText(/help authorization has expired/i, {}, { timeout: 2_000 })
    ).toBeInTheDocument();
    expect(screen.queryByText("Temporary Help View")).toBeNull();
  });

  it.each([
    ["edit", "Edit contract", "PATCH", `/entries/${entryId}`],
    ["move", "Move", "POST", `/entries/${entryId}/move`],
    ["remove", "Remove", "DELETE", `/entries/${entryId}`],
  ])(
    "previews and applies the server-authorized %s workflow without optimistic card replacement",
    async (action, buttonName, expectedMethod, expectedSuffix) => {
      const card = candidateCard({ candidatePlayerName: "Editable Candidate" });
      const commandRequests = [];
      const httpClient = {
        request: vi.fn(async (path, options) => {
          if (path.endsWith("/revision-previews")) {
            return {
              data: {
                baseCardVersion: 1,
                action: options.body.action,
                projectedCard: {
                  ...card,
                  cardVersion: 2,
                  visibilityMode: "private_read_only",
                },
                projectedSlot: null,
                warnings: [],
              },
            };
          }
          commandRequests.push({ path, options });
          return {
            data: {
              card: { ...card, cardVersion: 2 },
              revisionId,
              changedEntryId: action === "remove" ? null : entryId,
            },
          };
        }),
      };
      const onAuthoritativeCard = vi.fn();
      const view = renderWithProviders(
        <CandidateCardBuilder
          card={card}
          httpClient={httpClient}
          timeZone="America/Vancouver"
          buildEligibleQueryOptions={() =>
            infiniteQueryOptions({
              queryKey: ["unused-eligible", action],
              initialPageParam: null,
              queryFn: async () => ({
                items: [],
                page: { nextCursor: null, hasMore: false },
              }),
              getNextPageParam: () => undefined,
            })
          }
          onAuthoritativeCard={onAuthoritativeCard}
          onProtectedFailure={vi.fn()}
        />,
        { enableSession: false, config }
      );

      const candidateSlot = document.querySelector('[data-slot-key="F02"]');
      const actionButton = within(candidateSlot).getByRole("button", {
        name: buttonName,
      });
      actionButton.focus();
      await view.user.keyboard("{Enter}");
      if (action === "edit") {
        const total = screen.getByLabelText("Total contract value (CAD dollars)");
        await view.user.clear(total);
        await view.user.type(total, "9.00");
      } else if (action === "move") {
        await view.user.selectOptions(
          screen.getByLabelText("Destination slot"),
          "B01"
        );
      }
      const previewButton = screen.getByRole("button", { name: "Preview change" });
      previewButton.focus();
      await view.user.keyboard("{Enter}");
      expect(await screen.findByText("Server revision preview")).toBeInTheDocument();
      const applyButton = screen.getByRole("button", {
        name: "Apply reviewed change",
      });
      applyButton.focus();
      await view.user.keyboard("{Enter}");

      await waitFor(() => expect(commandRequests).toHaveLength(1));
      expect(commandRequests[0].path).toMatch(new RegExp(`${expectedSuffix}$`));
      expect(commandRequests[0].options.method).toBe(expectedMethod);
      expect(commandRequests[0].options.version).toBe(1);
      expect(commandRequests[0].options.idempotencyKey).toMatch(
        new RegExp(`^candidate-${action}:`)
      );
      if (action === "edit") {
        expect(commandRequests[0].options.body).toEqual({
          totalValueCents: 900,
          termYears: 1,
        });
      }
      if (action === "move") {
        expect(commandRequests[0].options.body).toEqual({ slotKey: "B01" });
      }
      if (action === "remove") {
        expect(commandRequests[0].options).not.toHaveProperty("body");
      }
      expect(onAuthoritativeCard).toHaveBeenCalledWith(
        expect.objectContaining({ cardVersion: 2 })
      );
      await waitFor(() =>
        expect(document.querySelector('[data-slot-key="F02"]')).toHaveFocus()
      );
    }
  );

  it("announces keyboard validation errors and restores focus to the originating slot on close", async () => {
    const card = candidateCard();
    const view = renderWithProviders(
      <CandidateCardBuilder
        card={card}
        httpClient={{ request: vi.fn() }}
        timeZone="America/Vancouver"
        buildEligibleQueryOptions={() =>
          infiniteQueryOptions({
            queryKey: ["keyboard-validation-eligible"],
            initialPageParam: null,
            queryFn: async () => ({
              items: [],
              page: { nextCursor: null, hasMore: false },
            }),
            getNextPageParam: () => undefined,
          })
        }
        onAuthoritativeCard={vi.fn()}
        onProtectedFailure={vi.fn()}
      />,
      { enableSession: false, config }
    );

    const slot = document.querySelector('[data-slot-key="F02"]');
    const addButton = within(slot).getByRole("button", { name: "Add candidate" });
    addButton.focus();
    await view.user.keyboard("{Enter}");

    const previewButton = screen.getByRole("button", { name: "Preview change" });
    previewButton.focus();
    await view.user.keyboard("{Enter}");
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveAttribute("id", "candidate-editor-error");
    expect(alert).toHaveTextContent(/positive total contract value/i);
    expect(
      screen.getByRole("form", { name: "Add a candidate to F02" })
    ).toHaveAttribute("aria-describedby", "candidate-editor-error");
    expect(
      screen.getByLabelText("Total contract value (CAD dollars)")
    ).toHaveAttribute("aria-describedby", "candidate-editor-error");
    expect(screen.getByLabelText("Contract term")).toHaveAttribute(
      "aria-describedby",
      "candidate-editor-error"
    );

    await view.user.type(
      screen.getByLabelText("Total contract value (CAD dollars)"),
      "1.00"
    );
    previewButton.focus();
    await view.user.keyboard("{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /choose an eligible player/i
    );
    expect(
      screen.getByRole("form", { name: "Add a candidate to F02" })
    ).toHaveAttribute("aria-describedby", "candidate-editor-error");

    const closeButton = screen.getByRole("button", { name: "Close" });
    closeButton.focus();
    await view.user.keyboard("{Enter}");
    await waitFor(() =>
      expect(document.querySelector('[data-slot-key="F02"]')).toHaveFocus()
    );
  });

  it("sends an explicit exact-card help request and displays its league-timezone expiry", async () => {
    const card = candidateCard();
    const requests = [];
    const httpClient = {
      request: vi.fn(async (path, options) => {
        requests.push({ path, options });
        return {
          data: {
            helpRequestId: helpId,
            leagueId,
            seasonId,
            fadId,
            cardId,
            teamId,
            status: "active",
            message: "Please review my card.",
            requestedByUserId: userId,
            requestedByDisplayName: "FAD Manager",
            requestedAtMs: Date.parse("2026-08-11T19:00:00.000Z"),
            expiresAtMs: Date.parse("2026-08-12T19:00:00.000Z"),
            version: 1,
          },
        };
      }),
    };
    const onAuthoritativeCard = vi.fn();
    const view = renderWithProviders(
      <CandidateCardBuilder
        card={card}
        httpClient={httpClient}
        timeZone="America/Vancouver"
        buildEligibleQueryOptions={() =>
          infiniteQueryOptions({
            queryKey: ["unused-help-eligible"],
            initialPageParam: null,
            queryFn: async () => ({
              items: [],
              page: { nextCursor: null, hasMore: false },
            }),
            getNextPageParam: () => undefined,
          })
        }
        onAuthoritativeCard={onAuthoritativeCard}
        onProtectedFailure={vi.fn()}
      />,
      { enableSession: false, config }
    );

    await view.user.type(
      screen.getByLabelText("Private message (optional)"),
      "  Please review my card.  "
    );
    const helpButton = screen.getByRole("button", {
      name: "Request commissioner help",
    });
    helpButton.focus();
    await view.user.keyboard("{Enter}");
    expect(
      await screen.findByText(/Commissioner help is available.*America\/Vancouver/)
    ).toBeInTheDocument();
    expect(requests).toHaveLength(1);
    expect(requests[0].path).toMatch(/\/help-requests$/);
    expect(requests[0].options.body).toEqual({
      message: "Please review my card.",
    });
    expect(requests[0].options).not.toHaveProperty("version");
    expect(requests[0].options.idempotencyKey).toMatch(/^candidate-help:/);
    expect(onAuthoritativeCard).toHaveBeenCalledWith(null);
  });

  it("associates a keyboard-submitted help error with the exact help form and message", async () => {
    const card = candidateCard();
    const httpClient = {
      request: vi.fn(async () => {
        throw new ApiError({
          status: 409,
          code: "CANDIDATE_HELP_REQUEST_UNAVAILABLE",
          message: "Commissioner help is not available for this card.",
        });
      }),
    };
    const view = renderWithProviders(
      <CandidateCardBuilder
        card={card}
        httpClient={httpClient}
        timeZone="America/Vancouver"
        buildEligibleQueryOptions={() =>
          infiniteQueryOptions({
            queryKey: ["help-error-eligible"],
            initialPageParam: null,
            queryFn: async () => ({
              items: [],
              page: { nextCursor: null, hasMore: false },
            }),
            getNextPageParam: () => undefined,
          })
        }
        onAuthoritativeCard={vi.fn()}
        onProtectedFailure={vi.fn()}
      />,
      { enableSession: false, config }
    );

    const helpButton = screen.getByRole("button", {
      name: "Request commissioner help",
    });
    helpButton.focus();
    await view.user.keyboard("{Enter}");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveAttribute("id", "candidate-help-error");
    expect(alert).toHaveTextContent(/help is not available/i);
    expect(
      screen.getByRole("form", { name: "Ask the commissioner for help" })
    ).toHaveAttribute("aria-describedby", "candidate-help-error");
    expect(screen.getByLabelText("Private message (optional)")).toHaveAttribute(
      "aria-describedby",
      "candidate-help-error"
    );
  });

  it("renders all 22 slots and preserves safe add input after a 412 until explicit re-preview", async () => {
    const card = candidateCard({ privatePlayerName: "Locked Carryover" });
    let previewResult = null;
    const httpClient = {
      request: vi.fn(async (path) => {
        if (path.endsWith("/revision-previews")) {
          return { data: previewResult };
        }
        if (path.includes("/slots/F02/candidate")) {
          throw new ApiError({
            status: 412,
            code: "CANDIDATE_CARD_PRECONDITION_FAILED",
            message: "The Candidate Card changed.",
          });
        }
        throw new Error(`Unexpected request: ${path}`);
      }),
    };
    const eligibleItem = {
      player: { playerId, fullName: "Eligible Candidate", positionGroup: "F" },
      effectivePositionGroup: "F",
      activeState: "active",
      benchEligible: true,
      eligibilityCode: "eligible",
      contractLimits: {
        allowedTermsYears: [1, 2, 3],
        minimumTotalValueCentsByTerm: { "1": 100, "2": 200, "3": 300 },
        maximumBenchAavCents: null,
      },
    };
    const eligibleFilters = [];
    const buildEligibleQueryOptions = (slotKey, filters) => {
      eligibleFilters.push({ slotKey, ...filters });
      return infiniteQueryOptions({
        queryKey: ["eligible-ui-test", slotKey, filters.q],
        initialPageParam: null,
        queryFn: async () => ({
          items: [eligibleItem],
          page: { nextCursor: null, hasMore: false },
        }),
        getNextPageParam: () => undefined,
      });
    };
    const onProtectedFailure = vi.fn();
    const view = renderWithProviders(
      <CandidateCardBuilder
        card={card}
        httpClient={httpClient}
        timeZone="America/Vancouver"
        buildEligibleQueryOptions={buildEligibleQueryOptions}
        onAuthoritativeCard={vi.fn()}
        onProtectedFailure={onProtectedFailure}
      />,
      { enableSession: false, config }
    );

    expect(document.querySelectorAll("[data-slot-key]")).toHaveLength(22);
    expect(screen.getByText("Locked carryover")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "F01 player" })).toHaveValue(
      "Locked Carryover"
    );
    expect(screen.getByRole("textbox", { name: "F01 player" })).toHaveAttribute(
      "readonly"
    );
    expect(screen.getByRole("textbox", { name: "F01 AAV" })).toHaveValue(
      "$4.00 AAV"
    );
    expect(screen.getByRole("textbox", { name: "F01 years" })).toHaveValue("2");
    const f02 = document.querySelector('[data-slot-key="F02"]');
    expect(within(f02).getByRole("textbox", { name: "F02 player" })).toHaveValue("");
    const addButton = within(f02).getByRole("button", { name: "Add candidate" });
    addButton.focus();
    await view.user.keyboard("{Enter}");
    const playerCombobox = screen.getByRole("combobox", { name: "Player" });
    await view.user.type(playerCombobox, "Eligible");
    await waitFor(() =>
      expect(eligibleFilters).toContainEqual({
        slotKey: "F02",
        q: "Eligible",
        limit: 12,
      })
    );
    const selectButton = await screen.findByRole("button", {
      name: "Select Eligible Candidate",
    });
    selectButton.focus();
    await view.user.keyboard("{Enter}");
    const total = screen.getByLabelText("Total contract value (CAD dollars)");
    await view.user.type(total, "6.00");
    previewResult = {
      baseCardVersion: 1,
      action: {
        type: "add",
        slotKey: "F02",
        playerId,
        totalValueCents: 600,
        termYears: 1,
      },
      projectedCard: { ...card, cardVersion: 2, visibilityMode: "private_read_only" },
      projectedSlot: null,
      warnings: [],
    };
    const previewButton = screen.getByRole("button", { name: "Preview change" });
    previewButton.focus();
    await view.user.keyboard("{Enter}");
    expect(await screen.findByText("Server revision preview")).toBeInTheDocument();
    const applyButton = screen.getByRole("button", {
      name: "Apply reviewed change",
    });
    applyButton.focus();
    await view.user.keyboard("{Enter}");
    expect(
      await screen.findByText(/safe form values are still here/i)
    ).toBeInTheDocument();
    expect(total).toHaveValue("6.00");
    expect(screen.queryByText("Server revision preview")).toBeNull();
    expect(onProtectedFailure).toHaveBeenCalledWith(
      expect.objectContaining({ status: 412 })
    );
  });
});

describe("FAD-16 published Candidate Card and allocation history", () => {
  it("refreshes a stable published-card deep link without mounting private-card authorization", async () => {
    const requests = [];
    const fetchImpl = baseFetch((parsed) => {
      requests.push(parsed);
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) {
        return envelope(publishedOverview());
      }
      if (parsed.pathname.endsWith(`/candidate-cards/${teamId}/history`)) {
        return envelope(publishedCandidateCard());
      }
      if (parsed.pathname.endsWith(`/leagues/${leagueId}/teams`)) {
        return envelope(teamsFound());
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });

    renderRoute({ fetchImpl });

    expect(await screen.findByRole("heading", { name: "Published Candidate Card" })).toBeInTheDocument();
    expect(await screen.findByText("Published Carryover")).toBeInTheDocument();
    expect(screen.getByText("Published Candidate")).toBeInTheDocument();
    expect(screen.getByText(/Candidate Owls · Immutable locked request/)).toBeInTheDocument();
    expect(document.querySelectorAll("[data-slot-key]")).toHaveLength(22);
    expect(screen.queryByRole("button", { name: /candidate|carryover|move|remove|help/i })).toBeNull();
    expect(
      requests.some((request) =>
        request.pathname.endsWith(`/candidate-cards/${teamId}/private`)
      )
    ).toBe(false);
    expect(
      requests.some((request) => request.pathname.endsWith("/navigation"))
    ).toBe(false);
  });

  it("withholds published Candidate Card history during realtime reauthorization", async () => {
    const fetchImpl = baseFetch((parsed) => {
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) {
        return envelope(publishedOverview());
      }
      if (parsed.pathname.endsWith(`/candidate-cards/${teamId}/history`)) {
        return envelope(publishedCandidateCard());
      }
      if (parsed.pathname.endsWith(`/leagues/${leagueId}/teams`)) {
        return envelope(teamsFound());
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    function PublishedHistoryReauthorizationHarness() {
      const [realtime, setRealtime] = React.useState({
        status: "connected",
        privacyEpoch: 0,
      });
      return (
        <>
          <button
            onClick={() => setRealtime({ status: "reauthorizing", privacyEpoch: 1 })}
          >
            Reauthorize history
          </button>
          <button
            onClick={() => setRealtime({ status: "connected", privacyEpoch: 1 })}
          >
            Finish history reauthorization
          </button>
          <RealtimeContext.Provider value={realtime}>
            <Routes>
              <Route
                path="/leagues/:leagueId/free-agent-draft/:fadId/cards/:teamId"
                element={<CandidateCardPage />}
              />
            </Routes>
          </RealtimeContext.Provider>
        </>
      );
    }
    const view = renderWithProviders(<PublishedHistoryReauthorizationHarness />, {
      initialEntries: [routePaths.freeAgentDraftCard(leagueId, fadId, teamId)],
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    });

    expect(await screen.findByText("Published Candidate")).toBeInTheDocument();
    await view.user.click(screen.getByRole("button", { name: "Reauthorize history" }));
    expect(screen.queryByText("Published Candidate")).toBeNull();
    expect(
      screen.getByText(/Reauthorizing league-only Candidate Card history/i)
    ).toBeInTheDocument();
    await view.user.click(
      screen.getByRole("button", { name: "Finish history reauthorization" })
    );
    expect(await screen.findByText("Published Candidate")).toBeInTheDocument();
  });

  it("keeps pending allocation evidence uninvented and normalizes keyboard-applied filters and cursors", async () => {
    const resultRequests = [];
    const fetchImpl = baseFetch((parsed) => {
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) {
        return envelope(publishedOverview());
      }
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}/candidate-cards`)) {
        return collectionEnvelope([publishedSummary()]);
      }
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}/results`)) {
        resultRequests.push(parsed);
        if (parsed.searchParams.get("cursor") === "next-results") {
          return collectionEnvelope([]);
        }
        return collectionEnvelope(
          [pendingAllocationResult()],
          parsed.searchParams.get("status")
            ? { nextCursor: null, hasMore: false }
            : { nextCursor: "next-results", hasMore: true }
        );
      }
      if (parsed.pathname.endsWith(`/leagues/${leagueId}/teams`)) {
        return envelope(teamsFound());
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    const view = renderRoute({
      path: routePaths.freeAgentDraftResults(leagueId, fadId),
      route: "/leagues/:leagueId/free-agent-draft/:fadId/results",
      element: <FreeAgentDraftResultsPage />,
      fetchImpl,
    });

    expect(await screen.findByRole("heading", { name: "Allocation results" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /Candidate Owls/ })).toHaveAttribute(
      "href",
      routePaths.freeAgentDraftCard(leagueId, fadId, teamId)
    );
    expect(screen.getByRole("status", { name: "" })).toHaveTextContent(
      /No decision, winner, rank, restricted result, fallback result, recovery status, resolution time, or draw has been inferred/i
    );
    expect(screen.getByText(/No rank/)).toBeInTheDocument();
    expect(screen.queryByText(/Winning contract/)).toBeNull();
    expect(screen.queryByText(/Rank 1/)).toBeNull();

    const loadMore = screen.getByRole("button", {
      name: "Load more allocation results",
    });
    loadMore.focus();
    await view.user.keyboard("{Enter}");
    await waitFor(() =>
      expect(
        resultRequests.some(
          (request) => request.searchParams.get("cursor") === "next-results"
        )
      ).toBe(true)
    );

    await view.user.type(
      screen.getByLabelText("Search player name"),
      "  Pending   Player  "
    );
    await view.user.selectOptions(
      screen.getByLabelText("Allocation status"),
      "correction_required"
    );
    const apply = screen.getByRole("button", { name: "Apply filters" });
    apply.focus();
    await view.user.keyboard("{Enter}");

    await waitFor(() =>
      expect(
        resultRequests.some(
          (request) =>
            request.searchParams.get("q") === "pending player" &&
            request.searchParams.get("status") === "correction_required" &&
            request.searchParams.get("limit") === "50"
        )
      ).toBe(true)
    );
  });

  it.each([
    [
      "a fallback winner from the current authorized team projection",
      fallbackWinnerAllocationResult(),
      /Winner: Fallback Foxes/,
    ],
    [
      "an authoritative fallback no-winner result",
      fallbackNoWinnerAllocationResult(),
      /returned to the unclaimed pool and may be nominated again/i,
    ],
  ])("renders %s without exposing stable IDs", async (_label, allocation, expected) => {
    const fetchImpl = baseFetch((parsed) => {
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) {
        return envelope(publishedOverview());
      }
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}/candidate-cards`)) {
        return collectionEnvelope([]);
      }
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}/results`)) {
        return collectionEnvelope([allocation]);
      }
      if (parsed.pathname.endsWith(`/leagues/${leagueId}/teams`)) {
        return envelope(
          teamsFound([
            leagueTeam(),
            leagueTeam(secondTeamId, "Second Team"),
            leagueTeam(fallbackWinnerTeamId, "Fallback Foxes"),
          ])
        );
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    renderRoute({
      path: routePaths.freeAgentDraftResults(leagueId, fadId),
      route: "/leagues/:leagueId/free-agent-draft/:fadId/results",
      element: <FreeAgentDraftResultsPage />,
      fetchImpl,
    });

    const resultCard = await screen.findByRole("heading", {
      name: allocation.player.fullName,
    });
    expect(resultCard.closest("article")).toHaveTextContent(expected);
    expect(resultCard.closest("article")).toHaveTextContent(
      /league-wide floor was \$6\.00/i
    );
    if (allocation.winner) {
      expect(resultCard.closest("article")).toHaveTextContent(
        /Fallback Foxes was selected by the committed equal-chance draw/i
      );
    }
    expect(document.body).not.toHaveTextContent(fallbackWinnerTeamId);
  });

  it("fails closed when a terminal winner cannot be resolved to an authorized team name", async () => {
    const fetchImpl = baseFetch((parsed) => {
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) {
        return envelope(publishedOverview());
      }
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}/candidate-cards`)) {
        return collectionEnvelope([]);
      }
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}/results`)) {
        return collectionEnvelope([fallbackWinnerAllocationResult()]);
      }
      if (parsed.pathname.endsWith(`/leagues/${leagueId}/teams`)) {
        return envelope(teamsFound([leagueTeam(), leagueTeam(secondTeamId, "Second Team")]));
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    renderRoute({
      path: routePaths.freeAgentDraftResults(leagueId, fadId),
      route: "/leagues/:leagueId/free-agent-draft/:fadId/results",
      element: <FreeAgentDraftResultsPage />,
      fetchImpl,
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /winning team could not be resolved/i
    );
    expect(screen.queryByText("Fallback Winner")).toBeNull();
    expect(document.body).not.toHaveTextContent(fallbackWinnerTeamId);
  });

  it("withholds and remounts published result evidence across realtime reauthorization", async () => {
    const fetchImpl = baseFetch((parsed) => {
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}`)) {
        return envelope(publishedOverview());
      }
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}/candidate-cards`)) {
        return collectionEnvelope([]);
      }
      if (parsed.pathname.endsWith(`/free-agent-drafts/${fadId}/results`)) {
        return collectionEnvelope([pendingAllocationResult()]);
      }
      if (parsed.pathname.endsWith(`/leagues/${leagueId}/teams`)) {
        return envelope(teamsFound());
      }
      throw new Error(`Unexpected request: ${parsed.pathname}`);
    });
    function ReauthorizationHarness() {
      const [realtime, setRealtime] = React.useState({
        status: "connected",
        privacyEpoch: 0,
      });
      return (
        <>
          <button
            onClick={() => setRealtime({ status: "reauthorizing", privacyEpoch: 1 })}
          >
            Reauthorize results
          </button>
          <button
            onClick={() => setRealtime({ status: "connected", privacyEpoch: 1 })}
          >
            Finish results reauthorization
          </button>
          <RealtimeContext.Provider value={realtime}>
            <Routes>
              <Route
                path="/leagues/:leagueId/free-agent-draft/:fadId/results"
                element={<FreeAgentDraftResultsPage />}
              />
            </Routes>
          </RealtimeContext.Provider>
        </>
      );
    }
    const view = renderWithProviders(<ReauthorizationHarness />, {
      initialEntries: [routePaths.freeAgentDraftResults(leagueId, fadId)],
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    });

    expect(await screen.findByText("Pending Player")).toBeInTheDocument();
    await view.user.type(screen.getByLabelText("Search player name"), "private filter");
    await view.user.click(screen.getByRole("button", { name: "Reauthorize results" }));
    expect(screen.queryByText("Pending Player")).toBeNull();
    expect(screen.getByText(/Reauthorizing league-only Free Agent Draft results/i)).toBeInTheDocument();
    await view.user.click(
      screen.getByRole("button", { name: "Finish results reauthorization" })
    );
    expect(await screen.findByText("Pending Player")).toBeInTheDocument();
    expect(screen.getByLabelText("Search player name")).toHaveValue("");
  });
});
