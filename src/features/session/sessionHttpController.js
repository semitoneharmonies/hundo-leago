import { createHttpClient } from "../../shared/api/httpClient.js";

export function createSessionHttpController({ apiOrigin, fetchImpl }) {
  let csrfToken = null;
  let onUnauthorized = () => {};
  const httpClient = createHttpClient({
    apiOrigin,
    fetchImpl,
    getCsrfToken: () => csrfToken,
    onUnauthorized: () => onUnauthorized(),
  });

  return Object.freeze({
    httpClient,
    clearCsrfToken() {
      csrfToken = null;
    },
    setCsrfToken(value) {
      csrfToken = value;
    },
    setOnUnauthorized(callback) {
      if (typeof callback !== "function") {
        throw new TypeError("The unauthorized callback must be a function.");
      }
      onUnauthorized = callback;
    },
  });
}
