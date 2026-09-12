const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export const REALTIME_RELATED_ID_KEYS = Object.freeze([
  "fadId",
  "teamId",
  "cardId",
  "allocationId",
  "auctionId",
  "recoveryId",
  "nominationQueueId",
  "scheduleRecoveryOperationId",
]);

export const REALTIME_REASON_CODES = Object.freeze({
  "league.changed": Object.freeze([
    "league_changed",
    "membership_changed",
    "commissioner_assignment_changed",
    "manager_assignment_changed",
  ]),
  "team.changed": Object.freeze([
    "team_changed",
    "manager_assignment_changed",
  ]),
  "roster.changed": Object.freeze([
    "roster_changed",
    "correction_applied",
  ]),
  "contract.changed": Object.freeze([
    "contract_changed",
    "correction_applied",
  ]),
  "auction.changed": Object.freeze([
    "auction_changed",
    "nomination_opened",
    "fallback_opened",
    "correction_applied",
  ]),
  "trade.changed": Object.freeze(["trade_changed"]),
  "matchup.changed": Object.freeze([
    "matchup_changed",
    "week1_recovered",
    "correction_applied",
  ]),
  "standings.changed": Object.freeze([
    "standings_changed",
    "correction_applied",
  ]),
  "draft.changed": Object.freeze(["draft_changed"]),
  "free_agent_draft.changed": Object.freeze([
    "cards_opened",
    "cards_published",
    "allocation_changed",
    "correction_applied",
    "completed",
    "nomination_opened",
    "fallback_opened",
    "week1_recovered",
  ]),
  "candidate_card.changed": Object.freeze([
    "card_changed",
    "cards_published",
  ]),
  "candidate_card_help.changed": Object.freeze(["help_changed"]),
  "fad_nomination_queue.changed": Object.freeze([
    "nomination_queued",
    "nomination_opened",
  ]),
  "activity.created": Object.freeze([
    "activity_created",
    "setup_exemption_authorized",
    "cards_opened",
    "cards_published",
    "allocation_changed",
    "correction_applied",
    "completed",
    "nomination_opened",
    "fallback_opened",
    "week1_recovered",
    "auction_changed",
    "roster_changed",
    "contract_changed",
  ]),
  "notification.created": Object.freeze([
    "notification_created",
    "setup_exemption_authorized",
    "cards_opened",
    "cards_published",
    "allocation_changed",
    "correction_applied",
    "completed",
    "nomination_queued",
    "nomination_opened",
    "fallback_opened",
    "week1_recovered",
    "auction_changed",
    "roster_changed",
    "contract_changed",
  ]),
  "operations.changed": Object.freeze([
    "operations_changed",
    "correction_applied",
    "week1_recovered",
  ]),
});

const ENVELOPE_KEYS = Object.freeze([
  "eventId",
  "type",
  "leagueId",
  "resourceId",
  "version",
  "reasonCode",
  "occurredAt",
  "related",
]);

const GLOBAL_SHARED_PREFIXES = new Set(["leagues", "notifications"]);
const AUTHORITY_CHANGES = new Set([
  "league.changed/membership_changed",
  "league.changed/commissioner_assignment_changed",
  "league.changed/manager_assignment_changed",
  "team.changed/manager_assignment_changed",
  "candidate_card_help.changed/help_changed",
]);
const PRIVACY_BOUNDARIES = new Set([
  ...AUTHORITY_CHANGES,
  "free_agent_draft.changed/cards_published",
  "free_agent_draft.changed/completed",
  "candidate_card.changed/cards_published",
  "fad_nomination_queue.changed/nomination_opened",
]);

export class RealtimeContractError extends Error {
  constructor() {
    super("The realtime invalidation envelope is invalid.");
    this.name = "RealtimeContractError";
    this.code = "REALTIME_ENVELOPE_INVALID";
  }
}

function invalidEnvelope() {
  throw new RealtimeContractError();
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(value, expectedKeys) {
  if (!isPlainObject(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

function parseRelated(value) {
  if (!hasExactKeys(value, REALTIME_RELATED_ID_KEYS)) invalidEnvelope();
  const related = {};
  for (const key of REALTIME_RELATED_ID_KEYS) {
    const id = value[key];
    if (id !== null && !UUID_V4.test(id || "")) invalidEnvelope();
    related[key] = id;
  }
  return Object.freeze(related);
}

export function parseRealtimeEnvelope(eventName, value) {
  if (
    !hasExactKeys(value, ENVELOPE_KEYS) ||
    typeof eventName !== "string" ||
    value.type !== eventName ||
    !Object.prototype.hasOwnProperty.call(REALTIME_REASON_CODES, eventName) ||
    !REALTIME_REASON_CODES[eventName].includes(value.reasonCode) ||
    !UUID_V4.test(value.eventId || "") ||
    !UUID_V4.test(value.leagueId || "") ||
    !UUID_V4.test(value.resourceId || "") ||
    !Number.isSafeInteger(value.version) ||
    value.version < 1 ||
    !Number.isSafeInteger(value.occurredAt) ||
    value.occurredAt < 0
  ) {
    invalidEnvelope();
  }

  return Object.freeze({
    eventId: value.eventId,
    type: value.type,
    leagueId: value.leagueId,
    resourceId: value.resourceId,
    version: value.version,
    reasonCode: value.reasonCode,
    occurredAt: value.occurredAt,
    related: parseRelated(value.related),
  });
}

export function isRealtimePrivacyBoundary(envelope) {
  return PRIVACY_BOUNDARIES.has(`${envelope.type}/${envelope.reasonCode}`);
}

function invalidate(queryKey) {
  return Object.freeze({ operation: "invalidate", queryKey: Object.freeze(queryKey) });
}

function remove(predicate) {
  return Object.freeze({ operation: "remove", predicate });
}

function isLeagueQuery(query, leagueId) {
  const key = query?.queryKey;
  if (!Array.isArray(key) || key[0] !== "league" || key[1] !== leagueId) {
    return false;
  }
  return query.meta?.leagueId === undefined || query.meta.leagueId === leagueId;
}

function isPrivateLeagueQuery(query, leagueId) {
  return query?.meta?.private === true && isLeagueQuery(query, leagueId);
}

function isAuthorizationScopedQuery(
  query,
  leagueId,
  teamId = null,
  authorizationScopes = null
) {
  if (
    !isPrivateLeagueQuery(query, leagueId) ||
    typeof query.meta?.authorizationScope !== "string" ||
    !isPlainObject(query.meta?.authorizationEvidence)
  ) {
    return false;
  }
  return (
    (teamId === null || query.meta.teamId === teamId) &&
    (authorizationScopes === null ||
      authorizationScopes.has(query.meta.authorizationScope))
  );
}

function privacyActions(envelope) {
  const identity = `${envelope.type}/${envelope.reasonCode}`;
  if (!AUTHORITY_CHANGES.has(identity)) return [];

  if (identity === "league.changed/membership_changed") {
    return [remove((query) => isPrivateLeagueQuery(query, envelope.leagueId))];
  }

  if (
    [
      "league.changed/manager_assignment_changed",
      "team.changed/manager_assignment_changed",
    ].includes(identity)
  ) {
    return [
      remove((query) =>
        isAuthorizationScopedQuery(
          query,
          envelope.leagueId,
          envelope.related.teamId,
          new Set(["team_manager"])
        )
      ),
    ];
  }

  if (identity === "candidate_card_help.changed/help_changed") {
    return [
      remove((query) =>
        isAuthorizationScopedQuery(
          query,
          envelope.leagueId,
          envelope.related.teamId,
          new Set([
            "help_grant_commissioner",
            "help_grant_platform_administrator",
          ])
        )
      ),
    ];
  }

  return [
    remove((query) =>
      isAuthorizationScopedQuery(
        query,
        envelope.leagueId,
        null,
        new Set([
          "help_grant_commissioner",
          "help_grant_platform_administrator",
        ])
      )
    ),
  ];
}

export function realtimeInvalidationActions(envelope) {
  const actions = [
    ...privacyActions(envelope),
    invalidate(["league", envelope.leagueId, "activity"]),
    invalidate(["notifications"]),
  ];

  if (envelope.type === "auction.changed") {
    actions.push(invalidate(["league", envelope.leagueId, "auctions"]));
    actions.push(invalidate(["league", envelope.leagueId, "auction"]));
  }
  if (envelope.type === "trade.changed") {
    actions.push(invalidate(["league", envelope.leagueId, "trades"]));
    actions.push(invalidate(["league", envelope.leagueId, "trade"]));
  }
  if (envelope.type === "league.changed") {
    actions.push(invalidate(["leagues"]));
    actions.push(invalidate(["league", envelope.leagueId]));
  }
  if (envelope.type === "team.changed") {
    actions.push(invalidate(["league", envelope.leagueId, "teams"]));
    if (envelope.related.teamId !== null) {
      actions.push(
        invalidate(["league", envelope.leagueId, "team", envelope.related.teamId])
      );
    }
  }
  if (["roster.changed", "contract.changed"].includes(envelope.type)) {
    actions.push(invalidate(["league", envelope.leagueId, "players"]));
  }

  return Object.freeze(actions);
}

function queryKeyBelongsToLeague(queryKey, leagueId) {
  return (
    Array.isArray(queryKey) &&
    queryKey.length >= 2 &&
    queryKey[0] === "league" &&
    queryKey[1] === leagueId
  );
}

function validGlobalSharedQueryKey(queryKey) {
  return (
    Array.isArray(queryKey) &&
    queryKey.length >= 1 &&
    GLOBAL_SHARED_PREFIXES.has(queryKey[0])
  );
}

function exactAction(value) {
  if (!isPlainObject(value) || !["invalidate", "remove"].includes(value.operation)) {
    return null;
  }
  const keys = Object.keys(value).sort();
  if (keys.length !== 2 || keys[0] !== "operation") return null;
  if (keys[1] === "queryKey" && Array.isArray(value.queryKey)) return value;
  if (keys[1] === "predicate" && typeof value.predicate === "function") return value;
  return null;
}

function scopedAction(value, envelope, { allowSharedGlobal = false } = {}) {
  const action = exactAction(value);
  if (!action) return null;
  if (action.queryKey) {
    if (
      !queryKeyBelongsToLeague(action.queryKey, envelope.leagueId) &&
      !(allowSharedGlobal && validGlobalSharedQueryKey(action.queryKey))
    ) {
      return null;
    }
    return action;
  }
  return Object.freeze({
    operation: action.operation,
    predicate: (query) => {
      if (!isLeagueQuery(query, envelope.leagueId)) return false;
      try {
        return action.predicate(query) === true;
      } catch {
        return false;
      }
    },
  });
}

function collectActions(envelope, invalidationMappers) {
  const shared = realtimeInvalidationActions(envelope)
    .map((action) => scopedAction(action, envelope, { allowSharedGlobal: true }))
    .filter(Boolean);
  const feature = [];
  for (const mapper of invalidationMappers) {
    let mapped;
    try {
      mapped = mapper(envelope);
    } catch {
      continue;
    }
    if (!Array.isArray(mapped)) continue;
    for (const candidate of mapped) {
      const action = scopedAction(candidate, envelope);
      if (action) feature.push(action);
    }
  }
  return [...shared, ...feature];
}

export function applyRealtimeInvalidation(
  queryClient,
  envelope,
  invalidationMappers = []
) {
  if (
    !queryClient ||
    typeof queryClient.cancelQueries !== "function" ||
    typeof queryClient.removeQueries !== "function" ||
    typeof queryClient.invalidateQueries !== "function" ||
    !Array.isArray(invalidationMappers) ||
    invalidationMappers.some((mapper) => typeof mapper !== "function")
  ) {
    throw new TypeError("Realtime invalidation requires a Query Client and mappers.");
  }

  const actions = collectActions(envelope, invalidationMappers);
  const pending = [];
  for (const action of actions.filter(({ operation }) => operation === "remove")) {
    const options = action.queryKey
      ? { queryKey: action.queryKey }
      : { predicate: action.predicate };
    try {
      pending.push(Promise.resolve(queryClient.cancelQueries(options)));
      queryClient.removeQueries(options);
    } catch (error) {
      pending.push(Promise.reject(error));
    }
  }
  for (const action of actions.filter(({ operation }) => operation === "invalidate")) {
    const options = action.queryKey
      ? { queryKey: action.queryKey }
      : { predicate: action.predicate };
    try {
      pending.push(Promise.resolve(queryClient.invalidateQueries(options)));
    } catch (error) {
      pending.push(Promise.reject(error));
    }
  }
  return Promise.allSettled(pending);
}

export function reauthorizePrivateQueriesOnReconnect(queryClient) {
  if (
    !queryClient ||
    typeof queryClient.cancelQueries !== "function" ||
    typeof queryClient.removeQueries !== "function"
  ) {
    throw new TypeError("Realtime reconnect cleanup requires a Query Client.");
  }
  const predicate = (query) =>
    query?.meta?.private === true;
  const cancellation = Promise.resolve(queryClient.cancelQueries({ predicate }));
  queryClient.removeQueries({ predicate });
  return cancellation;
}
