import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { ResponseContractError } from "../../shared/api/responseContracts.js";
import {
  FAD_ALLOCATION_STATUSES,
  FAD_AUTHORIZATION_SCOPES,
} from "./freeAgentDraftContracts.js";
import {
  getEligibleCandidatePlayers,
  getFreeAgentDraftNavigation,
  getFreeAgentDraftOverview,
  getFreeAgentDraftReadiness,
  getFreeAgentDraftRecovery,
  getFreeAgentDraftResults,
  getPrivateCandidateCard,
  getPublishedCandidateCard,
  getPublishedCandidateCards,
} from "./freeAgentDraftApi.js";

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SLOT_KEY = /^(?:F(?:0[1-9]|1[0-2])|D0[1-6]|B0[1-4])$/;

function identifier(value, description) {
  if (typeof value !== "string" || !UUID_V4.test(value)) {
    throw new TypeError(`${description} is invalid.`);
  }
  return value;
}

function boundedLimit(value) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 100) {
    throw new TypeError("The FAD page limit is invalid.");
  }
  return value;
}

function normalizedSearch(value) {
  if (typeof value !== "string") {
    throw new TypeError("The FAD search is invalid.");
  }
  const normalized = value.replace(/\s+/gu, " ").trim().toLowerCase();
  if (
    Array.from(normalized).length > 200 ||
    Array.from(value).some((character) => {
      const codePoint = character.codePointAt(0);
      return (
        codePoint <= 31 ||
        (codePoint >= 127 && codePoint <= 159) ||
        codePoint === 8_232 ||
        codePoint === 8_233
      ) && !/\s/u.test(character);
    })
  ) {
    throw new TypeError("The FAD search is invalid.");
  }
  return normalized;
}

export function freeAgentDraftNavigationScope({ rosterSeasonId = null, rosterTeamId = null } = {}) {
  if (rosterSeasonId === null && rosterTeamId === null) {
    return Object.freeze({ rosterSeasonId: null, rosterTeamId: null });
  }
  return Object.freeze({
    rosterSeasonId: identifier(rosterSeasonId, "Roster season ID"),
    rosterTeamId: identifier(rosterTeamId, "Roster team ID"),
  });
}

function exactAuthorization(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).sort().join("|") !==
      "authorizationEvidence|authorizationScope"
  ) {
    throw new TypeError("Candidate Card authorization evidence is required.");
  }
  const { authorizationScope, authorizationEvidence } = value;
  if (!FAD_AUTHORIZATION_SCOPES.includes(authorizationScope)) {
    throw new TypeError("Candidate Card authorization scope is invalid.");
  }
  if (
    !authorizationEvidence ||
    typeof authorizationEvidence !== "object" ||
    Array.isArray(authorizationEvidence) ||
    Object.keys(authorizationEvidence).sort().join("|") !== "id|kind" ||
    !["manager_assignment", "help_request"].includes(authorizationEvidence.kind) ||
    !UUID_V4.test(authorizationEvidence.id || "") ||
    (authorizationScope === "team_manager") !==
      (authorizationEvidence.kind === "manager_assignment")
  ) {
    throw new TypeError("Candidate Card authorization evidence is invalid.");
  }
  return Object.freeze({
    authorizationScope,
    authorizationEvidence: Object.freeze({
      kind: authorizationEvidence.kind,
      id: authorizationEvidence.id,
    }),
  });
}

function commonMeta(leagueId) {
  return Object.freeze({ private: true, leagueId });
}

function protectedMeta(leagueId, teamId, authorization) {
  const canonical = exactAuthorization(authorization);
  return Object.freeze({
    private: true,
    leagueId,
    teamId,
    authorizationScope: canonical.authorizationScope,
    authorizationEvidence: canonical.authorizationEvidence,
  });
}

function sameIdentity(actual, expected, description) {
  if (actual !== expected) {
    throw new ResponseContractError(`${description} identity is mismatched.`);
  }
}

function ensurePrivateCardScope(card, { leagueId, fadId, teamId, authorization }) {
  sameIdentity(card.leagueId, leagueId, "Candidate Card league");
  sameIdentity(card.fadId, fadId, "Candidate Card FAD");
  sameIdentity(card.teamId, teamId, "Candidate Card team");
  sameIdentity(card.accessReason, authorization.authorizationScope, "Candidate Card authorization");
  sameIdentity(card.authorizationEvidence.kind, authorization.authorizationEvidence.kind, "Candidate Card authorization kind");
  sameIdentity(card.authorizationEvidence.id, authorization.authorizationEvidence.id, "Candidate Card authorization evidence");
  return card;
}

export const freeAgentDraftKeys = Object.freeze({
  root: (leagueId) => ["league", leagueId, "free-agent-draft"],
  navigation: (leagueId, scope) => [
    "league",
    leagueId,
    "free-agent-draft",
    "navigation",
    scope,
  ],
  readiness: (leagueId, seasonId) => [
    "league",
    leagueId,
    "free-agent-draft",
    "readiness",
    seasonId,
  ],
  overview: (leagueId, fadId) => [
    "league",
    leagueId,
    "free-agent-draft",
    fadId,
    "overview",
  ],
  privateCard: (leagueId, fadId, teamId) => [
    "league",
    leagueId,
    "free-agent-draft",
    fadId,
    "private-card",
    teamId,
  ],
  historyCards: (leagueId, fadId, filters) => [
    "league",
    leagueId,
    "free-agent-draft",
    fadId,
    "history-cards",
    filters,
  ],
  historyCard: (leagueId, fadId, teamId) => [
    "league",
    leagueId,
    "free-agent-draft",
    fadId,
    "history-card",
    teamId,
  ],
  eligiblePlayers: (leagueId, fadId, teamId, slotKey, filters) => [
    "league",
    leagueId,
    "free-agent-draft",
    fadId,
    "eligible-players",
    teamId,
    slotKey,
    filters,
  ],
  results: (leagueId, fadId, filters) => [
    "league",
    leagueId,
    "free-agent-draft",
    fadId,
    "results",
    filters,
  ],
  recovery: (leagueId, fadId) => [
    "league",
    leagueId,
    "free-agent-draft",
    fadId,
    "recovery",
  ],
  auctions: (leagueId, filters) => ["league", leagueId, "auctions", filters],
});

export function freeAgentDraftNavigationQuery(httpClient, leagueId, scopeInput) {
  identifier(leagueId, "League ID");
  const scope = freeAgentDraftNavigationScope(scopeInput);
  return queryOptions({
    queryKey: freeAgentDraftKeys.navigation(leagueId, scope),
    queryFn: async ({ signal }) => {
      const data = await getFreeAgentDraftNavigation(httpClient, leagueId, {
        ...scope,
        signal,
      });
      return data;
    },
    meta: commonMeta(leagueId),
    staleTime: 10_000,
  });
}

export function freeAgentDraftReadinessQuery(httpClient, leagueId, seasonId) {
  identifier(leagueId, "League ID");
  identifier(seasonId, "Season ID");
  return queryOptions({
    queryKey: freeAgentDraftKeys.readiness(leagueId, seasonId),
    queryFn: async ({ signal }) => {
      const data = await getFreeAgentDraftReadiness(httpClient, leagueId, seasonId, { signal });
      sameIdentity(data.leagueId, leagueId, "FAD readiness league");
      sameIdentity(data.seasonId, seasonId, "FAD readiness season");
      return data;
    },
    meta: commonMeta(leagueId),
    staleTime: 5_000,
  });
}

export function freeAgentDraftOverviewQuery(httpClient, leagueId, fadId) {
  identifier(leagueId, "League ID");
  identifier(fadId, "FAD ID");
  return queryOptions({
    queryKey: freeAgentDraftKeys.overview(leagueId, fadId),
    queryFn: async ({ signal }) => {
      const data = await getFreeAgentDraftOverview(httpClient, leagueId, fadId, { signal });
      sameIdentity(data.leagueId, leagueId, "FAD overview league");
      sameIdentity(data.fadId, fadId, "FAD overview");
      return data;
    },
    meta: commonMeta(leagueId),
    staleTime: 5_000,
  });
}

export function privateCandidateCardQuery(
  httpClient,
  leagueId,
  fadId,
  teamId,
  authorizationInput
) {
  identifier(leagueId, "League ID");
  identifier(fadId, "FAD ID");
  identifier(teamId, "Team ID");
  const authorization = exactAuthorization(authorizationInput);
  return queryOptions({
    queryKey: freeAgentDraftKeys.privateCard(leagueId, fadId, teamId),
    queryFn: async ({ signal }) =>
      ensurePrivateCardScope(
        await getPrivateCandidateCard(httpClient, leagueId, fadId, teamId, { signal }),
        { leagueId, fadId, teamId, authorization }
      ),
    meta: protectedMeta(leagueId, teamId, authorization),
    staleTime: 5_000,
  });
}

export function publishedCandidateCardsQuery(
  httpClient,
  leagueId,
  fadId,
  { limit = 50 } = {}
) {
  identifier(leagueId, "League ID");
  identifier(fadId, "FAD ID");
  const filters = Object.freeze({ limit: boundedLimit(limit) });
  return infiniteQueryOptions({
    queryKey: freeAgentDraftKeys.historyCards(leagueId, fadId, filters),
    initialPageParam: null,
    queryFn: ({ pageParam, signal }) =>
      getPublishedCandidateCards(httpClient, leagueId, fadId, {
        limit: filters.limit,
        cursor: pageParam,
        signal,
      }).then((page) => {
        for (const summary of page.items) {
          sameIdentity(summary.leagueId, leagueId, "Published Candidate Card league");
          sameIdentity(summary.fadId, fadId, "Published Candidate Card FAD");
        }
        return page;
      }),
    getNextPageParam: (lastPage) =>
      lastPage.page.hasMore ? lastPage.page.nextCursor : undefined,
    meta: commonMeta(leagueId),
    staleTime: 30_000,
  });
}

export function publishedCandidateCardQuery(httpClient, leagueId, fadId, teamId) {
  identifier(leagueId, "League ID");
  identifier(fadId, "FAD ID");
  identifier(teamId, "Team ID");
  return queryOptions({
    queryKey: freeAgentDraftKeys.historyCard(leagueId, fadId, teamId),
    queryFn: async ({ signal }) => {
      const data = await getPublishedCandidateCard(httpClient, leagueId, fadId, teamId, { signal });
      sameIdentity(data.leagueId, leagueId, "Published Candidate Card league");
      sameIdentity(data.fadId, fadId, "Published Candidate Card FAD");
      sameIdentity(data.teamId, teamId, "Published Candidate Card team");
      return data;
    },
    meta: commonMeta(leagueId),
    staleTime: 30_000,
  });
}

export function freeAgentDraftResultsQuery(
  httpClient,
  leagueId,
  fadId,
  { q = "", status = null, limit = 50 } = {}
) {
  identifier(leagueId, "League ID");
  identifier(fadId, "FAD ID");
  if (status !== null && !FAD_ALLOCATION_STATUSES.includes(status)) {
    throw new TypeError("The FAD allocation-result status is invalid.");
  }
  const filters = Object.freeze({
    q: normalizedSearch(q),
    status,
    limit: boundedLimit(limit),
  });
  return infiniteQueryOptions({
    queryKey: freeAgentDraftKeys.results(leagueId, fadId, filters),
    initialPageParam: null,
    queryFn: ({ pageParam, signal }) =>
      getFreeAgentDraftResults(httpClient, leagueId, fadId, {
        ...filters,
        cursor: pageParam,
        signal,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.page.hasMore ? lastPage.page.nextCursor : undefined,
    meta: commonMeta(leagueId),
    staleTime: 10_000,
  });
}

export function freeAgentDraftRecoveryQuery(httpClient, leagueId, fadId) {
  identifier(leagueId, "League ID");
  identifier(fadId, "FAD ID");
  return queryOptions({
    queryKey: freeAgentDraftKeys.recovery(leagueId, fadId),
    queryFn: async ({ signal }) => {
      const data = await getFreeAgentDraftRecovery(httpClient, leagueId, fadId, {
        signal,
      });
      sameIdentity(data.fad.leagueId, leagueId, "FAD recovery league");
      sameIdentity(data.fad.fadId, fadId, "FAD recovery");
      return data;
    },
    meta: commonMeta(leagueId),
    staleTime: 5_000,
  });
}

export function eligibleCandidatePlayersQuery(
  httpClient,
  leagueId,
  fadId,
  teamId,
  slotKey,
  { q = "", limit = 50, authorization: authorizationInput } = {}
) {
  identifier(leagueId, "League ID");
  identifier(fadId, "FAD ID");
  identifier(teamId, "Team ID");
  if (!SLOT_KEY.test(slotKey || "")) throw new TypeError("Candidate slot key is invalid.");
  const filters = Object.freeze({
    q: normalizedSearch(q),
    limit: boundedLimit(limit),
  });
  const authorization = exactAuthorization(authorizationInput);
  return infiniteQueryOptions({
    queryKey: freeAgentDraftKeys.eligiblePlayers(
      leagueId,
      fadId,
      teamId,
      slotKey,
      filters
    ),
    initialPageParam: null,
    queryFn: ({ pageParam, signal }) =>
      getEligibleCandidatePlayers(httpClient, leagueId, fadId, teamId, {
        slotKey,
        q: filters.q,
        limit: filters.limit,
        cursor: pageParam,
        signal,
      }).then((page) => {
        const bench = slotKey[0] === "B";
        for (const item of page.items) {
          if (
            (!bench && item.effectivePositionGroup !== slotKey[0]) ||
            item.contractLimits.maximumBenchAavCents !== (bench ? 400 : null)
          ) {
            throw new ResponseContractError(
              "Eligible Candidate player slot scope is mismatched."
            );
          }
        }
        return page;
      }),
    getNextPageParam: (lastPage) =>
      lastPage.page.hasMore ? lastPage.page.nextCursor : undefined,
    meta: protectedMeta(leagueId, teamId, authorization),
    staleTime: 30_000,
  });
}
