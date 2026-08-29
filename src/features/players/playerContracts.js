import { ResponseContractError } from "../../shared/api/responseContracts.js";

const ID =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;

function contract(condition, message) {
  if (!condition) throw new ResponseContractError(message);
}

function object(value, message) {
  contract(
    value !== null && typeof value === "object" && !Array.isArray(value),
    message
  );
  return value;
}

function exactKeys(value, keys, message) {
  object(value, message);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  contract(
    actual.length === expected.length &&
      actual.every((key, index) => key === expected[index]),
    message
  );
}

function nullableString(value, message) {
  contract(
    value === null || (typeof value === "string" && value.length > 0),
    message
  );
}

function validateProvider(provider) {
  if (provider === null) return;
  exactKeys(
    provider,
    [
      "provider",
      "sourcePosition",
      "normalizedPosition",
      "nhlTeamAbbreviation",
      "active",
      "sourceVersion",
      "effectiveAtMs",
    ],
    "The player provider projection is invalid."
  );
  contract(
    typeof provider.provider === "string" && provider.provider.length > 0,
    "The player provider is invalid."
  );
  nullableString(provider.sourcePosition, "The source position is invalid.");
  contract(
    provider.normalizedPosition === null ||
      ["F", "D"].includes(provider.normalizedPosition),
    "The normalized player position is invalid."
  );
  nullableString(
    provider.nhlTeamAbbreviation,
    "The NHL team abbreviation is invalid."
  );
  contract(typeof provider.active === "boolean", "The provider status is invalid.");
  contract(
    typeof provider.sourceVersion === "string" &&
      provider.sourceVersion.length > 0,
    "The player source version is invalid."
  );
  contract(
    Number.isSafeInteger(provider.effectiveAtMs) &&
      provider.effectiveAtMs >= 0,
    "The player source time is invalid."
  );
}

function validateStatistics(statistics) {
  if (statistics === null) return;
  exactKeys(
    statistics,
    [
      "provider",
      "nhlSeasonKey",
      "gamesPlayed",
      "goals",
      "assists",
      "nhlPoints",
      "fantasyPointsHundredths",
      "sourceUpdatedAtMs",
    ],
    "The player statistics are invalid."
  );
  contract(
    ["sportsdataio-discovery-lab", "release_qa_fixture"].includes(
      statistics.provider
    ),
    "The player statistics provider is invalid."
  );
  contract(
    typeof statistics.nhlSeasonKey === "string" && /^\d{8}$/.test(statistics.nhlSeasonKey),
    "The player statistics season is invalid."
  );
  for (const field of [
    "gamesPlayed",
    "goals",
    "assists",
    "nhlPoints",
    "fantasyPointsHundredths",
    "sourceUpdatedAtMs",
  ]) {
    contract(
      Number.isSafeInteger(statistics[field]) && statistics[field] >= 0,
      `The player ${field} statistic is invalid.`
    );
  }
  contract(
    statistics.nhlPoints === statistics.goals + statistics.assists,
    "The player NHL points do not reconcile."
  );
}

export function validatePlayerSummary(player) {
  exactKeys(
    player,
    [
      "id",
      "firstName",
      "lastName",
      "fullName",
      "birthDate",
      "status",
      "provider",
      "statistics",
      "version",
    ],
    "The player summary is invalid."
  );
  contract(ID.test(player.id || ""), "The player ID is invalid.");
  for (const field of ["firstName", "lastName", "fullName"]) {
    contract(
      typeof player[field] === "string" && player[field].trim().length > 0,
      `The player ${field} is invalid.`
    );
  }
  contract(
    player.birthDate === null ||
      /^\d{4}-\d{2}-\d{2}$/.test(player.birthDate),
    "The player birth date is invalid."
  );
  contract(
    ["active", "historical"].includes(player.status),
    "The player status is invalid."
  );
  validateProvider(player.provider);
  validateStatistics(player.statistics);
  contract(
    Number.isSafeInteger(player.version) && player.version >= 1,
    "The player version is invalid."
  );
  return true;
}

export function validatePlayerList(players) {
  contract(Array.isArray(players), "The player list is invalid.");
  for (const player of players) validatePlayerSummary(player);
  contract(
    new Set(players.map(({ id }) => id)).size === players.length,
    "The player list contains duplicate identities."
  );
  return true;
}

function validateLeagueProjection(league, expectedLeagueId) {
  exactKeys(
    league,
    ["id", "ownership", "activeContract"],
    "The league player projection is invalid."
  );
  contract(ID.test(league.id || ""), "The player league ID is invalid.");
  contract(
    expectedLeagueId === undefined || league.id === expectedLeagueId,
    "The player projection belongs to another league."
  );
  if (league.ownership !== null) {
    exactKeys(
      league.ownership,
      ["kind", "category", "team"],
      "The player ownership projection is invalid."
    );
    contract(
      ["Rostered", "Prospect Right"].includes(league.ownership.kind),
      "The player ownership kind is invalid."
    );
    contract(
      ["Active", "Bench", "Injured Reserve", "Prospect"].includes(
        league.ownership.category
      ),
      "The player roster category is invalid."
    );
    exactKeys(
      league.ownership.team,
      ["id", "name"],
      "The player ownership team is invalid."
    );
    contract(
      ID.test(league.ownership.team.id || ""),
      "The player ownership team ID is invalid."
    );
    contract(
      typeof league.ownership.team.name === "string" &&
        league.ownership.team.name.trim().length > 0,
      "The player ownership team name is invalid."
    );
  }
  if (league.activeContract !== null) {
    exactKeys(
      league.activeContract,
      [
        "originalTotalValueCents",
        "originalTermYears",
        "aavCents",
        "remainingYears",
      ],
      "The active player contract projection is invalid."
    );
    for (const field of [
      "originalTotalValueCents",
      "originalTermYears",
      "aavCents",
      "remainingYears",
    ]) {
      contract(
        Number.isSafeInteger(league.activeContract[field]) &&
          league.activeContract[field] >= 0,
        `The player contract ${field} is invalid.`
      );
    }
    contract(
      league.activeContract.originalTermYears >= 1 &&
        league.activeContract.originalTermYears <= 3 &&
        league.activeContract.remainingYears <=
          league.activeContract.originalTermYears,
      "The player contract term is invalid."
    );
  }
}

export function validateLeaguePlayerSummary(player, expectedLeagueId) {
  exactKeys(
    player,
    [
      "id",
      "firstName",
      "lastName",
      "fullName",
      "birthDate",
      "status",
      "provider",
      "statistics",
      "version",
      "league",
    ],
    "The league player summary is invalid."
  );
  const { league, ...summary } = player;
  validatePlayerSummary(summary);
  validateLeagueProjection(league, expectedLeagueId);
  return true;
}

export function validateLeaguePlayerList(players, expectedLeagueId) {
  contract(Array.isArray(players), "The league player list is invalid.");
  for (const player of players) {
    validateLeaguePlayerSummary(player, expectedLeagueId);
  }
  contract(
    new Set(players.map(({ id }) => id)).size === players.length,
    "The league player list contains duplicate identities."
  );
  return true;
}

function validateExternalIds(externalIds) {
  contract(Array.isArray(externalIds), "The player provider IDs are invalid.");
  for (const externalId of externalIds) {
    exactKeys(
      externalId,
      ["provider", "externalValue", "createdAtMs"],
      "A player provider ID is invalid."
    );
    contract(
      typeof externalId.provider === "string" &&
        externalId.provider.length > 0,
      "A player provider name is invalid."
    );
    contract(
      typeof externalId.externalValue === "string" &&
        externalId.externalValue.length > 0,
      "A player provider value is invalid."
    );
    contract(
      Number.isSafeInteger(externalId.createdAtMs) &&
        externalId.createdAtMs >= 0,
      "A player provider timestamp is invalid."
    );
  }
}

export function validatePlayerDetail(player) {
  exactKeys(
    player,
    [
      "id",
      "firstName",
      "lastName",
      "fullName",
      "birthDate",
      "status",
      "provider",
      "statistics",
      "version",
      "externalIds",
    ],
    "The player detail is invalid."
  );
  const { externalIds, ...summary } = player;
  validatePlayerSummary(summary);
  validateExternalIds(externalIds);
  return true;
}

export function validateLeaguePlayerDetail(player, expectedLeagueId) {
  exactKeys(
    player,
    [
      "id",
      "firstName",
      "lastName",
      "fullName",
      "birthDate",
      "status",
      "provider",
      "statistics",
      "version",
      "externalIds",
      "league",
    ],
    "The league player detail is invalid."
  );
  const { externalIds, ...summary } = player;
  validateLeaguePlayerSummary(summary, expectedLeagueId);
  validateExternalIds(externalIds);
  return true;
}
