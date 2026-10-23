import { ApiError } from "./ApiError.js";
import { bindNewIntentToRecovery } from "./recoveryIntent.js";

const INTENT_SCOPE = /^[a-z][a-z0-9-]{1,39}$/;
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function unavailable() {
  return new ApiError({
    code: "SECURE_INTENT_ID_UNAVAILABLE",
    message: "This request cannot be submitted securely in this browser.",
    category: "client",
  });
}

function secureId(cryptoImpl) {
  if (
    !cryptoImpl ||
    typeof cryptoImpl.randomUUID !== "function"
  ) {
    throw unavailable();
  }

  let id;
  try {
    id = cryptoImpl.randomUUID();
  } catch {
    throw unavailable();
  }
  if (typeof id !== "string" || !UUID_V4.test(id)) {
    throw unavailable();
  }
  return id;
}

export function createOperationId(cryptoImpl = globalThis.crypto) {
  return bindNewIntentToRecovery(secureId(cryptoImpl));
}

export function createIdempotencyKey(scope, cryptoImpl = globalThis.crypto, separator = ":") {
  if (typeof scope !== "string" || !INTENT_SCOPE.test(scope) || ![":", "-"].includes(separator)) throw unavailable();
  return bindNewIntentToRecovery(`${scope}${separator}${secureId(cryptoImpl)}`);
}
