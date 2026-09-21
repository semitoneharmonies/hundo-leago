import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("socket.io-client", () => ({ io: () => ({ onAny() {}, offAny() {}, disconnect() {} }) }));
import { renderWithProviders } from "../../test/render.jsx";
import { useSession } from "../session/sessionContext.js";
import { AccountDeactivationPanel } from "./AccountDeactivationPanel.jsx";

const config = { appEnv: "local", apiOrigin: "http://localhost:4000", socketOrigin: "http://localhost:4000", buildId: null };
function envelope(data, status = 200) {
  return new Response(JSON.stringify({ data, meta: { requestId: "deactivation-test" } }), { status, headers: { "Content-Type": "application/json" } });
}
function Harness() {
  const session = useSession();
  return <><output data-testid="session-status">{session.status}:{session.notice}</output><AccountDeactivationPanel /></>;
}
async function setup(respond = () => envelope({ deactivated: true, signedOut: true })) {
  const writes = [];
  const fetchImpl = vi.fn(async (url, options = {}) => {
    if (new URL(url).pathname === "/api/v1/session") return envelope({
      csrfToken: "D".repeat(43),
      session: { id: "session-one", userId: "user-one", status: "active", createdAtMs: 1, lastUsedAtMs: 1, idleExpiresAtMs: 2, absoluteExpiresAtMs: 3, version: 1 },
      user: { id: "user-one", displayName: "Manager", status: "active", version: 1 },
    });
    if (new URL(url).pathname === "/api/v1/account/deactivation") {
      writes.push({ body: JSON.parse(options.body), csrf: new Headers(options.headers).get("X-CSRF-Token") });
      return respond();
    }
    throw new Error("Unexpected test request");
  });
  const view = renderWithProviders(<Harness />, { config, enableSession: true, sessionOptions: { fetchImpl } });
  const form = await screen.findByRole("form", { name: "Deactivate account" });
  return { ...view, writes, form, password: within(form).getByLabelText("Current password"), button: within(form).getByRole("button") };
}
afterEach(() => vi.restoreAllMocks());

describe("self-deactivation", () => {
  it("requires the current password and explains preserved history, reassignment and reactivation", async () => {
    const view = await setup();
    expect(view.button).toBeDisabled();
    expect(screen.getByText(/Your history is kept/)).toBeInTheDocument();
    expect(screen.getByText(/request a reactivation link/)).toBeInTheDocument();
    expect(view.writes).toHaveLength(0);
  });

  it("cancelling confirmation clears the password and makes no request", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const view = await setup();
    await view.user.type(view.password, "test password");
    await view.user.click(view.button);
    expect(view.password).toHaveValue(""); expect(view.writes).toHaveLength(0);
    expect(screen.getByTestId("session-status")).toHaveTextContent("authenticated");
  });

  it("submits the confirmed session-scoped action with CSRF and clears private state only after acknowledgement", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const view = await setup();
    const key = ["private-test"];
    view.queryClient.setQueryDefaults(key, { meta: { private: true } });
    view.queryClient.setQueryData(key, { secret: "private account data" });
    await view.user.type(view.password, "test password");
    await view.user.click(view.button);
    await waitFor(() => expect(screen.getByTestId("session-status")).toHaveTextContent("unauthenticated:account-deactivated"));
    expect(view.writes).toEqual([{ body: { currentPassword: "test password", confirmation: "DEACTIVATE" }, csrf: "D".repeat(43) }]);
    expect(view.queryClient.getQueryData(key)).toBeUndefined();
  });

  it("a rejected current password leaves the account signed in and clears the input", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const view = await setup(() => new Response(JSON.stringify({ error: { code: "ACCOUNT_DEACTIVATION_DENIED", message: "The current password was not accepted.", requestId: "denied" } }), { status: 403, headers: { "Content-Type": "application/json" } }));
    await view.user.type(view.password, "incorrect password"); await view.user.click(view.button);
    expect(await screen.findByRole("alert")).toHaveTextContent("current password was not accepted");
    expect(view.password).toHaveValue(""); expect(screen.getByTestId("session-status")).toHaveTextContent("authenticated");
  });

  it("keeps a pending action single while clearing the password immediately", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    let resolve;
    const pending = new Promise(done => { resolve = done; });
    const view = await setup(() => pending);
    await view.user.type(view.password, "test password"); await view.user.click(view.button);
    await waitFor(() => expect(view.writes).toHaveLength(1));
    expect(view.password).toHaveValue(""); expect(view.button).toBeDisabled();
    await view.user.click(view.button); expect(view.writes).toHaveLength(1);
    resolve(envelope({ deactivated: true, signedOut: true }));
    await waitFor(() => expect(screen.getByTestId("session-status")).toHaveTextContent("unauthenticated"));
  });

  it("does not claim success when the response omits the deactivation acknowledgement", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const view = await setup(() => envelope({ signedOut: true }));
    await view.user.type(view.password, "test password"); await view.user.click(view.button);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByTestId("session-status")).toHaveTextContent("authenticated");
    expect(view.password).toHaveValue("");
  });
});
