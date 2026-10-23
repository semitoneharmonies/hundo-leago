import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render.jsx";
import { AccountSettingsPage } from "./AccountSettingsPage.jsx";

vi.mock("socket.io-client", () => ({ io: () => ({ onAny() {}, offAny() {}, disconnect() {} }) }));
const userId = "44444444-4444-4444-8444-444444444444";
const config = { appEnv: "local", apiOrigin: "http://localhost:4000", socketOrigin: "http://localhost:4000", buildId: null };
const response = (data, status = 200) => new Response(JSON.stringify(status === 200 ? { data, meta: { requestId: "settings-recovery" } } : { error: data }), { status, headers: { "Content-Type": "application/json" } });
function fixture({ patch } = {}) {
  let profile = { id: userId, email: "manager@example.test", displayName: "Original Manager", status: "active", version: 1 };
  const writes = [];
  const fetchImpl = vi.fn(async (url, options = {}) => {
    const pathname = new URL(url).pathname;
    if (pathname === "/api/v1/session") return response({ csrfToken: "D".repeat(43), user: profile, session: { id: "session-settings", userId, status: "active", createdAtMs: 1, lastUsedAtMs: 1, idleExpiresAtMs: 2, absoluteExpiresAtMs: 3, version: 1 } });
    if (pathname === "/api/v1/leagues") return response({ code: "LEAGUES_FOUND", leagues: [] });
    if (pathname === "/api/v1/account" && options.method === "PATCH") {
      const write = { body: JSON.parse(options.body), version: new Headers(options.headers).get("If-Match") }; writes.push(write);
      if (patch) return patch(write, () => profile, value => { profile = value; });
      profile = { ...profile, displayName: write.body.displayName, version: profile.version + 1 };
      return response({ code: "ACCOUNT_PROFILE_UPDATED", user: profile });
    }
    if (pathname === "/api/v1/account") return response({ code: "ACCOUNT_PROFILE_FOUND", user: profile });
    throw new Error("Unexpected settings request: " + pathname);
  });
  const view = renderWithProviders(<Routes><Route path="/account" element={<AccountSettingsPage />} /></Routes>, { initialEntries: ["/account"], enableSession: true, config, sessionOptions: { fetchImpl } });
  return { ...view, writes, setProfile: value => { profile = { ...profile, ...value }; } };
}

describe("display-name save recovery", () => {
  it("explains an unavailable name and preserves the manager's entry", async () => {
    const view = fixture({ patch: async () => response({ code: "ACCOUNT_DISPLAY_NAME_UNAVAILABLE", message: "That display name is unavailable.", requestId: "settings-unavailable" }, 409) });
    const field = await screen.findByLabelText("Display name");
    fireEvent.change(field, { target: { value: "Another Manager" } });
    fireEvent.submit(field.closest("form"));
    expect(await screen.findByText("That display name is unavailable.")).toBeInTheDocument();
    expect(screen.getByText("Choose another display name and save again.")).toBeInTheDocument();
    expect(field).toHaveValue("Another Manager");
    expect(view.writes).toHaveLength(1);
  });

  it("accepts all 50 Unicode characters without truncating a manager name", async () => {
    const view = fixture(); const field = await screen.findByLabelText("Display name");
    await view.user.clear(field); await view.user.type(field, "🙂".repeat(50));
    expect(field).toHaveValue("🙂".repeat(50));
    await view.user.click(screen.getByRole("button", { name: "Save display name" }));
    await waitFor(() => expect(view.writes).toHaveLength(1));
    expect(view.writes[0].body.displayName).toBe("🙂".repeat(50));
  });
  it.each([" ", "x".repeat(51)])("rejects an invalid name before making a profile write: %s", async value => {
    const view = fixture();const field = await screen.findByLabelText("Display name");
    fireEvent.change(field, { target: { value } });fireEvent.submit(field.closest("form"));
    await act(async () => {});expect(view.writes).toHaveLength(0);
    expect(field).toHaveAttribute("aria-invalid", "true");
  });
  it("prevents edits and a second submission while the profile save is pending", async () => {
    let release;const view = fixture({ patch: async (write, get, set) => { await new Promise(resolve => { release = resolve; });set({ ...get(), displayName: write.body.displayName, version: 2 });return response({ code: "ACCOUNT_PROFILE_UPDATED", user: get() }); } });
    const field = await screen.findByLabelText("Display name");fireEvent.change(field, { target: { value: "Saved Manager" } });fireEvent.submit(field.closest("form"));
    await waitFor(() => expect(view.writes).toHaveLength(1));expect(field).toBeDisabled();fireEvent.submit(field.closest("form"));await act(async () => {});expect(view.writes).toHaveLength(1);
    await act(async () => release());expect(await screen.findByText("Display name saved.")).toBeInTheDocument();expect(field).toHaveValue("Saved Manager");
  });
  it("refreshes a stale version while retaining the draft so a second save can succeed", async () => {
    const view = fixture({ patch: async (write, get, set) => {
      if (write.version !== '"2"') return response({ code: "ACCOUNT_PROFILE_PRECONDITION_FAILED", message: "The account profile changed; refresh it and try again.", requestId: "settings-stale" }, 412);
      set({ ...get(), displayName: write.body.displayName, version: 3 });return response({ code: "ACCOUNT_PROFILE_UPDATED", user: get() });
    } });
    const field = await screen.findByLabelText("Display name");fireEvent.change(field, { target: { value: "Unsaved Manager" } });view.setProfile({ displayName: "Other tab name", version: 2 });
    fireEvent.submit(field.closest("form"));await waitFor(() => expect(view.queryClient.getQueryData(["account", "profile"])?.version).toBe(2));expect(field).toHaveValue("Unsaved Manager");
    fireEvent.submit(field.closest("form"));expect(await screen.findByText("Display name saved.")).toBeInTheDocument();expect(view.writes.map(w => w.version)).toEqual(['"1"', '"2"']);expect(field).toHaveValue("Unsaved Manager");
  });
});
