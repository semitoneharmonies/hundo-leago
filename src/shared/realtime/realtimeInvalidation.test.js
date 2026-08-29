import { describe, expect, it, vi } from "vitest";

import {
  REALTIME_REASON_CODES,
  REALTIME_RELATED_ID_KEYS,
  RealtimeContractError,
  applyRealtimeInvalidation,
  isRealtimePrivacyBoundary,
  parseRealtimeEnvelope,
  realtimeInvalidationActions,
  reauthorizePrivateQueriesOnReconnect,
} from "./realtimeInvalidation.js";

const leagueId = "11111111-1111-4111-8111-111111111111";
const otherLeagueId = "22222222-2222-4222-8222-222222222222";
const eventId = "33333333-3333-4333-8333-333333333333";
const resourceId = "44444444-4444-4444-8444-444444444444";
const teamId = "55555555-5555-4555-8555-555555555555";
const otherTeamId = "66666666-6666-4666-8666-666666666666";
const fadId = "77777777-7777-4777-8777-777777777777";

function related(overrides = {}) {
  return Object.fromEntries(
    REALTIME_RELATED_ID_KEYS.map((key) => [
      key,
      Object.prototype.hasOwnProperty.call(overrides, key)
        ? overrides[key]
        : null,
    ])
  );
}

function envelope({
  type = "free_agent_draft.changed",
  reasonCode = "cards_opened",
  relatedIds = related({ fadId }),
  league = leagueId,
  extra,
} = {}) {
  return {
    eventId,
    type,
    leagueId: league,
    resourceId,
    version: 3,
    reasonCode,
    occurredAt: 1_786_432_100_000,
    related: relatedIds,
    ...extra,
  };
}

function parse(options) {
  const value = envelope(options);
  return parseRealtimeEnvelope(value.type, value);
}

function fakeQuery({
  queryKey = ["league", leagueId, "free-agent-draft", fadId],
  meta = { private: true, leagueId },
} = {}) {
  return { queryKey, meta };
}

describe("canonical realtime invalidation envelope", () => {
  it("accepts and freezes every approved event-family/reason pair", () => {
    for (const [type, reasons] of Object.entries(REALTIME_REASON_CODES)) {
      for (const reasonCode of reasons) {
        const value = envelope({ type, reasonCode });
        const parsed = parseRealtimeEnvelope(type, value);
        expect(parsed).toEqual(value);
        expect(Object.isFrozen(parsed)).toBe(true);
        expect(Object.isFrozen(parsed.related)).toBe(true);
      }
    }
  });

  it("requires exactly the eight approved nullable stable IDs", () => {
    expect(Object.keys(parse().related)).toEqual(REALTIME_RELATED_ID_KEYS);
    expect(() =>
      parse({ relatedIds: { ...related(), playerId: teamId } })
    ).toThrow(RealtimeContractError);
    const missing = related();
    delete missing.nominationQueueId;
    expect(() => parse({ relatedIds: missing })).toThrow(RealtimeContractError);
    expect(() =>
      parse({ relatedIds: related({ cardId: "not-an-id" }) })
    ).toThrow(RealtimeContractError);
  });

  it("rejects mismatched names, unapproved pairs, extra data, and invalid identity", () => {
    const value = envelope();
    expect(() => parseRealtimeEnvelope("auction.changed", value)).toThrow(
      RealtimeContractError
    );
    expect(() =>
      parse({ type: "free_agent_draft.changed", reasonCode: "help_changed" })
    ).toThrow(RealtimeContractError);
    const notificationTypeOnly = envelope({
      type: "notification.created",
      reasonCode: "cards_opened",
    });
    notificationTypeOnly.type = "fad_cards_opened";
    expect(() =>
      parseRealtimeEnvelope("fad_cards_opened", notificationTypeOnly)
    ).toThrow(RealtimeContractError);
    expect(() => parse({ extra: { playerId: teamId } })).toThrow(
      RealtimeContractError
    );
    expect(() =>
      parse({ extra: { eventId: "33333333-3333-1333-8333-333333333333" } })
    ).toThrow(RealtimeContractError);
    expect(() => parse({ extra: { version: 0 } })).toThrow(
      RealtimeContractError
    );
    expect(() => parse({ extra: { occurredAt: -1 } })).toThrow(
      RealtimeContractError
    );
  });

  it("marks only authority/publication/private-removal events as privacy boundaries", () => {
    expect(
      isRealtimePrivacyBoundary(
        parse({ type: "team.changed", reasonCode: "manager_assignment_changed" })
      )
    ).toBe(true);
    expect(
      isRealtimePrivacyBoundary(
        parse({
          type: "free_agent_draft.changed",
          reasonCode: "cards_published",
        })
      )
    ).toBe(true);
    expect(
      isRealtimePrivacyBoundary(
        parse({ type: "candidate_card.changed", reasonCode: "card_changed" })
      )
    ).toBe(false);
    expect(
      isRealtimePrivacyBoundary(
        parse({ type: "auction.changed", reasonCode: "auction_changed" })
      )
    ).toBe(false);
  });
});

describe("shared realtime mappings", () => {
  it("preserves ordinary transaction invalidation prefixes", () => {
    expect(
      realtimeInvalidationActions(
        parse({ type: "trade.changed", reasonCode: "trade_changed" })
      ).filter(({ operation }) => operation === "invalidate")
    ).toEqual([
      { operation: "invalidate", queryKey: ["league", leagueId, "activity"] },
      { operation: "invalidate", queryKey: ["notifications"] },
      { operation: "invalidate", queryKey: ["league", leagueId, "trades"] },
      { operation: "invalidate", queryKey: ["league", leagueId, "trade"] },
    ]);

    expect(
      realtimeInvalidationActions(
        parse({ type: "auction.changed", reasonCode: "auction_changed" })
      ).filter(({ operation }) => operation === "invalidate")
    ).toEqual([
      { operation: "invalidate", queryKey: ["league", leagueId, "activity"] },
      { operation: "invalidate", queryKey: ["notifications"] },
      { operation: "invalidate", queryKey: ["league", leagueId, "auctions"] },
      { operation: "invalidate", queryKey: ["league", leagueId, "auction"] },
    ]);
  });

  it("removes private league data first on membership loss", async () => {
    const calls = [];
    let removalPredicate;
    const queryClient = {
      cancelQueries: vi.fn((options) => {
        calls.push("cancel");
        removalPredicate = options.predicate;
      }),
      removeQueries: vi.fn(() => calls.push("remove")),
      invalidateQueries: vi.fn(() => calls.push("invalidate")),
    };
    await applyRealtimeInvalidation(
      queryClient,
      parse({ type: "league.changed", reasonCode: "membership_changed" })
    );

    expect(calls.slice(0, 2)).toEqual(["cancel", "remove"]);
    expect(calls.indexOf("remove")).toBeLessThan(calls.indexOf("invalidate"));
    expect(removalPredicate(fakeQuery())).toBe(true);
    expect(
      removalPredicate(
        fakeQuery({
          queryKey: ["league", otherLeagueId, "free-agent-draft", fadId],
          meta: { private: true, leagueId: otherLeagueId },
        })
      )
    ).toBe(false);
    expect(removalPredicate(fakeQuery({ meta: { private: false } }))).toBe(false);
  });

  it("narrows manager/help cleanup to the affected team authorization evidence", () => {
    for (const event of [
      parse({
        type: "team.changed",
        reasonCode: "manager_assignment_changed",
        relatedIds: related({ teamId }),
      }),
      parse({
        type: "candidate_card_help.changed",
        reasonCode: "help_changed",
        relatedIds: related({ fadId, teamId }),
      }),
    ]) {
      const action = realtimeInvalidationActions(event).find(
        ({ operation }) => operation === "remove"
      );
      const authorized = (candidateTeamId, authorizationScope) =>
        fakeQuery({
          meta: {
            private: true,
            leagueId,
            teamId: candidateTeamId,
            authorizationScope,
            authorizationEvidence: { kind: "team_manager_assignment", id: eventId },
          },
        });
      const affectedScope =
        event.type === "team.changed"
          ? "team_manager"
          : "help_grant_commissioner";
      const unaffectedScope =
        event.type === "team.changed"
          ? "help_grant_commissioner"
          : "team_manager";
      expect(action.predicate(authorized(teamId, affectedScope))).toBe(true);
      expect(action.predicate(authorized(otherTeamId, affectedScope))).toBe(false);
      expect(action.predicate(authorized(teamId, unaffectedScope))).toBe(false);
      expect(action.predicate(fakeQuery())).toBe(false);
    }
  });

  it("accepts only same-league feature actions and wraps feature predicates", async () => {
    const invalidated = [];
    const removed = [];
    const queryClient = {
      cancelQueries: vi.fn(),
      removeQueries: vi.fn((options) => removed.push(options)),
      invalidateQueries: vi.fn((options) => invalidated.push(options)),
    };
    const mapper = vi.fn(() => [
      {
        operation: "invalidate",
        queryKey: ["league", leagueId, "free-agent-draft", fadId],
      },
      {
        operation: "invalidate",
        queryKey: ["league", otherLeagueId, "free-agent-draft", fadId],
      },
      { operation: "invalidate", queryKey: ["notifications", "malicious"] },
      { operation: "remove", predicate: () => true },
    ]);
    const parsed = parse();
    await applyRealtimeInvalidation(queryClient, parsed, [mapper]);

    expect(mapper).toHaveBeenCalledWith(parsed);
    expect(invalidated).toContainEqual({
      queryKey: ["league", leagueId, "free-agent-draft", fadId],
    });
    expect(invalidated).not.toContainEqual({
      queryKey: ["league", otherLeagueId, "free-agent-draft", fadId],
    });
    expect(invalidated).not.toContainEqual({
      queryKey: ["notifications", "malicious"],
    });
    const featureRemoval = removed.at(-1).predicate;
    expect(featureRemoval(fakeQuery())).toBe(true);
    expect(
      featureRemoval(
        fakeQuery({
          queryKey: ["league", otherLeagueId, "free-agent-draft", fadId],
          meta: { private: true, leagueId: otherLeagueId },
        })
      )
    ).toBe(false);
  });

  it("fails closed when feature mappers throw or return malformed actions", async () => {
    const queryClient = {
      cancelQueries: vi.fn(),
      removeQueries: vi.fn(),
      invalidateQueries: vi.fn(),
    };
    await expect(
      applyRealtimeInvalidation(queryClient, parse(), [
        () => {
          throw new Error("mapper failed");
        },
        () => [{ operation: "invalidate", queryKey: "not-a-key" }],
      ])
    ).resolves.toBeDefined();
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["league", leagueId, "activity"],
    });
  });
});

describe("reconnect privacy cleanup", () => {
  it("cancels and removes every private query before session reauthorization", async () => {
    let predicate;
    let resolveCancellation;
    const cancellation = new Promise((resolve) => {
      resolveCancellation = resolve;
    });
    const calls = [];
    const queryClient = {
      cancelQueries: vi.fn((options) => {
        calls.push("cancel");
        predicate = options.predicate;
        return cancellation;
      }),
      removeQueries: vi.fn(() => calls.push("remove")),
    };

    const pending = reauthorizePrivateQueriesOnReconnect(queryClient);
    expect(calls).toEqual(["cancel", "remove"]);
    expect(predicate(fakeQuery())).toBe(true);
    expect(predicate(fakeQuery({ meta: { private: false, leagueId } }))).toBe(false);
    expect(
      predicate(
        fakeQuery({
          queryKey: ["notifications"],
          meta: { private: true },
        })
      )
    ).toBe(true);
    expect(
      predicate(
        fakeQuery({
          queryKey: ["league", otherLeagueId, "overview"],
          meta: { private: true, leagueId },
        })
      )
    ).toBe(true);
    resolveCancellation();
    await pending;
  });
});
