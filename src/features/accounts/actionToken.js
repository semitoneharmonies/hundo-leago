const ACTION_PATHS = new Set([
  "/verify-email",
  "/setup-account",
  "/reset-password",
  "/reactivate",
]);
const ACTION_TOKEN = /^[A-Za-z0-9_-]{43}$/;

export function consumeActionTokenFragment({
  location = globalThis.location,
  history = globalThis.history,
} = {}) {
  if (!location || !history || !ACTION_PATHS.has(location.pathname)) return null;

  const fragment = location.hash.startsWith("#")
    ? location.hash.slice(1)
    : location.hash;
  const parameters = new URLSearchParams(fragment);
  const token =
    [...parameters.keys()].length === 1 &&
    parameters.has("token") &&
    ACTION_TOKEN.test(parameters.get("token") || "")
      ? parameters.get("token")
      : null;

  if (location.hash) {
    history.replaceState(
      history.state,
      "",
      `${location.pathname}${location.search}`
    );
  }
  return token;
}
