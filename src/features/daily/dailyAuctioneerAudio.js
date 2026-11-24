export const AUCTIONEER_URL = "/audio/daily-auctioneer-v1.mp3";
const phaseOrder = { waiting: 0, auction: 1, locked: 2, finished: 3, void: 4, closed: 4 };

// One quiet loop for the whole Daily desk, even when several rooms are live.
// The unlocked Web Audio context also keeps volume control effective on iOS.
export function createAuctioneerLoop({ now, browser, doc, getContext, isEnabled, onStatus }) {
  const rooms = new Map();
  let buffer = null, source = null, gain = null, loading = null, failed = false, generation = 0;
  let status = "idle";
  const report = value => { if (status !== value) { status = value; onStatus(value); } };
  const wanted = () => isEnabled() && doc?.visibilityState !== "hidden" &&
    getContext()?.state === "running" && [...rooms.values()].some(room =>
      room.phase === "auction" && now() < room.endsAt);

  function stop() {
    const previous = source, previousGain = gain;
    source = null; gain = null;
    if (previous) {
      const at = getContext()?.currentTime ?? 0;
      try {
        previousGain.gain.cancelScheduledValues(at);
        previousGain.gain.setTargetAtTime(0, at, .008);
        previous.stop(at + .04);
      } catch { previous.disconnect(); previousGain.disconnect(); }
    }
    report(failed ? "error" : loading ? "loading" : "idle");
  }

  async function load() {
    const context = getContext(), token = generation;
    const controller = new AbortController();
    loading = controller; report("loading");
    try {
      const response = await browser.fetch(AUCTIONEER_URL, { signal: controller.signal });
      if (!response.ok) throw new Error("Auctioneer recording unavailable");
      const decoded = await context.decodeAudioData(await response.arrayBuffer());
      if (token !== generation || controller.signal.aborted || context !== getContext()) return;
      buffer = decoded;
    } catch {
      if (token !== generation || controller.signal.aborted) return;
      // Retry only on another gesture/toggle, not every polling tick.
      failed = true;
    } finally {
      if (token === generation && loading === controller) {
        loading = null;
        sync();
      }
    }
  }

  function sync() {
    if (!wanted()) { stop(); return; }
    if (failed) { report("error"); return; }
    if (!buffer) { if (!loading) void load(); return; }
    if (source) return;
    const context = getContext();
    try {
      const next = context.createBufferSource(), nextGain = context.createGain();
      next.buffer = buffer; next.loop = true;
      nextGain.gain.setValueAtTime(0, context.currentTime);
      nextGain.gain.setTargetAtTime(.10, context.currentTime, .04);
      next.connect(nextGain); nextGain.connect(context.destination);
      next.onended = () => { next.disconnect(); nextGain.disconnect(); };
      source = next; gain = nextGain;
      next.start(); report("playing");
    } catch { failed = true; stop(); }
  }

  return {
    sync,
    retry() { failed = false; sync(); },
    observe(room) {
      if (!room?.id) return;
      if (!room.joined) { rooms.delete(room.id); sync(); return; }
      const previous = rooms.get(room.id);
      if (previous && (phaseOrder[room.phase] ?? -1) < (phaseOrder[previous.phase] ?? -1)) return;
      rooms.set(room.id, { phase: room.phase, endsAt: Date.parse(room.auctionEndsAt ?? room.firstGameAt) });
      sync();
    },
    forget(id) { rooms.delete(id); sync(); },
    disconnect() {
      generation++;
      loading?.abort(); loading = null;
      stop(); buffer = null; failed = false; rooms.clear(); report("idle");
    },
  };
}
