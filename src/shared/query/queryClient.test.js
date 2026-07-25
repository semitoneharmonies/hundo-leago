import { describe, expect, it, vi } from "vitest";

import { ApiError } from "../api/ApiError.js";
import {
  clearPrivateQueries,
  createGlobalErrorCoordinator,
  createQueryClient,
  shouldRetryQuery,
} from "./queryClient.js";

describe("query client policy", () => {
  it("retries a transient query at most once", () => {
    const networkError = new ApiError({
      code: "NETWORK_ERROR",
      message: "Unavailable.",
      category: "network",
    });
    const serverError = new ApiError({
      status: 503,
      code: "SERVICE_UNAVAILABLE",
      message: "Unavailable.",
    });

    expect(shouldRetryQuery(0, networkError)).toBe(true);
    expect(shouldRetryQuery(1, networkError)).toBe(false);
    expect(shouldRetryQuery(0, serverError)).toBe(true);
    expect(shouldRetryQuery(0, new Error("unknown"))).toBe(false);
  });

  it.each([400, 401, 403, 404, 409, 412, 422, 423, 429])(
    "does not retry HTTP %s",
    (status) => {
      expect(
        shouldRetryQuery(
          0,
          new ApiError({
            status,
            code: "REQUEST_REJECTED",
            message: "Rejected.",
          })
        )
      ).toBe(false);
    }
  );

  it("never retries mutations and refetches active queries on reconnect", () => {
    const queryClient = createQueryClient();
    expect(queryClient.getDefaultOptions().mutations.retry).toBe(false);
    expect(queryClient.getDefaultOptions().queries.refetchOnReconnect).toBe(true);
  });

  it("deduplicates repeated global errors and ignores cancelled requests", () => {
    const notify = vi.fn();
    let currentTime = 10_000;
    const coordinator = createGlobalErrorCoordinator({
      notify,
      now: () => currentTime,
      dedupeWindowMs: 3_000,
    });
    const error = new ApiError({
      status: 503,
      code: "SERVICE_UNAVAILABLE",
      message: "Unavailable.",
      requestId: "request-1",
    });

    expect(coordinator.report(error, { queryHash: "leagues" })).toBe(true);
    expect(coordinator.report(error, { queryHash: "leagues" })).toBe(false);
    currentTime += 3_000;
    expect(coordinator.report(error, { queryHash: "leagues" })).toBe(true);
    expect(
      coordinator.report(
        new ApiError({
          code: "REQUEST_ABORTED",
          message: "Cancelled.",
          category: "aborted",
        })
      )
    ).toBe(false);
    expect(notify).toHaveBeenCalledTimes(2);
  });

  it("removes only queries explicitly marked private", async () => {
    const queryClient = createQueryClient();
    queryClient.getQueryCache().build(queryClient, {
      queryKey: ["session"],
      queryFn: async () => null,
      meta: { private: true },
    }).setData({ user: { id: "user-1" } });
    queryClient.getQueryCache().build(queryClient, {
      queryKey: ["public", "league-1"],
      queryFn: async () => null,
      meta: { private: false },
    }).setData({ id: "league-1" });

    await clearPrivateQueries(queryClient);

    expect(queryClient.getQueryData(["session"])).toBeUndefined();
    expect(queryClient.getQueryData(["public", "league-1"])).toEqual({
      id: "league-1",
    });
  });
});
