import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { ApiError } from "../api/ApiError.js";

const NO_RETRY_STATUSES = new Set([
  400, 401, 403, 404, 409, 412, 422, 423, 429,
]);

export function shouldRetryQuery(failureCount, error) {
  if (failureCount >= 1 || !(error instanceof ApiError)) return false;
  if (NO_RETRY_STATUSES.has(error.status)) return false;
  return error.category === "network" || error.status >= 500;
}

function errorIdentity(error, context) {
  if (error instanceof ApiError) {
    return error.requestId || `${error.category}:${error.status}:${error.code}`;
  }
  return `unknown:${context.queryHash || "query"}`;
}

export function createGlobalErrorCoordinator({
  notify = () => {},
  now = () => Date.now(),
  dedupeWindowMs = 3_000,
} = {}) {
  if (typeof notify !== "function" || typeof now !== "function") {
    throw new TypeError("Global error coordination requires callbacks.");
  }
  if (!Number.isInteger(dedupeWindowMs) || dedupeWindowMs < 0) {
    throw new TypeError("Global error coordination requires a valid window.");
  }

  const lastReportedAt = new Map();

  return Object.freeze({
    report(error, context = {}) {
      if (error instanceof ApiError && error.category === "aborted") return false;
      const identity = errorIdentity(error, context);
      const currentTime = now();
      const previousTime = lastReportedAt.get(identity);
      if (
        previousTime !== undefined &&
        currentTime - previousTime < dedupeWindowMs
      ) {
        return false;
      }
      lastReportedAt.set(identity, currentTime);
      notify(error, context);
      return true;
    },
    reset() {
      lastReportedAt.clear();
    },
  });
}

export function createQueryClient({ onQueryError = () => {} } = {}) {
  const coordinator = createGlobalErrorCoordinator({ notify: onQueryError });

  return new QueryClient({
    queryCache: new QueryCache({
      onError(error, query) {
        if (query.meta?.suppressGlobalError === true) return;
        coordinator.report(error, {
          queryHash: query.queryHash,
          queryKey: query.queryKey,
        });
      },
    }),
    mutationCache: new MutationCache(),
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export async function clearPrivateQueries(queryClient) {
  if (!(queryClient instanceof QueryClient)) {
    throw new TypeError("Private cache cleanup requires a Query Client.");
  }
  const predicate = (query) => query.meta?.private === true;
  await queryClient.cancelQueries({ predicate });
  queryClient.removeQueries({ predicate });
}
