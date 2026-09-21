import { describe, expect, it, vi } from "vitest";

import { ApiError } from "./ApiError.js";
import { createHttpClient } from "./httpClient.js";

function jsonResponse(body, { status = 200, headers } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function success(data, requestId = "request-1") {
  return jsonResponse({ data, meta: { requestId } });
}

describe("createHttpClient", () => {
  it("resolves trusted API resource paths against the configured origin", () => {
    const client = createHttpClient({
      apiOrigin: "https://api.example.test",
      fetchImpl: vi.fn(),
    });

    expect(client.resourceUrl("/api/v1/leagues/league-1/logo")).toBe(
      "https://api.example.test/api/v1/leagues/league-1/logo"
    );
    expect(() => client.resourceUrl("https://other.example.test/logo")).toThrow(
      "The resource path is invalid."
    );
  });

  it("sends credentials and Accept on reads without inventing a body", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(success([]));
    const signal = new AbortController().signal;
    const client = createHttpClient({
      apiOrigin: "https://api.example.test",
      fetchImpl,
    });

    await expect(
      client.request("/api/v1/leagues", { signal, dataKind: "array" })
    ).resolves.toEqual({ data: [], meta: { requestId: "request-1" } });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.example.test/api/v1/leagues");
    expect(init.credentials).toBe("include");
    expect(init.signal).toBe(signal);
    expect(init.headers.get("Accept")).toBe("application/json");
    expect(init.headers.has("Content-Type")).toBe(false);
    expect(init).not.toHaveProperty("body");
  });

  it("sends JSON, CSRF, version, and idempotency on authenticated writes", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(success({ id: "team-1" }));
    const client = createHttpClient({
      apiOrigin: "https://api.example.test",
      fetchImpl,
      getCsrfToken: () => "csrf-in-memory",
    });

    await client.request("/api/v1/leagues/league-1/teams/team-1/profile", {
      method: "PATCH",
      authenticated: true,
      body: { name: "Snow Owls" },
      version: 4,
      idempotencyKey: "team-profile:operation-1",
      dataKind: "object",
    });

    const init = fetchImpl.mock.calls[0][1];
    expect(init.headers.get("Content-Type")).toBe("application/json");
    expect(init.headers.get("X-CSRF-Token")).toBe("csrf-in-memory");
    expect(init.headers.get("If-Match")).toBe('"4"');
    expect(init.headers.get("Idempotency-Key")).toBe(
      "team-profile:operation-1"
    );
    expect(init.body).toBe(JSON.stringify({ name: "Snow Owls" }));
  });

  it("returns opt-in collection actions and contract-specific page data", async () => {
    const longCursor = "a".repeat(256);
    const client = createHttpClient({
      apiOrigin: "https://api.example.test",
      fetchImpl: vi.fn().mockResolvedValue(
        jsonResponse({
          data: [],
          actions: { startTeams: [] },
          page: { nextCursor: longCursor, hasMore: true },
          meta: { requestId: "request-auctions" },
        })
      ),
    });

    await expect(
      client.request("/api/v1/leagues/league-1/auctions", {
        dataKind: "array",
        actionsKind: "object",
        validateActions: (actions) => Array.isArray(actions.startTeams),
        validatePage: (page) => page.nextCursor === longCursor,
      })
    ).resolves.toEqual({
      data: [],
      actions: { startTeams: [] },
      page: { nextCursor: longCursor, hasMore: true },
      meta: { requestId: "request-auctions" },
    });
  });

  it("does not send CSRF on public unsafe requests", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(success({ accepted: true }));
    const client = createHttpClient({
      apiOrigin: "https://api.example.test",
      fetchImpl,
      getCsrfToken: () => "must-not-be-sent",
    });

    await client.request("/api/v1/session", {
      method: "POST",
      body: { email: "user@example.test", password: "not-logged" },
      dataKind: "object",
    });

    expect(fetchImpl.mock.calls[0][1].headers.has("X-CSRF-Token")).toBe(false);
  });

  it("requires in-memory CSRF before authenticated unsafe requests", async () => {
    const fetchImpl = vi.fn();
    const client = createHttpClient({
      apiOrigin: "https://api.example.test",
      fetchImpl,
    });

    await expect(
      client.request("/api/v1/session", {
        method: "DELETE",
        authenticated: true,
      })
    ).rejects.toMatchObject({
      name: "ApiError",
      code: "CLIENT_REQUEST_INVALID",
      category: "client",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns a safe empty representation for 204", async () => {
    const client = createHttpClient({
      apiOrigin: "https://api.example.test",
      fetchImpl: vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    });

    await expect(client.request("/api/v1/session")).resolves.toEqual({
      data: null,
      meta: { requestId: null },
    });
  });

  it("throws the documented typed safe error and parses Retry-After", async () => {
    const client = createHttpClient({
      apiOrigin: "https://api.example.test",
      fetchImpl: vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: "RATE_LIMITED",
              message: "Please try again later.",
              details: { scope: "request" },
              requestId: "request-2",
            },
          },
          { status: 429, headers: { "Retry-After": "60" } }
        )
      ),
    });

    await expect(client.request("/api/v1/session")).rejects.toMatchObject({
      name: "ApiError",
      status: 429,
      code: "RATE_LIMITED",
      message: "Please try again later.",
      details: { scope: "request" },
      requestId: "request-2",
      retryAfterSeconds: 60,
      category: "http",
    });
  });

  it("clears authentication on every confirmed 401, even if its body is malformed", async () => {
    const onUnauthorized = vi.fn();
    const client = createHttpClient({
      apiOrigin: "https://api.example.test",
      fetchImpl: vi
        .fn()
        .mockResolvedValue(new Response("private raw failure", { status: 401 })),
      onUnauthorized,
    });

    await expect(
      client.request("/api/v1/session", { authenticated: true })
    ).rejects.toMatchObject({
      code: "APPLICATION_DATA_INVALID",
    });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("does not treat a public sign-in 401 as loss of an existing session", async () => {
    const onUnauthorized = vi.fn();
    const client = createHttpClient({
      apiOrigin: "https://api.example.test",
      fetchImpl: vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: "SIGN_IN_FAILED",
              message: "The submitted credentials were not accepted.",
              requestId: "request-sign-in",
            },
          },
          { status: 401 }
        )
      ),
      onUnauthorized,
    });

    await expect(
      client.request("/api/v1/session", {
        method: "POST",
        body: { email: "user@example.test", password: "incorrect" },
      })
    ).rejects.toMatchObject({ code: "SIGN_IN_FAILED" });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("turns network and abort failures into safe categories", async () => {
    const networkClient = createHttpClient({
      apiOrigin: "https://api.example.test",
      fetchImpl: vi.fn().mockRejectedValue(new Error("sensitive transport text")),
    });
    await expect(networkClient.request("/api/v1/session")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      category: "network",
      message: "The server could not be reached.",
    });

    const abortError = new Error("cancelled");
    abortError.name = "AbortError";
    const abortClient = createHttpClient({
      apiOrigin: "https://api.example.test",
      fetchImpl: vi.fn().mockRejectedValue(abortError),
    });
    await expect(abortClient.request("/api/v1/session")).rejects.toMatchObject({
      code: "REQUEST_ABORTED",
      category: "aborted",
    });
  });

  it("fails visibly for malformed success data and invalid client options", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ data: [], meta: {} }));
    const client = createHttpClient({
      apiOrigin: "https://api.example.test",
      fetchImpl,
    });

    await expect(
      client.request("/api/v1/leagues", { dataKind: "array" })
    ).rejects.toBeInstanceOf(ApiError);
    await expect(client.request("https://evil.example/api")).rejects.toMatchObject({
      code: "CLIENT_REQUEST_INVALID",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
