import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {ErrorBlock,LoadingBlock,Surface} from '../../components/HundoUi.jsx';
import {ResponseContractError} from '../../shared/api/responseContracts.js';
import {createIdempotencyKey} from '../../shared/api/idempotency.js';
import {useSession} from '../session/sessionContext.js';
import {SeasonYearCalendar} from './SeasonYearCalendar.jsx';
import {CalendarEventPopover} from './CalendarEventPopover.jsx';
import {WeekOneShiftControls} from './WeekOneShiftControls.jsx';
import {makeCalendarDraft,calendarOperations,editableCalendarEvents,workspaceEvents,stageCalendarEdit,calendarChangeRows,matchupNeighbour,calendarEventChoices} from './calendarWorkspaceModel.js';
import styles from './CalendarWorkspace.module.css';
import calendarStyles from './SeasonYearCalendar.module.css';
function verified(data,leagueId,kind){
 let ok=data?.leagueId===leagueId;
 if(kind==='read'){
  const time=v=>Number.isSafeInteger(v)&&v>=0&&v<=8_640_000_000_000_000,dates=(value,keys,nullable=false)=>!!value&&keys.every(k=>time(value[k])||(nullable&&value[k]===null));
  try{new Intl.DateTimeFormat('en',{timeZone:data.timeZone});}catch{ok=false;}
  ok&&=typeof data.timeZone==='string'&&time(data.serverNowMs)&&/^[a-f0-9]{64}$/.test(data.expectedVersion||'')&&
   (data.calendar===null||dates(data.calendar,['regularSeasonStartsAtMs','regularSeasonEndsAtMs','fantasyPlayoffsStartAtMs','fantasyPlayoffsEndAtMs'],true))&&
   Array.isArray(data.weeks)&&data.weeks.length<=100&&data.weeks.every(w=>typeof w.id==='string'&&dates(w,['startsAtMs','baselineAtMs','locksAtMs','endsAtMs','rollsOverAtMs']))&&
   Array.isArray(data.weekStatus)&&data.weekStatus.every(w=>typeof w.id==='string'&&Number.isSafeInteger(w.sequence)&&typeof w.status==='string')&&
   Array.isArray(data.events)&&data.events.length<=5000&&data.events.every(e=>typeof e.id==='string'&&typeof e.label==='string'&&time(e.atMs))&&
   Array.isArray(data.breaks)&&data.breaks.every(b=>typeof b.label==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(b.firstDay)&&/^\d{4}-\d{2}-\d{2}$/.test(b.lastDay)&&typeof b.source==='string'&&b.source.startsWith('https://'))&&
   Array.isArray(data.drafts)&&data.drafts.every(d=>typeof d.id==='string'&&typeof d.status==='string'&&time(d.deadlineAtMs)&&Array.isArray(d.rolloverTimesAtMs)&&d.rolloverTimesAtMs.every(time)&&Array.isArray(d.roundDates))&&
   Array.isArray(data.auctions)&&data.auctions.every(a=>typeof a.id==='string'&&time(a.closesAtMs))&&!!data.schedule&&!!data.trade;
 }
 if(kind==='preview')ok&&=/^[a-f0-9]{64}$/.test(data.previewHash||'')&&Array.isArray(data.warnings)&&data.warnings.every(w=>typeof w.code==='string'&&typeof w.message==='string')&&Array.isArray(data.proposed?.operations);
 if(kind==='accepted')ok&&=data.accepted===true&&typeof data.replayed==='boolean'&&typeof data.id==='string';
 if(!ok)throw new ResponseContractError('The calendar response could not be verified.');
 return true;
}
export function CalendarWorkspace({leagueId}){
 const session=useSession(),queryClient=useQueryClient(),[revision,setRevision]=useState(0),[receipt,setReceipt]=useState('');
 const base='/api/v1/leagues/'+encodeURIComponent(leagueId)+'/calendar/workspace';
 async function request(suffix,options={},kind='read'){
  const response=await session.httpClient.request(base+suffix,{...options,authenticated:true,dataKind:'object',validateData:data=>verified(data,leagueId,kind)});
  verified(response.data,leagueId,kind);return response.data;
 }
 const state=useQuery({queryKey:['league',leagueId,'calendar','workspace'],queryFn:({signal})=>request('',{signal}),enabled:session.status==='authenticated',retry:false,refetchOnWindowFocus:false,refetchOnReconnect:false,meta:{private:true,leagueId}});
 async function reload(saved=false){
  if(saved)await queryClient.invalidateQueries({queryKey:['league',leagueId]});
  const result=await state.refetch();if(result.error)throw result.error;
  setRevision(v=>v+1);if(saved)setReceipt('All calendar changes saved. League members have been notified.');
 }
 return <Surface as="section" className={calendarStyles.surface+' '+styles.workspace} aria-label="League calendar controls">
  {state.isPending&&<LoadingBlock>Loading league dates…</LoadingBlock>}
  {state.error&&<ErrorBlock error={state.error} fallback="The league calendar could not be loaded."/>}
  {session.status==='authenticated'&&state.data&&(state.data.calendar?<WorkspaceEditor key={leagueId+':'+revision} initial={state.data} request={request} reload={reload}/>:<p>Create or select a season to edit its calendar.</p>)}
  {receipt&&<p role="status">{receipt}</p>}
 </Surface>;
}
function WorkspaceEditor({initial,request,reload}){
 const reviewRef=useRef(null);
 const [movingEvent,setMovingEvent]=useState(null);
 const [original]=useState(initial),[draft,setDraft]=useState(()=>makeCalendarDraft(initial)),[undo,setUndo]=useState([]),[selection,setSelection]=useState(null),[selectedDay,setSelectedDay]=useState(null),[reason,setReason]=useState(''),[preview,setPreview]=useState(null),[localError,setLocalError]=useState(''),[saved,setSaved]=useState(false);
 const operations=useMemo(()=>calendarOperations(original,draft),[original,draft]),rows=useMemo(()=>calendarChangeRows(original,draft),[original,draft]);
 const events=useMemo(()=>workspaceEvents(original,draft),[original,draft]),editable=useMemo(()=>editableCalendarEvents(original,draft),[original,draft]);
 const close=useCallback(()=>setSelection(null),[]);
 const review=useMutation({mutationFn:()=>request('/preview',{method:'POST',body:{expectedVersion:original.expectedVersion,operations,reason}},'preview'),onSuccess:data=>{setPreview({...data,key:createIdempotencyKey('calendar-workspace')});requestAnimationFrame(()=>reviewRef.current?.scrollIntoView?.({behavior:'smooth',block:'center'}));},onError:()=>requestAnimationFrame(()=>reviewRef.current?.scrollIntoView?.({behavior:'smooth',block:'center'}))});
 const apply=useMutation({mutationFn:saved=>request('/apply',{method:'POST',idempotencyKey:saved.key,body:{...saved.proposed,confirmed:true,previewHash:saved.previewHash}},'accepted'),onSuccess:async()=>{setSaved(true);try{await reload(true);}catch{setLocalError('Your changes were saved, but the refreshed calendar could not be loaded.');}}});
 const busy=review.isPending||apply.isPending,dirty=operations.length>0;
 useEffect(()=>{if(!dirty||saved)return;const handler=e=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',handler);return()=>window.removeEventListener('beforeunload',handler);},[dirty,saved]);
 if(saved)return <div><p role="status">{localError||'All calendar changes saved. Reloading…'}</p><button type="button" onClick={()=>reload().catch(e=>setLocalError(e.message))}>Reload saved calendar</button></div>;
 function resetPreview(){setPreview(null);review.reset();apply.reset();setLocalError('');}
 function stage(event,at,gap,boundaryOptions){const next=stageCalendarEdit(draft,original,event,at,gap,boundaryOptions);setUndo(old=>[...old,draft]);setDraft(next);setMovingEvent(null);resetPreview();}
 function choose(item){setSelection(old=>({...old,event:item.editEvent||item}));}
 function picker(items,point,targetDay=null){
  const expanded=[...items];
  for(const week of items.filter(e=>e.kind==='matchup'))if(!items.some(e=>e.type==='week'&&e.recordId===week.id))expanded.push(...editable.filter(e=>e.type==='week'&&e.recordId===week.id&&e.edge!=='lock'));
  const candidates=calendarEventChoices(expanded.filter(e=>e.type||e.kind==='break'||e.blockedReason).map(e=>e.editEvent||e),draft,original);
  if(!candidates.length){setLocalError('No event on that day. Drag an event here, or choose one above.');return;}
  setLocalError('');setSelection({items:candidates,event:candidates.length===1?candidates[0]:null,point,targetDay});
 }
 function category(type,e){
  const rect=e.currentTarget.getBoundingClientRect(),items=editable.filter(x=>type==='week'?x.type==='week'&&x.edge!=='lock':type==='playoffs'?x.field?.includes('fantasyPlayoffs'):type==='schedule'?x.type==='schedule'||x.type==='auction':x.type===type);
  const unique=type==='schedule'?[...items.filter(x=>x.type==='auction'),...items.filter(x=>x.type==='schedule').slice(0,1)]:items;
  if(type==='trade'&&!unique.length)unique.push({id:'trade-deadline',label:'Trade deadline',kind:'trade',type:'trade',atMs:original.serverNowMs,firstDay:new Date(original.serverNowMs).toISOString().slice(0,10),blockedReason:original.trade.blockedReason});
  if(!unique.length){setLocalError(type==='fad'?'There is no Free Agent Draft scheduled for this season yet.':'No dates are available in this section.');return;}
  picker(unique,{x:rect.left,y:rect.bottom});
 }
 return <>
  <div className={styles.intro}><div><h2>Edit your season</h2><p>1. Click an event’s day. &nbsp; 2. Choose its new date and time. &nbsp; 3. Save when you’re finished.</p></div><span>You can also drag events between days.</span></div>
  {initial.expectedVersion!==original.expectedVersion&&<p role="status">The saved schedule has changed. Your draft is still here; review your changes before reloading.</p>}
  <div className={styles.saveBar}><span>{dirty?rows.length+' changes waiting to save':'No changes saved until you choose Save changes.'}</span>
   {dirty&&<label>Reason for changes<input value={reason} disabled={busy} maxLength={500} placeholder="Why change these dates?" onChange={e=>{setReason(e.target.value);resetPreview();}}/></label>}
   <button type="button" disabled={busy||dirty} onClick={()=>reload().catch(e=>setLocalError(e.message))}>Reload calendar</button>
   <button type="button" className="hl-button hl-button--primary" disabled={!dirty||busy||reason.trim().length<3} onClick={()=>{setPreview(null);review.mutate();}}>{review.isPending?'Checking schedule…':'Save changes'}</button>
  </div>
  <SeasonYearCalendar spacious calendar={draft.calendar} events={events} timeZone={original.timeZone} nowMs={original.serverNowMs} selectedDay={selectedDay} disabled={busy} movingEvent={movingEvent} onCancelMove={()=>setMovingEvent(null)}
   onSelectDay={(day,items,point)=>{setSelectedDay(day);if(movingEvent){setSelection({event:movingEvent,items:[movingEvent],point,targetDay:day});setMovingEvent(null);}else picker(items,point);}}
   onMoveEvent={(from,to,items,point)=>{setSelectedDay(to);picker(items.filter(e=>e.type&&!e.blockedReason&&!(e.edge==='lock'&&items.some(start=>start.type==='week'&&start.edge==='start'&&start.recordId===e.recordId))),point,to);}}
   toolbar={<div className={styles.shortcuts}>{[['week','Matchup weeks'],['schedule','Auctions'],['trade','Trade deadline'],['playoffs','Playoffs'],['fad','Free Agent Draft']].map(([key,label])=><button type="button" key={key} disabled={busy} onClick={e=>category(key,e)}>{label}</button>)}</div>}/>
  {selection&&<CalendarEventPopover key={(selection.event?.id||'picker')+':'+(selection.targetDay||'')} selection={selection} week={draft.weeks.find(w=>w.id===selection.event?.recordId)} neighbour={matchupNeighbour(draft,original,selection.event)} timeZone={original.timeZone} cutoffMinutes={draft.schedule.creationCutoffMinutes} onChoose={choose} onStage={stage} onClose={close} onPickDay={event=>{setMovingEvent(event);setSelectedDay(event.firstDay);close();}}/>}
  {localError&&<p role="status">{localError}</p>}
  <div className={styles.footerInfo}><p>NHL breaks are labelled from published season schedules. Other unmarked days are not assumed to be days off.</p>
   {!original.breaks.length&&<p>NHL break dates have not been verified for this season.</p>}
   <details><summary>Free Agent Draft dates · {original.drafts.length?original.drafts.map(d=>d.status.replaceAll('_',' ')).join(', '):'not scheduled'}</summary>
    {editable.filter(e=>e.type==='fad').length?<div className={styles.draftDates}>{editable.filter(e=>e.type==='fad').map(e=><button type="button" key={e.id} disabled={busy} onClick={click=>picker([e],{x:click.clientX,y:click.clientY})}>{e.label}<span>{new Intl.DateTimeFormat('en',{timeZone:original.timeZone,dateStyle:'medium',timeStyle:'short'}).format(e.atMs)}</span></button>)}</div>:<p>No Free Agent Draft has been scheduled in this season.</p>}
   </details>
  </div>
  <section className={styles.pending} aria-label="Unsaved calendar changes">
   <header><strong>{rows.length?rows.length+' unsaved change'+(rows.length===1?'':'s'):'No unsaved changes'}</strong><div><button type="button" disabled={!undo.length||busy} onClick={()=>{setDraft(undo.at(-1));setUndo(v=>v.slice(0,-1));resetPreview();}}>Undo</button><button type="button" disabled={!dirty||busy} onClick={()=>{setDraft(makeCalendarDraft(original));setUndo([]);resetPreview();}}>Discard changes</button></div></header>
   {!!rows.length&&<div className={styles.changeTable}><table><thead><tr><th>Event</th><th>Current</th><th>Proposed</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i}><th>{r.label}</th><td>{r.before}</td><td>{r.after}</td></tr>)}</tbody></table></div>}
   <div ref={reviewRef}>
   {review.error&&<ErrorBlock error={review.error} fallback="These dates need attention. Your changes have not been saved."/>}
   {preview&&<section className={styles.review} aria-label="Review schedule warnings"><h3>Review before saving</h3>
    {preview.warnings.length?<><p>Check these schedule details:</p><ul>{preview.warnings.map(w=><li key={w.code}>{w.message}</li>)}</ul></>:<p>No schedule conflicts were found.</p>}
    <p>All changes shown above will save together. League members will be notified.</p>
    <button type="button" className="hl-button hl-button--primary" disabled={busy} onClick={()=>apply.mutate(preview)}>{apply.isPending?'Saving…':'Confirm and save all changes'}</button>
    <button type="button" disabled={busy} onClick={()=>setPreview(null)}>Keep editing</button>
    {apply.error&&<ErrorBlock error={apply.error} fallback="Nothing was saved. Review the schedule again."/>}
   </section>}
   </div>
  </section>
  {original.weekOneShift&&<details><summary>Advanced Week 1 recovery</summary><p>Week 1 is tied to draft setup and has its own guarded recovery. Finish or discard calendar changes first.</p><fieldset disabled={dirty||busy}><WeekOneShiftControls leagueId={original.leagueId} seasonId={original.seasonId} week={original.weekOneShift} timeZone={original.timeZone}/></fieldset></details>}
 </>;
}
