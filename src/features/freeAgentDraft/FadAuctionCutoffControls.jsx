import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorBlock, LoadingBlock, Surface } from '../../components/HundoUi.jsx';
import { createIdempotencyKey } from '../../shared/api/idempotency.js';
import { ResponseContractError } from '../../shared/api/responseContracts.js';
import { useSession } from '../session/sessionContext.js';
import styles from '../commissioner/LeagueCommunications.module.css';

const display = time => new Date(time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const minuteGap = n => Number.isSafeInteger(n) && n >= 0 && n <= 10080;

export function FadAuctionCutoffControls({ leagueId, fadId }) {
  const session = useSession();
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState(null);
  const [preview, setPreview] = useState(null);
  const [receipt, setReceipt] = useState('');
  const base = `/api/v1/leagues/${encodeURIComponent(leagueId)}/free-agent-drafts/${encodeURIComponent(fadId)}/deadline-control/auction-cutoff`;
  function validate(data, kind) {
    let valid = data?.leagueId === leagueId && data?.fadId === fadId;
    if (kind === 'accepted') valid &&= data.accepted === true && typeof data.replayed === 'boolean' && typeof data.id === 'string';
    else valid &&= minuteGap(data.gapMinutes) && Number.isSafeInteger(data.serverNowMs) && typeof data.canEdit === 'boolean' &&
      (data.blockedReason === null || typeof data.blockedReason === 'string') && Array.isArray(data.rounds) &&
      data.rounds.every(r => Number.isSafeInteger(r.sequence) && Number.isSafeInteger(r.opensAtMs) &&
        Number.isSafeInteger(r.closesAtMs) && Number.isSafeInteger(r.cutoffAtMs) && typeof r.protected === 'boolean');
    if (kind === 'preview') valid &&= /^[a-f0-9]{64}$/.test(data.previewHash || '') && minuteGap(data.proposed?.gapMinutes) &&
      typeof data.proposed?.reason === 'string' && Array.isArray(data.changes) && Array.isArray(data.retained) &&
      data.changes.every(r => ['sequence', 'opensAtMs', 'closesAtMs', 'beforeCutoffAtMs', 'afterCutoffAtMs'].every(k => Number.isSafeInteger(r[k])) &&
        ['reopensNow', 'closesNow', 'noNominationWindow'].every(k => typeof r[k] === 'boolean')) &&
      data.retained.every(r => Number.isSafeInteger(r.sequence) && Number.isSafeInteger(r.cutoffAtMs) && typeof r.reason === 'string');
    if (!valid) throw new ResponseContractError('The auction cutoff response could not be verified.');
    return true;
  }
  async function request(suffix, options, kind = 'status') {
    const response = await session.httpClient.request(base + suffix, { ...options, authenticated: true, dataKind: 'object',
      validateData: data => validate(data, kind) });
    validate(response.data, kind);
    return response.data;
  }
  const state = useQuery({ queryKey: ['league', leagueId, 'free-agent-draft', fadId, 'auction-cutoff'],
    queryFn: ({ signal }) => request('', { signal }), enabled: session.status === 'authenticated',
    meta: { private: true, leagueId }, retry: false, refetchInterval: 10_000 });
  const review = useMutation({ mutationFn: () => request('/preview', { method: 'POST', body: {
    gapMinutes: Number(editor.gapMinutes), reason: editor.reason } }, 'preview'),
    onSuccess: data => setPreview({ ...data, key: createIdempotencyKey('fad-cutoff') }) });
  const apply = useMutation({ mutationFn: saved => request('/apply', { method: 'POST', idempotencyKey: saved.key,
    body: { ...saved.proposed, previewHash: saved.previewHash, confirmed: true } }, 'accepted'),
    onSuccess: async () => {
      setPreview(null); setEditor(null); setReceipt('Auction cutoff gap updated. Check each round for its current cutoff.');
      await queryClient.invalidateQueries({ queryKey: ['league', leagueId] });
    } });
  const busy = review.isPending || apply.isPending;
  function edit(change) {
    setEditor(current => ({ ...current, ...change })); setPreview(null); setReceipt(''); review.reset(); apply.reset();
  }
  return <Surface as="section" className={styles.section} aria-label="Edit auction cutoff">
    <h2>Auction nomination cutoff</h2>
    <p>Set how many minutes before a FAD round closes new nominations switch to the next round. Zero allows nominations until closing. Existing rules for queued nominations and draft extensions still apply.</p>
    {state.isPending && <LoadingBlock>Checking auction cutoffs…</LoadingBlock>}
    {state.error && <ErrorBlock error={state.error} fallback="Auction cutoff controls are unavailable." />}
    {state.data && <>
      <p>Gap for unused rounds and future extensions: <strong>{state.data.gapMinutes} minutes</strong>.</p>
      <p>Rounds with an existing auction or queued nomination keep their saved cutoff. Auction closing times stay the same.</p>
      <details><summary>Current round cutoffs</summary><ol>{state.data.rounds.map(r => <li key={r.sequence}>
        Round {r.sequence}: cutoff {display(r.cutoffAtMs)}; closes {display(r.closesAtMs)}{r.protected ? ' (retained)' : ''}.
      </li>)}</ol></details>
      {state.data.blockedReason && <p>{state.data.blockedReason}</p>}
      {state.data.canEdit && !editor && <button type="button" className="hl-button hl-button--secondary"
        onClick={() => { setEditor({ gapMinutes: String(state.data.gapMinutes), reason: '' }); setReceipt(''); }}>Edit cutoff gap</button>}
      {editor && state.data.canEdit && <form className={styles.editor} onSubmit={event => { event.preventDefault(); setPreview(null); apply.reset(); review.mutate(); }}>
        <label>Minutes before auction closing<input type="number" min="0" max="10080" step="1" required disabled={busy}
          value={editor.gapMinutes} onChange={event => edit({ gapMinutes: event.target.value })} /></label>
        <label>Reason for changing the cutoff<input required minLength={3} maxLength={500} disabled={busy} value={editor.reason}
          onChange={event => edit({ reason: event.target.value })} /></label>
        <div className={styles.actions}><button type="submit" className="hl-button hl-button--secondary"
          disabled={busy || editor.reason.trim().length < 3 || editor.gapMinutes === '' || !minuteGap(Number(editor.gapMinutes)) || Number(editor.gapMinutes) === state.data.gapMinutes}>Review cutoff changes</button>
          <button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={() => { setEditor(null); setPreview(null); review.reset(); apply.reset(); }}>Cancel cutoff editing</button></div>
      </form>}
    </>}
    {review.error && <ErrorBlock error={review.error} fallback="These cutoff changes could not be previewed." />}
    {preview && state.data?.canEdit && <section className={styles.preview} aria-label="Auction cutoff preview">
      <h3>Review the cutoff changes</h3>
      <p>Gap: {preview.gapMinutes} → <strong>{preview.proposed.gapMinutes} minutes</strong>. Times use {Intl.DateTimeFormat().resolvedOptions().timeZone}.</p>
      {preview.changes.length ? <ol>{preview.changes.map(r => <li key={r.sequence}>
        Round {r.sequence}: {display(r.beforeCutoffAtMs)} → <strong>{display(r.afterCutoffAtMs)}</strong>.
        {r.reopensNow && <strong> New nominations reopen immediately.</strong>}
        {r.closesNow && <strong> New nominations close immediately for this round.</strong>}
        {r.noNominationWindow && <strong> This round has no window for new nominations.</strong>}
      </li>)}</ol> : <p>No existing round cutoff will change. Future extensions will use the new gap.</p>}
      {preview.retained.length > 0 && <><h4>Retained cutoffs</h4><ul>{preview.retained.map(r => <li key={r.sequence}>
        Round {r.sequence}: {display(r.cutoffAtMs)} — {r.reason}.
      </li>)}</ul></>}
      <p>League members will receive a notice. Reason: {preview.proposed.reason}</p>
      <div className={styles.actions}><button type="button" className="hl-button hl-button--primary" disabled={busy} onClick={() => apply.mutate(preview)}>
        {apply.isPending ? 'Saving cutoff…' : 'Confirm cutoff changes'}</button>
        <button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={() => { setPreview(null); apply.reset(); }}>Keep current cutoffs</button></div>
      {apply.error && <ErrorBlock error={apply.error} fallback="The cutoff could not be confirmed. Retry, or review again if the draft changed." />}
    </section>}
    {receipt && <p role="status">{receipt}</p>}
  </Surface>;
}
