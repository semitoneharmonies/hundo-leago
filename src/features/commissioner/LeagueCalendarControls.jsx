import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorBlock, LoadingBlock, Surface } from '../../components/HundoUi.jsx';
import { createIdempotencyKey } from '../../shared/api/idempotency.js';
import { ResponseContractError } from '../../shared/api/responseContracts.js';
import { calendarInputValue, calendarTimestamp } from '../../shared/leagueCalendar.js';
import { useSession } from '../session/sessionContext.js';
import styles from './LeagueCommunications.module.css';
import { WeekOneShiftControls } from './WeekOneShiftControls.jsx';

const seasonDateLabels = {
 regularSeasonStartsAtMs: 'NHL season starts', regularSeasonEndsAtMs: 'NHL season ends',
 fantasyPlayoffsStartAtMs: 'Playoffs start', fantasyPlayoffsEndAtMs: 'Playoffs end',
};
const weekDateLabels = {
 startsAtMs: 'Week starts', baselineAtMs: 'Statistics baseline', locksAtMs: 'Roster lock',
 endsAtMs: 'Week ends', rollsOverAtMs: 'Week rollover',
};
const timestamp = value => Number.isSafeInteger(value) && value >= 0 && value <= 8_640_000_000_000_000;
const validDates = (row, labels, nullable = false) => row && Object.keys(labels).every(k => timestamp(row[k]) || (nullable && row[k] === null));

export function LeagueCalendarControls({ leagueId }) {
 const session = useSession(), queryClient = useQueryClient();
 const [editor, setEditor] = useState(null), [preview, setPreview] = useState(null), [receipt, setReceipt] = useState('');
 const base = '/api/v1/leagues/' + encodeURIComponent(leagueId) + '/calendar/season';
 function enteredTime(value, original) {
  return value === calendarInputValue(original, editor.timeZone) ? original : calendarTimestamp(value, editor.timeZone);
 }
 function validate(data, kind) {
  let valid = data?.leagueId === leagueId;
  if (kind === 'accepted') valid &&= data.accepted === true && typeof data.replayed === 'boolean' && typeof data.id === 'string';
  else {
   try { new Intl.DateTimeFormat('en', { timeZone: data?.timeZone }); } catch { valid = false; }
   valid &&= typeof data.timeZone === 'string' && timestamp(data.serverNowMs) &&
    (data.calendar === null || validDates(data.calendar, seasonDateLabels, true)) &&
    Array.isArray(data.weeks) && data.weeks.length <= 100 && data.weeks.every(w => typeof w.id === 'string' && validDates(w, weekDateLabels)) &&
    Array.isArray(data.weekStatus) && data.weekStatus.every(w => typeof w.id === 'string' && Number.isSafeInteger(w.sequence) && w.sequence > 0 && typeof w.status === 'string') &&
    Array.isArray(data.history) && data.history.length <= 25 && data.history.every(h => typeof h.id === 'string' && timestamp(h.createdAtMs) && typeof h.actorName === 'string' && typeof h.reason === 'string');
  }
  if (kind === 'preview') valid &&= /^[a-f0-9]{64}$/.test(data.previewHash || '') &&
   validDates(data.proposed?.calendar, seasonDateLabels) && Array.isArray(data.proposed?.weeks) &&
   data.proposed.weeks.every(w => typeof w.id === 'string' && validDates(w, weekDateLabels)) && typeof data.proposed.reason === 'string' &&
   Array.isArray(data.changes) && data.changes.every(c => typeof c.id === 'string' && Number.isSafeInteger(c.sequence) && Array.isArray(c.fields) &&
    c.fields.every(k => Object.hasOwn(weekDateLabels, k)) && validDates(c.before, weekDateLabels) && validDates(c.after, weekDateLabels)) &&
   Array.isArray(data.seasonFields) && data.seasonFields.every(k => Object.hasOwn(seasonDateLabels, k)) &&
   Number.isSafeInteger(data.pendingJobs) && data.pendingJobs >= 0 && typeof data.reopensAuctions === 'boolean' && typeof data.closesAuctions === 'boolean';
  if (data?.weekOneShift != null) valid &&= typeof data.weekOneShift.weekId === 'string' &&
   Number.isSafeInteger(data.weekOneShift.version) && data.weekOneShift.version > 0 && timestamp(data.weekOneShift.startsAtMs);
  if (data?.blockedReason != null) valid &&= typeof data.blockedReason === 'string';
  if (!valid) throw new ResponseContractError('The calendar response could not be verified.');
  return true;
 }
 async function request(suffix, options, kind = 'status') {
  const response = await session.httpClient.request(base + suffix, { ...options, authenticated: true, dataKind: 'object', validateData: data => validate(data, kind) });
  validate(response.data, kind); return response.data;
 }
 const state = useQuery({ queryKey: ['league', leagueId, 'calendar', 'season'], queryFn: ({ signal }) => request('', { signal }),
  enabled: session.status === 'authenticated', retry: false, meta: { private: true, leagueId } });
 const review = useMutation({ mutationFn: () => request('/preview', { method: 'POST', body: {
  calendar: Object.fromEntries(Object.keys(seasonDateLabels).map(k => [k, enteredTime(editor.calendar[k], editor.original.calendar[k])])),
  weeks: editor.weeks.map(w => ({ id: w.id, ...Object.fromEntries(Object.keys(weekDateLabels).map(k => [k, enteredTime(w[k], editor.original.weeks.find(row => row.id === w.id)[k])])) })),
  reason: editor.reason,
 } }, 'preview'), onSuccess: data => setPreview({ ...data, key: createIdempotencyKey('league-calendar') }) });
 const apply = useMutation({ mutationFn: saved => request('/apply', { method: 'POST', idempotencyKey: saved.key,
  body: { ...saved.proposed, confirmed: true, previewHash: saved.previewHash } }, 'accepted'),
  onSuccess: async () => { setEditor(null); setPreview(null); setReceipt('Calendar updated. League members have been notified.');
   await queryClient.invalidateQueries({ queryKey: ['league', leagueId] }); } });
 const busy = review.isPending || apply.isPending;
 const available = session.status === 'authenticated' && state.data && !state.isError;
 const display = value => value === null ? 'Not set' : new Intl.DateTimeFormat(undefined, { timeZone: state.data.timeZone, dateStyle: 'medium', timeStyle: 'short' }).format(value);
 function change(updater) { setEditor(updater); setPreview(null); setReceipt(''); review.reset(); apply.reset(); }
 return <Surface as="section" className={styles.section} aria-label="League calendar controls">
  <h2>League calendar</h2>
  <p>Edit matchup and playoff dates during the season. Review the affected dates and scheduled work before saving. Dates use your league’s time zone.</p>
  {state.isPending && <LoadingBlock>Loading league dates…</LoadingBlock>}
  {state.error && <ErrorBlock error={state.error} fallback="League dates could not be loaded." />}
  {available && <>
   {!state.data.calendar ? <p>Create or select a season before editing its calendar.</p> : <>
    <dl>{Object.entries(seasonDateLabels).map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{display(state.data.calendar[key])}</dd></div>)}</dl>
    {state.data.weekOneShift && <WeekOneShiftControls key={leagueId + ':' + state.data.weekOneShift.version} leagueId={leagueId} seasonId={state.data.seasonId} week={state.data.weekOneShift} timeZone={state.data.timeZone} />}
    {state.data.blockedReason && <p>{state.data.blockedReason}</p>}
    {!editor && <button type="button" disabled={!!state.data.blockedReason} className="hl-button hl-button--secondary" onClick={() => {
     const timeZone = state.data.timeZone; setReceipt(''); setEditor({ timeZone, reason: '', original: state.data,
      calendar: Object.fromEntries(Object.keys(seasonDateLabels).map(k => [k, calendarInputValue(state.data.calendar[k], timeZone)])),
      weeks: state.data.weeks.map(w => ({ id: w.id, ...Object.fromEntries(Object.keys(weekDateLabels).map(k => [k, calendarInputValue(w[k], timeZone)])) })),
     });
    }}>Edit league calendar</button>}
    {editor && <form className={styles.editor} onSubmit={event => { event.preventDefault(); setPreview(null); apply.reset(); review.mutate(); }}>
     <fieldset disabled={busy || !!state.data.blockedReason} style={{ minWidth: 0 }}>
      <legend>Dates in {editor.timeZone}</legend>
      <div className="hl-form-grid">{Object.entries(seasonDateLabels).map(([key, label]) => <label key={key}>{label}
       <input type="datetime-local" required value={editor.calendar[key]} onChange={event => change(old => ({ ...old, calendar: { ...old.calendar, [key]: event.target.value } }))} />
      </label>)}</div>
      <p>Processed results and roster locks stay protected. For a Week 1 start tied to an existing draft, use Free Agent Draft schedule recovery below.</p>
      {editor.weeks.map(w => <details key={w.id}>
       <summary>Week {state.data.weekStatus.find(row => row.id === w.id)?.sequence} · {state.data.weekStatus.find(row => row.id === w.id)?.status}</summary>
       <div className="hl-form-grid">{Object.entries(weekDateLabels).map(([key, label]) => <label key={key}>{label} — week {state.data.weekStatus.find(row => row.id === w.id)?.sequence}
        <input type="datetime-local" required value={w[key]} onChange={event => change(old => ({ ...old, weeks: old.weeks.map(row => row.id === w.id ? { ...row, [key]: event.target.value } : row) }))} />
       </label>)}</div>
      </details>)}
      <label>Reason for calendar changes<input required minLength={3} maxLength={500} value={editor.reason} onChange={event => change(old => ({ ...old, reason: event.target.value }))} /></label>
     </fieldset>
     <div className={styles.actions}>
      <button type="submit" className="hl-button hl-button--secondary" disabled={busy || !!state.data.blockedReason || editor.reason.trim().length < 3}>Review calendar changes</button>
      <button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={() => { setEditor(null); setPreview(null); review.reset(); apply.reset(); }}>Cancel calendar editing</button>
     </div>
    </form>}
   </>}
   {review.error && <ErrorBlock error={review.error} fallback="These dates could not be previewed." />}
   {preview && <section className={styles.preview} aria-label="Calendar change preview">
    <h3>Review calendar changes</h3>
    <ul>{preview.seasonFields.map(key => <li key={key}>{seasonDateLabels[key]}: {display(preview.calendar[key])} → {display(preview.proposed.calendar[key])}</li>)}
     {preview.changes.flatMap(c => c.fields.map(key => <li key={c.id + key}>Week {c.sequence}, {weekDateLabels[key]}: {display(c.before[key])} → {display(c.after[key])}</li>))}</ul>
    <p>{preview.pendingJobs} pending operations will move with these dates.</p>
    {preview.recoversUnprocessedLock&&<p><strong>This moves a missed roster lock that has never been attempted. Managers retain editing time until the new lock. Existing locks and results remain protected.</strong></p>}
    {preview.reopensAuctions && <p><strong>This reopens the season window for new auctions, subject to the league’s other rules.</strong></p>}
    {preview.closesAuctions && <p><strong>This closes the season window for new auctions immediately.</strong></p>}
    <p>Reason: {preview.proposed.reason}. League members will receive a notice.</p>
    <div className={styles.actions}>
     <button type="button" className="hl-button hl-button--primary" disabled={busy} onClick={() => apply.mutate(preview)}>{apply.isPending ? 'Saving calendar…' : 'Confirm calendar changes'}</button>
     <button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={() => { setPreview(null); apply.reset(); }}>Keep current calendar</button>
    </div>
    {apply.error && <ErrorBlock error={apply.error} fallback="The calendar could not be saved. Retry, or review again if it changed." />}
   </section>}
   {state.data.history.length > 0 && <details><summary>Recent calendar changes</summary><ol>{state.data.history.map(h => <li key={h.id}>{display(h.createdAtMs)} — {h.actorName}: {h.reason}</li>)}</ol></details>}
  </>}
  {receipt && <p role="status">{receipt}</p>}
 </Surface>;
}
