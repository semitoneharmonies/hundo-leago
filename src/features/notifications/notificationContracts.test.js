import { describe, expect, it } from "vitest";

import {
  FREE_AGENT_DRAFT_NOTIFICATION_LIST_COPY,
  FREE_AGENT_DRAFT_NOTIFICATION_TYPES,
  getFreeAgentDraftNotificationListCopy,
  validateFreeAgentDraftNotificationMessageData,
  validateNotifications,
} from "./notificationContracts.js";

const ids = Object.freeze({
  notificationId: "11111111-1111-4111-8111-111111111111",
  leagueId: "22222222-2222-4222-8222-222222222222",
  seasonId: "33333333-3333-4333-8333-333333333333",
  fadId: "44444444-4444-4444-8444-444444444444",
  teamId: "55555555-5555-4555-8555-555555555555",
  cardId: "66666666-6666-4666-8666-666666666666",
  readinessOperationId: "77777777-7777-4777-8777-777777777777",
  helpRequestId: "88888888-8888-4888-8888-888888888888",
  requestingUserId: "99999999-9999-4999-8999-999999999999",
  allocationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  auctionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  playerId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  recoveryId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  scheduleRecoveryOperationId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  exemptionId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
});

function destination(kind) {
  if (kind === "private_card") {
    return {
      kind,
      leagueId: ids.leagueId,
      fadId: ids.fadId,
      teamId: ids.teamId,
      cardId: ids.cardId,
    };
  }
  if (kind === "commissioner_fad") {
    return { kind, leagueId: ids.leagueId, seasonId: ids.seasonId };
  }
  if (kind === "fad_results" || kind === "fad_overview") {
    return { kind, leagueId: ids.leagueId, fadId: ids.fadId };
  }
  if (kind === "auction") {
    return { kind, leagueId: ids.leagueId, auctionId: ids.auctionId };
  }
  return {
    kind,
    leagueId: ids.leagueId,
    fadId: ids.fadId,
    recoveryId: ids.recoveryId,
  };
}

const common = Object.freeze({
  leagueId: ids.leagueId,
  seasonId: ids.seasonId,
});

function samples() {
  return {
    fad_cards_opened: {
      ...common,
      fadId: ids.fadId,
      teamId: ids.teamId,
      cardId: ids.cardId,
      candidateDeadlineAtMs: 1_800_000_000_000,
      destination: destination("private_card"),
    },
    fad_readiness_blocked: {
      ...common,
      readinessOperationId: ids.readinessOperationId,
      errorCodes: ["ENTRY_DRAFT_INCOMPLETE", "ROSTER_CONFLICT"],
      destination: destination("commissioner_fad"),
    },
    fad_deadline_approaching: {
      ...common,
      fadId: ids.fadId,
      teamId: ids.teamId,
      cardId: ids.cardId,
      candidateDeadlineAtMs: 1_800_000_000_000,
      completenessCode: "incomplete",
      missingMandatoryCount: 2,
      destination: destination("private_card"),
    },
    fad_help_requested: {
      ...common,
      fadId: ids.fadId,
      teamId: ids.teamId,
      cardId: ids.cardId,
      helpRequestId: ids.helpRequestId,
      requestingUserId: ids.requestingUserId,
      requestingDisplayName: "Current Manager",
      destination: destination("private_card"),
    },
    fad_cards_locked: {
      ...common,
      fadId: ids.fadId,
      destination: destination("fad_results"),
    },
    fad_automatic_result: {
      ...common,
      fadId: ids.fadId,
      teamId: ids.teamId,
      automaticWins: 5,
      losses: 6,
      restrictedPending: 2,
      invalidOffers: 1,
      destination: destination("fad_results"),
    },
    fad_restricted_eligible: {
      ...common,
      fadId: ids.fadId,
      teamId: ids.teamId,
      allocationId: ids.allocationId,
      auctionId: ids.auctionId,
      playerId: ids.playerId,
      destination: destination("auction"),
    },
    fad_restricted_fallback_opened: {
      ...common,
      fadId: ids.fadId,
      teamId: ids.teamId,
      allocationId: ids.allocationId,
      auctionId: ids.auctionId,
      playerId: ids.playerId,
      resolvesAtMs: 1_800_000_100_000,
      destination: destination("auction"),
    },
    fad_rapid_auction_result: {
      ...common,
      fadId: ids.fadId,
      teamId: ids.teamId,
      allocationId: null,
      auctionId: ids.auctionId,
      playerId: ids.playerId,
      outcomeCode: "no_winner",
      destination: destination("auction"),
    },
    fad_correction_required: {
      ...common,
      fadId: ids.fadId,
      allocationId: ids.allocationId,
      auctionId: null,
      recoveryId: ids.recoveryId,
      playerId: ids.playerId,
      errorCode: "OWNERSHIP_CHANGED",
      destination: destination("fad_recovery"),
    },
    fad_week1_recovered: {
      ...common,
      fadId: ids.fadId,
      scheduleRecoveryOperationId: ids.scheduleRecoveryOperationId,
      competitionFirstMatchupStartsAtMs: 1_800_000_200_000,
      destination: destination("fad_overview"),
    },
    fad_completed: {
      ...common,
      fadId: ids.fadId,
      completedAtMs: 1_800_000_300_000,
      destination: destination("fad_overview"),
    },
    fad_setup_exemption_authorized: {
      ...common,
      exemptionId: ids.exemptionId,
      destination: destination("commissioner_fad"),
    },
  };
}

function notification(type, messageData) {
  return {
    id: ids.notificationId,
    leagueId: ids.leagueId,
    type,
    messageData,
    createdAtMs: 1,
    readAtMs: null,
  };
}

function page(type, messageData) {
  return {
    code: "NOTIFICATIONS_FOUND",
    notifications: [notification(type, messageData)],
    page: { nextCursor: null },
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

describe("FAD notification response contracts", () => {
  it("accepts all 13 exact backend message and destination projections", () => {
    const values = samples();
    expect(Object.keys(values)).toEqual(FREE_AGENT_DRAFT_NOTIFICATION_TYPES);
    for (const type of FREE_AGENT_DRAFT_NOTIFICATION_TYPES) {
      expect(
        validateFreeAgentDraftNotificationMessageData(type, values[type])
      ).toBe(true);
      expect(validateNotifications(page(type, values[type]))).toBe(true);
    }
  });

  it("uses only the approved exact list copy table", () => {
    expect(FREE_AGENT_DRAFT_NOTIFICATION_LIST_COPY).toEqual({
      fad_cards_opened: "Your Candidate Card is ready.",
      fad_readiness_blocked:
        "Free Agent Draft readiness requires commissioner attention.",
      fad_deadline_approaching:
        "Your Candidate Card deadline is approaching.",
      fad_help_requested: "A manager has requested Candidate Card help.",
      fad_cards_locked:
        "Candidate Cards are locked and results are available.",
      fad_automatic_result: "Your Candidate Card results are available.",
      fad_restricted_eligible:
        "You are eligible to bid in a restricted FAD auction.",
      fad_restricted_fallback_opened:
        "A league-wide Free Agent Draft fallback auction is open.",
      fad_rapid_auction_result: "A Free Agent Draft auction has finished.",
      fad_correction_required:
        "Free Agent Draft recovery requires commissioner attention.",
      fad_week1_recovered:
        "Week 1 moved to complete the Free Agent Draft fairly.",
      fad_completed: "The Free Agent Draft is complete.",
      fad_setup_exemption_authorized:
        "Initial Season 2 Free Agent Draft exemption authorized.",
    });
    for (const type of FREE_AGENT_DRAFT_NOTIFICATION_TYPES) {
      expect(getFreeAgentDraftNotificationListCopy(type)).toBe(
        FREE_AGENT_DRAFT_NOTIFICATION_LIST_COPY[type]
      );
    }
  });

  it("rejects extra message, private, and destination fields for every FAD type", () => {
    for (const [type, exact] of Object.entries(samples())) {
      const extraMessage = clone(exact);
      extraMessage.privateOffer = { playerId: ids.playerId };
      expect(() => validateNotifications(page(type, extraMessage))).toThrow();

      const extraDestination = clone(exact);
      extraDestination.destination.path = "/private/card";
      expect(() =>
        validateNotifications(page(type, extraDestination))
      ).toThrow();
    }

    const symbolField = samples().fad_cards_opened;
    symbolField[Symbol("private-offer")] = ids.playerId;
    expect(() =>
      validateFreeAgentDraftNotificationMessageData(
        "fad_cards_opened",
        symbolField
      )
    ).toThrow();

    const accessorField = samples().fad_cards_opened;
    Object.defineProperty(accessorField, "leagueId", {
      enumerable: true,
      get: () => ids.leagueId,
    });
    expect(() =>
      validateFreeAgentDraftNotificationMessageData(
        "fad_cards_opened",
        accessorField
      )
    ).toThrow();
  });

  it("rejects cross-identity destinations and unknown FAD notification types", () => {
    const crossIdentity = clone(samples().fad_cards_opened);
    crossIdentity.destination.teamId = ids.playerId;
    expect(() =>
      validateNotifications(page("fad_cards_opened", crossIdentity))
    ).toThrow();
    expect(() =>
      validateNotifications(page("fad_unapproved_private_notice", {}))
    ).toThrow();
  });

  it("enforces bounded card, result, code, outcome, and correction rules", () => {
    const values = samples();

    values.fad_deadline_approaching.completenessCode = "complete";
    values.fad_deadline_approaching.missingMandatoryCount = 1;
    expect(() =>
      validateNotifications(
        page("fad_deadline_approaching", values.fad_deadline_approaching)
      )
    ).toThrow();

    values.fad_automatic_result.automaticWins = 22;
    values.fad_automatic_result.losses = 1;
    expect(() =>
      validateNotifications(
        page("fad_automatic_result", values.fad_automatic_result)
      )
    ).toThrow();

    values.fad_rapid_auction_result.outcomeCode = "second_place";
    expect(() =>
      validateNotifications(
        page("fad_rapid_auction_result", values.fad_rapid_auction_result)
      )
    ).toThrow();

    values.fad_correction_required.allocationId = null;
    values.fad_correction_required.auctionId = null;
    expect(() =>
      validateNotifications(
        page("fad_correction_required", values.fad_correction_required)
      )
    ).toThrow();

    values.fad_help_requested.requestingDisplayName = "/api/private/card";
    expect(() =>
      validateNotifications(page("fad_help_requested", values.fad_help_requested))
    ).toThrow();
  });
});
