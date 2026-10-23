import { useEffect } from "react";
import { act, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createQueryClient } from "../../shared/query/queryClient.js";
import { renderWithProviders } from "../../test/render.jsx";
import { useSession } from "./sessionContext.js";

const config = { appEnv: "staging", apiOrigin: "http://localhost:4000", socketOrigin: "http://localhost:4000", buildId: null };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const denied = () => json({ error: { code: "SESSION_REQUIRED", message: "Sign in required.", requestId: "session-race" } }, 401);
function envelope(id = "first", displayName = "First Manager") {
  return { data: { csrfToken: (id === "first" ? "A" : "B").repeat(43), user: { id: "user-" + id, displayName, status: "active", version: 1 }, session: { id: "session-" + id, userId: "user-" + id, status: "active", version: 1, createdAtMs: 1, lastUsedAtMs: 2, idleExpiresAtMs: 3, absoluteExpiresAtMs: 4 } }, meta: { requestId: "session-race" } };
}
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
function fixture(fetchImpl) {
  let latest;
  function Probe() {
    const session = useSession();
    useEffect(() => { latest = session; }, [session]);
    return <p data-testid="session-state">{session.status}:{session.notice}:{session.user?.displayName}</p>;
  }
  const queryClient = createQueryClient();
  queryClient.setQueryDefaults(["private"], { meta: { private: true } });
  queryClient.setQueryData(["private"], { owner: "old-viewer" });
  queryClient.setQueryData(["public"], { label: "public-value" });
  renderWithProviders(<Probe />, { enableSession: true, config, queryClient, sessionOptions: { fetchImpl } });
  return { get session() { return latest; }, queryClient };
}

describe("account completion and delayed session responses", () => {
  it.each(["password-changed", "account-deactivated", "credentials-changed", "account-reactivated", "signed-out", "staging-fixture-reset"])("retains %s after generic revocation and missing-session signals", async notice => {
    const view = fixture(vi.fn().mockResolvedValue(json(envelope())));
    await screen.findByText("authenticated::First Manager");
    const receipt = { backupId: "backup-v1-" + "a".repeat(64), fixtureBuildId: "fixture-race", resetAtMs: 1000, providerCatalogPlayerCount: 800, sessionInvalidated: true };
    await act(() => view.session.clearAuthentication(notice, receipt));
    await act(() => view.session.clearAuthentication("session-expired"));
    await act(() => view.session.clearAuthentication(null));
    expect(view.session.status).toBe("unauthenticated");
    expect(view.session.notice).toBe(notice);
    expect(view.session.stagingResetReceipt).toEqual(notice === "staging-fixture-reset" ? receipt : null);
    expect(view.queryClient.getQueryData(["private"])).toBeUndefined();
    expect(view.queryClient.getQueryData(["public"])).toEqual({ label: "public-value" });
  });

  it("does not let a delayed initial bootstrap restore a completed signed-out account", async () => {
    const pending = deferred(); const fetchImpl = vi.fn().mockReturnValue(pending.promise); const view = fixture(fetchImpl);
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));
    await act(() => view.session.clearAuthentication("password-changed"));
    await act(async () => pending.resolve(json(envelope())));
    expect(view.session.status).toBe("unauthenticated");
    expect(view.session.notice).toBe("password-changed");
    await expect(view.session.httpClient.request("/api/v1/private", { authenticated: true, method: "POST", body: {} })).rejects.toMatchObject({ code: "CLIENT_REQUEST_INVALID" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it.each([200, 401, 503])("keeps a successful new sign-in when an older initial bootstrap returns %s", async status => {
    const pending = deferred();
    const fetchImpl = vi.fn((_url, options) => options.method === "POST" ? Promise.resolve(json(envelope("new", "New Manager"))) : pending.promise);
    const view = fixture(fetchImpl); await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));
    await act(() => view.session.signIn({ email: "new@example.test", password: "fixture-only" }));
    const response = status === 200 ? json(envelope()) : status === 401 ? denied() : json({ error: { code: "ACCOUNT_REQUEST_FAILED", message: "Unavailable.", requestId: "session-race" } }, 503);
    await act(async () => pending.resolve(response));
    expect(view.session.status).toBe("authenticated");
    expect(view.session.user.displayName).toBe("New Manager");
    expect(view.session.notice).toBeNull();
  });

  it("rejects an older session request without clearing a newer signed-in viewer", async () => {
    const pending = deferred();
    const fetchImpl = vi.fn((url, options) => new URL(url).pathname === "/api/v1/private" ? pending.promise : Promise.resolve(json(envelope(options.method === "POST" ? "new" : "first", options.method === "POST" ? "New Manager" : "First Manager"))));
    const view = fixture(fetchImpl); await screen.findByText("authenticated::First Manager");
    const request = view.session.httpClient.request("/api/v1/private", { authenticated: true }).catch(error => error);
    await act(() => view.session.signIn({ email: "new@example.test", password: "fixture-only" }));
    view.queryClient.setQueryData(["private"], { owner: "new-viewer" });
    await act(async () => pending.resolve(denied()));
    expect(await request).toMatchObject({ status: 401 });
    expect(view.session.user.displayName).toBe("New Manager");
    expect(view.queryClient.getQueryData(["private"])).toEqual({ owner: "new-viewer" });
  });

  it("still clears authentication and private data when the current session is rejected", async () => {
    const fetchImpl = vi.fn(url => Promise.resolve(new URL(url).pathname === "/api/v1/session" ? json(envelope()) : denied()));
    const view = fixture(fetchImpl); await screen.findByText("authenticated::First Manager");
    let error; await act(async () => { error = await view.session.httpClient.request("/api/v1/private", { authenticated: true }).catch(value => value); });
    expect(error).toMatchObject({ status: 401 });
    expect(view.session.status).toBe("unauthenticated");
    expect(view.session.notice).toBe("session-expired");
    expect(view.queryClient.getQueryData(["private"])).toBeUndefined();
  });

  it("allows an explicit bootstrap retry to refresh the current account", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(json(envelope())).mockResolvedValueOnce(json(envelope("first", "Updated Manager")));
    const view = fixture(fetchImpl); await screen.findByText("authenticated::First Manager");
    await act(() => view.session.retryBootstrap());
    await screen.findByText("authenticated::Updated Manager");
    expect(view.session.notice).toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
