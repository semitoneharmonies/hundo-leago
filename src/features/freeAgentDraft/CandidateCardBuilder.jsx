import { useCallback, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { StatusBadge, Surface } from "../../components/HundoUi.jsx";
import { createIdempotencyKey } from "../../shared/api/idempotency.js";
import { leagueDateTime } from "../../shared/hundoFormat.js";
import {
  addCandidateCardCandidate,
  editCandidateCardCandidate,
  moveCandidateCardEntry,
  previewCandidateCardRevision,
  removeCandidateCardCandidate,
  requestCandidateCardHelp,
} from "./freeAgentDraftApi.js";
import { CandidateSlot } from "./CandidateSlot.jsx";
import { EligiblePlayerSearch } from "./EligiblePlayerSearch.jsx";
import styles from "./FreeAgentDraftPage.module.css";

function money(cents) {
  if (!Number.isSafeInteger(cents)) return "Not available";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function centsInput(cents) {
  return Number.isSafeInteger(cents) ? (cents / 100).toFixed(2) : "";
}

function parseCents(value) {
  const normalized = String(value).trim();
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

function actionScope(type) {
  return `candidate-${type}`;
}

function focusSlot(slotKey) {
  globalThis.requestAnimationFrame?.(() => {
    document.getElementById(`candidate-slot-${slotKey}`)?.focus();
  });
}

function cardWarning(card) {
  if (card.allocationEligibility === "excluded_structural_conflict") {
    return "This card has a carried-roster structural conflict. If it remains when cards lock, every new Candidate offer will be excluded.";
  }
  if (card.allocationEligibility === "excluded_over_cap") {
    return "This card is over the Candidate cap projection. If it remains over cap when cards lock, every new Candidate offer will be excluded.";
  }
  if (
    card.completeness.code === "incomplete" &&
    card.capStatus === "compliant"
  ) {
    return "The card is incomplete, but each individually valid filled offer will still participate if the card remains free of structural conflicts and within cap.";
  }
  return null;
}

function editorTitle(editor) {
  if (editor.type === "add") {
    return `Add a candidate to ${editor.slot.slotKey}`;
  }
  if (editor.type === "edit") {
    return `Edit ${editor.slot.player.fullName}`;
  }
  if (editor.type === "move") {
    return `Move ${editor.slot.player.fullName}`;
  }
  return `Remove ${editor.slot.player.fullName}`;
}

function initialEditor(type, slot) {
  return {
    type,
    slot,
    selectedPlayer: null,
    totalValue: type === "edit" ? centsInput(slot.totalValueCents) : "",
    termYears: type === "edit" ? String(slot.termYears) : "1",
    destinationSlotKey: "",
  };
}

export function CandidateCardBuilder({
  card,
  httpClient,
  timeZone,
  buildEligibleQueryOptions,
  onAuthoritativeCard,
  onProtectedFailure,
}) {
  const [editor, setEditor] = useState(null);
  const [preview, setPreview] = useState(null);
  const [intentKey, setIntentKey] = useState(null);
  const [formError, setFormError] = useState("");
  const [helpError, setHelpError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [helpMessage, setHelpMessage] = useState("");

  const eligibleOptions = useCallback(
    (filters) =>
      buildEligibleQueryOptions(editor?.slot.slotKey || "F01", filters),
    [buildEligibleQueryOptions, editor?.slot.slotKey]
  );

  function clearPreview() {
    setPreview(null);
    setIntentKey(null);
    setFormError("");
    setStatusMessage("");
  }

  function updateEditor(patch) {
    setEditor((current) => ({ ...current, ...patch }));
    clearPreview();
  }

  function openEditor(type, slot) {
    setEditor(initialEditor(type, slot));
    setPreview(null);
    setIntentKey(null);
    setFormError("");
    setStatusMessage("");
  }

  function closeEditor() {
    const slotKey = editor?.slot.slotKey;
    setEditor(null);
    setPreview(null);
    setIntentKey(null);
    setFormError("");
    if (slotKey) focusSlot(slotKey);
  }

  function buildAction() {
    if (!editor) return null;
    if (editor.type === "remove") {
      return { type: "remove", entryId: editor.slot.entryId };
    }
    if (editor.type === "move") {
      if (!editor.destinationSlotKey) {
        setFormError("Choose a destination slot.");
        return null;
      }
      return {
        type: "move",
        entryId: editor.slot.entryId,
        slotKey: editor.destinationSlotKey,
      };
    }
    const totalValueCents = parseCents(editor.totalValue);
    const termYears = Number(editor.termYears);
    if (totalValueCents === null) {
      setFormError("Enter a positive total contract value with no more than two decimal places.");
      return null;
    }
    if (![1, 2, 3].includes(termYears)) {
      setFormError("Choose a term of one, two, or three years.");
      return null;
    }
    if (editor.type === "add") {
      if (!editor.selectedPlayer) {
        setFormError("Choose an eligible player.");
        return null;
      }
      return {
        type: "add",
        slotKey: editor.slot.slotKey,
        playerId: editor.selectedPlayer.player.playerId,
        totalValueCents,
        termYears,
      };
    }
    return {
      type: "edit",
      entryId: editor.slot.entryId,
      totalValueCents,
      termYears,
    };
  }

  const previewMutation = useMutation({
    mutationFn: (action) =>
      previewCandidateCardRevision(
        httpClient,
        card.leagueId,
        card.fadId,
        card.teamId,
        action
      ),
    onSuccess: (result, action) => {
      try {
        setIntentKey(createIdempotencyKey(actionScope(action.type)));
      } catch (error) {
        setPreview(null);
        setFormError(error.message);
        return;
      }
      setPreview(result);
      setFormError("");
      setStatusMessage("Preview ready. Review the server projection before applying it.");
    },
    onError: (error) => {
      setPreview(null);
      setIntentKey(null);
      setFormError(error.message || "The revision preview could not be prepared.");
      onProtectedFailure?.(error);
    },
  });

  const commandMutation = useMutation({
    mutationFn: async ({ action, idempotencyKey }) => {
      const options = {
        version: card.cardVersion,
        idempotencyKey,
      };
      if (action.type === "add") {
        return addCandidateCardCandidate(
          httpClient,
          card.leagueId,
          card.fadId,
          card.teamId,
          action.slotKey,
          {
            playerId: action.playerId,
            totalValueCents: action.totalValueCents,
            termYears: action.termYears,
          },
          options
        );
      }
      if (action.type === "edit") {
        return editCandidateCardCandidate(
          httpClient,
          card.leagueId,
          card.fadId,
          card.teamId,
          action.entryId,
          {
            totalValueCents: action.totalValueCents,
            termYears: action.termYears,
          },
          options
        );
      }
      if (action.type === "move") {
        return moveCandidateCardEntry(
          httpClient,
          card.leagueId,
          card.fadId,
          card.teamId,
          action.entryId,
          { slotKey: action.slotKey },
          options
        );
      }
      return removeCandidateCardCandidate(
        httpClient,
        card.leagueId,
        card.fadId,
        card.teamId,
        action.entryId,
        options
      );
    },
    onSuccess: (result, { action }) => {
      const originalSlotKey = editor?.slot.slotKey;
      const changedSlot = result.changedEntryId
        ? result.card.slots.find(
            (slot) => slot.entryId === result.changedEntryId
          )
        : null;
      setEditor(null);
      setPreview(null);
      setIntentKey(null);
      setFormError("");
      setStatusMessage("Candidate Card updated from the authoritative server response.");
      onAuthoritativeCard(result.card);
      focusSlot(changedSlot?.slotKey || action.slotKey || originalSlotKey);
    },
    onError: (error) => {
      if (
        error.status === 412 ||
        error.code === "CANDIDATE_CARD_PRECONDITION_FAILED"
      ) {
        setPreview(null);
        setIntentKey(null);
        setFormError(
          "This card changed before your update was applied. Your safe form values are still here. Review the refreshed card, preview again, and then resubmit."
        );
      } else {
        setFormError(error.message || "The Candidate Card could not be updated.");
      }
      onProtectedFailure?.(error);
    },
  });

  const helpMutation = useMutation({
    mutationFn: ({ message, idempotencyKey }) =>
      requestCandidateCardHelp(
        httpClient,
        card.leagueId,
        card.fadId,
        card.teamId,
        { message: message || null },
        { idempotencyKey }
      ),
    onSuccess: (result) => {
      setHelpMessage("");
      setHelpError("");
      setStatusMessage(
        `Commissioner help is available for this card until ${leagueDateTime(
          result.expiresAtMs,
          timeZone
        )}.`
      );
      onAuthoritativeCard(null);
    },
    onError: (error) => {
      setHelpError(error.message || "The help request could not be sent.");
      onProtectedFailure?.(error);
    },
  });

  function requestPreview(event) {
    event.preventDefault();
    const action = buildAction();
    if (!action) return;
    setFormError("");
    previewMutation.mutate(action);
  }

  function applyPreview() {
    if (!preview || !intentKey) return;
    commandMutation.mutate({ action: preview.action, idempotencyKey: intentKey });
  }

  function requestHelp(event) {
    event.preventDefault();
    setHelpError("");
    let idempotencyKey;
    try {
      idempotencyKey = createIdempotencyKey("candidate-help");
    } catch (error) {
      setHelpError(error.message);
      return;
    }
    const message = helpMessage.trim();
    helpMutation.mutate({ message, idempotencyKey });
  }

  const warning = cardWarning(card);
  const slotsByGroup = useMemo(
    () => ({
      F: card.slots.filter(({ slotGroup }) => slotGroup === "F"),
      D: card.slots.filter(({ slotGroup }) => slotGroup === "D"),
      B: card.slots.filter(({ slotGroup }) => slotGroup === "B"),
    }),
    [card.slots]
  );
  const busy =
    previewMutation.isPending ||
    commandMutation.isPending ||
    helpMutation.isPending;

  return (
    <div className={styles.cardLayout}>
      <div className={styles.slots}>
        {warning && (
          <p className={styles.warning} role="status">
            <strong>Candidate Card warning:</strong> {warning}
          </p>
        )}
        {statusMessage && (
          <p className={styles.success} role="status">
            {statusMessage}
          </p>
        )}
        {formError && !editor && (
          <p className={styles.error} role="alert">
            {formError}
          </p>
        )}

        {[
          ["F", "Forwards", "12 mandatory slots"],
          ["D", "Defence", "6 mandatory slots"],
          ["B", "Bench", "4 optional neutral slots"],
        ].map(([group, title, description]) => (
          <section
            className={styles.slotGroup}
            aria-labelledby={`candidate-${group}-slots`}
            key={group}
          >
            <div className={styles.panelHeader}>
              <h2 id={`candidate-${group}-slots`}>{title}</h2>
              <span className={styles.muted}>{description}</span>
            </div>
            <div className={styles.slotGrid}>
              {slotsByGroup[group].map((slot) => (
                <CandidateSlot
                  key={slot.slotKey}
                  slot={slot}
                  busy={busy}
                  onAdd={(selectedSlot) => openEditor("add", selectedSlot)}
                  onEdit={(selectedSlot) => openEditor("edit", selectedSlot)}
                  onMove={(selectedSlot) => openEditor("move", selectedSlot)}
                  onRemove={(selectedSlot) => openEditor("remove", selectedSlot)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <aside className={styles.sideRail} aria-label="Candidate Card controls">
        <Surface className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className="hl-eyebrow">Authoritative projection</p>
              <h2>Card status</h2>
            </div>
            <StatusBadge
              tone={
                card.allocationEligibility === "eligible"
                  ? "success"
                  : "warning"
              }
            >
              {card.allocationEligibility === "eligible"
                ? "Allocation eligible"
                : "Offers at risk"}
            </StatusBadge>
          </div>
          <dl className={styles.contractSummary}>
            <div>
              <dt>Maximum cap use</dt>
              <dd>{money(card.capProjection.maximumPossibleCapCents)}</dd>
            </div>
            <div>
              <dt>Cap limit</dt>
              <dd>{money(card.capProjection.capLimitCents)}</dd>
            </div>
            <div>
              <dt>Mandatory missing</dt>
              <dd>{card.completeness.missingMandatoryCount}</dd>
            </div>
          </dl>
          <p>
            Cap status: <strong>{card.capStatus === "compliant" ? "Within cap" : "Over cap"}</strong>.
            These values come from the server and are not recalculated here.
          </p>
        </Surface>

        {editor && (
          <Surface
            className={`${styles.panel} ${styles.editor}`}
            aria-labelledby="candidate-editor-title"
          >
            <div className={styles.panelHeader}>
              <h2 id="candidate-editor-title">{editorTitle(editor)}</h2>
              <button
                type="button"
                className="hl-button hl-button--quiet"
                disabled={busy}
                onClick={closeEditor}
              >
                Close
              </button>
            </div>

            <form
              aria-labelledby="candidate-editor-title"
              aria-describedby={formError ? "candidate-editor-error" : undefined}
              onSubmit={requestPreview}
            >
              {editor.type === "add" && (
                <EligiblePlayerSearch
                  key={editor.slot.slotKey}
                  buildQueryOptions={eligibleOptions}
                  selectedPlayerId={
                    editor.selectedPlayer?.player.playerId || null
                  }
                  onSelect={(selectedPlayer) =>
                    updateEditor({ selectedPlayer })
                  }
                />
              )}

              {(editor.type === "add" || editor.type === "edit") && (
                <div className={styles.fieldGroup}>
                  <label>
                    Total contract value (CAD dollars)
                    <input
                      inputMode="decimal"
                      value={editor.totalValue}
                      aria-describedby={formError ? "candidate-editor-error" : undefined}
                      onChange={(event) =>
                        updateEditor({ totalValue: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Contract term
                    <select
                      value={editor.termYears}
                      aria-describedby={formError ? "candidate-editor-error" : undefined}
                      onChange={(event) =>
                        updateEditor({ termYears: event.target.value })
                      }
                    >
                      <option value="1">1 year</option>
                      <option value="2">2 years</option>
                      <option value="3">3 years</option>
                    </select>
                  </label>
                  {editor.selectedPlayer && (
                    <p className={styles.muted}>
                      Server limits: minimum total is {money(
                        editor.selectedPlayer.contractLimits
                          .minimumTotalValueCentsByTerm[editor.termYears]
                      )} for this term
                      {editor.selectedPlayer.contractLimits.maximumBenchAavCents
                        ? `; Bench AAV limit is ${money(
                            editor.selectedPlayer.contractLimits.maximumBenchAavCents
                          )}`
                        : ""}.
                    </p>
                  )}
                </div>
              )}

              {editor.type === "move" && (
                <label className={styles.fieldGroup}>
                  Destination slot
                  <select
                    value={editor.destinationSlotKey}
                    aria-describedby={formError ? "candidate-editor-error" : undefined}
                    onChange={(event) =>
                      updateEditor({ destinationSlotKey: event.target.value })
                    }
                  >
                    <option value="">Choose a slot</option>
                    {card.slots
                      .filter(({ slotKey }) => slotKey !== editor.slot.slotKey)
                      .map((slot) => (
                        <option key={slot.slotKey} value={slot.slotKey}>
                          {slot.slotKey} · {slot.occupantKind === "empty" ? "empty" : "occupied"}
                        </option>
                      ))}
                  </select>
                </label>
              )}

              {editor.type === "remove" && (
                <p>
                  Preview removing <strong>{editor.slot.player.fullName}</strong> from
                  this Candidate Card. Nothing changes until you apply the preview.
                </p>
              )}

              {formError && (
                <p id="candidate-editor-error" className={styles.error} role="alert">
                  {formError}
                </p>
              )}

              <div className={styles.editorActions}>
                <button
                  type="submit"
                  className="hl-button hl-button--secondary"
                  disabled={busy}
                >
                  {previewMutation.isPending ? "Preparing preview…" : "Preview change"}
                </button>
              </div>
            </form>

            {preview && (
              <section className={styles.preview} aria-labelledby="candidate-preview-title">
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
                  className={
                    editor.type === "remove"
                      ? "hl-button hl-button--danger"
                      : "hl-button hl-button--primary"
                  }
                  disabled={commandMutation.isPending}
                  onClick={applyPreview}
                >
                  {commandMutation.isPending ? "Applying…" : "Apply reviewed change"}
                </button>
              </section>
            )}
          </Surface>
        )}

        {card.capabilities.requestHelp.allowed && (
          <Surface
            className={styles.panel}
            as="section"
            aria-labelledby="candidate-help-title"
          >
            <h2 id="candidate-help-title">Ask the commissioner for help</h2>
            <p>
              This grants the current commissioner view-and-edit access only to
              this card until the deadline.
            </p>
            <form
              className={styles.editor}
              aria-labelledby="candidate-help-title"
              aria-describedby={helpError ? "candidate-help-error" : undefined}
              onSubmit={requestHelp}
            >
              <label>
                Private message (optional)
                <textarea
                  rows="4"
                  maxLength={500}
                  value={helpMessage}
                  aria-describedby={helpError ? "candidate-help-error" : undefined}
                  onChange={(event) => {
                    setHelpMessage(event.target.value);
                    setHelpError("");
                  }}
                />
              </label>
              {helpError && (
                <p id="candidate-help-error" className={styles.error} role="alert">
                  {helpError}
                </p>
              )}
              <button
                type="submit"
                className="hl-button hl-button--secondary"
                disabled={helpMutation.isPending}
              >
                {helpMutation.isPending ? "Sending request…" : "Request commissioner help"}
              </button>
            </form>
          </Surface>
        )}

        {card.helpContext && (
          <Surface className={styles.panel}>
            <h2>Commissioner help</h2>
            <StatusBadge tone={card.helpContext.status === "active" ? "success" : "neutral"}>
              {card.helpContext.status === "active" ? "Active" : "Expired"}
            </StatusBadge>
            <p>{card.helpContext.message || "No private message was included."}</p>
            <small>
              Requested by {card.helpContext.requestedByDisplayName}
            </small>
          </Surface>
        )}
      </aside>
    </div>
  );
}
