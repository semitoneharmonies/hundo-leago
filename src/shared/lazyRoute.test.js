import { describe, expect, it, vi } from "vitest";

import {
  buildLazyRouteReloadPath,
  buildLazyRouteReloadUrl,
  isLazyRouteLoadError,
  loadLazyNamedRoute,
} from "./lazyRoute.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: vi.fn((key) => values.get(key) ?? null),
    removeItem: vi.fn((key) => values.delete(key)),
    setItem: vi.fn((key, value) => values.set(key, value)),
  };
}

const marker = "hundo:lazy-route-reload:v1:LeagueSelectionPage";

describe("lazy route recovery", () => {
  it("builds a cache-busted hard-navigation URL without losing the route", () => {
    expect(
      buildLazyRouteReloadUrl(
        "https://staging.hundoleago.com/leagues/league-1/drafts/free-agent?tab=results#players",
        1723900000000
      )
    ).toBe(
      "https://staging.hundoleago.com/leagues/league-1/drafts/free-agent?tab=results&_hundo_reload=1723900000000#players"
    );
  });

  it("builds a cache-busted same-origin path for recovery links", () => {
    expect(
      buildLazyRouteReloadPath(
        "/leagues/league-1/drafts/free-agent?tab=results#players",
        1723900000000
      )
    ).toBe(
      "/leagues/league-1/drafts/free-agent?tab=results&_hundo_reload=1723900000000#players"
    );
  });

  it("recognizes deployed route-chunk load failures", () => {
    expect(
      isLazyRouteLoadError(
        new TypeError(
          "Failed to fetch dynamically imported module: /assets/LeaguePages-old.js"
        )
      )
    ).toBe(true);
    expect(isLazyRouteLoadError(new Error("private render failure"))).toBe(
      false
    );
    expect(
      isLazyRouteLoadError(
        new Error("Unable to preload CSS for /assets/AuctionPages-old.css")
      )
    ).toBe(true);
  });

  it("hard reloads once when an old tab cannot load its route chunk", async () => {
    const storage = memoryStorage();
    const reload = vi.fn();
    let settled = false;
    const loading = loadLazyNamedRoute({
      loadModule: vi.fn().mockRejectedValue(
        new TypeError(
          "Failed to fetch dynamically imported module: /assets/LeaguePages-old.js"
        )
      ),
      exportName: "LeagueSelectionPage",
      storage,
      reload,
    });
    loading.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      }
    );

    await vi.waitFor(() => expect(reload).toHaveBeenCalledOnce());
    expect(storage.setItem).toHaveBeenCalledWith(marker, "attempted");
    expect(settled).toBe(false);
  });

  it("does not enter a reload loop when the recovered document still fails", async () => {
    const failure = new TypeError(
      "Failed to fetch dynamically imported module: /assets/LeaguePages-old.js"
    );
    const storage = memoryStorage({ [marker]: "attempted" });
    const reload = vi.fn();

    await expect(
      loadLazyNamedRoute({
        loadModule: vi.fn().mockRejectedValue(failure),
        exportName: "LeagueSelectionPage",
        storage,
        reload,
      })
    ).rejects.toBe(failure);
    expect(reload).not.toHaveBeenCalled();
  });

  it("clears the reload guard after the current route module loads", async () => {
    const Page = () => null;
    const storage = memoryStorage({ [marker]: "attempted" });

    await expect(
      loadLazyNamedRoute({
        loadModule: vi.fn().mockResolvedValue({ LeagueSelectionPage: Page }),
        exportName: "LeagueSelectionPage",
        storage,
        reload: vi.fn(),
      })
    ).resolves.toEqual({ default: Page });
    expect(storage.removeItem).toHaveBeenCalledWith(marker);
  });

  it("leaves non-chunk failures to the normal route error boundary", async () => {
    const failure = new Error("private render failure");
    const reload = vi.fn();

    await expect(
      loadLazyNamedRoute({
        loadModule: vi.fn().mockRejectedValue(failure),
        exportName: "LeagueSelectionPage",
        storage: memoryStorage(),
        reload,
      })
    ).rejects.toBe(failure);
    expect(reload).not.toHaveBeenCalled();
  });
});
