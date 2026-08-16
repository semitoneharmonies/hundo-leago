import { describe, expect, it } from "vitest";

import { ResponseContractError } from "../../shared/api/responseContracts.js";
import {
  validateCandidateCardHelp,
  validateCandidateCardMutation,
  validateCandidateCardRevisionPreview,
  validateCandidateCardSave,
  validateEligibleCandidatePlayers,
  validateFreeAgentDraftAllocationResults,
  validateFreeAgentDraftNavigation,
  validateFreeAgentDraftOverview,
  validateFreeAgentDraftPage,
  validateFreeAgentDraftReadiness,
  validateFreeAgentDraftReadinessRetry,
  validateFreeAgentDraftRecovery,
  validatePrivateCandidateCard,
  validatePublishedCandidateCard,
  validatePublishedCandidateCardSummaries,
} from "./freeAgentDraftContracts.js";

const id = (number) =>
  `${number.toString(16).padStart(8, "0")}-0000-4000-8000-000000000000`;
const IDS = Object.freeze({
  league: id(1),
  season: id(2),
  fad: id(3),
  team: id(4),
  card: id(5),
  assignment: id(6),
  operation: id(7),
  receipt: id(8),
  job: id(9),
  revision: id(10),
  help: id(11),
  user: id(12),
  snapshot: id(13),
  player: id(14),
  secondTeam: id(15),
  secondEntry: id(16),
  allocation: id(17),
  secondAllocation: id(18),
  recovery: id(19),
  restrictedAuction: id(20),
  fallbackAuction: id(21),
  contract: id(22),
  ownership: id(23),
});

function allowed() {
  return { allowed: true, reasonCode: null };
}

function denied(reasonCode = "PHASE_CLOSED") {
  return { allowed: false, reasonCode };
}

function team() {
  return {
    teamId: IDS.team,
    name: "Snow Owls",
    primaryColour: "#112233",
    secondaryColour: "#ffffff",
    tertiaryColour: null,
    patternTemplate: "mirrored-centre-band",
    logoReference: null,
  };
}

function player() {
  return { playerId: IDS.player, fullName: "Ada Player", positionGroup: "F" };
}

function recoveryOperation(overrides = {}) {
  return {
    operationId: IDS.operation,
    operationKind: "deadline",
    resourceId: IDS.fad,
    occurrenceKey: `fad:${IDS.fad}:deadline:400`,
    status: "pending",
    attemptCount: 0,
    scheduledForMs: 400,
    nextAttemptAtMs: null,
    leaseExpiresAtMs: null,
    startedAtMs: null,
    completedAtMs: null,
    lastErrorCode: null,
    recoveryId: null,
    blocksCompletion: true,
    version: 1,
    ...overrides,
  };
}

function recoveryRollovers({ completed = false } = {}) {
  return Array.from({ length: 7 }, (_, index) => ({
    rolloverId: id(100 + index),
    sequence: index + 1,
    opensAtMs: 500 + index * 100,
    creationCutoffAtMs: 550 + index * 100,
    rollsOverAtMs: 600 + index * 100,
    status: completed ? "completed" : "scheduled",
    processingStartedAtMs: completed ? 551 + index * 100 : null,
    completedAtMs: completed ? 601 + index * 100 : null,
    lastErrorCode: null,
    recoveryIds: [],
    blocksCompletion: !completed,
    version: 1,
  }));
}

function rolloverActions(rollovers) {
  return rollovers.map((rollover) => ({
    action: "finalize_rollover",
    resourceId: rollover.rolloverId,
    enabled: false,
    reasonCode: "RECOVERY_NOT_AVAILABLE",
  }));
}

function recoveryProjection(overrides = {}) {
  const rollovers = recoveryRollovers();
  return {
    fad: {
      leagueId: IDS.league,
      seasonId: IDS.season,
      fadId: IDS.fad,
      version: 1,
      status: "cards_open",
      phase: "cards_open",
      openedAtMs: 100,
      reminderAtMs: 200,
      helpOpensAtMs: 300,
      candidateDeadlineAtMs: 400,
      deadlineLockedAtMs: null,
      allocationCompletedAtMs: null,
      nextRolloverAtMs: null,
      frozenFadFirstMatchupStartsAtMs: 1_500,
      competitionFirstMatchupStartsAtMs: 1_500,
      scheduleRecoveryOperationId: null,
      completedAtMs: null,
      counts: {
        participatingTeams: 0,
        cardsLocked: 0,
        allocationsPending: 0,
        allocationsAutomatic: 0,
        restrictedPending: 0,
        restrictedFallbackPending: 0,
        rapidAuctionsOpen: 0,
        queuedNominations: 0,
        rolloversPersisted: 7,
        rolloversCompleted: 0,
        recoveriesOpen: 0,
      },
    },
    deadlineOperation: recoveryOperation(),
    allocationOperations: [],
    rapidOperations: [],
    completionOperation: null,
    rollovers,
    recoveries: [],
    availableActions: [
      {
        action: "retry_deadline",
        resourceId: null,
        enabled: false,
        reasonCode: "RECOVERY_NOT_AVAILABLE",
      },
      ...rolloverActions(rollovers),
    ],
    ...overrides,
  };
}

function safeTeamFor(teamId, name) {
  return { ...team(), teamId, name };
}

function rankedOfferFor({
  snapshotEntryId = IDS.snapshot,
  teamId = IDS.team,
  name = "Snow Owls",
} = {}) {
  return {
    snapshotEntryId,
    teamId,
    team: safeTeamFor(teamId, name),
    slotKey: "F01",
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

function fallbackNoWinnerResult() {
  return {
    allocationId: IDS.allocation,
    allocationVersion: 7,
    player: player(),
    status: "fallback_open_resolved",
    decisionCode: "fallback_open_no_winner",
    rankedOffers: [
      rankedOfferFor(),
      rankedOfferFor({
        snapshotEntryId: IDS.secondEntry,
        teamId: IDS.secondTeam,
        name: "Second Team",
      }),
    ],
    winner: null,
    restricted: {
      auctionId: IDS.restrictedAuction,
      status: "no_winner",
      participantTeamIds: [IDS.team, IDS.secondTeam],
      minimumTotalValueCents: 600,
      minimumTermYears: 2,
      minimumAavCents: 300,
    },
    fallback: {
      auctionId: IDS.fallbackAuction,
      status: "no_winner",
      minimumTotalValueCents: 600,
      winningBidId: null,
      contractId: null,
      ownershipId: null,
      noWinnerReason: "no_winner",
    },
    draws: [
      noSelectionDraw(IDS.restrictedAuction, "fad_restricted"),
      noSelectionDraw(IDS.fallbackAuction, "fad_open_rapid"),
    ],
    recoveryStatus: "resolved",
    resolvedAtMs: 2_000,
  };
}

function slotKeys() {
  return [
    ...Array.from({ length: 12 }, (_, index) => `F${String(index + 1).padStart(2, "0")}`),
    ...Array.from({ length: 6 }, (_, index) => `D${String(index + 1).padStart(2, "0")}`),
    ...Array.from({ length: 4 }, (_, index) => `B${String(index + 1).padStart(2, "0")}`),
  ];
}

function slot(slotKey, { preview = false } = {}) {
  const capability = preview ? denied("PREVIEW_ONLY") : allowed();
  return {
    slotKey,
    slotGroup: slotKey[0],
    required: slotKey[0] !== "B",
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
      addCandidate: capability,
      editCandidate: capability,
      moveCandidate: capability,
      moveCarryover: capability,
      removeCandidate: capability,
    },
  };
}

function privateCard({ preview = false } = {}) {
  const capability = preview ? denied("PREVIEW_ONLY") : allowed();
  return {
    leagueId: IDS.league,
    seasonId: IDS.season,
    fadId: IDS.fad,
    teamId: IDS.team,
    cardId: IDS.card,
    cardVersion: preview ? 2 : 1,
    phase: "cards_open",
    visibilityMode: preview ? "private_read_only" : "private_editable",
    accessReason: "team_manager",
    authorizationEvidence: { kind: "manager_assignment", id: IDS.assignment },
    lifecycleStatus: "open",
    completeness: {
      code: "incomplete",
      filledMandatoryCount: 0,
      missingMandatoryCount: 18,
      filledBenchCount: 0,
      emptyBenchCount: 4,
      blockingValidationCount: 0,
      structuralConflictCount: 0,
      carriedRosterStructuralConflictCount: 0,
    },
    capProjection: {
      capLimitCents: 10_000,
      carriedActivePlayerAmountCents: 0,
      retentionObligationCents: 0,
      buyoutPenaltyCents: 0,
      carriedCapUsageCents: 0,
      proposedCandidateAavCents: 0,
      maximumPossibleCapCents: 0,
      maximumCapSpaceCents: 10_000,
    },
    capStatus: "compliant",
    allocationEligibility: "eligible",
    allocationExclusionReason: null,
    slots: slotKeys().map((key) => slot(key, { preview })),
    conflicts: [],
    helpContext: null,
    commissionerInterventions: [],
    capabilities: {
      editCard: capability,
      requestHelp: capability,
      viewPublishedHistory: preview ? denied("PREVIEW_ONLY") : denied(),
    },
  };
}

function publishedCard() {
  const card = privateCard({ preview: true });
  card.cardVersion = 7;
  card.phase = "rapid";
  card.visibilityMode = "published_history";
  card.accessReason = "published_league_history";
  card.authorizationEvidence = null;
  card.lifecycleStatus = "locked_incomplete";
  card.capabilities = {
    editCard: denied(),
    requestHelp: denied(),
    viewPublishedHistory: allowed(),
  };
  card.slots = card.slots.map((item) => ({
    ...item,
    capabilities: {
      addCandidate: denied(),
      editCandidate: denied(),
      moveCandidate: denied(),
      moveCarryover: denied(),
      removeCandidate: denied(),
    },
  }));
  return card;
}

function descriptor() {
  return {
    mode: "private_card",
    seasonId: IDS.season,
    fadId: IDS.fad,
    teamId: IDS.team,
    cardId: IDS.card,
    authorizationEvidence: { kind: "manager_assignment", id: IDS.assignment },
  };
}

describe("FAD frontend response contracts", () => {
  it("accepts canonical long collection cursors and rejects malformed, oversized, or inconsistent pages", () => {
    expect(
      validateFreeAgentDraftPage({
        nextCursor: "a".repeat(256),
        hasMore: true,
      })
    ).toBe(true);
    expect(
      validateFreeAgentDraftPage({ nextCursor: null, hasMore: false })
    ).toBe(true);

    for (const page of [
      { nextCursor: "a".repeat(1_025), hasMore: true },
      { nextCursor: "abc=", hasMore: true },
      { nextCursor: "abc+d", hasMore: true },
      { nextCursor: "abcde", hasMore: true },
      { nextCursor: "cursor", hasMore: false },
      { nextCursor: null, hasMore: true },
      { nextCursor: null, hasMore: false, extra: true },
    ]) {
      expect(() => validateFreeAgentDraftPage(page)).toThrow(
        ResponseContractError
      );
    }
  });

  it("accepts exact navigation, readiness, retry, and overview projections", () => {
    const managed = {
      teamId: IDS.team,
      team: team(),
      cardId: IDS.card,
      managerAssignmentId: IDS.assignment,
      cardVersion: 1,
      lifecycleStatus: "open",
      completenessCode: "incomplete",
      missingMandatoryCount: 18,
      conflictCount: 0,
      capStatus: "compliant",
      allocationEligibility: "eligible",
      helpRequestStatus: "not_requested",
    };
    const navigation = {
      serverNowMs: 1_780_000_000_000,
      timeZone: "America/Vancouver",
      fadId: IDS.fad,
      seasonId: IDS.season,
      phase: "cards_open",
      showMainNavigation: true,
      candidateDeadlineAtMs: 1_780_600_000_000,
      nextRolloverAtMs: null,
      frozenFadFirstMatchupStartsAtMs: 1_781_204_800_000,
      competitionFirstMatchupStartsAtMs: 1_781_204_800_000,
      managedCards: [{ ...managed, urgencyCode: "CARD_INCOMPLETE" }],
      rosterLinks: [descriptor()],
      urgencyCode: "CARD_INCOMPLETE",
    };
    const readiness = {
      leagueId: IDS.league,
      seasonId: IDS.season,
      operationId: null,
      operationVersion: null,
      status: "not_triggered",
      triggerKind: null,
      entryDraftId: null,
      exemptionId: null,
      serverNowMs: navigation.serverNowMs,
      timeZone: "America/Vancouver",
      observedSeasonVersion: null,
      firstMatchupWeekBefore: null,
      firstMatchupWeekAfter: null,
      candidateDeadlineAtMs: null,
      reminderAtMs: null,
      helpOpensAtMs: null,
      initialRollovers: [],
      priorSeasonRollover: null,
      participatingTeamCount: 0,
      teamProjections: [],
      blockers: [],
      warnings: [],
      resultFadId: null,
      retryReadiness: denied("RECOVERY_NOT_AVAILABLE"),
    };
    const retry = {
      retryReceiptId: IDS.receipt,
      leagueId: IDS.league,
      seasonId: IDS.season,
      readinessOperationId: IDS.operation,
      acceptedFromVersion: 2,
      resultingReadinessVersion: 3,
      retryAttemptNumber: 2,
      jobRunId: IDS.job,
      occurrenceKey: "fad-readiness:canonical",
      acceptedAtMs: navigation.serverNowMs,
      status: "accepted",
    };
    const overview = {
      leagueId: IDS.league,
      seasonId: IDS.season,
      fadId: IDS.fad,
      version: 1,
      status: "cards_open",
      phase: "cards_open",
      serverNowMs: navigation.serverNowMs,
      timeZone: "America/Vancouver",
      openedAtMs: 1_779_000_000_000,
      reminderAtMs: 1_780_300_000_000,
      helpOpensAtMs: 1_780_400_000_000,
      candidateDeadlineAtMs: navigation.candidateDeadlineAtMs,
      deadlineLockedAtMs: null,
      allocationCompletedAtMs: null,
      nextRolloverAtMs: null,
      frozenFadFirstMatchupStartsAtMs: navigation.frozenFadFirstMatchupStartsAtMs,
      competitionFirstMatchupStartsAtMs: navigation.competitionFirstMatchupStartsAtMs,
      scheduleRecoveryOperationId: null,
      completedAtMs: null,
      counts: {
        participatingTeams: 1,
        cardsLocked: null,
        allocationsPending: null,
        allocationsAutomatic: null,
        restrictedPending: null,
        restrictedFallbackPending: null,
        rapidAuctionsOpen: null,
        rolloversPersisted: null,
        rolloversCompleted: null,
        recoveriesOpen: null,
      },
      viewer: {
        managedCards: [{ ...managed, cardDescriptor: descriptor() }],
        commissionerCards: [],
        queuedNominations: [],
      },
      presentation: null,
      capabilities: {
        viewPublishedCards: denied(),
        viewRecovery: denied("NOT_AUTHORIZED"),
        completeRecoveryAction: denied("NOT_AUTHORIZED"),
      },
    };

    expect(validateFreeAgentDraftNavigation(navigation)).toBe(true);
    expect(validateFreeAgentDraftReadiness(readiness)).toBe(true);
    expect(validateFreeAgentDraftReadinessRetry(retry)).toBe(true);
    expect(validateFreeAgentDraftOverview(overview)).toBe(true);
  });

  it("accepts exact private, preview, mutation, help, eligible, and published projections", () => {
    const card = privateCard();
    const deterministicCarryoverEntryId =
      "12345678-1234-5234-8234-123456789abc";
    card.slots[0] = {
      ...card.slots[0],
      occupantKind: "carryover",
      entryId: deterministicCarryoverEntryId,
      entryVersion: 1,
      player: player(),
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
        moveCarryover: allowed(),
        removeCandidate: denied("SLOT_LOCKED"),
      },
    };
    card.completeness = {
      ...card.completeness,
      filledMandatoryCount: 1,
      missingMandatoryCount: 17,
    };
    card.capProjection = {
      ...card.capProjection,
      carriedActivePlayerAmountCents: 400,
      carriedCapUsageCents: 400,
      maximumPossibleCapCents: 400,
      maximumCapSpaceCents: 9_600,
    };
    const previewCard = privateCard({ preview: true });
    const history = publishedCard();
    const summary = {
      leagueId: IDS.league,
      seasonId: IDS.season,
      fadId: IDS.fad,
      teamId: IDS.team,
      team: team(),
      snapshotId: IDS.snapshot,
      lockedCardVersion: 7,
      lifecycleStatus: "locked_incomplete",
      completeness: history.completeness,
      capStatus: "compliant",
      allocationEligibility: "eligible",
      allocationExclusionReason: null,
      maximumPossibleCapCents: 0,
      carriedCapUsageCents: 0,
      counts: { carryovers: 0, candidates: 0, emptyMandatory: 18, emptyBench: 4, conflicts: 0 },
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
        seasonId: IDS.season,
        fadId: IDS.fad,
        teamId: IDS.team,
        cardId: IDS.card,
      },
    };
    const eligible = [{
      player: player(),
      effectivePositionGroup: "F",
      activeState: "active",
      benchEligible: true,
      eligibilityCode: "eligible",
      contractLimits: {
        allowedTermsYears: [1, 2, 3],
        minimumTotalValueCentsByTerm: { "1": 100, "2": 200, "3": 300 },
        maximumBenchAavCents: null,
      },
    }];
    const help = {
      helpRequestId: IDS.help,
      leagueId: IDS.league,
      seasonId: IDS.season,
      fadId: IDS.fad,
      cardId: IDS.card,
      teamId: IDS.team,
      status: "active",
      message: null,
      requestedByUserId: IDS.user,
      requestedByDisplayName: "Ada Manager",
      requestedAtMs: 100,
      expiresAtMs: 200,
      version: 1,
    };

    expect(validatePrivateCandidateCard(card)).toBe(true);
    expect(validatePublishedCandidateCard(history)).toBe(true);
    expect(validatePublishedCandidateCardSummaries([summary])).toBe(true);
    expect(validateEligibleCandidatePlayers(eligible)).toBe(true);
    expect(validateCandidateCardRevisionPreview({
      baseCardVersion: 1,
      action: { type: "remove", entryId: IDS.player },
      projectedCard: previewCard,
      projectedSlot: null,
      warnings: [],
    })).toBe(true);
    expect(validateCandidateCardMutation({
      card,
      revisionId: IDS.revision,
      changedEntryId: null,
    })).toBe(true);
    expect(validateCandidateCardSave({
      card,
      revisionId: IDS.revision,
      changedEntryIds: [IDS.secondEntry],
    })).toBe(true);
    expect(validateCandidateCardHelp(help)).toBe(true);
  });

  it("accepts a private player-only row and requires its incomplete validation evidence", () => {
    const card = privateCard();
    card.slots[0] = {
      ...card.slots[0],
      occupantKind: "candidate",
      entryId: IDS.secondEntry,
      entryVersion: 1,
      player: player(),
      totalValueCents: null,
      termYears: null,
      aavCents: null,
      validation: {
        status: "invalid",
        codes: ["CANDIDATE_CONTRACT_INCOMPLETE"],
      },
      lastEditedAtMs: 100,
      lastEditedBy: {
        userId: IDS.user,
        displayName: "Ada Manager",
        authority: "manager",
      },
    };
    expect(validatePrivateCandidateCard(card)).toBe(true);

    const missingEvidence = structuredClone(card);
    missingEvidence.slots[0].validation = { status: "invalid", codes: [] };
    expect(() => validatePrivateCandidateCard(missingEvidence)).toThrow(
      /incomplete contract validation/u
    );
  });

  it("accepts a preserved legacy total-first Candidate Card row", () => {
    const card = privateCard();
    card.slots[0] = {
      ...card.slots[0],
      occupantKind: "candidate",
      entryId: IDS.secondEntry,
      entryVersion: 1,
      player: player(),
      totalValueCents: 4_000,
      termYears: 3,
      aavCents: 1_333,
      validation: { status: "valid", codes: [] },
      lastEditedAtMs: 100,
      lastEditedBy: {
        userId: IDS.user,
        displayName: "Ada Manager",
        authority: "manager",
      },
    };

    expect(validatePrivateCandidateCard(card)).toBe(true);

    const inconsistent = structuredClone(card);
    inconsistent.slots[0].aavCents = 1_334;
    expect(() => validatePrivateCandidateCard(inconsistent)).toThrow(
      /contract values are inconsistent/u
    );
  });

  it("rejects an incomplete marker on complete private, save, and published rows", () => {
    function contradictoryCompleteSlot(baseSlot, { published = false } = {}) {
      return {
        ...baseSlot,
        occupantKind: "candidate",
        entryId: IDS.secondEntry,
        entryVersion: 1,
        player: player(),
        totalValueCents: 300,
        termYears: 3,
        aavCents: 100,
        validation: {
          status: "invalid",
          codes: ["CANDIDATE_CONTRACT_INCOMPLETE"],
        },
        outcome: published
          ? {
              code: "invalid_offer",
              allocationId: null,
              auctionId: null,
            }
          : null,
        lastEditedAtMs: 100,
        lastEditedBy: {
          userId: IDS.user,
          displayName: "Ada Manager",
          authority: "manager",
        },
      };
    }

    const privateProjection = privateCard();
    privateProjection.slots[0] = contradictoryCompleteSlot(
      privateProjection.slots[0]
    );
    expect(() => validatePrivateCandidateCard(privateProjection)).toThrow(
      /complete contract validation is inconsistent/u
    );
    expect(() =>
      validateCandidateCardSave({
        card: privateProjection,
        revisionId: IDS.revision,
        changedEntryIds: [IDS.secondEntry],
      })
    ).toThrow(/complete contract validation is inconsistent/u);

    const publishedProjection = publishedCard();
    publishedProjection.slots[0] = contradictoryCompleteSlot(
      publishedProjection.slots[0],
      { published: true }
    );
    expect(() => validatePublishedCandidateCard(publishedProjection)).toThrow(
      /complete contract validation is inconsistent/u
    );
  });

  it("rejects extra fields, evidence mismatches, private history, and incomplete slot sets", () => {
    const extra = privateCard();
    extra.privateBid = 900;
    expect(() => validatePrivateCandidateCard(extra)).toThrow(ResponseContractError);

    const mismatch = privateCard();
    mismatch.accessReason = "help_grant_commissioner";
    expect(() => validatePrivateCandidateCard(mismatch)).toThrow(
      "authorization evidence is inconsistent"
    );

    expect(() => validatePublishedCandidateCard(privateCard())).toThrow(
      "visibilityMode"
    );

    const missingSlot = privateCard();
    missingSlot.slots.pop();
    expect(() => validatePrivateCandidateCard(missingSlot)).toThrow("slots");
  });

  it("accepts the authoritative fallback no-winner result and rejects invented T-140 cross-field evidence", () => {
    const noWinner = fallbackNoWinnerResult();
    expect(validateFreeAgentDraftAllocationResults([noWinner])).toBe(true);

    const badAav = structuredClone(noWinner);
    badAav.rankedOffers[0].aavCents = 301;
    expect(() => validateFreeAgentDraftAllocationResults([badAav])).toThrow(
      ResponseContractError
    );

    const duplicateTeam = structuredClone(noWinner);
    duplicateTeam.rankedOffers[1].teamId = IDS.team;
    duplicateTeam.rankedOffers[1].team = team();
    expect(() => validateFreeAgentDraftAllocationResults([duplicateTeam])).toThrow(
      /duplicate evidence/u
    );

    const inventedWinner = structuredClone(noWinner);
    inventedWinner.winner = {
      teamId: IDS.team,
      snapshotEntryId: IDS.snapshot,
      contractId: IDS.contract,
      ownershipId: IDS.ownership,
      slotKey: "F01",
      totalValueCents: 600,
      termYears: 2,
      aavCents: 300,
    };
    expect(() => validateFreeAgentDraftAllocationResults([inventedWinner])).toThrow(
      /winner/u
    );

    const duplicateDraw = structuredClone(noWinner);
    duplicateDraw.draws[1].auctionId = IDS.restrictedAuction;
    expect(() => validateFreeAgentDraftAllocationResults([duplicateDraw])).toThrow(
      /duplicate auction evidence/u
    );
  });

  it("mirrors the T-141 operation, recovery, action, rollover, count, and schedule bindings", () => {
    const baseline = recoveryProjection();
    expect(validateFreeAgentDraftRecovery(baseline)).toBe(true);

    const badOperationState = structuredClone(baseline);
    badOperationState.deadlineOperation.completedAtMs = 450;
    expect(() => validateFreeAgentDraftRecovery(badOperationState)).toThrow(
      /state is inconsistent/u
    );

    const badSingleton = structuredClone(baseline);
    badSingleton.deadlineOperation.resourceId = IDS.allocation;
    expect(() => validateFreeAgentDraftRecovery(badSingleton)).toThrow(
      /singleton operation partitions/u
    );

    const badRollover = structuredClone(baseline);
    badRollover.rollovers[0].blocksCompletion = false;
    expect(() => validateFreeAgentDraftRecovery(badRollover)).toThrow(
      /state is inconsistent/u
    );

    const badActionState = structuredClone(baseline);
    badActionState.availableActions[0].enabled = true;
    badActionState.availableActions[0].reasonCode = null;
    expect(() => validateFreeAgentDraftRecovery(badActionState)).toThrow(
      /available-action state/u
    );

    const failed = recoveryProjection();
    failed.deadlineOperation = recoveryOperation({
      status: "failed",
      startedAtMs: 410,
      completedAtMs: 420,
      lastErrorCode: "FAD_DEADLINE_FAILED",
      recoveryId: IDS.recovery,
    });
    failed.recoveries = [
      {
        recoveryId: IDS.recovery,
        kind: "deadline_retry",
        status: "ready",
        playerId: null,
        allocationId: null,
        rolloverId: null,
        auctionId: null,
        jobRunId: IDS.operation,
        nominationQueueId: null,
        earliestActivationAtMs: null,
        targetResolutionAtMs: null,
        lastErrorCode: "FAD_DEADLINE_FAILED",
        commissionerReason: null,
        createdByOperationId: IDS.operation,
        resolvedByUserId: null,
        resolvedByMembershipId: null,
        resolvedAuthority: null,
        createdAtMs: 420,
        updatedAtMs: 421,
        resolvedAtMs: null,
        version: 1,
      },
    ];
    failed.fad.counts.recoveriesOpen = 1;
    failed.availableActions[0] = {
      action: "retry_deadline",
      resourceId: null,
      enabled: true,
      reasonCode: null,
    };
    expect(validateFreeAgentDraftRecovery(failed)).toBe(true);

    const badRecoveryBinding = structuredClone(failed);
    badRecoveryBinding.recoveries[0].createdByOperationId = IDS.job;
    expect(() => validateFreeAgentDraftRecovery(badRecoveryBinding)).toThrow(
      /operation bindings/u
    );

    const completedRollovers = recoveryRollovers({ completed: true });
    const completedAtMs = 2_000;
    const withSchedule = recoveryProjection({
      fad: {
        ...baseline.fad,
        status: "completed",
        phase: "completed",
        competitionFirstMatchupStartsAtMs: 1_700,
        scheduleRecoveryOperationId: IDS.operation,
        completedAtMs,
        counts: {
          ...baseline.fad.counts,
          rolloversCompleted: 7,
        },
      },
      deadlineOperation: null,
      rollovers: completedRollovers,
      availableActions: rolloverActions(completedRollovers),
      scheduleRecoveryEvidence: {
        operationId: IDS.operation,
        status: "succeeded",
        oldWeek1StartsAtMs: 1_500,
        newWeek1StartsAtMs: 1_700,
        oldScheduleVersion: 3,
        newScheduleVersion: 4,
        removedWeekIds: [id(300)],
        removedMatchupIds: [id(301)],
        replacedJobs: [
          {
            oldJobId: id(302),
            oldOccurrenceKey: "matchup:old",
            newJobId: id(303),
            newOccurrenceKey: "matchup:new",
          },
        ],
        completedAtMs,
        version: 1,
      },
    });
    expect(validateFreeAgentDraftRecovery(withSchedule)).toBe(true);

    const unboundSchedule = structuredClone(withSchedule);
    unboundSchedule.scheduleRecoveryEvidence.completedAtMs += 1;
    expect(() => validateFreeAgentDraftRecovery(unboundSchedule)).toThrow(
      /not bound to the FAD/u
    );
  });
});
