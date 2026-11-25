import { createAuctionAudioTracker } from "./dailyAuctionAudioEvents.js";
import { createAuctioneerLoop } from "./dailyAuctioneerAudio.js";

const preferenceKey = userId => `hundo-daily-sound:${userId}`;
const auctioneerPreferenceKey = userId => `hundo-daily-auctioneer:${userId}`;
const priority = ["end", "start", "win", "denied", "confirmed", "closing", "countdown", "slot"];

// Short sine/triangle tones with gentle attack/release envelopes, no samples,
// sharp clicks, square waves or continuous loops.
const cues = {
  slot: [[490, 0, .10, .35], [620, .055, .09, .22]],
  confirmed: [[490, 0, .09, .32], [740, .08, .16, .38]],
  win: [[880, 0, .45, .45], [1320, .012, .30, .13]],
  denied: [[392, 0, .12, .27], [330, .11, .18, .25]],
  countdown: [[620, 0, .09, .28]],
  closing: [[620, 0, .09, .28], [78, .14, .09, .36], [68, .31, .12, .27]],
  start: [[220, 0, .55, .38, "triangle"], [330, 0, .55, .13]],
  end: [[196, 0, .65, .38, "triangle"], [294, 0, .65, .13]],
};

export function createDailyAudio({ userId, now, browser = globalThis.window, doc = globalThis.document }) {
  let enabled = true;
  try { enabled = browser.localStorage.getItem(preferenceKey(userId)) !== "off"; } catch { /* Device storage is optional. */ }
  // Existing users who muted all Daily audio keep silence until they opt in.
  let auctioneerEnabled = enabled;
  try {
    const saved = browser.localStorage.getItem(auctioneerPreferenceKey(userId));
    if (saved != null) auctioneerEnabled = saved !== "off";
    else browser.localStorage.setItem(auctioneerPreferenceKey(userId), auctioneerEnabled ? "on" : "off");
  } catch { /* Device storage is optional. */ }
  let context = null, master = null, flushTimer = null, connection = null;
  let snapshot = { enabled, auctioneerEnabled, auctioneerStatus: "idle",
    available: Boolean(browser?.AudioContext || browser?.webkitAudioContext) };
  const listeners = new Set(), voices = new Set(), pending = new Set(), lastPlayed = new Map();
  const publish = () => { snapshot = { ...snapshot, enabled, auctioneerEnabled }; for (const listener of listeners) listener(); };
  const auctioneer = createAuctioneerLoop({ now, browser, doc, getContext: () => context,
    isEnabled: () => auctioneerEnabled,
    onStatus: auctioneerStatus => { snapshot = { ...snapshot, auctioneerStatus }; publish(); } });
  const visible = () => doc?.visibilityState !== "hidden";
  function stop() {
    clearTimeout(flushTimer); flushTimer = null; pending.clear();
    if (!context) return;
    for (const { oscillator, gain } of voices) {
      try {
        gain.gain.cancelScheduledValues(context.currentTime);
        gain.gain.setTargetAtTime(0, context.currentTime, .005);
        oscillator.stop(context.currentTime + .025);
      } catch { /* A short cue may already have finished. */ }
    }
  }
  function tone([frequency, offset, duration, volume, type = "sine"], at) {
    const oscillator = context.createOscillator(), gain = context.createGain();
    const voice = { oscillator, gain };
    const start = at + offset;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(.035, duration / 4));
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain); gain.connect(master); voices.add(voice);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); voices.delete(voice); };
    oscillator.start(start); oscillator.stop(start + duration + .025);
  }
  function flush() {
    flushTimer = null;
    const batch = priority.filter(cue => pending.has(cue));
    pending.clear();
    if (!enabled || !visible() || context?.state !== "running") return;
    // Coalesce simultaneous room updates; a confirmation replaces its slot cue,
    // and a horn replaces a countdown at the same moment.
    const hasHorn = batch.includes("start") || batch.includes("end");
    const chosen = batch.filter(cue => !(cue === "slot" && batch.includes("confirmed")) &&
      !(hasHorn && ["closing", "countdown"].includes(cue))).slice(0, 3);
    chosen.forEach((cue, index) => {
      const at = context.currentTime + .015 + index * .24;
      try { for (const note of cues[cue]) tone(note, at); } catch { stop(); }
    });
  }
  function play(cue) {
    if (!cues[cue] || !enabled || !visible() || context?.state !== "running") return;
    const time = now();
    const cooldown = ["start", "end"].includes(cue) ? 1000 : 350;
    if (time - (lastPlayed.get(cue) ?? -Infinity) < cooldown) return;
    lastPlayed.set(cue, time);
    pending.add(cue);
    flushTimer ??= setTimeout(flush, 70);
  }
  const tracker = createAuctionAudioTracker({ play, now });
  async function unlock() {
    if ((!enabled && !auctioneerEnabled) || !visible() || !snapshot.available) return;
    try {
      if (!context || context.state === "closed") {
        const AudioContext = browser.AudioContext || browser.webkitAudioContext;
        context = new AudioContext();
        master = context.createGain(); master.gain.value = .12; master.connect(context.destination);
      }
      if (context.state !== "running") await context.resume();
      auctioneer.retry();
    } catch { /* Autoplay restrictions or interrupted mobile audio must not block bidding. */ }
  }
  function setEnabled(value) {
    enabled = Boolean(value);
    try { browser.localStorage.setItem(preferenceKey(userId), enabled ? "on" : "off"); } catch { /* Keep the current session usable. */ }
    stop(); tracker.rebaseline(); publish();
    if (enabled) void unlock();
  }
  function setAuctioneerEnabled(value) {
    auctioneerEnabled = Boolean(value);
    try { browser.localStorage.setItem(auctioneerPreferenceKey(userId), auctioneerEnabled ? "on" : "off"); } catch { /* Session preference still works. */ }
    publish(); auctioneer.sync();
    if (auctioneerEnabled) void unlock();
  }
  function observe(room, viewerId) { tracker.observe(room, viewerId); auctioneer.observe(room); }
  function forget(roomId) { tracker.forget(roomId); auctioneer.forget(roomId); }
  function connect() {
    if (connection) return connection;
    const gesture = event => { if (event.isTrusted) void unlock(); };
    const resumeActivated = () => {
      if (browser.navigator?.userActivation?.hasBeenActive) void unlock();
    };
    const visibility = () => { stop(); tracker.rebaseline(); auctioneer.sync(); if (visible()) resumeActivated(); };
    doc.addEventListener("pointerdown", gesture, true);
    doc.addEventListener("click", gesture, true);
    doc.addEventListener("keydown", gesture, true);
    doc.addEventListener("visibilitychange", visibility);
    // The tap that navigated from Leago can happen before this provider mounts.
    // Reuse that activation when supported; never play queued historical cues.
    resumeActivated();
    const timer = setInterval(() => { tracker.tick(); auctioneer.sync(); }, 200);
    connection = () => {
      clearInterval(timer); stop(); auctioneer.disconnect();
      doc.removeEventListener("pointerdown", gesture, true);
      doc.removeEventListener("click", gesture, true);
      doc.removeEventListener("keydown", gesture, true);
      doc.removeEventListener("visibilitychange", visibility);
      const previous = context; context = null; master = null;
      voices.clear();
      try { void previous?.close()?.catch(() => {}); } catch { /* Already closed. */ }
      connection = null;
    };
    return connection;
  }
  return { ...tracker, observe, forget,
    roomCreated: room => { tracker.roomCreated(room, userId); auctioneer.observe(room); },
    connect, unlock, setEnabled, setAuctioneerEnabled,
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); },
    getSnapshot: () => snapshot };
}
