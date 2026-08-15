import { ResponseContractError } from "../../shared/api/responseContracts.js";
import {
  FAD_RECOVERY_ACTIONS,
  validateCandidateCardHelp,
  validateCandidateCardMutation,
  validateCandidateCardRevisionPreview,
  validateCandidateCardSave,
  validateEligibleCandidatePlayers,
  validateFreeAgentDraftAllocationResults,
  validateFreeAgentDraftCorrection,
  validateFreeAgentDraftCorrectionPreview,
  validateFreeAgentDraftNavigation,
  validateFreeAgentDraftOverview,
  validateFreeAgentDraftPage,
  validateFreeAgentDraftReadiness,
  validateFreeAgentDraftReadinessRetry,
  validateFreeAgentDraftRecovery,
  validateFreeAgentDraftRecoveryAction,
  validatePrivateCandidateCard,
  validatePublishedCandidateCard,
  validatePublishedCandidateCardSummaries,
} from "./freeAgentDraftContracts.js";

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const IDEMPOTENCY_KEY = /^[\x21-\x7E]{1,128}$/;
const SLOT_KEY = /^(?:F(?:0[1-9]|1[0-2])|D0[1-6]|B0[1-4])$/;
const CANDIDATE_CARD_SLOT_KEYS = Object.freeze([
  ...Array.from({ length: 12 }, (_, index) =>
    `F${String(index + 1).padStart(2, "0")}`
  ),
  ...Array.from({ length: 6 }, (_, index) =>
    `D${String(index + 1).padStart(2, "0")}`
  ),
  ...Array.from({ length: 4 }, (_, index) =>
    `B${String(index + 1).padStart(2, "0")}`
  ),
]);
const SHA256_HEX = /^[0-9a-f]{64}$/;
const part = (value) => encodeURIComponent(value);

function exactInput(value, fields, description) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getOwnPropertySymbols(value).length !== 0 ||
    Object.keys(value).sort().join("|") !== [...fields].sort().join("|")
  ) {
    throw new TypeError(`${description} is invalid.`);
  }
  return value;
}

function stableId(value, description) {
  if (typeof value !== "string" || !UUID_V4.test(value)) {
    throw new TypeError(`${description} is invalid.`);
  }
  return value;
}

function validatedIdempotencyKey(value) {
  if (
    typeof value !== "string" ||
    value !== value.trim() ||
    !IDEMPOTENCY_KEY.test(value)
  ) {
    throw new TypeError("The FAD idempotency key is invalid.");
  }
  return value;
}

function boundedReason(value, description) {
  const hasControl =
    typeof value === "string" &&
    Array.from(value).some((character) => {
      const codePoint = character.codePointAt(0);
      return (
        codePoint <= 31 ||
        (codePoint >= 127 && codePoint <= 159) ||
        codePoint === 8_232 ||
        codePoint === 8_233
      );
    });
  if (
    typeof value !== "string" ||
    value !== value.trim() ||
    value.length === 0 ||
    Array.from(value).length > 500 ||
    hasControl
  ) {
    throw new TypeError(`${description} is invalid.`);
  }
  return value;
}

function writeOptions(options) {
  exactInput(
    options,
    ["version", "idempotencyKey"],
    "Candidate Card write options"
  );
  if (!Number.isSafeInteger(options.version) || options.version < 1) {
    throw new TypeError("Candidate Card version is invalid.");
  }
  validatedIdempotencyKey(options.idempotencyKey);
  return options;
}

function contractTerms(input, fields, description) {
  exactInput(input, fields, description);
  if (
    "aavCents" in input &&
    (!Number.isSafeInteger(input.aavCents) ||
      input.aavCents < 100 ||
      input.aavCents % 25 !== 0)
  ) {
    throw new TypeError(`${description} AAV is invalid.`);
  }
  if (
    "termYears" in input &&
    (!Number.isSafeInteger(input.termYears) ||
      input.termYears < 1 ||
      input.termYears > 3)
  ) {
    throw new TypeError(`${description} term is invalid.`);
  }
  return input;
}

function previewAction(action) {
  const fields = {
    add: ["type", "slotKey", "playerId", "aavCents", "termYears"],
    edit: ["type", "entryId", "aavCents", "termYears"],
    move: ["type", "entryId", "slotKey"],
    remove: ["type", "entryId"],
  }[action?.type];
  exactInput(action, fields || [], "Candidate Card preview action");
  if ("slotKey" in action && !SLOT_KEY.test(action.slotKey || "")) {
    throw new TypeError("Candidate Card preview slot is invalid.");
  }
  if ("playerId" in action) stableId(action.playerId, "Candidate Card preview player ID");
  if ("entryId" in action) stableId(action.entryId, "Candidate Card preview entry ID");
  if ("aavCents" in action || "termYears" in action) {
    contractTerms(action, fields, "Candidate Card preview action");
  }
  return action;
}

function fadPath(leagueId) {
  return `/api/v1/leagues/${part(leagueId)}/free-agent-drafts`;
}

function cardPath(leagueId, fadId, teamId) {
  return `${fadPath(leagueId)}/${part(fadId)}/candidate-cards/${part(teamId)}`;
}

function requirePage(response, description) {
  if (!response.page) {
    throw new ResponseContractError(`${description} page is missing.`);
  }
  return Object.freeze({ items: response.data, page: response.page });
}

export async function getFreeAgentDraftNavigation(
  httpClient,
  leagueId,
  { rosterSeasonId = null, rosterTeamId = null, signal } = {}
) {
  if ((rosterSeasonId === null) !== (rosterTeamId === null)) {
    throw new TypeError("FAD roster navigation requires both season and team IDs.");
  }
  const search = new URLSearchParams();
  if (rosterSeasonId !== null) {
    search.set("rosterSeasonId", rosterSeasonId);
    search.set("rosterTeamId", rosterTeamId);
  }
  const suffix = search.size ? `?${search}` : "";
  const response = await httpClient.request(
    `${fadPath(leagueId)}/navigation${suffix}`,
    {
      authenticated: true,
      dataKind: "object",
      validateData: validateFreeAgentDraftNavigation,
      signal,
    }
  );
  return response.data;
}

export async function getFreeAgentDraftReadiness(
  httpClient,
  leagueId,
  seasonId,
  { signal } = {}
) {
  const search = new URLSearchParams({ seasonId });
  const response = await httpClient.request(
    `${fadPath(leagueId)}/readiness?${search}`,
    {
      authenticated: true,
      dataKind: "object",
      validateData: validateFreeAgentDraftReadiness,
      signal,
    }
  );
  return response.data;
}

export async function retryFreeAgentDraftReadiness(
  httpClient,
  leagueId,
  input,
  options
) {
  exactInput(
    input,
    ["seasonId", "readinessOperationId", "confirmation"],
    "FAD readiness retry body"
  );
  stableId(input.seasonId, "FAD readiness retry season ID");
  stableId(input.readinessOperationId, "FAD readiness operation ID");
  if (input.confirmation !== "RETRY FREE AGENT DRAFT READINESS") {
    throw new TypeError("FAD readiness retry confirmation is invalid.");
  }
  const command = writeOptions(options);
  const response = await httpClient.request(
    `${fadPath(leagueId)}/readiness/retries`,
    {
      method: "POST",
      authenticated: true,
      body: input,
      version: command.version,
      idempotencyKey: command.idempotencyKey,
      dataKind: "object",
      validateData: validateFreeAgentDraftReadinessRetry,
    }
  );
  return response.data;
}

export async function getFreeAgentDraftOverview(
  httpClient,
  leagueId,
  fadId,
  { signal } = {}
) {
  const response = await httpClient.request(`${fadPath(leagueId)}/${part(fadId)}`, {
    authenticated: true,
    dataKind: "object",
    validateData: validateFreeAgentDraftOverview,
    signal,
  });
  return response.data;
}

export async function getPrivateCandidateCard(
  httpClient,
  leagueId,
  fadId,
  teamId,
  { signal } = {}
) {
  const response = await httpClient.request(
    `${cardPath(leagueId, fadId, teamId)}/private`,
    {
      authenticated: true,
      dataKind: "object",
      validateData: validatePrivateCandidateCard,
      signal,
    }
  );
  return response.data;
}

export async function getPublishedCandidateCards(
  httpClient,
  leagueId,
  fadId,
  { limit, cursor = null, signal }
) {
  const search = new URLSearchParams({ limit: String(limit) });
  if (cursor) search.set("cursor", cursor);
  const response = await httpClient.request(
    `${fadPath(leagueId)}/${part(fadId)}/candidate-cards?${search}`,
    {
      authenticated: true,
      dataKind: "array",
      validateData: validatePublishedCandidateCardSummaries,
      validatePage: validateFreeAgentDraftPage,
      signal,
    }
  );
  return requirePage(response, "Published Candidate Card");
}

export async function getPublishedCandidateCard(
  httpClient,
  leagueId,
  fadId,
  teamId,
  { signal } = {}
) {
  const response = await httpClient.request(
    `${cardPath(leagueId, fadId, teamId)}/history`,
    {
      authenticated: true,
      dataKind: "object",
      validateData: validatePublishedCandidateCard,
      signal,
    }
  );
  return response.data;
}

export async function getFreeAgentDraftResults(
  httpClient,
  leagueId,
  fadId,
  { q, status = null, limit, cursor = null, signal }
) {
  const search = new URLSearchParams({ q, limit: String(limit) });
  if (status) search.set("status", status);
  if (cursor) search.set("cursor", cursor);
  const response = await httpClient.request(
    `${fadPath(leagueId)}/${part(fadId)}/results?${search}`,
    {
      authenticated: true,
      dataKind: "array",
      validateData: validateFreeAgentDraftAllocationResults,
      validatePage: validateFreeAgentDraftPage,
      signal,
    }
  );
  return requirePage(response, "Free Agent Draft result");
}

export async function getFreeAgentDraftRecovery(
  httpClient,
  leagueId,
  fadId,
  { signal } = {}
) {
  const response = await httpClient.request(
    `${fadPath(leagueId)}/${part(fadId)}/recovery`,
    {
      authenticated: true,
      dataKind: "object",
      validateData: validateFreeAgentDraftRecovery,
      signal,
    }
  );
  return response.data;
}

export async function acceptFreeAgentDraftRecoveryAction(
  httpClient,
  leagueId,
  fadId,
  input,
  { idempotencyKey }
) {
  exactInput(input, ["action", "resourceId", "reason"], "FAD recovery action body");
  if (!FAD_RECOVERY_ACTIONS.includes(input.action)) {
    throw new TypeError("FAD recovery action is invalid.");
  }
  const nullResource = ["retry_deadline", "complete_fad"].includes(input.action);
  if (nullResource) {
    if (input.resourceId !== null) {
      throw new TypeError("FAD recovery action resource is invalid.");
    }
  } else {
    stableId(input.resourceId, "FAD recovery action resource ID");
  }
  boundedReason(input.reason, "FAD recovery action reason");
  const response = await httpClient.request(
    `${fadPath(leagueId)}/${part(fadId)}/recovery/actions`,
    {
      method: "POST",
      authenticated: true,
      body: input,
      idempotencyKey: validatedIdempotencyKey(idempotencyKey),
      dataKind: "object",
      validateData: validateFreeAgentDraftRecoveryAction,
    }
  );
  return response.data;
}

export async function previewFreeAgentDraftCorrection(
  httpClient,
  leagueId,
  fadId,
  allocationId
) {
  stableId(allocationId, "FAD correction allocation ID");
  const response = await httpClient.request(
    `${fadPath(leagueId)}/${part(fadId)}/allocations/${part(allocationId)}/correction-previews`,
    {
      method: "POST",
      authenticated: true,
      body: { mode: "recompute_locked_snapshot" },
      dataKind: "object",
      validateData: validateFreeAgentDraftCorrectionPreview,
    }
  );
  return response.data;
}

export async function applyFreeAgentDraftCorrection(
  httpClient,
  leagueId,
  fadId,
  allocationId,
  input,
  options
) {
  stableId(allocationId, "FAD correction allocation ID");
  exactInput(
    input,
    ["mode", "previewFingerprint", "reason", "confirmation"],
    "FAD correction body"
  );
  if (
    input.mode !== "recompute_locked_snapshot" ||
    typeof input.previewFingerprint !== "string" ||
    !SHA256_HEX.test(input.previewFingerprint) ||
    input.confirmation !== "APPLY FAD CORRECTION"
  ) {
    throw new TypeError("FAD correction body is invalid.");
  }
  boundedReason(input.reason, "FAD correction reason");
  const command = writeOptions(options);
  const response = await httpClient.request(
    `${fadPath(leagueId)}/${part(fadId)}/allocations/${part(allocationId)}/corrections`,
    {
      method: "POST",
      authenticated: true,
      body: input,
      version: command.version,
      idempotencyKey: command.idempotencyKey,
      dataKind: "object",
      validateData: validateFreeAgentDraftCorrection,
    }
  );
  return response.data;
}

export async function getEligibleCandidatePlayers(
  httpClient,
  leagueId,
  fadId,
  teamId,
  { slotKey, q, limit, cursor = null, signal }
) {
  const search = new URLSearchParams({ slotKey, q, limit: String(limit) });
  if (cursor) search.set("cursor", cursor);
  const response = await httpClient.request(
    `${cardPath(leagueId, fadId, teamId)}/eligible-players?${search}`,
    {
      authenticated: true,
      dataKind: "array",
      validateData: validateEligibleCandidatePlayers,
      validatePage: validateFreeAgentDraftPage,
      signal,
    }
  );
  return requirePage(response, "Eligible Candidate player");
}

export async function previewCandidateCardRevision(
  httpClient,
  leagueId,
  fadId,
  teamId,
  action
) {
  previewAction(action);
  const response = await httpClient.request(
    `${cardPath(leagueId, fadId, teamId)}/revision-previews`,
    {
      method: "POST",
      authenticated: true,
      body: { action },
      dataKind: "object",
      validateData: validateCandidateCardRevisionPreview,
    }
  );
  return response.data;
}

async function candidateMutation(httpClient, path, method, body, options) {
  const command = writeOptions(options);
  const response = await httpClient.request(path, {
    method,
    authenticated: true,
    ...(body === undefined ? {} : { body }),
    version: command.version,
    idempotencyKey: command.idempotencyKey,
    dataKind: "object",
    validateData: validateCandidateCardMutation,
  });
  return response.data;
}

function wholeCardDraft(input) {
  exactInput(input, ["slots"], "Candidate Card save body");
  if (!Array.isArray(input.slots) || input.slots.length !== 22) {
    throw new TypeError("Candidate Card save slots are invalid.");
  }
  input.slots.forEach((slot, index) => {
    exactInput(slot, ["slotKey", "candidate"], "Candidate Card save slot");
    if (slot.slotKey !== CANDIDATE_CARD_SLOT_KEYS[index]) {
      throw new TypeError("Candidate Card save slot order is invalid.");
    }
    if (slot.candidate === null) return;
    exactInput(
      slot.candidate,
      ["playerId", "aavCents", "termYears"],
      "Candidate Card save candidate"
    );
    stableId(slot.candidate.playerId, "Candidate Card save player ID");
    if (
      slot.candidate.aavCents !== null &&
      (!Number.isSafeInteger(slot.candidate.aavCents) ||
        slot.candidate.aavCents < 100 ||
        slot.candidate.aavCents % 25 !== 0)
    ) {
      throw new TypeError("Candidate Card save candidate AAV is invalid.");
    }
    if (
      slot.candidate.termYears !== null &&
      (!Number.isSafeInteger(slot.candidate.termYears) ||
        slot.candidate.termYears < 1 ||
        slot.candidate.termYears > 3)
    ) {
      throw new TypeError("Candidate Card save candidate term is invalid.");
    }
  });
  return input;
}

export async function saveCandidateCard(
  httpClient,
  leagueId,
  fadId,
  teamId,
  input,
  options
) {
  wholeCardDraft(input);
  const command = writeOptions(options);
  const response = await httpClient.request(cardPath(leagueId, fadId, teamId), {
    method: "PUT",
    authenticated: true,
    body: input,
    version: command.version,
    idempotencyKey: command.idempotencyKey,
    dataKind: "object",
    validateData: validateCandidateCardSave,
  });
  return response.data;
}

export function addCandidateCardCandidate(
  httpClient,
  leagueId,
  fadId,
  teamId,
  slotKey,
  input,
  options
) {
  if (!SLOT_KEY.test(slotKey || "")) {
    throw new TypeError("Candidate Card slot key is invalid.");
  }
  contractTerms(
    input,
    ["playerId", "aavCents", "termYears"],
    "Candidate Card add body"
  );
  stableId(input.playerId, "Candidate Card player ID");
  return candidateMutation(
    httpClient,
    `${cardPath(leagueId, fadId, teamId)}/slots/${part(slotKey)}/candidate`,
    "PUT",
    input,
    options
  );
}

export function editCandidateCardCandidate(
  httpClient,
  leagueId,
  fadId,
  teamId,
  entryId,
  input,
  options
) {
  stableId(entryId, "Candidate Card entry ID");
  contractTerms(
    input,
    ["aavCents", "termYears"],
    "Candidate Card edit body"
  );
  return candidateMutation(
    httpClient,
    `${cardPath(leagueId, fadId, teamId)}/entries/${part(entryId)}`,
    "PATCH",
    input,
    options
  );
}

export function moveCandidateCardEntry(
  httpClient,
  leagueId,
  fadId,
  teamId,
  entryId,
  input,
  options
) {
  stableId(entryId, "Candidate Card entry ID");
  exactInput(input, ["slotKey"], "Candidate Card move body");
  if (!SLOT_KEY.test(input.slotKey || "")) {
    throw new TypeError("Candidate Card destination slot is invalid.");
  }
  return candidateMutation(
    httpClient,
    `${cardPath(leagueId, fadId, teamId)}/entries/${part(entryId)}/move`,
    "POST",
    input,
    options
  );
}

export function removeCandidateCardCandidate(
  httpClient,
  leagueId,
  fadId,
  teamId,
  entryId,
  options
) {
  stableId(entryId, "Candidate Card entry ID");
  return candidateMutation(
    httpClient,
    `${cardPath(leagueId, fadId, teamId)}/entries/${part(entryId)}`,
    "DELETE",
    undefined,
    options
  );
}

export async function requestCandidateCardHelp(
  httpClient,
  leagueId,
  fadId,
  teamId,
  input,
  { idempotencyKey }
) {
  exactInput(
    input,
    input && Object.hasOwn(input, "message") ? ["message"] : [],
    "Candidate Card help body"
  );
  if (
    Object.hasOwn(input, "message") &&
    input.message !== null &&
    typeof input.message !== "string"
  ) {
    throw new TypeError("Candidate Card help message is invalid.");
  }
  const key = validatedIdempotencyKey(idempotencyKey);
  const response = await httpClient.request(
    `${cardPath(leagueId, fadId, teamId)}/help-requests`,
    {
      method: "POST",
      authenticated: true,
      body: input,
      idempotencyKey: key,
      dataKind: "object",
      validateData: validateCandidateCardHelp,
    }
  );
  return response.data;
}
