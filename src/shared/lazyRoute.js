const ROUTE_RELOAD_PREFIX = "hundo:lazy-route-reload:v1:";

function browserSessionStorage() {
  try {
    return globalThis.sessionStorage;
  } catch {
    return null;
  }
}

function browserReload() {
  globalThis.location?.reload();
}

export function isLazyRouteLoadError(error) {
  if (!(error instanceof Error)) return false;
  if (error.name === "ChunkLoadError") return true;
  return /(?:failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|loading chunk .+ failed)/i.test(
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
