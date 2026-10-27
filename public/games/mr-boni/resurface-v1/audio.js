const PREFERENCE_KEY = 'mr-boni.sound.enabled';
const MASTER_VOLUME = 0.5;
const MAX_VOICES = 4;
const WARNING_COOLDOWN_MS = 2000;

// Quiet, short accents only. A cue never lasts longer than 0.65 seconds.
const tone = (frequency, at, duration, amplitude = 0.24, type = 'sine', endFrequency = frequency) =>
  ({ frequency, at, duration, amplitude, type, endFrequency });
const cues = {
  preview: [tone(440, 0, 0.14, 0.24), tone(659.25, 0.13, 0.2, 0.24)],
  inspect: [tone(440, 0, 0.09), tone(554.37, 0.08, 0.13, 0.18)],
  dump: [tone(329.63, 0, 0.15, 0.23, 'triangle'), tone(493.88, 0.12, 0.2, 0.19)],
  warning: [tone(220, 0, 0.12, 0.28), tone(196, 0.18, 0.14, 0.24)],
  levelComplete: [tone(392, 0, 0.16), tone(493.88, 0.14, 0.16), tone(587.33, 0.28, 0.22, 0.21)],
  runComplete: [tone(392, 0, 0.15), tone(493.88, 0.13, 0.15), tone(587.33, 0.26, 0.15), tone(783.99, 0.39, 0.26, 0.19)],
};

function browserStorage() {
  try { return globalThis.localStorage; } catch { return null; }
}

/**
 * Call unlock() or playFromGesture() from a trusted keyboard/touch/click gesture.
 * Creating this controller never creates an AudioContext or starts sound.
 * Dependencies can be supplied for offline, deterministic lifecycle checks.
 */
export function createSoundEffects(options = {}) {
  const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
  const contextFactory = 'contextFactory' in options ? options.contextFactory : (Context ? () => new Context() : null);
  const storage = 'storage' in options ? options.storage : browserStorage();
  const now = options.now ?? (() => globalThis.performance?.now() ?? Date.now());
  let enabled = true;
  try { enabled = storage?.getItem(PREFERENCE_KEY) !== '0'; } catch { /* Sound also works without storage. */ }
  const supported = typeof contextFactory === 'function';
  let context = null;
  let master = null;
  let analyser = null;
  let signalSamples = null;
  let maxObservedPeak = 0;
  let unlocked = false;
  let disposed = false;
  let unlockPromise = null;
  let unlockStartedAt = -Infinity;
  let resumeAttempt = 0;
  let playbackEpoch = 0;
  let gestureRequest = 0;
  let lastError = null;
  let lastWarningAt = -Infinity;
  let lastCue = null;
  const lastPlayedAt = new Map();
  const playedCounts = Object.create(null);
  const voices = new Set();

  function retire(voice) {
    voices.delete(voice);
    try { voice.oscillator.disconnect(); } catch { /* Already disconnected. */ }
    try { voice.gain.disconnect(); } catch { /* Already disconnected. */ }
  }

  function clearVoices() {
    for (const voice of [...voices]) {
      voice.oscillator.onended = null;
      try { voice.oscillator.stop(); } catch { /* It may already have ended. */ }
      retire(voice);
    }
  }

  function stop() {
    playbackEpoch++;
    clearVoices();
  }

  function releaseGraph() {
    clearVoices();
    try { master?.disconnect(); } catch { /* Already released. */ }
    try { analyser?.disconnect(); } catch { /* Already released. */ }
    master = null;
    analyser = null;
    signalSamples = null;
  }

  function connectOutput() {
    master = context.createGain();
    master.gain.setValueAtTime(MASTER_VOLUME, context.currentTime);
    // The analyser observes the actual post-gain waveform, not just cue counters.
    // Missing diagnostics must not prevent audio in a limited browser.
    try {
      if (typeof context.createAnalyser === 'function') {
        analyser = context.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0;
        signalSamples = new Float32Array(analyser.fftSize);
        analyser.connect(context.destination);
      }
    } catch {
      try { analyser?.disconnect(); } catch { /* Optional diagnostic node. */ }
      analyser = null;
      signalSamples = null;
    }
    master.connect(analyser || context.destination);
  }

  function unlock() {
    if (disposed || !enabled || !supported) return Promise.resolve(false);
    // Context construction happens synchronously while the user gesture is active.
    try {
      if (context?.state === 'closed') {
        resumeAttempt++;
        unlockPromise = null;
        releaseGraph();
        context = null;
        unlocked = false;
      }
      if (!context) {
        context = contextFactory();
        connectOutput();
      }
      if (context.state === 'running') {
        if (unlockPromise) {
          resumeAttempt++;
          unlockPromise = null;
        }
        unlocked = true;
        lastError = null;
        return Promise.resolve(true);
      }
      if (context.state === 'closed') return Promise.resolve(false);
      unlocked = false;
      // Share rapid calls, but a later gesture may retry a resume promise that a
      // blocked/interrupted browser left pending indefinitely.
      if (unlockPromise && now() - unlockStartedAt < 500) return unlockPromise;
      const attempt = ++resumeAttempt;
      const resumingContext = context;
      unlockStartedAt = now();
      let pending;
      pending = Promise.resolve(context.resume()).then(() => {
        if (attempt !== resumeAttempt || disposed || resumingContext !== context) return false;
        unlocked = context.state === 'running';
        lastError = unlocked ? null : 'resume-blocked';
        return unlocked && enabled;
      }).catch(() => {
        if (attempt === resumeAttempt) {
          unlocked = false;
          lastError = 'resume-blocked';
        }
        return false;
      }).finally(() => { if (unlockPromise === pending) unlockPromise = null; });
      unlockPromise = pending;
      return unlockPromise;
    } catch {
      unlocked = false;
      lastError = context && master ? 'resume-blocked' : 'context-unavailable';
      if (!context || !master) {
        const failedContext = context;
        releaseGraph();
        context = null;
        try { Promise.resolve(failedContext?.close()).catch(() => {}); } catch { /* A later gesture may retry. */ }
      }
      return Promise.resolve(false);
    }
  }

  function play(cue, details = {}) {
    if (disposed || !enabled || !unlocked || context?.state !== 'running') return false;
    let notes = cues[cue];
    if (cue === 'pump') {
      const level = details.level;
      if (level !== 0 && level !== 0.5 && level !== 1) return false;
      const frequency = level === 0 ? 260 : level === 0.5 ? 390 : 520;
      notes = [tone(frequency, 0, 0.095, 0.22, 'sine', frequency * 0.85)];
    }
    if (!notes) return false;
    const time = now();
    if (!Number.isFinite(time)) return false;
    if (cue === 'warning' && time - lastWarningAt < WARNING_COOLDOWN_MS) return false;
    // Repeated input and repeated frame events must not create a stream of noise.
    if (time - (lastPlayedAt.get(cue) ?? -Infinity) < 100) return false;
    if (voices.size + notes.length > MAX_VOICES) clearVoices();
    const started = [];
    try {
      const start = context.currentTime;
      for (const note of notes) {
        const voice = { oscillator: context.createOscillator(), gain: null };
        started.push(voice);
        voice.gain = context.createGain();
        const at = start + note.at;
        const end = at + note.duration;
        voice.oscillator.type = note.type;
        voice.oscillator.frequency.setValueAtTime(note.frequency, at);
        voice.oscillator.frequency.exponentialRampToValueAtTime(note.endFrequency, end);
        voice.gain.gain.setValueAtTime(0, at);
        voice.gain.gain.linearRampToValueAtTime(note.amplitude, at + 0.012);
        // A small held body and smooth release remain audible on laptop/phone
        // speakers; the old double attenuation and steep decay nearly vanished.
        voice.gain.gain.setValueAtTime(note.amplitude, at + Math.min(0.04, note.duration * 0.35));
        voice.gain.gain.linearRampToValueAtTime(0, end);
        voice.oscillator.connect(voice.gain);
        voice.gain.connect(master);
        voice.oscillator.onended = () => retire(voice);
        voices.add(voice);
        voice.oscillator.start(at);
        voice.oscillator.stop(end);
      }
      lastPlayedAt.set(cue, time);
      if (cue === 'warning') lastWarningAt = time;
      playedCounts[cue] = (playedCounts[cue] ?? 0) + 1;
      lastCue = cue;
      lastError = null;
      return true;
    } catch {
      for (const voice of started) {
        voice.oscillator.onended = null;
        try { voice.oscillator.stop(); } catch { /* A partially created node need not be started. */ }
        retire(voice);
      }
      lastError = 'playback-unavailable';
      return false;
    }
  }

  async function playFromGesture(cue = 'preview', details = {}) {
    const request = ++gestureRequest;
    const epoch = playbackEpoch;
    if (!await unlock()) return false;
    // A delayed resume cannot emit a surprise cue after pause, blur or mute.
    if (request !== gestureRequest || epoch !== playbackEpoch) return false;
    return play(cue, details);
  }

  function sampleOutput() {
    let peak = 0;
    let rms = 0;
    let available = false;
    try {
      if (analyser && signalSamples && typeof analyser.getFloatTimeDomainData === 'function') {
        analyser.getFloatTimeDomainData(signalSamples);
        available = true;
        let squares = 0;
        for (const value of signalSamples) {
          if (!Number.isFinite(value)) continue;
          peak = Math.max(peak, Math.abs(value));
          squares += value * value;
        }
        rms = Math.sqrt(squares / signalSamples.length);
        maxObservedPeak = Math.max(maxObservedPeak, peak);
      }
    } catch { /* Diagnostics cannot break controls. */ }
    return Object.freeze({ available, peak, rms, maxObservedPeak });
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    if (!enabled) stop();
    // Preferences are written only in response to an explicit mute/unmute action.
    try { storage?.setItem(PREFERENCE_KEY, enabled ? '1' : '0'); } catch { /* Private browsing may reject writes. */ }
    return enabled;
  }

  function getState() {
    return Object.freeze({
      enabled, supported, unlocked: unlocked && context?.state === 'running', contextState: context?.state ?? 'uninitialized',
      activeVoices: voices.size, lastCue, playedCounts: Object.freeze({ ...playedCounts }),
      resumePending: Boolean(unlockPromise), lastError, masterGain: MASTER_VOLUME,
      output: sampleOutput(),
    });
  }

  function dispose() {
    disposed = true;
    unlocked = false;
    stop();
    resumeAttempt++;
    unlockPromise = null;
    releaseGraph();
    try { return Promise.resolve(context?.close()).catch(() => {}); } catch { return Promise.resolve(); }
  }

  return Object.freeze({ unlock, play, playFromGesture, setEnabled, toggle: () => setEnabled(!enabled), stop, getState, dispose });
}
