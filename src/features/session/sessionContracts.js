import {
  ResponseContractError,
  assertIntegerField,
  assertResourceIdentity,
} from "../../shared/api/responseContracts.js";

const CSRF_TOKEN = /^[A-Za-z0-9_-]{43}$/;

function contract(condition, message) {
  if (!condition) throw new ResponseContractError(message);
}

export function validateSessionData(data) {
  contract(
    data !== null && typeof data === "object" && !Array.isArray(data),
    "Session data must be an object."
  );
  contract(CSRF_TOKEN.test(data.csrfToken || ""), "The CSRF token is invalid.");
  assertResourceIdentity(data.session, { requireVersion: true });
  assertResourceIdentity(data.user, { requireVersion: true });
  contract(
    data.session.userId === data.user.id,
    "The session user does not match."
  );
  contract(data.session.status === "active", "The session is not active.");
  contract(data.user.status === "active", "The user is not active.");
  contract(
    typeof data.user.displayName === "string" &&
      data.user.displayName === data.user.displayName.trim() &&
      data.user.displayName.length > 0 &&
      data.user.displayName.length <= 80,
    "The display name is invalid."
  );
  for (const field of [
    "createdAtMs",
    "lastUsedAtMs",
    "idleExpiresAtMs",
    "absoluteExpiresAtMs",
  ]) {
    assertIntegerField(data.session, field, { min: 0 });
  }
  contract(
    data.session.idleExpiresAtMs <= data.session.absoluteExpiresAtMs,
    "The session expiry is invalid."
  );

  return true;
}
