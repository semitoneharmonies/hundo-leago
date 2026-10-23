import { copyTipJarShots, extendsTipJarTranscript } from "./tipJarTranscript.js";

export const TIP_JAR_OUTBOX_PREFIX = "hl:tipjar:pending:v1:";
export const MAX_PENDING_TIP_JAR_RUNS = 12;

// Only an opaque run ID and its bounded shot transcript are persisted. Identity
// scopes the key; authentication always comes from the current session.
export function createTipJarOutbox({ userId, leagueId, rulesetVersion, storage = () => globalThis.localStorage }) {
  if (![userId, leagueId, rulesetVersion].every((value) => typeof value === "string" && value.length > 0 && value.length <= 128)) {
    throw new TypeError("A Tip Jar recovery scope is required.");
  }
  const key = TIP_JAR_OUTBOX_PREFIX + [userId, leagueId, rulesetVersion].map(encodeURIComponent).join(":");
  const access = () => typeof storage === "function" ? storage() : storage;
  function read() {
    const raw = access().getItem(key);
    if (raw === null) return null;
    if (raw.length > 24000) throw new Error("The saved run could not be read.");
    const record = JSON.parse(raw);
    const shots = copyTipJarShots(record?.shots);
    if (!record || Object.keys(record).length !== 2 || typeof record.runId !== "string" ||
      record.runId.length < 1 || record.runId.length > 128 || !shots) throw new Error("The saved run could not be read.");
    return { runId: record.runId, shots };
  }
  return Object.freeze({
    load: read,
    save(runId, shots) {
      const next = copyTipJarShots(shots);
      if (typeof runId !== "string" || runId.length < 1 || runId.length > 128 || !next) throw new Error("The pending run is invalid.");
      const store = access();
      const previous = read();
      if (previous) {
        if (previous.runId !== runId) throw new Error("Another run is waiting to save.");
        if (extendsTipJarTranscript(previous.shots, next)) return;
        if (!extendsTipJarTranscript(next, previous.shots)) throw new Error("The pending run has a different shot history.");
      } else {
        let count = 0;
        for (let index = 0; index < store.length; index++) if (store.key(index)?.startsWith(TIP_JAR_OUTBOX_PREFIX)) count++;
        if (count >= MAX_PENDING_TIP_JAR_RUNS) throw new Error("Pending score storage is full.");
      }
      store.setItem(key, JSON.stringify({ runId, shots: next }));
    },
    acknowledge(runId, shots) {
      const previous = read();
      if (previous?.runId === runId && extendsTipJarTranscript(shots, previous.shots)) access().removeItem(key);
    },
  });
}
