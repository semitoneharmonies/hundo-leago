import { ApiError } from "./ApiError.js";

export const RECOVERY_EPOCH_HEADER = "X-Hundo-Recovery-Epoch";
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
let recoveryId = null;

function unavailable() {
  return new ApiError({ code: "RECOVERY_CONTEXT_INVALID", category: "application-data",
    message: "The app could not verify this action. Refresh the page and try again." });
}

export function observeRecoveryEpoch(value) {
  // Missing headers from an older server do not retarget an existing intent.
  if (value === null || value === undefined) return;
  if (value === "initial") { recoveryId = null; return; }
  if (typeof value !== "string" || !UUID.test(value)) throw unavailable();
  recoveryId = value;
}

export function bindNewIntentToRecovery(key) {
  if (typeof key !== "string" || !/^[\x21-\x7e]{1,200}$/.test(key) ||
      /^recovery:[a-f0-9-]{36}:/.test(key)) throw unavailable();
  if (recoveryId === null) return key;
  const bound = `recovery:${recoveryId}:${key}`;
  if (bound.length > 128) throw unavailable();
  return bound;
}
