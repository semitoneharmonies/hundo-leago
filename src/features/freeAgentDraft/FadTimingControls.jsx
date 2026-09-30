import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorBlock, LoadingBlock, Surface } from '../../components/HundoUi.jsx';
import { createIdempotencyKey } from '../../shared/api/idempotency.js';
import { ResponseContractError } from '../../shared/api/responseContracts.js';
import { useSession } from '../session/sessionContext.js';
import styles from '../commissioner/LeagueCommunications.module.css';

function localInput(time) {
  const date = new Date(time);
  return new Date(time - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 19);
}
const display = time => new Date(time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export function FadTimingControls({ leagueId, fadId }) {
  const session = useSession();
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState(null);
  const [preview, setPreview] = useState(null);
  const [receipt, setReceipt] = useState('');
  const base = `/api/v1/leagues/${encodeURIComponent(leagueId)}/free-agent-drafts/${encodeURIComponent(fadId)}/deadline-control/timing`;
  function validate(data, kind) {
    let valid = data?.leagueId === leagueId && data?.fadId === fadId;
    if (kind === 'accepted') valid &&= data.accepted === true && typeof data.replayed === 'boolean' && typeof data.id === 'string';
    else valid &&= Number.isSafeInteger(data.deadlineAtMs) && Number.isSafeInteger(data.weekOneAtMs) &&
      Number.isSafeInteger(data.serverNowMs) && typeof data.held === 'boolean' && typeof data.canReschedule === 'boolean' &&
      typeof data.reminderAlreadySent === 'boolean' && (data.blockedReason === null || typeof data.blockedReason === 'string') &&
      Array.isArray(data.rolloverTimesAtMs) && data.rolloverTimesAtMs.length > 0 && data.rolloverTimesAtMs.length <= 1000 &&
      data.rolloverTimesAtMs.every(Number.isSafeInteger);
    if (kind !== 'accepted') valid &&= typeof data.canEditDeadline === 'boolean' && typeof data.canEditActiveAuctions === 'boolean' &&
      Array.isArray(data.roundDates) && data.roundDates.length === data.rolloverTimesAtMs.length &&
      data.roundDates.every((r,i) => r.sequence === i+1 && typeof r.canEdit === 'boolean' &&
        (r.blockedReason === null || typeof r.blockedReason === 'string'));
    if (kind === 'preview') valid &&= Number.isSafeInteger(data.affectedAuctions) && data.affectedAuctions >= 0 && /^[a-f0-9]{64}$/.test(data.previewHash || '') &&
      typeof data.proposed?.reason === 'string' && Number.isSafeInteger(data.proposed?.deadlineAtMs) &&
      Array.isArray(data.proposed?.rolloverTimesAtMs) && data.proposed.rolloverTimesAtMs.length === data.rolloverTimesAtMs.length &&
      data.proposed.rolloverTimesAtMs.every(Number.isSafeInteger);
    if (!valid) throw new ResponseContractError('The draft schedule response could not be verified.');
    return true;
  }
  async function request(suffix, options, kind = 'status') {
    const response = await session.httpClient.request(base + suffix, { ...options, authenticated: true, dataKind: 'object',
      validateData: data => validate(data, kind) });
    validate(response.data, kind);
    return response.data;
  }
  const state = useQuery({ queryKey: ['league', leagueId, 'free-agent-draft', fadId, 'timing'],
    queryFn: ({ signal }) => request('', { signal }), enabled: session.status === 'authenticated',
    meta: { private: true, leagueId }, retry: false, refetchInterval: 10_000 });
  const review = useMutation({ mutationFn: () => request('/preview', { method: 'POST', body: {
    deadlineAtMs: new Date(editor.deadline).getTime(), rolloverTimesAtMs: editor.rounds.map(t => new Date(t).getTime()), reason: editor.reason } }, 'preview'),
    onSuccess: data => setPreview({ ...data, key: createIdempotencyKey('fad-timing') }) });
  const apply = useMutation({ mutationFn: saved => request('/apply', { method: 'POST', idempotencyKey: saved.key,
    body: { ...saved.proposed, previewHash: saved.previewHash, confirmed: true } }, 'accepted'),
    onSuccess: async (_data, saved) => {
      setPreview(null); setEditor(null); setReceipt(saved.canEditDeadline
        ? 'Draft schedule updated. Automatic processing will check the cards at the new target.'
        : 'Draft schedule updated. Rounds and affected auctions will follow the new dates.');
      await queryClient.invalidateQueries({ queryKey: ['league', leagueId] });
    } });
  const busy = review.isPending || apply.isPending;
  function edit(change) {
    setEditor(current => ({ ...current, ...change })); setPreview(null); setReceipt(''); review.reset(); apply.reset();
  }
  return <Surface as="section" className={styles.section} aria-label="Edit draft timing">
    <h2>Draft timing</h2>
    {state.isPending && <LoadingBlock>Checking the schedule…</LoadingBlock>}
    {state.error && <ErrorBlock error={state.error} fallback="The draft schedule is unavailable." />}
    {state.data && <>
      <p>Candidate Card target: <strong>{display(state.data.deadlineAtMs)}</strong></p>
      <p>All rounds must finish by Week 1: {display(state.data.weekOneAtMs)}.</p>
      {state.data.blockedReason && <p>{state.data.blockedReason}</p>}
      {state.data.canReschedule && !editor && <button type="button" className="hl-button hl-button--secondary"
        onClick={() => { setEditor({ deadline: localInput(state.data.deadlineAtMs), rounds: state.data.rolloverTimesAtMs.map(localInput), reason: '' }); setReceipt(''); }}>
        {state.data.canEditDeadline ? 'Edit target and round dates' : state.data.canEditActiveAuctions ? 'Edit round dates' : 'Edit future round dates'}</button>}
      {editor && state.data.canReschedule && <form className={styles.editor} onSubmit={event => { event.preventDefault(); setPreview(null); apply.reset(); review.mutate(); }}>
        <p>Dates use your local time zone ({Intl.DateTimeFormat().resolvedOptions().timeZone}). {state.data.canEditDeadline
          ? 'Leave time for new nominations before the configured first-round cutoff.'
          : state.data.canEditActiveAuctions
            ? 'You can change eligible rounds and their open manager-started auctions together. Queued nominations, restricted auctions and completed results remain protected.'
            : 'Only unused rounds that have not opened can change. Cards stay locked and accepted auction and nomination times are preserved.'}</p>
        <label>Candidate Card target<input type="datetime-local" step="1" required disabled={busy || !state.data.canEditDeadline} value={editor.deadline}
          onChange={event => edit({ deadline: event.target.value })} /></label>
        <details open><summary>Auction round closing times</summary>
          {editor.rounds.map((time, index) => <label key={index}>Round {index + 1} closes
            <input type="datetime-local" step="1" required disabled={busy || !state.data.roundDates[index]?.canEdit} value={time}
              onChange={event => edit({ rounds: editor.rounds.map((t, i) => i === index ? event.target.value : t) })} />
            {state.data.roundDates[index]?.blockedReason && <span>{state.data.roundDates[index].blockedReason}</span>}
          </label>)}
        </details>
        <label>Reason for changing dates<input required minLength={3} maxLength={500} disabled={busy} value={editor.reason}
          onChange={event => edit({ reason: event.target.value })} /></label>
        <div className={styles.actions}><button type="submit" className="hl-button hl-button--secondary" disabled={busy || editor.reason.trim().length < 3}>Review date changes</button>
          <button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={() => { setEditor(null); setPreview(null); review.reset(); apply.reset(); }}>Cancel editing</button></div>
      </form>}
    </>}
    {review.error && <ErrorBlock error={review.error} fallback="These date changes could not be previewed." />}
    {preview && state.data?.canReschedule && <section className={styles.preview} aria-label="Draft timing preview">
      <h3>Review the new schedule</h3>
      {preview.canEditDeadline && <p>Candidate Card target: {display(preview.deadlineAtMs)} → <strong>{display(preview.proposed.deadlineAtMs)}</strong></p>}
      <ol>{preview.proposed.rolloverTimesAtMs.map((time, i) => <li key={i}>
        Round {i + 1}: {time === preview.rolloverTimesAtMs[i] ? <>Unchanged — {display(time)}</>
          : <>{display(preview.rolloverTimesAtMs[i])} → <strong>{display(time)}</strong></>}
      </li>)}</ol>
      {preview.canEditDeadline
        ? <p>Saved cards stay intact. Any hold or earlier processing authorization is cleared. Complete, valid cards process automatically at the new target; unfinished cards hold again.</p>
        : <p>Cards remain locked. {preview.affectedAuctions} open auctions will use the new closing times. Bids and original acceptance records are preserved. Queued nominations, restricted auctions and completed rounds are unchanged. Moving a round’s closing time also moves the next round’s opening. Shorter rounds give managers less time.</p>}
      <p>Existing private help permissions keep their original expiry. Changed rounds use the configured nomination cutoff gap, bounded by the round’s opening.</p>
      {preview.canEditDeadline && preview.reminderAlreadySent && <p>The earlier automatic reminder stays in history. You can send another reminder from league communications.</p>}
      <p>League members will receive a notice. Reason: {preview.proposed.reason}</p>
      <div className={styles.actions}><button type="button" className="hl-button hl-button--primary" disabled={busy} onClick={() => apply.mutate(preview)}>
        {apply.isPending ? 'Saving dates…' : 'Confirm date changes'}</button>
        <button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={() => { setPreview(null); apply.reset(); }}>Keep current dates</button></div>
      {apply.error && <ErrorBlock error={apply.error} fallback="Dates could not be confirmed. Retry, or review again if the schedule changed." />}
    </section>}
    {receipt && <p role="status">{receipt}</p>}
  </Surface>;
}
