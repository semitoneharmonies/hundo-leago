import {
  ArrowRightLeft,
  LockKeyhole,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { PositionTag, StatusBadge } from "../../components/HundoUi.jsx";
import styles from "./FreeAgentDraftPage.module.css";

function money(cents) {
  if (!Number.isSafeInteger(cents)) return "Not set";
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
  onAdd,
  onEdit,
  onMove,
  onRemove,
}) {
  const titleId = `candidate-slot-${slot.slotKey}-title`;
  const isEmpty = slot.occupantKind === "empty";
  const isCarryover = slot.occupantKind === "carryover";
  const canMove =
    slot.capabilities.moveCandidate.allowed ||
    slot.capabilities.moveCarryover.allowed;

  return (
    <article
      id={`candidate-slot-${slot.slotKey}`}
      className={`${styles.slot} ${styles[`slot_${slot.occupantKind}`]}`}
      aria-labelledby={titleId}
      tabIndex={-1}
      data-slot-key={slot.slotKey}
    >
      <header className={styles.slotHeader}>
        <div>
          <span className={styles.slotKey}>{slot.slotKey}</span>
          <h3 id={titleId}>
            {slot.slotGroup === "F"
              ? "Forward"
              : slot.slotGroup === "D"
                ? "Defence"
                : "Bench"}
          </h3>
        </div>
        <div className={styles.badges}>
          <StatusBadge tone={slot.required ? "warning" : "neutral"}>
            {slot.required ? "Mandatory" : "Optional"}
          </StatusBadge>
          {isCarryover && (
            <StatusBadge tone="neutral">
              <LockKeyhole aria-hidden="true" /> Locked carryover
            </StatusBadge>
          )}
        </div>
      </header>

      {isEmpty ? (
        <div className={styles.emptySlot}>
          <p>Empty {slot.required ? "mandatory" : "optional"} slot</p>
          {slot.capabilities.addCandidate.allowed && (
            <button
              type="button"
              className="hl-button hl-button--primary"
              disabled={busy}
              onClick={() => onAdd(slot)}
            >
              <Plus aria-hidden="true" /> Add candidate
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={styles.playerLine}>
            <PositionTag
              position={slot.player.positionGroup}
              category={
                isCarryover
                  ? slot.authoritativeRosterCategory
                  : "Free Agent"
              }
            />
            <div>
              <strong>{slot.player.fullName}</strong>
              <span>
                {isCarryover
                  ? `${slot.authoritativeRosterCategory} · ${slot.remainingYears} ${
                      slot.remainingYears === 1 ? "year" : "years"
                    } remaining`
                  : "Free-agent candidate"}
              </span>
            </div>
          </div>

          <dl className={styles.contractSummary}>
            <div>
              <dt>Total value</dt>
              <dd>{money(slot.totalValueCents)}</dd>
            </div>
            <div>
              <dt>Term</dt>
              <dd>
                {slot.termYears} {slot.termYears === 1 ? "year" : "years"}
              </dd>
            </div>
            <div>
              <dt>AAV</dt>
              <dd>{money(slot.aavCents)}</dd>
            </div>
          </dl>

          <div className={styles.slotStatus}>
            <StatusBadge tone={validationTone(slot.validation.status)}>
              {slot.validation.status === "valid"
                ? "Valid"
                : slot.validation.status === "warning"
                  ? "Needs attention"
                  : "Invalid offer"}
            </StatusBadge>
            {slot.validation.codes.length > 0 && (
              <span>{slot.validation.codes.join(", ").replaceAll("_", " ")}</span>
            )}
          </div>

          {slot.outcome && (
            <p className={styles.outcome}>
              <strong>Outcome:</strong> {outcomeLabel(slot.outcome.code)}
            </p>
          )}

          {(slot.capabilities.editCandidate.allowed ||
            canMove ||
            slot.capabilities.removeCandidate.allowed) && (
            <div
              className={styles.slotActions}
              role="group"
              aria-label={`${slot.player.fullName} actions`}
            >
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
          )}
        </>
      )}
    </article>
  );
}
