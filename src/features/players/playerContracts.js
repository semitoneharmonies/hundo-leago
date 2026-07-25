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
      "version",
      "externalIds",
    ],
    "The player detail is invalid."
  );
  const { externalIds, ...summary } = player;
  validatePlayerSummary(summary);
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
  return true;
}
