import { useEffect, useId, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dateRange, money } from "../../shared/hundoFormat.js";
import { applyRosterRepair, previewRosterRepair, rosterRepairKey } from "./rosterRepairApi.js";
import "./RosterRepairPanel.css";

const staleCodes = new Set(["ROSTER_REPAIR_STALE", "ROSTER_REPAIR_NOT_AVAILABLE"]);

export function RosterRepairPanel({ workspace, httpClient, pending = false, onApplied }) {
  if (!workspace.canManage || workspace.legality?.legal !== false) return null;
  // Preserve a review through live statistics refreshes, but discard it when
  // its authority, roster assignments, eligibility or cap basis changes.
  const reviewKey = JSON.stringify({
    leagueId: workspace.league.id, teamId: workspace.team.id, seasonId: workspace.season.id,
    canManage: workspace.canManage, orderVersion: workspace.orderVersion, cap: workspace.cap, legality: workspace.legality,
    players: workspace.players.map(player => ({
      ownershipId: player.ownershipId, playerId: player.playerId, version: player.ownershipVersion,
      category: player.rosterCategory, position: player.normalizedPosition, injury: player.injury,
      irEligible: player.injuredReserveEligible, contract: player.contract, nhlTeam: player.nhlTeamAbbreviation,
    })).sort((a, b) => a.ownershipId.localeCompare(b.ownershipId)),
  });
  return <RepairReview key={reviewKey} workspace={workspace}
    httpClient={httpClient} pending={pending} onApplied={onApplied} />;
}

function RepairReview({ workspace, httpClient, pending, onApplied }) {
  const queryClient = useQueryClient();
  const panelId = useId();
  const live = useRef(false);
  const submitting = useRef(false);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const scope = { leagueId: workspace.league.id, teamId: workspace.team.id, seasonId: workspace.season.id };
  useEffect(() => {
    live.current = true;
    return () => { live.current = false; };
  }, []);

  const suggestion = useMutation({
    mutationFn: () => previewRosterRepair(httpClient, scope),
    onSuccess: result => { if (live.current) setPreview(result); },
    onError: () => { if (live.current) setError("Couldn’t load a fix. Your roster has not changed. Try again."); },
    onSettled: () => { submitting.current = false; },
  });
  const apply = useMutation({
    mutationKey: rosterRepairKey(scope.leagueId, scope.teamId),
    mutationFn: plan => applyRosterRepair(httpClient, scope, plan.revision, plan.moves.length),
    onSuccess: async result => {
      if (live.current) {
        setPreview(null);
        setOpen(false);
        const lockMessage = {
          completed: " A late roster lock was created; earlier games stay excluded.",
          awaiting_data: " Late roster locking is waiting for scoring data; earlier games stay excluded.",
          still_illegal: " The scoring roster still needs review before a late lock can complete.",
        }[result.lateLock.status] || "";
        onApplied?.(`Roster fixed. ${result.moved} player${result.moved === 1 ? " was" : "s were"} moved.${lockMessage}`);
      }
      await queryClient.invalidateQueries({ queryKey: ["league", scope.leagueId] });
    },
    onError: error => {
      if (!live.current) return;
      if (staleCodes.has(error.code) || error.name === "ResponseContractError") {
        setPreview(null);
        setError("This fix could not be confirmed. Refresh the suggestion before applying.");
        void queryClient.invalidateQueries({ queryKey: ["league", scope.leagueId] });
      } else {
        setError(error.code === "LEAGUE_COMPETITION_PAUSED"
          ? "Roster changes are paused for this league."
          : "The fix could not be confirmed. Check your roster, then try again.");
      }
    },
    onSettled: () => { submitting.current = false; },
  });
  const busy = pending || suggestion.isPending || apply.isPending;

  function loadSuggestion() {
    if (busy || submitting.current) return;
    submitting.current = true;
    setError("");
    setPreview(null);
    suggestion.mutate();
  }

  return <div className="hl-roster-repair">
    <button type="button" className="hl-button" aria-expanded={open} aria-controls={panelId}
      disabled={busy} onClick={() => { setOpen(!open); if (!open && !preview) loadSuggestion(); }}>
      {open ? "Hide suggestion" : "Suggest a fix"}
    </button>
    {open && <section id={panelId} className="hl-roster-repair-review" aria-label="Roster fix review" aria-busy={busy || undefined}>
      <header className="hl-roster-repair-heading">
        <h3>Suggested fix</h3>
        {preview?.week && <p><strong>{preview.week.label}</strong><span>{dateRange(preview.week.startsAtMs, preview.week.endsAtMs - 1)}</span></p>}
      </header>
      {suggestion.isPending && <p role="status">Finding a legal lineup…</p>}
      {error && <p role="alert">{error}</p>}
      {preview && <>
        {preview.canApply ? <p className="hl-roster-repair-note">
          {preview.timing === "future_week" ? "Your locked lineup stays unchanged."
            : preview.timing === "late_lock" ? "Scoring needs a late lock. Earlier games stay excluded."
            : preview.timing === "no_week" ? "No matchup week available. Legality only."
            : preview.strategy === "legality_only" ? "Legality check only — schedule unavailable."
            : "Best legal lineup for scheduled games."}
        </p> : <p className="hl-roster-repair-note">{preview.message}</p>}
        {preview.status !== "unavailable" && <dl className="hl-roster-repair-summary">
          <div><dt>Cap</dt><dd>{preview.canApply && <><span className="hl-roster-repair-before">{money(preview.before.capUsageCents)}</span> → </>}{money(preview.after.capUsageCents)}</dd><small>{money(preview.after.capLimitCents)} limit</small></div>
          {preview.before.scheduledGames !== null && preview.after.scheduledGames !== null && <div><dt>Scheduled games</dt><dd><span className="hl-roster-repair-before">{preview.before.scheduledGames}</span> → {preview.after.scheduledGames}</dd><small>Available active players</small></div>}
        </dl>}
        {preview.moves.length > 0 && <ul className="hl-roster-repair-moves" aria-label="Suggested player moves">{preview.moves.map(move => <li key={move.ownershipId}>
          <strong>{move.name}</strong><span className="hl-roster-repair-route"><span>{move.from === "Injured Reserve" ? "IR" : move.from}</span><span>→</span><span className="hl-roster-repair-destination">{move.to === "Injured Reserve" ? "IR" : move.to}</span></span>
        </li>)}</ul>}
        <details className="hl-roster-repair-details">
          <summary>{preview.blockers.length ? "How to fix it" : "Details"}</summary>
          {preview.canApply && <p>{preview.message}</p>}
          {preview.strategy === "scheduled_games" && <p>Scheduled games are not guaranteed appearances or fantasy points.</p>}
          {preview.strategy === "legality_only" && <p>Schedule unavailable. This fix focuses on roster legality.</p>}
          {preview.blockers.length > 0 && <ul>{preview.blockers.map((blocker, index) => <li key={index}>{blocker}</li>)}</ul>}
          <p>No buyouts or contract changes.</p>
        </details>
      </>}
      {!suggestion.isPending && <div className="hl-roster-repair-buttons">
        {preview?.canApply && <button type="button" className="hl-button hl-button--primary" disabled={busy}
          onClick={() => {
            if (busy || submitting.current) return;
            submitting.current = true;
            setError("");
            apply.mutate(preview);
          }}>{apply.isPending ? "Applying moves…" : "Apply these moves"}</button>}
        <button type="button" className="hl-roster-repair-refresh" disabled={busy} onClick={loadSuggestion}>Refresh suggestion</button>
      </div>}
    </section>}
  </div>;
}
