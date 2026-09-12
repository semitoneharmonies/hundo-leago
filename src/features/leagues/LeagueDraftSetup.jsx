import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorBlock, LoadingBlock, Surface } from "../../components/HundoUi.jsx";
import { createIdempotencyKey } from "../../shared/api/idempotency.js";
import { calendarTimestamp } from "../../shared/leagueCalendar.js";
import { leagueDateTime } from "../../shared/hundoFormat.js";
import { useCurrentTime } from "../../shared/useCurrentTime.js";
import { useSession } from "../session/sessionContext.js";
import { leagueDetailQuery, leagueKeys, leagueMembershipsQuery, leagueTeamsQuery } from "./leagueQueries.js";
import { leagueDraftSettingsQuery, recordSetupTradeDeadline, prepareLeagueDraft } from "./leagueSetupApi.js";

export function LeagueDraftSetup({ leagueId }) {
  const nowMs = useCurrentTime();
  const session = useSession();
  const queryClient = useQueryClient();
  const detail = useQuery(leagueDetailQuery(session.httpClient, leagueId));
  const teams = useQuery(leagueTeamsQuery(session.httpClient, leagueId));
  const members = useQuery(leagueMembershipsQuery(session.httpClient, leagueId));
  const settings = useQuery(leagueDraftSettingsQuery(session.httpClient, leagueId));
  const [tradeDeadline, setTradeDeadline] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const league = detail.data;
  const timeZone = league?.timezone || "America/Vancouver";
  const deadlineAtMs = calendarTimestamp(tradeDeadline, timeZone);
  const managedTeams = teams.data?.filter((team) => team.status === "setup" && team.currentManager) || [];
  const pendingInvitations = members.data?.filter((member) => member.status === "invited").length || 0;
  const hasDeadline = Number.isSafeInteger(settings.data?.tradeDeadlineAtMs);
  const ready = league?.status === "setup" && hasDeadline && managedTeams.length >= 4 &&
    managedTeams.length === teams.data?.filter((team) => team.status !== "erased").length &&
    pendingInvitations === 0 && !members.isPending && !members.isError && !teams.isPending && !teams.isError;
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: leagueKeys.detail(leagueId) });
    await queryClient.invalidateQueries({ queryKey: leagueKeys.all });
  };
  const deadlineMutation = useMutation({
    mutationFn: ({ version, idempotencyKey, tradeDeadlineAtMs }) =>
      recordSetupTradeDeadline(session.httpClient, leagueId, tradeDeadlineAtMs, version, idempotencyKey),
    onSuccess: async () => { setMessage("Trade deadline saved."); await refresh(); },
    onError: async (error) => { if (error.status === 412) await refresh(); },
  });
  const startMutation = useMutation({
    mutationFn: ({ version, idempotencyKey }) => prepareLeagueDraft(session.httpClient, leagueId, version, idempotencyKey),
    onSuccess: async () => { setConfirming(false); setMessage("League prepared. Confirm the schedule below to open the inaugural Free Agent Draft."); await refresh(); },
    onError: async (error) => { setConfirming(false); if (error.status === 412 || error.status === 409) await refresh(); },
  });
  function saveDeadline(event) {
    event.preventDefault();
    if (hasDeadline || !Number.isSafeInteger(deadlineAtMs) || deadlineAtMs <= nowMs || deadlineMutation.isPending) return;
    try {
      deadlineMutation.mutate({ version: league.version, tradeDeadlineAtMs: deadlineAtMs, idempotencyKey: createIdempotencyKey("league-trade-deadline") });
    } catch (error) { setMessage(error.message); }
  }
  function prepareDraft() {
    if (!ready || startMutation.isPending) return;
    try {
      startMutation.mutate({ version: league.version, idempotencyKey: createIdempotencyKey("league-start") });
    } catch (error) { setMessage(error.message); }
  }
  if (detail.isPending || teams.isPending || members.isPending || settings.isPending) return <Surface><LoadingBlock>Loading draft setup…</LoadingBlock></Surface>;
  if (detail.isError || teams.isError || members.isError || settings.isError) return <Surface><ErrorBlock error={detail.error || teams.error || members.error || settings.error} fallback="Draft setup could not be loaded." /></Surface>;
  if (league.status !== "setup") return null;
  return <Surface className="hl-competition-setup-card">
    <h2>Prepare your first Free Agent Draft</h2>
    <p>Managers build their rosters in the Free Agent Draft before the first matchup. Finish league setup, then review and confirm the draft calendar below. Candidate Cards open automatically when all prerequisites are ready.</p>
    <p>{managedTeams.length} managed teams · {pendingInvitations} pending invitations</p>
    {!hasDeadline ? <form onSubmit={saveDeadline} className="hl-form-grid">
      <label className="hl-field">Season trade deadline
        <input type="datetime-local" value={tradeDeadline} onChange={(event) => setTradeDeadline(event.target.value)} disabled={deadlineMutation.isPending} required />
      </label>
      <p>This informational trade deadline is separate from the draft deadline. It uses {timeZone} and cannot be changed by the commissioner after saving.</p>
      <button type="submit" className="hl-button hl-button--secondary" disabled={!Number.isSafeInteger(deadlineAtMs) || deadlineMutation.isPending || deadlineAtMs <= nowMs}>{deadlineMutation.isPending ? "Saving…" : "Save trade deadline"}</button>
    </form> : <p>Trade deadline: {leagueDateTime(settings.data.tradeDeadlineAtMs, timeZone)}</p>}
    {!ready && <p>At least four teams need accepted managers, all invitations must be resolved, and the trade deadline must be saved.</p>}
    {confirming && ready ? <div role="group" aria-label="Confirm inaugural draft setup">
      <p>Prepare this league and its {managedTeams.length} managed teams for the inaugural Free Agent Draft? Competition begins only after the draft finishes and Week 1 arrives.</p>
      <button type="button" className="hl-button hl-button--primary" onClick={prepareDraft} disabled={startMutation.isPending}>{startMutation.isPending ? "Preparing…" : "Confirm draft setup"}</button>
      <button type="button" className="hl-button hl-button--quiet" onClick={() => setConfirming(false)} disabled={startMutation.isPending}>Cancel</button>
    </div> : <button type="button" className="hl-button hl-button--primary" onClick={() => setConfirming(true)} disabled={!ready || deadlineMutation.isPending || startMutation.isPending}>Prepare league for draft</button>}
    {message && <p role="status">{message}</p>}
    {(deadlineMutation.error || startMutation.error) && <ErrorBlock error={deadlineMutation.error || startMutation.error} fallback="League setup could not be completed." />}
  </Surface>;
}
