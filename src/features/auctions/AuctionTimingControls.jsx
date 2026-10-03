import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorBlock, LoadingBlock, Surface } from '../../components/HundoUi.jsx';
import { createIdempotencyKey } from '../../shared/api/idempotency.js';
import { ResponseContractError } from '../../shared/api/responseContracts.js';
import { calendarInputValue, calendarTimestamp } from '../../shared/leagueCalendar.js';
import { useSession } from '../session/sessionContext.js';
import styles from '../commissioner/LeagueCommunications.module.css';

const timestamp = value => Number.isSafeInteger(value) && value >= 0 && value <= 8_640_000_000_000_000;
const validZone = value => { try { return typeof value === 'string' && Boolean(new Intl.DateTimeFormat('en', { timeZone: value })); } catch { return false; } };
export function AuctionTimingControls({ leagueId, auctionId }) {
  const session = useSession();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [editor, setEditor] = useState(null);
  const [preview, setPreview] = useState(null);
  const [receipt, setReceipt] = useState('');
  const base = `/api/v1/leagues/${encodeURIComponent(leagueId)}/auctions/${encodeURIComponent(auctionId)}/timing`;
  function validate(data, kind) {
    let valid = data?.leagueId === leagueId && data?.auctionId === auctionId;
    if (kind === 'accepted') valid &&= data.accepted === true && typeof data.replayed === 'boolean' && typeof data.id === 'string';
    else valid &&= timestamp(data.closesAtMs) && timestamp(data.serverNowMs) && validZone(data.timeZone) &&
      [data.playoffsAtMs, data.seasonEndsAtMs].every(t => t === null || timestamp(t)) &&
      typeof data.canEdit === 'boolean' && (data.blockedReason === null || typeof data.blockedReason === 'string');
    if (kind === 'status') valid &&= Array.isArray(data.history) && data.history.length <= 25 && data.history.every(h =>
      typeof h.id === 'string' && timestamp(h.previousClosesAtMs) && timestamp(h.closesAtMs) && timestamp(h.createdAtMs) &&
      typeof h.actorName === 'string' && typeof h.reason === 'string');
    if (kind === 'preview') valid &&= /^[a-f0-9]{64}$/.test(data.previewHash || '') && timestamp(data.proposed?.closesAtMs) &&
      typeof data.proposed?.reason === 'string' && typeof data.shortened === 'boolean';
    if (!valid) throw new ResponseContractError('The auction timing response could not be verified.');
    return true;
  }
  async function request(suffix, options, kind = 'status') {
    const response = await session.httpClient.request(base + suffix, { ...options, authenticated: true,
      dataKind: 'object', validateData: data => validate(data, kind) });
    validate(response.data, kind); return response.data;
  }
  const state = useQuery({ queryKey: ['league', leagueId, 'auction', auctionId, 'timing'], queryFn: ({ signal }) => request('', { signal }),
    enabled: expanded && session.status === 'authenticated', meta: { private: true, leagueId }, retry: false, refetchInterval: expanded ? 10_000 : false });
  const review = useMutation({ mutationFn: () => request('/preview', { method: 'POST',
    body: { closesAtMs: calendarTimestamp(editor.date, editor.timeZone), reason: editor.reason } }, 'preview'),
    onSuccess: data => setPreview({ ...data, key: createIdempotencyKey('auction-timing') }) });
  const apply = useMutation({ mutationFn: saved => request('/apply', { method: 'POST', idempotencyKey: saved.key,
    body: { ...saved.proposed, previewHash: saved.previewHash, confirmed: true } }, 'accepted'),
    onSuccess: async () => { setEditor(null); setPreview(null); setReceipt('Auction closing time updated. League members have been notified.');
      await queryClient.invalidateQueries({ queryKey: ['league', leagueId] }); } });
  const busy = review.isPending || apply.isPending;
  const display = (time, zone = state.data?.timeZone) => new Intl.DateTimeFormat(undefined, { timeZone: zone, dateStyle: 'medium', timeStyle: 'long' }).format(time);
  function edit(change) { setEditor(value => ({ ...value, ...change })); setPreview(null); setReceipt(''); review.reset(); apply.reset(); }
  return <Surface as="section" className={styles.section} aria-label="Auction closing time controls">
    <h2>Auction closing time</h2>
    {!expanded ? <button type="button" className="hl-button hl-button--secondary" onClick={() => setExpanded(true)}>Manage closing time</button> : <>
      <p>Change this in-season auction’s closing time before it closes. Existing bids and their original submission times stay intact. Bid details stay private.</p>
      {state.isPending && <LoadingBlock>Checking auction timing…</LoadingBlock>}
      {state.error && <ErrorBlock error={state.error} fallback="Auction timing controls are unavailable." />}
      {state.data && <>
        <p>Current closing time: <strong>{display(state.data.closesAtMs)}</strong>. Dates use {state.data.timeZone}.</p>
        {state.data.blockedReason && <p>{state.data.blockedReason}</p>}
        {state.data.canEdit && !editor && <button type="button" className="hl-button hl-button--secondary" onClick={() => {
          setEditor({ date: calendarInputValue(state.data.closesAtMs, state.data.timeZone), timeZone: state.data.timeZone, reason: '' }); setReceipt('');
        }}>Edit closing time</button>}
        {editor && state.data.canEdit && <form className={styles.editor} onSubmit={event => { event.preventDefault(); setPreview(null); apply.reset(); review.mutate(); }}>
          <p>Choose a future time before playoffs and the end of the season.</p>
          <label>New closing time ({editor.timeZone})<input type="datetime-local" required disabled={busy} value={editor.date} onChange={event => edit({ date: event.target.value })} /></label>
          <label>Reason for changing the closing time<input required minLength={3} maxLength={500} disabled={busy} value={editor.reason} onChange={event => edit({ reason: event.target.value })} /></label>
          <div className={styles.actions}><button type="submit" className="hl-button hl-button--secondary"
            disabled={busy || editor.reason.trim().length < 3 || calendarTimestamp(editor.date, editor.timeZone) === null}>Review closing time</button>
            <button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={() => { setEditor(null); setPreview(null); review.reset(); apply.reset(); }}>Cancel timing edit</button></div>
        </form>}
        {state.data.history.length > 0 && <details><summary>Recent closing-time changes</summary><ol>{state.data.history.map(h => <li key={h.id}>
          {display(h.createdAtMs)} — {h.actorName}: {display(h.previousClosesAtMs)} → {display(h.closesAtMs)}. Reason: {h.reason}
        </li>)}</ol></details>}
      </>}
      {review.error && <ErrorBlock error={review.error} fallback="This closing-time change could not be previewed." />}
      {preview && state.data?.canEdit && <section className={styles.preview} aria-label="Auction closing time preview">
        <h3>Review the new closing time</h3>
        <p>{display(preview.closesAtMs, preview.timeZone)} → <strong>{display(preview.proposed.closesAtMs, preview.timeZone)}</strong></p>
        <p><strong>{preview.shortened ? 'Managers will have less time to submit or edit bids.' : 'Managers will have more time to submit or edit bids.'}</strong></p>
        <p>All current bids remain in place. The auction will resolve using the new deadline. Other auctions keep their existing times.</p>
        <p>League members will receive a notice. Reason: {preview.proposed.reason}</p>
        <div className={styles.actions}><button type="button" className="hl-button hl-button--primary" disabled={busy} onClick={() => apply.mutate(preview)}>
          {apply.isPending ? 'Saving closing time…' : 'Confirm closing time'}</button>
          <button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={() => { setPreview(null); apply.reset(); }}>Keep current closing time</button></div>
        {apply.error && <ErrorBlock error={apply.error} fallback="The closing time could not be confirmed. Retry, or review again if the auction changed." />}
      </section>}
      {receipt && <p role="status">{receipt}</p>}
    </>}
  </Surface>;
}
