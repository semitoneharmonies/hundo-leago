import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ErrorBlock } from "../../components/HundoUi.jsx";
import { createIntentKey } from "../accounts/accountApi.js";
import { deleteLeague, previewLeagueDeletion } from "./leagueDeletionApi.js";
import { clearUnauthorizedLeaguePreference } from "./leaguePreference.js";
import styles from "./LeagueDeletionPanel.module.css";

export function LeagueDeletionPanel({ httpClient, league, onDeleted, onBusyChange }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const intent = useRef(null);
  const submitting = useRef(false);
  const preview = useMutation({
    mutationFn: () => previewLeagueDeletion(httpClient, league.id),
    onSuccess: () => {
      setName("");
      setConfirmed(false);
      intent.current = null;
      deletion.reset();
    },
  });
  const deletion = useMutation({
    mutationFn: (request) => deleteLeague(httpClient, league.id, request.input, request.key),
    onSuccess: async (result) => {
      const isDeletedLeague = (query) => query.meta?.leagueId === league.id ||
        (query.queryKey[0] === "league" && query.queryKey[1] === league.id);
      await queryClient.cancelQueries({ predicate: (query) =>
        query.queryKey[0] === "leagues" || isDeletedLeague(query) });
      queryClient.removeQueries({ predicate: isDeletedLeague });
      queryClient.setQueryData(["leagues"], (current) => (current || []).filter(({ id }) => id !== league.id));
      clearUnauthorizedLeaguePreference((queryClient.getQueryData(["leagues"]) || []).map(({ id }) => id));
      onDeleted(result.league);
      void queryClient.invalidateQueries({ queryKey: ["leagues"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onSettled: () => { submitting.current = false; onBusyChange(false); },
  });
  const needsReview = ["LEAGUE_DELETION_PREVIEW_CHANGED", "LEAGUE_DELETION_BUSY"]
    .includes(deletion.error?.code);
  const ready = preview.data && !preview.isPending && !preview.isError &&
    !deletion.isPending && !needsReview && name === preview.data.league.name && confirmed;

  return (
    <section className={styles.panel} aria-label={`Delete ${league.name}`}>
      <h3>Delete league</h3>
      <p>Permanently delete {league.name} and its teams, memberships, rosters, contracts, drafts,
        trades, matchups, and league history. This cannot be undone.</p>
      {!preview.data || needsReview ? (
        <button type="button" className="hl-button hl-button--danger"
          disabled={preview.isPending || deletion.isPending}
          onClick={() => preview.mutate()}>
          {preview.isPending ? "Reviewing…" : needsReview ? "Review updated deletion" : "Review league deletion"}
        </button>
      ) : (
        <form className={styles.form} onSubmit={(event) => {
          event.preventDefault();
          if (!ready || submitting.current) return;
          submitting.current = true;
          onBusyChange(true);
          intent.current ||= { key: createIntentKey("admin-league-delete"), input: {
            confirmed: true, leagueName: preview.data.league.name, previewHash: preview.data.previewHash,
          } };
          deletion.mutate(intent.current);
        }}>
          <p>{preview.data.counts.teams || 0} teams · {preview.data.counts.league_memberships || 0} memberships
            {" · "}{preview.data.counts.seasons || 0} {preview.data.counts.seasons === 1 ? "season" : "seasons"}
            {" · "}{preview.data.totalRecords} records to delete.</p>
          <p>User accounts, the player catalogue, and other leagues will stay.
            Administrative audit and existing system backup records are retained.</p>
          <label className="hl-field">Type {preview.data.league.name} to confirm
            <input value={name} autoComplete="off" disabled={deletion.isPending}
              onChange={(event) => setName(event.target.value)} />
          </label>
          <label className={styles.confirmation}>
            <input type="checkbox" checked={confirmed} disabled={deletion.isPending}
              onChange={(event) => setConfirmed(event.target.checked)} />
            {" "}Are you sure? I understand this permanently deletes {preview.data.league.name}.
          </label>
          <div className={styles.actions}>
            <button className="hl-button hl-button--danger" type="submit" disabled={!ready}>
              {deletion.isPending ? "Deleting…" : "Permanently delete league"}
            </button>
            <button className="hl-button" type="button" disabled={deletion.isPending}
              onClick={() => { preview.reset(); deletion.reset(); intent.current = null; setName(""); setConfirmed(false); }}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {(preview.error || deletion.error) && <ErrorBlock error={preview.error || deletion.error}
        impact="Deletion has not been confirmed."
        recovery={needsReview ? "Review the latest league information before confirming again."
          : "You can retry. A repeated request will not delete anything twice."} />}
    </section>
  );
}
