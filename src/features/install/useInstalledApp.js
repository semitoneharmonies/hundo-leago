import { useSyncExternalStore } from "react";
import { isInstalled, watchInstall } from "./installClient.js";

function subscribe(callback) {
  const unwatch = watchInstall(callback);
  const media = window.matchMedia?.("(display-mode: standalone)");
  if (media?.addEventListener) media.addEventListener("change", callback);
  else media?.addListener?.(callback);
  window.addEventListener("pageshow", callback);
  return () => {
    unwatch();
    if (media?.removeEventListener) media.removeEventListener("change", callback);
    else media?.removeListener?.(callback);
    window.removeEventListener("pageshow", callback);
  };
}

const getSnapshot = () => Boolean(isInstalled());
const getServerSnapshot = () => false;

export function useInstalledApp() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
