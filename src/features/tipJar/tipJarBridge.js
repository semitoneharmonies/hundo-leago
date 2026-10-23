import { copyTipJarShots, extendsTipJarTranscript } from "./tipJarTranscript.js";

export const TIP_JAR_PROTOCOL = "tipjar-league-v1";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function withTimeout(action, parentSignal, milliseconds) {
  return new Promise((resolve, reject) => {
    const attempt = new AbortController();
    let settled = false;
    let timer;
    function finish(callback, value) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      parentSignal.removeEventListener("abort", cancelled);
      callback(value);
    }
    function cancelled() { attempt.abort(); finish(reject, new Error("Request cancelled.")); }
    parentSignal.addEventListener("abort", cancelled, { once: true });
    timer = setTimeout(() => { attempt.abort(); finish(reject, new Error("Request timed out.")); }, milliseconds);
    if (parentSignal.aborted) { cancelled(); return; }
    try { Promise.resolve(action(attempt.signal)).then((value) => finish(resolve, value), (error) => finish(reject, error)); }
    catch (error) { finish(reject, error); }
  });
}

// The wrapper owns authentication. The game receives only a seeded run and its verified results.
export function createTipJarBridge({ origin, frameWindow, startRun, saveCheckpoint, onState, onSaved = () => {}, onReady = () => {}, outbox = null, requestTimeoutMs = 15000 }) {
  let disposed = false;
  let generation = 0;
  let controller = new AbortController();
  let start = null;
  let run = null;
  let latest = [];
  let queued = null;
  let inFlight = null;
  let failed = null;
  let saved = null;
  let confirmed = [];
  let waitingStart = null;
  let storageUnavailable = false;
  const emit = (message) => {
    if (disposed) return;
    try { frameWindow.postMessage({ protocol: TIP_JAR_PROTOCOL, ...message }, origin); }
    catch { /* A removed iframe can no longer receive its final pause message. */ }
  };
  const state = (value) => { if (!disposed) onState(value); };
  const current = (epoch) => !disposed && epoch === generation;

  function persist() {
    if (!outbox || !run || latest.length === 0) return;
    try { outbox.save(run.runId, latest); storageUnavailable = false; }
    catch { storageUnavailable = true; }
  }

  function recover() {
    if (!outbox) return false;
    try {
      const record = outbox.load();
      if (!record || (saved?.runId === record.runId && extendsTipJarTranscript(confirmed, record.shots))) return false;
      if (run?.runId !== record.runId) confirmed = [];
      run = { runId: record.runId };
      latest = record.shots;
      queued = record.shots;
      return true;
    } catch {
      storageUnavailable = true;
      state({ kind: "storage-warning", message: "Local score recovery is unavailable. Keep this page open until your progress is saved." });
      return false;
    }
  }

  async function begin(requestId) {
    if (start?.requestId === requestId && start.pending) return;
    if (start?.requestId === requestId && start.run) {
      emit({ type: "start", requestId, run: start.run });
      return;
    }
    generation += 1;
    controller.abort();
    controller = new AbortController();
    const epoch = generation;
    start = { requestId, pending: true };
    run = null; latest = []; queued = null; inFlight = null; failed = null; saved = null; confirmed = []; waitingStart = null;
    state({ kind: "starting", message: "Starting your league run…" });
    try {
      const created = await withTimeout((signal) => startRun(requestId, signal), controller.signal, requestTimeoutMs);
      if (!current(epoch)) return;
      start = { requestId, pending: false, run: created };
      run = created;
      emit({ type: "start", requestId, run: created });
      state({ kind: "ready", message: "League run ready." });
      onSaved();
    } catch {
      if (!current(epoch)) return;
      start = { requestId, pending: false };
      const message = "Your league run could not start. Try again.";
      emit({ type: "error", requestId, message });
      state({ kind: "start-error", message });
    }
  }

  async function pump() {
    if (disposed || !run || inFlight || failed || !queued) return;
    const job = queued;
    const activeRun = run.runId;
    const epoch = generation;
    queued = null;
    inFlight = job;
    persist();
    state({ kind: "saving", message: storageUnavailable ? "Saving your progress… Local recovery is unavailable; keep this page open." : "Saving your progress…" });
    try {
      const result = await withTimeout((signal) => saveCheckpoint(activeRun, job, signal), controller.signal, requestTimeoutMs);
      if (!current(epoch)) return;
      saved = result;
      // The receipt may describe later shots saved by another request or tab.
      // Only this submitted prefix has been verified against our local inputs.
      confirmed = job;
      try { outbox?.acknowledge(activeRun, job); } catch { storageUnavailable = true; }
      emit({ type: "saved", runId: activeRun, shotsUsed: result.shotsUsed, result });
      onSaved();
      state({ kind: "saved", message: "Progress saved to your league." });
    } catch {
      if (!current(epoch)) return;
      failed = job;
      state({ kind: "save-error", message: storageUnavailable
        ? "Progress has not been saved, and local recovery is unavailable. Keep this page open and retry."
        : "Progress has not been saved. Keep this page open and retry." });
    } finally {
      if (current(epoch)) {
        inFlight = null;
        if (queued && !failed) void pump();
        else if (waitingStart && !failed) void begin(waitingStart);
      }
    }
  }

  if (recover()) void pump();

  return Object.freeze({
    receive(event) {
      if (disposed || event.origin !== origin || event.source !== frameWindow) return;
      const message = event.data;
      if (!message || message.protocol !== TIP_JAR_PROTOCOL) return;
      if (message.type === "ready") {
        onReady();
        if (!start && !inFlight && !queued && !failed && !storageUnavailable) state({ kind: "ready", message: "Ready to play." });
      } else if (message.type === "start" && typeof message.requestId === "string" && UUID.test(message.requestId)) {
        onReady();
        if (run && (inFlight || queued || failed)) {
          waitingStart = message.requestId;
          if (failed) state({ kind: "save-error", message: "Progress has not been saved. Retry saving before starting another run." });
        } else if (recover()) { waitingStart = message.requestId; void pump(); }
        else void begin(message.requestId);
      } else if (message.type === "checkpoint" && run && message.runId === run.runId) {
        const transcript = copyTipJarShots(message.shots);
        if (!transcript || !extendsTipJarTranscript(transcript, latest)) return;
        if (saved && extendsTipJarTranscript(confirmed, transcript)) {
          emit({ type: "saved", runId: run.runId, shotsUsed: saved.shotsUsed, result: saved });
          return;
        }
        if (transcript.length === latest.length) return;
        latest = transcript;
        persist();
        queued = transcript;
        void pump();
      }
    },
    retry() {
      if (disposed) return;
      if (start && !start.pending && !start.run) { void begin(start.requestId); return; }
      if (!failed || inFlight) return;
      // Retry the exact uncertain write before sending a newer transcript.
      const newest = queued;
      queued = failed;
      failed = null;
      void pump();
      if (newest) queued = newest;
    },
    pause() { emit({ type: "pause" }); },
    get hasPending() { return Boolean(queued || inFlight || failed); },
    dispose() {
      if (disposed) return;
      emit({ type: "pause" });
      disposed = true;
      generation += 1;
      controller.abort();
      queued = null; failed = null;
    },
  });
}
