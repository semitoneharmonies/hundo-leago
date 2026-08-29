import { useCallback, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { ErrorBlock, StatusBadge, Surface } from "../../components/HundoUi.jsx";
import { createIdempotencyKey } from "../../shared/api/idempotency.js";
import { leagueDateTime } from "../../shared/hundoFormat.js";
import {
  requestCandidateCardHelp,
  saveCandidateCard,
} from "./freeAgentDraftApi.js";
import { CandidateSlot } from "./CandidateSlot.jsx";
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
    return "Incomplete rows are saved as drafts. Only rows with a valid player, cost, and term participate when the card locks.";
  }
  return null;
}

function draftRows(card) {
  return Object.fromEntries(
    card.slots.map((slot) => [
      slot.slotKey,
      slot.occupantKind === "candidate"
        ? {
            playerId: slot.player.playerId,
            playerName: slot.player.fullName,
            aav: centsInput(slot.aavCents),
            termYears:
              slot.termYears === null ? "" : String(slot.termYears),
          }
        : {
            playerId: null,
            playerName: "",
            aav: "",
            termYears: "",
          },
    ])
  );
}

function mergeTouchedDraftRows(card, currentDrafts, touchedSlots) {
  const merged = draftRows(card);
  for (const slotKey of touchedSlots) {
    if (currentDrafts[slotKey]) {
      merged[slotKey] = currentDrafts[slotKey];
    }
  }
  return merged;
}

function focusFirstInvalidRow(slotKey) {
  const focus = () =>
    document
      .querySelector(
        `[data-slot-key="${slotKey}"] [aria-invalid="true"]`
      )
      ?.focus();
  if (typeof globalThis.requestAnimationFrame === "function") {
    globalThis.requestAnimationFrame(focus);
  } else {
    focus();
  }
}

function wholeCardInput(card, drafts) {
  const errors = {};
  const aavErrors = {};
  const usedPlayers = new Map();
  let proposedActiveAavCents = 0;
  const slots = card.slots.map((slot) => {
    if (slot.occupantKind === "carryover" || slot.locked) {
      return { slotKey: slot.slotKey, candidate: null };
    }

    const draft = drafts[slot.slotKey];
    const playerName = draft.playerName.trim();
    const aav = draft.aav.trim();
    const termYears = draft.termYears;
    const hasAnyValue = playerName !== "" || aav !== "" || termYears !== "";
    if (!hasAnyValue) {
      return { slotKey: slot.slotKey, candidate: null };
    }

    const aavCents = aav === "" ? null : parseCents(aav);
    if (
      aav !== "" &&
      (aavCents === null || aavCents < 100 || aavCents % 25 !== 0)
    ) {
      aavErrors[slot.slotKey] =
        "AAV must be at least $1.00 and use whole-dollar or 25-cent increments.";
    }

    if (!draft.playerId) {
      errors[slot.slotKey] =
        "Choose a player from the suggestions, or clear this row.";
      return { slotKey: slot.slotKey, candidate: null };
    }

    if (aav !== "") {
      if (aavErrors[slot.slotKey]) {
        errors[slot.slotKey] = aavErrors[slot.slotKey];
      } else if (slot.slotGroup === "B" && aavCents > 400) {
        errors[slot.slotKey] = "Bench AAV cannot exceed $4.00.";
      } else if (slot.slotGroup === "F" || slot.slotGroup === "D") {
        proposedActiveAavCents += aavCents;
      }
    }

    const parsedTerm = termYears === "" ? null : Number(termYears);
    if (parsedTerm !== null && ![1, 2, 3].includes(parsedTerm)) {
      errors[slot.slotKey] = "Term must be one, two, or three years.";
    }

    const duplicateSlot = usedPlayers.get(draft.playerId);
    if (duplicateSlot) {
      errors[duplicateSlot] = "A player may appear only once on the card.";
      errors[slot.slotKey] = "A player may appear only once on the card.";
    } else {
      usedPlayers.set(draft.playerId, slot.slotKey);
    }

    return {
      slotKey: slot.slotKey,
      candidate: {
        playerId: draft.playerId,
        aavCents,
        termYears: parsedTerm,
      },
    };
  });

  const projectedCapCents =
    card.capProjection.carriedCapUsageCents + proposedActiveAavCents;
  const capError =
    projectedCapCents > card.capProjection.capLimitCents
      ? `Projected cap use is ${money(projectedCapCents)}, above the ${money(
          card.capProjection.capLimitCents
        )} limit.`
      : "";

  return {
    input: { slots },
    errors,
    aavErrors,
    capError,
    proposedActiveAavCents,
    projectedCapCents,
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
  const [drafts, setDrafts] = useState(() => draftRows(card));
  const [baseVersion, setBaseVersion] = useState(card.cardVersion);
  const [dirty, setDirty] = useState(false);
  const [touchedSlots, setTouchedSlots] = useState(() => new Set());
  const [rowErrors, setRowErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [helpError, setHelpError] = useState(null);
  const [helpMessage, setHelpMessage] = useState("");
  const editable =
    card.visibilityMode === "private_editable" &&
    card.capabilities.editCard.allowed;
  const cardIdentity = `${card.leagueId}:${card.seasonId}:${card.fadId}:${card.teamId}:${card.cardId}`;
  const [observedCard, setObservedCard] = useState(() => ({
    source: card,
    cardIdentity,
    cardVersion: card.cardVersion,
    editable,
  }));
  const authoritativeCardChanged =
    observedCard.source !== card ||
    observedCard.cardIdentity !== cardIdentity ||
    observedCard.cardVersion !== card.cardVersion ||
    observedCard.editable !== editable;

  if (authoritativeCardChanged) {
    const identityChanged = observedCard.cardIdentity !== cardIdentity;
    const becameReadOnly = observedCard.editable && !editable;

    setObservedCard({
      source: card,
      cardIdentity,
      cardVersion: card.cardVersion,
      editable,
    });

    // A stale save keeps the local draft dirty, but an authoritative refetch
    // must still advance the version used by the next whole-card PUT.
    setBaseVersion(card.cardVersion);

    if (identityChanged || becameReadOnly || !dirty) {
      setDrafts(draftRows(card));
    } else {
      setDrafts((current) =>
        mergeTouchedDraftRows(card, current, touchedSlots)
      );
    }

    if (identityChanged || becameReadOnly) {
      setDirty(false);
      setTouchedSlots(new Set());
      setRowErrors({});
      setFormError("");
      setStatusMessage("");
      setHelpError(null);
      setHelpMessage("");
    }
  }

  const saveMutation = useMutation({
    mutationFn: ({ input, idempotencyKey, version }) =>
      saveCandidateCard(
        httpClient,
        card.leagueId,
        card.fadId,
        card.teamId,
        input,
        { version, idempotencyKey }
      ),
    onSuccess: (result) => {
      setDrafts(draftRows(result.card));
      setBaseVersion(result.card.cardVersion);
      setDirty(false);
      setTouchedSlots(new Set());
      setRowErrors({});
      setFormError("");
      setStatusMessage(
        result.changedEntryIds.length === 0
          ? "Candidate Card saved. No rows changed."
          : `Candidate Card saved. ${result.changedEntryIds.length} ${
              result.changedEntryIds.length === 1 ? "row" : "rows"
            } changed.`
      );
      onAuthoritativeCard(result.card);
    },
    onError: (error) => {
      if (
        error.status === 412 ||
        error.code === "CANDIDATE_CARD_PRECONDITION_FAILED"
      ) {
        setFormError(
          "This card changed before your save was applied. Your entries are still here. Review the refreshed card and save again."
        );
      } else {
        setFormError("The Candidate Card could not be saved.");
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
      setHelpError(error);
      onProtectedFailure?.(error);
    },
  });

  const slotsByGroup = useMemo(
    () => ({
      F: card.slots.filter(({ slotGroup }) => slotGroup === "F"),
      D: card.slots.filter(({ slotGroup }) => slotGroup === "D"),
      B: card.slots.filter(({ slotGroup }) => slotGroup === "B"),
    }),
    [card.slots]
  );

  const eligibleOptionsFor = useCallback(
    (slotKey) => (filters) => buildEligibleQueryOptions(slotKey, filters),
    [buildEligibleQueryOptions]
  );

  function updateDraft(slotKey, patch) {
    setDrafts((current) => {
      const nextRow = { ...current[slotKey], ...patch };
      if (
        Object.hasOwn(patch, "playerName") &&
        patch.playerName.trim() === ""
      ) {
        nextRow.playerId = null;
        nextRow.playerName = "";
        nextRow.aav = "";
        nextRow.termYears = "";
      }
      return { ...current, [slotKey]: nextRow };
    });
    setDirty(true);
    setTouchedSlots((current) => {
      if (current.has(slotKey)) return current;
      const next = new Set(current);
      next.add(slotKey);
      return next;
    });
    setStatusMessage("");
    setFormError("");
    setRowErrors((current) => {
      if (!Object.hasOwn(current, slotKey)) return current;
      const next = { ...current };
      delete next[slotKey];
      return next;
    });
  }

  function saveCard(event) {
    event.preventDefault();
    if (!editable || saveMutation.isPending) return;
    const { input, errors, capError } = wholeCardInput(card, drafts);
    if (Object.keys(errors).length > 0) {
      setRowErrors(errors);
      setFormError("Fix the highlighted rows before saving the card.");
      focusFirstInvalidRow(Object.keys(errors)[0]);
      return;
    }
    if (capError) {
      setFormError(capError);
      return;
    }
    let idempotencyKey;
    try {
      idempotencyKey = createIdempotencyKey("candidate-card-save");
    } catch {
      setFormError("This browser could not prepare the secure save. Reload and try again.");
      return;
    }
    setRowErrors({});
    setFormError("");
    saveMutation.mutate({ input, idempotencyKey, version: baseVersion });
  }

  function requestHelp(event) {
    event.preventDefault();
    setHelpError(null);
    let idempotencyKey;
    try {
      idempotencyKey = createIdempotencyKey("candidate-help");
    } catch {
      setHelpError("This browser could not prepare the secure help request. Reload and try again.");
      return;
    }
    helpMutation.mutate({
      message: helpMessage.trim(),
      idempotencyKey,
    });
  }

  const warning = cardWarning(card);
  const busy = saveMutation.isPending || helpMutation.isPending;
  const liveProjection = wholeCardInput(card, drafts);
  const hasLiveAavErrors = Object.keys(liveProjection.aavErrors).length > 0;
  const liveActivePlayerAavCents =
    card.capProjection.carriedActivePlayerAmountCents +
    liveProjection.proposedActiveAavCents;

  return (
    <div className={styles.candidateWorkspace}>
      <form className={styles.compactCardForm} onSubmit={saveCard}>
        <Surface className={styles.candidateToolbar}>
          <div>
            <p className="hl-eyebrow">22-slot Candidate Card</p>
            <h2>{editable ? "Build your card" : "Candidate Card"}</h2>
            <p className={styles.muted}>
              AAV and term may be left blank and completed in a later save.
            </p>
          </div>
          <div className={styles.candidateToolbarActions}>
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
            {editable && (
              <button
                type="submit"
                className="hl-button hl-button--primary"
                disabled={!dirty || saveMutation.isPending || hasLiveAavErrors}
              >
                {saveMutation.isPending ? "Saving…" : "Save Candidate Card"}
              </button>
            )}
          </div>
          <dl className={styles.compactCardSummary}>
            <div>
              <dt>Active player AAV</dt>
              <dd>{money(liveActivePlayerAavCents)}</dd>
            </div>
            <div>
              <dt>Projected cap use</dt>
              <dd>
                {money(liveProjection.projectedCapCents)} / {money(card.capProjection.capLimitCents)}
              </dd>
            </div>
            <div>
              <dt>Mandatory missing</dt>
              <dd>{card.completeness.missingMandatoryCount}</dd>
            </div>
          </dl>
        </Surface>

        {warning && (
          <p className={styles.warning} role="status">
            <strong>Candidate Card:</strong> {warning}
          </p>
        )}
        {!editable && (
          <p className={styles.notice} role="status">
            This Candidate Card is read only.
          </p>
        )}
        {statusMessage && (
          <p className={styles.success} role="status">
            {statusMessage}
          </p>
        )}
        {formError && (
          <ErrorBlock
            fallback={formError}
            impact="Your Candidate Card has not been changed."
            recovery="Review any highlighted rows, then try the save again."
          />
        )}

        <div className={styles.compactCard} aria-label="Candidate Card rows">
          <div className={styles.compactColumnHeader} aria-hidden="true">
            <span>Slot</span>
            <span>Player name</span>
            <span>AAV</span>
            <span>Term</span>
            <span>Total</span>
            <span>Status</span>
          </div>
          {[
            ["F", "Forwards", "12 rows"],
            ["D", "Defence", "6 rows"],
            ["B", "Bench", "4 rows"],
          ].map(([group, title, description]) => (
            <section
              className={styles.compactSlotGroup}
              aria-labelledby={`candidate-${group}-slots`}
              key={group}
            >
              <div className={styles.compactGroupHeading}>
                <h3 id={`candidate-${group}-slots`}>{title}</h3>
                <span>{description}</span>
              </div>
              {slotsByGroup[group].map((slot) => (
                <CandidateSlot
                  key={slot.slotKey}
                  slot={slot}
                  editable={editable}
                  busy={busy}
                  draft={drafts[slot.slotKey]}
                  rowError={
                    liveProjection.aavErrors[slot.slotKey] ||
                    rowErrors[slot.slotKey] ||
                    ""
                  }
                  buildEligibleQueryOptions={eligibleOptionsFor(slot.slotKey)}
                  onDraftChange={(patch) => updateDraft(slot.slotKey, patch)}
                />
              ))}
            </section>
          ))}
        </div>
      </form>

      {card.capabilities.requestHelp.allowed && (
        <Surface
          className={styles.compactHelpPanel}
          as="section"
          aria-labelledby="candidate-help-title"
        >
          <div>
            <h2 id="candidate-help-title">Ask the commissioner for help</h2>
            <p>
              This grants the current commissioner access only to this card
              until the deadline.
            </p>
          </div>
          <form
            aria-labelledby="candidate-help-title"
            aria-describedby={helpError ? "candidate-help-error" : undefined}
            onSubmit={requestHelp}
          >
            <label>
              Private message (optional)
              <textarea
                aria-describedby={helpError ? "candidate-help-error" : undefined}
                rows="2"
                maxLength={500}
                value={helpMessage}
                onChange={(event) => {
                  setHelpMessage(event.target.value);
                  setHelpError("");
                }}
              />
            </label>
            {helpError && (
              <ErrorBlock
                id="candidate-help-error"
                error={typeof helpError === "object" ? helpError : undefined}
                fallback={typeof helpError === "string" ? helpError : undefined}
                impact="No help request was sent."
                recovery="Keep your message, then try again."
              />
            )}
            <button
              type="submit"
              className="hl-button hl-button--secondary"
              disabled={helpMutation.isPending}
            >
              {helpMutation.isPending
                ? "Sending request…"
                : "Request commissioner help"}
            </button>
          </form>
        </Surface>
      )}

      {card.helpContext && (
        <Surface className={styles.compactHelpPanel}>
          <div>
            <h2>Commissioner help</h2>
            <p>{card.helpContext.message || "No private message was included."}</p>
          </div>
          <StatusBadge
            tone={card.helpContext.status === "active" ? "success" : "neutral"}
          >
            {card.helpContext.status === "active" ? "Active" : "Expired"}
          </StatusBadge>
        </Surface>
      )}
    </div>
  );
}
