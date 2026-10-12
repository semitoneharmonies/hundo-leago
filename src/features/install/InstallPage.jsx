import { useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { canInstall, isInstalled, requestInstall, watchInstall } from "./installClient.js";
import { PushSettings } from "./PushSettings.jsx";
import "./InstallPage.css";

export function InstallPage() {
  const available = useSyncExternalStore(watchInstall, canInstall, () => false);
  const installed = useSyncExternalStore(watchInstall, isInstalled, () => false);
  const [error, setError] = useState("");
  return <main className="hl-install-page">
    <header className="hl-install-hero"><img src="/icons/app-192.png" alt="" width="72" height="72" /><div><h1>Install Hundo Leago</h1><p>Your league, one tap away.</p></div></header>
    <p>Free to install from this website. Same account, same league, same mobile layout.</p>
    {installed ? <p role="status" className="hl-install-success">You’re using the installed app.</p> : available && <button className="hl-button hl-button--primary" onClick={async () => { setError(""); try { await requestInstall(); } catch { setError("Could not open installation. Try the browser menu below."); } }}>Install app</button>}
    {error && <p role="alert">{error}</p>}
    <div className="hl-install-grid">
      <section><h2>iPhone / iPad</h2><ol><li>Open this website in <strong>Safari</strong>.</li><li>Tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</li><li>If shown, enable <strong>Open as Web App</strong>. Tap <strong>Add</strong>.</li><li>Open Hundo Leago from your home screen.</li></ol></section>
      <section><h2>Android</h2><ol><li>Open this website in <strong>Chrome</strong>.</li><li>Tap <strong>Install app</strong> above, or open the browser’s <strong>⋮ menu</strong>.</li><li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>, then confirm.</li><li>Open Hundo Leago from your home screen.</li></ol></section>
    </div>
    <p className="hl-install-note">No app store or separate download needed. You may need to sign in again after installing. If you opened this link inside another app, open it in Safari or Chrome first.</p>
    <PushSettings />
    <section><h2>Updates and connection</h2><p>Updates come through the website. Reopen or reload the app to get the latest version. Finish any changes before reloading.</p><p>Internet is required for league information, bids, trades, and roster changes.</p></section>
    <Link to="/">Back to Hundo Leago</Link>
  </main>;
}
