import { AGGREGATE_METRICS } from './aggregateMetricNames.js';
const allowedMetrics = new Set(AGGREGATE_METRICS);
// Only these fixed categories leave the browser. Never transmit a URL or route ID.
export function analyticsCategory(pathname) {
  if (typeof pathname !== "string" || /[?#]/.test(pathname)) return null;
  const exact = {
    "/": ["shared", "home"],
    "/leagues": ["shared", "leagues"],
    "/account": ["shared", "account"],
    "/notifications": ["shared", "notifications"],
    "/install": ["shared", "install"],
    "/games/tip-jar": ["shared", "games"],
    "/games/mr-boni": ["shared", "games"],
    "/daily": ["daily", "lobby"],
    "/daily/history": ["daily", "history"],
    "/daily/profile": ["daily", "profile"],
    "/daily/notifications": ["daily", "notifications"],
    "/daily/create": ["daily", "create"],
    "/daily/practice": ["daily", "practice"],
  };
  const pair = exact[pathname.replace(/\/$/, "") || "/"];
  if (pair) return { product: pair[0], category: pair[1] };
  if (/^\/daily\/rooms\/[^/]+\/?$/.test(pathname)) {
    return { product: "daily", category: "room" };
  }
  if (/^\/public\/leagues\/[^/]+\/teams\/[^/]+\/roster\/?$/.test(pathname)) {
    return { product: "leago", category: "rosters" };
  }
  const league = /^\/leagues\/[^/]+(?:\/(.*))?$/.exec(pathname);
  if (!league) return null;
  const rest = (league[1] || "").replace(/\/$/, "");
  if (!rest) return { product: "leago", category: "dashboard" };
  if (/^teams\/[^/]+\/roster$/.test(rest)) return { product: "leago", category: "rosters" };
  const patterns = [
    ["teams", /^teams$/],
    ["players", /^players(?:\/[^/]+)?$/],
    ["auctions", /^auctions(?:\/[^/]+)?$/],
    ["trades", /^trades(?:\/[^/]+)?$/],
    ["drafts", /^(?:drafts|free-agent-draft)(?:\/[^/]+)*$/],
    ["matchups", /^matchups$/],
    ["standings", /^standings$/],
    ["activity", /^activity$/],
    ["commissioner", /^commissioner(?:\/[^/]+)?$/],
  ];
  const match = patterns.find(([, pattern]) => pattern.test(rest));
  if (match) return { product: "leago", category: match[0] };
  if (/^(?:mr-boni|tip-jar)$/.test(rest)) return { product: "shared", category: "games" };
  return null;
}

export function analyticsAllowed(navigatorObject = globalThis.navigator) {
  return navigatorObject?.globalPrivacyControl !== true &&
    navigatorObject?.doNotTrack !== "1" && navigatorObject?.doNotTrack !== "yes";
}

export function createAggregateSender(apiOrigin, fetchImpl = globalThis.fetch) {
  const endpoint = new URL("/api/v1/analytics/aggregate", apiOrigin).href;
  return (input) => {
    if (!analyticsAllowed()) return;
    const { product, category, pageViews, activeSeconds, metric } = input;
    if (metric !== undefined && (!allowedMetrics.has(metric) || input.value !== 1)) return;
    const body = metric !== undefined ? { metric, value: 1 } : { product, category, pageViews, activeSeconds };
    // No auth client, cookies, referrer, request IDs, retries, or persistent queue.
    try {
      Promise.resolve(fetchImpl(endpoint, {
        method: "POST",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        redirect: "error",
        cache: "no-store",
        mode: "cors",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })).catch(() => {});
    } catch { /* Analytics failure must not affect the website. */ }
  };
}

// State lasts only while this page category is mounted; it never identifies a visitor.
export function startAggregatePageCounter({
  page,
  send,
  documentTarget = document,
  windowTarget = window,
  now = () => performance.now(),
}) {
  const idleMs = 120_000;
  let previousSample = now();
  let lastInteraction = previousSample;
  let eligible = documentTarget.visibilityState === "visible" && documentTarget.hasFocus();
  let activeMs = 0;
  let started = false;
  let opened = false;
  let stopped = false;
  let lastFlush = previousSample;

  function sample() {
    const current = now();
    const gap = current - previousSample;
    // A suspended computer/tab must not turn a delayed timer into hours of activity.
    if (eligible && gap >= 0 && gap <= 15_000) {
      activeMs += Math.max(0, Math.min(current, lastInteraction + idleMs) - previousSample);
    }
    previousSample = current;
  }
  function flush(pageViews = 0) {
    if (!started || stopped) return;
    const activeSeconds = Math.min(60, Math.floor(activeMs / 1000));
    activeMs = activeMs % 1000;
    lastFlush = now();
    if (pageViews) opened = true;
    if (pageViews || activeSeconds) send({ ...page, pageViews, activeSeconds });
  }
  function interact() {
    sample();
    if (eligible) lastInteraction = now();
  }
  function visibility() {
    sample();
    eligible = documentTarget.visibilityState === "visible" && documentTarget.hasFocus();
    if (eligible) {
      lastInteraction = now();
      if (!opened) flush(1);
    } else flush();
  }
  function pagehide() {
    sample();
    eligible = false;
    flush();
  }
  function pageshow(event) {
    if (!event.persisted) return;
    previousSample = now();
    lastInteraction = previousSample;
    eligible = documentTarget.visibilityState === "visible" && documentTarget.hasFocus();
    if (eligible) flush(1);
  }

  // Deferring the opening count avoids React StrictMode's development effect replay.
  const opening = windowTarget.setTimeout(() => {
    started = true;
    if (eligible) flush(1);
  }, 0);
  const interval = windowTarget.setInterval(() => {
    sample();
    if (now() - lastFlush >= 30_000) flush();
  }, 10_000);
  const activityEvents = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart"];
  for (const event of activityEvents) documentTarget.addEventListener(event, interact, { passive: true, capture: true });
  documentTarget.addEventListener("visibilitychange", visibility);
  windowTarget.addEventListener("focus", visibility);
  windowTarget.addEventListener("blur", visibility);
  windowTarget.addEventListener("pagehide", pagehide);
  windowTarget.addEventListener("pageshow", pageshow);
  return () => {
    windowTarget.clearTimeout(opening);
    windowTarget.clearInterval(interval);
    sample();
    flush();
    stopped = true;
    for (const event of activityEvents) documentTarget.removeEventListener(event, interact, true);
    documentTarget.removeEventListener("visibilitychange", visibility);
    windowTarget.removeEventListener("focus", visibility);
    windowTarget.removeEventListener("blur", visibility);
    windowTarget.removeEventListener("pagehide", pagehide);
    windowTarget.removeEventListener("pageshow", pageshow);
  };
}
