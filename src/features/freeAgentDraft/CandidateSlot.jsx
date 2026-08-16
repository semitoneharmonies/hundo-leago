import { Check, Clock3, LockKeyhole, X } from "lucide-react";

import { EligiblePlayerSearch } from "./EligiblePlayerSearch.jsx";
import styles from "./FreeAgentDraftPage.module.css";

const WON_OUTCOMES = new Set([
  "automatic_win",
  "restricted_win",
  "fallback_win",
]);
const NOT_WON_OUTCOMES = new Set([
  "automatic_loss",
  "restricted_loss",
  "fallback_loss",
  "fallback_no_winner",
  "invalid_offer",
]);
const PENDING_OUTCOMES = new Set([
  "restricted_pending",
  "fallback_pending",
]);

function money(cents) {
  if (!Number.isSafeInteger(cents)) return "";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function isIncompleteCandidate(slot) {
  return (
    slot.occupantKind === "candidate" &&
    (slot.totalValueCents === null ||
      slot.termYears === null ||
      slot.validation.codes.includes("CANDIDATE_CONTRACT_INCOMPLETE"))
  );
}

function publishedOutcome(slot) {
  if (slot.occupantKind === "empty") {
    return { kind: "neutral", label: "No offer", Icon: null };
  }
  if (slot.occupantKind === "carryover") {
    return { kind: "locked", label: "Carried over", Icon: LockKeyhole };
  }
  if (isIncompleteCandidate(slot)) {
    return { kind: "notWon", label: "Not won — incomplete", Icon: X };
  }
  if (WON_OUTCOMES.has(slot.outcome?.code)) {
    return { kind: "won", label: "Won", Icon: Check };
  }
  if (NOT_WON_OUTCOMES.has(slot.outcome?.code)) {
    return {
      kind: "notWon",
      label:
        slot.outcome.code === "invalid_offer"
          ? "Not won — invalid offer"
          : "Not won",
      Icon: X,
    };
  }
  if (PENDING_OUTCOMES.has(slot.outcome?.code) || slot.outcome === null) {
    return { kind: "pending", label: "Pending", Icon: Clock3 };
  }
  return { kind: "neutral", label: "No offer", Icon: null };
}

function privateState(slot, rowEditable) {
  if (slot.occupantKind === "carryover") {
    return { kind: "locked", label: "Locked carryover", Icon: LockKeyhole };
  }
  if (slot.occupantKind === "empty") {
    return {
      kind: "neutral",
      label: rowEditable ? "Open" : "Empty",
      Icon: null,
    };
  }
  if (isIncompleteCandidate(slot)) {
    return { kind: "pending", label: "Incomplete", Icon: Clock3 };
  }
  if (slot.validation.status === "invalid") {
    return { kind: "notWon", label: "Invalid", Icon: X };
  }
  return {
    kind: "neutral",
    label: rowEditable ? "Ready" : "Read only",
    Icon: null,
  };
}

export function CandidateSlot({
  slot,
  editable = false,
  published = false,
  busy = false,
  draft = null,
  rowError = "",
  buildEligibleQueryOptions,
  onDraftChange,
}) {
  const isCarryover = slot.occupantKind === "carryover";
  const rowEditable = editable && !slot.locked && !isCarryover;
  const draftIncomplete =
    rowEditable &&
    Boolean(draft?.playerId) &&
    (!draft.aav || !draft.termYears);
  const state = published
    ? publishedOutcome(slot)
    : rowError
      ? { kind: "notWon", label: "Invalid", Icon: X }
      : draftIncomplete
        ? { kind: "pending", label: "Incomplete", Icon: Clock3 }
        : privateState(slot, rowEditable);
  const StateIcon = state.Icon;
  const playerName = rowEditable
    ? draft?.playerName || ""
    : slot.player?.fullName || "";
  const aav = rowEditable ? draft?.aav || "" : money(slot.aavCents);
  const term = rowEditable
    ? draft?.termYears || ""
    : String(isCarryover ? slot.remainingYears || "" : slot.termYears || "");
  const draftAavCents = rowEditable && draft?.aav ? Number(draft.aav) * 100 : null;
  const draftTermYears = rowEditable && draft?.termYears ? Number(draft.termYears) : null;
  const derivedTotal =
    Number.isSafeInteger(draftAavCents) && [1, 2, 3].includes(draftTermYears)
      ? money(draftAavCents * draftTermYears)
      : "";
  const total = rowEditable ? derivedTotal : money(slot.totalValueCents);
  const errorId = `candidate-slot-${slot.slotKey}-error`;

  return (
    <div
      className={`${styles.compactSlot} ${styles[`slot_${slot.occupantKind}`]}`}
      data-slot-key={slot.slotKey}
    >
      <div className={styles.compactSlotKey}>
        <strong>{slot.slotKey}</strong>
        <span>
          {slot.slotGroup === "F"
            ? "F"
            : slot.slotGroup === "D"
              ? "D"
              : "Bench"}
        </span>
      </div>

      <div className={styles.compactPlayerField}>
        {rowEditable ? (
          <EligiblePlayerSearch
            buildQueryOptions={buildEligibleQueryOptions}
            value={playerName}
            selectedPlayerId={draft?.playerId || null}
            inputLabel={`${slot.slotKey} player name`}
            disabled={busy}
            describedBy={rowError ? errorId : undefined}
            invalid={Boolean(rowError)}
            onInputChange={(nextName) =>
              onDraftChange({ playerId: null, playerName: nextName })
            }
            onSelect={(selectedPlayer) => {
              if (!selectedPlayer) return;
              onDraftChange({
                playerId: selectedPlayer.player.playerId,
                playerName: selectedPlayer.player.fullName,
              });
            }}
          />
        ) : (
          <>
            <input
              aria-label={`${slot.slotKey} player name`}
              className={styles.compactReadOnlyField}
              readOnly
              value={playerName}
            />
            {playerName && (
              <span className={styles.visuallyHidden}>{playerName}</span>
            )}
          </>
        )}
      </div>

      <input
        aria-describedby={rowError ? errorId : undefined}
        aria-invalid={rowError ? true : undefined}
        aria-label={`${slot.slotKey} AAV`}
        className={`${styles.compactCostField} ${
          !rowEditable ? styles.compactReadOnlyField : ""
        }`}
        disabled={busy && rowEditable}
        inputMode="decimal"
        min={rowEditable ? "1" : undefined}
        step={rowEditable ? "0.25" : undefined}
        placeholder={rowEditable ? "AAV" : ""}
        readOnly={!rowEditable}
        value={aav}
        onChange={
          rowEditable
            ? (event) => onDraftChange({ aav: event.target.value })
            : undefined
        }
      />

      {rowEditable ? (
        <select
          aria-describedby={rowError ? errorId : undefined}
          aria-invalid={rowError ? true : undefined}
          aria-label={`${slot.slotKey} term`}
          disabled={busy}
          className={styles.compactTermField}
          value={term}
          onChange={(event) =>
            onDraftChange({ termYears: event.target.value })
          }
        >
          <option value="">Term</option>
          <option value="1">1 year</option>
          <option value="2">2 years</option>
          <option value="3">3 years</option>
        </select>
      ) : (
        <input
          aria-label={`${slot.slotKey} term`}
          className={`${styles.compactTermField} ${styles.compactReadOnlyField}`}
          readOnly
          value={term}
        />
      )}

      <input
        aria-label={`${slot.slotKey} total contract value`}
        className={`${styles.compactTotalField} ${styles.compactReadOnlyField}`}
        readOnly
        value={total}
      />

      <span
        className={`${styles.compactSlotState} ${styles[`compactSlotState_${state.kind}`]}`}
      >
        {StateIcon && <StateIcon aria-hidden="true" />}
        {state.label}
      </span>

      {rowError && (
        <p id={errorId} className={styles.compactRowError} role="alert">
          {rowError}
        </p>
      )}
    </div>
  );
}
