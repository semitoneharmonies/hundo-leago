import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render.jsx";
import { AccountHome } from "./AccountHome.jsx";
import { AccountSettingsPage } from "./AccountSettingsPage.jsx";

vi.mock("socket.io-client", () => ({ io: () => ({ onAny() {}, offAny() {}, disconnect() {} }) }));
const config = { appEnv: "local", apiOrigin: "http://localhost:4000", socketOrigin: "http://localhost:4000", buildId: null };
const userId = "44444444-4444-4444-8444-444444444444";
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const success = data => json({ data, meta: { requestId: "password-feedback" } });
const rejection = (code, status) => json({ error: { code, message: "Internal diagnostic must not appear in the form.", requestId: "password-feedback" } }, status);
const changed = { changed: true, signedOut: true, code: "PASSWORD_CHANGED_SIGN_IN_REQUIRED" };
async function fixture(result) {
  const writes = [];
  const user = { id: userId, email: "manager@example.test", displayName: "Password Manager", status: "active", version: 1 };
  const fetchImpl = vi.fn(async (url, options = {}) => {
    const pathname = new URL(url).pathname;
    if (pathname === "/api/v1/session") return success({ csrfToken: "F".repeat(43), user, session: { id: "password-session", userId, status: "active", version: 1, createdAtMs: 1, lastUsedAtMs: 1, idleExpiresAtMs: 2, absoluteExpiresAtMs: 3 } });
    if (pathname === "/api/v1/account") return success({ code: "ACCOUNT_PROFILE_FOUND", user });
    if (pathname === "/api/v1/leagues") return success({ code: "LEAGUES_FOUND", leagues: [] });
    if (pathname === "/api/v1/session/password") { writes.push(JSON.parse(options.body)); return result(); }
    throw new Error("Unexpected request: " + pathname);
  });
  renderWithProviders(<Routes><Route path="/account" element={<AccountSettingsPage />} /><Route path="/" element={<AccountHome />} /></Routes>, { initialEntries: ["/account"], enableSession: true, config, sessionOptions: { fetchImpl } });
  const form = (await screen.findByRole("button", { name: "Change password", exact: true })).closest("form");
  const fields = { current: within(form).getByLabelText("Current password"), password: within(form).getByLabelText("New password", { exact: true }), confirmation: within(form).getByLabelText("Confirm new password") };
  for (const [name, field] of Object.entries(fields)) fireEvent.change(field, { target: { value: name === "current" ? "current fixture password" : "new fixture password" } });
  return { form, fields, writes };
}

describe("password-change feedback and acknowledgement", () => {
  it.each([
    ["PASSWORD_CHANGE_DENIED", 403, "The current password was not accepted.", "Check your current password and try again."],
    ["PASSWORD_CHANGE_INVALID", 422, "The new password could not be used.", "Use a different password between 6 and 256 characters and enter it twice."],
    ["RATE_LIMITED", 429, "Password changes are temporarily limited.", "Wait and try again later."],
  ])("explains %s without exposing internal diagnostics", async (code, status, message, recovery) => {
    const view = await fixture(() => rejection(code, status)); fireEvent.submit(view.form);
    expect(await screen.findByText(message)).toBeInTheDocument(); expect(screen.getByText(recovery)).toBeInTheDocument();
    expect(screen.queryByText(/Internal diagnostic/)).not.toBeInTheDocument(); expect(screen.getByText("Your password was not changed.")).toBeInTheDocument();
    expect(view.fields.password).toHaveValue("new fixture password"); expect(view.writes).toHaveLength(1);
  });

  it("explains a lost response without claiming the password stayed unchanged", async () => {
    const view = await fixture(() => { throw new Error("Internal transport failure"); }); fireEvent.submit(view.form);
    expect(await screen.findByText("We could not confirm your password change.")).toBeInTheDocument();
    expect(screen.getByText("Try signing in with the new password. If you cannot sign in, use password recovery.")).toBeInTheDocument();
    expect(screen.queryByText("Your password was not changed.")).not.toBeInTheDocument();
    expect(screen.queryByText(/Internal transport/)).not.toBeInTheDocument(); expect(view.writes).toHaveLength(1);
  });

  it.each([
    { changed: true },
    { ...changed, changed: false },
    { ...changed, signedOut: false },
    { ...changed, code: "UNKNOWN_OUTCOME" },
  ])("does not invent success from an incomplete or contradictory acknowledgement: %j", async data => {
    const view = await fixture(() => success(data)); fireEvent.submit(view.form);
    expect(await screen.findByText("We could not confirm your password change.")).toBeInTheDocument();
    expect(screen.queryByText("Your password was changed. Sign in with the new password.")).not.toBeInTheDocument();
    expect(view.writes).toHaveLength(1);
  });

  it("clears a prior rejection when the next submission has a client validation error", async () => {
    const view = await fixture(() => rejection("PASSWORD_CHANGE_DENIED", 403)); fireEvent.submit(view.form);
    await screen.findByText("The current password was not accepted.");
    fireEvent.change(view.fields.password, { target: { value: "abc" } }); fireEvent.change(view.fields.confirmation, { target: { value: "abc" } }); fireEvent.submit(view.form);
    expect(await screen.findByRole("alert")).toHaveTextContent("Use a password between 6 and 256 characters.");
    expect(screen.queryByText("The current password was not accepted.")).not.toBeInTheDocument(); expect(view.writes).toHaveLength(1);
  });

  it("does not treat an empty 204 response as a confirmed password change", async () => {
    const view = await fixture(() => new Response(null, { status: 204 }));
    fireEvent.submit(view.form);
    expect(await screen.findByText("We could not confirm your password change.")).toBeInTheDocument();
    expect(screen.queryByText("Your password was changed. Sign in with the new password.")).not.toBeInTheDocument();
    expect(view.writes).toHaveLength(1);
  });

  it("requires one confirmed success before clearing the form and showing sign-in guidance", async () => {
    let release; const pending = new Promise(r => { release = r; }); const view = await fixture(() => pending); fireEvent.submit(view.form);
    await waitFor(() => expect(view.writes).toHaveLength(1)); for (const field of Object.values(view.fields)) expect(field).toBeDisabled(); fireEvent.submit(view.form); expect(view.writes).toHaveLength(1);
    await act(async () => release(success(changed)));
    expect(await screen.findByText("Your password was changed. Sign in with the new password.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sign in", exact: true })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Account and team settings" })).not.toBeInTheDocument();
  });
});
