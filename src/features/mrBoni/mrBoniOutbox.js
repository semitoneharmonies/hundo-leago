import { copyMrBoniCommands, extendsMrBoniTranscript } from "./mrBoniTranscript.js";

export const MR_BONI_OUTBOX_PREFIX = "hl:mrboni:pending:v1:";
export const MAX_PENDING_MR_BONI_RUNS = 12;

// Only an opaque run ID and its bounded command transcript are persisted. Identity
// scopes the key; authentication always comes from the current session.
export function createMrBoniOutbox({ userId, leagueId, rulesetVersion, storage = () => globalThis.localStorage }) {
  if (![userId, leagueId, rulesetVersion].every((value) => typeof value === "string" && value.length > 0 && value.length <= 128)) {
    throw new TypeError("A Mr. Boni recovery scope is required.");
  }
  const key = MR_BONI_OUTBOX_PREFIX + [userId, leagueId, rulesetVersion].map(encodeURIComponent).join(":");
  const access = () => typeof storage === "function" ? storage() : storage;
  function read() {
    const raw = access().getItem(key);
    if (raw === null) return null;
    if (raw.length > 1500000) throw new Error("The saved run could not be read.");
    const record = JSON.parse(raw);
    const commands = copyMrBoniCommands(record?.commands);
    if (!record || Object.keys(record).length !== 2 || typeof record.runId !== "string" ||
      record.runId.length < 1 || record.runId.length > 128 || !commands) throw new Error("The saved run could not be read.");
    return { runId: record.runId, commands };
  }
  return Object.freeze({
    load: read,
    save(runId, commands) {
      const next = copyMrBoniCommands(commands);
      if (typeof runId !== "string" || runId.length < 1 || runId.length > 128 || !next) throw new Error("The pending run is invalid.");
      const store = access();
      const previous = read();
      if (previous) {
        if (previous.runId !== runId) throw new Error("Another run is waiting to save.");
        if (extendsMrBoniTranscript(previous.commands, next)) return;
        if (!extendsMrBoniTranscript(next, previous.commands)) throw new Error("The pending run has a different command history.");
      } else {
        let count = 0;
        for (let index = 0; index < store.length; index++) if (store.key(index)?.startsWith(MR_BONI_OUTBOX_PREFIX)) count++;
        if (count >= MAX_PENDING_MR_BONI_RUNS) throw new Error("Pending score storage is full.");
      }
      store.setItem(key, JSON.stringify({ runId, commands: next }));
    },
    acknowledge(runId, commands) {
      const previous = read();
      if (previous?.runId === runId && extendsMrBoniTranscript(commands, previous.commands)) access().removeItem(key);
    },
  });
}
