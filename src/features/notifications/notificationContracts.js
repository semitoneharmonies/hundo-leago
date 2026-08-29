import { ResponseContractError } from "../../shared/api/responseContracts.js";

function contract(condition, message) {
  if (!condition) throw new ResponseContractError(message);
}

const STABLE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const FAD_STABLE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SAFE_MACHINE_CODE_PATTERN = /^[A-Z][A-Z0-9_]{0,99}$/u;
const CORRECTION_ERROR_CODE_PATTERN = /^[A-Z][A-Z0-9_]{0,63}$/u;
const FORBIDDEN_TEXT_PATTERN =
  // eslint-disable-next-line no-control-regex
  /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u;
const INVALID_UNICODE_SCALAR_PATTERN = /[\ud800-\udfff]/u;
const RAW_LOCATION_PATTERN =
  /(?:[a-z][a-z0-9+.-]*:\/\/|www\.|(?:^|\s)\/(?:api|leagues?|teams?|free-agent-drafts?)\/|[A-Za-z]:\\|\\\\)/iu;
const MAXIMUM_TIMESTAMP_MS = 8_640_000_000_000_000;
const MAXIMUM_ERROR_CODES = 100;
const MAXIMUM_DISPLAY_NAME_CODE_POINTS = 50;
const CANDIDATE_CARD_MANDATORY_SLOT_COUNT = 18;
const CANDIDATE_CARD_SLOT_COUNT = 22;

export const FREE_AGENT_DRAFT_NOTIFICATION_TYPES = Object.freeze([
  "fad_cards_opened",
  "fad_readiness_blocked",
  "fad_deadline_approaching",
  "fad_help_requested",
  "fad_cards_locked",
  "fad_automatic_result",
  "fad_restricted_eligible",
  "fad_restricted_fallback_opened",
  "fad_rapid_auction_result",
  "fad_correction_required",
  "fad_week1_recovered",
  "fad_completed",
  "fad_setup_exemption_authorized",
]);

export const FREE_AGENT_DRAFT_NOTIFICATION_OUTCOME_CODES = Object.freeze([
  "won",
  "lost",
  "invalid",
  "removed",
  "no_winner",
  "cancelled",
  "correction_required",
]);

export const FREE_AGENT_DRAFT_CARD_COMPLETENESS_CODES = Object.freeze([
  "complete",
  "incomplete",
  "conflicted",
]);

export const FREE_AGENT_DRAFT_NOTIFICATION_LIST_COPY = Object.freeze({
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
    "You are eligible to bid in a restricted Free Agent Draft auction.",
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

const DESTINATION_FIELDS = Object.freeze({
  private_card: Object.freeze([
    "cardId",
    "fadId",
    "kind",
    "leagueId",
    "teamId",
  ]),
  commissioner_fad: Object.freeze(["kind", "leagueId", "seasonId"]),
  fad_results: Object.freeze(["fadId", "kind", "leagueId"]),
  auction: Object.freeze(["auctionId", "kind", "leagueId"]),
  fad_recovery: Object.freeze([
    "fadId",
    "kind",
    "leagueId",
    "recoveryId",
  ]),
  fad_overview: Object.freeze(["fadId", "kind", "leagueId"]),
});

export const FREE_AGENT_DRAFT_NOTIFICATION_DESTINATION_KINDS = Object.freeze(
  Object.keys(DESTINATION_FIELDS)
);

export const FREE_AGENT_DRAFT_NOTIFICATION_CONTRACTS = Object.freeze({
  fad_cards_opened: Object.freeze({
    messageDataFields: Object.freeze([
      "candidateDeadlineAtMs",
      "cardId",
      "destination",
      "fadId",
      "leagueId",
      "seasonId",
      "teamId",
    ]),
    destinationKind: "private_card",
  }),
  fad_readiness_blocked: Object.freeze({
    messageDataFields: Object.freeze([
      "destination",
      "errorCodes",
      "leagueId",
      "readinessOperationId",
      "seasonId",
    ]),
    destinationKind: "commissioner_fad",
  }),
  fad_deadline_approaching: Object.freeze({
    messageDataFields: Object.freeze([
      "candidateDeadlineAtMs",
      "cardId",
      "completenessCode",
      "destination",
      "fadId",
      "leagueId",
      "missingMandatoryCount",
      "seasonId",
      "teamId",
    ]),
    destinationKind: "private_card",
  }),
  fad_help_requested: Object.freeze({
    messageDataFields: Object.freeze([
      "cardId",
      "destination",
      "fadId",
      "helpRequestId",
      "leagueId",
      "requestingDisplayName",
      "requestingUserId",
      "seasonId",
      "teamId",
    ]),
    destinationKind: "private_card",
  }),
  fad_cards_locked: Object.freeze({
    messageDataFields: Object.freeze([
      "destination",
      "fadId",
      "leagueId",
      "seasonId",
    ]),
    destinationKind: "fad_results",
  }),
  fad_automatic_result: Object.freeze({
    messageDataFields: Object.freeze([
      "automaticWins",
      "destination",
      "fadId",
      "invalidOffers",
      "leagueId",
      "losses",
      "restrictedPending",
      "seasonId",
      "teamId",
    ]),
    destinationKind: "fad_results",
  }),
  fad_restricted_eligible: Object.freeze({
    messageDataFields: Object.freeze([
      "allocationId",
      "auctionId",
      "destination",
      "fadId",
      "leagueId",
      "playerId",
      "seasonId",
      "teamId",
    ]),
    destinationKind: "auction",
  }),
  fad_restricted_fallback_opened: Object.freeze({
    messageDataFields: Object.freeze([
      "allocationId",
      "auctionId",
      "destination",
      "fadId",
      "leagueId",
      "playerId",
      "resolvesAtMs",
      "seasonId",
      "teamId",
    ]),
    destinationKind: "auction",
  }),
  fad_rapid_auction_result: Object.freeze({
    messageDataFields: Object.freeze([
      "allocationId",
      "auctionId",
      "destination",
      "fadId",
      "leagueId",
      "outcomeCode",
      "playerId",
      "seasonId",
      "teamId",
    ]),
    destinationKind: "auction",
  }),
  fad_correction_required: Object.freeze({
    messageDataFields: Object.freeze([
      "allocationId",
      "auctionId",
      "destination",
      "errorCode",
      "fadId",
      "leagueId",
      "playerId",
      "recoveryId",
      "seasonId",
    ]),
    destinationKind: "fad_recovery",
  }),
  fad_week1_recovered: Object.freeze({
    messageDataFields: Object.freeze([
      "competitionFirstMatchupStartsAtMs",
      "destination",
      "fadId",
      "leagueId",
      "scheduleRecoveryOperationId",
      "seasonId",
    ]),
    destinationKind: "fad_overview",
  }),
  fad_completed: Object.freeze({
    messageDataFields: Object.freeze([
      "completedAtMs",
      "destination",
      "fadId",
      "leagueId",
      "seasonId",
    ]),
    destinationKind: "fad_overview",
  }),
  fad_setup_exemption_authorized: Object.freeze({
    messageDataFields: Object.freeze([
      "destination",
      "exemptionId",
      "leagueId",
      "seasonId",
    ]),
    destinationKind: "commissioner_fad",
  }),
});

const FAD_NOTIFICATION_TYPE_SET = new Set(
  FREE_AGENT_DRAFT_NOTIFICATION_TYPES
);

function stableId(value) {
  return typeof value === "string" && STABLE_ID_PATTERN.test(value);
}

function fadStableId(value) {
  return typeof value === "string" && FAD_STABLE_ID_PATTERN.test(value);
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactObject(value, fields, description) {
  contract(
    isPlainObject(value) && Object.getOwnPropertySymbols(value).length === 0,
    `${description} is invalid.`
  );
  const actual = Object.getOwnPropertyNames(value).sort();
  const expected = [...fields].sort();
  contract(
    actual.length === expected.length &&
      actual.every((field, index) => field === expected[index]),
    `${description} fields are invalid.`
  );
  for (const field of actual) {
    const descriptor = Object.getOwnPropertyDescriptor(value, field);
    contract(
      descriptor?.enumerable === true &&
        Object.prototype.hasOwnProperty.call(descriptor, "value"),
      `${description} fields are invalid.`
    );
  }
}

function fadIdField(messageData, field) {
  contract(fadStableId(messageData[field]), `FAD notification ${field} is invalid.`);
}

function nullableFadIdField(messageData, field) {
  contract(
    messageData[field] === null || fadStableId(messageData[field]),
    `FAD notification ${field} is invalid.`
  );
}

function safeTimestamp(value, description) {
  contract(
    Number.isSafeInteger(value) && value >= 0 && value <= MAXIMUM_TIMESTAMP_MS,
    `${description} is invalid.`
  );
}

function boundedCount(value, maximum, description) {
  contract(
    Number.isSafeInteger(value) && value >= 0 && value <= maximum,
    `${description} is invalid.`
  );
}

function safeDisplayName(value) {
  contract(
    typeof value === "string" &&
      value.length > 0 &&
      value === value.trim() &&
      Array.from(value).length <= MAXIMUM_DISPLAY_NAME_CODE_POINTS &&
      !FORBIDDEN_TEXT_PATTERN.test(value) &&
      !INVALID_UNICODE_SCALAR_PATTERN.test(value) &&
      !RAW_LOCATION_PATTERN.test(value),
    "A FAD notification requesting manager name is invalid."
  );
}

function validateErrorCodes(value) {
  contract(
    Array.isArray(value) && Object.getOwnPropertySymbols(value).length === 0,
    "FAD notification error codes are invalid."
  );
  const keys = Object.getOwnPropertyNames(value);
  contract(
    keys.length === value.length + 1 &&
      keys.includes("length") &&
      value.length >= 1 &&
      value.length <= MAXIMUM_ERROR_CODES &&
      value.every(
        (code) =>
          typeof code === "string" && SAFE_MACHINE_CODE_PATTERN.test(code)
      ) &&
      new Set(value).size === value.length,
    "FAD notification error codes are invalid."
  );
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    contract(
      descriptor?.enumerable === true &&
        Object.prototype.hasOwnProperty.call(descriptor, "value"),
      "FAD notification error codes are invalid."
    );
  }
}

function validateDestination(messageData, expectedKind) {
  const destination = messageData.destination;
  const fields = DESTINATION_FIELDS[expectedKind];
  exactObject(destination, fields, "FAD notification destination");
  contract(
    destination.kind === expectedKind,
    "The FAD notification destination kind is invalid."
  );
  for (const field of fields) {
    if (field === "kind") continue;
    contract(
      fadStableId(destination[field]) &&
        destination[field] === messageData[field],
      "The FAD notification destination identity is invalid."
    );
  }
}

function commonFadFields(messageData) {
  fadIdField(messageData, "leagueId");
  fadIdField(messageData, "seasonId");
}

function validateCardMessageData(messageData, withCompleteness) {
  commonFadFields(messageData);
  fadIdField(messageData, "fadId");
  fadIdField(messageData, "teamId");
  fadIdField(messageData, "cardId");
  safeTimestamp(
    messageData.candidateDeadlineAtMs,
    "The FAD Candidate Card deadline"
  );
  if (withCompleteness) {
    contract(
      FREE_AGENT_DRAFT_CARD_COMPLETENESS_CODES.includes(
        messageData.completenessCode
      ),
      "The FAD Candidate Card completeness code is invalid."
    );
    boundedCount(
      messageData.missingMandatoryCount,
      CANDIDATE_CARD_MANDATORY_SLOT_COUNT,
      "The FAD Candidate Card missing count"
    );
    contract(
      messageData.completenessCode !== "complete" ||
        messageData.missingMandatoryCount === 0,
      "The FAD Candidate Card completeness summary is invalid."
    );
  }
}

export function isFreeAgentDraftNotificationType(value) {
  return FAD_NOTIFICATION_TYPE_SET.has(value);
}

export function getFreeAgentDraftNotificationListCopy(type) {
  contract(
    isFreeAgentDraftNotificationType(type),
    "The FAD notification type is invalid."
  );
  return FREE_AGENT_DRAFT_NOTIFICATION_LIST_COPY[type];
}

export function validateFreeAgentDraftNotificationMessageData(
  type,
  messageData
) {
  const definition = FREE_AGENT_DRAFT_NOTIFICATION_CONTRACTS[type];
  contract(definition, "The FAD notification type is invalid.");
  exactObject(messageData, definition.messageDataFields, "FAD notification data");

  switch (type) {
    case "fad_cards_opened":
      validateCardMessageData(messageData, false);
      break;
    case "fad_readiness_blocked":
      commonFadFields(messageData);
      fadIdField(messageData, "readinessOperationId");
      validateErrorCodes(messageData.errorCodes);
      break;
    case "fad_deadline_approaching":
      validateCardMessageData(messageData, true);
      break;
    case "fad_help_requested":
      commonFadFields(messageData);
      for (const field of [
        "fadId",
        "teamId",
        "cardId",
        "helpRequestId",
        "requestingUserId",
      ]) {
        fadIdField(messageData, field);
      }
      safeDisplayName(messageData.requestingDisplayName);
      break;
    case "fad_cards_locked":
      commonFadFields(messageData);
      fadIdField(messageData, "fadId");
      break;
    case "fad_automatic_result": {
      commonFadFields(messageData);
      fadIdField(messageData, "fadId");
      fadIdField(messageData, "teamId");
      const fields = [
        "automaticWins",
        "losses",
        "restrictedPending",
        "invalidOffers",
      ];
      for (const field of fields) {
        boundedCount(
          messageData[field],
          CANDIDATE_CARD_SLOT_COUNT,
          `The FAD automatic-result ${field} count`
        );
      }
      contract(
        fields.reduce((total, field) => total + messageData[field], 0) <=
          CANDIDATE_CARD_SLOT_COUNT,
        "The FAD automatic-result count summary is invalid."
      );
      break;
    }
    case "fad_restricted_eligible":
      commonFadFields(messageData);
      for (const field of [
        "fadId",
        "teamId",
        "allocationId",
        "auctionId",
        "playerId",
      ]) {
        fadIdField(messageData, field);
      }
      break;
    case "fad_restricted_fallback_opened":
      commonFadFields(messageData);
      for (const field of [
        "fadId",
        "teamId",
        "allocationId",
        "auctionId",
        "playerId",
      ]) {
        fadIdField(messageData, field);
      }
      safeTimestamp(messageData.resolvesAtMs, "The FAD auction resolution time");
      break;
    case "fad_rapid_auction_result":
      commonFadFields(messageData);
      for (const field of ["fadId", "teamId", "auctionId", "playerId"]) {
        fadIdField(messageData, field);
      }
      nullableFadIdField(messageData, "allocationId");
      contract(
        FREE_AGENT_DRAFT_NOTIFICATION_OUTCOME_CODES.includes(
          messageData.outcomeCode
        ),
        "The FAD auction outcome is invalid."
      );
      break;
    case "fad_correction_required":
      commonFadFields(messageData);
      for (const field of ["fadId", "recoveryId", "playerId"]) {
        fadIdField(messageData, field);
      }
      nullableFadIdField(messageData, "allocationId");
      nullableFadIdField(messageData, "auctionId");
      contract(
        messageData.allocationId !== null || messageData.auctionId !== null,
        "The FAD correction cause is invalid."
      );
      contract(
        typeof messageData.errorCode === "string" &&
          CORRECTION_ERROR_CODE_PATTERN.test(messageData.errorCode),
        "The FAD correction code is invalid."
      );
      break;
    case "fad_week1_recovered":
      commonFadFields(messageData);
      fadIdField(messageData, "fadId");
      fadIdField(messageData, "scheduleRecoveryOperationId");
      safeTimestamp(
        messageData.competitionFirstMatchupStartsAtMs,
        "The recovered Week 1 start"
      );
      break;
    case "fad_completed":
      commonFadFields(messageData);
      fadIdField(messageData, "fadId");
      safeTimestamp(messageData.completedAtMs, "The FAD completion time");
      break;
    case "fad_setup_exemption_authorized":
      commonFadFields(messageData);
      fadIdField(messageData, "exemptionId");
      break;
    default:
      contract(false, "The FAD notification type is invalid.");
  }

  validateDestination(messageData, definition.destinationKind);
  return true;
}

export function validateNotifications(data) {
  contract(data?.code === "NOTIFICATIONS_FOUND", "The notification code is invalid.");
  contract(Array.isArray(data.notifications), "The notification list is invalid.");
  contract(data.page && typeof data.page === "object", "The notification page is invalid.");
  for (const notification of data.notifications) {
    contract(notification && typeof notification === "object", "A notification is invalid.");
    contract(typeof notification.id === "string", "A notification ID is invalid.");
    contract(typeof notification.type === "string", "A notification type is invalid.");
    contract(notification.messageData && typeof notification.messageData === "object",
      "Notification message data is invalid.");
    if (notification.type.startsWith("fad_")) {
      contract(
        isFreeAgentDraftNotificationType(notification.type),
        "The FAD notification type is invalid."
      );
      contract(
        fadStableId(notification.id),
        "A FAD notification ID is invalid."
      );
      validateFreeAgentDraftNotificationMessageData(
        notification.type,
        notification.messageData
      );
      contract(
        notification.leagueId === notification.messageData.leagueId,
        "The FAD notification league is invalid."
      );
    }
    if (notification.type === "league_invitation_created") {
      contract(
        stableId(notification.messageData.invitationId),
        "A league invitation notification ID is invalid."
      );
      contract(
        stableId(notification.messageData.leagueId),
        "A league invitation notification league is invalid."
      );
      contract(
        typeof notification.messageData.leagueName === "string" &&
          notification.messageData.leagueName.trim() !== "",
        "A league invitation notification name is invalid."
      );
      contract(
        ["create_team", "manage_team"].includes(notification.messageData.workflow),
        "A league invitation notification workflow is invalid."
      );
      contract(
        notification.messageData.teamId === null ||
          stableId(notification.messageData.teamId),
        "A league invitation notification team is invalid."
      );
    }
    if (notification.type === "trade_proposal_received") {
      for (const [field, description] of [
        ["tradeId", "trade"],
        ["leagueId", "league"],
        ["proposingTeamId", "proposing team"],
        ["receivingTeamId", "receiving team"],
      ]) {
        contract(
          stableId(notification.messageData[field]),
          `A trade notification ${description} ID is invalid.`
        );
      }
      contract(
        typeof notification.messageData.proposingTeamName === "string" &&
          notification.messageData.proposingTeamName.trim() !== "",
        "A trade notification proposing team name is invalid."
      );
      contract(
        typeof notification.messageData.receivingTeamName === "string" &&
          notification.messageData.receivingTeamName.trim() !== "",
        "A trade notification receiving team name is invalid."
      );
    }
    contract(Number.isSafeInteger(notification.createdAtMs), "A notification time is invalid.");
    contract(notification.readAtMs === null || Number.isSafeInteger(notification.readAtMs),
      "A notification read time is invalid.");
  }
  contract(data.page.nextCursor === null || typeof data.page.nextCursor === "string",
    "The notification cursor is invalid.");
  return true;
}

export function validateLeagueInvitation(data) {
  contract(
    data?.code === "LEAGUE_INVITATION_FOUND" ||
      data?.code === "LEAGUE_INVITATION_ACCEPTED" ||
      data?.code === "LEAGUE_INVITATION_DECLINED",
    "The league invitation code is invalid."
  );
  contract(stableId(data.invitation?.id), "The league invitation ID is invalid.");
  contract(
    ["pending", "accepted", "declined"].includes(data.invitation.status),
    "The league invitation status is invalid."
  );
  contract(
    ["create_team", "manage_team"].includes(data.invitation.workflow),
    "The league invitation workflow is invalid."
  );
  contract(stableId(data.league?.id), "The invitation league is invalid.");
  contract(
    typeof data.league.name === "string" && data.league.name.trim() !== "",
    "The invitation league name is invalid."
  );
  contract(
    data.team === null ||
      (stableId(data.team?.id) &&
        typeof data.team.name === "string" &&
        data.team.name.trim() !== ""),
    "The invitation team is invalid."
  );
  return true;
}
