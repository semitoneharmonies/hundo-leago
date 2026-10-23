import { act, fireEvent, screen, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/render.jsx";
import { AccountHome } from "./AccountHome.jsx";
import { ResetPasswordPage, SetupAccountPage } from "./AccountActionPages.jsx";

const config = { appEnv: "local", apiOrigin: "http://localhost:4000", socketOrigin: "http://localhost:4000", buildId: null };
function fixture(kind) {
  const writes = [];
  const fetchImpl = vi.fn(async (url, options = {}) => {
    if (new URL(url).pathname === "/api/v1/session") return new Response(JSON.stringify({ error: { code: "SESSION_REQUIRED", message: "Sign in required.", requestId: "password-inputs" } }), { status: 401, headers: { "Content-Type": "application/json" } });
    writes.push(JSON.parse(options.body));
    return new Response(JSON.stringify({ data: { accepted: true, reset: true, credentialsSet: true }, meta: { requestId: "password-inputs" } }), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  const Page = kind === "signup" ? AccountHome : kind === "setup" ? SetupAccountPage : ResetPasswordPage;
  const view = renderWithProviders(<Routes><Route path="/" element={<Page />} /></Routes>, { initialEntries: ["/"], enableSession: true, initialActionToken: kind === "signup" ? null : "T".repeat(43), config, sessionOptions: { fetchImpl } });
  return { ...view, writes };
}
async function fields(view, kind) {
  const form = kind === "signup" ? await screen.findByRole("form", { name: "Create an account" }) : (await screen.findByLabelText("New password")).closest("form");
  if (kind === "signup") {
    fireEvent.change(within(form).getByLabelText("Email address"), { target: { value: "new@example.test" } });
    fireEvent.change(within(form).getByLabelText("Display name"), { target: { value: "New Manager" } });
  }
  return { form, password: within(form).getByLabelText(kind === "signup" ? "Password" : "New password", { exact: true }), confirmation: within(form).getByLabelText("Confirm password", { exact: true }) };
}
describe.each(["signup", "setup", "reset"])("%s password boundaries", kind => {
  it("preserves a pasted 256-code-point Unicode password and submits its exact value", async () => {
    const view = fixture(kind), inputs = await fields(view, kind), value = "🙂".repeat(256);
    for (const input of [inputs.password, inputs.confirmation]) { await view.user.click(input);await view.user.paste(value);expect(input).toHaveValue(value); }
    fireEvent.submit(inputs.form);await act(async () => {});expect(view.writes).toHaveLength(1);
    expect(view.writes[0][kind === "reset" ? "newPassword" : "password"]).toBe(value);
  });
  it.each([
    ["three Unicode characters", "🙂🙂🙂", "🙂🙂🙂", "Use a password between 6 and 256 characters."],
    ["257 ASCII characters", "a".repeat(257), "a".repeat(257), "Use a password between 6 and 256 characters."],
    ["mismatched confirmation", "allowed", "different", "The password confirmation does not match."],
  ])("blocks %s before sending a request", async (_name, password, confirmation, message) => {
    const view = fixture(kind), inputs = await fields(view, kind);
    fireEvent.change(inputs.password, { target: { value: password } });fireEvent.change(inputs.confirmation, { target: { value: confirmation } });fireEvent.submit(inputs.form);
    expect(await screen.findByRole("alert")).toHaveTextContent(message);expect(view.writes).toHaveLength(0);
  });
});
