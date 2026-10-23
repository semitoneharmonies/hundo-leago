import { createHttpClient } from "../../shared/api/httpClient.js";
import { observeRecoveryEpoch } from "../../shared/api/recoveryIntent.js";

export function createSessionHttpController({ apiOrigin, fetchImpl }) {
  let csrfToken = null;
  let authenticationGeneration = 0;
  let onUnauthorized = () => {};
  const httpClient = createHttpClient({
    apiOrigin,
    fetchImpl,
    getCsrfToken: () => csrfToken,
    getAuthenticationGeneration: () => authenticationGeneration,
    onUnauthorized: (requestGeneration) => {
      if (requestGeneration === authenticationGeneration) return onUnauthorized();
    },
    onRecoveryEpoch: observeRecoveryEpoch,
  });

  return Object.freeze({
    httpClient,
    clearCsrfToken() {
      authenticationGeneration += 1;
      csrfToken = null;
    },
    setCsrfToken(value) {
      if (value !== csrfToken) authenticationGeneration += 1;
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
