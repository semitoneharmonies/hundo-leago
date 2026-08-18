import {
  isFreeAgentDraftQuery,
  isPrivateCandidateQuery,
} from "./freeAgentDraftCache.js";
import { freeAgentDraftKeys } from "./freeAgentDraftQueries.js";
import { auctionKeys } from "../auctions/auctionQueries.js";

const HELP_AUTHORIZATION_SCOPES = new Set([
  "help_grant_commissioner",
  "help_grant_platform_administrator",
]);

function keyAction(operation, queryKey) {
  return Object.freeze({ operation, queryKey: Object.freeze(queryKey) });
}

function predicateAction(operation, predicate) {
  return Object.freeze({ operation, predicate });
}

function invalidate(queryKey) {
  return keyAction("invalidate", queryKey);
}

function removeWhere(predicate) {
  return predicateAction("remove", predicate);
}

function invalidateWhere(predicate) {
  return predicateAction("invalidate", predicate);
}

function withoutTail(queryKey, count = 1) {
  return queryKey.slice(0, -count);
}

function matchesPrefix(value, prefix) {
  return (
    Array.isArray(value) &&
    value.length >= prefix.length &&
    prefix.every((part, index) => value[index] === part)
  );
}

function navigationPrefix(leagueId) {
  return withoutTail(freeAgentDraftKeys.navigation(leagueId, null));
}

function historyCardsPrefix(leagueId, fadId) {
  return withoutTail(freeAgentDraftKeys.historyCards(leagueId, fadId, null));
}

function eligiblePlayersPrefix(leagueId, fadId, teamId) {
  return withoutTail(
    freeAgentDraftKeys.eligiblePlayers(
      leagueId,
      fadId,
      teamId,
      null,
      null
    ),
    2
  );
}

function resultsPrefix(leagueId, fadId) {
  return withoutTail(freeAgentDraftKeys.results(leagueId, fadId, null));
}

function privateCandidateQuery(query, leagueId, fadId = null, teamId = null) {
  const key = query?.queryKey;
  if (
    !isPrivateCandidateQuery(query) ||
    key[1] !== leagueId ||
    (fadId !== null && key[3] !== fadId) ||
    !["private-card", "eligible-players"].includes(key[4])
  ) {
    return false;
  }
  return teamId === null || key[5] === teamId;
}

function authorizedPrivateCandidateQuery(
  query,
  leagueId,
  teamId,
  authorizationScopes
) {
  return (
    privateCandidateQuery(query, leagueId, null, teamId) &&
    authorizationScopes.has(query.meta.authorizationScope)
  );
}

function privateQueueQuery(query, leagueId, fadId, teamId = null) {
  const key = query?.queryKey;
  if (
    query?.meta?.private !== true ||
    query.meta.leagueId !== leagueId ||
    !matchesPrefix(key, ["league", leagueId, "free-agent-draft", fadId]) ||
    !["nomination-queue", "private-nomination-queue"].includes(key[4])
  ) {
    return false;
  }
  return teamId === null || query.meta.teamId === teamId || key[5] === teamId;
}

function fadAuctionListQuery(query, leagueId, fadId) {
  const key = query?.queryKey;
  if (!matchesPrefix(key, auctionKeys.root(leagueId))) return false;
  const filters = key[3];
  if (!filters || typeof filters !== "object" || Array.isArray(filters)) {
    return false;
  }
  return filters.fadId === fadId || filters.freeAgentDraftId === fadId;
}

function fadAuctionDetailQuery(query, leagueId, fadId) {
  const key = query?.queryKey;
  const currentDetail = matchesPrefix(key, [
    ...auctionKeys.root(leagueId),
    "detail",
  ]);
  const legacyDetail = matchesPrefix(key, ["league", leagueId, "auction"]);
  return (
    (currentDetail || legacyDetail) &&
    query?.state?.data?.fadId === fadId
  );
}

function everyFadQuery(query, leagueId) {
  return (
    isFreeAgentDraftQuery(query) &&
    query.queryKey[1] === leagueId
  );
}

function everyFadOverview(query, leagueId) {
  const key = query?.queryKey;
  return (
    matchesPrefix(key, freeAgentDraftKeys.root(leagueId)) &&
    key.length >= 5 &&
    key[4] === "overview"
  );
}

function commonCurrentActions(leagueId, fadId = null) {
  const actions = [invalidate(navigationPrefix(leagueId))];
  if (fadId !== null) {
    actions.unshift(invalidate(freeAgentDraftKeys.overview(leagueId, fadId)));
  }
  return actions;
}

function historyActions(leagueId, fadId) {
  return [
    invalidate(historyCardsPrefix(leagueId, fadId)),
    invalidate(
      withoutTail(freeAgentDraftKeys.historyCard(leagueId, fadId, null))
    ),
  ];
}

function resultActions(leagueId, fadId) {
  return [
    ...historyActions(leagueId, fadId),
    invalidate(resultsPrefix(leagueId, fadId)),
    invalidate(freeAgentDraftKeys.overview(leagueId, fadId)),
  ];
}

function auctionActions(leagueId, fadId, auctionId) {
  const actions = [
    invalidateWhere((query) => fadAuctionListQuery(query, leagueId, fadId)),
  ];
  if (auctionId !== null) {
    actions.push(invalidate(auctionKeys.detail(leagueId, auctionId)));
    actions.push(invalidate(["league", leagueId, "auction", auctionId]));
  } else {
    actions.push(
      invalidateWhere((query) =>
        fadAuctionDetailQuery(query, leagueId, fadId)
      )
    );
  }
  return actions;
}

function authorityChangeActions(envelope) {
  const { leagueId, reasonCode, related, type } = envelope;
  if (
    type === "league.changed" &&
    ["membership_changed", "commissioner_assignment_changed"].includes(
      reasonCode
    )
  ) {
    return [
      invalidate(navigationPrefix(leagueId)),
      invalidateWhere((query) => everyFadOverview(query, leagueId)),
    ];
  }
  if (
    ["league.changed", "team.changed"].includes(type) &&
    reasonCode === "manager_assignment_changed"
  ) {
    return [
      removeWhere((query) =>
        authorizedPrivateCandidateQuery(
          query,
          leagueId,
          related.teamId,
          new Set(["team_manager"])
        )
      ),
      invalidate(navigationPrefix(leagueId)),
      invalidateWhere((query) => everyFadOverview(query, leagueId)),
    ];
  }
  if (
    type === "candidate_card_help.changed" &&
    reasonCode === "help_changed"
  ) {
    return [
      removeWhere((query) =>
        authorizedPrivateCandidateQuery(
          query,
          leagueId,
          related.teamId,
          HELP_AUTHORIZATION_SCOPES
        )
      ),
      ...commonCurrentActions(leagueId, related.fadId),
    ];
  }
  return null;
}

function candidateCardActions(envelope) {
  const { leagueId, reasonCode, related, type } = envelope;
  if (type !== "candidate_card.changed" || reasonCode !== "card_changed") {
    return null;
  }
  if (related.fadId === null || related.teamId === null) return [];
  return [
    invalidate(
      freeAgentDraftKeys.privateCard(
        leagueId,
        related.fadId,
        related.teamId
      )
    ),
    invalidate(eligiblePlayersPrefix(leagueId, related.fadId, related.teamId)),
    ...commonCurrentActions(leagueId, related.fadId),
  ];
}

function publicationActions(envelope) {
  const { leagueId, reasonCode, related, type } = envelope;
  const published =
    (type === "free_agent_draft.changed" && reasonCode === "cards_published") ||
    (type === "candidate_card.changed" && reasonCode === "cards_published");
  if (!published || related.fadId === null) return null;
  return [
    removeWhere((query) =>
      privateCandidateQuery(query, leagueId, related.fadId)
    ),
    ...resultActions(leagueId, related.fadId),
    invalidate(navigationPrefix(leagueId)),
  ];
}

function nominationActions(envelope) {
  const { leagueId, reasonCode, related, type } = envelope;
  if (type !== "fad_nomination_queue.changed" || related.fadId === null) {
    return null;
  }
  if (reasonCode === "nomination_queued") {
    return [
      invalidateWhere((query) =>
        privateQueueQuery(query, leagueId, related.fadId, related.teamId)
      ),
      ...commonCurrentActions(leagueId, related.fadId),
    ];
  }
  if (reasonCode === "nomination_opened") {
    return [
      removeWhere((query) =>
        privateQueueQuery(query, leagueId, related.fadId, related.teamId)
      ),
      ...auctionActions(leagueId, related.fadId, related.auctionId),
      ...commonCurrentActions(leagueId, related.fadId),
    ];
  }
  return [];
}

function rosterOrContractActions(envelope) {
  const { leagueId, reasonCode, related, type } = envelope;
  if (
    ![
      "roster.changed/roster_changed",
      "roster.changed/correction_applied",
      "contract.changed/contract_changed",
      "contract.changed/correction_applied",
    ].includes(`${type}/${reasonCode}`)
  ) {
    return null;
  }
  const scope = related.fadId;
  return [
    invalidate(["league", leagueId, "players"]),
    invalidateWhere((query) =>
      privateCandidateQuery(query, leagueId, scope, related.teamId)
    ),
    ...(scope === null
      ? [invalidateWhere((query) => everyFadOverview(query, leagueId))]
      : [invalidate(freeAgentDraftKeys.overview(leagueId, scope))]),
    invalidate(navigationPrefix(leagueId)),
  ];
}

function freeAgentDraftActions(envelope) {
  const { leagueId, reasonCode, related, type } = envelope;
  if (type !== "free_agent_draft.changed" || related.fadId === null) {
    return null;
  }
  const fadId = related.fadId;
  if (reasonCode === "cards_opened") {
    return commonCurrentActions(leagueId, fadId);
  }
  if (reasonCode === "allocation_changed") {
    return [
      ...resultActions(leagueId, fadId),
      invalidate(["league", leagueId, "players"]),
      invalidate(navigationPrefix(leagueId)),
    ];
  }
  if (reasonCode === "fallback_opened") {
    return [
      ...resultActions(leagueId, fadId),
      ...auctionActions(leagueId, fadId, related.auctionId),
      invalidate(navigationPrefix(leagueId)),
    ];
  }
  if (reasonCode === "nomination_opened") {
    return [
      ...auctionActions(leagueId, fadId, related.auctionId),
      ...commonCurrentActions(leagueId, fadId),
    ];
  }
  if (reasonCode === "week1_recovered") {
    return [
      ...commonCurrentActions(leagueId, fadId),
      invalidate(["league", leagueId, "free-agent-draft", fadId, "recovery"]),
      invalidate(["league", leagueId, "season"]),
      invalidate(["league", leagueId, "operations"]),
    ];
  }
  if (reasonCode === "correction_applied") {
    return [
      ...resultActions(leagueId, fadId),
      invalidate(["league", leagueId, "free-agent-draft", fadId, "recovery"]),
      invalidate(navigationPrefix(leagueId)),
      invalidate(["league", leagueId, "activity"]),
      invalidate(["league", leagueId, "team"]),
    ];
  }
  if (reasonCode === "completed") {
    return [
      removeWhere((query) => privateCandidateQuery(query, leagueId, fadId)),
      invalidateWhere((query) => everyFadQuery(query, leagueId)),
      ...auctionActions(leagueId, fadId, related.auctionId),
      invalidate(["league", leagueId, "team"]),
    ];
  }
  return [];
}

function auctionChangedActions(envelope) {
  const { leagueId, reasonCode, related, type } = envelope;
  if (
    type !== "auction.changed" ||
    reasonCode !== "auction_changed" ||
    related.fadId === null
  ) {
    return null;
  }
  return [
    ...auctionActions(leagueId, related.fadId, related.auctionId),
    ...resultActions(leagueId, related.fadId),
    invalidate(navigationPrefix(leagueId)),
  ];
}

export function freeAgentDraftInvalidationActions(envelope) {
  const authority = authorityChangeActions(envelope);
  if (authority !== null) return Object.freeze(authority);

  if (
    envelope.type === "league.changed" &&
    envelope.reasonCode === "league_changed"
  ) {
    return Object.freeze([
      invalidate(navigationPrefix(envelope.leagueId)),
      invalidateWhere((query) => everyFadOverview(query, envelope.leagueId)),
      invalidateWhere((query) => {
        const key = query?.queryKey;
        return (
          matchesPrefix(key, freeAgentDraftKeys.root(envelope.leagueId)) &&
          key[3] === "readiness"
        );
      }),
    ]);
  }

  for (const resolver of [
    candidateCardActions,
    publicationActions,
    nominationActions,
    rosterOrContractActions,
    freeAgentDraftActions,
    auctionChangedActions,
  ]) {
    const actions = resolver(envelope);
    if (actions !== null) return Object.freeze(actions);
  }
  return Object.freeze([]);
}
