const STORAGE_KEY = "hl:tipjar:guest:v1";
const CLAIM_KEY = "hl:tipjar:guest-claim:v1";
let fallback = null;

// A game-only capability, never an account/session credential. It stays in the
// wrapper and is sent only with explicit guest score writes, never to the iframe.
export function readTipJarGuest() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (typeof value?.id === "string" && /^[0-9a-f-]{36}$/.test(value.id) && /^[0-9a-f]{64}$/.test(value.key)) return value;
  } catch { /* Private browser storage can be unavailable; play still works. */ }
  fallback ||= { id: crypto.randomUUID(), key: Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, "0")).join("") };
  return fallback;
}

export function rememberTipJarGuest(identity) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(identity)); return true; }
  catch { return false; }
}

export function readTipJarClaim(identity) {
  try {
    const value = JSON.parse(localStorage.getItem(CLAIM_KEY));
    return value?.guestId === identity.id && typeof value.runId === "string" && /^[0-9a-f-]{36}$/.test(value.runId)
      ? { runId: value.runId } : null;
  } catch { return null; }
}

export function rememberTipJarClaim(identity, claim) {
  try {
    if (claim) localStorage.setItem(CLAIM_KEY, JSON.stringify({ guestId: identity.id, runId: claim.runId }));
    else localStorage.removeItem(CLAIM_KEY);
  } catch { /* The visible form still works for this page visit. */ }
}
