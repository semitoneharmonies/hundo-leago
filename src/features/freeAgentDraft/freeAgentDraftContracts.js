import { ResponseContractError } from "../../shared/api/responseContracts.js";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SAFE_CODE = /^[A-Z][A-Z0-9_]{0,99}$/;
const SHA256_HEX = /^[0-9a-f]{64}$/;
const BASE64URL = /^[A-Za-z0-9_-]+$/;
const SLOT_KEYS = Object.freeze([
  ...Array.from({ length: 12 }, (_, index) => `F${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 6 }, (_, index) => `D${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 4 }, (_, index) => `B${String(index + 1).padStart(2, "0")}`),
]);

export const FAD_AUTHORIZATION_SCOPES = Object.freeze([
  "team_manager",
  "help_grant_commissioner",
  "help_grant_platform_administrator",
]);

export const FAD_ALLOCATION_STATUSES = Object.freeze([
  "pending",
  "automatic_award",
  "restricted_scheduled",
  "restricted_active",
  "restricted_fallback_open",
  "restricted_resolved",
  "fallback_open_resolved",
  "no_valid_offer",
  "invalid",
  "correction_required",
]);

export const FAD_RECOVERY_ACTIONS = Object.freeze([
  "retry_deadline",
  "retry_allocation",
  "activate_restricted",
  "activate_queued_nomination",
  "activate_fallback",
  "retry_auction_resolution",
  "finalize_rollover",
  "complete_fad",
]);

const FAD_RECOVERY_OPERATION_KINDS = Object.freeze([
  "deadline",
  "allocation",
  "restricted_activation",
  "queued_nomination_activation",
  "fallback_activation",
  "auction_resolution",
  "completion",
]);
const FAD_RECOVERY_OPERATION_STATUSES = Object.freeze([
  "pending",
  "leased",
  "running",
  "succeeded",
  "failed",
]);
const FAD_ALLOCATION_OPERATION_KINDS = new Set([
  "allocation",
  "restricted_activation",
]);
const FAD_RAPID_OPERATION_KINDS = new Set([
  "queued_nomination_activation",
  "fallback_activation",
  "auction_resolution",
]);
const FAD_RECOVERY_KINDS = Object.freeze([
  "deadline_retry",
  "allocation_retry",
  "restricted_activation",
  "queued_nomination_activation",
  "fallback_activation",
  "auction_resolution",
  "rollover_finalize",
  "completion",
]);
const FAD_RECOVERY_RESOLVED_AUTHORITIES = new Set([
  "system",
  "commissioner",
  "platform_administrator_as_commissioner",
]);

export function validateFreeAgentDraftPage(value) {
  exact(value, ["hasMore", "nextCursor"], "Free Agent Draft page");
  contract(
    typeof value.hasMore === "boolean",
    "Free Agent Draft page.hasMore is invalid."
  );
  if (value.nextCursor !== null) {
    contract(
      typeof value.nextCursor === "string" &&
        Array.from(value.nextCursor).length >= 1 &&
        Array.from(value.nextCursor).length <= 1_024 &&
        BASE64URL.test(value.nextCursor) &&
        value.nextCursor.length % 4 !== 1,
      "Free Agent Draft page.nextCursor is invalid."
    );
  }
  contract(
    value.hasMore === (value.nextCursor !== null),
    "Free Agent Draft page cursor state is inconsistent."
  );
  return true;
}

const ACTION_REASON_CODES = new Set([
  "NOT_AUTHORIZED",
  "HELP_NOT_GRANTED",
  "PHASE_CLOSED",
  "DEADLINE_PASSED",
  "LEAGUE_FROZEN",
  "SLOT_LOCKED",
  "SLOT_OCCUPIED",
  "ENTRY_NOT_EDITABLE",
  "PLAYER_INELIGIBLE",
  "TEAM_NOT_PARTICIPANT",
  "COOLDOWN_ACTIVE",
  "EDIT_LIMIT_REACHED",
  "PLAYER_QUARANTINED",
  "RECOVERY_NOT_AVAILABLE",
  "PREVIEW_ONLY",
]);

function contract(condition, message) {
  if (!condition) throw new ResponseContractError(message);
}

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exact(value, fields, location) {
  contract(record(value), `${location} must be an object.`);
  contract(
    Object.getOwnPropertySymbols(value).length === 0 &&
      Object.keys(value).sort().join("|") === [...fields].sort().join("|"),
    `${location} has an invalid shape.`
  );
  return value;
}

function oneOf(value, values, location) {
  contract(values.includes(value), `${location} is invalid.`);
  return value;
}

function stableId(value, location) {
  contract(typeof value === "string" && UUID.test(value), `${location} is invalid.`);
  return value;
}

function nullableId(value, location) {
  if (value !== null) stableId(value, location);
  return value;
}

function safeInteger(value, location, { positive = false } = {}) {
  contract(
    Number.isSafeInteger(value) && (positive ? value >= 1 : value >= 0),
    `${location} is invalid.`
  );
  return value;
}

function nullableInteger(value, location, options) {
  if (value !== null) safeInteger(value, location, options);
  return value;
}

function text(value, location, { nullable = false } = {}) {
  if (nullable && value === null) return value;
  contract(
    typeof value === "string" && value.length > 0 && value === value.trim(),
    `${location} is invalid.`
  );
  return value;
}

function actionCapability(value, location) {
  exact(value, ["allowed", "reasonCode"], location);
  contract(typeof value.allowed === "boolean", `${location}.allowed is invalid.`);
  contract(
    value.allowed
      ? value.reasonCode === null
      : ACTION_REASON_CODES.has(value.reasonCode),
    `${location}.reasonCode is invalid.`
  );
  return true;
}

function capabilities(value, fields, location) {
  exact(value, fields, location);
  for (const field of fields) actionCapability(value[field], `${location}.${field}`);
  return true;
}

function safeTeam(value, location) {
  exact(
    value,
    [
      "teamId",
      "name",
      "primaryColour",
      "secondaryColour",
      "tertiaryColour",
      "patternTemplate",
      "logoReference",
    ],
    location
  );
  stableId(value.teamId, `${location}.teamId`);
  text(value.name, `${location}.name`);
  text(value.primaryColour, `${location}.primaryColour`);
  text(value.secondaryColour, `${location}.secondaryColour`);
  if (value.tertiaryColour !== null) text(value.tertiaryColour, `${location}.tertiaryColour`);
  text(value.patternTemplate, `${location}.patternTemplate`);
  if (value.logoReference !== null) text(value.logoReference, `${location}.logoReference`);
  return true;
}

function safePlayer(value, location) {
  exact(value, ["playerId", "fullName", "positionGroup"], location);
  stableId(value.playerId, `${location}.playerId`);
  text(value.fullName, `${location}.fullName`);
  oneOf(value.positionGroup, ["F", "D"], `${location}.positionGroup`);
  return true;
}

function authorizationEvidence(value, location) {
  exact(value, ["kind", "id"], location);
  oneOf(value.kind, ["manager_assignment", "help_request"], `${location}.kind`);
  stableId(value.id, `${location}.id`);
  return true;
}

function cardDescriptor(value, location) {
  exact(
    value,
    ["mode", "seasonId", "fadId", "teamId", "cardId", "authorizationEvidence"],
    location
  );
  oneOf(value.mode, ["private_card", "published_card"], `${location}.mode`);
  for (const field of ["seasonId", "fadId", "teamId", "cardId"]) {
    stableId(value[field], `${location}.${field}`);
  }
  if (value.mode === "private_card") {
    authorizationEvidence(value.authorizationEvidence, `${location}.authorizationEvidence`);
  } else {
    contract(value.authorizationEvidence === null, `${location}.authorizationEvidence is invalid.`);
  }
  return true;
}

function managedCardSummary(value, location, { descriptor = false, urgency = false } = {}) {
  const fields = [
    "teamId",
    "team",
    "cardId",
    "managerAssignmentId",
    "cardVersion",
    "lifecycleStatus",
    "completenessCode",
    "missingMandatoryCount",
    "conflictCount",
    "capStatus",
    "allocationEligibility",
    "helpRequestStatus",
    ...(descriptor ? ["cardDescriptor"] : []),
    ...(urgency ? ["urgencyCode"] : []),
  ];
  exact(value, fields, location);
  stableId(value.teamId, `${location}.teamId`);
  safeTeam(value.team, `${location}.team`);
  contract(value.team.teamId === value.teamId, `${location}.team is mismatched.`);
  stableId(value.cardId, `${location}.cardId`);
  stableId(value.managerAssignmentId, `${location}.managerAssignmentId`);
  safeInteger(value.cardVersion, `${location}.cardVersion`, { positive: true });
  oneOf(
    value.lifecycleStatus,
    ["open", "locked_complete", "locked_incomplete", "locked_conflicted"],
    `${location}.lifecycleStatus`
  );
  oneOf(value.completenessCode, ["complete", "incomplete", "conflicted"], `${location}.completenessCode`);
  safeInteger(value.missingMandatoryCount, `${location}.missingMandatoryCount`);
  safeInteger(value.conflictCount, `${location}.conflictCount`);
  oneOf(value.capStatus, ["compliant", "over_cap"], `${location}.capStatus`);
  oneOf(
    value.allocationEligibility,
    ["eligible", "excluded_structural_conflict", "excluded_over_cap"],
    `${location}.allocationEligibility`
  );
  oneOf(value.helpRequestStatus, ["not_requested", "active", "expired"], `${location}.helpRequestStatus`);
  if (descriptor) cardDescriptor(value.cardDescriptor, `${location}.cardDescriptor`);
  if (urgency) {
    oneOf(
      value.urgencyCode,
      [
        "DEADLINE_PROCESSING",
        "CARD_CONFLICTED",
        "HELP_WINDOW_INCOMPLETE",
        "CARD_INCOMPLETE",
        "RESTRICTED_ACTION_REQUIRED",
        "RAPID_AUCTIONS_ACTIVE",
        "NONE",
      ],
      `${location}.urgencyCode`
    );
  }
  return true;
}

export function validateFreeAgentDraftNavigation(data) {
  exact(
    data,
    [
      "serverNowMs",
      "timeZone",
      "fadId",
      "seasonId",
      "phase",
      "showMainNavigation",
      "candidateDeadlineAtMs",
      "nextRolloverAtMs",
      "frozenFadFirstMatchupStartsAtMs",
      "competitionFirstMatchupStartsAtMs",
      "managedCards",
      "rosterLinks",
      "urgencyCode",
    ],
    "FAD navigation"
  );
  safeInteger(data.serverNowMs, "FAD navigation.serverNowMs");
  text(data.timeZone, "FAD navigation.timeZone");
  nullableId(data.fadId, "FAD navigation.fadId");
  nullableId(data.seasonId, "FAD navigation.seasonId");
  oneOf(
    data.phase,
    ["inactive", "cards_open", "help_window", "deadline_processing", "allocating", "rapid", "completed"],
    "FAD navigation.phase"
  );
  contract(typeof data.showMainNavigation === "boolean", "FAD navigation visibility is invalid.");
  for (const field of [
    "candidateDeadlineAtMs",
    "nextRolloverAtMs",
    "frozenFadFirstMatchupStartsAtMs",
    "competitionFirstMatchupStartsAtMs",
  ]) {
    nullableInteger(data[field], `FAD navigation.${field}`);
  }
  contract(Array.isArray(data.managedCards), "FAD navigation.managedCards is invalid.");
  data.managedCards.forEach((card, index) => managedCardSummary(card, `FAD navigation.managedCards[${index}]`, { urgency: true }));
  contract(Array.isArray(data.rosterLinks), "FAD navigation.rosterLinks is invalid.");
  data.rosterLinks.forEach((descriptor, index) => cardDescriptor(descriptor, `FAD navigation.rosterLinks[${index}]`));
  oneOf(
    data.urgencyCode,
    [
      "DEADLINE_PROCESSING",
      "CARD_CONFLICTED",
      "HELP_WINDOW_INCOMPLETE",
      "CARD_INCOMPLETE",
      "RESTRICTED_ACTION_REQUIRED",
      "RAPID_AUCTIONS_ACTIVE",
      "NONE",
    ],
    "FAD navigation.urgencyCode"
  );
  contract(
    (data.fadId === null) === (data.seasonId === null),
    "FAD navigation identity is inconsistent."
  );
  return true;
}

function readinessWeek(value, location) {
  if (value === null) return true;
  exact(value, ["weekId", "sequence", "startsAtMs", "version"], location);
  stableId(value.weekId, `${location}.weekId`);
  contract(value.sequence === 1, `${location}.sequence is invalid.`);
  safeInteger(value.startsAtMs, `${location}.startsAtMs`);
  safeInteger(value.version, `${location}.version`, { positive: true });
  return true;
}

function readinessDiagnostic(value, location) {
  exact(value, ["code", "message", "resourceId"], location);
  contract(typeof value.code === "string" && SAFE_CODE.test(value.code), `${location}.code is invalid.`);
  text(value.message, `${location}.message`);
  if (value.resourceId !== null) text(value.resourceId, `${location}.resourceId`);
  return true;
}

function readinessTeam(value, location) {
  exact(
    value,
    [
      "teamId",
      "team",
      "managerReady",
      "managerAssignmentId",
      "carryoverCount",
      "openForwardSlots",
      "openDefenceSlots",
      "openBenchSlots",
      "structuralConflictCount",
    ],
    location
  );
  stableId(value.teamId, `${location}.teamId`);
  safeTeam(value.team, `${location}.team`);
  contract(value.team.teamId === value.teamId, `${location}.team is mismatched.`);
  contract(typeof value.managerReady === "boolean", `${location}.managerReady is invalid.`);
  if (value.managerReady) stableId(value.managerAssignmentId, `${location}.managerAssignmentId`);
  else contract(value.managerAssignmentId === null, `${location}.managerAssignmentId is invalid.`);
  for (const field of [
    "carryoverCount",
    "openForwardSlots",
    "openDefenceSlots",
    "openBenchSlots",
    "structuralConflictCount",
  ]) {
    safeInteger(value[field], `${location}.${field}`);
  }
  contract(value.openForwardSlots <= 12, `${location}.openForwardSlots is invalid.`);
  contract(value.openDefenceSlots <= 6, `${location}.openDefenceSlots is invalid.`);
  contract(value.openBenchSlots <= 4, `${location}.openBenchSlots is invalid.`);
  return true;
}

export function validateFreeAgentDraftReadiness(data) {
  exact(
    data,
    [
      "leagueId",
      "seasonId",
      "operationId",
      "operationVersion",
      "status",
      "triggerKind",
      "entryDraftId",
      "exemptionId",
      "serverNowMs",
      "timeZone",
      "observedSeasonVersion",
      "firstMatchupWeekBefore",
      "firstMatchupWeekAfter",
      "candidateDeadlineAtMs",
      "reminderAtMs",
      "helpOpensAtMs",
      "initialRollovers",
      "priorSeasonRollover",
      "participatingTeamCount",
      "teamProjections",
      "blockers",
      "warnings",
      "resultFadId",
      "retryReadiness",
    ],
    "FAD readiness"
  );
  stableId(data.leagueId, "FAD readiness.leagueId");
  stableId(data.seasonId, "FAD readiness.seasonId");
  nullableId(data.operationId, "FAD readiness.operationId");
  nullableInteger(data.operationVersion, "FAD readiness.operationVersion", { positive: true });
  oneOf(data.status, ["not_triggered", "pending", "running", "blocked", "succeeded"], "FAD readiness.status");
  if (data.triggerKind !== null) {
    oneOf(data.triggerKind, ["entry_draft_completed", "no_draft_inaugural", "no_draft_initial_season2"], "FAD readiness.triggerKind");
  }
  nullableId(data.entryDraftId, "FAD readiness.entryDraftId");
  nullableId(data.exemptionId, "FAD readiness.exemptionId");
  safeInteger(data.serverNowMs, "FAD readiness.serverNowMs");
  text(data.timeZone, "FAD readiness.timeZone");
  nullableInteger(data.observedSeasonVersion, "FAD readiness.observedSeasonVersion", { positive: true });
  readinessWeek(data.firstMatchupWeekBefore, "FAD readiness.firstMatchupWeekBefore");
  readinessWeek(data.firstMatchupWeekAfter, "FAD readiness.firstMatchupWeekAfter");
  for (const field of ["candidateDeadlineAtMs", "reminderAtMs", "helpOpensAtMs"]) {
    nullableInteger(data[field], `FAD readiness.${field}`);
  }
  contract(Array.isArray(data.initialRollovers), "FAD readiness.initialRollovers is invalid.");
  data.initialRollovers.forEach((rollover, index) => {
    const location = `FAD readiness.initialRollovers[${index}]`;
    exact(rollover, ["sequence", "opensAtMs", "creationCutoffAtMs", "rollsOverAtMs"], location);
    contract(rollover.sequence === index + 1, `${location}.sequence is invalid.`);
    for (const field of ["opensAtMs", "creationCutoffAtMs", "rollsOverAtMs"]) {
      safeInteger(rollover[field], `${location}.${field}`);
    }
  });
  if (data.priorSeasonRollover !== null) {
    exact(data.priorSeasonRollover, ["rolloverId", "fromSeasonId", "toSeasonId", "completedAtMs", "manifestSha256"], "FAD readiness.priorSeasonRollover");
    for (const field of ["rolloverId", "fromSeasonId", "toSeasonId"]) stableId(data.priorSeasonRollover[field], `FAD readiness.priorSeasonRollover.${field}`);
    safeInteger(data.priorSeasonRollover.completedAtMs, "FAD readiness.priorSeasonRollover.completedAtMs");
    contract(/^[0-9a-f]{64}$/.test(data.priorSeasonRollover.manifestSha256), "FAD readiness.priorSeasonRollover.manifestSha256 is invalid.");
  }
  safeInteger(data.participatingTeamCount, "FAD readiness.participatingTeamCount");
  contract(Array.isArray(data.teamProjections) && data.teamProjections.length === data.participatingTeamCount, "FAD readiness.teamProjections is invalid.");
  data.teamProjections.forEach((team, index) => readinessTeam(team, `FAD readiness.teamProjections[${index}]`));
  for (const field of ["blockers", "warnings"]) {
    contract(Array.isArray(data[field]), `FAD readiness.${field} is invalid.`);
    data[field].forEach((diagnostic, index) => readinessDiagnostic(diagnostic, `FAD readiness.${field}[${index}]`));
  }
  nullableId(data.resultFadId, "FAD readiness.resultFadId");
  actionCapability(data.retryReadiness, "FAD readiness.retryReadiness");
  contract(
    data.status === "not_triggered"
      ? data.operationId === null && data.operationVersion === null
      : data.operationId !== null && data.operationVersion !== null,
    "FAD readiness operation identity is inconsistent."
  );
  return true;
}

export function validateFreeAgentDraftReadinessRetry(data) {
  exact(
    data,
    [
      "retryReceiptId",
      "leagueId",
      "seasonId",
      "readinessOperationId",
      "acceptedFromVersion",
      "resultingReadinessVersion",
      "retryAttemptNumber",
      "jobRunId",
      "occurrenceKey",
      "acceptedAtMs",
      "status",
    ],
    "FAD readiness retry"
  );
  for (const field of ["retryReceiptId", "leagueId", "seasonId", "readinessOperationId", "jobRunId"]) {
    stableId(data[field], `FAD readiness retry.${field}`);
  }
  safeInteger(data.acceptedFromVersion, "FAD readiness retry.acceptedFromVersion", { positive: true });
  safeInteger(data.resultingReadinessVersion, "FAD readiness retry.resultingReadinessVersion", { positive: true });
  contract(data.resultingReadinessVersion === data.acceptedFromVersion + 1, "FAD readiness retry versions are inconsistent.");
  safeInteger(data.retryAttemptNumber, "FAD readiness retry.retryAttemptNumber", { positive: true });
  text(data.occurrenceKey, "FAD readiness retry.occurrenceKey");
  safeInteger(data.acceptedAtMs, "FAD readiness retry.acceptedAtMs");
  contract(data.status === "accepted", "FAD readiness retry.status is invalid.");
  return true;
}

function overviewCounts(value, location) {
  const fields = [
    "participatingTeams",
    "cardsLocked",
    "allocationsPending",
    "allocationsAutomatic",
    "restrictedPending",
    "restrictedFallbackPending",
    "rapidAuctionsOpen",
    "rolloversPersisted",
    "rolloversCompleted",
    "recoveriesOpen",
  ];
  exact(value, fields, location);
  safeInteger(value.participatingTeams, `${location}.participatingTeams`);
  for (const field of fields.slice(1)) {
    nullableInteger(value[field], `${location}.${field}`);
  }
  return true;
}

function commissionerCard(value, location) {
  exact(
    value,
    [
      "teamId",
      "team",
      "lifecycleStatus",
      "completenessCode",
      "missingMandatoryCount",
      "conflictCount",
      "capStatus",
      "allocationEligibility",
      "helpRequestStatus",
      "helpRequestId",
      "helpRequestedAtMs",
      "openPrivateCard",
    ],
    location
  );
  stableId(value.teamId, `${location}.teamId`);
  safeTeam(value.team, `${location}.team`);
  contract(value.team.teamId === value.teamId, `${location}.team is mismatched.`);
  oneOf(value.lifecycleStatus, ["open", "locked_complete", "locked_incomplete", "locked_conflicted"], `${location}.lifecycleStatus`);
  oneOf(value.completenessCode, ["complete", "incomplete", "conflicted"], `${location}.completenessCode`);
  safeInteger(value.missingMandatoryCount, `${location}.missingMandatoryCount`);
  safeInteger(value.conflictCount, `${location}.conflictCount`);
  oneOf(value.capStatus, ["compliant", "over_cap"], `${location}.capStatus`);
  oneOf(value.allocationEligibility, ["eligible", "excluded_structural_conflict", "excluded_over_cap"], `${location}.allocationEligibility`);
  oneOf(value.helpRequestStatus, ["not_requested", "active", "expired"], `${location}.helpRequestStatus`);
  if (value.helpRequestStatus === "not_requested") {
    contract(value.helpRequestId === null && value.helpRequestedAtMs === null, `${location} help identity is invalid.`);
  } else {
    stableId(value.helpRequestId, `${location}.helpRequestId`);
    safeInteger(value.helpRequestedAtMs, `${location}.helpRequestedAtMs`);
  }
  actionCapability(value.openPrivateCard, `${location}.openPrivateCard`);
  return true;
}

function queuedNomination(value, location) {
  exact(
    value,
    [
      "queueId",
      "teamId",
      "player",
      "totalValueCents",
      "termYears",
      "aavCents",
      "submittedAtMs",
      "opensAtRolloverId",
      "targetRolloverId",
      "status",
      "cancel",
    ],
    location
  );
  for (const field of ["queueId", "teamId", "opensAtRolloverId", "targetRolloverId"]) {
    stableId(value[field], `${location}.${field}`);
  }
  safePlayer(value.player, `${location}.player`);
  safeInteger(value.totalValueCents, `${location}.totalValueCents`, { positive: true });
  safeInteger(value.termYears, `${location}.termYears`, { positive: true });
  contract(value.termYears <= 3, `${location}.termYears is invalid.`);
  safeInteger(value.aavCents, `${location}.aavCents`, { positive: true });
  safeInteger(value.submittedAtMs, `${location}.submittedAtMs`);
  oneOf(value.status, ["queued", "opened", "invalid"], `${location}.status`);
  actionCapability(value.cancel, `${location}.cancel`);
  contract(value.cancel.allowed === false, `${location}.cancel must be denied.`);
  return true;
}

export function validateFreeAgentDraftOverview(data) {
  exact(
    data,
    [
      "leagueId",
      "seasonId",
      "fadId",
      "version",
      "status",
      "phase",
      "serverNowMs",
      "timeZone",
      "openedAtMs",
      "reminderAtMs",
      "helpOpensAtMs",
      "candidateDeadlineAtMs",
      "deadlineLockedAtMs",
      "allocationCompletedAtMs",
      "nextRolloverAtMs",
      "frozenFadFirstMatchupStartsAtMs",
      "competitionFirstMatchupStartsAtMs",
      "scheduleRecoveryOperationId",
      "completedAtMs",
      "counts",
      "viewer",
      "presentation",
      "capabilities",
    ],
    "FAD overview"
  );
  for (const field of ["leagueId", "seasonId", "fadId"]) stableId(data[field], `FAD overview.${field}`);
  safeInteger(data.version, "FAD overview.version", { positive: true });
  oneOf(data.status, ["cards_open", "deadline_locked", "allocating", "rapid", "completed"], "FAD overview.status");
  oneOf(data.phase, ["cards_open", "help_window", "deadline_processing", "allocating", "rapid", "completed"], "FAD overview.phase");
  safeInteger(data.serverNowMs, "FAD overview.serverNowMs");
  text(data.timeZone, "FAD overview.timeZone");
  for (const field of ["openedAtMs", "reminderAtMs", "helpOpensAtMs", "candidateDeadlineAtMs", "frozenFadFirstMatchupStartsAtMs", "competitionFirstMatchupStartsAtMs"]) {
    safeInteger(data[field], `FAD overview.${field}`);
  }
  for (const field of ["deadlineLockedAtMs", "allocationCompletedAtMs", "nextRolloverAtMs", "completedAtMs"]) {
    nullableInteger(data[field], `FAD overview.${field}`);
  }
  nullableId(data.scheduleRecoveryOperationId, "FAD overview.scheduleRecoveryOperationId");
  overviewCounts(data.counts, "FAD overview.counts");
  exact(data.viewer, ["managedCards", "commissionerCards", "queuedNominations"], "FAD overview.viewer");
  contract(Array.isArray(data.viewer.managedCards), "FAD overview.viewer.managedCards is invalid.");
  data.viewer.managedCards.forEach((card, index) => managedCardSummary(card, `FAD overview.viewer.managedCards[${index}]`, { descriptor: true }));
  contract(Array.isArray(data.viewer.commissionerCards), "FAD overview.viewer.commissionerCards is invalid.");
  data.viewer.commissionerCards.forEach((card, index) => commissionerCard(card, `FAD overview.viewer.commissionerCards[${index}]`));
  contract(Array.isArray(data.viewer.queuedNominations), "FAD overview.viewer.queuedNominations is invalid.");
  data.viewer.queuedNominations.forEach((nomination, index) => queuedNomination(nomination, `FAD overview.viewer.queuedNominations[${index}]`));
  if (data.presentation !== null) {
    exact(data.presentation, ["presentationId", "status", "availableAtMs"], "FAD overview.presentation");
    stableId(data.presentation.presentationId, "FAD overview.presentation.presentationId");
    text(data.presentation.status, "FAD overview.presentation.status");
    nullableInteger(data.presentation.availableAtMs, "FAD overview.presentation.availableAtMs");
  }
  capabilities(data.capabilities, ["viewPublishedCards", "viewRecovery", "completeRecoveryAction"], "FAD overview.capabilities");
  return true;
}

function completeness(value, location) {
  const fields = [
    "code",
    "filledMandatoryCount",
    "missingMandatoryCount",
    "filledBenchCount",
    "emptyBenchCount",
    "blockingValidationCount",
    "structuralConflictCount",
    "carriedRosterStructuralConflictCount",
  ];
  exact(value, fields, location);
  oneOf(value.code, ["complete", "incomplete", "conflicted"], `${location}.code`);
  for (const field of fields.slice(1)) safeInteger(value[field], `${location}.${field}`);
  return true;
}

function capProjection(value, location) {
  const fields = [
    "capLimitCents",
    "carriedActivePlayerAmountCents",
    "retentionObligationCents",
    "buyoutPenaltyCents",
    "carriedCapUsageCents",
    "proposedCandidateAavCents",
    "maximumPossibleCapCents",
    "maximumCapSpaceCents",
  ];
  exact(value, fields, location);
  for (const field of fields) {
    contract(Number.isSafeInteger(value[field]), `${location}.${field} is invalid.`);
    if (field !== "maximumCapSpaceCents") contract(value[field] >= 0, `${location}.${field} is invalid.`);
  }
  return true;
}

function validation(value, location) {
  exact(value, ["status", "codes"], location);
  oneOf(value.status, ["valid", "warning", "invalid"], `${location}.status`);
  contract(Array.isArray(value.codes), `${location}.codes is invalid.`);
  value.codes.forEach((code, index) => text(code, `${location}.codes[${index}]`));
  contract(new Set(value.codes).size === value.codes.length, `${location}.codes contains duplicates.`);
  return true;
}

function lastEditor(value, location) {
  if (value === null) return true;
  exact(value, ["userId", "displayName", "authority"], location);
  oneOf(value.authority, ["manager", "commissioner", "platform_administrator_as_commissioner", "system"], `${location}.authority`);
  if (value.authority === "system") {
    contract(value.userId === null && value.displayName === null, `${location} system identity is invalid.`);
  } else {
    stableId(value.userId, `${location}.userId`);
    text(value.displayName, `${location}.displayName`);
  }
  return true;
}

function publishedOutcome(value, location) {
  if (value === null) return true;
  exact(value, ["code", "allocationId", "auctionId"], location);
  oneOf(
    value.code,
    [
      "carryover",
      "automatic_win",
      "automatic_loss",
      "restricted_pending",
      "restricted_win",
      "restricted_loss",
      "fallback_pending",
      "fallback_win",
      "fallback_loss",
      "fallback_no_winner",
      "invalid_offer",
      "no_offer",
    ],
    `${location}.code`
  );
  nullableId(value.allocationId, `${location}.allocationId`);
  nullableId(value.auctionId, `${location}.auctionId`);
  return true;
}

function candidateSlot(value, index, location, { published }) {
  exact(
    value,
    [
      "slotKey",
      "slotGroup",
      "required",
      "occupantKind",
      "entryId",
      "entryVersion",
      "player",
      "authoritativeRosterCategory",
      "locked",
      "totalValueCents",
      "termYears",
      "aavCents",
      "remainingYears",
      "validation",
      "outcome",
      "lastEditedAtMs",
      "lastEditedBy",
      "capabilities",
    ],
    location
  );
  contract(value.slotKey === SLOT_KEYS[index], `${location}.slotKey is invalid.`);
  contract(value.slotGroup === value.slotKey[0], `${location}.slotGroup is invalid.`);
  contract(value.required === (value.slotGroup !== "B"), `${location}.required is invalid.`);
  oneOf(value.occupantKind, ["empty", "carryover", "candidate"], `${location}.occupantKind`);
  contract(typeof value.locked === "boolean", `${location}.locked is invalid.`);
  validation(value.validation, `${location}.validation`);
  publishedOutcome(value.outcome, `${location}.outcome`);
  if (!published) contract(value.outcome === null, `${location}.outcome must be private.`);
  capabilities(value.capabilities, ["addCandidate", "editCandidate", "moveCandidate", "moveCarryover", "removeCandidate"], `${location}.capabilities`);
  if (value.occupantKind === "empty") {
    for (const field of ["entryId", "entryVersion", "player", "authoritativeRosterCategory", "totalValueCents", "termYears", "aavCents", "remainingYears", "lastEditedAtMs", "lastEditedBy"]) {
      contract(value[field] === null, `${location}.${field} is invalid for an empty slot.`);
    }
    contract(value.locked === false, `${location}.locked is invalid for an empty slot.`);
    return true;
  }
  stableId(value.entryId, `${location}.entryId`);
  safeInteger(value.entryVersion, `${location}.entryVersion`, { positive: true });
  safePlayer(value.player, `${location}.player`);
  safeInteger(value.totalValueCents, `${location}.totalValueCents`, { positive: true });
  safeInteger(value.termYears, `${location}.termYears`, { positive: true });
  safeInteger(value.aavCents, `${location}.aavCents`, { positive: true });
  safeInteger(value.lastEditedAtMs, `${location}.lastEditedAtMs`);
  lastEditor(value.lastEditedBy, `${location}.lastEditedBy`);
  if (value.occupantKind === "carryover") {
    oneOf(value.authoritativeRosterCategory, ["Active", "Bench", "Injured Reserve"], `${location}.authoritativeRosterCategory`);
    safeInteger(value.remainingYears, `${location}.remainingYears`, { positive: true });
    contract(value.locked === true, `${location}.locked is invalid for a carryover.`);
  } else {
    contract(value.authoritativeRosterCategory === null && value.remainingYears === null, `${location} candidate roster fields are invalid.`);
    contract(value.locked === false, `${location}.locked is invalid for a candidate.`);
  }
  return true;
}

function candidateConflict(value, location) {
  exact(value, ["entryId", "entryVersion", "player", "intendedSlotKey", "conflictCode", "validation", "lastEditedBy"], location);
  stableId(value.entryId, `${location}.entryId`);
  safeInteger(value.entryVersion, `${location}.entryVersion`, { positive: true });
  safePlayer(value.player, `${location}.player`);
  contract(SLOT_KEYS.includes(value.intendedSlotKey), `${location}.intendedSlotKey is invalid.`);
  text(value.conflictCode, `${location}.conflictCode`);
  validation(value.validation, `${location}.validation`);
  lastEditor(value.lastEditedBy, `${location}.lastEditedBy`);
  return true;
}

function helpContext(value, location) {
  if (value === null) return true;
  exact(value, ["helpRequestId", "status", "message", "requestedByUserId", "requestedByDisplayName", "requestedAtMs", "expiresAtMs"], location);
  stableId(value.helpRequestId, `${location}.helpRequestId`);
  oneOf(value.status, ["active", "expired"], `${location}.status`);
  if (value.message !== null) contract(typeof value.message === "string", `${location}.message is invalid.`);
  stableId(value.requestedByUserId, `${location}.requestedByUserId`);
  text(value.requestedByDisplayName, `${location}.requestedByDisplayName`);
  safeInteger(value.requestedAtMs, `${location}.requestedAtMs`);
  safeInteger(value.expiresAtMs, `${location}.expiresAtMs`);
  contract(value.expiresAtMs > value.requestedAtMs, `${location} timing is invalid.`);
  return true;
}

function intervention(value, location) {
  exact(value, ["revisionId", "entryId", "action", "actorUserId", "actorDisplayName", "authority", "occurredAtMs"], location);
  stableId(value.revisionId, `${location}.revisionId`);
  nullableId(value.entryId, `${location}.entryId`);
  text(value.action, `${location}.action`);
  stableId(value.actorUserId, `${location}.actorUserId`);
  text(value.actorDisplayName, `${location}.actorDisplayName`);
  oneOf(value.authority, ["commissioner", "platform_administrator_as_commissioner"], `${location}.authority`);
  safeInteger(value.occurredAtMs, `${location}.occurredAtMs`);
  return true;
}

function validateCandidateCard(data, { published }) {
  exact(
    data,
    [
      "leagueId",
      "seasonId",
      "fadId",
      "teamId",
      "cardId",
      "cardVersion",
      "phase",
      "visibilityMode",
      "accessReason",
      "authorizationEvidence",
      "lifecycleStatus",
      "completeness",
      "capProjection",
      "capStatus",
      "allocationEligibility",
      "allocationExclusionReason",
      "slots",
      "conflicts",
      "helpContext",
      "commissionerInterventions",
      "capabilities",
    ],
    "Candidate Card"
  );
  for (const field of ["leagueId", "seasonId", "fadId", "teamId", "cardId"]) stableId(data[field], `Candidate Card.${field}`);
  safeInteger(data.cardVersion, "Candidate Card.cardVersion", { positive: true });
  oneOf(data.phase, ["cards_open", "help_window", "deadline_processing", "allocating", "rapid", "completed"], "Candidate Card.phase");
  oneOf(data.lifecycleStatus, ["open", "locked_complete", "locked_incomplete", "locked_conflicted"], "Candidate Card.lifecycleStatus");
  if (published) {
    contract(data.visibilityMode === "published_history", "Candidate Card.visibilityMode is invalid.");
    contract(data.accessReason === "published_league_history", "Candidate Card.accessReason is invalid.");
    contract(data.authorizationEvidence === null, "Candidate Card.authorizationEvidence is invalid.");
    contract(data.helpContext === null, "Candidate Card.helpContext must not be published.");
  } else {
    oneOf(data.visibilityMode, ["private_editable", "private_read_only"], "Candidate Card.visibilityMode");
    oneOf(data.accessReason, FAD_AUTHORIZATION_SCOPES, "Candidate Card.accessReason");
    authorizationEvidence(data.authorizationEvidence, "Candidate Card.authorizationEvidence");
    contract(
      data.accessReason === "team_manager"
        ? data.authorizationEvidence.kind === "manager_assignment"
        : data.authorizationEvidence.kind === "help_request",
      "Candidate Card authorization evidence is inconsistent."
    );
    helpContext(data.helpContext, "Candidate Card.helpContext");
  }
  completeness(data.completeness, "Candidate Card.completeness");
  capProjection(data.capProjection, "Candidate Card.capProjection");
  oneOf(data.capStatus, ["compliant", "over_cap"], "Candidate Card.capStatus");
  oneOf(data.allocationEligibility, ["eligible", "excluded_structural_conflict", "excluded_over_cap"], "Candidate Card.allocationEligibility");
  const expectedExclusion = {
    eligible: null,
    excluded_structural_conflict: "candidate_card_structural_conflict",
    excluded_over_cap: "candidate_card_over_cap",
  }[data.allocationEligibility];
  contract(data.allocationExclusionReason === expectedExclusion, "Candidate Card allocation exclusion is inconsistent.");
  contract(Array.isArray(data.slots) && data.slots.length === 22, "Candidate Card.slots is invalid.");
  data.slots.forEach((slot, index) => candidateSlot(slot, index, `Candidate Card.slots[${index}]`, { published }));
  contract(Array.isArray(data.conflicts), "Candidate Card.conflicts is invalid.");
  data.conflicts.forEach((conflict, index) => candidateConflict(conflict, `Candidate Card.conflicts[${index}]`));
  contract(Array.isArray(data.commissionerInterventions), "Candidate Card.commissionerInterventions is invalid.");
  data.commissionerInterventions.forEach((item, index) => intervention(item, `Candidate Card.commissionerInterventions[${index}]`));
  capabilities(data.capabilities, ["editCard", "requestHelp", "viewPublishedHistory"], "Candidate Card.capabilities");
  if (published) {
    contract(data.capabilities.editCard.allowed === false && data.capabilities.requestHelp.allowed === false && data.capabilities.viewPublishedHistory.allowed === true, "Candidate Card published capabilities are invalid.");
  }
  return true;
}

export function validatePrivateCandidateCard(data) {
  return validateCandidateCard(data, { published: false });
}

export function validatePublishedCandidateCard(data) {
  return validateCandidateCard(data, { published: true });
}

function publishedCardSummary(value, location) {
  exact(
    value,
    [
      "leagueId",
      "seasonId",
      "fadId",
      "teamId",
      "team",
      "snapshotId",
      "lockedCardVersion",
      "lifecycleStatus",
      "completeness",
      "capStatus",
      "allocationEligibility",
      "allocationExclusionReason",
      "maximumPossibleCapCents",
      "carriedCapUsageCents",
      "counts",
      "outcomeCounts",
      "commissionerInterventionCount",
      "historyDescriptor",
    ],
    location
  );
  for (const field of ["leagueId", "seasonId", "fadId", "teamId", "snapshotId"]) stableId(value[field], `${location}.${field}`);
  safeTeam(value.team, `${location}.team`);
  contract(value.team.teamId === value.teamId, `${location}.team is mismatched.`);
  safeInteger(value.lockedCardVersion, `${location}.lockedCardVersion`, { positive: true });
  oneOf(value.lifecycleStatus, ["locked_complete", "locked_incomplete", "locked_conflicted"], `${location}.lifecycleStatus`);
  completeness(value.completeness, `${location}.completeness`);
  oneOf(value.capStatus, ["compliant", "over_cap"], `${location}.capStatus`);
  oneOf(value.allocationEligibility, ["eligible", "excluded_structural_conflict", "excluded_over_cap"], `${location}.allocationEligibility`);
  const expectedExclusion = {
    eligible: null,
    excluded_structural_conflict: "candidate_card_structural_conflict",
    excluded_over_cap: "candidate_card_over_cap",
  }[value.allocationEligibility];
  contract(value.allocationExclusionReason === expectedExclusion, `${location}.allocationExclusionReason is invalid.`);
  safeInteger(value.maximumPossibleCapCents, `${location}.maximumPossibleCapCents`);
  safeInteger(value.carriedCapUsageCents, `${location}.carriedCapUsageCents`);
  const countFields = ["carryovers", "candidates", "emptyMandatory", "emptyBench", "conflicts"];
  exact(value.counts, countFields, `${location}.counts`);
  countFields.forEach((field) => safeInteger(value.counts[field], `${location}.counts.${field}`));
  const outcomeFields = ["automaticWins", "restrictedPending", "restrictedWins", "fallbackPending", "fallbackWins", "fallbackNoWinner", "losses", "invalidOffers"];
  exact(value.outcomeCounts, outcomeFields, `${location}.outcomeCounts`);
  outcomeFields.forEach((field) => safeInteger(value.outcomeCounts[field], `${location}.outcomeCounts.${field}`));
  safeInteger(value.commissionerInterventionCount, `${location}.commissionerInterventionCount`);
  exact(value.historyDescriptor, ["mode", "seasonId", "fadId", "teamId", "cardId"], `${location}.historyDescriptor`);
  contract(value.historyDescriptor.mode === "published_card", `${location}.historyDescriptor.mode is invalid.`);
  for (const field of ["seasonId", "fadId", "teamId", "cardId"]) stableId(value.historyDescriptor[field], `${location}.historyDescriptor.${field}`);
  return true;
}

export function validatePublishedCandidateCardSummaries(data) {
  contract(Array.isArray(data), "Published Candidate Card summaries must be an array.");
  data.forEach((summary, index) => publishedCardSummary(summary, `Published Candidate Card summaries[${index}]`));
  return true;
}

const FAD_ALLOCATION_DECISIONS = Object.freeze([
  "sole_valid_offer",
  "highest_total",
  "highest_equal_total_aav",
  "exact_total_and_term_tie",
  "no_valid_offer",
  "invalid_snapshot",
  "candidate_card_structural_conflict",
  "candidate_card_over_cap",
  "restricted_auction_result",
  "restricted_no_improvement_fallback",
  "fallback_open_result",
  "fallback_open_no_winner",
  "corrected",
]);
const FAD_RECOVERY_STATUSES = Object.freeze([
  "pending",
  "ready",
  "running",
  "resolved",
  "correction_required",
]);

function sha256(value, location) {
  contract(typeof value === "string" && SHA256_HEX.test(value), `${location} is invalid.`);
  return value;
}

function nullableText(value, location) {
  if (value !== null) text(value, location);
  return true;
}

function allocationContract(value, location) {
  safeInteger(value.totalValueCents, `${location}.totalValueCents`, { positive: true });
  safeInteger(value.termYears, `${location}.termYears`, { positive: true });
  contract(value.termYears <= 3, `${location}.termYears is invalid.`);
  safeInteger(value.aavCents, `${location}.aavCents`, { positive: true });
  const expectedAavCents =
    Math.floor(value.totalValueCents / value.termYears) +
    ((value.totalValueCents % value.termYears) * 2 >= value.termYears ? 1 : 0);
  contract(
    value.totalValueCents >= value.termYears * 100 &&
      (value.termYears === 1 || value.totalValueCents % 100 === 0) &&
      value.aavCents === expectedAavCents,
    `${location} contract values are inconsistent.`
  );
  return true;
}

function rankedOffer(value, location) {
  exact(
    value,
    [
      "snapshotEntryId",
      "teamId",
      "team",
      "slotKey",
      "totalValueCents",
      "termYears",
      "aavCents",
      "valid",
      "validationCode",
      "rank",
      "outcomeCode",
    ],
    location
  );
  stableId(value.snapshotEntryId, `${location}.snapshotEntryId`);
  stableId(value.teamId, `${location}.teamId`);
  safeTeam(value.team, `${location}.team`);
  contract(value.team.teamId === value.teamId, `${location}.team is mismatched.`);
  contract(SLOT_KEYS.includes(value.slotKey), `${location}.slotKey is invalid.`);
  allocationContract(value, location);
  contract(typeof value.valid === "boolean", `${location}.valid is invalid.`);
  nullableText(value.validationCode, `${location}.validationCode`);
  nullableInteger(value.rank, `${location}.rank`, { positive: true });
  oneOf(
    value.outcomeCode,
    [
      "pending",
      "winner",
      "lost_lower_total",
      "lost_lower_aav",
      "restricted_tied",
      "invalid",
    ],
    `${location}.outcomeCode`
  );
  return true;
}

function allocationWinner(value, status, location) {
  if (value === null) return true;
  exact(
    value,
    [
      "teamId",
      "snapshotEntryId",
      "contractId",
      "ownershipId",
      "slotKey",
      "totalValueCents",
      "termYears",
      "aavCents",
    ],
    location
  );
  stableId(value.teamId, `${location}.teamId`);
  nullableId(value.snapshotEntryId, `${location}.snapshotEntryId`);
  contract(
    value.snapshotEntryId !== null || status === "fallback_open_resolved",
    `${location}.snapshotEntryId is invalid.`
  );
  stableId(value.contractId, `${location}.contractId`);
  stableId(value.ownershipId, `${location}.ownershipId`);
  contract(SLOT_KEYS.includes(value.slotKey), `${location}.slotKey is invalid.`);
  allocationContract(value, location);
  return true;
}

function restrictedResult(value, location) {
  if (value === null) return true;
  exact(
    value,
    [
      "auctionId",
      "status",
      "participantTeamIds",
      "minimumTotalValueCents",
      "minimumTermYears",
      "minimumAavCents",
    ],
    location
  );
  oneOf(
    value.status,
    ["scheduled", "open", "resolving", "fallback_open", "resolved", "no_winner", "cancelled", "failed"],
    `${location}.status`
  );
  nullableId(value.auctionId, `${location}.auctionId`);
  contract(
    (value.status === "scheduled") === (value.auctionId === null),
    `${location}.auctionId is invalid.`
  );
  contract(Array.isArray(value.participantTeamIds), `${location}.participantTeamIds is invalid.`);
  value.participantTeamIds.forEach((teamId, index) =>
    stableId(teamId, `${location}.participantTeamIds[${index}]`)
  );
  contract(
    new Set(value.participantTeamIds).size === value.participantTeamIds.length &&
      (value.status === "scheduled"
        ? value.participantTeamIds.length === 0
        : value.participantTeamIds.length >= 2),
    `${location}.participantTeamIds is invalid.`
  );
  allocationContract(
    {
      totalValueCents: value.minimumTotalValueCents,
      termYears: value.minimumTermYears,
      aavCents: value.minimumAavCents,
    },
    location
  );
  return true;
}

function fallbackResult(value, location) {
  if (value === null) return true;
  exact(
    value,
    [
      "auctionId",
      "status",
      "minimumTotalValueCents",
      "winningBidId",
      "contractId",
      "ownershipId",
      "noWinnerReason",
    ],
    location
  );
  stableId(value.auctionId, `${location}.auctionId`);
  oneOf(value.status, ["open", "resolving", "resolved", "no_winner", "cancelled", "failed"], `${location}.status`);
  safeInteger(value.minimumTotalValueCents, `${location}.minimumTotalValueCents`, { positive: true });
  for (const field of ["winningBidId", "contractId", "ownershipId"]) {
    nullableId(value[field], `${location}.${field}`);
  }
  nullableText(value.noWinnerReason, `${location}.noWinnerReason`);
  const winnerLinks = [value.winningBidId, value.contractId, value.ownershipId];
  contract(
    winnerLinks.every((item) => item === null) || winnerLinks.every((item) => item !== null),
    `${location} winner links are invalid.`
  );
  contract(
    (value.status === "resolved") === winnerLinks.every((item) => item !== null),
    `${location} winner status is invalid.`
  );
  return true;
}

function drawReveal(value, location) {
  if (value === null) return true;
  exact(
    value,
    [
      "algorithmVersion",
      "nonceHex",
      "selectionUsed",
      "orderedBidIds",
      "counter",
      "digestHex",
      "selectedIndex",
      "selectedBidId",
      "selectedTeamId",
    ],
    location
  );
  contract(value.algorithmVersion === 1, `${location}.algorithmVersion is invalid.`);
  sha256(value.nonceHex, `${location}.nonceHex`);
  contract(typeof value.selectionUsed === "boolean", `${location}.selectionUsed is invalid.`);
  contract(Array.isArray(value.orderedBidIds), `${location}.orderedBidIds is invalid.`);
  value.orderedBidIds.forEach((bidId, index) => stableId(bidId, `${location}.orderedBidIds[${index}]`));
  contract(
    new Set(value.orderedBidIds).size === value.orderedBidIds.length,
    `${location}.orderedBidIds is invalid.`
  );
  nullableInteger(value.counter, `${location}.counter`);
  if (value.digestHex !== null) sha256(value.digestHex, `${location}.digestHex`);
  nullableInteger(value.selectedIndex, `${location}.selectedIndex`);
  nullableId(value.selectedBidId, `${location}.selectedBidId`);
  nullableId(value.selectedTeamId, `${location}.selectedTeamId`);
  if (value.selectionUsed) {
    contract(
      value.orderedBidIds.length >= 2 &&
        value.counter !== null &&
        value.digestHex !== null &&
        value.selectedIndex !== null &&
        value.selectedIndex < value.orderedBidIds.length &&
        value.selectedBidId === value.orderedBidIds[value.selectedIndex] &&
        value.selectedTeamId !== null,
      `${location} selection evidence is invalid.`
    );
  } else {
    contract(
      value.orderedBidIds.length === 0 &&
        [value.counter, value.digestHex, value.selectedIndex, value.selectedBidId, value.selectedTeamId].every(
          (item) => item === null
        ),
      `${location} no-selection evidence is invalid.`
    );
  }
  return true;
}

function allocationDraw(value, location) {
  exact(value, ["auctionId", "auctionType", "drawCommitment", "drawReveal"], location);
  stableId(value.auctionId, `${location}.auctionId`);
  oneOf(value.auctionType, ["fad_restricted", "fad_open_rapid"], `${location}.auctionType`);
  sha256(value.drawCommitment, `${location}.drawCommitment`);
  drawReveal(value.drawReveal, `${location}.drawReveal`);
  return true;
}

function allocationDecision(value, location) {
  oneOf(value.status, FAD_ALLOCATION_STATUSES, `${location}.status`);
  if (value.decisionCode !== null) {
    oneOf(value.decisionCode, FAD_ALLOCATION_DECISIONS, `${location}.decisionCode`);
  }
  contract(
    Array.isArray(value.rankedOffers) &&
      value.rankedOffers.length > 0 &&
      value.rankedOffers.length <= 100,
    `${location}.rankedOffers is invalid.`
  );
  value.rankedOffers.forEach((offer, index) => rankedOffer(offer, `${location}.rankedOffers[${index}]`));
  contract(
    new Set(value.rankedOffers.map((offer) => offer.snapshotEntryId)).size ===
        value.rankedOffers.length &&
      new Set(value.rankedOffers.map((offer) => offer.teamId)).size ===
        value.rankedOffers.length,
    `${location}.rankedOffers contains duplicate evidence.`
  );
  allocationWinner(value.winner, value.status, `${location}.winner`);
  restrictedResult(value.restricted, `${location}.restricted`);
  if (value.recoveryStatus !== null) {
    oneOf(value.recoveryStatus, FAD_RECOVERY_STATUSES, `${location}.recoveryStatus`);
  }
  if (value.status === "pending") {
    contract(
      value.decisionCode === null &&
        value.winner === null &&
        value.restricted === null &&
        value.recoveryStatus === null &&
        value.rankedOffers.every((offer) => offer.rank === null && offer.outcomeCode === "pending"),
      `${location} pending decision is invalid.`
    );
  } else {
    contract(
      (value.decisionCode !== null || value.status === "correction_required") &&
        value.rankedOffers.every(
          (offer) =>
            offer.outcomeCode !== "pending" &&
            (offer.valid ? offer.rank !== null && offer.outcomeCode !== "invalid" : offer.rank === null && offer.outcomeCode === "invalid")
        ),
      `${location} resolved decision is invalid.`
    );
  }
  const winnerExpected =
    ["automatic_award", "restricted_resolved"].includes(value.status) ||
    (value.status === "fallback_open_resolved" &&
      value.decisionCode !== "fallback_open_no_winner");
  contract(winnerExpected === (value.winner !== null), `${location}.winner is invalid.`);
  const restrictedExpected = [
    "restricted_scheduled",
    "restricted_active",
    "restricted_fallback_open",
    "restricted_resolved",
    "fallback_open_resolved",
  ].includes(value.status);
  contract(!restrictedExpected || value.restricted !== null, `${location}.restricted is invalid.`);
  if (value.winner?.snapshotEntryId !== null && value.winner !== null) {
    const winningOffer = value.rankedOffers.find(
      (offer) => offer.snapshotEntryId === value.winner.snapshotEntryId
    );
    contract(
      Boolean(winningOffer) &&
        winningOffer.teamId === value.winner.teamId &&
        winningOffer.slotKey === value.winner.slotKey &&
        (value.status !== "automatic_award" ||
          (winningOffer.totalValueCents === value.winner.totalValueCents &&
            winningOffer.termYears === value.winner.termYears &&
            winningOffer.aavCents === value.winner.aavCents)),
      `${location}.winner does not match its locked offer.`
    );
  }
  return true;
}

function allocationResult(value, location) {
  exact(
    value,
    [
      "allocationId",
      "allocationVersion",
      "player",
      "status",
      "decisionCode",
      "rankedOffers",
      "winner",
      "restricted",
      "fallback",
      "draws",
      "recoveryStatus",
      "resolvedAtMs",
    ],
    location
  );
  stableId(value.allocationId, `${location}.allocationId`);
  safeInteger(value.allocationVersion, `${location}.allocationVersion`, { positive: true });
  safePlayer(value.player, `${location}.player`);
  allocationDecision(value, location);
  fallbackResult(value.fallback, `${location}.fallback`);
  contract(
    Array.isArray(value.draws) && value.draws.length <= 100,
    `${location}.draws is invalid.`
  );
  value.draws.forEach((draw, index) => allocationDraw(draw, `${location}.draws[${index}]`));
  contract(
    new Set(value.draws.map((draw) => draw.auctionId)).size === value.draws.length,
    `${location}.draws contains duplicate auction evidence.`
  );
  contract(
    value.draws.every((draw) => draw.drawReveal !== null || value.status === "correction_required"),
    `${location}.draws is invalid.`
  );
  nullableInteger(value.resolvedAtMs, `${location}.resolvedAtMs`);
  if (value.status === "pending") {
    contract(value.fallback === null && value.draws.length === 0 && value.resolvedAtMs === null, `${location} pending evidence is invalid.`);
  }
  if (["automatic_award", "restricted_resolved", "fallback_open_resolved", "no_valid_offer", "invalid"].includes(value.status)) {
    contract(value.resolvedAtMs !== null, `${location}.resolvedAtMs is invalid.`);
  }
  const fallbackRequired = ["restricted_fallback_open", "fallback_open_resolved"].includes(value.status);
  contract(
    fallbackRequired ? value.fallback !== null : value.fallback === null || value.status === "correction_required",
    `${location}.fallback is invalid.`
  );
  return true;
}

export function validateFreeAgentDraftAllocationResults(data) {
  contract(Array.isArray(data), "Free Agent Draft allocation results must be an array.");
  data.forEach((result, index) => allocationResult(result, `Free Agent Draft allocation results[${index}]`));
  return true;
}

function recoveryCounts(value, location) {
  const fields = [
    "participatingTeams",
    "cardsLocked",
    "allocationsPending",
    "allocationsAutomatic",
    "restrictedPending",
    "restrictedFallbackPending",
    "rapidAuctionsOpen",
    "queuedNominations",
    "rolloversPersisted",
    "rolloversCompleted",
    "recoveriesOpen",
  ];
  exact(value, fields, location);
  fields.forEach((field) => safeInteger(value[field], `${location}.${field}`));
  contract(
    value.cardsLocked <= value.participatingTeams &&
      value.rolloversCompleted <= value.rolloversPersisted,
    `${location} is inconsistent.`
  );
  return true;
}

function recoveryFad(value, location) {
  exact(
    value,
    [
      "leagueId",
      "seasonId",
      "fadId",
      "version",
      "status",
      "phase",
      "openedAtMs",
      "reminderAtMs",
      "helpOpensAtMs",
      "candidateDeadlineAtMs",
      "deadlineLockedAtMs",
      "allocationCompletedAtMs",
      "nextRolloverAtMs",
      "frozenFadFirstMatchupStartsAtMs",
      "competitionFirstMatchupStartsAtMs",
      "scheduleRecoveryOperationId",
      "completedAtMs",
      "counts",
    ],
    location
  );
  for (const field of ["leagueId", "seasonId", "fadId"]) stableId(value[field], `${location}.${field}`);
  safeInteger(value.version, `${location}.version`, { positive: true });
  oneOf(value.status, ["cards_open", "deadline_locked", "allocating", "rapid", "completed"], `${location}.status`);
  oneOf(value.phase, ["inactive", "cards_open", "help_window", "deadline_processing", "allocating", "rapid", "completed"], `${location}.phase`);
  for (const field of ["openedAtMs", "reminderAtMs", "helpOpensAtMs", "candidateDeadlineAtMs", "frozenFadFirstMatchupStartsAtMs", "competitionFirstMatchupStartsAtMs"]) {
    safeInteger(value[field], `${location}.${field}`);
  }
  for (const field of ["deadlineLockedAtMs", "allocationCompletedAtMs", "nextRolloverAtMs", "completedAtMs"]) {
    nullableInteger(value[field], `${location}.${field}`);
  }
  nullableId(value.scheduleRecoveryOperationId, `${location}.scheduleRecoveryOperationId`);
  recoveryCounts(value.counts, `${location}.counts`);
  contract(
    value.reminderAtMs < value.candidateDeadlineAtMs &&
      value.helpOpensAtMs < value.candidateDeadlineAtMs &&
      value.candidateDeadlineAtMs < value.frozenFadFirstMatchupStartsAtMs &&
      (value.scheduleRecoveryOperationId === null
        ? value.competitionFirstMatchupStartsAtMs ===
          value.frozenFadFirstMatchupStartsAtMs
        : value.competitionFirstMatchupStartsAtMs >
          value.frozenFadFirstMatchupStartsAtMs),
    `${location} evidence is inconsistent.`
  );
  return true;
}

function recoveryOperation(value, location) {
  if (value === null) return true;
  exact(
    value,
    [
      "operationId",
      "operationKind",
      "resourceId",
      "occurrenceKey",
      "status",
      "attemptCount",
      "scheduledForMs",
      "nextAttemptAtMs",
      "leaseExpiresAtMs",
      "startedAtMs",
      "completedAtMs",
      "lastErrorCode",
      "recoveryId",
      "blocksCompletion",
      "version",
    ],
    location
  );
  stableId(value.operationId, `${location}.operationId`);
  oneOf(value.operationKind, FAD_RECOVERY_OPERATION_KINDS, `${location}.operationKind`);
  stableId(value.resourceId, `${location}.resourceId`);
  text(value.occurrenceKey, `${location}.occurrenceKey`);
  oneOf(value.status, FAD_RECOVERY_OPERATION_STATUSES, `${location}.status`);
  safeInteger(value.attemptCount, `${location}.attemptCount`);
  safeInteger(value.scheduledForMs, `${location}.scheduledForMs`);
  for (const field of ["nextAttemptAtMs", "leaseExpiresAtMs", "startedAtMs", "completedAtMs"]) nullableInteger(value[field], `${location}.${field}`);
  nullableText(value.lastErrorCode, `${location}.lastErrorCode`);
  nullableId(value.recoveryId, `${location}.recoveryId`);
  contract(typeof value.blocksCompletion === "boolean", `${location}.blocksCompletion is invalid.`);
  safeInteger(value.version, `${location}.version`, { positive: true });
  contract(
    (["leased", "running"].includes(value.status) ===
      (value.leaseExpiresAtMs !== null)) &&
      (["succeeded", "failed"].includes(value.status) ===
        (value.completedAtMs !== null)) &&
      ((value.status === "failed") === (value.lastErrorCode !== null)) &&
      !(
        value.startedAtMs !== null &&
        value.completedAtMs !== null &&
        value.completedAtMs < value.startedAtMs
      ),
    `${location} state is inconsistent.`
  );
  return true;
}

function compareStableText(left, right) {
  return left === right ? 0 : left < right ? -1 : 1;
}

function compareRecoveryOperation(left, right) {
  return (
    left.scheduledForMs - right.scheduledForMs ||
    FAD_RECOVERY_OPERATION_KINDS.indexOf(left.operationKind) -
      FAD_RECOVERY_OPERATION_KINDS.indexOf(right.operationKind) ||
    compareStableText(left.resourceId, right.resourceId) ||
    compareStableText(left.operationId, right.operationId)
  );
}

function recoveryRollover(value, location) {
  exact(value, ["rolloverId", "sequence", "opensAtMs", "creationCutoffAtMs", "rollsOverAtMs", "status", "processingStartedAtMs", "completedAtMs", "lastErrorCode", "recoveryIds", "blocksCompletion", "version"], location);
  stableId(value.rolloverId, `${location}.rolloverId`);
  safeInteger(value.sequence, `${location}.sequence`, { positive: true });
  for (const field of ["opensAtMs", "creationCutoffAtMs", "rollsOverAtMs"]) safeInteger(value[field], `${location}.${field}`);
  oneOf(value.status, ["scheduled", "processing", "completed", "recovery_required"], `${location}.status`);
  for (const field of ["processingStartedAtMs", "completedAtMs"]) nullableInteger(value[field], `${location}.${field}`);
  nullableText(value.lastErrorCode, `${location}.lastErrorCode`);
  contract(Array.isArray(value.recoveryIds), `${location}.recoveryIds is invalid.`);
  value.recoveryIds.forEach((id, index) => stableId(id, `${location}.recoveryIds[${index}]`));
  contract(
    new Set(value.recoveryIds).size === value.recoveryIds.length &&
      value.recoveryIds.every(
        (id, index) => index === 0 || compareStableText(value.recoveryIds[index - 1], id) < 0
      ),
    `${location}.recoveryIds is invalid.`
  );
  contract(typeof value.blocksCompletion === "boolean", `${location}.blocksCompletion is invalid.`);
  safeInteger(value.version, `${location}.version`, { positive: true });
  contract(
    value.opensAtMs < value.creationCutoffAtMs &&
      value.creationCutoffAtMs < value.rollsOverAtMs &&
      (["processing", "completed", "recovery_required"].includes(value.status) ===
        (value.processingStartedAtMs !== null)) &&
      (["completed", "recovery_required"].includes(value.status) ===
        (value.completedAtMs !== null)) &&
      ((value.status === "recovery_required") === (value.lastErrorCode !== null)) &&
      value.blocksCompletion === (value.status !== "completed"),
    `${location} state is inconsistent.`
  );
  return true;
}

function recoveryRecord(value, location) {
  exact(value, ["recoveryId", "kind", "status", "playerId", "allocationId", "rolloverId", "auctionId", "jobRunId", "nominationQueueId", "earliestActivationAtMs", "targetResolutionAtMs", "lastErrorCode", "commissionerReason", "createdByOperationId", "resolvedByUserId", "resolvedByMembershipId", "resolvedAuthority", "createdAtMs", "updatedAtMs", "resolvedAtMs", "version"], location);
  stableId(value.recoveryId, `${location}.recoveryId`);
  oneOf(value.kind, FAD_RECOVERY_KINDS, `${location}.kind`);
  oneOf(value.status, FAD_RECOVERY_STATUSES, `${location}.status`);
  for (const field of ["playerId", "allocationId", "rolloverId", "auctionId", "jobRunId", "nominationQueueId", "createdByOperationId", "resolvedByUserId", "resolvedByMembershipId"]) nullableId(value[field], `${location}.${field}`);
  for (const field of ["earliestActivationAtMs", "targetResolutionAtMs", "resolvedAtMs"]) nullableInteger(value[field], `${location}.${field}`);
  nullableText(value.lastErrorCode, `${location}.lastErrorCode`);
  nullableText(value.commissionerReason, `${location}.commissionerReason`);
  if (value.resolvedAuthority !== null) oneOf(value.resolvedAuthority, ["system", "commissioner", "platform_administrator_as_commissioner"], `${location}.resolvedAuthority`);
  safeInteger(value.createdAtMs, `${location}.createdAtMs`);
  safeInteger(value.updatedAtMs, `${location}.updatedAtMs`);
  safeInteger(value.version, `${location}.version`, { positive: true });
  const userResolution = [
    "commissioner",
    "platform_administrator_as_commissioner",
  ].includes(value.resolvedAuthority);
  contract(
    ((value.kind === "queued_nomination_activation") ===
      (value.nominationQueueId !== null)) &&
      value.updatedAtMs >= value.createdAtMs &&
      ((value.status === "resolved") === (value.resolvedAtMs !== null)) &&
      ((value.status === "resolved") ===
        FAD_RECOVERY_RESOLVED_AUTHORITIES.has(value.resolvedAuthority)) &&
      (userResolution ===
        (value.resolvedByUserId !== null && value.resolvedByMembershipId !== null)) &&
      !(
        value.resolvedAuthority === "system" &&
        (value.resolvedByUserId !== null || value.resolvedByMembershipId !== null)
      ) &&
      !(
        value.status !== "resolved" &&
        (value.resolvedAuthority !== null ||
          value.resolvedByUserId !== null ||
          value.resolvedByMembershipId !== null)
      ),
    `${location} state is inconsistent.`
  );
  return true;
}

function recoveryAction(value, location) {
  exact(value, ["action", "resourceId", "enabled", "reasonCode"], location);
  oneOf(value.action, FAD_RECOVERY_ACTIONS, `${location}.action`);
  if (["retry_deadline", "complete_fad"].includes(value.action)) contract(value.resourceId === null, `${location}.resourceId is invalid.`);
  else stableId(value.resourceId, `${location}.resourceId`);
  contract(typeof value.enabled === "boolean", `${location}.enabled is invalid.`);
  contract(
    value.enabled
      ? value.reasonCode === null
      : value.reasonCode === "RECOVERY_NOT_AVAILABLE",
    `${location}.reasonCode is invalid.`
  );
  return true;
}

function recoveryActionResourceKey(value) {
  return `${value.action}:${value.resourceId ?? ""}`;
}

function compareRecoveryAction(left, right) {
  return (
    FAD_RECOVERY_ACTIONS.indexOf(left.action) -
      FAD_RECOVERY_ACTIONS.indexOf(right.action) ||
    compareStableText(left.resourceId || "", right.resourceId || "")
  );
}

function recoveryCapabilityForOperation(operation) {
  const action = {
    deadline: "retry_deadline",
    allocation: "retry_allocation",
    restricted_activation: "activate_restricted",
    queued_nomination_activation: "activate_queued_nomination",
    fallback_activation: "activate_fallback",
    auction_resolution: "retry_auction_resolution",
    completion: "complete_fad",
  }[operation.operationKind];
  return {
    action,
    resourceId: ["retry_deadline", "complete_fad"].includes(action)
      ? null
      : operation.resourceId,
  };
}

function recoveryCapabilityForRecord(recovery) {
  switch (recovery.kind) {
    case "deadline_retry":
      return { action: "retry_deadline", resourceId: null };
    case "allocation_retry":
      return { action: "retry_allocation", resourceId: recovery.allocationId };
    case "restricted_activation":
      return { action: "activate_restricted", resourceId: recovery.allocationId };
    case "queued_nomination_activation":
      return {
        action: "activate_queued_nomination",
        resourceId: recovery.nominationQueueId,
      };
    case "fallback_activation":
      return { action: "activate_fallback", resourceId: recovery.allocationId };
    case "auction_resolution":
      return { action: "retry_auction_resolution", resourceId: recovery.auctionId };
    case "rollover_finalize":
      return { action: "finalize_rollover", resourceId: recovery.rolloverId };
    case "completion":
      return { action: "complete_fad", resourceId: null };
    default:
      contract(false, "Free Agent Draft recovery capability is invalid.");
      return null;
  }
}

function validateRecoveryProjectionBindings(data) {
  const operations = [
    data.deadlineOperation,
    ...data.allocationOperations,
    ...data.rapidOperations,
    data.completionOperation,
  ].filter(Boolean);
  const expectedCapabilities = [
    ...operations.map(recoveryCapabilityForOperation),
    ...data.rollovers.map((rollover) => ({
      action: "finalize_rollover",
      resourceId: rollover.rolloverId,
    })),
  ].sort(compareRecoveryAction);
  const expectedKeys = expectedCapabilities.map(recoveryActionResourceKey);
  const actionKeys = data.availableActions.map(recoveryActionResourceKey);
  contract(
    new Set(expectedKeys).size === expectedKeys.length &&
      expectedKeys.length === actionKeys.length &&
      expectedKeys.every((key, index) => key === actionKeys[index]),
    "Free Agent Draft recovery available-action bindings are invalid."
  );

  const recoveriesByCapability = new Map();
  for (const recovery of data.recoveries) {
    const capability = recoveryCapabilityForRecord(recovery);
    contract(
      capability.resourceId !== null ||
        ["retry_deadline", "complete_fad"].includes(capability.action),
      "Free Agent Draft recovery capability is invalid."
    );
    const key = recoveryActionResourceKey(capability);
    const values = recoveriesByCapability.get(key) || [];
    values.push(recovery);
    recoveriesByCapability.set(key, values);
  }
  for (const [key, recoveries] of recoveriesByCapability.entries()) {
    contract(
      expectedKeys.includes(key) &&
        recoveries.filter(({ status }) => status !== "resolved").length <= 1,
      "Free Agent Draft recovery capability is invalid."
    );
  }

  for (const operation of operations) {
    const key = recoveryActionResourceKey(recoveryCapabilityForOperation(operation));
    const recoveries = recoveriesByCapability.get(key) || [];
    const latest = recoveries.at(-1) || null;
    contract(
      operation.recoveryId === (latest?.recoveryId ?? null) &&
        recoveries.every(
          (recovery) =>
            recovery.createdByOperationId === operation.operationId &&
            (recovery.jobRunId === null || recovery.jobRunId === operation.operationId)
        ) &&
        operation.blocksCompletion ===
          (operation.status !== "succeeded" &&
            !(operation.status === "failed" && latest?.status === "resolved")),
      "Free Agent Draft recovery operation bindings are invalid."
    );
  }

  data.availableActions.forEach((action, index) => {
    const recoveries = recoveriesByCapability.get(actionKeys[index]) || [];
    const latest = recoveries.at(-1) || null;
    const enabled = latest !== null && ["pending", "ready"].includes(latest.status);
    contract(
      action.enabled === enabled &&
        action.reasonCode === (enabled ? null : "RECOVERY_NOT_AVAILABLE"),
      "Free Agent Draft recovery available-action state is invalid."
    );
  });

  const recoveriesByRollover = new Map();
  for (const recovery of data.recoveries) {
    if (recovery.rolloverId === null) continue;
    const values = recoveriesByRollover.get(recovery.rolloverId) || [];
    values.push(recovery.recoveryId);
    recoveriesByRollover.set(recovery.rolloverId, values);
  }
  for (const rollover of data.rollovers) {
    const expected = [...(recoveriesByRollover.get(rollover.rolloverId) || [])].sort(
      compareStableText
    );
    contract(
      expected.length === rollover.recoveryIds.length &&
        expected.every((id, index) => id === rollover.recoveryIds[index]),
      "Free Agent Draft recovery rollover bindings are invalid."
    );
  }
  contract(
    [...recoveriesByRollover.keys()].every((rolloverId) =>
      data.rollovers.some((rollover) => rollover.rolloverId === rolloverId)
    ) &&
      data.fad.counts.rolloversPersisted === data.rollovers.length &&
      data.fad.counts.rolloversCompleted ===
        data.rollovers.filter(({ status }) => status === "completed").length &&
      data.fad.counts.recoveriesOpen ===
        data.recoveries.filter(({ status }) => status !== "resolved").length,
    "Free Agent Draft recovery projection counts are invalid."
  );
}

function scheduleRecovery(value, location) {
  exact(value, ["operationId", "status", "oldWeek1StartsAtMs", "newWeek1StartsAtMs", "oldScheduleVersion", "newScheduleVersion", "removedWeekIds", "removedMatchupIds", "replacedJobs", "completedAtMs", "version"], location);
  stableId(value.operationId, `${location}.operationId`);
  contract(value.status === "succeeded", `${location}.status is invalid.`);
  for (const field of ["oldWeek1StartsAtMs", "newWeek1StartsAtMs", "completedAtMs"]) safeInteger(value[field], `${location}.${field}`);
  for (const field of ["oldScheduleVersion", "newScheduleVersion", "version"]) safeInteger(value[field], `${location}.${field}`, { positive: true });
  for (const field of ["removedWeekIds", "removedMatchupIds"]) {
    contract(Array.isArray(value[field]), `${location}.${field} is invalid.`);
    value[field].forEach((id, index) => stableId(id, `${location}.${field}[${index}]`));
    contract(
      new Set(value[field]).size === value[field].length,
      `${location}.${field} is invalid.`
    );
  }
  contract(Array.isArray(value.replacedJobs), `${location}.replacedJobs is invalid.`);
  value.replacedJobs.forEach((job, index) => {
    const jobLocation = `${location}.replacedJobs[${index}]`;
    exact(job, ["oldJobId", "oldOccurrenceKey", "newJobId", "newOccurrenceKey"], jobLocation);
    stableId(job.oldJobId, `${jobLocation}.oldJobId`);
    text(job.oldOccurrenceKey, `${jobLocation}.oldOccurrenceKey`);
    stableId(job.newJobId, `${jobLocation}.newJobId`);
    text(job.newOccurrenceKey, `${jobLocation}.newOccurrenceKey`);
  });
  contract(
    value.replacedJobs.every(
      (job, index) =>
        index === 0 ||
        compareStableText(
          value.replacedJobs[index - 1].oldOccurrenceKey,
          job.oldOccurrenceKey
        ) < 0 ||
        (value.replacedJobs[index - 1].oldOccurrenceKey === job.oldOccurrenceKey &&
          compareStableText(value.replacedJobs[index - 1].oldJobId, job.oldJobId) < 0)
    ) &&
      value.newWeek1StartsAtMs > value.oldWeek1StartsAtMs &&
      value.newScheduleVersion === value.oldScheduleVersion + 1,
    `${location} state is inconsistent.`
  );
  return true;
}

export function validateFreeAgentDraftRecovery(data) {
  const fields = ["fad", "deadlineOperation", "allocationOperations", "rapidOperations", "completionOperation", "rollovers", "recoveries", "availableActions"];
  const hasSchedule = record(data) && Object.hasOwn(data, "scheduleRecoveryEvidence");
  exact(data, hasSchedule ? [...fields, "scheduleRecoveryEvidence"] : fields, "Free Agent Draft recovery");
  recoveryFad(data.fad, "Free Agent Draft recovery.fad");
  recoveryOperation(data.deadlineOperation, "Free Agent Draft recovery.deadlineOperation");
  recoveryOperation(data.completionOperation, "Free Agent Draft recovery.completionOperation");
  for (const [field, allowedKinds] of [
    ["allocationOperations", FAD_ALLOCATION_OPERATION_KINDS],
    ["rapidOperations", FAD_RAPID_OPERATION_KINDS],
  ]) {
    contract(Array.isArray(data[field]), `Free Agent Draft recovery.${field} is invalid.`);
    data[field].forEach((operation, index) => recoveryOperation(operation, `Free Agent Draft recovery.${field}[${index}]`));
    contract(
      data[field].every((operation) => allowedKinds.has(operation.operationKind)) &&
        data[field].every(
          (operation, index) =>
            index === 0 || compareRecoveryOperation(data[field][index - 1], operation) < 0
        ),
      `Free Agent Draft recovery.${field} is invalid.`
    );
  }
  contract(
    (data.deadlineOperation === null ||
      (data.deadlineOperation.operationKind === "deadline" &&
        data.deadlineOperation.resourceId === data.fad.fadId)) &&
      (data.completionOperation === null ||
        (data.completionOperation.operationKind === "completion" &&
          data.completionOperation.resourceId === data.fad.fadId)),
    "Free Agent Draft recovery singleton operation partitions are invalid."
  );
  contract(Array.isArray(data.rollovers) && data.rollovers.length >= 7, "Free Agent Draft recovery.rollovers is invalid.");
  data.rollovers.forEach((rollover, index) => recoveryRollover(rollover, `Free Agent Draft recovery.rollovers[${index}]`));
  contract(
    data.rollovers.every((rollover, index) => rollover.sequence === index + 1),
    "Free Agent Draft recovery.rollovers are out of order."
  );
  contract(Array.isArray(data.recoveries), "Free Agent Draft recovery.recoveries is invalid.");
  data.recoveries.forEach((recovery, index) => recoveryRecord(recovery, `Free Agent Draft recovery.recoveries[${index}]`));
  contract(
    data.recoveries.every(
      (recovery, index) =>
        index === 0 ||
        data.recoveries[index - 1].createdAtMs < recovery.createdAtMs ||
        (data.recoveries[index - 1].createdAtMs === recovery.createdAtMs &&
          compareStableText(data.recoveries[index - 1].recoveryId, recovery.recoveryId) < 0)
    ),
    "Free Agent Draft recovery.recoveries are out of order."
  );
  contract(Array.isArray(data.availableActions), "Free Agent Draft recovery.availableActions is invalid.");
  data.availableActions.forEach((action, index) => recoveryAction(action, `Free Agent Draft recovery.availableActions[${index}]`));
  contract(
    new Set(data.availableActions.map(recoveryActionResourceKey)).size ===
        data.availableActions.length &&
      data.availableActions.every(
        (action, index) =>
          index === 0 || compareRecoveryAction(data.availableActions[index - 1], action) < 0
      ),
    "Free Agent Draft recovery.availableActions are out of order."
  );
  validateRecoveryProjectionBindings(data);
  if (hasSchedule) {
    scheduleRecovery(data.scheduleRecoveryEvidence, "Free Agent Draft recovery.scheduleRecoveryEvidence");
    contract(
      data.fad.scheduleRecoveryOperationId === data.scheduleRecoveryEvidence.operationId &&
        data.fad.completedAtMs === data.scheduleRecoveryEvidence.completedAtMs &&
        data.fad.frozenFadFirstMatchupStartsAtMs ===
          data.scheduleRecoveryEvidence.oldWeek1StartsAtMs &&
        data.fad.competitionFirstMatchupStartsAtMs ===
          data.scheduleRecoveryEvidence.newWeek1StartsAtMs,
      "Free Agent Draft recovery schedule evidence is not bound to the FAD."
    );
  } else {
    contract(
      data.fad.scheduleRecoveryOperationId === null,
      "Free Agent Draft recovery schedule evidence is missing."
    );
  }
  return true;
}

export function validateFreeAgentDraftRecoveryAction(data) {
  exact(data, ["operationId", "occurrenceKey", "action", "resourceId", "status", "acceptedAtMs", "pollDescriptor"], "Free Agent Draft recovery action");
  stableId(data.operationId, "Free Agent Draft recovery action.operationId");
  text(data.occurrenceKey, "Free Agent Draft recovery action.occurrenceKey");
  oneOf(data.action, FAD_RECOVERY_ACTIONS, "Free Agent Draft recovery action.action");
  if (["retry_deadline", "complete_fad"].includes(data.action)) contract(data.resourceId === null, "Free Agent Draft recovery action.resourceId is invalid.");
  else stableId(data.resourceId, "Free Agent Draft recovery action.resourceId");
  oneOf(data.status, ["pending", "already_succeeded"], "Free Agent Draft recovery action.status");
  safeInteger(data.acceptedAtMs, "Free Agent Draft recovery action.acceptedAtMs");
  exact(data.pollDescriptor, ["kind", "leagueId", "fadId"], "Free Agent Draft recovery action.pollDescriptor");
  contract(data.pollDescriptor.kind === "fad_recovery", "Free Agent Draft recovery action.pollDescriptor.kind is invalid.");
  stableId(data.pollDescriptor.leagueId, "Free Agent Draft recovery action.pollDescriptor.leagueId");
  stableId(data.pollDescriptor.fadId, "Free Agent Draft recovery action.pollDescriptor.fadId");
  return true;
}

function correctionDiagnostic(value, location) {
  exact(value, ["code", "message", "resourceId"], location);
  contract(typeof value.code === "string" && SAFE_CODE.test(value.code), `${location}.code is invalid.`);
  text(value.message, `${location}.message`);
  nullableText(value.resourceId, `${location}.resourceId`);
  return true;
}

function correctionAfterSummary(value, resourceType, location) {
  exact(value, ["status", "team", "player", "contractId", "ownershipId", "auctionId", "totalValueCents", "termYears", "aavCents", "rosterCategory"], location);
  if (value.status !== null) text(value.status, `${location}.status`);
  if (value.team !== null) safeTeam(value.team, `${location}.team`);
  if (value.player !== null) safePlayer(value.player, `${location}.player`);
  for (const field of ["contractId", "ownershipId", "auctionId"]) nullableId(value[field], `${location}.${field}`);
  const monetary = [value.totalValueCents, value.termYears, value.aavCents];
  contract(monetary.every((item) => item === null) || monetary.every((item) => item !== null), `${location} contract fields are invalid.`);
  if (monetary.every((item) => item !== null)) allocationContract(value, location);
  if (value.rosterCategory !== null) oneOf(value.rosterCategory, ["Active", "Bench", "Injured Reserve"], `${location}.rosterCategory`);
  contract(["allocation", "auction", "contract", "ownership", "roster_entry", "activity", "recovery"].includes(resourceType), `${location} resource type is invalid.`);
  return true;
}

function correctionDelta(value, location, { applied = false } = {}) {
  exact(value, ["resourceType", "resourceId", "action", "beforeVersion", "afterSummary"], location);
  oneOf(value.resourceType, ["allocation", "auction", "contract", "ownership", "roster_entry", "activity", "recovery"], `${location}.resourceType`);
  oneOf(value.action, ["create", "update", "cancel", "remove", "assign", "release", "append", "resolve"], `${location}.action`);
  nullableId(value.resourceId, `${location}.resourceId`);
  const creates = ["create", "append"].includes(value.action);
  contract((value.resourceId === null) ? creates && !applied : true, `${location}.resourceId is invalid.`);
  nullableInteger(value.beforeVersion, `${location}.beforeVersion`, { positive: true });
  contract(creates === (value.beforeVersion === null), `${location}.beforeVersion is invalid.`);
  correctionAfterSummary(value.afterSummary, value.resourceType, `${location}.afterSummary`);
  return true;
}

function correctionDecision(value, location) {
  exact(value, ["status", "decisionCode", "rankedOffers", "winner", "restricted", "recoveryStatus"], location);
  allocationDecision(value, location);
  return true;
}

export function validateFreeAgentDraftCorrectionPreview(data) {
  exact(data, ["allocationId", "allocationVersion", "previewFingerprint", "reversible", "currentDecision", "recomputedDecision", "deltas", "warnings", "blockers", "confirmationText"], "Free Agent Draft correction preview");
  stableId(data.allocationId, "Free Agent Draft correction preview.allocationId");
  safeInteger(data.allocationVersion, "Free Agent Draft correction preview.allocationVersion", { positive: true });
  sha256(data.previewFingerprint, "Free Agent Draft correction preview.previewFingerprint");
  contract(typeof data.reversible === "boolean", "Free Agent Draft correction preview.reversible is invalid.");
  correctionDecision(data.currentDecision, "Free Agent Draft correction preview.currentDecision");
  correctionDecision(data.recomputedDecision, "Free Agent Draft correction preview.recomputedDecision");
  contract(Array.isArray(data.deltas), "Free Agent Draft correction preview.deltas is invalid.");
  data.deltas.forEach((delta, index) => correctionDelta(delta, `Free Agent Draft correction preview.deltas[${index}]`));
  for (const field of ["warnings", "blockers"]) {
    contract(Array.isArray(data[field]), `Free Agent Draft correction preview.${field} is invalid.`);
    data[field].forEach((diagnostic, index) => correctionDiagnostic(diagnostic, `Free Agent Draft correction preview.${field}[${index}]`));
  }
  contract(data.reversible === (data.blockers.length === 0), "Free Agent Draft correction preview blockers are inconsistent.");
  contract(data.confirmationText === "APPLY FAD CORRECTION", "Free Agent Draft correction preview.confirmationText is invalid.");
  return true;
}

export function validateFreeAgentDraftCorrection(data) {
  exact(data, ["correctionId", "allocation", "appliedDeltas", "activityId", "completedAtMs"], "Free Agent Draft correction");
  stableId(data.correctionId, "Free Agent Draft correction.correctionId");
  allocationResult(data.allocation, "Free Agent Draft correction.allocation");
  contract(Array.isArray(data.appliedDeltas) && data.appliedDeltas.length > 0, "Free Agent Draft correction.appliedDeltas is invalid.");
  data.appliedDeltas.forEach((delta, index) => correctionDelta(delta, `Free Agent Draft correction.appliedDeltas[${index}]`, { applied: true }));
  stableId(data.activityId, "Free Agent Draft correction.activityId");
  contract(
    data.appliedDeltas.some((delta) => delta.resourceType === "activity" && delta.resourceId === data.activityId && delta.action === "append"),
    "Free Agent Draft correction activity delta is missing."
  );
  safeInteger(data.completedAtMs, "Free Agent Draft correction.completedAtMs");
  return true;
}

export function validateEligibleCandidatePlayers(data) {
  contract(Array.isArray(data), "Eligible Candidate players must be an array.");
  data.forEach((item, index) => {
    const location = `Eligible Candidate players[${index}]`;
    exact(item, ["player", "effectivePositionGroup", "activeState", "benchEligible", "eligibilityCode", "contractLimits"], location);
    safePlayer(item.player, `${location}.player`);
    contract(item.effectivePositionGroup === item.player.positionGroup, `${location}.effectivePositionGroup is invalid.`);
    contract(item.activeState === "active", `${location}.activeState is invalid.`);
    contract(item.benchEligible === true, `${location}.benchEligible is invalid.`);
    contract(item.eligibilityCode === "eligible", `${location}.eligibilityCode is invalid.`);
    exact(item.contractLimits, ["allowedTermsYears", "minimumTotalValueCentsByTerm", "maximumBenchAavCents"], `${location}.contractLimits`);
    contract(Array.isArray(item.contractLimits.allowedTermsYears) && item.contractLimits.allowedTermsYears.join("|") === "1|2|3", `${location}.contractLimits.allowedTermsYears is invalid.`);
    exact(item.contractLimits.minimumTotalValueCentsByTerm, ["1", "2", "3"], `${location}.contractLimits.minimumTotalValueCentsByTerm`);
    contract(item.contractLimits.minimumTotalValueCentsByTerm["1"] === 100 && item.contractLimits.minimumTotalValueCentsByTerm["2"] === 200 && item.contractLimits.minimumTotalValueCentsByTerm["3"] === 300, `${location}.contractLimits.minimumTotalValueCentsByTerm is invalid.`);
    contract(item.contractLimits.maximumBenchAavCents === null || item.contractLimits.maximumBenchAavCents === 400, `${location}.contractLimits.maximumBenchAavCents is invalid.`);
  });
  return true;
}

function previewAction(value, location) {
  contract(record(value), `${location} must be an object.`);
  oneOf(value.type, ["add", "edit", "move", "remove"], `${location}.type`);
  const fieldsByType = {
    add: ["type", "slotKey", "playerId", "totalValueCents", "termYears"],
    edit: ["type", "entryId", "totalValueCents", "termYears"],
    move: ["type", "entryId", "slotKey"],
    remove: ["type", "entryId"],
  };
  exact(value, fieldsByType[value.type], location);
  if ("slotKey" in value) contract(SLOT_KEYS.includes(value.slotKey), `${location}.slotKey is invalid.`);
  if ("playerId" in value) stableId(value.playerId, `${location}.playerId`);
  if ("entryId" in value) stableId(value.entryId, `${location}.entryId`);
  if ("totalValueCents" in value) safeInteger(value.totalValueCents, `${location}.totalValueCents`, { positive: true });
  if ("termYears" in value) {
    safeInteger(value.termYears, `${location}.termYears`, { positive: true });
    contract(value.termYears <= 3, `${location}.termYears is invalid.`);
  }
  return true;
}

export function validateCandidateCardRevisionPreview(data) {
  exact(data, ["baseCardVersion", "action", "projectedCard", "projectedSlot", "warnings"], "Candidate Card revision preview");
  safeInteger(data.baseCardVersion, "Candidate Card revision preview.baseCardVersion", { positive: true });
  previewAction(data.action, "Candidate Card revision preview.action");
  validatePrivateCandidateCard(data.projectedCard);
  contract(data.projectedCard.cardVersion === data.baseCardVersion + 1, "Candidate Card revision preview version is inconsistent.");
  contract(data.projectedCard.visibilityMode === "private_read_only", "Candidate Card revision preview visibility is invalid.");
  const previewCapabilities = [
    ...Object.values(data.projectedCard.capabilities),
    ...data.projectedCard.slots.flatMap((slot) => Object.values(slot.capabilities)),
  ];
  contract(
    previewCapabilities.every(
      (capability) =>
        capability.allowed === false && capability.reasonCode === "PREVIEW_ONLY"
    ),
    "Candidate Card revision preview capabilities are invalid."
  );
  contract(
    data.action.type === "remove"
      ? data.projectedSlot === null
      : data.projectedSlot !== null,
    "Candidate Card revision preview projected slot is inconsistent."
  );
  if (data.projectedSlot !== null) {
    const slotIndex = SLOT_KEYS.indexOf(data.projectedSlot.slotKey);
    contract(slotIndex >= 0, "Candidate Card revision preview.projectedSlot is invalid.");
    candidateSlot(data.projectedSlot, slotIndex, "Candidate Card revision preview.projectedSlot", { published: false });
  }
  contract(Array.isArray(data.warnings), "Candidate Card revision preview.warnings is invalid.");
  data.warnings.forEach((warning, index) => {
    const location = `Candidate Card revision preview.warnings[${index}]`;
    exact(warning, ["code", "message", "resourceId"], location);
    contract(typeof warning.code === "string" && SAFE_CODE.test(warning.code), `${location}.code is invalid.`);
    text(warning.message, `${location}.message`);
    stableId(warning.resourceId, `${location}.resourceId`);
  });
  return true;
}

export function validateCandidateCardMutation(data) {
  exact(data, ["card", "revisionId", "changedEntryId"], "Candidate Card mutation");
  validatePrivateCandidateCard(data.card);
  stableId(data.revisionId, "Candidate Card mutation.revisionId");
  nullableId(data.changedEntryId, "Candidate Card mutation.changedEntryId");
  return true;
}

export function validateCandidateCardHelp(data) {
  exact(data, ["helpRequestId", "leagueId", "seasonId", "fadId", "cardId", "teamId", "status", "message", "requestedByUserId", "requestedByDisplayName", "requestedAtMs", "expiresAtMs", "version"], "Candidate Card help");
  for (const field of ["helpRequestId", "leagueId", "seasonId", "fadId", "cardId", "teamId", "requestedByUserId"]) stableId(data[field], `Candidate Card help.${field}`);
  contract(data.status === "active", "Candidate Card help.status is invalid.");
  if (data.message !== null) contract(typeof data.message === "string", "Candidate Card help.message is invalid.");
  text(data.requestedByDisplayName, "Candidate Card help.requestedByDisplayName");
  safeInteger(data.requestedAtMs, "Candidate Card help.requestedAtMs");
  safeInteger(data.expiresAtMs, "Candidate Card help.expiresAtMs");
  contract(data.expiresAtMs > data.requestedAtMs, "Candidate Card help timing is invalid.");
  contract(data.version === 1, "Candidate Card help.version is invalid.");
  return true;
}
