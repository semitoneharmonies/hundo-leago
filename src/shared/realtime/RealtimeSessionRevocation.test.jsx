import { act, render, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { SessionProvider } from "../../features/session/SessionProvider.jsx";
import { useSession } from "../../features/session/sessionContext.js";
import { createQueryClient } from "../query/queryClient.js";
import { RealtimeProvider } from "./RealtimeProvider.jsx";
import { useRealtime } from "./realtimeContext.js";

const privateKey = ["league", "one", "private"];
const publicKey = ["site", "public"];
function response(status = 200) {
  return new Response(JSON.stringify(status === 200 ? {
    data: {
      csrfToken: "A".repeat(43),
      session: { id: "session-1", userId: "user-1", status: "active", createdAtMs: 1,
        lastUsedAtMs: 2, idleExpiresAtMs: 3, absoluteExpiresAtMs: 4, version: 1 },
      user: { id: "user-1", displayName: "Manager", status: "active", version: 1 },
    }, meta: { requestId: "session-check" },
  } : { error: { code: "SESSION_REQUIRED", message: "A valid session is required.", requestId: "expired" } }),
  { status, headers: { "Content-Type": "application/json" } });
}
function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
function PrivateContent() {
  const query = useQuery({ queryKey: privateKey, meta: { private: true }, staleTime: Infinity,
    queryFn: async () => ({ label: "Private roster" }) });
  return <p>{query.data?.label || "Private content hidden"}</p>;
}
function Probe() {
  const session = useSession(), realtime = useRealtime();
  return <>
    <output>{session.status}</output>
    <output>{realtime.status}</output>
    {session.status === "authenticated" && realtime.status !== "reauthorizing" &&
      <PrivateContent key={realtime.privacyEpoch} />}
  </>;
}
function mount(fetchImpl) {
  const listeners = new Map();
  const socket = { onAny: vi.fn(), offAny: vi.fn(),
    on: vi.fn((name, callback) => listeners.set(name, callback)), off: vi.fn(),
    connect: vi.fn(), disconnect: vi.fn() };
  const socketFactory = vi.fn(() => socket);
  const queryClient = createQueryClient();
  queryClient.setQueryDefaults(publicKey, { meta: { private: false } });
  queryClient.setQueryData(publicKey, { label: "Public preserved" });
  const view = render(<QueryClientProvider client={queryClient}>
    <SessionProvider apiOrigin="http://localhost:4000" appEnv="local" fetchImpl={fetchImpl}>
      <RealtimeProvider socketOrigin="http://localhost:4000" socketFactory={socketFactory}>
        <Probe />
      </RealtimeProvider>
    </SessionProvider>
  </QueryClientProvider>);
  return { ...view, socket, socketFactory, queryClient, event: (name, ...args) => listeners.get(name)(...args) };
}

describe("immediate session revocation in an idle browser", () => {
  it("rechecks a forced disconnect and removes revoked private content without another user action", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(response()).mockResolvedValueOnce(response(401));
    const view = mount(fetchImpl);
    await screen.findByText("Private roster");
    await act(async () => { await view.event("disconnect", "io server disconnect"); });
    expect(screen.queryByText("Private roster")).toBeNull();
    expect(await screen.findByText("unauthenticated")).toBeInTheDocument();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[1][1].method).toBe("GET");
    expect(view.queryClient.getQueryData(privateKey)).toBeUndefined();
    expect(view.queryClient.getQueryData(publicKey)).toEqual({ label: "Public preserved" });
    expect(view.socket.connect).not.toHaveBeenCalled();
  });

  it("clears the session when the socket handshake explicitly rejects its session", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(response());
    const view = mount(fetchImpl);
    await screen.findByText("Private roster");
    await act(async () => { await view.event("connect_error", { data: { code: "SOCKET_SESSION_REQUIRED" } }); });
    expect(await screen.findByText("unauthenticated")).toBeInTheDocument();
    expect(screen.queryByText("Private roster")).toBeNull();
    expect(view.queryClient.getQueryData(privateKey)).toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(view.socket.connect).not.toHaveBeenCalled();
  });

  it.each(["transport close", "ping timeout", "transport error"])("preserves the session for a temporary %s", async reason => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(response());
    const view = mount(fetchImpl);
    await screen.findByText("Private roster");
    await act(async () => { await view.event("disconnect", reason); });
    expect(screen.getByText("authenticated")).toBeInTheDocument();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(view.socket.connect).not.toHaveBeenCalled();
  });

  it("hides cached content until a still-valid session is confirmed and reconnects once", async () => {
    const pending = deferred();
    const fetchImpl = vi.fn().mockResolvedValueOnce(response()).mockReturnValueOnce(pending.promise);
    const view = mount(fetchImpl);
    await screen.findByText("Private roster");
    let checked;
    await act(async () => { checked = view.event("disconnect", "io server disconnect"); });
    expect(screen.queryByText("Private roster")).toBeNull();
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));
    expect(view.queryClient.getQueryData(privateKey)).toBeUndefined();
    expect(view.socket.connect).not.toHaveBeenCalled();
    await act(async () => { pending.resolve(response()); await checked; });
    expect(screen.getByText("authenticated")).toBeInTheDocument();
    expect(view.socket.connect).toHaveBeenCalledTimes(1);
    expect(view.queryClient.getQueryData(publicKey)).toEqual({ label: "Public preserved" });
  });

  it("cannot restore private content from an earlier reconnect after revocation", async () => {
    const old = deferred();
    const fetchImpl = vi.fn().mockResolvedValueOnce(response()).mockReturnValueOnce(old.promise).mockResolvedValueOnce(response(401));
    const view = mount(fetchImpl);
    await screen.findByText("Private roster");
    let reconnect;
    await act(async () => { reconnect = view.event("connect"); });
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));
    await act(async () => { await view.event("disconnect", "io server disconnect"); });
    await screen.findByText("unauthenticated");
    await act(async () => { old.resolve(response()); await reconnect; });
    expect(screen.getByText("unauthenticated")).toBeInTheDocument();
    expect(screen.queryByText("Private roster")).toBeNull();
    expect(view.socket.connect).not.toHaveBeenCalled();
  });
});
