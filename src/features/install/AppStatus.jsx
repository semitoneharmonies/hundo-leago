import { useEffect, useState } from "react";
import { appRegistration } from "./installClient.js";
import "./InstallPage.css";

export function AppStatus() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [waiting, setWaiting] = useState(null);
  useEffect(() => {
    let active = true;
    let registration;
    const online = () => setOffline(false);
    const offline = () => setOffline(true);
    const inspect = () => { if (active && navigator.serviceWorker.controller && registration?.waiting) setWaiting(registration.waiting); };
    const found = () => registration?.installing?.addEventListener("statechange", inspect);
    const refresh = () => { if (document.visibilityState === "visible") registration?.update().catch(() => {}); };
    window.addEventListener("online", online); window.addEventListener("offline", offline);
    document.addEventListener("visibilitychange", refresh);
    appRegistration().then((value) => { if (!active) return; registration = value; inspect(); registration.addEventListener("updatefound", found); }).catch(() => {});
    return () => { active = false; window.removeEventListener("online", online); window.removeEventListener("offline", offline); document.removeEventListener("visibilitychange", refresh); registration?.removeEventListener("updatefound", found); };
  }, []);
  function update() {
    if (!window.confirm("Reload Hundo Leago? Finish or save any changes first.")) return;
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
    waiting.postMessage({ type: "APPLY_UPDATE" });
  }
  if (offline) return <div className="hl-app-status" role="status">You’re offline. Reconnect before making changes.</div>;
  if (waiting) return <div className="hl-app-status" role="status">An app update is ready. <button className="hl-button hl-button--quiet" onClick={update}>Reload to update</button></div>;
  return null;
}
