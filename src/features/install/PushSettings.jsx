import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "../session/sessionContext.js";
import { appRegistration, isInstalled } from "./installClient.js";

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
function applicationKey(value) { return Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), (char) => char.charCodeAt(0)); }

export function PushSettings() {
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
    // Request permission synchronously from the user's tap (required on iOS).
    const permission = await Notification.requestPermission();
    if (permission !== "granted") { setMessage("Notifications are blocked. Allow them in your browser or phone settings."); return; }
    const registration = await appRegistration();
    await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const current = new Uint8Array(subscription.options.applicationServerKey || []);
      const expected = applicationKey(query.data.publicKey);
      if (current.length !== expected.length || current.some((value, index) => value !== expected[index])) { await subscription.unsubscribe(); subscription = null; }
    }
    subscription ||= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationKey(query.data.publicKey) });
    await request(session.httpClient, "/subscriptions", { method: "POST", body: { subscription: subscription.toJSON() } });
    setEnabled(true); setMessage("Notifications enabled on this device.");
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
  return <section aria-labelledby="push-heading"><h2 id="push-heading">Short, useful notifications</h2>
    <p>Trade offers, auction updates and roster reminders. Tap an alert for details.</p>
    {session.status !== "authenticated" ? <p>Sign in to choose your notifications.</p> : <>
      {query.isPending && <p role="status">Loading notification settings…</p>}
      {query.isError && <p role="alert">{query.error?.status === 404 ? "Phone notifications aren’t available yet." : "Notification settings are unavailable."} <button className="hl-button hl-button--quiet" onClick={() => query.refetch()}>Retry</button></p>}
      {query.data && <>
        {!query.data.available ? <p>Phone notifications aren’t available yet. You can still choose your preferences.</p>
          : !supported || (apple && !isInstalled()) ? <p>Install Hundo Leago, then open it from your home screen to enable notifications. iPhone requires iOS 16.4 or later.</p>
            : <div><button className="hl-button hl-button--primary" disabled={busy} onClick={() => run(enable)}>{enabled ? "Refresh this device" : "Enable notifications"}</button>{" "}<button className="hl-button hl-button--quiet" disabled={busy} onClick={() => run(disable)}>Turn off on this device</button></div>}
        <fieldset className="hl-push-options" disabled={busy}><legend>Choose your alerts</legend>{categories.map(([key, label]) => <label key={key}><input type="checkbox" checked={query.data.preferences[key] !== false} onChange={(event) => {
          const preferences = { ...query.data.preferences, [key]: event.target.checked };
          const queryKey = ["push-settings", session.user?.id];
          const previous = query.data;
          cache.setQueryData(queryKey, { ...previous, preferences });
          void run(async () => { try { const updated = await request(session.httpClient, "/settings", { method: "POST", body: { preferences } }); cache.setQueryData(queryKey, updated); setMessage("Preferences saved."); } catch (error) { cache.setQueryData(queryKey, previous); throw error; } });
        }} />{label}</label>)}</fieldset>
      </>}
      {message && <p role="status">{message}</p>}
      <p className="hl-install-note">Your phone controls delivery and quiet hours. After signing in again, enable notifications on this device again.</p>
    </>}
  </section>;
}
