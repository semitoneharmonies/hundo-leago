import { describe, expect, it, vi } from "vitest";
import { consumeActionTokenFragment, watchActionTokenFragments } from "./actionToken.js";

const first = "A".repeat(43);
const replacement = "B".repeat(43);

function browserAt(pathname) {
  const eventTarget = new EventTarget();
  const location = { pathname, search: "", hash: `#token=${first}` };
  const history = { state: { retained: true }, replaceState: vi.fn(() => { location.hash = ""; }) };
  const loaded = [consumeActionTokenFragment({ location, history })];
  location.reload = vi.fn(() => loaded.push(consumeActionTokenFragment({ location, history })));
  const stop = watchActionTokenFragments({ eventTarget, location });
  return { location, history, loaded, stop, navigate(hash) {
    location.hash = hash;
    eventTarget.dispatchEvent(new Event("hashchange"));
  } };
}

describe("account links opened again in the same tab", () => {
  it.each(["/reset-password", "/verify-email", "/setup-account", "/reactivate"])(
    "%s restarts with the replacement token and removes its fragment", (pathname) => {
      const browser = browserAt(pathname);
      expect(browser.loaded).toEqual([first]);
      browser.navigate(`#token=${replacement}`);
      expect(browser.location.reload).toHaveBeenCalledTimes(1);
      expect(browser.loaded).toEqual([first, replacement]);
      expect(browser.location.hash).toBe("");
      expect(browser.history.replaceState).toHaveBeenLastCalledWith({ retained: true }, "", pathname);
      browser.stop();
    },
  );

  it("a malformed replacement restarts without retaining the old valid action", () => {
    const browser = browserAt("/reset-password");
    browser.navigate("#token=malformed");
    expect(browser.loaded).toEqual([first, null]);
    expect(browser.location.hash).toBe("");
    browser.stop();
  });

  it("ordinary page anchors and an empty action fragment do not reload", () => {
    const browser = browserAt("/leagues");
    browser.navigate("#standings");
    expect(browser.location.reload).not.toHaveBeenCalled();
    browser.location.pathname = "/reset-password";
    browser.navigate("");
    expect(browser.location.reload).not.toHaveBeenCalled();
    browser.stop();
  });

  it("stops observing when the module is replaced during development", () => {
    const browser = browserAt("/reset-password");
    browser.stop();
    browser.navigate(`#token=${replacement}`);
    expect(browser.location.reload).not.toHaveBeenCalled();
  });
});
