import { useSyncExternalStore } from "react";

const query = "(min-width: 1024px)";
function subscribe(callback) {
  const media = window.matchMedia?.(query);
  media?.addEventListener("change", callback);
  return () => media?.removeEventListener("change", callback);
}

export function useDesktopLayout() {
  return useSyncExternalStore(subscribe, () => window.matchMedia?.(query).matches ?? false, () => false);
}
