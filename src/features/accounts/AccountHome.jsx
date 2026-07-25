import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Navigate, useNavigate } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import { useSession } from "../session/sessionContext.js";
import {
  createIntentKey,
  registerAccount,
  requestAccountReactivation,
  requestPasswordReset,
} from "./accountApi.js";

function safeMessage(error, fallback) {
  return error?.name === "ApiError" ? error.message : fallback;
}

function PendingButton({ children, pending }) {
  return (
    <button
      className="hl-button hl-button--primary"
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}

function StagingResetReceipt({ receipt }) {
  return (
    <section
      className="hl-surface hl-route-state"
      aria-labelledby="staging-reset-receipt-title"
      role="status"
    >
      <p className="hl-eyebrow">Verified staging evidence</p>
      <h2 id="staging-reset-receipt-title">Staging reset completed</h2>
      <p>
        The deterministic fixture was rebuilt, its provider catalog was
        preserved, and every prior staging session was invalidated.
      </p>
      <dl>
        <div>
          <dt>Verified backup ID</dt>
          <dd>{receipt.backupId}</dd>
        </div>
        <div>
          <dt>Fixture build</dt>
          <dd>{receipt.fixtureBuildId}</dd>
        </div>
        <div>
          <dt>Reset completed</dt>
          <dd>
            <time dateTime={new Date(receipt.resetAtMs).toISOString()}>
              {new Date(receipt.resetAtMs).toLocaleString("en-CA", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "America/Vancouver",
              })}
            </time>
          </dd>
        </div>
        <div>
          <dt>Provider catalog players</dt>
          <dd>
            {new Intl.NumberFormat("en-CA").format(
              receipt.providerCatalogPlayerCount
            )}
          </dd>
        </div>
        <div>
          <dt>Sessions invalidated</dt>
          <dd>{receipt.sessionInvalidated ? "Yes" : "No"}</dd>
        </div>
      </dl>
      <p>Sign in again to continue testing the rebuilt fixture.</p>
    </section>
  );
}

function SignInForm({ session }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    const credentials = { email, password };
    flushSync(() => {
      setEmail("");
      setPassword("");
    });
    try {
      await session.signIn(credentials);
      navigate(routePaths.leagues, { replace: true });
    } catch (requestError) {
      setEmail(credentials.email);
      setError(safeMessage(requestError, "Sign in could not be completed."));
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="hl-surface hl-auth-card"
      onSubmit={handleSubmit}
      aria-labelledby="sign-in-title"
    >
      <p className="hl-eyebrow">Welcome back</p>
      <h2 id="sign-in-title">
        Sign in
      </h2>
      <label className="hl-field">
        Email address
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="hl-field">
        Password
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          aria-describedby={error ? "sign-in-error" : undefined}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error && (
        <p className="hl-form-message is-error" id="sign-in-error" role="alert">
          {error}
        </p>
      )}
      <PendingButton pending={pending}>Sign in</PendingButton>
    </form>
  );
}

function SignUpForm({ httpClient }) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const intentKeyRef = useRef(null);

  function edit(setter) {
    return (event) => {
      intentKeyRef.current = null;
      setter(event.target.value);
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const length = Array.from(password).length;
    if (length < 6 || length > 256) {
      setError("Use a password between 6 and 256 characters.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("The password confirmation does not match.");
      return;
    }

    setPending(true);
    try {
      intentKeyRef.current ||= createIntentKey("account-signup");
      await registerAccount(
        httpClient,
        { email, displayName, password, passwordConfirmation },
        intentKeyRef.current
      );
      setPassword("");
      setPasswordConfirmation("");
      intentKeyRef.current = null;
      setSuccess(
        "If the account request was accepted, check that email for a verification link."
      );
    } catch (requestError) {
      setPassword("");
      setPasswordConfirmation("");
      setError(
        safeMessage(requestError, "The account request could not be completed.")
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="hl-surface hl-auth-card"
      onSubmit={handleSubmit}
      aria-labelledby="sign-up-title"
    >
      <p className="hl-eyebrow">New manager</p>
      <h2 id="sign-up-title">
        Create an account
      </h2>
      <label className="hl-field">
        Email address
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={edit(setEmail)}
        />
      </label>
      <label className="hl-field">
        Display name
        <input
          type="text"
          autoComplete="nickname"
          required
          value={displayName}
          onChange={edit(setDisplayName)}
        />
      </label>
      <label className="hl-field">
        Password
        <input
          type="password"
          autoComplete="new-password"
          minLength={6}
          maxLength={256}
          required
          value={password}
          onChange={edit(setPassword)}
        />
      </label>
      <label className="hl-field">
        Confirm password
        <input
          type="password"
          autoComplete="new-password"
          minLength={6}
          maxLength={256}
          required
          value={passwordConfirmation}
          aria-describedby={error ? "sign-up-error" : undefined}
          onChange={edit(setPasswordConfirmation)}
        />
      </label>
      {error && (
        <p className="hl-form-message is-error" id="sign-up-error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="hl-form-message is-success" role="status">
          {success}
        </p>
      )}
      <PendingButton pending={pending}>Create account</PendingButton>
    </form>
  );
}

function RecoveryRequest({ httpClient }) {
  const [mode, setMode] = useState(null);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setError("");
    try {
      if (mode === "reset") await requestPasswordReset(httpClient, email);
      else await requestAccountReactivation(httpClient, email);
      setMessage(
        "If that email is eligible, instructions will be sent without confirming whether an account exists."
      );
    } catch (requestError) {
      setError(safeMessage(requestError, "The request could not be completed."));
    } finally {
      setPending(false);
    }
  }

  if (!mode) {
    return (
      <div className="hl-button-row">
        <button
          className="hl-button hl-button--quiet"
          type="button"
          onClick={() => setMode("reset")}
        >
          Reset a password
        </button>
        <button
          className="hl-button hl-button--quiet"
          type="button"
          onClick={() => setMode("reactivate")}
        >
          Reactivate an account
        </button>
      </div>
    );
  }

  return (
    <form className="hl-surface hl-recovery-card" onSubmit={handleSubmit}>
      <h3>{mode === "reset" ? "Request a reset link" : "Request a reactivation link"}</h3>
      <label className="hl-field">
        Verified email address
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      {error && <p className="hl-form-message is-error" role="alert">{error}</p>}
      {message && <p className="hl-form-message is-success" role="status">{message}</p>}
      <div className="hl-button-row">
        <PendingButton pending={pending}>Send instructions</PendingButton>
        <button className="hl-button hl-button--quiet" type="button" onClick={() => setMode(null)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function AccountHome() {
  const session = useSession();
  const consumeStagingResetReceipt = session.consumeStagingResetReceipt;
  const [stagingResetReceipt] = useState(() =>
    session.appEnv === "staging" &&
    session.notice === "staging-fixture-reset"
      ? session.stagingResetReceipt
      : null
  );

  useEffect(() => {
    if (stagingResetReceipt) consumeStagingResetReceipt();
  }, [consumeStagingResetReceipt, stagingResetReceipt]);

  if (session.status === "unknown") {
    return (
      <main className="hl-page hl-page--narrow" aria-live="polite">
        <section id="account-access" className="hl-surface hl-route-state">
        {session.bootstrapError ? (
          <>
            <h2>Secure account service unavailable</h2>
            <p>No private account information is being shown.</p>
            <button className="hl-button hl-button--primary" type="button" onClick={session.retryBootstrap}>
              Try again
            </button>
          </>
        ) : (
          <p role="status">Checking secure session…</p>
        )}
        </section>
      </main>
    );
  }

  if (session.status === "authenticated") {
    return <Navigate to={routePaths.leagues} replace />;
  }

  return (
    <main
      id="account-access"
      className="hl-page hl-page--wide hl-account-page"
      aria-labelledby="accounts-title"
    >
      <header className="hl-account-intro">
        <span className="hl-account-intro__mark" aria-hidden="true">HL</span>
        <p className="hl-eyebrow">Private fantasy hockey</p>
        <h1 id="accounts-title">Hundo Leago</h1>
        <p>Sign in to your league, or create a manager account.</p>
      </header>
      {stagingResetReceipt && (
        <StagingResetReceipt receipt={stagingResetReceipt} />
      )}
      {session.notice === "session-expired" && (
        <p className="hl-form-message is-error" role="alert">Your session ended. Sign in again to continue.</p>
      )}
      <div className="hl-auth-grid">
        <SignInForm session={session} />
        <SignUpForm httpClient={session.httpClient} />
      </div>
      <section className="hl-account-recovery" aria-labelledby="recovery-title">
        <div>
          <p className="hl-eyebrow">Account recovery</p>
          <h2 id="recovery-title">Need help signing in?</h2>
        </div>
        <RecoveryRequest httpClient={session.httpClient} />
      </section>
    </main>
  );
}
