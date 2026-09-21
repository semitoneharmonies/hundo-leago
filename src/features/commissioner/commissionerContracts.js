import {
  ResponseContractError,
  assertIntegerField,
  assertResourceIdentity,
} from "../../shared/api/responseContracts.js";

const BACKUP_ID = /^backup-v1-[a-f0-9]{64}$/;

function contract(condition, message) {
  if (!condition) throw new ResponseContractError(message);
}

function record(value, message) {
  contract(
    value !== null && typeof value === "object" && !Array.isArray(value),
    message
  );
  return value;
}

function nullableInteger(value, message) {
  contract(
    value === null || (Number.isSafeInteger(value) && value >= 0),
    message
  );
}

function validateCap(cap) {
  record(cap, "The team cap must be an object.");
  for (const field of ["capLimitCents", "capUsageCents", "capSpaceCents"]) {
    assertIntegerField(cap, field);
  }
  contract(typeof cap.overCap === "boolean", "The over-cap status is invalid.");
  contract(typeof cap.complete === "boolean", "The cap completeness is invalid.");
  contract(Array.isArray(cap.issues), "The cap issues are invalid.");
}

function validateContract(contractValue) {
  if (contractValue === null) return;
  assertResourceIdentity(contractValue, { requireVersion: true });
  assertResourceIdentity({ id: contractValue.teamId });
  assertResourceIdentity({ id: contractValue.startSeasonId });
  for (const field of [
    "originalTotalValueCents",
    "originalTermYears",
    "aavCents",
  ]) {
    assertIntegerField(contractValue, field, { min: 0 });
  }
  contract(
    typeof contractValue.type === "string" && contractValue.type.length > 0,
    "The contract type is invalid."
  );
  contract(
    typeof contractValue.status === "string" &&
      contractValue.status.length > 0,
    "The contract status is invalid."
  );
  nullableInteger(
    contractValue.auctionBuyoutLockExpiresAtMs,
    "The contract buyout lock is invalid."
  );
  contract(Array.isArray(contractValue.years), "The contract years are invalid.");
  for (const year of contractValue.years) {
    assertResourceIdentity(year);
    assertResourceIdentity({ id: year.seasonId });
    assertIntegerField(year, "yearNumber", { min: 1 });
    assertIntegerField(year, "aavCents", { min: 0 });
    contract(
      typeof year.status === "string" && year.status.length > 0,
      "The contract-year status is invalid."
    );
    nullableInteger(year.rolloverAtMs, "The contract-year rollover is invalid.");
  }
}

function validateProviderAttempt(attempt, successful) {
  if (attempt === null) return;
  assertResourceIdentity(attempt);
  contract(
    typeof attempt.nhlSeasonKey === "string" &&
      attempt.nhlSeasonKey.length > 0,
    "The provider season key is invalid."
  );
  contract(
    typeof attempt.status === "string" && attempt.status.length > 0,
    "The provider attempt status is invalid."
  );
  assertIntegerField(attempt, "startedAtMs", { min: 0 });
  nullableInteger(attempt.completedAtMs, "The provider completion time is invalid.");
  if (successful) {
    assertIntegerField(attempt, "playerCount", { min: 0 });
  } else {
    nullableInteger(attempt.playerCount, "The provider player count is invalid.");
  }
  if (!successful) {
    contract(
      attempt.errorCode === null ||
        (typeof attempt.errorCode === "string" && attempt.errorCode.length > 0),
      "The provider error code is invalid."
    );
  }
}

export function validateCommissionerWorkspace(data) {
  record(data, "The commissioner workspace response must be an object.");
  contract(
    data.code === "COMMISSIONER_ROSTER_WORKSPACE_FOUND",
    "The commissioner workspace code is invalid."
  );
  const workspace = record(
    data.workspace,
    "The commissioner workspace is invalid."
  );
  assertResourceIdentity(workspace.league);
  assertResourceIdentity({ id: workspace.league.currentSeasonId });
  assertIntegerField(workspace.league, "salaryCapCents", { min: 0 });
  contract(
    typeof workspace.league.name === "string" &&
      workspace.league.name.trim().length > 0,
    "The commissioner workspace league name is invalid."
  );
  contract(
    typeof workspace.league.currentSeasonLabel === "string" &&
      workspace.league.currentSeasonLabel.trim().length > 0,
    "The commissioner workspace season label is invalid."
  );

  contract(Array.isArray(workspace.teams), "The workspace teams are invalid.");
  for (const team of workspace.teams) {
    assertResourceIdentity(team, { requireVersion: true });
    contract(
      typeof team.name === "string" && team.name.trim().length > 0,
      "The workspace team name is invalid."
    );
    validateCap(team.cap);
  }

  contract(
    Array.isArray(workspace.seasons),
    "The workspace contract seasons are invalid."
  );
  for (const season of workspace.seasons) {
    assertResourceIdentity(season);
    contract(
      typeof season.status === "string" && season.status.length > 0,
      "A workspace contract-season status is invalid."
    );
    assertIntegerField(season, "sequence", { min: 1 });
    contract(
      typeof season.label === "string" && season.label.trim().length > 0,
      "A workspace contract-season label is invalid."
    );
    contract(
      typeof season.nhlSeasonKey === "string" &&
        season.nhlSeasonKey.trim().length > 0,
      "A workspace NHL season key is invalid."
    );
  }
  contract(
    new Set(workspace.seasons.map((season) => season.id)).size ===
      workspace.seasons.length,
    "The workspace contract seasons contain duplicate IDs."
  );

  contract(Array.isArray(workspace.roster), "The workspace roster is invalid.");
  for (const rosterEntry of workspace.roster) {
    assertResourceIdentity({ id: rosterEntry.ownershipId });
    assertIntegerField(rosterEntry, "ownershipVersion", { min: 1 });
    for (const field of ["seasonId", "playerId", "teamId"]) {
      assertResourceIdentity({ id: rosterEntry[field] });
    }
    assertResourceIdentity(rosterEntry.player);
    contract(
      typeof rosterEntry.player.fullName === "string" &&
        rosterEntry.player.fullName.trim().length > 0,
      "The roster player name is invalid."
    );
    contract(
      ["F", "D"].includes(rosterEntry.positionGroup),
      "The roster position group is invalid."
    );
    contract(
      rosterEntry.slotNumber === null ||
        (Number.isSafeInteger(rosterEntry.slotNumber) &&
          rosterEntry.slotNumber >= 1),
      "The roster slot is invalid."
    );
    validateContract(rosterEntry.contract);
  }

  contract(
    Array.isArray(workspace.freeAgents),
    "The workspace free agents are invalid."
  );
  for (const player of workspace.freeAgents) {
    assertResourceIdentity({ id: player.playerId });
    contract(
      typeof player.fullName === "string" && player.fullName.trim().length > 0,
      "The free-agent name is invalid."
    );
  }

  const providerHealth = record(
    workspace.providerHealth,
    "The provider health is invalid."
  );
  contract(
    typeof providerHealth.provider === "string" &&
      providerHealth.provider.length > 0,
    "The provider identity is invalid."
  );
  contract(
    typeof providerHealth.enabled === "boolean",
    "The provider enabled status is invalid."
  );
  contract(
    typeof providerHealth.stale === "boolean",
    "The provider stale status is invalid."
  );
  assertIntegerField(providerHealth, "staleAfterMs", { min: 0 });
  assertIntegerField(providerHealth, "catalogPlayerCount", { min: 0 });
  validateProviderAttempt(providerHealth.lastAttempt, false);
  validateProviderAttempt(providerHealth.lastSuccessfulImport, true);
  return true;
}

function validateWarnings(value) {
  contract(Array.isArray(value), "The correction warnings are invalid.");
  for (const warning of value) {
    record(warning, "A correction warning is invalid.");
    contract(
      typeof warning.code === "string" && warning.code.length > 0,
      "A correction warning code is invalid."
    );
  }
}

export function validateCommissionerCorrectionResult(data, expectedPreview) {
  record(data, "The commissioner correction response must be an object.");
  contract(
    typeof data.code === "string" &&
      data.code.startsWith("COMMISSIONER_"),
    "The commissioner correction code is invalid."
  );
  contract(
    data.preview === expectedPreview,
    "The commissioner correction preview status is invalid."
  );
  contract(
    data.before === null ||
      (typeof data.before === "object" && !Array.isArray(data.before)),
    "The correction before-state is invalid."
  );
  record(data.requested, "The correction request projection is invalid.");
  record(data.authoritative, "The correction projection is invalid.");
  validateWarnings(data.warnings);
  contract(Array.isArray(data.capImpact), "The correction cap impact is invalid.");
  for (const impact of data.capImpact) {
    assertResourceIdentity({ id: impact.teamId });
    validateCap(impact.cap);
    validateWarnings(impact.warnings);
  }
  if (!expectedPreview) {
    const evidence = record(
      data.evidence,
      "The correction audit evidence is invalid."
    );
    assertResourceIdentity({ id: evidence.correctionId });
    assertResourceIdentity({ id: evidence.activityId });
    contract(
      typeof evidence.activityType === "string" &&
        evidence.activityType.length > 0,
      "The correction activity type is invalid."
    );
    assertIntegerField(evidence, "occurredAtMs", { min: 0 });
  }
  return true;
}

export function validateStagingFixtureResetResult(data) {
  record(data, "The staging reset response must be an object.");
  contract(
    data.code === "STAGING_FIXTURE_RESET_COMPLETED",
    "The staging reset code is invalid."
  );
  contract(
    typeof data.fixtureBuildId === "string" &&
      data.fixtureBuildId.length > 0,
    "The staging fixture build is invalid."
  );
  assertIntegerField(data, "resetAtMs", { min: 0 });
  contract(
    BACKUP_ID.test(data.backupId || ""),
    "The staging reset backup is invalid."
  );
  assertIntegerField(data, "providerCatalogPlayerCount", { min: 0 });
  contract(
    data.sessionInvalidated === true,
    "The staging reset did not invalidate the session."
  );
  return true;
}
