import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import { useSession } from "../session/sessionContext.js";
import {
  completeCredentialSetup,
  reactivateAccount,
  resetPassword,
  verifyEmail,
} from "./accountApi.js";
import { useActionToken } from "./actionTokenContext.js";

function safeMessage(error, fallback) {
  return error?.name === "ApiError" ? error.message : fallback;
}

function ActionPanel({ children, title }) {
  return (
    <main className="hl-page hl-page--narrow" aria-labelledby="account-action-title">
      <section className="hl-surface hl-account-action">
        <p className="hl-eyebrow">Secure account action</p>
        <h1 id="account-action-title">{title}</h1>
        {children}
      </section>
    </main>
  );
}

function InvalidActionLink({ title }) {
  return (
    <ActionPanel title={title}>
      <p role="alert">This account link is invalid or incomplete.</p>
      <Link to={routePaths.home}>Return to account access</Link>
    </ActionPanel>
  );
}

function PasswordFields({
  confirmation,
  confirmationLabel = "Confirm password",
  password,
  passwordLabel = "New password",
  setConfirmation,
  setPassword,
}) {
  return (
    <>
      <label className="hl-field">
        {passwordLabel}
        <input
          type="password"
          autoComplete="new-password"
          minLength={6}
          maxLength={256}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <label className="hl-field">
        {confirmationLabel}
        <input
          type="password"
          autoComplete="new-password"
          minLength={6}
          maxLength={256}
          required
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
        />
      </label>
    </>
  );
}

function usePasswordPair() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  return {
    password,
    confirmation,
    setPassword,
    setConfirmation,
    clear() {
      setPassword("");
      setConfirmation("");
    },
  };
}

function PasswordActionPage({ kind }) {
  const session = useSession();
  const actionToken = useActionToken();
  const passwords = usePasswordPair();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const setup = kind === "setup";

  if (!actionToken.token && !complete) {
    return <InvalidActionLink title={setup ? "Set up your account" : "Reset password"} />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (passwords.password !== passwords.confirmation) {
      setError("The password confirmation does not match.");
      return;
    }
    setPending(true);
    try {
      if (setup) {
        await completeCredentialSetup(session.httpClient, {
          token: actionToken.token,
          password: passwords.password,
          passwordConfirmation: passwords.confirmation,
        });
      } else {
        await resetPassword(session.httpClient, {
          token: actionToken.token,
          newPassword: passwords.password,
          newPasswordConfirmation: passwords.confirmation,
        });
        await session.clearAuthentication("credentials-changed");
      }
      passwords.clear();
      actionToken.clear();
      setComplete(true);
    } catch (requestError) {
      passwords.clear();
      setError(safeMessage(requestError, "The account action could not be completed."));
    } finally {
      setPending(false);
    }
  }

  return (
    <ActionPanel title={setup ? "Set up your account" : "Reset password"}>
      {complete ? (
        <>
          <p role="status">
            {setup
              ? "Your password is set. Sign in to continue."
              : "Your password was reset. Sign in with the new password."}
          </p>
          <Link to={routePaths.home}>Continue to sign in</Link>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <PasswordFields
            password={passwords.password}
            confirmation={passwords.confirmation}
            setPassword={passwords.setPassword}
            setConfirmation={passwords.setConfirmation}
          />
          {error && <p role="alert">{error}</p>}
          <button className="hl-button hl-button--primary" type="submit" disabled={pending}>
            {pending
              ? "Please wait…"
              : setup
                ? "Set password"
                : "Reset password"}
          </button>
        </form>
      )}
    </ActionPanel>
  );
}

export function VerifyEmailPage() {
  const session = useSession();
  const actionToken = useActionToken();
  const submittedRef = useRef(false);
  const [outcome, setOutcome] = useState({ status: "pending", message: "" });

  useEffect(() => {
    if (
      session.status === "unknown" ||
      !actionToken.token ||
      submittedRef.current
    ) {
      return;
    }
    submittedRef.current = true;
    verifyEmail(session.httpClient, actionToken.token)
      .then((data) => {
        session.adoptSession(data);
        actionToken.clear();
        setOutcome({
          status: "complete",
          message: "Your email is verified and you are signed in.",
        });
      })
      .catch((error) => {
        setOutcome({
          status: "error",
          message: safeMessage(error, "Email verification could not be completed."),
        });
      });
  }, [actionToken, session]);

  if (!actionToken.token && outcome.status !== "complete") {
    return <InvalidActionLink title="Verify email" />;
  }

  return (
    <ActionPanel title="Verify email">
      {session.status === "unknown" || outcome.status === "pending" ? (
        <p role="status">Verifying your secure link…</p>
      ) : outcome.status === "complete" ? (
        <>
          <p role="status">{outcome.message}</p>
          <Link to={routePaths.leagues}>Continue to your leagues</Link>
        </>
      ) : (
        <>
          <p role="alert">{outcome.message}</p>
          <Link to={routePaths.home}>Return to account access</Link>
        </>
      )}
    </ActionPanel>
  );
}

export function SetupAccountPage() {
  return <PasswordActionPage kind="setup" />;
}

export function ResetPasswordPage() {
  return <PasswordActionPage kind="reset" />;
}

export function ReactivateAccountPage() {
  const session = useSession();
  const actionToken = useActionToken();
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  if (!actionToken.token && !complete) {
    return <InvalidActionLink title="Reactivate account" />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await reactivateAccount(session.httpClient, {
        token: actionToken.token,
        currentPassword: password,
      });
      setPassword("");
      actionToken.clear();
      await session.clearAuthentication("account-reactivated");
      setComplete(true);
    } catch (requestError) {
      setPassword("");
      setError(safeMessage(requestError, "Account reactivation could not be completed."));
    } finally {
      setPending(false);
    }
  }

  return (
    <ActionPanel title="Reactivate account">
      {complete ? (
        <>
          <p role="status">Your account is active. Sign in to continue.</p>
          <Link to={routePaths.home}>Continue to sign in</Link>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <label className="hl-field">
            Current password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <button className="hl-button hl-button--primary" type="submit" disabled={pending}>
            {pending ? "Please wait…" : "Reactivate account"}
          </button>
        </form>
      )}
    </ActionPanel>
  );
}
