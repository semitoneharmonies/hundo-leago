import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ErrorBlock } from '../../components/HundoUi.jsx';
import { createIdempotencyKey } from '../../shared/api/idempotency.js';
import { ResponseContractError } from '../../shared/api/responseContracts.js';
import { calendarInputValue, calendarTimestamp } from '../../shared/leagueCalendar.js';
import { useSession } from '../session/sessionContext.js';
import styles from './LeagueCommunications.module.css';

export function WeekOneShiftControls({ leagueId, seasonId, week, timeZone }) {
  const session = useSession(), queryClient = useQueryClient();
  const [date, setDate] = useState(calendarInputValue(week.startsAtMs, timeZone));
  const [preview, setPreview] = useState(null), [confirmation, setConfirmation] = useState(''), [saved, setSaved] = useState(false);
  const url = `/api/v1/leagues/${encodeURIComponent(leagueId)}/seasons/${encodeURIComponent(seasonId)}/matchup-weeks/${encodeURIComponent(week.weekId)}`;
  const display = value => new Intl.DateTimeFormat(undefined, { timeZone, dateStyle: 'medium', timeStyle: 'short' }).format(value);
  const review = useMutation({ mutationFn: async () => {
    const firstWeekStartsAtMs = calendarTimestamp(date, timeZone);
    const validateData = data => {
      if (data?.code !== 'MATCHUP_WEEK_ONE_SHIFT_PREVIEWED' || data.leagueId !== leagueId || data.seasonId !== seasonId || data.weekId !== week.weekId ||
          !Number.isSafeInteger(data.expectedWeekVersion) || data.expectedWeekVersion < 1 || data.firstWeekStartsAtMs !== firstWeekStartsAtMs ||
          !Number.isSafeInteger(data.previousFirstWeekStartsAtMs) || !Number.isSafeInteger(data.lastWeekEndsAtMs) ||
          !Number.isSafeInteger(data.shiftedWeekCount) || data.shiftedWeekCount < 1 || !/^[a-f0-9]{64}$/.test(data.previewHash || '') ||
          !Array.isArray(data.weeks) || data.weeks.length !== data.shiftedWeekCount || data.weeks.length > 100 ||
          !data.weeks.every(w => Number.isSafeInteger(w.sequence) && Number.isSafeInteger(w.startsAtMs) && Number.isSafeInteger(w.endsAtMs)))
        throw new ResponseContractError('The Week 1 shift preview could not be verified.');
      return true;
    };
    const response = await session.httpClient.request(url, { method: 'PATCH', authenticated: true, dataKind: 'object',
      body: { action: 'preview_shift_week_one', firstWeekStartsAtMs }, validateData });
    validateData(response.data); return response.data;
  }, onSuccess: data => { setPreview({ ...data, key: createIdempotencyKey('week-one-shift') }); setConfirmation(''); } });
  const apply = useMutation({ mutationFn: async () => {
    const validateData = data => {
      if (data?.seasonId !== seasonId || data.weekId !== week.weekId || data.firstWeekStartsAtMs !== preview.firstWeekStartsAtMs ||
          !Number.isSafeInteger(data.weekVersion) || data.weekVersion <= preview.expectedWeekVersion)
        throw new ResponseContractError('The Week 1 shift result could not be verified.');
      return true;
    };
    const response = await session.httpClient.request(url, { method: 'PATCH', authenticated: true, dataKind: 'object',
      version: preview.expectedWeekVersion, idempotencyKey: preview.key,
      body: { action: 'shift_week_one', firstWeekStartsAtMs: preview.firstWeekStartsAtMs, confirmation, previewHash: preview.previewHash }, validateData });
    validateData(response.data); return response.data;
  }, onSuccess: async () => { setSaved(true); setPreview(null); await queryClient.invalidateQueries({ queryKey: ['league', leagueId] }); } });
  const busy = review.isPending || apply.isPending;
  return <details><summary>Move Week 1 before Candidate Cards open</summary>
    <p>Move the whole matchup schedule together. Team pairings stay the same. The server checks every affected week and scheduled operation before saving.</p>
    <form className={styles.editor} onSubmit={event => { event.preventDefault(); setPreview(null); apply.reset(); review.mutate(); }}>
      <label>New Week 1 start ({timeZone})<input type="datetime-local" required disabled={busy} value={date} onChange={event => {
        setDate(event.target.value); setPreview(null); setConfirmation(''); setSaved(false); review.reset(); apply.reset();
      }} /></label>
      <button className="hl-button hl-button--secondary" disabled={busy} type="submit">Review Week 1 shift</button>
    </form>
    {review.error && <ErrorBlock error={review.error} fallback="Week 1 cannot be moved in its current state. Refresh the calendar and review draft readiness." />}
    {preview && <section className={styles.preview} aria-label="Week 1 shift preview">
      <h3>Review the full schedule shift</h3>
      <p>Week 1: {display(preview.previousFirstWeekStartsAtMs)} → {display(preview.firstWeekStartsAtMs)}. {preview.shiftedWeekCount} {preview.shiftedWeekCount === 1 ? 'week' : 'weeks'} will move.</p>
      <ol>{preview.weeks.map(w => <li key={w.sequence}>Week {w.sequence}: {display(w.startsAtMs)} – {display(w.endsAtMs)}</li>)}</ol>
      <p>The existing draft timetable must still fit before Week 1. This action is unavailable after Candidate Cards open.</p>
      <div className={styles.editor}><label>Type CHANGE WEEK 1 START to confirm<input disabled={busy} value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>
      <div className={styles.actions}>
        <button className="hl-button hl-button--primary" type="button" disabled={busy || confirmation !== 'CHANGE WEEK 1 START'} onClick={() => apply.mutate()}>Confirm Week 1 shift</button>
        <button className="hl-button hl-button--quiet" type="button" disabled={busy} onClick={() => { setPreview(null); apply.reset(); }}>Keep current Week 1</button>
      </div>
      </div>
      {apply.error && <ErrorBlock error={apply.error} fallback="The shift could not be confirmed. Retry the same confirmation, or request a new preview if the schedule changed." />}
    </section>}
    {saved && <p role="status">Week 1 and its matchup schedule were updated.</p>}
  </details>;
}
