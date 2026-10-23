export const KITTY_PAYMENT_MESSAGES = Object.freeze([
  "Meow. The league kitty is checking in: have you paid your dues?",
  "The league kitty says meow. We think that means “have you paid yet?”",
  "Your regularly scheduled cat interruption: don’t forget your league dues.",
  "The league kitty accepts payments and chin scratches. Only one covers your dues. Prrr.",
  "Please feed the league kitty. League dues accepted. Tuna negotiable.",
  "The league kitty has walked across the keyboard: PAY DUES. Subtle.",
  "And now, a word from our sponsor: “Meow.” Please pay your league dues.",
  "Meow. Just a little reminder about your league dues. Prrr.",
  "Quick meeting with the league kitty: have you paid your fees? Meow. Meeting adjourned.",
  "The ref and the kitty have compared notes. Both would appreciate you checking your dues.",
]);

export const KITTY_DISPLAY_MS = 15_000;
const displayThisVisit = new Map();
// Give users affected by the old instant-dismissal behaviour one full display.
// Keep the old date-only key intact; this version saves an absolute deadline.
const storageKey = (userId) => `hundo:kitty-payment:display-v2:${userId}`;

export function kittyReminderForDate(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  // Count calendar dates, not elapsed local hours, so DST cannot skip a message.
  const dayNumber = Math.floor(Date.UTC(year, month, day) / 86_400_000);
  return {
    day: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    message: KITTY_PAYMENT_MESSAGES[dayNumber % KITTY_PAYMENT_MESSAGES.length],
  };
}

export function currentKittyReminder(userId) {
  const reminder = kittyReminderForDate();
  let saved = displayThisVisit.get(userId);
  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey(userId)));
    if (typeof stored?.day === "string" && Number.isFinite(stored.expiresAtMs)) saved = stored;
  } catch {
    // Restricted or malformed storage must not break navigation.
  }
  if (saved?.day === reminder.day) {
    return saved.expiresAtMs > Date.now() ? { ...reminder, expiresAtMs: saved.expiresAtMs } : null;
  }
  return { ...reminder, expiresAtMs: Date.now() + KITTY_DISPLAY_MS };
}

export function rememberKittyReminder(userId, { day, expiresAtMs }) {
  const saved = { day, expiresAtMs };
  displayThisVisit.set(userId, saved);
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(saved));
  } catch {
    // Keep the same deadline through SPA navigation when storage is blocked.
  }
}
