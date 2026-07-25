import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../test/render.jsx";
import { consumeActionTokenFragment } from "./actionToken.js";
import {
  ReactivateAccountPage,
  ResetPasswordPage,
  SetupAccountPage,
  VerifyEmailPage,
} from "./AccountActionPages.jsx";

const token = "T".repeat(43);
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

function sessionData() {
  return {
    csrfToken: "C".repeat(43),
    session: {
      id: "session-verify",
      userId: "user-verify",
      status: "active",
      createdAtMs: 1,
      lastUsedAtMs: 2,
      idleExpiresAtMs: 3,
      absoluteExpiresAtMs: 4,
      version: 1,
    },
    user: {
      id: "user-verify",
      displayName: "Verified Manager",
      status: "active",
      version: 1,
    },
  };
}

function actionRoute(path, Page, fetchImpl) {
  return renderWithProviders(
    <Routes>
      <Route path={path} element={<Page />} />
    </Routes>,
    {
      initialEntries: [path],
      enableSession: true,
      initialActionToken: token,
      config,
      sessionOptions: { fetchImpl },
    }
  );
}

describe("action-token boundary", () => {
  it("removes a valid fragment before React receives the token", () => {
    history.replaceState({ retained: true }, "", `/verify-email#token=${token}`);

    expect(consumeActionTokenFragment()).toBe(token);
    expect(location.pathname).toBe("/verify-email");
    expect(location.hash).toBe("");
    expect(history.state).toEqual({ retained: true });
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("removes and rejects a malformed action fragment", () => {
    history.replaceState(null, "", "/reset-password#token=not-valid");
    expect(consumeActionTokenFragment()).toBeNull();
    expect(location.hash).toBe("");
  });
});

describe("account action pages", () => {
  it("verifies once and adopts the returned secure session", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(noSession())
      .mockResolvedValueOnce(
        jsonResponse({
          data: sessionData(),
          meta: { requestId: "request-verify" },
        })
      );
    actionRoute("/verify-email", VerifyEmailPage, fetchImpl);

    expect(
      await screen.findByText("Your email is verified and you are signed in.")
    ).toBeInTheDocument();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body)).toEqual({ token });
  });

  it("completes administrator credential setup and clears password controls", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(noSession())
      .mockResolvedValueOnce(
        jsonResponse({
          data: { signedOut: true, user: { id: "user-1" } },
          meta: { requestId: "request-setup" },
        })
      );
    const view = actionRoute("/setup-account", SetupAccountPage, fetchImpl);

    const passwordInputs = await screen.findAllByLabelText(/password/i, {
      selector: "input",
    });
    await view.user.type(passwordInputs[0], "new password");
    await view.user.type(passwordInputs[1], "new password");
    await view.user.click(screen.getByRole("button", { name: "Set password" }));

    expect(await screen.findByText("Your password is set. Sign in to continue.")).toBeInTheDocument();
    expect(screen.queryAllByLabelText(/password/i)).toHaveLength(0);
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body)).toEqual({
      token,
      password: "new password",
      passwordConfirmation: "new password",
    });
  });

  it("resets a password and requires sign-in", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(noSession())
      .mockResolvedValueOnce(
        jsonResponse({
          data: { reset: true, signedIn: false },
          meta: { requestId: "request-reset" },
        })
      );
    const view = actionRoute("/reset-password", ResetPasswordPage, fetchImpl);

    const passwordInputs = await screen.findAllByLabelText(/password/i, {
      selector: "input",
    });
    await view.user.type(passwordInputs[0], "reset password");
    await view.user.type(passwordInputs[1], "reset password");
    await view.user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(
      await screen.findByText("Your password was reset. Sign in with the new password.")
    ).toBeInTheDocument();
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body)).toEqual({
      token,
      newPassword: "reset password",
      newPasswordConfirmation: "reset password",
    });
  });

  it("reactivates without creating a session", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(noSession())
      .mockResolvedValueOnce(
        jsonResponse({
          data: { reactivated: true, signedIn: false },
          meta: { requestId: "request-reactivate" },
        })
      );
    const view = actionRoute("/reactivate", ReactivateAccountPage, fetchImpl);

    await view.user.type(await screen.findByLabelText("Current password"), "current password");
    await view.user.click(screen.getByRole("button", { name: "Reactivate account" }));

    expect(
      await screen.findByText("Your account is active. Sign in to continue.")
    ).toBeInTheDocument();
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body)).toEqual({
      token,
      currentPassword: "current password",
    });
  });
});
