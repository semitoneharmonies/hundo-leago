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
    completion: "Free Agent Draft completion",
  }[kind] || "Operation";
}

function correctionDecisionLabel(decision) {
  if (decision.status === "pending") return "Pending — no decision recorded";
  return decision.status.replaceAll("_", " ");
}

function correctionEffectLabel(delta) {
  const subject = {
    allocation: "draft result",
    auction: "auction",
    contract: "contract",
    ownership: "player ownership",
    roster_entry: "roster spot",
    activity: "league history entry",
    recovery: "recovery item",
  }[delta.resourceType] || "record";
  const action = {
    create: "Create",
    update: "Update",
    cancel: "Cancel",
    remove: "Remove",
    assign: "Assign",
    release: "Release",
    append: "Add",
    resolve: "Resolve",
  }[delta.action] || "Change";
  const team = delta.afterSummary.team?.name;
  const player = delta.afterSummary.player?.fullName;
  const context = [player, team].filter(Boolean).join(" for ");
  return `${action} ${subject}${context ? ` for ${context}` : ""}`;
}

function RecoveryActionForm({ action, busy, error, onCancel, onSubmit }) {
  const [reason, setReason] = useState("");
  return (
    <form
      className={styles.editor}
      aria-label={`Confirm ${actionLabel(action.action)}`}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(reason);
      }}
    >
      <p>
        Retry only this step. Other draft results stay unchanged unless the
        retry finishes successfully.
      </p>
      <label>
        Recovery reason
        <textarea
          autoFocus
          rows="3"
          maxLength={500}
          required
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </label>
      {error && (
        <ErrorBlock
          error={error}
          fallback="The recovery action could not be accepted."
        />
      )}
      <div className={styles.editorActions}>
        <button type="submit" className="hl-button hl-button--primary" disabled={busy || !reason.trim()}>
          {busy ? "Submitting recovery…" : "Submit recovery"}
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
  const [confirmed, setConfirmed] = useState(false);
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
      setConfirmed(false);
      setFocusMessage(false);
      setMessage("Correction preview loaded.");
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
      setConfirmed(false);
      setFocusMessage(true);
      setMessage(
        `Correction committed. The recorded allocation is now ${result.allocation.status.replaceAll("_", " ")}. Original history remains preserved.`
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
        setConfirmed(false);
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
          <p className="hl-eyebrow">Result repair</p>
          <h3 id="fad-correction-title" ref={headingRef} tabIndex={-1}>Allocation correction</h3>
        </div>
        <button type="button" className="hl-button hl-button--quiet" disabled={previewMutation.isPending || applyMutation.isPending} onClick={onClose}>
          Close correction
        </button>
      </div>
      <p>
        Preview recalculates this result from the saved Candidate Card. It does
        not change the result, choose a winner manually, or erase history.
      </p>
      {!preview && (
        <button
          type="button"
          className="hl-button hl-button--secondary"
          disabled={previewMutation.isPending || applyMutation.isPending}
          onClick={() => previewMutation.mutate()}
        >
          {previewMutation.isPending ? "Preparing preview…" : "Preview correction"}
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
              <span>Changes if applied</span>
              <strong>{preview.deltas.length}</strong>
            </div>
          </div>
          {preview.deltas.length > 0 && (
            <ul className={styles.diagnostics} aria-label="Correction preview effects">
              {preview.deltas.map((delta, index) => (
                <li key={`${delta.resourceType}:${delta.resourceId || index}`}>
                  {correctionEffectLabel(delta)}
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
            <form className={styles.editor} aria-label="Apply Free Agent Draft correction" onSubmit={applyCorrection}>
              <label>
                Correction reason
                <textarea autoFocus rows="3" maxLength={500} required value={reason} onChange={(event) => setReason(event.target.value)} />
              </label>
              <label className={styles.confirmationCheck}>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                />
                I reviewed the correction and understand the recorded draft
                result may change.
              </label>
              <button
                type="submit"
                className="hl-button hl-button--danger"
                disabled={
                  applyMutation.isPending ||
                  !reason.trim() ||
                  !confirmed
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
    return <Surface><LoadingBlock>Loading Free Agent Draft recovery…</LoadingBlock></Surface>;
  }
  if (recovery.isError) {
    return <Surface><ErrorBlock error={recovery.error} fallback="Free Agent Draft recovery could not be loaded." /></Surface>;
  }

  return (
    <section className={styles.page} aria-labelledby="commissioner-fad-recovery-title">
      <Surface className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className="hl-eyebrow">Commissioner draft tools</p>
            <h2 id="commissioner-fad-recovery-title">Recovery and correction</h2>
          </div>
          <StatusBadge tone={recovery.data.fad.counts.recoveriesOpen > 0 ? "warning" : "success"}>
            {recovery.data.fad.counts.recoveriesOpen} open recoveries
          </StatusBadge>
        </div>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}><span>Draft phase</span><strong>{recovery.data.fad.phase.replaceAll("_", " ")}</strong></div>
          <div className={styles.summaryCard}><span>Cards locked</span><strong>{recovery.data.fad.counts.cardsLocked}</strong></div>
          <div className={styles.summaryCard}><span>Allocations pending</span><strong>{recovery.data.fad.counts.allocationsPending}</strong></div>
          <div className={styles.summaryCard}><span>Rapid auctions open</span><strong>{recovery.data.fad.counts.rapidAuctionsOpen}</strong></div>
        </div>
      </Surface>

      <Surface className={`${styles.panel} ${styles.needsAction}`} as="section" aria-labelledby="fad-available-actions-title">
        <h3 id="fad-available-actions-title">Needs your action</h3>
        <p>Only safe actions currently available for this draft are shown.</p>
        <div className={styles.resultList}>
          {recovery.data.availableActions.map((action) => (
            <div className={styles.recoveryItem} key={`${action.action}:${action.resourceId || "fad"}`}>
              <strong>{actionLabel(action.action)}</strong>
              {action.enabled ? (
                <button type="button" className="hl-button hl-button--secondary" onClick={(event) => { actionTriggerRef.current = event.currentTarget; actionMutation.reset(); setIntentError(null); setReceipt(null); setSelectedAction(action); }}>
                  Review action
                </button>
              ) : (
                <span>Resolve the earlier blocked draft step, then refresh this page.</span>
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
            Recovery {receipt.status === "already_succeeded" ? "was already complete" : "was accepted and is pending"}. The Free Agent Draft status has been refreshed.
          </p>
        )}
      </Surface>

      {recovery.data.scheduleRecoveryEvidence && (
        <details className={styles.historyDisclosure}>
          <summary>
            <strong>Week 1 recovery history</strong>
            <small>Completed schedule adjustment</small>
          </summary>
        <Surface className={styles.panel} as="section" aria-labelledby="fad-week-one-recovery-title">
          <h3 id="fad-week-one-recovery-title">Committed Week 1 recovery</h3>
          <p>
            Competition Week 1 moved from {leagueDateTime(recovery.data.scheduleRecoveryEvidence.oldWeek1StartsAtMs, timeZone)} to {leagueDateTime(recovery.data.scheduleRecoveryEvidence.newWeek1StartsAtMs, timeZone)}.
          </p>
          <p>
            {recovery.data.scheduleRecoveryEvidence.removedWeekIds.length} weeks
            and {recovery.data.scheduleRecoveryEvidence.removedMatchupIds.length}
            matchups were safely replaced or removed.
          </p>
        </Surface>
        </details>
      )}

      <details className={styles.historyDisclosure}>
        <summary>
          <strong>Draft step history</strong>
          <small>{operations.length} recorded steps</small>
        </summary>
      <Surface className={styles.panel} as="section" aria-labelledby="fad-operations-title">
        <h3 id="fad-operations-title">Draft steps</h3>
        {operations.length === 0 ? <p>No draft step history is available.</p> : (
          <div className={styles.resultList}>
            {operations.map((operation) => (
              <div className={styles.recoveryItem} key={operation.operationId}>
                <div className={styles.panelHeader}>
                  <strong>{operationLabel(operation.operationKind)}</strong>
                  <StatusBadge tone={operation.status === "succeeded" ? "success" : operation.status === "failed" ? "danger" : "warning"}>{operation.status === "succeeded" ? "Completed" : operation.status === "failed" ? "Needs attention" : "In progress"}</StatusBadge>
                </div>
                <span>
                  Tried {operation.attemptCount} {operation.attemptCount === 1 ? "time" : "times"}. {operation.blocksCompletion ? "This step must finish before the draft can complete." : "The draft can continue without this step."}
                </span>
              </div>
            ))}
          </div>
        )}
      </Surface>
      </details>

      <details
        className={styles.historyDisclosure}
        open={Boolean(requestedRecoveryId)}
      >
        <summary>
          <strong>Recovery history</strong>
          <small>{recovery.data.recoveries.length} records</small>
        </summary>
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
                  <strong>{item.kind.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase())}</strong>
                  <StatusBadge tone={item.status === "resolved" ? "success" : item.status === "correction_required" ? "danger" : "warning"}>{item.status === "resolved" ? "Resolved" : item.status === "correction_required" ? "Correction needed" : "Ready"}</StatusBadge>
                </div>
                <span>Created {leagueDateTime(item.createdAtMs, timeZone)}</span>
                {item.status === "correction_required" && item.allocationId && (
                  <button type="button" className="hl-button hl-button--secondary" onClick={(event) => { correctionTriggerRef.current = event.currentTarget; setSelectedAllocationId(item.allocationId); }}>
                    Review correction
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </Surface>
      </details>

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
