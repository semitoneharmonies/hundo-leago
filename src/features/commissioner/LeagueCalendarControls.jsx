import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorBlock, LoadingBlock, Surface } from '../../components/HundoUi.jsx';
import { createIdempotencyKey } from '../../shared/api/idempotency.js';
import { ResponseContractError } from '../../shared/api/responseContracts.js';
import { calendarInputValue, calendarTimestamp } from '../../shared/leagueCalendar.js';
import { useSession } from '../session/sessionContext.js';
import styles from './LeagueCommunications.module.css';
import { WeekOneShiftControls } from './WeekOneShiftControls.jsx';
import { CalendarEditToolbar } from './CalendarEditToolbar.jsx';
import { LeagueAuctionScheduleControls } from './LeagueAuctionScheduleControls.jsx';
import { SeasonYearCalendar } from './SeasonYearCalendar.jsx';
import { TradeDeadlineControls } from './TradeDeadlineControls.jsx';
import { FadTimingControls } from '../freeAgentDraft/FadTimingControls.jsx';
import { calendarDay, changeMatchupRange, leagueCalendarEvents } from './seasonCalendarModel.js';
import calendarStyles from './SeasonYearCalendar.module.css';

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
 const session = useSession(), queryClient = useQueryClient(),containerRef=useRef(null);
 const openEditor=()=>requestAnimationFrame(()=>containerRef.current?.querySelector('[data-calendar-editor]')?.scrollIntoView?.({behavior:'smooth',block:'center'}));
 const [editor, setEditor] = useState(null), [preview, setPreview] = useState(null), [receipt, setReceipt] = useState('');
 const [target,setTarget]=useState('browse'), [selectedDay,setSelectedDay]=useState(null), [range,setRange]=useState(null), [selectionError,setSelectionError]=useState('');
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
  if (data?.events != null) valid &&= Array.isArray(data.events) && data.events.length<=5000 && data.events.every(e=>
   typeof e.id==='string' && ['trade','draft','auction','auction-cutoff'].includes(e.kind) && typeof e.label==='string' && timestamp(e.atMs) &&
   (e.fadId===undefined || typeof e.fadId==='string') && (e.field===undefined || ['deadline','round'].includes(e.field)) &&
   (e.sequence===undefined || (Number.isSafeInteger(e.sequence)&&e.sequence>0)));
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
  onSuccess: async () => { setEditor(null); setPreview(null); setRange(null); setReceipt('Calendar updated. League members have been notified.');
   await queryClient.invalidateQueries({ queryKey: ['league', leagueId] }); } });
 const busy = review.isPending || apply.isPending;
 const available = session.status === 'authenticated' && state.data && !state.isError;
 const display = value => value === null ? 'Not set' : new Intl.DateTimeFormat(undefined, { timeZone: state.data.timeZone, dateStyle: 'medium', timeStyle: 'short' }).format(value);
 function change(updater) { setEditor(updater); setPreview(null); setReceipt(''); setSelectionError(''); review.reset(); apply.reset(); }
 function initialEditor() {
  const timeZone=state.data.timeZone;
  return {timeZone,reason:'',original:state.data,
   calendar:Object.fromEntries(Object.keys(seasonDateLabels).map(k=>[k,calendarInputValue(state.data.calendar[k],timeZone)])),
   weeks:state.data.weeks.map(w=>({id:w.id,...Object.fromEntries(Object.keys(weekDateLabels).map(k=>[k,calendarInputValue(w[k],timeZone)]))}))};
 }
 const dirty=!!editor&&(Object.keys(seasonDateLabels).some(k=>editor.calendar[k]!==calendarInputValue(editor.original.calendar[k],editor.timeZone))||editor.weeks.some(w=>Object.keys(weekDateLabels).some(k=>w[k]!==calendarInputValue(editor.original.weeks.find(row=>row.id===w.id)[k],editor.timeZone))));
 const external=target==='trade'||target==='auctions'||target.startsWith('draft:');
 const savedEvents=state.data?.events||[];
 const draftEvents=savedEvents.filter(e=>e.fadId&&e.field);
 const selectedDraft=draftEvents.find(e=>'draft:'+e.id===target);
 const selectedWeekId=target.startsWith('week:')?target.slice(5):null;
 const selectedWeek=editor?.weeks.find(w=>w.id===selectedWeekId);
 const selectedStatus=state.data?.weekStatus.find(w=>w.id===selectedWeekId);
 const weekProtected=['final','cancelled'].includes(selectedStatus?.status);
 function selectRange(first,last) {
  const current=editor||initialEditor();
  const weeks=changeMatchupRange(current.weeks,state.data.weekStatus,selectedWeekId,first,last,current.timeZone);
  if(!weeks){setSelectionError('Choose a valid range with the roster lock after the start and before the end.');return;}
  change({...current,weeks});setRange({firstDay:first,lastDay:last});openEditor();
 }
 function chooseTarget(value){setTarget(value);setRange(null);setSelectionError('');if(value.startsWith('week:')||value.startsWith('season:')){if(!editor)setEditor(initialEditor());}else if(!dirty){setEditor(null);setPreview(null);review.reset();apply.reset();}}
 function selectDay(day) {
  setSelectedDay(day);
  if(busy||state.data.blockedReason||weekProtected)return;
  if(selectedWeekId) {
   if(!range?.firstDay||range.lastDay){setRange({firstDay:day});setSelectionError('');}
   else if(day<range.firstDay){setRange({firstDay:day});}
   else selectRange(range.firstDay,day);
  } else if(target.startsWith('season:')) {
   const key=target.slice(7),current=editor||initialEditor();
   change({...current,calendar:{...current.calendar,[key]:day+'T'+(current.calendar[key].slice(11)||'00:00')}});openEditor();
  }
 }
 function drawCalendar({onSelectDay=selectDay,disabled=busy,editing=!!editor,events=savedEvents}={}) {
  const proposedCalendar=editor?Object.fromEntries(Object.keys(seasonDateLabels).map(k=>[k,enteredTime(editor.calendar[k],editor.original.calendar[k])])):state.data.calendar;
  const weeks=editor?editor.weeks.map(w=>({id:w.id,...Object.fromEntries(Object.keys(weekDateLabels).map(k=>[k,enteredTime(w[k],editor.original.weeks.find(row=>row.id===w.id)[k])]))})):state.data.weeks;
  return <SeasonYearCalendar calendar={state.data.calendar} events={leagueCalendarEvents(proposedCalendar,weeks,state.data.weekStatus,events,state.data.timeZone)} timeZone={state.data.timeZone} nowMs={state.data.serverNowMs}
   selectedDay={selectedDay} selectedRange={range} onSelectDay={(day,items)=>{setSelectedDay(day);onSelectDay(day,items);if(external)openEditor();}} disabled={disabled}
   toolbar={<CalendarEditToolbar target={target} onChange={chooseTarget} weekStatus={state.data.weekStatus} seasonDateLabels={seasonDateLabels} draftEvents={draftEvents} blocked={!!state.data.blockedReason} busy={busy||disabled&&editing} editing={external?editing:dirty} external={external} range={range} onOpenEditor={openEditor}/>}/>;
 }
 function externalEvents({tradeAtMs,dates}={}) {
  let events=savedEvents.map(event=>{
   if(event.kind==='trade'&&Number.isSafeInteger(tradeAtMs))return {...event,atMs:tradeAtMs};
   if(selectedDraft&&event.fadId===selectedDraft.fadId&&dates) {
    const atMs=event.field==='deadline'?dates.deadlineAtMs:event.field==='round'?dates.rolloverTimesAtMs?.[event.sequence-1]:event.atMs;
    return Number.isSafeInteger(atMs)?{...event,atMs}:event;
   }
   return event;
  });
  if(Number.isSafeInteger(tradeAtMs)&&!events.some(e=>e.kind==='trade'))events=[...events,{id:'trade-deadline',kind:'trade',label:'Trade deadline',atMs:tradeAtMs}];
  return events;
 }
 return <Surface as="section" ref={containerRef} className={styles.section+' '+calendarStyles.surface} aria-label="League calendar controls">

  {state.isPending && <LoadingBlock>Loading league dates…</LoadingBlock>}
  {state.error && <ErrorBlock error={state.error} fallback="League dates could not be loaded." />}
  {available && <>
   {!state.data.calendar ? <p>Create or select a season before editing its calendar.</p> : <>
    {target==='auctions' ? <LeagueAuctionScheduleControls leagueId={leagueId} embedded renderCalendar={props=>drawCalendar(props)}/>
     : target==='trade' ? <TradeDeadlineControls leagueId={leagueId} embedded renderCalendar={({atMs,...props})=>drawCalendar({...props,events:externalEvents({tradeAtMs:atMs})})}/>
     : selectedDraft ? <FadTimingControls key={selectedDraft.id} leagueId={leagueId} fadId={selectedDraft.fadId} embedded timeZone={state.data.timeZone}
       calendarField={selectedDraft.field==='deadline'?'deadline':String(selectedDraft.sequence-1)} renderCalendar={({dates,...props})=>drawCalendar({...props,events:externalEvents({dates})})}/>
     : drawCalendar()}
    {selectionError&&<p role="alert">{selectionError}</p>}
    <p className={calendarStyles.hint}>Unhighlighted days have no listed league event; they do not indicate NHL off-days.</p>
    {!external&&<>
    {state.data.weekOneShift && <WeekOneShiftControls key={leagueId + ':' + state.data.weekOneShift.version} leagueId={leagueId} seasonId={state.data.seasonId} week={state.data.weekOneShift} timeZone={state.data.timeZone} />}
    {state.data.blockedReason && <p>{state.data.blockedReason}</p>}
    {!editor && <button type="button" disabled={!!state.data.blockedReason} className="hl-button hl-button--secondary" onClick={()=>{setReceipt('');setEditor(initialEditor());if(target==='browse'){const editable=state.data.weekStatus.find(w=>!['final','cancelled'].includes(w.status));if(editable)setTarget('week:'+editable.id);}}}>Edit league calendar</button>}
    {editor && <form data-calendar-editor className={calendarStyles.editor} onSubmit={event => { event.preventDefault(); setPreview(null); apply.reset(); review.mutate(); }}>
     <fieldset disabled={busy || !!state.data.blockedReason} style={{ minWidth: 0 }}>
      <legend>{selectedStatus?'Week '+selectedStatus.sequence+' · ':'Dates in '}{editor.timeZone}</legend>
      {selectedWeek&&<div className={calendarStyles.selectedFields}>
       <label>First matchup day<input type="date" value={selectedWeek.startsAtMs.slice(0,10)} onChange={e=>selectRange(e.target.value,calendarDay(calendarTimestamp(selectedWeek.endsAtMs,editor.timeZone)-1,editor.timeZone))}/></label>
       <label>Last matchup day<input type="date" value={calendarDay(calendarTimestamp(selectedWeek.endsAtMs,editor.timeZone)-1,editor.timeZone)} onChange={e=>selectRange(selectedWeek.startsAtMs.slice(0,10),e.target.value)}/></label>
       <label>Roster lock time<input type="time" value={selectedWeek.locksAtMs.slice(11)} onChange={e=>change(old=>({...old,weeks:old.weeks.map(w=>w.id===selectedWeek.id?{...w,locksAtMs:w.locksAtMs.slice(0,10)+'T'+e.target.value}:w)}))}/></label>
      </div>}
      {selectedWeek&&<p className={calendarStyles.hint}>The last day is included. Rollover follows at midnight. The statistics baseline follows the week start, matching the previous week’s end when adjacent.</p>}
      {target.includes('fantasyPlayoffs')&&<><div className={calendarStyles.selectedFields}>{['fantasyPlayoffsStartAtMs','fantasyPlayoffsEndAtMs'].map(key=><label key={key}>{key==='fantasyPlayoffsStartAtMs'?'Playoff start':'Playoff end'}<input type="datetime-local" required value={editor.calendar[key]} onChange={e=>change(old=>({...old,calendar:{...old.calendar,[key]:e.target.value}}))}/></label>)}</div><p className={calendarStyles.hint}>Round 1 and Round 2 each last one week. The Final runs to the saved playoff end date.</p></>}
      {target.startsWith('season:')&&!target.includes('fantasyPlayoffs')&&<label>Selected date and time<input type="datetime-local" required value={editor.calendar[target.slice(7)]} onChange={e=>change(old=>({...old,calendar:{...old.calendar,[target.slice(7)]:e.target.value}}))}/></label>}
      <details><summary>Advanced dates and times</summary>
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
      </details>
      <label>Reason for calendar changes<input required minLength={3} maxLength={500} value={editor.reason} onChange={event => change(old => ({ ...old, reason: event.target.value }))} /></label>
     </fieldset>
     <div className={styles.actions}>
      <button type="submit" className="hl-button hl-button--secondary" disabled={busy || !!state.data.blockedReason || editor.reason.trim().length < 3}>Review calendar changes</button>
      <button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={() => { setEditor(null); setPreview(null); setRange(null); review.reset(); apply.reset(); }}>Cancel calendar editing</button>
     </div>
    </form>}
    </>}
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
