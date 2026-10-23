import { useLayoutEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { routePaths } from "../../app/routePaths.js";
import { useSession } from "../session/sessionContext.js";
import { useInstalledApp } from "./useInstalledApp.js";
import { enablePushNotifications } from "./pushClient.js";
import "./InstalledPushPrompt.css";

const dismissedInMemory = new Set();
const preferenceKey = userId => `hl:push-introduction:v1:${userId}`;
function wasDismissed(key) {
  if (dismissedInMemory.has(key)) return true;
  try { return localStorage.getItem(key) === "dismissed"; } catch { return false; }
}
function remember(key) {
  dismissedInMemory.add(key);
  try { localStorage.setItem(key, "dismissed"); } catch { /* Keep working when storage is unavailable. */ }
}

function FirstPushPrompt({ session }) {
  const key = preferenceKey(session.user.id);
  // Check permission when this user/session first arrives. After an Enable tap,
  // permission becomes granted before the subscription save completes; ordinary
  // parent rerenders must not cancel that in-flight save or its retry state.
  const [dismissed, setDismissed] = useState(() => wasDismissed(key) || Notification.permission !== "default");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const active = useRef(false);
  // The parent keys this component by user and session. A pending permission
  // response must never subscribe on behalf of a replacement signed-in user.
  useLayoutEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const settings = useQuery({
    queryKey: ["push-settings", session.user.id],
    queryFn: async () => (await session.httpClient.request("/api/v1/push/settings", { authenticated: true, dataKind: "object" })).data,
    enabled: !dismissed, meta: { private: true }, retry: false,
  });
  function dismiss() { remember(key); setDismissed(true); }
  async function enable() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const result = await enablePushNotifications(session.httpClient, settings.data.publicKey, () => active.current);
      if (!active.current) return;
      if (result.enabled) dismiss();
      else if (result.permission === "denied") setDismissed(true);
      else setError(result.message);
    } catch {
      if (active.current) setError("Could not enable notifications. Please try again.");
    } finally { if (active.current) setBusy(false); }
  }
  if (dismissed || !settings.data?.available || !settings.data.publicKey) return null;
  return <section className="hl-installed-push-prompt hl-surface" aria-labelledby="installed-push-title">
    <h2 id="installed-push-title">Turn on notifications?</h2>
    <p>Get trade offers, auction updates and roster reminders on your phone.</p>
    <div className="hl-installed-push-prompt__actions">
      <button type="button" className="hl-button hl-button--primary" disabled={busy} onClick={enable}>{busy ? "Enabling…" : "Enable notifications"}</button>
      <button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={dismiss}>Not now</button>
    </div>
    {error && <p role="alert">{error}</p>}
    <small>You can change this later in Notifications.</small>
  </section>;
}

export function InstalledPushPrompt() {
  const session = useSession();
  const installed = useInstalledApp();
  const location = useLocation();
  const supported = "Notification" in window && typeof Notification.requestPermission === "function" && "PushManager" in window && "serviceWorker" in navigator;
  if (!installed || session.status !== "authenticated" || !session.user?.id || !supported ||
      location.pathname === routePaths.notifications) return null;
  return <FirstPushPrompt key={`${session.user.id}:${session.session?.id || ""}`} session={session} />;
}
