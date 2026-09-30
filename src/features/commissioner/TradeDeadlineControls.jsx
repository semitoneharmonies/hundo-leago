import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorBlock, LoadingBlock, Surface } from '../../components/HundoUi.jsx';
import { createIdempotencyKey } from '../../shared/api/idempotency.js';
import { ResponseContractError } from '../../shared/api/responseContracts.js';
import { calendarInputValue, calendarTimestamp } from '../../shared/leagueCalendar.js';
import { useSession } from '../session/sessionContext.js';
import styles from './LeagueCommunications.module.css';

const timestamp = value => Number.isSafeInteger(value) && value >= 0 && value <= 8_640_000_000_000_000;
const nullableTime = value => value === null || timestamp(value);
const validZone = value => { try { return typeof value === 'string' && Boolean(new Intl.DateTimeFormat('en', { timeZone: value })); } catch { return false; } };

export function TradeDeadlineControls({ leagueId }) {
  const session = useSession();
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState(null);
  const [preview, setPreview] = useState(null);
  const [receipt, setReceipt] = useState('');
  const base = `/api/v1/leagues/${encodeURIComponent(leagueId)}/calendar/trade-deadline`;
  function validate(data, kind) {
    let valid = data?.leagueId === leagueId;
    if (kind === 'accepted') valid &&= data.accepted === true && typeof data.replayed === 'boolean' && typeof data.id === 'string';
    else valid &&= nullableTime(data.tradeDeadlineAtMs) && timestamp(data.serverNowMs) && validZone(data.timeZone) &&
      typeof data.canEdit === 'boolean' && (data.blockedReason === null || typeof data.blockedReason === 'string');
    if (kind === 'status') valid &&= Array.isArray(data.history) && data.history.length <= 25 && data.history.every(h =>
      typeof h.id === 'string' && nullableTime(h.previousDeadlineAtMs) && timestamp(h.tradeDeadlineAtMs) && timestamp(h.createdAtMs) && typeof h.actorName === 'string' && typeof h.reason === 'string');
    if (kind === 'preview') valid &&= /^[a-f0-9]{64}$/.test(data.previewHash || '') && timestamp(data.proposed?.tradeDeadlineAtMs) &&
      typeof data.proposed?.reason === 'string' && typeof data.impact?.reopensDeadline === 'boolean' &&
      ['shortened', 'extended', 'expiredRetained', 'unchanged'].every(k => Number.isSafeInteger(data.impact[k]) && data.impact[k] >= 0);
    if (!valid) throw new ResponseContractError('The trade deadline response could not be verified.');
    return true;
  }
  async function request(suffix, options, kind = 'status') {
    const response = await session.httpClient.request(base + suffix, { ...options, authenticated: true, dataKind: 'object', validateData: data => validate(data, kind) });
    validate(response.data, kind); return response.data;
  }
  const state = useQuery({ queryKey: ['league', leagueId, 'calendar', 'trade-deadline'], queryFn: ({ signal }) => request('', { signal }),
    enabled: session.status === 'authenticated', meta: { private: true, leagueId }, retry: false, refetchInterval: 10_000 });
  const review = useMutation({ mutationFn: () => request('/preview', { method: 'POST', body: {
    tradeDeadlineAtMs: calendarTimestamp(editor.date, editor.timeZone), reason: editor.reason } }, 'preview'),
    onSuccess: data => setPreview({ ...data, key: createIdempotencyKey('trade-deadline') }) });
  const apply = useMutation({ mutationFn: saved => request('/apply', { method: 'POST', idempotencyKey: saved.key,
    body: { ...saved.proposed, previewHash: saved.previewHash, confirmed: true } }, 'accepted'),
    onSuccess: async () => { setEditor(null); setPreview(null); setReceipt('Trade deadline updated. League members have been notified.');
      await queryClient.invalidateQueries({ queryKey: ['league', leagueId] }); } });
  const busy = review.isPending || apply.isPending;
  const display = (time, zone = state.data?.timeZone) => time === null ? 'Not set' : new Intl.DateTimeFormat(undefined, { timeZone: zone, dateStyle: 'medium', timeStyle: 'long' }).format(time);
  function edit(change) { setEditor(value => ({ ...value, ...change })); setPreview(null); setReceipt(''); review.reset(); apply.reset(); }
  return <Surface as="section" className={styles.section} aria-label="Trade deadline controls">
    <h2>Trade deadline</h2>
    <p>Change the trade deadline during setup or the season. Choose a future time; extending a passed deadline permits new proposals once the league’s other trading requirements are met.</p>
    {state.isPending && <LoadingBlock>Checking the trade deadline…</LoadingBlock>}
    {state.error && <ErrorBlock error={state.error} fallback="Trade deadline controls are unavailable." />}
    {state.data && <>
      <p>Current deadline: <strong>{display(state.data.tradeDeadlineAtMs)}</strong>. Dates use {state.data.timeZone}.</p>
      {state.data.blockedReason && <p>{state.data.blockedReason}</p>}
      {state.data.canEdit && !editor && <button type="button" className="hl-button hl-button--secondary" onClick={() => {
        setEditor({ date: calendarInputValue(state.data.tradeDeadlineAtMs, state.data.timeZone), timeZone: state.data.timeZone, reason: '' }); setReceipt('');
      }}>Edit trade deadline</button>}
      {editor && state.data.canEdit && <form className={styles.editor} onSubmit={event => { event.preventDefault(); setPreview(null); apply.reset(); review.mutate(); }}>
        <label>New trade deadline ({editor.timeZone})<input type="datetime-local" required value={editor.date} disabled={busy} onChange={event => edit({ date: event.target.value })} /></label>
        <label>Reason for changing the trade deadline<input required minLength={3} maxLength={500} value={editor.reason} disabled={busy} onChange={event => edit({ reason: event.target.value })} /></label>
        <div className={styles.actions}><button type="submit" className="hl-button hl-button--secondary"
          disabled={busy || editor.reason.trim().length < 3 || calendarTimestamp(editor.date, editor.timeZone) === null}>Review trade deadline</button>
          <button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={() => { setEditor(null); setPreview(null); review.reset(); apply.reset(); }}>Cancel deadline editing</button></div>
      </form>}
      {state.data.history.length > 0 && <details><summary>Recent deadline changes</summary><ol>{state.data.history.map(h => <li key={h.id}>
        {display(h.createdAtMs)} — {h.actorName}: {display(h.previousDeadlineAtMs)} → {display(h.tradeDeadlineAtMs)}. Reason: {h.reason}
      </li>)}</ol></details>}
    </>}
    {review.error && <ErrorBlock error={review.error} fallback="This deadline change could not be previewed." />}
    {preview && state.data?.canEdit && <section className={styles.preview} aria-label="Trade deadline preview">
      <h3>Review the new trade deadline</h3>
      <p>{display(preview.tradeDeadlineAtMs, preview.timeZone)} → <strong>{display(preview.proposed.tradeDeadlineAtMs, preview.timeZone)}</strong></p>
      {preview.impact.reopensDeadline && <p><strong>The old deadline has passed. This change permits new proposals once the league’s other trading requirements are met.</strong></p>}
      <ul><li>{preview.impact.shortened} open proposals will have an earlier acceptance deadline.</li>
        <li>{preview.impact.extended} open proposals will have a later acceptance deadline.</li>
        <li>{preview.impact.unchanged} open proposals keep their current deadline.</li>
        <li>{preview.impact.expiredRetained} proposals awaiting expiry processing stay expired.</li></ul>
      <p>Each proposal keeps its original seven-day expiry limit. Expired offers stay expired, and completed trades remain unchanged. Proposal contents stay private.</p>
      <p>League members will receive a notice. Reason: {preview.proposed.reason}</p>
      <div className={styles.actions}><button type="button" className="hl-button hl-button--primary" disabled={busy} onClick={() => apply.mutate(preview)}>
        {apply.isPending ? 'Saving deadline…' : 'Confirm trade deadline'}</button>
        <button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={() => { setPreview(null); apply.reset(); }}>Keep current trade deadline</button></div>
      {apply.error && <ErrorBlock error={apply.error} fallback="The deadline could not be confirmed. Retry, or review again if the league changed." />}
    </section>}
    {receipt && <p role="status">{receipt}</p>}
  </Surface>;
}
