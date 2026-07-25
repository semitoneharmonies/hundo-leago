import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import {
  ErrorBlock,
  LoadingBlock,
  PageHeading,
  PanelHeading,
  StatusBadge,
  Surface,
} from "../../components/HundoUi.jsx";
import {
  effectiveLeagueAuthority,
  hasCommissionerAuthority,
  PLATFORM_ADMINISTRATOR_AUTHORITY,
} from "../../shared/leagueAuthority.js";
import {
  visibleLeaguesQuery,
} from "../leagues/leagueQueries.js";
import { useSession } from "../session/sessionContext.js";
import {
  applyCommissionerCorrection,
  commissionerKeys,
  commissionerWorkspaceQuery,
  previewCommissionerCorrection,
  resetStagingFixture,
} from "./commissionerQueries.js";
import styles from "./CommissionerRosterPage.module.css";

const ROSTER_CATEGORIES = Object.freeze([
  "Active",
  "Bench",
  "Injured Reserve",
  "Prospect",
]);
const RESET_CONFIRMATION = "RESET STAGING TEST LEAGUES";

function money(cents) {
  if (!Number.isSafeInteger(cents)) return "Unavailable";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

function dateTime(value) {
  if (!Number.isSafeInteger(value)) return "Never";
  return new Date(value).toLocaleString("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Vancouver",
  });
}

function reason(value) {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function dollarsToCents(value, label) {
  const normalized = String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error(`${label} must be a dollar amount with at most two decimals.`);
  }
  const cents = Math.round(Number(normalized) * 100);
  if (!Number.isSafeInteger(cents)) {
    throw new Error(`${label} is outside the supported range.`);
  }
  return cents;
}

function positiveInteger(value, label, maximum = null) {
  const number = Number(value);
  if (
    !Number.isSafeInteger(number) ||
    number < 1 ||
    (maximum !== null && number > maximum)
  ) {
    throw new Error(
      maximum === null
        ? `${label} must be a positive whole number.`
        : `${label} must be between 1 and ${maximum}.`
    );
  }
  return number;
}

function newOperationId() {
  const id = globalThis.crypto?.randomUUID?.();
  if (!id) {
    throw new Error(
      "Secure operation IDs are unavailable in this browser. Reload in a supported browser."
    );
  }
  return id;
}

function rosterLabel(entry, teamsById) {
  return `${entry.player.fullName} · ${
    teamsById.get(entry.teamId)?.name || "Unknown team"
  } · ${entry.rosterCategory}`;
}

function hasPreviewWarnings(preview) {
  return (
    preview.warnings.length > 0 ||
    preview.capImpact.some((impact) => impact.warnings.length > 0)
  );
}

async function invalidateCommissionerReads(queryClient, leagueId) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["league", leagueId] }),
    queryClient.invalidateQueries({ queryKey: ["players"] }),
    queryClient.invalidateQueries({
      queryKey: ["public-roster", leagueId],
    }),
    queryClient.invalidateQueries({
      queryKey: commissionerKeys.workspace(leagueId),
    }),
  ]);
}

function useCorrectionWorkflow(httpClient, leagueId, operation) {
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState(null);
  const [previewInput, setPreviewInput] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [applied, setApplied] = useState(null);

  const previewMutation = useMutation({
    mutationFn: (input) =>
      previewCommissionerCorrection(
        httpClient,
        leagueId,
        operation,
        input
      ),
    onSuccess(data, input) {
      setPreview(data);
      setPreviewInput(input);
      setConfirmed(false);
      setApplied(null);
    },
  });
  const applyMutation = useMutation({
    mutationFn: ({ input, idempotencyKey }) =>
      applyCommissionerCorrection(
        httpClient,
        leagueId,
        operation,
        input,
        idempotencyKey
      ),
    async onSuccess(data) {
      setPreview(null);
      setPreviewInput(null);
      setConfirmed(false);
      setApplied(data);
      await invalidateCommissionerReads(queryClient, leagueId);
    },
  });

  function clearPreview() {
    setPreview(null);
    setPreviewInput(null);
    setConfirmed(false);
    setLocalError(null);
    setApplied(null);
    previewMutation.reset();
    applyMutation.reset();
  }

  function requestPreview(buildInput) {
    setLocalError(null);
    setApplied(null);
    try {
      previewMutation.mutate(buildInput());
    } catch (error) {
      setLocalError(error);
    }
  }

  function applyPreview() {
    setLocalError(null);
    if (!preview || !previewInput || !confirmed) {
      setLocalError(
        new Error("Review the preview and confirm it before applying.")
      );
      return;
    }
    try {
      applyMutation.mutate({
        input: {
          ...previewInput,
          confirmWarnings: hasPreviewWarnings(preview),
        },
        idempotencyKey: newOperationId(),
      });
    } catch (error) {
      setLocalError(error);
    }
  }

  return {
    applied,
    applyPreview,
    clearPreview,
    confirmed,
    error: localError || previewMutation.error || applyMutation.error,
    isPending: previewMutation.isPending || applyMutation.isPending,
    preview,
    requestPreview,
    setConfirmed,
  };
}

function CapImpact({ impacts, teamsById }) {
  if (impacts.length === 0) {
    return <p>No team cap totals change in this preview.</p>;
  }
  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Team</th>
            <th scope="col">Usage</th>
            <th scope="col">Space</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {impacts.map((impact) => (
            <tr key={impact.teamId}>
              <td>{teamsById.get(impact.teamId)?.name || impact.teamId}</td>
              <td>{money(impact.cap.capUsageCents)}</td>
              <td>{money(impact.cap.capSpaceCents)}</td>
              <td>
                <StatusBadge tone={impact.cap.overCap ? "danger" : "success"}>
                  {impact.cap.overCap ? "Over cap" : "Within cap"}
                </StatusBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PreviewResult({ label, workflow, teamsById }) {
  if (!workflow.preview && !workflow.applied && !workflow.error) return null;
  return (
    <div className={styles.preview} aria-live="polite">
      {workflow.error && <ErrorBlock error={workflow.error} />}
      {workflow.applied && (
        <div className={styles.success} role="status">
          <strong>{label} applied.</strong>
          <span>
            Audit activity: {workflow.applied.evidence.activityId}
          </span>
        </div>
      )}
      {workflow.preview && (
        <>
          <h3>Authoritative preview</h3>
          {hasPreviewWarnings(workflow.preview) ? (
            <div className={styles.warning} role="alert">
              <strong>Review warnings before applying</strong>
              <ul>
                {workflow.preview.warnings.map((warning, index) => (
                  <li key={`${warning.code}-${index}`}>{warning.code}</li>
                ))}
                {workflow.preview.capImpact.flatMap((impact) =>
                  impact.warnings.map((warning, index) => (
                    <li key={`${impact.teamId}-${warning.code}-${index}`}>
                      {teamsById.get(impact.teamId)?.name || impact.teamId}:{" "}
                      {warning.code}
                    </li>
                  ))
                )}
              </ul>
            </div>
          ) : (
            <p className={styles.cleanPreview}>No rule warnings were returned.</p>
          )}
          <CapImpact
            impacts={workflow.preview.capImpact}
            teamsById={teamsById}
          />
          <details>
            <summary>Review before, requested, and projected records</summary>
            <pre className={styles.snapshot}>
              {JSON.stringify(
                {
                  before: workflow.preview.before,
                  requested: workflow.preview.requested,
                  projected: workflow.preview.authoritative,
                },
                null,
                2
              )}
            </pre>
          </details>
          <label className={styles.confirmation}>
            <input
              type="checkbox"
              checked={workflow.confirmed}
              onChange={(event) =>
                workflow.setConfirmed(event.target.checked)
              }
            />
            I reviewed this preview, its cap impact, and every warning.
          </label>
          <button
            className="hl-button hl-button--primary"
            type="button"
            disabled={!workflow.confirmed || workflow.isPending}
            onClick={workflow.applyPreview}
          >
            {workflow.isPending ? "Applying…" : `Apply confirmed ${label}`}
          </button>
        </>
      )}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function AddPlayerPanel({ workspace, teamsById, workflow }) {
  const [search, setSearch] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [category, setCategory] = useState("Bench");
  const [position, setPosition] = useState("F");
  const [slot, setSlot] = useState("1");
  const [contractType, setContractType] = useState("normal");
  const [totalValue, setTotalValue] = useState("3.00");
  const [term, setTerm] = useState("1");
  const [correctionReason, setCorrectionReason] = useState("");
  const filteredAgents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("en-CA");
    return workspace.freeAgents
      .filter(
        (player) =>
          !query || player.fullName.toLocaleLowerCase("en-CA").includes(query)
      )
      .slice(0, 100);
  }, [search, workspace.freeAgents]);

  function changed(callback) {
    workflow.clearPreview();
    callback();
  }

  function buildInput() {
    if (!playerId || !teamId) {
      throw new Error("Choose both a free agent and a destination team.");
    }
    const prospect = category === "Prospect";
    return {
      seasonId: workspace.league.currentSeasonId,
      playerId,
      teamId,
      rosterCategory: category,
      positionGroup: position,
      slotNumber: prospect ? null : positiveInteger(slot, "Slot number"),
      contractType: prospect ? null : contractType,
      originalTotalValueCents: prospect
        ? null
        : dollarsToCents(totalValue, "Total contract value"),
      termYears: prospect ? null : positiveInteger(term, "Contract term", 3),
      reason: reason(correctionReason),
    };
  }

  return (
    <Surface className={styles.operation}>
      <PanelHeading
        eyebrow="Commissioner correction"
        title="Add a player"
        description="Assign a free agent or prospect right and preview the resulting roster and cap state."
      />
      <div className={styles.formGrid}>
        <Field label="Find free agent">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter by player name"
          />
        </Field>
        <Field label="Player">
          <select
            value={playerId}
            onChange={(event) =>
              changed(() => {
                const selected = workspace.freeAgents.find(
                  (player) => player.playerId === event.target.value
                );
                setPlayerId(event.target.value);
                if (["F", "D"].includes(selected?.effectivePosition)) {
                  setPosition(selected.effectivePosition);
                }
              })
            }
          >
            <option value="">Choose a free agent</option>
            {filteredAgents.map((player) => (
              <option key={player.playerId} value={player.playerId}>
                {player.fullName} · {player.effectivePosition}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Destination team">
          <select
            value={teamId}
            onChange={(event) => changed(() => setTeamId(event.target.value))}
          >
            <option value="">Choose a team</option>
            {workspace.teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Roster category">
          <select
            value={category}
            onChange={(event) => {
              const next = event.target.value;
              changed(() => {
                setCategory(next);
                if (next === "Prospect") setSlot("");
                else if (!slot) setSlot("1");
              });
            }}
          >
            {ROSTER_CATEGORIES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Field>
        <Field label="Position">
          <select
            value={position}
            onChange={(event) => changed(() => setPosition(event.target.value))}
          >
            <option value="F">Forward</option>
            <option value="D">Defence</option>
          </select>
        </Field>
        <Field label="Slot number">
          <input
            type="number"
            min="1"
            value={slot}
            disabled={category === "Prospect"}
            onChange={(event) => changed(() => setSlot(event.target.value))}
          />
        </Field>
        <Field label="Contract type">
          <select
            value={contractType}
            disabled={category === "Prospect"}
            onChange={(event) => {
              const next = event.target.value;
              changed(() => {
                setContractType(next);
                if (next === "fantasy_elc") {
                  setTotalValue("3.00");
                  setTerm("3");
                }
              });
            }}
          >
            <option value="normal">Normal</option>
            <option value="fantasy_elc">Fantasy ELC</option>
          </select>
        </Field>
        <Field label="Total contract value" hint="Dollars across the full term.">
          <input
            inputMode="decimal"
            value={totalValue}
            disabled={category === "Prospect" || contractType === "fantasy_elc"}
            onChange={(event) =>
              changed(() => setTotalValue(event.target.value))
            }
          />
        </Field>
        <Field label="Term" hint="One to three years.">
          <input
            type="number"
            min="1"
            max="3"
            value={term}
            disabled={category === "Prospect" || contractType === "fantasy_elc"}
            onChange={(event) => changed(() => setTerm(event.target.value))}
          />
        </Field>
        <Field label="Reason" hint="Optional; recorded in league activity.">
          <input
            maxLength="500"
            value={correctionReason}
            onChange={(event) =>
              changed(() => setCorrectionReason(event.target.value))
            }
          />
        </Field>
      </div>
      <button
        className="hl-button hl-button--secondary"
        type="button"
        disabled={workflow.isPending}
        onClick={() => workflow.requestPreview(buildInput)}
      >
        {workflow.isPending ? "Checking…" : "Preview player addition"}
      </button>
      <PreviewResult
        label="player addition"
        workflow={workflow}
        teamsById={teamsById}
      />
    </Surface>
  );
}

function RemovePlayerPanel({ workspace, teamsById, workflow }) {
  const [ownershipId, setOwnershipId] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const entry = workspace.roster.find(
    (candidate) => candidate.ownershipId === ownershipId
  );

  function changed(callback) {
    workflow.clearPreview();
    callback();
  }

  function buildInput() {
    if (!entry) throw new Error("Choose a rostered player to remove.");
    return {
      seasonId: entry.seasonId,
      ownershipId: entry.ownershipId,
      playerId: entry.playerId,
      expectedVersion: entry.ownershipVersion,
      contractId: entry.contract?.id ?? null,
      expectedContractVersion: entry.contract?.version ?? null,
      reason: reason(correctionReason),
    };
  }

  return (
    <Surface className={styles.operation}>
      <PanelHeading
        eyebrow="Commissioner correction"
        title="Remove a player"
        description="Release a rostered player and their active contract after reviewing the authoritative preview."
      />
      <div className={styles.formGrid}>
        <Field label="Rostered player">
          <select
            value={ownershipId}
            onChange={(event) =>
              changed(() => setOwnershipId(event.target.value))
            }
          >
            <option value="">Choose a rostered player</option>
            {workspace.roster.map((candidate) => (
              <option
                key={candidate.ownershipId}
                value={candidate.ownershipId}
              >
                {rosterLabel(candidate, teamsById)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reason" hint="Optional; recorded in league activity.">
          <input
            maxLength="500"
            value={correctionReason}
            onChange={(event) =>
              changed(() => setCorrectionReason(event.target.value))
            }
          />
        </Field>
      </div>
      <button
        className="hl-button hl-button--secondary"
        type="button"
        disabled={workflow.isPending}
        onClick={() => workflow.requestPreview(buildInput)}
      >
        {workflow.isPending ? "Checking…" : "Preview player removal"}
      </button>
      <PreviewResult
        label="player removal"
        workflow={workflow}
        teamsById={teamsById}
      />
    </Surface>
  );
}

function RosterCorrectionPanel({ workspace, teamsById, workflow }) {
  const [ownershipId, setOwnershipId] = useState("");
  const [category, setCategory] = useState("Bench");
  const [position, setPosition] = useState("F");
  const [slot, setSlot] = useState("1");
  const [correctionReason, setCorrectionReason] = useState("");
  const entry = workspace.roster.find(
    (candidate) => candidate.ownershipId === ownershipId
  );
  const availableCategories =
    entry && entry.contract === null ? ["Prospect"] : ROSTER_CATEGORIES;

  function changed(callback) {
    workflow.clearPreview();
    callback();
  }

  function chooseEntry(nextOwnershipId) {
    const selected = workspace.roster.find(
      (candidate) => candidate.ownershipId === nextOwnershipId
    );
    changed(() => {
      setOwnershipId(nextOwnershipId);
      if (!selected) return;
      setCategory(selected.rosterCategory);
      setPosition(selected.positionGroup);
      setSlot(selected.slotNumber === null ? "" : String(selected.slotNumber));
    });
  }

  function buildInput() {
    if (!entry) {
      throw new Error("Choose a rostered player.");
    }
    if (entry.contract === null && category !== "Prospect") {
      throw new Error(
        "An unsigned prospect right cannot move to a contracted roster category."
      );
    }
    const prospect = category === "Prospect";
    return {
      seasonId: entry.seasonId,
      ownershipId: entry.ownershipId,
      playerId: entry.playerId,
      expectedVersion: entry.ownershipVersion,
      correctedTeamId: entry.teamId,
      correctedOwnershipKind:
        entry.contract === null ? "Prospect Right" : "Rostered",
      correctedRosterCategory: category,
      correctedPositionGroup: position,
      correctedSlotNumber: prospect
        ? null
        : positiveInteger(slot, "Slot number"),
      reason: reason(correctionReason),
    };
  }

  return (
    <Surface className={styles.operation}>
      <PanelHeading
        eyebrow="Commissioner correction"
        title="Move or re-slot a player"
        description="Move a signed player among Active, Bench, Injured Reserve, and Prospect categories, or re-slot an unsigned prospect right."
      />
      <div className={styles.formGrid}>
        <Field label="Rostered player">
          <select
            value={ownershipId}
            onChange={(event) => chooseEntry(event.target.value)}
          >
            <option value="">Choose a rostered player</option>
            {workspace.roster.map((candidate) => (
              <option
                key={candidate.ownershipId}
                value={candidate.ownershipId}
              >
                {rosterLabel(candidate, teamsById)}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Current team"
          hint="Roster corrections cannot transfer ownership."
        >
          <output className={styles.readOnlyValue}>
            {entry
              ? teamsById.get(entry.teamId)?.name || entry.teamId
              : "Choose a player"}
          </output>
        </Field>
        <Field label="Roster category">
          <select
            value={category}
            onChange={(event) => {
              const next = event.target.value;
              changed(() => {
                setCategory(next);
                if (next === "Prospect") setSlot("");
                else if (!slot) setSlot("1");
              });
            }}
          >
            {availableCategories.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Field>
        <Field label="Position">
          <select
            value={position}
            onChange={(event) => changed(() => setPosition(event.target.value))}
          >
            <option value="F">Forward</option>
            <option value="D">Defence</option>
          </select>
        </Field>
        <Field label="Slot number">
          <input
            type="number"
            min="1"
            value={slot}
            disabled={category === "Prospect"}
            onChange={(event) => changed(() => setSlot(event.target.value))}
          />
        </Field>
        <Field label="Reason" hint="Optional; recorded in league activity.">
          <input
            maxLength="500"
            value={correctionReason}
            onChange={(event) =>
              changed(() => setCorrectionReason(event.target.value))
            }
          />
        </Field>
      </div>
      <button
        className="hl-button hl-button--secondary"
        type="button"
        disabled={workflow.isPending}
        onClick={() => workflow.requestPreview(buildInput)}
      >
        {workflow.isPending ? "Checking…" : "Preview roster correction"}
      </button>
      <PreviewResult
        label="roster correction"
        workflow={workflow}
        teamsById={teamsById}
      />
    </Surface>
  );
}

function ContractCorrectionPanel({
  workspace,
  teamsById,
  workflow,
}) {
  const contractEntries = workspace.roster.filter(
    (candidate) => candidate.contract !== null
  );
  const [ownershipId, setOwnershipId] = useState("");
  const [totalValue, setTotalValue] = useState("3.00");
  const [term, setTerm] = useState("1");
  const [correctionReason, setCorrectionReason] = useState("");
  const entry = contractEntries.find(
    (candidate) => candidate.ownershipId === ownershipId
  );

  function changed(callback) {
    workflow.clearPreview();
    callback();
  }

  function chooseEntry(nextOwnershipId) {
    const selected = contractEntries.find(
      (candidate) => candidate.ownershipId === nextOwnershipId
    );
    changed(() => {
      setOwnershipId(nextOwnershipId);
      if (!selected) return;
      setTotalValue(
        (selected.contract.originalTotalValueCents / 100).toFixed(2)
      );
      setTerm(String(selected.contract.originalTermYears));
    });
  }

  function buildInput() {
    if (!entry) {
      throw new Error("Choose a contracted player.");
    }
    const termYears = positiveInteger(term, "Contract term", 3);
    const totalValueCents = dollarsToCents(
      totalValue,
      "Total contract value"
    );
    if (totalValueCents < termYears * 100) {
      throw new Error(
        "Total contract value must provide at least $1.00 per contract year."
      );
    }
    if (termYears > 1 && totalValueCents % 100 !== 0) {
      throw new Error(
        "Multi-year total contract value must use whole-dollar increments."
      );
    }
    return {
      seasonId: entry.seasonId,
      contractId: entry.contract.id,
      playerId: entry.playerId,
      expectedVersion: entry.contract.version,
      correctedOriginalTotalValueCents: totalValueCents,
      correctedOriginalTermYears: termYears,
      reason: reason(correctionReason),
    };
  }

  const totalValueCents = /^\d+(?:\.\d{1,2})?$/.test(totalValue)
    ? Math.round(Number(totalValue) * 100)
    : null;
  const termYears = Number(term);
  const projectedAav =
    Number.isSafeInteger(totalValueCents) &&
    Number.isSafeInteger(termYears) &&
    termYears > 0
      ? Math.round(totalValueCents / termYears)
      : null;

  return (
    <Surface className={styles.operation}>
      <PanelHeading
        eyebrow="Commissioner correction"
        title="Correct a contract"
        description="Correct original contract value, term, and the resulting AAV schedule. Ownership and lifecycle fields remain read-only."
      />
      <div className={styles.formGrid}>
        <Field label="Contracted player">
          <select
            value={ownershipId}
            onChange={(event) => chooseEntry(event.target.value)}
          >
            <option value="">Choose a contracted player</option>
            {contractEntries.map((candidate) => (
              <option
                key={candidate.ownershipId}
                value={candidate.ownershipId}
              >
                {rosterLabel(candidate, teamsById)}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Current owner"
          hint="Contract corrections cannot transfer ownership."
        >
          <output className={styles.readOnlyValue}>
            {entry
              ? teamsById.get(entry.contract.teamId)?.name ||
                entry.contract.teamId
              : "Choose a player"}
          </output>
        </Field>
        <Field label="Contract type" hint="Lifecycle context; read-only.">
          <output className={styles.readOnlyValue}>
            {entry
              ? entry.contract.type === "fantasy_elc"
                ? "Fantasy ELC"
                : "Normal"
              : "Choose a player"}
          </output>
        </Field>
        <Field
          label="Total contract value"
          hint={
            projectedAav === null
              ? "Enter a valid value and term."
              : `Projected AAV: ${money(projectedAav)}`
          }
        >
          <input
            inputMode="decimal"
            value={totalValue}
            onChange={(event) =>
              changed(() => setTotalValue(event.target.value))
            }
          />
        </Field>
        <Field label="Term" hint="One to three years.">
          <input
            type="number"
            min="1"
            max="3"
            value={term}
            onChange={(event) => changed(() => setTerm(event.target.value))}
          />
        </Field>
        <Field label="Contract status" hint="Lifecycle context; read-only.">
          <output className={styles.readOnlyValue}>
            {entry ? entry.contract.status : "Choose a player"}
          </output>
        </Field>
        <Field label="Start season" hint="Schedule context; read-only.">
          <output className={styles.readOnlyValue}>
            {entry
              ? workspace.seasons.find(
                  (season) => season.id === entry.contract.startSeasonId
                )?.label || entry.contract.startSeasonId
              : "Choose a player"}
          </output>
        </Field>
        <Field label="Auction buyout lock" hint="Lifecycle context; read-only.">
          <output className={styles.readOnlyValue}>
            {entry
              ? dateTime(entry.contract.auctionBuyoutLockExpiresAtMs)
              : "Choose a player"}
          </output>
        </Field>
        <Field label="Reason" hint="Optional; recorded in league activity.">
          <input
            maxLength="500"
            value={correctionReason}
            onChange={(event) =>
              changed(() => setCorrectionReason(event.target.value))
            }
          />
        </Field>
      </div>
      <button
        className="hl-button hl-button--secondary"
        type="button"
        disabled={workflow.isPending}
        onClick={() => workflow.requestPreview(buildInput)}
      >
        {workflow.isPending ? "Checking…" : "Preview contract correction"}
      </button>
      <PreviewResult
        label="contract correction"
        workflow={workflow}
        teamsById={teamsById}
      />
    </Surface>
  );
}

function ProviderHealth({ health }) {
  return (
    <Surface className={styles.health}>
      <PanelHeading
        eyebrow="Player data provider"
        title="Import health"
        description="Last import activity for the staging player catalog."
        action={
          <StatusBadge tone={health.stale ? "danger" : "success"}>
            {health.stale ? "Stale" : "Current"}
          </StatusBadge>
        }
      />
      {health.stale && (
        <div className={styles.warning} role="alert">
          Player data is stale. Confirm the provider import before relying on
          current catalog data.
        </div>
      )}
      <dl className={styles.metrics}>
        <div>
          <dt>Provider</dt>
          <dd>{health.provider}</dd>
        </div>
        <div>
          <dt>Import enabled</dt>
          <dd>{health.enabled ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt>Catalog players</dt>
          <dd>{health.catalogPlayerCount.toLocaleString("en-CA")}</dd>
        </div>
        <div>
          <dt>Last attempt</dt>
          <dd>
            {health.lastAttempt
              ? `${dateTime(health.lastAttempt.completedAtMs)} · ${
                  health.lastAttempt.status
                }`
              : "No attempt recorded"}
          </dd>
        </div>
        <div>
          <dt>Last successful import</dt>
          <dd>
            {health.lastSuccessfulImport
              ? `${dateTime(
                  health.lastSuccessfulImport.completedAtMs
                )} · ${health.lastSuccessfulImport.playerCount.toLocaleString(
                  "en-CA"
                )} players`
              : "No successful import recorded"}
          </dd>
        </div>
      </dl>
    </Surface>
  );
}

function TeamCapSummary({ teams }) {
  return (
    <Surface>
      <PanelHeading
        eyebrow="Authoritative cap"
        title="Team cap position"
        description="Current active-roster cap totals before a correction."
      />
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Team</th>
              <th scope="col">Usage</th>
              <th scope="col">Limit</th>
              <th scope="col">Space</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id}>
                <td>{team.name}</td>
                <td>{money(team.cap.capUsageCents)}</td>
                <td>{money(team.cap.capLimitCents)}</td>
                <td>{money(team.cap.capSpaceCents)}</td>
                <td>
                  <StatusBadge tone={team.cap.overCap ? "danger" : "success"}>
                    {team.cap.overCap ? "Over cap" : "Within cap"}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Surface>
  );
}

function StagingResetPanel({ session }) {
  const [confirmation, setConfirmation] = useState("");
  const [resetReason, setResetReason] = useState("");
  const [localError, setLocalError] = useState(null);
  const mutation = useMutation({
    mutationFn: ({ input, idempotencyKey }) =>
      resetStagingFixture(session.httpClient, input, idempotencyKey),
    async onSuccess(result) {
      await session.clearAuthentication("staging-fixture-reset", result);
    },
  });
  const validReason =
    resetReason.length >= 1 &&
    resetReason.length <= 500 &&
    resetReason.trim() === resetReason;
  const enabled =
    confirmation === RESET_CONFIRMATION && validReason && !mutation.isPending;

  function submit(event) {
    event.preventDefault();
    setLocalError(null);
    try {
      mutation.mutate({
        input: { confirmation, reason: resetReason },
        idempotencyKey: newOperationId(),
      });
    } catch (error) {
      setLocalError(error);
    }
  }

  return (
    <Surface className={styles.dangerZone}>
      <PanelHeading
        eyebrow="Platform administrator only"
        title="Reset staging test leagues"
        description="Rebuild the deterministic Alpha and Beta staging fixture after creating a verified backup."
      />
      <div className={styles.warning} role="alert">
        This action replaces staging test data and invalidates every staging
        session, including yours. It cannot operate on production.
      </div>
      <form onSubmit={submit}>
        <div className={styles.formGrid}>
          <Field
            label={`Type “${RESET_CONFIRMATION}”`}
            hint="The phrase must match exactly."
          >
            <input
              value={confirmation}
              autoComplete="off"
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </Field>
          <Field label="Reset reason" hint="Required; 1 to 500 characters.">
            <input
              value={resetReason}
              maxLength="500"
              onChange={(event) => setResetReason(event.target.value)}
            />
          </Field>
        </div>
        <button
          className="hl-button hl-button--danger"
          type="submit"
          disabled={!enabled}
        >
          {mutation.isPending
            ? "Resetting staging…"
            : "Reset staging test leagues and sign out"}
        </button>
      </form>
      {(localError || mutation.error) && (
        <ErrorBlock error={localError || mutation.error} />
      )}
    </Surface>
  );
}

function CommissionerWorkspace({
  workspace,
  session,
  platformAdministrator,
  leagueId,
}) {
  const teamsById = useMemo(
    () => new Map(workspace.teams.map((team) => [team.id, team])),
    [workspace.teams]
  );
  const addWorkflow = useCorrectionWorkflow(
    session.httpClient,
    leagueId,
    "add"
  );
  const removeWorkflow = useCorrectionWorkflow(
    session.httpClient,
    leagueId,
    "remove"
  );
  const rosterWorkflow = useCorrectionWorkflow(
    session.httpClient,
    leagueId,
    "roster"
  );
  const contractWorkflow = useCorrectionWorkflow(
    session.httpClient,
    leagueId,
    "contract"
  );

  return (
    <main className={`hl-page hl-page--wide ${styles.page}`}>
      <PageHeading
        eyebrow={`${workspace.league.name} · ${workspace.league.currentSeasonLabel}`}
        title="Commissioner roster operations"
        description="Every correction is league-scoped, previewed against authoritative roster and cap rules, explicitly confirmed, and written to league activity."
        actions={
          <Link
            className="hl-button hl-button--quiet"
            to={routePaths.leagueCommissioner(leagueId)}
          >
            Competition tools
          </Link>
        }
      />
      <ProviderHealth health={workspace.providerHealth} />
      <TeamCapSummary teams={workspace.teams} />
      <div className={styles.operations}>
        <AddPlayerPanel
          workspace={workspace}
          teamsById={teamsById}
          workflow={addWorkflow}
        />
        <RemovePlayerPanel
          workspace={workspace}
          teamsById={teamsById}
          workflow={removeWorkflow}
        />
        <RosterCorrectionPanel
          workspace={workspace}
          teamsById={teamsById}
          workflow={rosterWorkflow}
        />
        <ContractCorrectionPanel
          workspace={workspace}
          teamsById={teamsById}
          workflow={contractWorkflow}
        />
      </div>
      {platformAdministrator && session.appEnv === "staging" && (
        <StagingResetPanel session={session} />
      )}
      <p className="hl-page-backlink">
        <Link to={routePaths.league(leagueId)}>Back to dashboard</Link>
      </p>
    </main>
  );
}

export function CommissionerRosterPage() {
  const { leagueId } = useParams();
  const session = useSession();
  const leagues = useQuery({
    ...visibleLeaguesQuery(session.httpClient),
    enabled: session.status === "authenticated",
  });
  const league =
    leagues.data?.find((candidate) => candidate.id === leagueId) || null;
  const commissioner = hasCommissionerAuthority(league?.membership);
  const authority = effectiveLeagueAuthority(league?.membership);
  const workspace = useQuery({
    ...commissionerWorkspaceQuery(session.httpClient, leagueId),
    enabled:
      session.status === "authenticated" && Boolean(league) && commissioner,
  });
  if (session.status === "unauthenticated") {
    return <Navigate to={routePaths.home} replace state={{ reason: "sign-in" }} />;
  }
  if (session.status === "unknown" || leagues.isPending) {
    return (
      <main className="hl-page">
        <Surface>
          <LoadingBlock>Checking secure commissioner access…</LoadingBlock>
        </Surface>
      </main>
    );
  }
  if (leagues.isError) {
    return (
      <main className="hl-page">
        <Surface>
          <ErrorBlock error={leagues.error} />
        </Surface>
      </main>
    );
  }
  if (!league) {
    return (
      <main className="hl-page">
        <PageHeading title="Commissioner roster operations" />
        <p className="hl-form-message is-error" role="alert">
          This league is not in your active memberships.
        </p>
      </main>
    );
  }
  if (!commissioner) {
    return (
      <main className="hl-page">
        <PageHeading
          eyebrow={league.name}
          title="Commissioner roster operations"
        />
        <p className="hl-form-message is-error" role="alert">
          Current commissioner authority is required.
        </p>
      </main>
    );
  }
  if (workspace.isPending) {
    return (
      <main className="hl-page">
        <Surface>
          <LoadingBlock>Loading the authoritative roster workspace…</LoadingBlock>
        </Surface>
      </main>
    );
  }
  if (workspace.isError) {
    return (
      <main className="hl-page">
        <PageHeading
          eyebrow={league.name}
          title="Commissioner roster operations"
        />
        <Surface>
          <ErrorBlock error={workspace.error} />
        </Surface>
      </main>
    );
  }

  return (
    <CommissionerWorkspace
      workspace={workspace.data}
      session={session}
      platformAdministrator={
        authority === PLATFORM_ADMINISTRATOR_AUTHORITY
      }
      leagueId={leagueId}
    />
  );
}
