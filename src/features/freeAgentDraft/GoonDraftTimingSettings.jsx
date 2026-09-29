import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorBlock, LoadingBlock, Surface } from "../../components/HundoUi.jsx";
import { useSession } from "../session/sessionContext.js";
import styles from "./FreeAgentDraftPage.module.css";

function TimingForm({ settings, path, queryKey }) {
  const { httpClient } = useSession();
  const queryClient = useQueryClient();
  const [interval, setInterval] = useState(String(settings.rolloverIntervalMinutes));
  const [cutoff, setCutoff] = useState(String(settings.auctionCreationCutoffMinutes));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  async function save(event) {
    event.preventDefault();
    setSaving(true); setError(null); setSaved(false);
    try {
      const result = await httpClient.request(path, {
        method: "PUT", authenticated: true, dataKind: "object", version: settings.version,
        body: { rolloverIntervalMinutes: Number(interval), auctionCreationCutoffMinutes: Number(cutoff) },
      });
      queryClient.setQueryData(queryKey, result.data);
      setSaved(true);
    } catch (failure) { setError(failure); }
    finally { setSaving(false); }
  }
  return (
    <form onSubmit={save} className="hl-form">
      <p>Candidate-card deadline, auction dates, first matchup and roster lock are not scheduled yet.</p>
      <label className="hl-field">Rollover interval (minutes)
        <input type="number" min="1" max="10080" step="1" required value={interval}
          disabled={saving || !settings.editable} onChange={(event) => { setInterval(event.target.value); setSaved(false); }} />
      </label>
      <label className="hl-field">Stop new auctions this many minutes before rollover
        <input type="number" min="0" max={Math.min(1440, Math.max(0, Number(interval) - 1))} step="1" required value={cutoff}
          disabled={saving || !settings.editable} onChange={(event) => { setCutoff(event.target.value); setSaved(false); }} />
      </label>
      <p>Set the cutoff to 0 to allow new auctions until rollover. Saving these options does not schedule the draft.</p>
      {error && <ErrorBlock error={error} fallback="Draft timing could not be saved." />}
      {saved && <p role="status">Timing options saved.</p>}
      <button type="submit" className="hl-button" disabled={saving || !settings.editable}>{saving ? "Saving…" : "Save timing options"}</button>
    </form>
  );
}

export function GoonDraftTimingSettings({ leagueId, fadId }) {
  const { httpClient } = useSession();
  const queryKey = ["league", leagueId, "free-agent-draft", fadId, "timing-settings"];
  const path = `/api/v1/leagues/${leagueId}/free-agent-drafts/${fadId}/timing-settings`;
  const query = useQuery({ queryKey, meta: { private: true, leagueId },
    queryFn: async ({ signal }) => (await httpClient.request(path, { authenticated: true, dataKind: "object", signal })).data,
  });
  return (
    <Surface className={styles.panel}>
      <h2>Commissioner: auction timing</h2>
      {query.isPending ? <LoadingBlock>Loading timing options…</LoadingBlock> : query.isError
        ? <ErrorBlock error={query.error} fallback="Draft timing could not be loaded." />
        : <TimingForm settings={query.data} path={path} queryKey={queryKey} />}
    </Surface>
  );
}
