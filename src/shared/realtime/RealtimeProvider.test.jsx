import { act, render, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { SessionContext } from "../../features/session/sessionContext.js";
import { createQueryClient } from "../query/queryClient.js";
import { RealtimeProvider } from "./RealtimeProvider.jsx";
import { useRealtime } from "./realtimeContext.js";
import { REALTIME_RELATED_ID_KEYS } from "./realtimeInvalidation.js";

const leagueId = "11111111-1111-4111-8111-111111111111";
const otherLeagueId = "22222222-2222-4222-8222-222222222222";
const fadId = "33333333-3333-4333-8333-333333333333";

function sessionData() {
  return {
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
      displayName: "Realtime Manager",
      status: "active",
      version: 1,
    },
  };
}

function related(overrides = {}) {
  return Object.fromEntries(
    REALTIME_RELATED_ID_KEYS.map((key) => [
      key,
      Object.prototype.hasOwnProperty.call(overrides, key)
        ? overrides[key]
        : null,
    ])
  );
}

function event() {
  return {
    eventId: "44444444-4444-4444-8444-444444444444",
    type: "free_agent_draft.changed",
    leagueId,
    resourceId: fadId,
    version: 2,
    reasonCode: "cards_opened",
    occurredAt: 1_786_432_100_000,
    related: related({ fadId }),
  };
}

function socketHarness() {
  const listeners = new Map();
  let anyListener;
  const socket = {
    onAny: vi.fn((listener) => {
      anyListener = listener;
    }),
    offAny: vi.fn(),
    on: vi.fn((name, listener) => listeners.set(name, listener)),
    off: vi.fn(),
    disconnect: vi.fn(),
  };
  return {
    socket,
    socketFactory: vi.fn(() => socket),
    any: (...args) => anyListener(...args),
    listener: (name) => listeners.get(name),
  };
}

function StatusProbe() {
  return <output>{useRealtime().status}</output>;
}

function RealtimeStateProbe() {
  const realtime = useRealtime();
  return <output>{`${realtime.status}:${realtime.privacyEpoch}`}</output>;
}

function PrivateQueryProbe({ queryFn }) {
  const query = useQuery({
    queryKey: ["league", leagueId, "private-probe"],
    queryFn,
    meta: { private: true, leagueId },
    staleTime: Infinity,
  });
  return <output>{query.data?.secret || "private-hidden"}</output>;
}

function PrivacyAwarePrivateQueryProbe({ queryFn }) {
  const realtime = useRealtime();
  if (realtime.status === "reauthorizing") {
    return <output>private-hidden</output>;
  }
  return (
    <PrivateQueryProbe key={realtime.privacyEpoch} queryFn={queryFn} />
  );
}

function renderProvider({
  queryClient = createQueryClient(),
  harness = socketHarness(),
  invalidationMappers = [],
  request = vi.fn(async () => ({ data: sessionData() })),
  adoptSession = vi.fn(),
  children = <StatusProbe />,
} = {}) {
  const session = {
    status: "authenticated",
    httpClient: { request },
    adoptSession,
  };
  const view = render(
    <QueryClientProvider client={queryClient}>
      <SessionContext.Provider value={session}>
        <RealtimeProvider
          socketOrigin="http://localhost:4000"
          socketFactory={harness.socketFactory}
          invalidationMappers={invalidationMappers}
        >
          {children}
        </RealtimeProvider>
      </SessionContext.Provider>
    </QueryClientProvider>
  );
  return { ...view, adoptSession, harness, queryClient, request };
}

describe("RealtimeProvider", () => {
  it("owns one credentialed Socket.IO lifecycle and cleans up every listener", () => {
    const view = renderProvider();
    expect(view.harness.socketFactory).toHaveBeenCalledTimes(1);
    expect(view.harness.socketFactory).toHaveBeenCalledWith(
      "http://localhost:4000",
      { withCredentials: true, autoConnect: true }
    );
    expect(view.harness.socket.onAny).toHaveBeenCalledTimes(1);
    expect(view.harness.socket.on).toHaveBeenCalledWith(
      "connect",
      expect.any(Function)
    );
    expect(view.harness.socket.on).toHaveBeenCalledWith(
      "disconnect",
      expect.any(Function)
    );
    expect(view.harness.socket.on).toHaveBeenCalledWith(
      "connect_error",
      expect.any(Function)
    );

    const anyListener = view.harness.socket.onAny.mock.calls[0][0];
    view.unmount();
    expect(view.harness.socket.offAny).toHaveBeenCalledWith(anyListener);
    expect(view.harness.socket.off).toHaveBeenCalledTimes(3);
    expect(view.harness.socket.disconnect).toHaveBeenCalledTimes(1);
  });

  it("ignores invalid payloads and sends only validated frozen envelopes to feature mappers", async () => {
    const mapper = vi.fn(() => []);
    const view = renderProvider({ invalidationMappers: [mapper] });
    await act(async () => {
      view.harness.any("free_agent_draft.changed", {
        type: "free_agent_draft.changed",
        leagueId,
      });
    });
    expect(mapper).not.toHaveBeenCalled();

    await act(async () => {
      view.harness.any("free_agent_draft.changed", event());
    });
    expect(mapper).toHaveBeenCalledTimes(1);
    const parsed = mapper.mock.calls[0][0];
    expect(parsed).toEqual(event());
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.related)).toBe(true);
  });

  it("enforces league isolation around feature mapper actions", async () => {
    const queryClient = createQueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();
    const mapper = () => [
      {
        operation: "invalidate",
        queryKey: ["league", leagueId, "free-agent-draft", fadId],
      },
      {
        operation: "invalidate",
        queryKey: ["league", otherLeagueId, "free-agent-draft", fadId],
      },
    ];
    const view = renderProvider({ queryClient, invalidationMappers: [mapper] });
    await act(async () => {
      view.harness.any("free_agent_draft.changed", event());
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["league", leagueId, "free-agent-draft", fadId],
    });
    expect(invalidateQueries).not.toHaveBeenCalledWith({
      queryKey: ["league", otherLeagueId, "free-agent-draft", fadId],
    });
  });

  it("scopes authority-boundary active refetches to the event league", async () => {
    const queryClient = createQueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();
    const view = renderProvider({ queryClient });

    await act(async () => {
      view.harness.any("league.changed", {
        eventId: "55555555-5555-4555-8555-555555555555",
        type: "league.changed",
        leagueId,
        resourceId: "66666666-6666-4666-8666-666666666666",
        version: 2,
        reasonCode: "membership_changed",
        occurredAt: 1_786_432_100_001,
        related: related(),
      });
      await Promise.resolve();
    });

    const activeRefetch = invalidateQueries.mock.calls.find(
      ([options]) => options.refetchType === "active"
    )?.[0];
    expect(activeRefetch).toEqual({
      predicate: expect.any(Function),
      refetchType: "active",
    });
    expect(
      activeRefetch.predicate({
        queryKey: ["league", leagueId, "free-agent-draft", fadId],
      })
    ).toBe(true);
    expect(
      activeRefetch.predicate({
        queryKey: ["league", otherLeagueId, "free-agent-draft", fadId],
      })
    ).toBe(false);
    expect(activeRefetch.predicate({ queryKey: ["notifications"] })).toBe(
      false
    );
  });

  it("removes private league caches before reconnect session reauthorization", async () => {
    const queryClient = createQueryClient();
    queryClient.setQueryDefaults(["league", leagueId, "private"], {
      meta: { private: true, leagueId },
    });
    queryClient.setQueryData(["league", leagueId, "private"], { secret: true });
    queryClient.setQueryDefaults(["league", otherLeagueId, "private"], {
      meta: { private: true, leagueId: otherLeagueId },
    });
    queryClient.setQueryData(["league", otherLeagueId, "private"], {
      otherSecret: true,
    });
    queryClient.setQueryDefaults(["notifications"], {
      meta: { private: true },
    });
    queryClient.setQueryData(["notifications"], [{ id: "notice" }]);
    queryClient.setQueryDefaults(["public-roster", leagueId], {
      meta: { private: false },
    });
    queryClient.setQueryData(["public-roster", leagueId], { public: true });

    let resolveRequest;
    const request = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        })
    );
    const view = renderProvider({ queryClient, request });
    let reconnect;
    await act(async () => {
      reconnect = view.harness.listener("connect")();
      await Promise.resolve();
    });

    expect(screen.getByText("reauthorizing")).toBeInTheDocument();
    expect(queryClient.getQueryData(["league", leagueId, "private"])).toBeUndefined();
    expect(
      queryClient.getQueryData(["league", otherLeagueId, "private"])
    ).toBeUndefined();
    expect(queryClient.getQueryData(["notifications"])).toBeUndefined();
    expect(queryClient.getQueryData(["public-roster", leagueId])).toEqual({
      public: true,
    });
    expect(view.adoptSession).not.toHaveBeenCalled();

    await act(async () => {
      resolveRequest({ data: sessionData() });
      await reconnect;
    });
    expect(view.adoptSession).toHaveBeenCalledWith(sessionData());
    await waitFor(() =>
      expect(screen.getByText("connected")).toBeInTheDocument()
    );
  });

  it("removes rendered private query data before reconnect confirmation", async () => {
    let resolveRequest;
    const request = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        })
    );
    const queryFn = vi.fn(async () => ({ secret: "private-visible" }));
    const view = renderProvider({
      request,
      children: (
        <>
          <StatusProbe />
          <PrivacyAwarePrivateQueryProbe queryFn={queryFn} />
        </>
      ),
    });
    await waitFor(() =>
      expect(screen.getByText("private-visible")).toBeInTheDocument()
    );

    let reconnect;
    await act(async () => {
      reconnect = view.harness.listener("connect")();
      await Promise.resolve();
    });
    expect(screen.queryByText("private-visible")).not.toBeInTheDocument();
    expect(screen.getByText("private-hidden")).toBeInTheDocument();

    await act(async () => {
      resolveRequest({ data: sessionData() });
      await reconnect;
    });
    await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(2));
  });

  it("fails closed when reconnect authorization cannot be confirmed", async () => {
    const request = vi.fn(async () => {
      throw new Error("unavailable");
    });
    const view = renderProvider({ request });
    await act(async () => {
      await view.harness.listener("connect")();
    });
    expect(screen.getByText("disconnected")).toBeInTheDocument();
    expect(view.adoptSession).not.toHaveBeenCalled();
  });

  it("does not expose connected state when an authority event races reconnect", async () => {
    let resolveRequest;
    const request = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        })
    );
    const view = renderProvider({
      request,
      children: <RealtimeStateProbe />,
    });
    let reconnect;
    await act(async () => {
      reconnect = view.harness.listener("connect")();
      await Promise.resolve();
    });
    expect(screen.getByText("reauthorizing:1")).toBeInTheDocument();

    await act(async () => {
      view.harness.any("league.changed", {
        eventId: "55555555-5555-4555-8555-555555555555",
        type: "league.changed",
        leagueId,
        resourceId: "66666666-6666-4666-8666-666666666666",
        version: 2,
        reasonCode: "membership_changed",
        occurredAt: 1_786_432_100_001,
        related: related(),
      });
      await Promise.resolve();
    });
    expect(screen.getByText("reauthorizing:2")).toBeInTheDocument();

    await act(async () => {
      resolveRequest({ data: sessionData() });
      await reconnect;
    });
    expect(screen.getByText("connected:2")).toBeInTheDocument();
  });
});
