import {
  ArrowRightLeft,
  LockKeyhole,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { StatusBadge } from "../../components/HundoUi.jsx";
import styles from "./FreeAgentDraftPage.module.css";

function money(cents) {
  if (!Number.isSafeInteger(cents)) return "";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function outcomeLabel(code) {
  return {
    carryover: "Carried to the new season",
    automatic_win: "Automatic allocation won",
    automatic_loss: "Automatic allocation not won",
    restricted_pending: "Restricted tie auction pending",
    restricted_win: "Restricted tie auction won",
    restricted_loss: "Restricted tie auction not won",
    fallback_pending: "League-wide fallback auction pending",
    fallback_win: "Fallback auction won",
    fallback_loss: "Fallback auction not won",
    fallback_no_winner: "Fallback auction closed without a winner",
    invalid_offer: "Offer was ineligible at locking",
    no_offer: "No offer submitted",
  }[code] || "Result pending";
}

function validationTone(status) {
  if (status === "valid") return "success";
  if (status === "warning") return "warning";
  if (status === "invalid") return "danger";
  return "neutral";
}

export function CandidateSlot({
  slot,
  busy = false,
  editor = null,
  editorLabel = "",
  eligiblePlayerSearch = null,
  formError = "",
  preview = null,
  previewPending = false,
  commandPending = false,
  onEditorChange,
  onPreview,
  onApplyPreview,
  onCloseEditor,
  onAdd,
  onEdit,
  onMove,
  onRemove,
}) {
  const titleId = `candidate-slot-${slot.slotKey}-title`;
  const isEmpty = slot.occupantKind === "empty";
  const isCarryover = slot.occupantKind === "carryover";
  const canAdd = isEmpty && slot.capabilities.addCandidate.allowed;
  const canMove =
    slot.capabilities.moveCandidate.allowed ||
    slot.capabilities.moveCarryover.allowed;
  const playerValue = isEmpty ? "" : slot.player.fullName;
  const moneyValue = isEmpty
    ? ""
    : isCarryover
      ? `${money(slot.aavCents)} AAV`
      : `${money(slot.totalValueCents)} total`;
  const yearsValue = isEmpty
    ? ""
    : String(isCarryover ? slot.remainingYears : slot.termYears);
  const isInlineEditor =
    editor && ["add", "edit"].includes(editor.type);

  if (isInlineEditor) {
    return (
      <form
        id={`candidate-slot-${slot.slotKey}`}
        className={`${styles.slot} ${styles.slotEditor}`}
        aria-label={editorLabel}
        aria-describedby={formError ? "candidate-editor-error" : undefined}
        data-slot-key={slot.slotKey}
        onSubmit={onPreview}
      >
        <header className={styles.slotHeader}>
          <span className={styles.slotKey}>{slot.slotKey}</span>
          <h3>{editor.type === "add" ? "New candidate" : "Edit candidate"}</h3>
        </header>

        {editor.type === "add" ? (
          eligiblePlayerSearch
        ) : (
          <label className={styles.slotField}>
            <span>Player</span>
            <input readOnly value={slot.player.fullName} />
          </label>
        )}

        <label className={styles.slotField}>
          <span>Total value</span>
          <input
            aria-label="Total contract value (CAD dollars)"
            aria-describedby={formError ? "candidate-editor-error" : undefined}
            inputMode="decimal"
            placeholder="0.00"
            value={editor.totalValue}
            onChange={(event) =>
              onEditorChange({ totalValue: event.target.value })
            }
          />
        </label>

        <label className={styles.slotField}>
          <span>Years</span>
          <select
            aria-label="Contract term"
            aria-describedby={formError ? "candidate-editor-error" : undefined}
            value={editor.termYears}
            onChange={(event) =>
              onEditorChange({ termYears: event.target.value })
            }
          >
            <option value="1">1 year</option>
            <option value="2">2 years</option>
            <option value="3">3 years</option>
          </select>
        </label>

        <div className={styles.slotActions}>
          <button
            type="submit"
            className="hl-button hl-button--primary"
            disabled={busy}
          >
            {previewPending ? "Preparing preview…" : "Preview change"}
          </button>
          <button
            type="button"
            className="hl-button hl-button--quiet"
            disabled={busy}
            onClick={onCloseEditor}
          >
            Close
          </button>
        </div>

        {formError && (
          <p
            id="candidate-editor-error"
            className={`${styles.error} ${styles.inlineEditorMessage}`}
            role="alert"
          >
            {formError}
          </p>
        )}

        {preview && (
          <section
            className={`${styles.preview} ${styles.inlineEditorMessage}`}
            aria-labelledby="candidate-preview-title"
          >
            <h3 id="candidate-preview-title">Server revision preview</h3>
            <p>
              Projected card version {preview.projectedCard.cardVersion}. Maximum
              possible cap use: {money(
                preview.projectedCard.capProjection.maximumPossibleCapCents
              )}.
            </p>
            {preview.warnings.length > 0 && (
              <ul className={styles.diagnostics}>
                {preview.warnings.map((diagnostic) => (
                  <li key={`${diagnostic.code}:${diagnostic.resourceId || "card"}`}>
                    {diagnostic.message}
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              className="hl-button hl-button--primary"
              disabled={commandPending}
              onClick={onApplyPreview}
            >
              {commandPending ? "Applying…" : "Apply reviewed change"}
            </button>
          </section>
        )}
      </form>
    );
  }

  function openEmptyEditor() {
    if (canAdd && !busy) onAdd(slot);
  }

  return (
    <article
      id={`candidate-slot-${slot.slotKey}`}
      className={`${styles.slot} ${styles[`slot_${slot.occupantKind}`]}`}
      aria-labelledby={titleId}
      tabIndex={-1}
      data-slot-key={slot.slotKey}
    >
      <header className={styles.slotHeader}>
        <span className={styles.slotKey}>{slot.slotKey}</span>
        <h3 id={titleId}>
          {slot.slotGroup === "F"
            ? "Forward"
            : slot.slotGroup === "D"
              ? "Defence"
              : "Bench"}
        </h3>
        {isCarryover && (
          <StatusBadge tone="neutral">
            <LockKeyhole aria-hidden="true" /> Locked carryover
          </StatusBadge>
        )}
      </header>

      <label className={styles.slotField}>
        <span>Player</span>
        <input
          aria-label={`${slot.slotKey} player`}
          autoComplete="off"
          placeholder={canAdd ? "Search eligible players" : "No player"}
          readOnly
          value={playerValue}
          onClick={isEmpty ? openEmptyEditor : undefined}
          onFocus={isEmpty ? openEmptyEditor : undefined}
        />
        {!isEmpty && (
          <span className={styles.visuallyHidden} aria-hidden="true">
            {playerValue}
          </span>
        )}
      </label>

      <label className={styles.slotField}>
        <span>{isCarryover ? "AAV" : "Total value"}</span>
        <input
          aria-label={`${slot.slotKey} ${isCarryover ? "AAV" : "total value"}`}
          inputMode="decimal"
          placeholder={canAdd ? "$0.00" : "Not set"}
          readOnly
          value={moneyValue}
          onClick={isEmpty ? openEmptyEditor : undefined}
        />
      </label>

      <label className={styles.slotField}>
        <span>Years</span>
        <input
          aria-label={`${slot.slotKey} years`}
          placeholder={canAdd ? "1, 2, or 3" : "—"}
          readOnly
          value={yearsValue}
          onClick={isEmpty ? openEmptyEditor : undefined}
        />
      </label>

      <div
        className={styles.slotActions}
        role="group"
        aria-label={`${isEmpty ? slot.slotKey : slot.player.fullName} actions`}
      >
        {canAdd && (
          <button
            type="button"
            className="hl-button hl-button--primary"
            disabled={busy}
            onClick={() => onAdd(slot)}
          >
            <Plus aria-hidden="true" /> Add candidate
          </button>
        )}
        {slot.capabilities.editCandidate.allowed && (
          <button
            type="button"
            className="hl-button hl-button--secondary"
            disabled={busy}
            onClick={() => onEdit(slot)}
          >
            <Pencil aria-hidden="true" /> Edit contract
          </button>
        )}
        {canMove && (
          <button
            type="button"
            className="hl-button hl-button--secondary"
            disabled={busy}
            onClick={() => onMove(slot)}
          >
            <ArrowRightLeft aria-hidden="true" /> Move
          </button>
        )}
        {slot.capabilities.removeCandidate.allowed && (
          <button
            type="button"
            className="hl-button hl-button--danger"
            disabled={busy}
            onClick={() => onRemove(slot)}
          >
            <Trash2 aria-hidden="true" /> Remove
          </button>
        )}
      </div>

      {!isEmpty && (
        <div className={styles.slotMeta}>
          <StatusBadge tone={validationTone(slot.validation.status)}>
            {slot.validation.status === "valid"
              ? "Valid"
              : slot.validation.status === "warning"
                ? "Needs attention"
                : "Invalid offer"}
          </StatusBadge>
          <span>
            {isCarryover
              ? `${slot.authoritativeRosterCategory} · ${slot.remainingYears} ${
                  slot.remainingYears === 1 ? "year" : "years"
                } remaining`
              : "Free-agent candidate"}
          </span>
          {slot.outcome && <span>Outcome: {outcomeLabel(slot.outcome.code)}</span>}
        </div>
      )}
    </article>
  );
}
