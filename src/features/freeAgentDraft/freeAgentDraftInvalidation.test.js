import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";

import {
  REALTIME_RELATED_ID_KEYS,
  applyRealtimeInvalidation,
  parseRealtimeEnvelope,
} from "../../shared/realtime/realtimeInvalidation.js";
import { freeAgentDraftInvalidationActions } from "./freeAgentDraftInvalidation.js";
import { freeAgentDraftKeys } from "./freeAgentDraftQueries.js";

const leagueId = "11111111-1111-4111-8111-111111111111";
const otherLeagueId = "22222222-2222-4222-8222-222222222222";
const eventId = "33333333-3333-4333-8333-333333333333";
const resourceId = "44444444-4444-4444-8444-444444444444";
const fadId = "55555555-5555-4555-8555-555555555555";
const teamId = "66666666-6666-4666-8666-666666666666";
const cardId = "77777777-7777-4777-8777-777777777777";
const auctionId = "88888888-8888-4888-8888-888888888888";
const queueId = "99999999-9999-4999-8999-999999999999";
const assignmentId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const helpId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

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

function event({ type, reasonCode, relatedIds = related() }) {
  const value = {
    eventId,
    type,
    leagueId,
    resourceId,
    version: 2,
    reasonCode,
    occurredAt: 1_786_432_100_000,
    related: relatedIds,
  };
  return parseRealtimeEnvelope(type, value);
}

function actions(options) {
  return freeAgentDraftInvalidationActions(event(options));
}

function invalidatedKeys(mapped) {
  return mapped
    .filter(({ operation, queryKey }) => operation === "invalidate" && queryKey)
    .map(({ queryKey }) => queryKey);
}

function actionPredicate(mapped, operation, index = 0) {
  return mapped.filter(
    (action) => action.operation === operation && action.predicate
  )[index]?.predicate;
}

function privateQuery({
  league = leagueId,
  fad = fadId,
  team = teamId,
  kind = "private-card",
  authorizationScope = "team_manager",
  evidenceKind = "manager_assignment",
  evidenceId = assignmentId,
} = {}) {
  return {
    queryKey:
      kind === "private-card"
        ? freeAgentDraftKeys.privateCard(league, fad, team)
        : [
            "league",
            league,
            "free-agent-draft",
            fad,
            "eligible-players",
            team,
            "F01",
            { q: "", limit: 50 },
          ],
    meta: {
      private: true,
      leagueId: league,
      teamId: team,
      authorizationScope,
      authorizationEvidence: { kind: evidenceKind, id: evidenceId },
    },
  };
}

function viewerSensitiveResultQuery({
  league = leagueId,
  fad = fadId,
  team = teamId,
  kind = "results",
} = {}) {
  const queryKey = {
    "history-cards": freeAgentDraftKeys.historyCards(league, fad, { limit: 50 }),
    "history-card": freeAgentDraftKeys.historyCard(league, fad, team),
    results: freeAgentDraftKeys.results(league, fad, team, {
      q: "",
      status: null,
      limit: 50,
    }),
  }[kind];
  return {
    queryKey,
    meta: {
      private: true,
      leagueId: league,
      teamId: kind === "history-cards" ? null : team,
      viewerSensitiveFadResults: true,
    },
  };
}

describe("FAD realtime invalidation matrix", () => {
  it("invalidates only the matching private card/search plus overview/navigation", () => {
    const mapped = actions({
      type: "candidate_card.changed",
      reasonCode: "card_changed",
      relatedIds: related({ fadId, teamId, cardId }),
    });
    expect(invalidatedKeys(mapped)).toEqual([
      freeAgentDraftKeys.privateCard(leagueId, fadId, teamId),
      [
        "league",
        leagueId,
        "free-agent-draft",
        fadId,
        "eligible-players",
        teamId,
      ],
      freeAgentDraftKeys.overview(leagueId, fadId),
      ["league", leagueId, "free-agent-draft", "navigation"],
    ]);
  });

  it("removes only help-derived private queries on help/commissioner changes", () => {
    const helpChange = actions({
      type: "candidate_card_help.changed",
      reasonCode: "help_changed",
      relatedIds: related({ fadId, teamId, cardId }),
    });
    const removeHelp = actionPredicate(helpChange, "remove");
    expect(
      removeHelp(
        privateQuery({
          authorizationScope: "help_grant_commissioner",
          evidenceKind: "help_request",
          evidenceId: helpId,
        })
      )
    ).toBe(true);
    expect(removeHelp(privateQuery())).toBe(false);
    expect(
      removeHelp(
        privateQuery({
          league: otherLeagueId,
          authorizationScope: "help_grant_commissioner",
          evidenceKind: "help_request",
          evidenceId: helpId,
        })
      )
    ).toBe(false);

    const commissionerChange = actions({
      type: "league.changed",
      reasonCode: "commissioner_assignment_changed",
    });
    expect(invalidatedKeys(commissionerChange)).toContainEqual([
      "league",
      leagueId,
      "free-agent-draft",
      "navigation",
    ]);
  });

  it("removes manager authorization and every league result projection after reassignment", () => {
    const mapped = actions({
      type: "team.changed",
      reasonCode: "manager_assignment_changed",
      relatedIds: related({ teamId }),
    });
    const removals = mapped
      .filter(({ operation, predicate }) => operation === "remove" && predicate)
      .map(({ predicate }) => predicate);
    expect(removals.some((predicate) => predicate(privateQuery()))).toBe(true);
    expect(
      removals.some((predicate) =>
        predicate(
          privateQuery({
            authorizationScope: "help_grant_platform_administrator",
            evidenceKind: "help_request",
            evidenceId: helpId,
          })
        )
      )
    ).toBe(false);
    for (const kind of ["history-cards", "history-card", "results"]) {
      expect(
        removals.some((predicate) =>
          predicate(viewerSensitiveResultQuery({ kind }))
        )
      ).toBe(true);
      expect(
        removals.some((predicate) =>
          predicate(
            viewerSensitiveResultQuery({ kind, league: otherLeagueId })
          )
        )
      ).toBe(false);
    }
  });

  it("removes all T-131/T-132/T-140 caches on a membership change", () => {
    const mapped = actions({
      type: "league.changed",
      reasonCode: "membership_changed",
    });
    const removeResults = actionPredicate(mapped, "remove");
    for (const kind of ["history-cards", "history-card", "results"]) {
      expect(removeResults(viewerSensitiveResultQuery({ kind }))).toBe(true);
      expect(
        removeResults(viewerSensitiveResultQuery({ kind, league: otherLeagueId }))
      ).toBe(false);
    }
  });

  it("physically evicts every selected-team result cache before a manager-transfer refetch", async () => {
    const queryClient = new QueryClient();
    const scopedQueries = [
      viewerSensitiveResultQuery({ kind: "history-cards" }),
      viewerSensitiveResultQuery({ kind: "history-card" }),
      viewerSensitiveResultQuery({ kind: "results" }),
    ];
    const otherLeague = viewerSensitiveResultQuery({
      kind: "results",
      league: otherLeagueId,
    });
    for (const query of [...scopedQueries, otherLeague]) {
      queryClient.setQueryData(query.queryKey, { privateOffer: 600 });
      const cached = queryClient.getQueryCache().find({ queryKey: query.queryKey });
      cached.setOptions({
        ...cached.options,
        meta: query.meta,
      });
    }

    const envelope = event({
      type: "team.changed",
      reasonCode: "manager_assignment_changed",
      relatedIds: related({ teamId }),
    });
    await applyRealtimeInvalidation(queryClient, envelope, [
      freeAgentDraftInvalidationActions,
    ]);

    for (const query of scopedQueries) {
      expect(
        queryClient.getQueryCache().find({ queryKey: query.queryKey })
      ).toBeUndefined();
    }
    expect(
      queryClient.getQueryCache().find({ queryKey: otherLeague.queryKey })
    ).toBeDefined();
  });

  it("removes private Candidate queries before published-history refresh", () => {
    const mapped = actions({
      type: "free_agent_draft.changed",
      reasonCode: "cards_published",
      relatedIds: related({ fadId }),
    });
    const removePrivate = actionPredicate(mapped, "remove");
    expect(removePrivate(privateQuery())).toBe(true);
    expect(removePrivate(privateQuery({ fad: resourceId }))).toBe(false);
    expect(invalidatedKeys(mapped)).toEqual([
      ["league", leagueId, "free-agent-draft", fadId, "history-cards"],
      ["league", leagueId, "free-agent-draft", fadId, "history-card"],
      ["league", leagueId, "free-agent-draft", fadId, "results"],
      freeAgentDraftKeys.overview(leagueId, fadId),
      ["league", leagueId, "free-agent-draft", "navigation"],
    ]);
  });

  it("refreshes history/results/current state for allocation changes", () => {
    const mapped = actions({
      type: "free_agent_draft.changed",
      reasonCode: "allocation_changed",
      relatedIds: related({ fadId }),
    });
    expect(invalidatedKeys(mapped)).toEqual([
      ["league", leagueId, "free-agent-draft", fadId, "history-cards"],
      ["league", leagueId, "free-agent-draft", fadId, "history-card"],
      ["league", leagueId, "free-agent-draft", fadId, "results"],
      freeAgentDraftKeys.overview(leagueId, fadId),
      ["league", leagueId, "players"],
      ["league", leagueId, "free-agent-draft", "navigation"],
    ]);
  });

  it("keeps queued nominations private and removes them when their auction opens", () => {
    const queueQuery = {
      queryKey: [
        "league",
        leagueId,
        "free-agent-draft",
        fadId,
        "private-nomination-queue",
        teamId,
      ],
      meta: { private: true, leagueId, teamId },
    };
    const queued = actions({
      type: "fad_nomination_queue.changed",
      reasonCode: "nomination_queued",
      relatedIds: related({ fadId, teamId, nominationQueueId: queueId }),
    });
    expect(actionPredicate(queued, "invalidate")(queueQuery)).toBe(true);

    const opened = actions({
      type: "fad_nomination_queue.changed",
      reasonCode: "nomination_opened",
      relatedIds: related({
        fadId,
        teamId,
        auctionId,
        nominationQueueId: queueId,
      }),
    });
    expect(actionPredicate(opened, "remove")(queueQuery)).toBe(true);
    expect(invalidatedKeys(opened)).toContainEqual([
      "league",
      leagueId,
      "auctions",
      "detail",
      auctionId,
    ]);
    expect(invalidatedKeys(opened)).toContainEqual([
      "league",
      leagueId,
      "auction",
      auctionId,
    ]);
  });

  it("uses FAD-scoped auction filters and exact auction identity", () => {
    const mapped = actions({
      type: "auction.changed",
      reasonCode: "auction_changed",
      relatedIds: related({ fadId, auctionId }),
    });
    const auctionList = actionPredicate(mapped, "invalidate");
    expect(
      auctionList({
        queryKey: ["league", leagueId, "auctions", { fadId }],
      })
    ).toBe(true);
    expect(
      auctionList({ queryKey: ["league", leagueId, "auctions", {}] })
    ).toBe(false);
    expect(invalidatedKeys(mapped)).toContainEqual([
      "league",
      leagueId,
      "auctions",
      "detail",
      auctionId,
    ]);
    expect(invalidatedKeys(mapped)).toContainEqual([
      "league",
      leagueId,
      "auction",
      auctionId,
    ]);
  });

  it("refreshes fallback results, allocation history, and new auction keys", () => {
    const mapped = actions({
      type: "free_agent_draft.changed",
      reasonCode: "fallback_opened",
      relatedIds: related({ fadId, auctionId }),
    });
    expect(invalidatedKeys(mapped)).toEqual([
      ["league", leagueId, "free-agent-draft", fadId, "history-cards"],
      ["league", leagueId, "free-agent-draft", fadId, "history-card"],
      ["league", leagueId, "free-agent-draft", fadId, "results"],
      freeAgentDraftKeys.overview(leagueId, fadId),
      ["league", leagueId, "auctions", "detail", auctionId],
      ["league", leagueId, "auction", auctionId],
      ["league", leagueId, "free-agent-draft", "navigation"],
    ]);
    const listPredicate = actionPredicate(mapped, "invalidate");
    expect(
      listPredicate({
        queryKey: [
          "league",
          leagueId,
          "auctions",
          { sourceKind: null, fadId, statuses: ["active"], q: "", limit: 50 },
        ],
      })
    ).toBe(true);
  });

  it("invalidates recovery/competition scopes after Week 1 recovery", () => {
    const mapped = actions({
      type: "free_agent_draft.changed",
      reasonCode: "week1_recovered",
      relatedIds: related({ fadId }),
    });
    expect(invalidatedKeys(mapped)).toEqual([
      freeAgentDraftKeys.overview(leagueId, fadId),
      ["league", leagueId, "free-agent-draft", "navigation"],
      ["league", leagueId, "free-agent-draft", fadId, "recovery"],
      ["league", leagueId, "season"],
      ["league", leagueId, "operations"],
    ]);
  });

  it("refreshes recovery, history, activity, rosters, and contracts after correction", () => {
    const mapped = actions({
      type: "free_agent_draft.changed",
      reasonCode: "correction_applied",
      relatedIds: related({ fadId }),
    });
    expect(invalidatedKeys(mapped)).toEqual([
      ["league", leagueId, "free-agent-draft", fadId, "history-cards"],
      ["league", leagueId, "free-agent-draft", fadId, "history-card"],
      ["league", leagueId, "free-agent-draft", fadId, "results"],
      freeAgentDraftKeys.overview(leagueId, fadId),
      ["league", leagueId, "free-agent-draft", fadId, "recovery"],
      ["league", leagueId, "free-agent-draft", "navigation"],
      ["league", leagueId, "activity"],
      ["league", leagueId, "team"],
    ]);
  });

  it("clears residual private data and refreshes every FAD query at completion", () => {
    const mapped = actions({
      type: "free_agent_draft.changed",
      reasonCode: "completed",
      relatedIds: related({ fadId }),
    });
    expect(actionPredicate(mapped, "remove")(privateQuery())).toBe(true);
    const invalidateAll = actionPredicate(mapped, "invalidate", 0);
    expect(
      invalidateAll({ queryKey: freeAgentDraftKeys.overview(leagueId, fadId) })
    ).toBe(true);
    expect(
      invalidateAll({
        queryKey: freeAgentDraftKeys.overview(otherLeagueId, fadId),
      })
    ).toBe(false);
    const detailPredicates = mapped
      .filter(({ operation, predicate }) => operation === "invalidate" && predicate)
      .map(({ predicate }) => predicate);
    expect(
      detailPredicates.some((predicate) =>
        predicate({
          queryKey: ["league", leagueId, "auctions", "detail", auctionId],
          state: { data: { fadId } },
        })
      )
    ).toBe(true);
    expect(
      detailPredicates.some((predicate) =>
        predicate({
          queryKey: ["league", otherLeagueId, "auctions", "detail", auctionId],
          state: { data: { fadId } },
        })
      )
    ).toBe(false);
  });

  it("refreshes authorized private projections on roster and contract changes", () => {
    for (const [type, reasonCode] of [
      ["roster.changed", "roster_changed"],
      ["contract.changed", "contract_changed"],
      ["roster.changed", "correction_applied"],
    ]) {
      const mapped = actions({
        type,
        reasonCode,
        relatedIds: related({ fadId, teamId }),
      });
      const invalidatePrivate = actionPredicate(mapped, "invalidate");
      expect(invalidatePrivate(privateQuery())).toBe(true);
      expect(invalidatePrivate(privateQuery({ team: resourceId }))).toBe(false);
    }
  });

  it("refreshes readiness/navigation after the generic setup-exemption league event", () => {
    const mapped = actions({
      type: "league.changed",
      reasonCode: "league_changed",
    });
    expect(invalidatedKeys(mapped)).toEqual([
      ["league", leagueId, "free-agent-draft", "navigation"],
    ]);
    const predicates = mapped.filter(({ predicate }) => predicate);
    expect(
      predicates.some(({ predicate }) =>
        predicate({
          queryKey: freeAgentDraftKeys.readiness(leagueId, resourceId),
        })
      )
    ).toBe(true);
  });

  it("ignores non-FAD notification/activity events without reading their contents", () => {
    expect(
      actions({ type: "notification.created", reasonCode: "cards_opened" })
    ).toEqual([]);
    expect(
      actions({ type: "activity.created", reasonCode: "cards_opened" })
    ).toEqual([]);
  });
});
