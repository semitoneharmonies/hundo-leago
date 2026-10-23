const ROUTE_RELOAD_PREFIX = "hundo:lazy-route-reload:v1:";
const ROUTE_RELOAD_QUERY_PARAM = "_hundo_reload";

function browserSessionStorage() {
  try {
    return globalThis.sessionStorage;
  } catch {
    return null;
  }
}

function browserReload() {
  const currentUrl = globalThis.location?.href;
  if (!currentUrl || typeof globalThis.location?.replace !== "function") {
    throw new Error("A browser navigation is required to reload this route.");
  }
  globalThis.location.replace(buildLazyRouteReloadUrl(currentUrl));
}

export function buildLazyRouteReloadUrl(currentUrl, nonce = Date.now()) {
  const reloadUrl = new URL(currentUrl);
  reloadUrl.searchParams.set(ROUTE_RELOAD_QUERY_PARAM, String(nonce));
  return reloadUrl.href;
}

export function buildLazyRouteReloadPath(currentPath, nonce = Date.now()) {
  const reloadUrl = new URL(currentPath, "https://hundo.invalid");
  reloadUrl.searchParams.set(ROUTE_RELOAD_QUERY_PARAM, String(nonce));
  return `${reloadUrl.pathname}${reloadUrl.search}${reloadUrl.hash}`;
}

export function isLazyRouteLoadError(error) {
  if (!(error instanceof Error)) return false;
  if (error.name === "ChunkLoadError") return true;
  return /(?:failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|loading chunk .+ failed|unable to preload css)/i.test(
    error.message
  );
}

export async function loadLazyNamedRoute({
  loadModule,
  exportName,
  storage = browserSessionStorage(),
  reload = browserReload,
}) {
  if (typeof loadModule !== "function" || typeof exportName !== "string") {
    throw new TypeError("Lazy route loading requires a module and export name.");
  }

  const reloadMarker = `${ROUTE_RELOAD_PREFIX}${exportName}`;

  try {
    const loadedModule = await loadModule();
    try {
      storage?.removeItem(reloadMarker);
    } catch {
      // Route loading must not depend on browser-storage availability.
    }
    return { default: loadedModule[exportName] };
  } catch (error) {
    if (!isLazyRouteLoadError(error) || !storage) throw error;

    let reloadAlreadyAttempted;
    try {
      reloadAlreadyAttempted =
        storage.getItem(reloadMarker) === "attempted";
      if (!reloadAlreadyAttempted) {
        storage.setItem(reloadMarker, "attempted");
      }
    } catch {
      throw error;
    }
    if (reloadAlreadyAttempted) throw error;

    try {
      reload();
    } catch {
      try {
        storage.removeItem(reloadMarker);
      } catch {
        // Preserve the original route-load failure.
      }
      throw error;
    }

    return new Promise(() => {});
  }
}
