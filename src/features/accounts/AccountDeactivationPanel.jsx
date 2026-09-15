import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { Surface } from "../../components/HundoUi.jsx";
import { useSession } from "../session/sessionContext.js";
import { deactivateAccount } from "./accountApi.js";

export function AccountDeactivationPanel() {
  const session = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const mutation = useMutation({
    mutationFn: (input) => deactivateAccount(session.httpClient, input),
    onSuccess: async () => {
      await session.clearAuthentication("account-deactivated");
    },
  });

  if (session.status !== "authenticated") return null;

  function handleSubmit(event) {
    event.preventDefault();
    if (mutation.isPending || !currentPassword) return;
    if (!window.confirm("Are you sure you want to deactivate your account? You will be signed out, and your league roles and team assignments may be reassigned while you are inactive.")) {
      setCurrentPassword("");
      return;
    }
    setCurrentPassword("");
    mutation.mutate({ currentPassword, confirmation: "DEACTIVATE" });
  }

  return (
    <Surface as="section" className="hl-account-action">
      <h2 id="account-deactivation-title" style={{ margin: 0 }}>Deactivate account</h2>
      <p>
        This signs you out and prevents sign-in. Your history is kept. League
        roles and team assignments may be reassigned while your account is inactive.
      </p>
      <p>You can request a reactivation link from the sign-in page.</p>
      <form aria-labelledby="account-deactivation-title" onSubmit={handleSubmit}>
        <label className="hl-field">
          Current password
          <input type="password" autoComplete="current-password" required
            value={currentPassword} disabled={mutation.isPending}
            onChange={(event) => setCurrentPassword(event.target.value)} />
        </label>
        <button type="submit" className="hl-button hl-button--danger"
          disabled={mutation.isPending || !currentPassword}>
          {mutation.isPending ? "Deactivating…" : "Deactivate my account"}
        </button>
        {mutation.error && (
          <p className="hl-form-message is-error" role="alert">
            {mutation.error.code === "ACCOUNT_DEACTIVATION_DENIED"
              ? "Your current password was not accepted. Enter it again."
              : "We could not confirm deactivation. Try signing in again to check your account."}
          </p>
        )}
      </form>
    </Surface>
  );
}
