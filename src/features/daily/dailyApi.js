import { validateDailyLiveScoring } from './dailyLiveScoring.js';

export const dailyApiRoot = "/api/v1/daily";
export const roomPath = (roomId) => `/rooms/${encodeURIComponent(roomId)}`;
export const dailyKey = (userId, path) => ["daily", userId, path];

let serverClock = null;
let siteClockRequest;

export function dailyNow() {
  return serverClock ? serverClock.time + (performance.now() - serverClock.receivedAt) : Date.now();
}

async function readSiteClock() {
  try {
    const response = await window.fetch("/manifest.webmanifest", {
      method: "HEAD", mode: "same-origin", credentials: "omit", cache: "no-store", redirect: "error",
      signal: AbortSignal.timeout(2000),
    });
    const time = Date.parse(response.headers.get("Date"));
    if (response.ok && Number.isFinite(time) && !serverClock) {
      serverClock = { time, receivedAt: performance.now(), fromApi: false };
    }
  } catch { /* Daily remains available using the device clock if both sources are unavailable. */ }
}

async function dailyRequest(session, path, options) {
  const { data, meta } = await session.httpClient.request(dailyApiRoot + path, {
    authenticated: true, dataKind: "object", includeServerTime: true, ...options,
  });
  validateDailyLiveScoring(data?.room?.live);
  // Concurrent poll responses can arrive in a different order than the server produced them.
  if (meta?.serverNowMs > 0) {
    if (!serverClock?.fromApi || meta.serverNowMs > serverClock.time) {
      serverClock = { time: meta.serverNowMs, receivedAt: performance.now(), fromApi: true };
    }
  } else if (!serverClock && typeof window !== "undefined" && typeof window.fetch === "function") {
    // Older Daily servers have no envelope clock. Share one same-origin check across concurrent polls.
    siteClockRequest ??= readSiteClock();
    await siteClockRequest;
  }
  if (path === "/reminders") {
    try {
      const key = participationKey(session.user.id);
      const startsAt = Number(localStorage.getItem(key));
      if (startsAt && startsAt <= dailyNow()) localStorage.removeItem(key);
    } catch { /* The server still supplies reminders if local storage is unavailable. */ }
  }
  return data;
}

export function dailyRead(session, path) {
  return {
    queryKey: dailyKey(session.user?.id, path),
    queryFn: ({ signal }) => dailyRequest(session, path, { signal }),
    meta: { private: true },
  };
}

export function dailyWrite(session, path, body, idempotencyKey) {
  return dailyRequest(session, path, { method: "POST", body, idempotencyKey });
}

const participationKey = (userId) => `hundo-daily-reminders:${userId}`;

export function rememberParticipation(userId, auctionStartsAt) {
  try {
    const previous = Number(localStorage.getItem(participationKey(userId))) || 0;
    const startsAt = Date.parse(auctionStartsAt);
    if (startsAt > previous) localStorage.setItem(participationKey(userId), String(startsAt));
  } catch { /* Daily can still display reminders when storage is unavailable. */ }
}

export function hasUpcomingRoom(userId) {
  // On a fresh page, let the first reminder response check the saved deadline on server time.
  try { return Number(localStorage.getItem(participationKey(userId))) > (serverClock ? dailyNow() : 0); }
  catch { return false; }
}

const permanentPacificFrom = Date.parse("2026-03-08T10:00:00Z");
const localTime = { hour: "numeric", minute: "2-digit" };
const localDay = { weekday: "short", month: "short", day: "numeric" };
const historicTime = new Intl.DateTimeFormat("en-CA", { ...localTime, timeZone: "America/Vancouver", timeZoneName: "short" });
const historicDay = new Intl.DateTimeFormat("en-CA", { ...localDay, timeZone: "America/Vancouver" });
// Vancouver keeps UTC-7 from the March 2026 transition, including on devices with older timezone data.
const pacificTime = new Intl.DateTimeFormat("en-CA", { ...localTime, timeZone: "Etc/GMT+7" });
const pacificDay = new Intl.DateTimeFormat("en-CA", { ...localDay, timeZone: "Etc/GMT+7" });

export function formatTime(value) {
  const date = new Date(value);
  return date >= permanentPacificFrom ? pacificTime.format(date) + " PT" : historicTime.format(date);
}

export function formatDay(value) {
  const date = new Date(value);
  return (date >= permanentPacificFrom ? pacificDay : historicDay).format(date);
}

export const phaseLabels = {
  waiting: "Waiting", auction: "Auction live", locked: "Rosters locked", finished: "Final", void: "Slate cancelled", closed: "Closed",
};
