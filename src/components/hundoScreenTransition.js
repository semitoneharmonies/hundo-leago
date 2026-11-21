let active = null;

export function hundoScreenMounted(mode) {
  if (active?.mode === mode) active.mounted?.();
}

export async function switchHundoScreen(event, { mode, to, navigate }) {
  if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (active) return;
  const targetMode = mode === "daily" ? "leago" : "daily";
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const go = () => navigate(to, { state: { hundoBrandFrom: mode, hundoScreenWave: true } });
  if (reducedMotion.matches || typeof document.startViewTransition !== "function") { go(); return; }

  const trigger = event.currentTarget;
  const startPath = location.pathname + location.search;
  const run = { mode: targetMode };
  active = run;
  trigger.setAttribute("aria-busy", "true");
  // Load the destination code before capturing the outgoing screen.
  try {
    if (targetMode === "daily") await import("../features/daily/DailyPage.jsx");
    else if (to.startsWith("/leagues")) await import("../features/leagues/LeaguePages.jsx");
  } catch { /* The route's existing loading/error boundary handles a failed chunk. */ }
  if (location.pathname + location.search !== startPath || reducedMotion.matches) {
    trigger.removeAttribute("aria-busy");
    active = null;
    if (location.pathname + location.search === startPath) go();
    return;
  }

  const root = document.documentElement;
  root.dataset.hundoWave = targetMode;
  let transition, mountTimer;
  const stop = () => transition?.skipTransition();
  const onKey = event => { if (event.key === "Escape") stop(); };
  const cleanup = () => {
    clearTimeout(mountTimer);
    trigger.removeAttribute("aria-busy");
    delete root.dataset.hundoWave;
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("popstate", stop);
    reducedMotion.removeEventListener("change", stop);
    if (active === run) active = null;
  };
  let updating;
  const update = () => updating ??= (async () => {
    const mounted = new Promise(resolve => {
      run.mounted = resolve;
      mountTimer = setTimeout(resolve, 1800);
    });
    go();
    await mounted;
    clearTimeout(mountTimer);
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  })();
  document.addEventListener("keydown", onKey);
  window.addEventListener("popstate", stop);
  reducedMotion.addEventListener("change", stop);
  if (typeof document.startViewTransition === "function") {
    try {
      transition = document.startViewTransition(update);
      transition.ready.catch(() => {});
      transition.finished.then(cleanup, cleanup);
      return;
    } catch { /* Older embedded browsers may expose an unavailable implementation. */ }
  }
  // Navigation also succeeds if an embedded browser exposes an unavailable API.
  try { await update(); } finally { cleanup(); }
}
