import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorBlock, LoadingBlock, Surface } from "../../components/HundoUi.jsx";
import { createIdempotencyKey } from "../../shared/api/idempotency.js";
import { ResponseContractError } from "../../shared/api/responseContracts.js";
import { useSession } from "../session/sessionContext.js";
import styles from "../commissioner/LeagueCommunications.module.css";

export function FadDeadlineControls({ leagueId, fadId }) {
  const session = useSession();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [preview, setPreview] = useState(null);
  const [receipt, setReceipt] = useState("");
  const key = ["league", leagueId, "free-agent-draft", fadId, "deadline-control"];
  const base = `/api/v1/leagues/${encodeURIComponent(leagueId)}/free-agent-drafts/${encodeURIComponent(fadId)}/deadline-control`;
  function validate(data, kind) {
    let valid = data?.leagueId === leagueId && data?.fadId === fadId;
    if (kind === "accepted") valid &&= data.accepted === true && typeof data.replayed === "boolean" && typeof data.id === "string";
    else valid &&= typeof data.held === "boolean" && typeof data.processingAuthorized === "boolean" &&
      typeof data.canProceed === "boolean" && Number.isSafeInteger(data.total) && Number.isSafeInteger(data.complete) &&
      data.complete >= 0 && data.total >= data.complete && Array.isArray(data.unfinishedTeams) &&
      data.unfinishedTeams.length === data.total - data.complete &&
      data.unfinishedTeams.every(t => typeof t.teamId === "string" && typeof t.teamName === "string" && ["empty", "incomplete"].includes(t.status)) &&
      (data.blockedReason === null || typeof data.blockedReason === "string");
    if (kind === "preview") valid &&= /^[a-f0-9]{64}$/.test(data.previewHash || "") && typeof data.reason === "string";
    if (!valid) throw new ResponseContractError("The deadline response could not be verified.");
    return true;
  }
  async function request(suffix, options, kind = "status") {
    const response = await session.httpClient.request(base + suffix, { ...options, authenticated: true, dataKind: "object",
      validateData: data => validate(data, kind) });
    validate(response.data, kind);
    return response.data;
  }
  const state = useQuery({ queryKey: key, queryFn: ({ signal }) => request("", { signal }),
    enabled: session.status === "authenticated", meta: { private: true, leagueId }, retry: false, refetchInterval: 10_000 });
  const review = useMutation({ mutationFn: () => request("/preview", { method: "POST", body: { reason } }, "preview"),
    onSuccess: data => setPreview({ ...data, key: createIdempotencyKey("fad-deadline") }) });
  const proceed = useMutation({
    mutationFn: saved => request("/proceed", { method: "POST", idempotencyKey: saved.key,
      body: { reason: saved.reason, previewHash: saved.previewHash, confirmed: true } }, "accepted"),
    onSuccess: async () => {
      setPreview(null); setReceipt("Processing authorized. The draft worker will recheck the saved cards before allocation.");
      await queryClient.invalidateQueries({ queryKey: ["league", leagueId, "free-agent-draft"] });
    },
  });
  const busy = review.isPending || proceed.isPending;
  return <Surface as="section" className={styles.section} aria-label="Candidate Card deadline controls">
    <h2>Candidate Card deadline controls</h2>
    {state.isPending && <LoadingBlock>Checking the deadline…</LoadingBlock>}
    {state.error && <ErrorBlock error={state.error} fallback="Deadline status is unavailable." />}
    {state.data && <>
      <p><strong>{state.data.held ? "Processing is on hold" : state.data.processingAuthorized ? "Processing authorized" : "Automatic processing at the target deadline"}</strong></p>
      <p>{state.data.complete} of {state.data.total} cards are complete and valid.</p>
      {state.data.held && <p>Managers can keep editing their own cards. Authorize processing or set a new future target to release the hold.</p>}
      {state.data.blockedReason && <p>{state.data.blockedReason}</p>}
      {state.data.canProceed && !state.data.processingAuthorized && <form className={styles.editor}
        onSubmit={event => { event.preventDefault(); setPreview(null); proceed.reset(); review.mutate(); }}>
        <label>Reason for proceeding<input required minLength={3} maxLength={500} value={reason} disabled={busy}
          onChange={event => { setReason(event.target.value); setPreview(null); setReceipt(""); review.reset(); proceed.reset(); }} /></label>
        <p>Review unfinished teams before deciding. Player selections and offers remain private.</p>
        <div><button type="submit" className="hl-button hl-button--secondary" disabled={busy || reason.trim().length < 3}>Review processing</button></div>
      </form>}
      {review.error && <ErrorBlock error={review.error} fallback="The preview could not be prepared." />}
    </>}
    {preview && <section className={styles.preview} aria-label="Deadline processing preview">
      <h3>Proceed with the saved cards?</h3>
      <p>{preview.unfinishedTeams.length} {preview.unfinishedTeams.length === 1 ? "team has" : "teams have"} unfinished cards.</p>
      <ul>{preview.unfinishedTeams.map(t => <li key={t.teamId}>{t.teamName} — {t.status === "empty" ? "Empty" : "Incomplete"}</li>)}</ul>
      <p>Valid saved offers will be processed. Missing or invalid offers cannot win players. Managers lose editing access when processing locks the cards.</p>
      <p>Reason: {preview.reason}</p>
      <div className={styles.actions}>
        <button type="button" className="hl-button hl-button--primary" disabled={busy} onClick={() => proceed.mutate(preview)}>
          {proceed.isPending ? "Authorizing…" : "Confirm processing"}</button>
        <button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={() => { setPreview(null); proceed.reset(); }}>Keep waiting</button>
      </div>
      {proceed.error && <ErrorBlock error={proceed.error} fallback="Processing could not be confirmed. Retry this action or review a fresh preview if the cards changed." />}
    </section>}
    {receipt && <p role="status">{receipt}</p>}
  </Surface>;
}
