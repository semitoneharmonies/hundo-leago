import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {calendarInputValue,calendarTimestamp} from '../../shared/leagueCalendar.js';
import {offsetDay} from './seasonCalendarModel.js';
import {moveMatchupStart} from './calendarWorkspaceModel.js';
import styles from './CalendarWorkspace.module.css';

const inputTimestamp=(day,time,edge,zone)=>calendarTimestamp((edge==='end'&&time==='00:00'?offsetDay(day,1):day)+'T'+time,zone);
export function CalendarEventPopover({selection,week,neighbour,timeZone,cutoffMinutes,onChoose,onStage,onClose,onPickDay}){
 const ref=useRef(null),event=selection.event,local=event?calendarInputValue(event.atMs,timeZone):'';
 const [day,setDay]=useState(selection.targetDay||event?.firstDay||''),[time,setTime]=useState(local.slice(11)||'00:00'),[gap,setGap]=useState(cutoffMinutes),[error,setError]=useState('');
 const neighbourAt=neighbour?.week[neighbour.edge==='end'?'endsAtMs':'startsAtMs'];
 const [moveTogether,setMoveTogether]=useState(event?.boundaryEdit?.moveTogether??neighbour?.joined??true);
 const [otherDay,setOtherDay]=useState(event?.boundaryEdit?.otherDay??(neighbour?calendarInputValue(neighbourAt-(neighbour.edge==='end'?1:0),timeZone).slice(0,10):''));
 const [otherTime,setOtherTime]=useState(event?.boundaryEdit?.otherTime??(neighbour?calendarInputValue(neighbourAt,timeZone).slice(11):'00:00'));
 let automaticLock=null;
 const startWeek=event?.edge==='start'?week:neighbour?.edge==='start'?neighbour.week:null;
 if(startWeek&&!event.blockedReason){
  try{const at=event.edge==='start'||moveTogether?inputTimestamp(day,time,event.edge,timeZone):inputTimestamp(otherDay,otherTime,'start',timeZone);if(Number.isSafeInteger(at))automaticLock=new Intl.DateTimeFormat('en',{timeZone,dateStyle:'medium',timeStyle:'short'}).format(moveMatchupStart(startWeek,at,timeZone).locksAtMs);}catch{/* Invalid dates are reported when the edit is submitted. */}
 }
 useEffect(()=>{
  const before=document.activeElement;ref.current?.querySelector('button,input')?.focus();
  function outside(e){if(!ref.current?.contains(e.target))onClose();}
  document.addEventListener('pointerdown',outside);
  return ()=>{document.removeEventListener('pointerdown',outside);before?.focus?.({preventScroll:true});};
 },[onClose]);
 const expanded=neighbour&&!moveTogether;
 const x=`clamp(8px, ${selection.point?.x||20}px, calc(100vw - ${expanded?436:356}px))`,y=`clamp(8px, ${selection.point?.y||100}px, calc(100dvh - ${expanded?660:480}px))`;
 function submit(e){e.preventDefault();setError('');try{
  const at=inputTimestamp(day,time,event.edge,timeZone),boundaryOptions=neighbour?{moveTogether,...(!moveTogether?{otherAtMs:inputTimestamp(otherDay,otherTime,neighbour.edge,timeZone)}:{})}:{};
  onStage(event,at,Number(gap),boundaryOptions);onClose();
 }catch(error){setError(error.message);}}
 return createPortal(<section ref={ref} role="dialog" aria-modal="true" aria-label={event?'Adjust '+event.label:'Choose an event'} className={[styles.popover,expanded?styles.breakPopover:''].join(' ')} style={{left:x,top:y}} onKeyDown={e=>{
  if(e.key==='Escape'){e.stopPropagation();onClose();}
  if(e.key==='Tab'){const nodes=[...ref.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]')],i=nodes.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();nodes.at(-1)?.focus();}else if(!e.shiftKey&&i===nodes.length-1){e.preventDefault();nodes[0]?.focus();}}
 }}>
  <header><strong>{event?event.label:selection.targetDay?'Which event are you moving?':'Choose an event'}</strong><button type="button" aria-label="Close event editor" onClick={onClose}>×</button></header>
  {!event?<div className={styles.eventChoices}>{selection.items.map(item=><button type="button" key={item.id} onClick={()=>onChoose(item)}><span>{item.label}</span><small>{item.blockedReason?'View date':item.recurring?'Weekly rule':'Edit date'}</small></button>)}</div>
   :<form onSubmit={submit}>
    {event.blockedReason&&<p>{event.blockedReason}</p>}
    {event.type==='schedule'&&<p>Moves the recurring closing weekday for new auctions. Existing auctions are separate events.</p>}
    {event.type==='schedule-cutoff'&&<p>Changes how long before closing new auctions stop. The weekly closing day and time stay the same.</p>}
    {event.kind==='break'&&<p>No NHL regular-season games. <a href={event.source} target="_blank" rel="noreferrer">NHL schedule source</a></p>}
    {!event.blockedReason&&event.type&&<>
    {neighbour&&<><label>Week boundary<select aria-label="Week boundary" value={moveTogether?'together':'break'} onChange={e=>{setMoveTogether(e.target.value==='together');setError('');}}><option value="together">Move both weeks together</option><option value="break">Leave a break between weeks</option></select></label><p>{moveTogether?'The earlier week ends when the next one starts.':'Set the end and start separately. Games during the break will not score.'}</p></>}
    {onPickDay&&<button type="button" className={styles.pickDay} onClick={()=>onPickDay({...event,boundaryEdit:{moveTogether,otherDay,otherTime}})}>Choose new day on calendar →</button>}
    {neighbour&&<strong>Week {neighbour.currentSequence} {event.edge==='end'?'ends':'starts'}</strong>}
    <div className={styles.dateFields}>
     <label>{event.edge==='end'?'Last day':'Date'}<input type="date" required value={day} onChange={e=>setDay(e.target.value)}/></label>
     <label>{event.edge==='start'?'Start time':event.edge==='end'?'End time':'Time'}<input type="time" required value={time} onChange={e=>setTime(e.target.value)}/></label>
    </div><small>{timeZone}{event.edge==='end'?' · 00:00 means midnight after the last day.':''}</small>
    {neighbour&&!moveTogether&&<fieldset className={styles.breakFields}><legend>Week {neighbour.sequence} {neighbour.edge==='end'?'ends':'starts'}</legend><div className={styles.dateFields}>
     <label>{neighbour.edge==='end'?'Last day':'First day'}<input aria-label={'Week '+neighbour.sequence+(neighbour.edge==='end'?' last day':' first day')} type="date" required value={otherDay} onChange={e=>setOtherDay(e.target.value)}/></label>
     <label>{neighbour.edge==='end'?'End time':'Start time'}<input aria-label={'Week '+neighbour.sequence+(neighbour.edge==='end'?' end time':' start time')} type="time" required value={otherTime} onChange={e=>setOtherTime(e.target.value)}/></label>
    </div>{neighbour.edge==='end'&&<small>00:00 means midnight after the last day.</small>}</fieldset>}
    {automaticLock&&<p role="status">Roster lock moves automatically to <strong>{automaticLock}</strong>. No separate edit needed.</p>}
    {event.type==='schedule'&&<label>Stop new auctions this many minutes before closing<input type="number" required min="0" max="10079" value={gap} onChange={e=>setGap(e.target.value)}/></label>}
    {error&&<p role="alert">{error}</p>}
    <button type="submit" className="hl-button hl-button--primary">Add to changes</button><small>Not saved yet. Use Save changes when finished.</small></>}
   </form>}
 </section>,document.body);
}
