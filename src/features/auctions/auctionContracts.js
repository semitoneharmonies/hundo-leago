import { ResponseContractError } from "../../shared/api/responseContracts.js";

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA256_HEX = /^[0-9a-f]{64}$/;
const BASE64URL = /^[A-Za-z0-9_-]+$/;
const MAX_TIMESTAMP_MS = 8_640_000_000_000_000;
const MAX_UINT32 = 0xffff_ffff;
const CREATION_CUTOFF_LEAD_MS = 3_600_000;

export const AUCTION_SOURCE_KINDS = Object.freeze([
  "ordinary_weekly",
  "fad_open_rapid",
  "fad_restricted",
]);

export const AUCTION_PUBLIC_STATUSES = Object.freeze([
  "active",
  "resolved",
  "no_winner",
  "cancelled",
  "correction_required",
]);

const AUCTION_FIELDS = Object.freeze([
  "administrativeBids",
  "auctionId",
  "bidCount",
  "capabilities",
  "creationCutoffAtMs",
  "drawCommitment",
  "eligibleTeams",
  "fadId",
  "fadOrigin",
  "fadRolloverId",
  "leagueId",
  "minimumContract",
  "openedAtMs",
  "participatingTeamCount",
  "player",
  "resolvedAtMs",
  "resolvesAtMs",
  "result",
  "seasonId",
  "sourceKind",
  "status",
  "targetRolloverAtMs",
  "updatedAtMs",
  "version",
  "viewerTeams",
]);
const TEAM_FIELDS = Object.freeze([
  "logoReference",
  "name",
  "patternTemplate",
  "primaryColour",
  "secondaryColour",
  "teamId",
  "tertiaryColour",
]);
const PLAYER_FIELDS = Object.freeze(["fullName", "playerId", "positionGroup"]);
const CAPABILITY_FIELDS = Object.freeze(["allowed", "reasonCode"]);
const VIEWER_TEAM_FIELDS = Object.freeze([
  "bid",
  "edit",
  "eligible",
  "join",
  "participantStatus",
  "team",
  "teamId",
]);
const VIEWER_BID_FIELDS = Object.freeze([
  "aavCents",
  "bidId",
  "cooldownEndsAtMs",
  "editCount",
  "editLimit",
  "status",
  "termYears",
  "totalValueCents",
  "version",
]);
const FAD_VIEWER_BID_FIELDS = Object.freeze([
  ...VIEWER_BID_FIELDS,
  "bindingIllegalityConfirmedAtMs",
]);
const ADMINISTRATIVE_BID_FIELDS = Object.freeze([
  "bidId",
  "capabilities",
  "participantStatus",
  "status",
  "team",
  "teamId",
  "version",
]);
const RESULT_FIELDS = Object.freeze([
  "activityId",
  "contractId",
  "drawEvidence",
  "finalAavCents",
  "finalContractValueCents",
  "outcomeCode",
  "ownershipId",
  "recoveryId",
  "resolvedAtMs",
  "submittedAavCents",
  "submittedTermYears",
  "submittedTotalValueCents",
  "winningTeam",
]);
const DRAW_REVEAL_FIELDS = Object.freeze([
  "algorithmVersion",
  "counter",
  "digestHex",
  "nonceHex",
  "orderedBidIds",
  "selectedBidId",
  "selectedIndex",
  "selectedTeamId",
  "selectionUsed",
]);
const START_TEAM_FIELDS = Object.freeze([
  "creationCutoffAtMs",
  "fadId",
  "fadRolloverId",
  "sourceKind",
  "startAuction",
  "targetRolloverAtMs",
  "team",
  "teamId",
]);
const QUEUED_NOMINATION_FIELDS = Object.freeze([
  "aavCents",
  "acceptedAtMs",
  "bindingIllegalityConfirmedAtMs",
  "fadId",
  "openingRolloverId",
  "player",
  "queueId",
  "resolutionRolloverId",
  "status",
  "teamId",
  "termYears",
  "totalValueCents",
  "version",
]);
const BID_REMOVAL_RESULT_FIELDS = Object.freeze([
  "auction",
  "fadAllocationVersion",
  "removedBidId",
  "restrictedParticipantStatus",
]);
const CANCELLATION_RESULT_FIELDS = Object.freeze([
  "auction",
  "fadAllocation",
  "recoveryId",
]);
const CANCELLATION_ALLOCATION_FIELDS = Object.freeze([
  "allocationId",
  "allocationVersion",
  "decisionCode",
  "draws",
  "fallback",
  "player",
  "rankedOffers",
  "recoveryStatus",
  "resolvedAtMs",
  "restricted",
  "status",
  "winner",
]);
const RESOLUTION_REQUEST_FIELDS = Object.freeze([
  "acceptedAtMs",
  "auctionId",
  "occurrenceKey",
  "operationId",
  "pollDescriptor",
  "status",
]);

const BID_STATUSES = new Set(["active", "won", "lost", "withdrawn", "invalid"]);
const PARTICIPANT_STATUSES = new Set(["active", "removed"]);
const FAD_RECOVERY_STATUSES = new Set([
  "pending",
  "ready",
  "running",
  "resolved",
  "correction_required",
]);
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

function exactArray(value, location) {
  contract(Array.isArray(value), `${location} must be an array.`);
  contract(
    Object.getOwnPropertySymbols(value).length === 0 &&
      Object.keys(value).length === value.length &&
      value.every((_, index) => Object.hasOwn(value, index)),
    `${location} has an invalid shape.`
  );
  return value;
}

function stableId(value, location) {
  contract(typeof value === "string" && UUID_V4.test(value), `${location} is invalid.`);
  return value;
}

function nullableId(value, location) {
  if (value !== null) stableId(value, location);
  return value;
}

function integer(value, location, { positive = false, maximum = Number.MAX_SAFE_INTEGER } = {}) {
  contract(
    Number.isSafeInteger(value) && (positive ? value >= 1 : value >= 0) && value <= maximum,
    `${location} is invalid.`
  );
  return value;
}

function timestamp(value, location) {
  return integer(value, location, { maximum: MAX_TIMESTAMP_MS });
}

function text(value, location) {
  contract(typeof value === "string" && value.length > 0, `${location} is invalid.`);
  return value;
}

function roundedAavCents(totalValueCents, termYears) {
  const whole = Math.floor(totalValueCents / termYears);
  const remainder = totalValueCents % termYears;
  return whole + (remainder * 2 >= termYears ? 1 : 0);
}

function team(value, location) {
  exact(value, TEAM_FIELDS, location);
  stableId(value.teamId, `${location}.teamId`);
  for (const field of ["name", "patternTemplate", "primaryColour", "secondaryColour"]) {
    text(value[field], `${location}.${field}`);
  }
  for (const field of ["logoReference", "tertiaryColour"]) {
    contract(
      value[field] === null || typeof value[field] === "string",
      `${location}.${field} is invalid.`
    );
  }
  return value;
}

function player(value, location) {
  exact(value, PLAYER_FIELDS, location);
  stableId(value.playerId, `${location}.playerId`);
  text(value.fullName, `${location}.fullName`);
  contract(["F", "D"].includes(value.positionGroup), `${location}.positionGroup is invalid.`);
  return value;
}

function capability(value, location) {
  exact(value, CAPABILITY_FIELDS, location);
  contract(typeof value.allowed === "boolean", `${location}.allowed is invalid.`);
  contract(
    value.allowed ? value.reasonCode === null : ACTION_REASON_CODES.has(value.reasonCode),
    `${location}.reasonCode is invalid.`
  );
  return value;
}

function offer(value, fields, location, { enforceBidMinimum = true } = {}) {
  exact(value, fields, location);
  integer(value.termYears, `${location}.termYears`, { positive: true });
  contract(value.termYears <= 3, `${location}.termYears is invalid.`);
  integer(value.totalValueCents, `${location}.totalValueCents`, { positive: true });
  contract(
    !enforceBidMinimum ||
      (value.totalValueCents >= value.termYears * 100 &&
        (value.termYears === 1 || value.totalValueCents % 100 === 0)),
    `${location}.totalValueCents is invalid.`
  );
  contract(
    integer(value.aavCents, `${location}.aavCents`, { positive: true }) ===
      roundedAavCents(value.totalValueCents, value.termYears),
    `${location}.aavCents is inconsistent.`
  );
  return value;
}

function viewerBid(value, sourceKind, location) {
  const fad = sourceKind !== "ordinary_weekly";
  offer(value, fad ? FAD_VIEWER_BID_FIELDS : VIEWER_BID_FIELDS, location);
  stableId(value.bidId, `${location}.bidId`);
  integer(value.version, `${location}.version`, { positive: true });
  contract(BID_STATUSES.has(value.status), `${location}.status is invalid.`);
  integer(value.editCount, `${location}.editCount`);
  integer(value.editLimit, `${location}.editLimit`);
  contract(value.editCount <= value.editLimit, `${location}.editCount is invalid.`);
  timestamp(value.cooldownEndsAtMs, `${location}.cooldownEndsAtMs`);
  if (fad) {
    timestamp(
      value.bindingIllegalityConfirmedAtMs,
      `${location}.bindingIllegalityConfirmedAtMs`
    );
  }
  return value;
}

function unique(set, value, location) {
  contract(!set.has(value), `${location} is duplicated.`);
  set.add(value);
}

function eligibleTeams(value, restricted, location) {
  exactArray(value, location);
  contract(restricted || value.length === 0, `${location} must be empty.`);
  const ids = new Set();
  value.forEach((item, index) => {
    team(item, `${location}[${index}]`);
    unique(ids, item.teamId, `${location}[${index}].teamId`);
  });
  return ids;
}

function viewerTeams(value, sourceKind, eligibleIds, location) {
  exactArray(value, location);
  const restricted = sourceKind === "fad_restricted";
  const teamIds = new Set();
  const bidIds = new Set();
  value.forEach((row, index) => {
    const rowLocation = `${location}[${index}]`;
    exact(row, VIEWER_TEAM_FIELDS, rowLocation);
    stableId(row.teamId, `${rowLocation}.teamId`);
    unique(teamIds, row.teamId, `${rowLocation}.teamId`);
    team(row.team, `${rowLocation}.team`);
    contract(row.team.teamId === row.teamId, `${rowLocation}.team is mismatched.`);
    contract(typeof row.eligible === "boolean", `${rowLocation}.eligible is invalid.`);
    if (restricted) {
      contract(
        row.participantStatus === null || PARTICIPANT_STATUSES.has(row.participantStatus),
        `${rowLocation}.participantStatus is invalid.`
      );
      contract(
        row.eligible === (row.participantStatus === "active"),
        `${rowLocation}.eligible is inconsistent.`
      );
      contract(
        row.participantStatus === null || eligibleIds.has(row.teamId),
        `${rowLocation}.participantStatus is inconsistent.`
      );
    } else {
      contract(
        row.participantStatus === null && row.eligible === true,
        `${rowLocation} is inconsistent with the auction context.`
      );
    }
    if (row.bid !== null) {
      viewerBid(row.bid, sourceKind, `${rowLocation}.bid`);
      unique(bidIds, row.bid.bidId, `${rowLocation}.bid.bidId`);
    }
    capability(row.join, `${rowLocation}.join`);
    capability(row.edit, `${rowLocation}.edit`);
  });
}

function administrativeBids(value, sourceKind, location) {
  exactArray(value, location);
  const restricted = sourceKind === "fad_restricted";
  const bidIds = new Set();
  const activeTeamIds = new Set();
  value.forEach((row, index) => {
    const rowLocation = `${location}[${index}]`;
    exact(row, ADMINISTRATIVE_BID_FIELDS, rowLocation);
    stableId(row.bidId, `${rowLocation}.bidId`);
    stableId(row.teamId, `${rowLocation}.teamId`);
    unique(bidIds, row.bidId, `${rowLocation}.bidId`);
    if (row.status === "active") unique(activeTeamIds, row.teamId, `${rowLocation}.teamId`);
    team(row.team, `${rowLocation}.team`);
    contract(row.team.teamId === row.teamId, `${rowLocation}.team is mismatched.`);
    integer(row.version, `${rowLocation}.version`, { positive: true });
    contract(BID_STATUSES.has(row.status), `${rowLocation}.status is invalid.`);
    contract(
      restricted
        ? PARTICIPANT_STATUSES.has(row.participantStatus)
        : row.participantStatus === null,
      `${rowLocation}.participantStatus is invalid.`
    );
    exact(
      row.capabilities,
      ["adminEditBid", "adminRemoveBid"],
      `${rowLocation}.capabilities`
    );
    capability(row.capabilities.adminEditBid, `${rowLocation}.capabilities.adminEditBid`);
    capability(
      row.capabilities.adminRemoveBid,
      `${rowLocation}.capabilities.adminRemoveBid`
    );
  });
}

function auctionContext(value, location) {
  contract(AUCTION_SOURCE_KINDS.includes(value.sourceKind), `${location}.sourceKind is invalid.`);
  const fad = value.sourceKind !== "ordinary_weekly";
  const restricted = value.sourceKind === "fad_restricted";
  if (!fad) {
    for (const field of [
      "fadOrigin",
      "fadId",
      "fadRolloverId",
      "targetRolloverAtMs",
      "creationCutoffAtMs",
      "minimumContract",
      "drawCommitment",
    ]) {
      contract(value[field] === null, `${location}.${field} is invalid.`);
    }
  } else {
    stableId(value.fadId, `${location}.fadId`);
    stableId(value.fadRolloverId, `${location}.fadRolloverId`);
    const target = timestamp(value.targetRolloverAtMs, `${location}.targetRolloverAtMs`);
    const cutoff = timestamp(value.creationCutoffAtMs, `${location}.creationCutoffAtMs`);
    contract(cutoff === target - CREATION_CUTOFF_LEAD_MS, `${location} cutoff is inconsistent.`);
    const originAllowed = restricted
      ? value.fadOrigin === "candidate_tie_restricted"
      : [
          "manager_nomination",
          "queued_nomination",
          "restricted_no_improvement_fallback",
        ].includes(value.fadOrigin);
    contract(originAllowed, `${location}.fadOrigin is invalid.`);
    const minimumRequired =
      restricted || value.fadOrigin === "restricted_no_improvement_fallback";
    contract(
      minimumRequired === (value.minimumContract !== null),
      `${location}.minimumContract is inconsistent.`
    );
    if (value.minimumContract !== null) {
      offer(
        value.minimumContract,
        ["aavCents", "termYears", "totalValueCents"],
        `${location}.minimumContract`,
        { enforceBidMinimum: false }
      );
    }
    contract(
      value.drawCommitment === null || SHA256_HEX.test(value.drawCommitment),
      `${location}.drawCommitment is invalid.`
    );
    contract(
      value.status !== "active" || value.drawCommitment !== null,
      `${location}.drawCommitment is required while active.`
    );
  }
  return {
    fad,
    restricted,
    eligibleIds: eligibleTeams(value.eligibleTeams, restricted, `${location}.eligibleTeams`),
  };
}

function drawReveal(value, auction, result, commitmentHex, location) {
  exact(value, DRAW_REVEAL_FIELDS, location);
  contract(value.algorithmVersion === 1, `${location}.algorithmVersion is invalid.`);
  contract(SHA256_HEX.test(value.nonceHex), `${location}.nonceHex is invalid.`);
  contract(typeof value.selectionUsed === "boolean", `${location}.selectionUsed is invalid.`);
  exactArray(value.orderedBidIds, `${location}.orderedBidIds`);
  if (!value.selectionUsed) {
    contract(value.orderedBidIds.length === 0, `${location}.orderedBidIds must be empty.`);
    for (const field of [
      "counter",
      "digestHex",
      "selectedIndex",
      "selectedBidId",
      "selectedTeamId",
    ]) {
      contract(value[field] === null, `${location}.${field} must be null.`);
    }
    return;
  }
  contract(value.orderedBidIds.length >= 2, `${location}.orderedBidIds is invalid.`);
  const ids = new Set();
  value.orderedBidIds.forEach((bidId, index) => {
    stableId(bidId, `${location}.orderedBidIds[${index}]`);
    unique(ids, bidId, `${location}.orderedBidIds[${index}]`);
  });
  contract(
    [...value.orderedBidIds].sort().every((bidId, index) => bidId === value.orderedBidIds[index]),
    `${location}.orderedBidIds is not canonical.`
  );
  integer(value.counter, `${location}.counter`, { maximum: MAX_UINT32 });
  contract(SHA256_HEX.test(value.digestHex), `${location}.digestHex is invalid.`);
  integer(value.selectedIndex, `${location}.selectedIndex`);
  contract(value.selectedIndex < value.orderedBidIds.length, `${location}.selectedIndex is invalid.`);
  stableId(value.selectedBidId, `${location}.selectedBidId`);
  stableId(value.selectedTeamId, `${location}.selectedTeamId`);
  contract(
    value.selectedBidId === value.orderedBidIds[value.selectedIndex],
    `${location}.selectedBidId is inconsistent.`
  );
  contract(
    auction.status !== "resolved" || value.selectedTeamId === result.winningTeam.teamId,
    `${location}.selectedTeamId is inconsistent.`
  );
  contract(SHA256_HEX.test(commitmentHex), `${location} commitment is invalid.`);
}

function drawEvidence(value, auction, result, location) {
  exact(value, ["commitmentHex", "reveal"], location);
  contract(SHA256_HEX.test(value.commitmentHex), `${location}.commitmentHex is invalid.`);
  contract(
    auction.drawCommitment === null || auction.drawCommitment === value.commitmentHex,
    `${location}.commitmentHex is inconsistent.`
  );
  if (value.reveal === null) {
    contract(
      auction.status === "correction_required" && auction.drawCommitment !== null,
      `${location}.reveal is invalid.`
    );
    return;
  }
  drawReveal(value.reveal, auction, result, value.commitmentHex, `${location}.reveal`);
  contract(
    !["no_winner", "cancelled"].includes(auction.status) || !value.reveal.selectionUsed,
    `${location}.reveal selection is invalid.`
  );
}

function nullablePositive(value, location) {
  if (value !== null) integer(value, location, { positive: true });
  return value;
}

function terminalResult(value, auction, fad, location) {
  exact(value, RESULT_FIELDS, location);
  contract(value.outcomeCode === auction.status, `${location}.outcomeCode is inconsistent.`);
  contract(
    timestamp(value.resolvedAtMs, `${location}.resolvedAtMs`) === auction.resolvedAtMs,
    `${location}.resolvedAtMs is inconsistent.`
  );
  for (const field of ["activityId", "contractId", "ownershipId", "recoveryId"]) {
    nullableId(value[field], `${location}.${field}`);
  }
  for (const field of [
    "submittedTotalValueCents",
    "submittedTermYears",
    "submittedAavCents",
    "finalContractValueCents",
    "finalAavCents",
  ]) {
    nullablePositive(value[field], `${location}.${field}`);
  }
  const winnerFields = [
    value.winningTeam,
    value.submittedTotalValueCents,
    value.submittedTermYears,
    value.submittedAavCents,
    value.finalContractValueCents,
    value.finalAavCents,
    value.contractId,
    value.ownershipId,
  ];
  if (auction.status === "resolved") {
    contract(winnerFields.every((field) => field !== null), `${location} winner is incomplete.`);
    team(value.winningTeam, `${location}.winningTeam`);
    contract(value.submittedTermYears <= 3, `${location}.submittedTermYears is invalid.`);
    contract(
      roundedAavCents(value.submittedTotalValueCents, value.submittedTermYears) ===
        value.submittedAavCents,
      `${location}.submittedAavCents is inconsistent.`
    );
    contract(
      roundedAavCents(value.finalContractValueCents, value.submittedTermYears) ===
        value.finalAavCents,
      `${location}.finalAavCents is inconsistent.`
    );
  } else {
    contract(winnerFields.every((field) => field === null), `${location} winner must be null.`);
  }
  contract(
    auction.status !== "correction_required" || value.recoveryId !== null,
    `${location}.recoveryId is required.`
  );
  if (fad) {
    contract(value.drawEvidence !== null, `${location}.drawEvidence is required.`);
    drawEvidence(value.drawEvidence, auction, value, `${location}.drawEvidence`);
  } else {
    contract(value.drawEvidence === null, `${location}.drawEvidence must be null.`);
  }
}

export function validateAuction(value) {
  exact(value, AUCTION_FIELDS, "Auction");
  for (const field of ["auctionId", "leagueId", "seasonId"]) {
    stableId(value[field], `Auction.${field}`);
  }
  integer(value.version, "Auction.version", { positive: true });
  player(value.player, "Auction.player");
  contract(AUCTION_PUBLIC_STATUSES.includes(value.status), "Auction.status is invalid.");
  const openedAtMs = timestamp(value.openedAtMs, "Auction.openedAtMs");
  const resolvesAtMs = timestamp(value.resolvesAtMs, "Auction.resolvesAtMs");
  const updatedAtMs = timestamp(value.updatedAtMs, "Auction.updatedAtMs");
  contract(resolvesAtMs > openedAtMs, "Auction resolution time is invalid.");
  contract(updatedAtMs >= openedAtMs, "Auction update time is invalid.");
  integer(value.bidCount, "Auction.bidCount");
  integer(value.participatingTeamCount, "Auction.participatingTeamCount");
  contract(
    value.participatingTeamCount <= value.bidCount,
    "Auction participating-team count is invalid."
  );
  const context = auctionContext(value, "Auction");
  if (context.fad) {
    contract(
      value.targetRolloverAtMs === resolvesAtMs,
      "Auction target rollover is inconsistent with its resolution time."
    );
  }
  if (value.status === "active") {
    contract(value.resolvedAtMs === null && value.result === null, "Auction active state is invalid.");
  } else {
    timestamp(value.resolvedAtMs, "Auction.resolvedAtMs");
    contract(value.result !== null, "Auction terminal result is missing.");
    terminalResult(value.result, value, context.fad, "Auction.result");
  }
  viewerTeams(value.viewerTeams, value.sourceKind, context.eligibleIds, "Auction.viewerTeams");
  administrativeBids(value.administrativeBids, value.sourceKind, "Auction.administrativeBids");
  exact(value.capabilities, ["adminCancel", "adminResolve", "view"], "Auction.capabilities");
  capability(value.capabilities.view, "Auction.capabilities.view");
  capability(value.capabilities.adminCancel, "Auction.capabilities.adminCancel");
  capability(value.capabilities.adminResolve, "Auction.capabilities.adminResolve");
  const signalsAdministrativeScope = (capabilityValue) =>
    capabilityValue.allowed || capabilityValue.reasonCode !== "NOT_AUTHORIZED";
  contract(
    value.administrativeBids.length === 0 ||
      signalsAdministrativeScope(value.capabilities.adminCancel) ||
      signalsAdministrativeScope(value.capabilities.adminResolve) ||
      value.administrativeBids.some(
        (bid) =>
          signalsAdministrativeScope(bid.capabilities.adminEditBid) ||
          signalsAdministrativeScope(bid.capabilities.adminRemoveBid)
      ),
    "Auction administrative bids lack authorization evidence."
  );
  return true;
}

export function validateAuctionCollection(value) {
  exactArray(value, "Auction collection");
  value.forEach((auction) => validateAuction(auction));
  return true;
}

function startTeam(value, location) {
  exact(value, START_TEAM_FIELDS, location);
  stableId(value.teamId, `${location}.teamId`);
  team(value.team, `${location}.team`);
  contract(value.team.teamId === value.teamId, `${location}.team is mismatched.`);
  capability(value.startAuction, `${location}.startAuction`);
  if (value.sourceKind === "ordinary_weekly") {
    for (const field of [
      "fadId",
      "fadRolloverId",
      "targetRolloverAtMs",
      "creationCutoffAtMs",
    ]) {
      contract(value[field] === null, `${location}.${field} is invalid.`);
    }
  } else {
    contract(value.sourceKind === "fad_open_rapid", `${location}.sourceKind is invalid.`);
    stableId(value.fadId, `${location}.fadId`);
    const rolloverValues = [
      value.fadRolloverId,
      value.targetRolloverAtMs,
      value.creationCutoffAtMs,
    ];
    const allNull = rolloverValues.every((item) => item === null);
    const allPresent = rolloverValues.every((item) => item !== null);
    contract(allNull || allPresent, `${location} rollover identity is inconsistent.`);
    if (allPresent) {
      stableId(value.fadRolloverId, `${location}.fadRolloverId`);
      const target = timestamp(value.targetRolloverAtMs, `${location}.targetRolloverAtMs`);
      const cutoff = timestamp(value.creationCutoffAtMs, `${location}.creationCutoffAtMs`);
      contract(cutoff === target - CREATION_CUTOFF_LEAD_MS, `${location} cutoff is inconsistent.`);
    }
  }
}

export function validateAuctionActions(value) {
  exact(value, ["startTeams"], "Auction actions");
  exactArray(value.startTeams, "Auction actions.startTeams");
  const teamIds = new Set();
  value.startTeams.forEach((row, index) => {
    startTeam(row, `Auction actions.startTeams[${index}]`);
    unique(teamIds, row.teamId, `Auction actions.startTeams[${index}].teamId`);
  });
  return true;
}

export function validateAuctionPage(value) {
  exact(value, ["hasMore", "nextCursor"], "Auction page");
  contract(typeof value.hasMore === "boolean", "Auction page.hasMore is invalid.");
  if (value.nextCursor !== null) {
    contract(
      typeof value.nextCursor === "string" &&
        Array.from(value.nextCursor).length >= 1 &&
        Array.from(value.nextCursor).length <= 1_024 &&
        BASE64URL.test(value.nextCursor) &&
        value.nextCursor.length % 4 !== 1,
      "Auction page.nextCursor is invalid."
    );
  }
  contract(
    value.hasMore === (value.nextCursor !== null),
    "Auction page cursor state is inconsistent."
  );
  return true;
}

function queuedNomination(value, location) {
  exact(value, QUEUED_NOMINATION_FIELDS, location);
  for (const field of ["queueId", "fadId", "teamId", "openingRolloverId"]) {
    stableId(value[field], `${location}.${field}`);
  }
  nullableId(value.resolutionRolloverId, `${location}.resolutionRolloverId`);
  player(value.player, `${location}.player`);
  offer(
    value,
    QUEUED_NOMINATION_FIELDS,
    location
  );
  const acceptedAtMs = timestamp(value.acceptedAtMs, `${location}.acceptedAtMs`);
  contract(
    timestamp(
      value.bindingIllegalityConfirmedAtMs,
      `${location}.bindingIllegalityConfirmedAtMs`
    ) === acceptedAtMs,
    `${location} confirmation time is inconsistent.`
  );
  contract(["queued", "opened", "invalid"].includes(value.status), `${location}.status is invalid.`);
  integer(value.version, `${location}.version`, { positive: true });
}

function ordinaryAuctionStartResult(value) {
  exact(value, ["auction", "code", "event", "openingBid", "replayed"], "Auction start result");
  contract(value.code === "AUCTION_STARTED", "Auction start result.code is invalid.");
  contract(typeof value.replayed === "boolean", "Auction start result.replayed is invalid.");
  exact(
    value.auction,
    [
      "bidClosesAtMs",
      "id",
      "leagueId",
      "openedAtMs",
      "openedByUserId",
      "playerId",
      "scheduledResolutionAtMs",
      "seasonId",
      "status",
      "version",
    ],
    "Auction start result.auction"
  );
  for (const field of ["id", "leagueId", "seasonId", "playerId", "openedByUserId"]) {
    stableId(value.auction[field], `Auction start result.auction.${field}`);
  }
  contract(value.auction.status === "Active", "Auction start result.auction.status is invalid.");
  timestamp(value.auction.openedAtMs, "Auction start result.auction.openedAtMs");
  const close = timestamp(value.auction.bidClosesAtMs, "Auction start result.auction.bidClosesAtMs");
  contract(
    value.auction.scheduledResolutionAtMs === close,
    "Auction start result.auction schedule is inconsistent."
  );
  integer(value.auction.version, "Auction start result.auction.version", { positive: true });
  const fullBidFields = [
    "aavCents",
    "editCount",
    "firstSubmittedAtMs",
    "id",
    "lastEditedAtMs",
    "status",
    "submittedByUserId",
    "teamId",
    "termYears",
    "totalValueCents",
    "version",
  ];
  const safeBidFields = ["id", "status", "teamId", "version"];
  const bidFields = Object.keys(value.openingBid || {}).sort().join("|");
  if (bidFields === [...fullBidFields].sort().join("|")) {
    offer(value.openingBid, fullBidFields, "Auction start result.openingBid");
    stableId(value.openingBid.submittedByUserId, "Auction start result.openingBid.submittedByUserId");
    timestamp(value.openingBid.firstSubmittedAtMs, "Auction start result.openingBid.firstSubmittedAtMs");
    timestamp(value.openingBid.lastEditedAtMs, "Auction start result.openingBid.lastEditedAtMs");
    integer(value.openingBid.editCount, "Auction start result.openingBid.editCount");
  } else {
    exact(value.openingBid, safeBidFields, "Auction start result.openingBid");
  }
  stableId(value.openingBid.id, "Auction start result.openingBid.id");
  stableId(value.openingBid.teamId, "Auction start result.openingBid.teamId");
  contract(value.openingBid.status === "active", "Auction start result.openingBid.status is invalid.");
  integer(value.openingBid.version, "Auction start result.openingBid.version", { positive: true });
  exact(value.event, ["id", "occurredAtMs", "type"], "Auction start result.event");
  stableId(value.event.id, "Auction start result.event.id");
  contract(value.event.type === "auction_started", "Auction start result.event.type is invalid.");
  timestamp(value.event.occurredAtMs, "Auction start result.event.occurredAtMs");
}

export function validateAuctionStartResult(value) {
  if (record(value) && Object.hasOwn(value, "kind")) {
    exact(value, ["auction", "kind", "queuedNomination"], "Auction start result");
    contract(
      ["auction_opened", "nomination_queued"].includes(value.kind),
      "Auction start result.kind is invalid."
    );
    if (value.kind === "auction_opened") {
      contract(value.auction !== null, "Auction start result.auction is missing.");
      validateAuction(value.auction);
      contract(
        value.auction.sourceKind === "fad_open_rapid",
        "Auction start result.auction context is invalid."
      );
      contract(value.queuedNomination === null, "Auction start result queue must be null.");
    } else {
      contract(value.auction === null, "Auction start result.auction must be null.");
      queuedNomination(value.queuedNomination, "Auction start result.queuedNomination");
    }
    return true;
  }
  ordinaryAuctionStartResult(value);
  return true;
}

export function validateAuctionBidResult(value) {
  exact(value, ["auction", "bid", "code", "replayed"], "Auction bid result");
  contract(
    ["AUCTION_BID_SUBMITTED", "AUCTION_BID_EDITED"].includes(value.code),
    "Auction bid result.code is invalid."
  );
  contract(typeof value.replayed === "boolean", "Auction bid result.replayed is invalid.");
  exact(
    value.auction,
    ["bidClosesAtMs", "id", "leagueId", "openedAtMs", "seasonId", "status"],
    "Auction bid result.auction"
  );
  for (const field of ["id", "leagueId", "seasonId"]) {
    stableId(value.auction[field], `Auction bid result.auction.${field}`);
  }
  contract(value.auction.status === "open", "Auction bid result.auction.status is invalid.");
  timestamp(value.auction.openedAtMs, "Auction bid result.auction.openedAtMs");
  timestamp(value.auction.bidClosesAtMs, "Auction bid result.auction.bidClosesAtMs");
  const bidFields = [
    "aavCents",
    "editCount",
    "firstSubmittedAtMs",
    "id",
    "lastEditedAtMs",
    "status",
    "teamId",
    "termYears",
    "totalValueCents",
    "version",
  ];
  offer(value.bid, bidFields, "Auction bid result.bid");
  stableId(value.bid.id, "Auction bid result.bid.id");
  stableId(value.bid.teamId, "Auction bid result.bid.teamId");
  timestamp(value.bid.firstSubmittedAtMs, "Auction bid result.bid.firstSubmittedAtMs");
  timestamp(value.bid.lastEditedAtMs, "Auction bid result.bid.lastEditedAtMs");
  integer(value.bid.editCount, "Auction bid result.bid.editCount");
  contract(value.bid.status === "active", "Auction bid result.bid.status is invalid.");
  integer(value.bid.version, "Auction bid result.bid.version", { positive: true });
  contract(
    (value.code === "AUCTION_BID_SUBMITTED") === (value.bid.version === 1),
    "Auction bid result action is inconsistent."
  );
  return true;
}

export function validateAuctionBidRemovalResult(value) {
  exact(value, BID_REMOVAL_RESULT_FIELDS, "Auction bid-removal result");
  validateAuction(value.auction);
  stableId(value.removedBidId, "Auction bid-removal result.removedBidId");
  contract(
    value.restrictedParticipantStatus === null ||
      PARTICIPANT_STATUSES.has(value.restrictedParticipantStatus),
    "Auction bid-removal result.restrictedParticipantStatus is invalid."
  );
  if (value.fadAllocationVersion !== null) {
    integer(value.fadAllocationVersion, "Auction bid-removal result.fadAllocationVersion", {
      positive: true,
    });
  }
  const restricted = value.auction.sourceKind === "fad_restricted";
  contract(
    restricted
      ? value.restrictedParticipantStatus === "removed" &&
          value.fadAllocationVersion !== null
      : value.restrictedParticipantStatus === null &&
          value.fadAllocationVersion === null,
    "Auction bid-removal result is inconsistent with its auction context."
  );
  return true;
}

function cancellationAllocation(value, location) {
  exact(value, CANCELLATION_ALLOCATION_FIELDS, location);
  stableId(value.allocationId, `${location}.allocationId`);
  integer(value.allocationVersion, `${location}.allocationVersion`, { positive: true });
  player(value.player, `${location}.player`);
  text(value.status, `${location}.status`);
  text(value.decisionCode, `${location}.decisionCode`);
  exactArray(value.draws, `${location}.draws`);
  exactArray(value.rankedOffers, `${location}.rankedOffers`);
  for (const field of ["fallback", "restricted", "winner"]) {
    contract(
      value[field] === null || record(value[field]),
      `${location}.${field} is invalid.`
    );
  }
  if (value.resolvedAtMs !== null) timestamp(value.resolvedAtMs, `${location}.resolvedAtMs`);
  contract(
    value.recoveryStatus === null || FAD_RECOVERY_STATUSES.has(value.recoveryStatus),
    `${location}.recoveryStatus is invalid.`
  );
}

export function validateAuctionCancellationResult(value) {
  exact(value, CANCELLATION_RESULT_FIELDS, "Auction cancellation result");
  validateAuction(value.auction);
  nullableId(value.recoveryId, "Auction cancellation result.recoveryId");
  if (value.fadAllocation !== null) {
    cancellationAllocation(
      value.fadAllocation,
      "Auction cancellation result.fadAllocation"
    );
    contract(
      value.fadAllocation.player.playerId === value.auction.player.playerId,
      "Auction cancellation result player is mismatched."
    );
  }
  const resultRecoveryId = value.auction.result?.recoveryId ?? null;
  if (value.auction.sourceKind === "ordinary_weekly") {
    contract(
      value.auction.status === "cancelled" &&
        value.fadAllocation === null &&
        value.recoveryId === null,
      "Auction cancellation result is inconsistent with an ordinary auction."
    );
  } else if (value.auction.sourceKind === "fad_open_rapid") {
    contract(
      value.auction.status === "cancelled" &&
        value.fadAllocation === null &&
        value.recoveryId !== null &&
        resultRecoveryId === value.recoveryId,
      "Auction cancellation result is inconsistent with an open FAD auction."
    );
  } else {
    contract(
      value.auction.status === "correction_required" &&
        value.fadAllocation !== null &&
        value.fadAllocation.status === "correction_required" &&
        value.fadAllocation.recoveryStatus === "correction_required" &&
        value.recoveryId !== null &&
        resultRecoveryId === value.recoveryId,
      "Auction cancellation result is inconsistent with a restricted FAD auction."
    );
  }
  return true;
}

export function validateAuctionResolutionRequest(value) {
  exact(value, RESOLUTION_REQUEST_FIELDS, "Auction resolution request");
  stableId(value.operationId, "Auction resolution request.operationId");
  stableId(value.auctionId, "Auction resolution request.auctionId");
  contract(
    ["pending", "already_succeeded"].includes(value.status),
    "Auction resolution request.status is invalid."
  );
  timestamp(value.acceptedAtMs, "Auction resolution request.acceptedAtMs");
  exact(
    value.pollDescriptor,
    ["auctionId", "kind", "leagueId"],
    "Auction resolution request.pollDescriptor"
  );
  contract(
    value.pollDescriptor.kind === "auction",
    "Auction resolution request.pollDescriptor.kind is invalid."
  );
  stableId(
    value.pollDescriptor.leagueId,
    "Auction resolution request.pollDescriptor.leagueId"
  );
  stableId(
    value.pollDescriptor.auctionId,
    "Auction resolution request.pollDescriptor.auctionId"
  );
  contract(
    value.pollDescriptor.auctionId === value.auctionId,
    "Auction resolution request poll auction is mismatched."
  );
  const prefix = `auction:${value.auctionId}:`;
  const scheduledFor =
    typeof value.occurrenceKey === "string" && value.occurrenceKey.startsWith(prefix)
      ? value.occurrenceKey.slice(prefix.length)
      : "";
  contract(
    /^(0|[1-9][0-9]*)$/u.test(scheduledFor) &&
      Number.isSafeInteger(Number(scheduledFor)) &&
      Number(scheduledFor) <= MAX_TIMESTAMP_MS,
    "Auction resolution request.occurrenceKey is invalid."
  );
  return true;
}
