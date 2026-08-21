import { ApiError } from "../../shared/api/ApiError.js";

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const PRIVATE_KINDS = new Set(["private-card", "eligible-players"]);
const VIEWER_SENSITIVE_RESULT_KINDS = new Set([
  "history-cards",
  "history-card",
  "results",
]);
const PRIVATE_PHASES = new Set(["cards_open", "help_window", "deadline_processing"]);
const AUTHORIZATION_SCOPES = new Set([
  "team_manager",
  "help_grant_commissioner",
  "help_grant_platform_administrator",
]);

function stableId(value, description) {
  if (typeof value !== "string" || !UUID_V4.test(value)) {
    throw new TypeError(`${description} is invalid.`);
  }
  return value;
}

function queryKey(value) {
  return Array.isArray(value) ? value : value?.queryKey;
}

function evidenceIdentity(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).sort().join("|") !== "id|kind" ||
    !["manager_assignment", "help_request"].includes(value.kind) ||
    !UUID_V4.test(value.id || "")
  ) {
    throw new TypeError("Candidate Card authorization evidence is invalid.");
  }
  return `${value.kind}:${value.id}`;
}

function queryClientMethods(queryClient) {
  if (
    !queryClient ||
    typeof queryClient.cancelQueries !== "function" ||
    typeof queryClient.removeQueries !== "function" ||
    typeof queryClient.getQueryCache !== "function"
  ) {
    throw new TypeError("Candidate Card cache cleanup requires a Query Client.");
  }
  return queryClient;
}

export function isFreeAgentDraftQuery(query) {
  const key = queryKey(query);
  return (
    Array.isArray(key) &&
    key[0] === "league" &&
    typeof key[1] === "string" &&
    key[2] === "free-agent-draft"
  );
}

export function isPrivateCandidateQuery(query) {
  const key = queryKey(query);
  return (
    isFreeAgentDraftQuery(query) &&
    PRIVATE_KINDS.has(key[4]) &&
    typeof key[3] === "string" &&
    typeof key[5] === "string"
  );
}

export function isViewerSensitiveFadResultQuery(query) {
  const key = queryKey(query);
  if (
    !isFreeAgentDraftQuery(query) ||
    !VIEWER_SENSITIVE_RESULT_KINDS.has(key[4]) ||
    query?.meta?.private !== true ||
    query.meta.leagueId !== key[1] ||
    query.meta.viewerSensitiveFadResults !== true
  ) {
    return false;
  }
  if (key[4] === "history-cards") {
    return query.meta.teamId === null;
  }
  return typeof key[5] === "string" && query.meta.teamId === key[5];
}

function recordEvidence(value) {
  try {
    evidenceIdentity(value);
    return true;
  } catch {
    return false;
  }
}

function hasCanonicalPrivateMeta(query) {
  const key = query.queryKey;
  return (
    query.meta?.private === true &&
    query.meta.leagueId === key[1] &&
    query.meta.teamId === key[5] &&
    AUTHORIZATION_SCOPES.has(query.meta.authorizationScope) &&
    recordEvidence(query.meta.authorizationEvidence)
  );
}

function privateScopePredicate({
  leagueId,
  fadId = null,
  teamId = null,
  authorizationScope = null,
  authorizationEvidence = null,
}) {
  stableId(leagueId, "League ID");
  if (fadId !== null) stableId(fadId, "FAD ID");
  if (teamId !== null) stableId(teamId, "Team ID");
  if (authorizationScope !== null && !AUTHORIZATION_SCOPES.has(authorizationScope)) {
    throw new TypeError("Candidate Card authorization scope is invalid.");
  }
  const evidence =
    authorizationEvidence === null ? null : evidenceIdentity(authorizationEvidence);

  return (query) => {
    if (!isPrivateCandidateQuery(query)) return false;
    const key = query.queryKey;
    if (
      key[1] !== leagueId ||
      (fadId !== null && key[3] !== fadId) ||
      (teamId !== null && key[5] !== teamId)
    ) {
      return false;
    }
    if (!hasCanonicalPrivateMeta(query)) return true;
    return (
      (authorizationScope === null ||
        query.meta.authorizationScope === authorizationScope) &&
      (evidence === null ||
        evidenceIdentity(query.meta.authorizationEvidence) === evidence)
    );
  };
}

async function cancelAndRemove(queryClient, predicate) {
  const client = queryClientMethods(queryClient);
  const count = client.getQueryCache().findAll({ predicate }).length;
  await client.cancelQueries({ predicate });
  client.removeQueries({ predicate });
  return count;
}

export function removePrivateCandidateQueries(queryClient, scope) {
  return cancelAndRemove(queryClient, privateScopePredicate(scope));
}

export function removeViewerSensitiveFadResultQueries(
  queryClient,
  { leagueId, fadId, teamId }
) {
  stableId(leagueId, "League ID");
  stableId(fadId, "FAD ID");
  stableId(teamId, "Team ID");
  return cancelAndRemove(queryClient, (query) => {
    const key = query?.queryKey;
    return (
      isViewerSensitiveFadResultQuery(query) &&
      key[1] === leagueId &&
      key[3] === fadId &&
      key[4] === "results" &&
      key[5] === teamId
    );
  });
}

export function sweepPrivateCandidateQueries(
  queryClient,
  {
    leagueId,
    fadId,
    phase,
    serverNowMs,
    candidateDeadlineAtMs,
    authorizationEvidence,
  }
) {
  stableId(leagueId, "League ID");
  stableId(fadId, "FAD ID");
  if (!Array.isArray(authorizationEvidence)) {
    throw new TypeError("Candidate Card authorization evidence must be an array.");
  }
  const retainedEvidence = new Set(authorizationEvidence.map(evidenceIdentity));
  if (!Number.isSafeInteger(serverNowMs) || serverNowMs < 0) {
    throw new TypeError("Server time is invalid.");
  }
  if (
    candidateDeadlineAtMs !== null &&
    (!Number.isSafeInteger(candidateDeadlineAtMs) || candidateDeadlineAtMs < 0)
  ) {
    throw new TypeError("Candidate Card deadline is invalid.");
  }
  const phaseRetainsPrivateData = PRIVATE_PHASES.has(phase);
  const beforeDeadline =
    candidateDeadlineAtMs !== null && serverNowMs < candidateDeadlineAtMs;
  return cancelAndRemove(queryClient, (query) => {
    if (!isPrivateCandidateQuery(query)) return false;
    const key = query.queryKey;
    if (key[1] !== leagueId || key[3] !== fadId) return false;
    if (!hasCanonicalPrivateMeta(query)) return true;
    return (
      !phaseRetainsPrivateData ||
      !beforeDeadline ||
      !retainedEvidence.has(evidenceIdentity(query.meta.authorizationEvidence))
    );
  });
}

export function isCandidateAuthorizationError(error) {
  return (
    error instanceof ApiError &&
    (
      error.status === 403 ||
      error.status === 404 ||
      (
        error.status === 409 &&
        ["FAD_PHASE_CONFLICT", "FAD_DEADLINE_PASSED"].includes(error.code)
      )
    )
  );
}
