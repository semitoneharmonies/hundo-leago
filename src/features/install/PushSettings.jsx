import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "../session/sessionContext.js";
import { appRegistration, isInstalled } from "./installClient.js";
import { enablePushNotifications } from "./pushClient.js";
import "./PushSettings.css";

const categories = [
  ["trade_received", "Trade offers"], ["trade_accepted", "Trade acceptances"],
  ["trade_closed", "Declined, cancelled or expired trades"],
  ["auction_bid", "New competing bidders"], ["auction_result", "Auction results"],
  ["auction_closing", "Auctions closing soon"], ["roster_illegal", "Roster warnings"],
  ["roster_lock", "Two-hour roster-lock reminder"], ["schedule_changed", "Roster-lock changes"],
  ["announcement", "Important announcements"], ["fad_action", "Free Agent Draft actions"],
  ["commissioner_action", "Commissioner actions"],
];
const request = async (client, path, options = {}) => (await client.request(`/api/v1/push${path}`, {
  authenticated: true, dataKind: "object", ...options,
})).data;

export function PushSettings({ heading = "Short, useful notifications", installationHelp = null, compactOptions = false }) {
  const session = useSession();
  const cache = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [enabled, setEnabled] = useState(false);
  const supported = "PushManager" in window && "Notification" in window && "serviceWorker" in navigator;
  const apple = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const query = useQuery({ queryKey: ["push-settings", session.user?.id],
    queryFn: () => request(session.httpClient, "/settings"), enabled: session.status === "authenticated", meta: { private: true }, retry: false });
  async function run(action) {
    setBusy(true); setMessage("");
    try { await action(); } catch { setMessage("Could not save notifications. Please try again."); } finally { setBusy(false); }
  }
  async function enable() {
    const result = await enablePushNotifications(session.httpClient, query.data.publicKey);
    if (result.enabled) setEnabled(true);
    setMessage(result.message);
  }
  async function disable() {
    const registration = await appRegistration();
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await request(session.httpClient, "/subscriptions/remove", { method: "POST", body: { endpoint: subscription.endpoint } });
      await subscription.unsubscribe();
    }
    setEnabled(false); setMessage("Notifications turned off on this device.");
  }
  const options = query.data && <fieldset className="hl-push-options" disabled={busy}><legend>{compactOptions ? "Alert types" : "Choose your alerts"}</legend>{categories.map(([key, label]) => <label key={key}><input type="checkbox" checked={query.data.preferences[key] !== false} onChange={(event) => {
    const preferences = { ...query.data.preferences, [key]: event.target.checked };
    const queryKey = ["push-settings", session.user?.id];
    const previous = query.data;
    cache.setQueryData(queryKey, { ...previous, preferences });
    void run(async () => { try { const updated = await request(session.httpClient, "/settings", { method: "POST", body: { preferences } }); cache.setQueryData(queryKey, updated); setMessage("Preferences saved."); } catch (error) { cache.setQueryData(queryKey, previous); throw error; } });
  }} />{label}</label>)}</fieldset>;
  return <section aria-labelledby="push-heading"><h2 id="push-heading">{heading}</h2>
    <p>Trade offers, auction updates and roster reminders. Tap an alert for details.</p>
    {session.status !== "authenticated" ? <p>Sign in to choose your notifications.</p> : <>
      {query.isPending && <p role="status">Loading notification settings…</p>}
      {query.isError && <p role="alert">{query.error?.status === 404 ? "Phone notifications aren’t available yet." : "Notification settings are unavailable."} <button className="hl-button hl-button--quiet" onClick={() => query.refetch()}>Retry</button></p>}
      {query.data && <>
        {!query.data.available ? <p>Phone notifications aren’t available yet. You can still choose your preferences.</p>
          : !supported || (apple && !isInstalled()) ? <p>{isInstalled()
            ? "Push notifications aren’t supported on this device or browser."
            : <>Install Hundo Leago, then open it from your home screen to enable notifications. iPhone requires iOS 16.4 or later. {installationHelp}</>}</p>
            : <div><button className="hl-button hl-button--primary" disabled={busy} onClick={() => run(enable)}>{enabled ? "Refresh this device" : "Enable notifications"}</button>{" "}<button className="hl-button hl-button--quiet" disabled={busy} onClick={() => run(disable)}>Turn off on this device</button></div>}
        {compactOptions ? <details className="hl-push-alert-options"><summary>Choose your alerts</summary>{options}</details> : options}
      </>}
      {message && <p role="status">{message}</p>}
      <p className="hl-push-note">Your phone controls delivery and quiet hours. After signing in again, enable notifications on this device again.</p>
    </>}
  </section>;
}
