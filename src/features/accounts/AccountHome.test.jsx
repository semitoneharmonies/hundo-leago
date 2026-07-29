import { useState } from "react";
import { screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../test/render.jsx";
import { useSession } from "../session/sessionContext.js";
import { AccountHome } from "./AccountHome.jsx";

const config = Object.freeze({
  appEnv: "local",
  apiOrigin: "http://localhost:4000",
  socketOrigin: "http://localhost:4000",
  buildId: null,
});

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function noSession() {
  return jsonResponse(
    {
      error: {
        code: "SESSION_REQUIRED",
        message: "A valid session is required.",
        requestId: "request-bootstrap",
      },
    },
    401
  );
}

const RESET_RECEIPT = Object.freeze({
  backupId: `backup-v1-${"a".repeat(64)}`,
  fixtureBuildId: "m7-10-release-qa",
  providerCatalogPlayerCount: 1_234,
  resetAtMs: Date.parse("2026-07-25T18:30:00.000Z"),
  sessionInvalidated: true,
  unsafeSessionEvidence: "do not retain this field",
});

function authenticatedReceiptSession() {
  return jsonResponse({
    data: {
      csrfToken: "S".repeat(43),
      session: {
        id: "receipt-session",
        userId: "receipt-administrator",
        status: "active",
        createdAtMs: 1,
        lastUsedAtMs: 2,
        idleExpiresAtMs: 3,
        absoluteExpiresAtMs: 4,
        version: 1,
      },
      user: {
        id: "receipt-administrator",
        displayName: "Receipt Administrator",
        status: "active",
        version: 1,
      },
    },
    meta: { requestId: "request-receipt-session" },
  });
}

function ResetReceiptHarness() {
  const session = useSession();
  const [showAccountHome, setShowAccountHome] = useState(true);
  if (session.status === "unknown") return <p>Checking receipt session</p>;
  if (session.status === "authenticated") {
    return (
      <button
        type="button"
        onClick={() =>
          session.clearAuthentication(
            "staging-fixture-reset",
            RESET_RECEIPT
          )
        }
      >
        Complete staging reset
      </button>
    );
  }
  return (
    <>
      <button
        type="button"
        onClick={() => setShowAccountHome((visible) => !visible)}
      >
        {showAccountHome ? "Leave Account home" : "Return to Account home"}
      </button>
      {showAccountHome ? <AccountHome /> : <p>Another public page</p>}
    </>
  );
}

describe("AccountHome", () => {
  it("keeps account forms hidden while session state is unknown", () => {
    const fetchImpl = vi.fn(() => new Promise(() => {}));
    renderWithProviders(<AccountHome />, {
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    });

    expect(screen.getByText("Checking secure session…")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
  });

  it("redirects an existing authenticated session to league selection", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        data: {
          csrfToken: "B".repeat(43),
          session: {
            id: "session-existing",
            userId: "user-existing",
            status: "active",
            createdAtMs: 1,
            lastUsedAtMs: 2,
            idleExpiresAtMs: 3,
            absoluteExpiresAtMs: 4,
            version: 1,
          },
          user: {
            id: "user-existing",
            displayName: "Existing Manager",
            status: "active",
            version: 1,
          },
        },
        meta: { requestId: "request-existing" },
      })
    );

    renderWithProviders(
      <Routes>
        <Route path="/" element={<AccountHome />} />
        <Route path="/leagues" element={<h1>League selection</h1>} />
      </Routes>,
      {
        enableSession: true,
        config,
        sessionOptions: { fetchImpl },
      }
    );

    expect(
      await screen.findByRole("heading", { name: "League selection" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Existing Manager")).toBeNull();
  });

  it("submits sign-in to the backend and clears a rejected password", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(noSession())
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: {
              code: "SIGN_IN_FAILED",
              message: "The email or password is incorrect, or the account cannot sign in.",
              requestId: "request-sign-in",
            },
          },
          401
        )
      );
    const view = renderWithProviders(<AccountHome />, {
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    });

    const signIn = (await screen.findByRole("heading", { name: "Sign in" })).closest(
      "form"
    );
    await view.user.type(within(signIn).getByLabelText("Email address"), "user@example.test");
    const password = within(signIn).getByLabelText("Password");
    await view.user.type(password, "incorrect");
    await view.user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "email or password is incorrect"
    );
    expect(password).toHaveValue("");
    const [url, request] = fetchImpl.mock.calls[1];
    expect(url).toBe("http://localhost:4000/api/v1/session");
    expect(JSON.parse(request.body)).toEqual({
      email: "user@example.test",
      password: "incorrect",
    });
  });

  it("creates an account with one secure intent key and clears both passwords", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(noSession())
      .mockResolvedValueOnce(
        jsonResponse(
          {
            data: { accepted: true },
            meta: { requestId: "request-sign-up" },
          },
          202
        )
      );
    const randomUUID = vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValue("11111111-1111-4111-8111-111111111111");
    const view = renderWithProviders(<AccountHome />, {
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    });

    await screen.findByRole("heading", { name: "Create an account" });
    const signUp = screen.getByRole("heading", { name: "Create an account" }).closest("form");
    await view.user.type(signUp.querySelector("input[type='email']"), "new@example.test");
    await view.user.type(signUp.querySelector("input[type='text']"), "New Manager");
    const passwords = signUp.querySelectorAll("input[type='password']");
    await view.user.type(passwords[0], "password value");
    await view.user.type(passwords[1], "password value");
    await view.user.keyboard("{Enter}");

    expect(await screen.findByText(/check that email/i)).toBeInTheDocument();
    expect(passwords[0]).toHaveValue("");
    expect(passwords[1]).toHaveValue("");
    expect(fetchImpl.mock.calls[1][1].headers.get("Idempotency-Key")).toBe(
      "account-signup:11111111-1111-4111-8111-111111111111"
    );
    expect(localStorage.length).toBe(0);
    randomUUID.mockRestore();
  });

  it("uses the same generic result for a password-reset request", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(noSession())
      .mockResolvedValueOnce(
        jsonResponse(
          {
            data: { accepted: true },
            meta: { requestId: "request-reset" },
          },
          202
        )
      );
    const view = renderWithProviders(<AccountHome />, {
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    });

    await view.user.click(
      await screen.findByRole("button", { name: "Reset a password" })
    );
    await view.user.type(screen.getByLabelText("Verified email address"), "any@example.test");
    await view.user.click(screen.getByRole("button", { name: "Send instructions" }));

    expect(await screen.findByText(/without confirming whether an account exists/i)).toBeInTheDocument();
    expect(
      fetchImpl.mock.calls[1][0].endsWith("/api/v1/password-reset-requests")
    ).toBe(true);
  });

  it("lets a pending account request a replacement verification email", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(noSession())
      .mockResolvedValueOnce(
        jsonResponse(
          {
            data: { accepted: true },
            meta: { requestId: "request-verification-resend" },
          },
          202
        )
      );
    const view = renderWithProviders(<AccountHome />, {
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    });

    await view.user.click(
      await screen.findByRole("button", {
        name: "Resend a verification email",
      })
    );
    await view.user.type(
      screen.getByLabelText("Email address used to sign up"),
      "pending@example.test"
    );
    await view.user.click(
      screen.getByRole("button", { name: "Send instructions" })
    );

    expect(
      await screen.findByText(
        /without confirming whether an account exists/i
      )
    ).toBeInTheDocument();
    expect(fetchImpl.mock.calls[1][0]).toBe(
      "http://localhost:4000/api/v1/accounts/email-verification-requests"
    );
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body)).toEqual({
      email: "pending@example.test",
    });
  });

  it("navigates a successful sign-in to league selection", async () => {
    const sessionData = {
      csrfToken: "B".repeat(43),
      session: {
        id: "session-2",
        userId: "user-2",
        status: "active",
        createdAtMs: 1,
        lastUsedAtMs: 2,
        idleExpiresAtMs: 3,
        absoluteExpiresAtMs: 4,
        version: 1,
      },
      user: {
        id: "user-2",
        displayName: "League Manager",
        status: "active",
        version: 1,
      },
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(noSession())
      .mockResolvedValueOnce(
        jsonResponse({
          data: sessionData,
          meta: { requestId: "request-success" },
        })
      );
    const view = renderWithProviders(
      <Routes>
        <Route path="/" element={<AccountHome />} />
        <Route path="/leagues" element={<h1>League selection</h1>} />
      </Routes>,
      {
        enableSession: true,
        config,
        sessionOptions: { fetchImpl },
      }
    );

    const signIn = (await screen.findByRole("heading", { name: "Sign in" })).closest(
      "form"
    );
    const email = within(signIn).getByLabelText("Email address");
    const password = within(signIn).getByLabelText("Password");
    await view.user.type(email, "manager@example.test");
    await view.user.type(
      password,
      "correct password"
    );
    await view.user.keyboard("{Enter}");

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "League selection" })
      ).toBeInTheDocument()
    );
    expect(email).toHaveValue("");
    expect(password).toHaveValue("");
  });

  it("shows a sanitized staging reset receipt once without retaining authenticated state", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(authenticatedReceiptSession());
    const view = renderWithProviders(<ResetReceiptHarness />, {
      enableSession: true,
      config: {
        ...config,
        appEnv: "staging",
        buildId: "staging-receipt-build",
      },
      sessionOptions: { fetchImpl },
    });

    await view.user.click(
      await screen.findByRole("button", {
        name: "Complete staging reset",
      })
    );
    const receipt = (
      await screen.findByRole("heading", {
        name: "Staging reset completed",
      })
    ).closest("section");
    expect(receipt).toHaveTextContent(RESET_RECEIPT.backupId);
    expect(receipt).toHaveTextContent(RESET_RECEIPT.fixtureBuildId);
    expect(receipt).toHaveTextContent("1,234");
    expect(receipt).toHaveTextContent("Sessions invalidated");
    expect(receipt).not.toHaveTextContent("do not retain this field");
    expect(screen.queryByText("Receipt Administrator")).not.toBeInTheDocument();
    expect(screen.queryByText("receipt-session")).not.toBeInTheDocument();

    await view.user.click(
      screen.getByRole("button", { name: "Leave Account home" })
    );
    expect(
      screen.queryByRole("heading", {
        name: "Staging reset completed",
      })
    ).not.toBeInTheDocument();
    await view.user.click(
      screen.getByRole("button", { name: "Return to Account home" })
    );
    expect(
      screen.queryByRole("heading", {
        name: "Staging reset completed",
      })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Sign in" })
    ).toBeInTheDocument();
  });

  it("does not preserve a staging reset receipt outside staging", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(authenticatedReceiptSession());
    const view = renderWithProviders(<ResetReceiptHarness />, {
      enableSession: true,
      config,
      sessionOptions: { fetchImpl },
    });

    await view.user.click(
      await screen.findByRole("button", {
        name: "Complete staging reset",
      })
    );
    expect(
      await screen.findByRole("heading", { name: "Sign in" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Staging reset completed",
      })
    ).not.toBeInTheDocument();
  });
});
