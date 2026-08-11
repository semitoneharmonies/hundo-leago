import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ErrorBlock,
  LoadingBlock,
  StatusBadge,
  Surface,
} from "../../components/HundoUi.jsx";
import { createIdempotencyKey } from "../../shared/api/idempotency.js";
import { leagueDateTime } from "../../shared/hundoFormat.js";
import { useSession } from "../session/sessionContext.js";
import {
  acceptFreeAgentDraftRecoveryAction,
  applyFreeAgentDraftCorrection,
  previewFreeAgentDraftCorrection,
} from "./freeAgentDraftApi.js";
import {
  freeAgentDraftKeys,
  freeAgentDraftRecoveryQuery,
} from "./freeAgentDraftQueries.js";
import styles from "./FreeAgentDraftPage.module.css";

function actionLabel(action) {
  return {
    retry_deadline: "Retry Candidate deadline processing",
    retry_allocation: "Retry automatic allocation",
    activate_restricted: "Activate restricted auction",
    activate_queued_nomination: "Activate queued nomination",
    activate_fallback: "Activate fallback auction",
    retry_auction_resolution: "Retry auction resolution",
    finalize_rollover: "Finalize rapid rollover",
    complete_fad: "Complete Free Agent Draft",
  }[action] || "Unavailable recovery action";
}

function operationLabel(kind) {
  return {
    deadline: "Candidate deadline",
    allocation: "Automatic allocation",
    restricted_activation: "Restricted activation",
    queued_nomination_activation: "Queued nomination activation",
    fallback_activation: "Fallback activation",
    auction_resolution: "Auction resolution",
    completion: "FAD completion",
  }[kind] || "Operation";
}

function correctionDecisionLabel(decision) {
  if (decision.status === "pending") return "Pending — no decision recorded";
  return `${decision.status.replaceAll("_", " ")} · ${
    decision.decisionCode?.replaceAll("_", " ") || "decision unavailable"
  }`;
}

function RecoveryActionForm({ action, busy, error, onCancel, onSubmit }) {
  const [reason, setReason] = useState("");
  const errorId = error ? "fad-recovery-action-error" : undefined;
  return (
    <form
      className={styles.editor}
      aria-label={`Confirm ${actionLabel(action.action)}`}
      aria-describedby={errorId}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(reason);
      }}
    >
      <p>
        Retry only this server-authorized operation. The accepted receipt does
        not claim that downstream state changed before the durable worker commits.
      </p>
      <label>
        Recovery reason
        <textarea
          autoFocus
          rows="3"
          maxLength={500}
          required
          value={reason}
          aria-describedby={errorId}
          onChange={(event) => setReason(event.target.value)}
        />
      </label>
      {error && (
        <p id="fad-recovery-action-error" className={styles.error} role="alert">
          {error.message || "The recovery action could not be accepted."}
        </p>
      )}
      <div className={styles.editorActions}>
        <button type="submit" className="hl-button hl-button--primary" disabled={busy || !reason.trim()}>
          {busy ? "Submitting recovery…" : "Submit authorized recovery"}
        </button>
        <button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function CorrectionPanel({ allocationId, fadId, leagueId, onClose }) {
  const session = useSession();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState(null);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [focusMessage, setFocusMessage] = useState(false);
  const headingRef = useRef(null);
  const messageRef = useRef(null);
  useEffect(() => {
    const frame = globalThis.requestAnimationFrame?.(() => headingRef.current?.focus());
    return () => globalThis.cancelAnimationFrame?.(frame);
  }, []);
  useEffect(() => {
    if (!focusMessage || !message) return undefined;
    const frame = globalThis.requestAnimationFrame?.(() => messageRef.current?.focus());
    return () => globalThis.cancelAnimationFrame?.(frame);
  }, [focusMessage, message]);
  const previewMutation = useMutation({
    mutationFn: () =>
      previewFreeAgentDraftCorrection(
        session.httpClient,
        leagueId,
        fadId,
        allocationId
      ),
    onSuccess(result) {
      setPreview(result);
      setConfirmation("");
      setFocusMessage(false);
      setMessage("Read-only deterministic correction preview loaded.");
    },
    onError() {
      setPreview(null);
      setFocusMessage(false);
      setMessage("");
    },
  });
  const applyMutation = useMutation({
    mutationFn: ({ idempotencyKey }) =>
      applyFreeAgentDraftCorrection(
        session.httpClient,
        leagueId,
        fadId,
        allocationId,
        {
          mode: "recompute_locked_snapshot",
          previewFingerprint: preview.previewFingerprint,
          reason: reason.trim(),
          confirmation: preview.confirmationText,
        },
        {
          version: preview.allocationVersion,
          idempotencyKey,
        }
      ),
    onSuccess: async (result) => {
      setPreview(null);
      setReason("");
      setConfirmation("");
      setFocusMessage(true);
      setMessage(
        `Correction committed. The authoritative allocation is now ${result.allocation.status.replaceAll("_", " ")}. Original history remains preserved.`
      );
      await queryClient.invalidateQueries({
        queryKey: freeAgentDraftKeys.root(leagueId),
      });
    },
    onError: async (error) => {
      if (
        error.status === 412 ||
        error.code === "PRECONDITION_FAILED" ||
        error.code === "FAD_CORRECTION_NOT_APPLICABLE"
      ) {
        setPreview(null);
        setConfirmation("");
        setFocusMessage(true);
        setMessage(
          "The allocation or preview changed. No correction was applied; current recovery and result evidence has been refreshed."
        );
        await queryClient.invalidateQueries({
          queryKey: freeAgentDraftKeys.root(leagueId),
        });
      }
    },
  });

  function applyCorrection(event) {
    event.preventDefault();
    let idempotencyKey;
    try {
      idempotencyKey = createIdempotencyKey("fad-correction");
    } catch (error) {
      setMessage(error.message);
      return;
    }
    applyMutation.mutate({ idempotencyKey });
  }

  return (
    <Surface className={styles.panel} as="section" aria-labelledby="fad-correction-title">
      <div className={styles.panelHeader}>
        <div>
          <p className="hl-eyebrow">Explicit atomic repair</p>
          <h3 id="fad-correction-title" ref={headingRef} tabIndex={-1}>Allocation correction</h3>
        </div>
        <button type="button" className="hl-button hl-button--quiet" disabled={previewMutation.isPending || applyMutation.isPending} onClick={onClose}>
          Close correction
        </button>
      </div>
      <p>
        Preview recomputes only from the immutable locked Candidate snapshot.
        It does not write, select a winner manually, or erase original history.
      </p>
      {!preview && (
        <button
          type="button"
          className="hl-button hl-button--secondary"
          disabled={previewMutation.isPending || applyMutation.isPending}
          onClick={() => previewMutation.mutate()}
        >
          {previewMutation.isPending ? "Preparing read-only preview…" : "Preview deterministic correction"}
        </button>
      )}
      {previewMutation.error && (
        <ErrorBlock error={previewMutation.error} fallback="The correction preview could not be prepared." />
      )}
      {preview && (
        <>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <span>Current decision</span>
              <strong>{correctionDecisionLabel(preview.currentDecision)}</strong>
            </div>
            <div className={styles.summaryCard}>
              <span>Recomputed decision</span>
              <strong>{correctionDecisionLabel(preview.recomputedDecision)}</strong>
            </div>
            <div className={styles.summaryCard}>
              <span>Bounded effects</span>
              <strong>{preview.deltas.length}</strong>
            </div>
          </div>
          {preview.deltas.length > 0 && (
            <ul className={styles.diagnostics} aria-label="Correction preview effects">
              {preview.deltas.map((delta, index) => (
                <li key={`${delta.resourceType}:${delta.resourceId || index}`}>
                  {delta.action} {delta.resourceType.replaceAll("_", " ")}
                  {delta.afterSummary.team ? ` for ${delta.afterSummary.team.name}` : ""}
                  {delta.afterSummary.player ? ` (${delta.afterSummary.player.fullName})` : ""}
                </li>
              ))}
            </ul>
          )}
          {preview.warnings.length > 0 && (
            <ul className={styles.diagnostics} aria-label="Correction preview warnings">
              {preview.warnings.map((warning) => <li key={`${warning.code}:${warning.resourceId || "allocation"}`}>{warning.message}</li>)}
            </ul>
          )}
          {preview.blockers.length > 0 && (
            <div className={styles.error} role="alert">
              <strong>Correction is blocked.</strong>
              <ul className={styles.diagnostics}>
                {preview.blockers.map((blocker) => <li key={`${blocker.code}:${blocker.resourceId || "allocation"}`}>{blocker.message}</li>)}
              </ul>
            </div>
          )}
          {preview.reversible && (
            <form className={styles.editor} aria-label="Apply FAD correction" onSubmit={applyCorrection}>
              <label>
                Correction reason
                <textarea autoFocus rows="3" maxLength={500} required value={reason} onChange={(event) => setReason(event.target.value)} />
              </label>
              <label>
                Type the exact confirmation: <strong>{preview.confirmationText}</strong>
                <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
              </label>
              <button
                type="submit"
                className="hl-button hl-button--danger"
                disabled={
                  applyMutation.isPending ||
                  !reason.trim() ||
                  confirmation !== preview.confirmationText
                }
              >
                {applyMutation.isPending ? "Applying correction…" : "Apply reviewed correction"}
              </button>
            </form>
          )}
        </>
      )}
      {message && <p className={styles.notice} role="status" ref={messageRef} tabIndex={focusMessage ? -1 : undefined}>{message}</p>}
      {applyMutation.error && ![412].includes(applyMutation.error.status) && applyMutation.error.code !== "FAD_CORRECTION_NOT_APPLICABLE" && (
        <ErrorBlock error={applyMutation.error} fallback="The correction could not be applied." />
      )}
    </Surface>
  );
}

export function CommissionerFadRecovery({
  leagueId,
  fadId,
  requestedRecoveryId = null,
  timeZone,
}) {
  const session = useSession();
  const queryClient = useQueryClient();
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedAllocationId, setSelectedAllocationId] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [intentError, setIntentError] = useState(null);
  const focusedRecoveryIdRef = useRef(null);
  const actionTriggerRef = useRef(null);
  const correctionTriggerRef = useRef(null);
  const receiptRef = useRef(null);
  const recovery = useQuery(
    freeAgentDraftRecoveryQuery(session.httpClient, leagueId, fadId)
  );
  const actionMutation = useMutation({
    mutationFn: ({ action, reason, idempotencyKey }) =>
      acceptFreeAgentDraftRecoveryAction(
        session.httpClient,
        leagueId,
        fadId,
        { action: action.action, resourceId: action.resourceId, reason },
        { idempotencyKey }
      ),
    onSuccess: async (result) => {
      setReceipt(result);
      setIntentError(null);
      setSelectedAction(null);
      await queryClient.invalidateQueries({
        queryKey: freeAgentDraftKeys.recovery(leagueId, fadId),
      });
    },
  });

  useEffect(() => {
    if (
      !requestedRecoveryId ||
      !recovery.data ||
      focusedRecoveryIdRef.current === requestedRecoveryId
    ) return;
    focusedRecoveryIdRef.current = requestedRecoveryId;
    const frame = globalThis.requestAnimationFrame?.(() => {
      document.getElementById(`fad-recovery-${requestedRecoveryId}`)?.focus();
    });
    return () => globalThis.cancelAnimationFrame?.(frame);
  }, [recovery.data, requestedRecoveryId]);

  useEffect(() => {
    if (!receipt) return undefined;
    const frame = globalThis.requestAnimationFrame?.(() => receiptRef.current?.focus());
    return () => globalThis.cancelAnimationFrame?.(frame);
  }, [receipt]);

  const operations = useMemo(() => {
    if (!recovery.data) return [];
    return [
      recovery.data.deadlineOperation,
      ...recovery.data.allocationOperations,
      ...recovery.data.rapidOperations,
      recovery.data.completionOperation,
    ].filter(Boolean);
  }, [recovery.data]);

  function submitAction(reason) {
    let idempotencyKey;
    try {
      idempotencyKey = createIdempotencyKey("fad-recovery");
    } catch (error) {
      setIntentError(error);
      return;
    }
    setIntentError(null);
    actionMutation.mutate({
      action: selectedAction,
      reason: reason.trim(),
      idempotencyKey,
    });
  }

  if (recovery.isPending) {
    return <Surface><LoadingBlock>Loading FAD recovery evidence…</LoadingBlock></Surface>;
  }
  if (recovery.isError) {
    return <Surface><ErrorBlock error={recovery.error} fallback="FAD recovery evidence could not be loaded." /></Surface>;
  }

  return (
    <section className={styles.page} aria-labelledby="commissioner-fad-recovery-title">
      <Surface className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className="hl-eyebrow">Commissioner operational history</p>
            <h2 id="commissioner-fad-recovery-title">Recovery and correction</h2>
          </div>
          <StatusBadge tone={recovery.data.fad.counts.recoveriesOpen > 0 ? "warning" : "success"}>
            {recovery.data.fad.counts.recoveriesOpen} open recoveries
          </StatusBadge>
        </div>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}><span>FAD phase</span><strong>{recovery.data.fad.phase.replaceAll("_", " ")}</strong></div>
          <div className={styles.summaryCard}><span>Cards locked</span><strong>{recovery.data.fad.counts.cardsLocked}</strong></div>
          <div className={styles.summaryCard}><span>Allocations pending</span><strong>{recovery.data.fad.counts.allocationsPending}</strong></div>
          <div className={styles.summaryCard}><span>Rapid auctions open</span><strong>{recovery.data.fad.counts.rapidAuctionsOpen}</strong></div>
        </div>
      </Surface>

      {recovery.data.scheduleRecoveryEvidence && (
        <Surface className={styles.panel} as="section" aria-labelledby="fad-week-one-recovery-title">
          <h3 id="fad-week-one-recovery-title">Committed Week 1 recovery</h3>
          <p>
            Competition Week 1 moved from {leagueDateTime(recovery.data.scheduleRecoveryEvidence.oldWeek1StartsAtMs, timeZone)} to {leagueDateTime(recovery.data.scheduleRecoveryEvidence.newWeek1StartsAtMs, timeZone)}.
          </p>
          <p>
            Schedule version {recovery.data.scheduleRecoveryEvidence.oldScheduleVersion} became {recovery.data.scheduleRecoveryEvidence.newScheduleVersion}; {recovery.data.scheduleRecoveryEvidence.removedWeekIds.length} weeks and {recovery.data.scheduleRecoveryEvidence.removedMatchupIds.length} matchups were replaced or removed.
          </p>
          <ul className={styles.diagnostics} aria-label="Replaced Week 1 jobs">
            {recovery.data.scheduleRecoveryEvidence.replacedJobs.map((job) => (
              <li key={job.oldJobId}>{job.oldOccurrenceKey} → {job.newOccurrenceKey}</li>
            ))}
          </ul>
        </Surface>
      )}

      <Surface className={styles.panel} as="section" aria-labelledby="fad-operations-title">
        <h3 id="fad-operations-title">Durable operations</h3>
        {operations.length === 0 ? <p>No durable operations were returned.</p> : (
          <div className={styles.resultList}>
            {operations.map((operation) => (
              <div className={styles.recoveryItem} key={operation.operationId}>
                <div className={styles.panelHeader}>
                  <strong>{operationLabel(operation.operationKind)}</strong>
                  <StatusBadge tone={operation.status === "succeeded" ? "success" : operation.status === "failed" ? "danger" : "warning"}>{operation.status}</StatusBadge>
                </div>
                <span>Attempt {operation.attemptCount}; {operation.blocksCompletion ? "blocks completion" : "does not block completion"}</span>
              </div>
            ))}
          </div>
        )}
      </Surface>

      <Surface className={styles.panel} as="section" aria-labelledby="fad-recoveries-title">
        <h3 id="fad-recoveries-title">Recovery records</h3>
        {recovery.data.recoveries.length === 0 ? <p>No recovery record exists.</p> : (
          <div className={styles.resultList}>
            {recovery.data.recoveries.map((item) => (
              <article
                id={`fad-recovery-${item.recoveryId}`}
                className={`${styles.recoveryItem} ${item.recoveryId === requestedRecoveryId ? styles.recoveryItemActive : ""}`}
                tabIndex={-1}
                key={item.recoveryId}
              >
                <div className={styles.panelHeader}>
                  <strong>{item.kind.replaceAll("_", " ")}</strong>
                  <StatusBadge tone={item.status === "resolved" ? "success" : item.status === "correction_required" ? "danger" : "warning"}>{item.status.replaceAll("_", " ")}</StatusBadge>
                </div>
                <span>Created {leagueDateTime(item.createdAtMs, timeZone)}</span>
                {item.lastErrorCode && <span>Safe error code: {item.lastErrorCode}</span>}
                {item.status === "correction_required" && item.allocationId && (
                  <button type="button" className="hl-button hl-button--secondary" onClick={(event) => { correctionTriggerRef.current = event.currentTarget; setSelectedAllocationId(item.allocationId); }}>
                    Review deterministic correction
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </Surface>

      <Surface className={styles.panel} as="section" aria-labelledby="fad-available-actions-title">
        <h3 id="fad-available-actions-title">Server-authorized recovery actions</h3>
        <p>Only actions returned by the server are shown. Disabled actions cannot be submitted.</p>
        <div className={styles.resultList}>
          {recovery.data.availableActions.map((action) => (
            <div className={styles.recoveryItem} key={`${action.action}:${action.resourceId || "fad"}`}>
              <strong>{actionLabel(action.action)}</strong>
              {action.enabled ? (
                <button type="button" className="hl-button hl-button--secondary" onClick={(event) => { actionTriggerRef.current = event.currentTarget; actionMutation.reset(); setIntentError(null); setReceipt(null); setSelectedAction(action); }}>
                  Review action
                </button>
              ) : (
                <span>Unavailable: {action.reasonCode.replaceAll("_", " ").toLowerCase()}</span>
              )}
            </div>
          ))}
        </div>
        {selectedAction && (
          <RecoveryActionForm
            key={`${selectedAction.action}:${selectedAction.resourceId || "fad"}`}
            action={selectedAction}
            busy={actionMutation.isPending}
            error={intentError || actionMutation.error}
            onCancel={() => {
              const trigger = actionTriggerRef.current;
              actionMutation.reset();
              setIntentError(null);
              setSelectedAction(null);
              globalThis.setTimeout(() => trigger?.focus(), 0);
            }}
            onSubmit={submitAction}
          />
        )}
        {receipt && (
          <p className={styles.success} role="status" ref={receiptRef} tabIndex={-1}>
            Recovery operation {receipt.status === "already_succeeded" ? "was already complete" : "was accepted and is pending"}. The exact FAD recovery resource has been refreshed.
          </p>
        )}
      </Surface>

      {selectedAllocationId && (
        <CorrectionPanel
          key={selectedAllocationId}
          allocationId={selectedAllocationId}
          fadId={fadId}
          leagueId={leagueId}
          onClose={() => {
            const trigger = correctionTriggerRef.current;
            setSelectedAllocationId(null);
            globalThis.setTimeout(() => trigger?.focus(), 0);
          }}
        />
      )}
    </section>
  );
}
