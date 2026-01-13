// src/sound.js
// Simple, safe sound player for UI clicks.
// Uses <audio> to keep it dead simple. (WAV is fine.)

const cache = new Map();

export function playSound(src, { volume = 0.6 } = {}) {
  try {
    if (!src) return;

    // Cache a base <audio> per file, clone on play so rapid clicks don't cut off.
    let base = cache.get(src);
    if (!base) {
      base = new Audio(src);
      base.preload = "auto";
      cache.set(src, base);
    }

    const a = base.cloneNode(true);
    a.volume = Math.max(0, Math.min(1, volume));

    // Some browsers block autoplay; clicks are user gestures so this is usually fine.
    a.play().catch(() => {});
  } catch {
    // no-op
  }
}
