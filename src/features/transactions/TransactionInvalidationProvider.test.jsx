import { act, render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AppProviders } from "../../app/AppProviders.jsx";
import { createQueryClient } from "../../shared/query/queryClient.js";
import {
  invalidationPrefixes,
} from "./transactionInvalidation.js";

const leagueId = "11111111-1111-4111-8111-111111111111";
const config = Object.freeze({
  appEnv: "local",
  apiOrigin: "http://localhost:4000",
  socketOrigin: "http://localhost:4000",
  buildId: null,
});

function sessionResponse() {
  return new Response(
    JSON.stringify({
      data: {
        csrfToken: "A".repeat(43),
        session: {
          id: "session-1",
          userId: "user-1",
          status: "active",
          createdAtMs: 1,
          lastUsedAtMs: 2,
          idleExpiresAtMs: 3,
          absoluteExpiresAtMs: 4,
          version: 1,
        },
        user: {
          id: "user-1",
          displayName: "Reconnect Manager",
          status: "active",
          version: 1,
        },
      },
      meta: { requestId: "request-session" },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

describe("M5-11 metadata-only socket invalidation", () => {
  it("maps trade and auction metadata only to scoped refetch prefixes", () => {
    expect(invalidationPrefixes("trade.changed", { type: "trade.changed", leagueId })).toEqual([
      ["league", leagueId, "activity"],
      ["league", leagueId, "trades"],
      ["league", leagueId, "trade"],
      ["notifications"],
    ]);
    expect(invalidationPrefixes("auction.updated", { type: "auction.updated", leagueId })).toEqual([
      ["league", leagueId, "activity"],
      ["league", leagueId, "auctions"],
      ["league", leagueId, "auction"],
      ["notifications"],
    ]);
  });

  it("ignores malformed, cross-shape, and non-metadata input", () => {
    expect(invalidationPrefixes("trade.changed", { type: "auction.updated", leagueId })).toEqual([]);
    expect(invalidationPrefixes("trade.changed", { type: "trade.changed", leagueId: "not-an-id" })).toEqual([]);
    expect(invalidationPrefixes("trade.changed", null)).toEqual([]);
  });
});

describe("Socket.IO reconnect recovery", () => {
  it("registers the connect listener, refetches active queries, and cleans up", async () => {
    let connectListener;
    const socket = {
      onAny: vi.fn(),
      offAny: vi.fn(),
      on: vi.fn((eventName, listener) => {
        if (eventName === "connect") connectListener = listener;
      }),
      off: vi.fn(),
      disconnect: vi.fn(),
    };
    const socketFactory = vi.fn(() => socket);
    const fetchImpl = vi.fn(async (url) => {
      if (new URL(url).pathname === "/api/v1/session") {
        return sessionResponse();
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    const queryClient = createQueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();

    const view = render(
      <AppProviders
        config={config}
        queryClient={queryClient}
        Router={MemoryRouter}
        routerProps={{ initialEntries: [`/leagues/${leagueId}/matchups`] }}
        sessionOptions={{ fetchImpl }}
        socketFactory={socketFactory}
      >
        <p>Reconnect test page</p>
      </AppProviders>
    );

    await waitFor(() => expect(socketFactory).toHaveBeenCalledTimes(1));
    expect(socketFactory).toHaveBeenCalledWith(config.socketOrigin, {
      withCredentials: true,
      autoConnect: true,
    });
    expect(socket.on).toHaveBeenCalledWith("connect", expect.any(Function));
    expect(connectListener).toEqual(expect.any(Function));

    await act(async () => {
      await connectListener();
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      refetchType: "active",
    });

    const onAnyListener = socket.onAny.mock.calls[0][0];
    view.unmount();

    expect(socket.offAny).toHaveBeenCalledWith(onAnyListener);
    expect(socket.off).toHaveBeenCalledWith("connect", connectListener);
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
  });
});
