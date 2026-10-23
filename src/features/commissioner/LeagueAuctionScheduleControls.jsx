import {useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {ErrorBlock,LoadingBlock,Surface} from '../../components/HundoUi.jsx';
import {createIdempotencyKey} from '../../shared/api/idempotency.js';
import {ResponseContractError} from '../../shared/api/responseContracts.js';
import {useSession} from '../session/sessionContext.js';
import styles from './LeagueCommunications.module.css';
const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const integer=value=>Number.isSafeInteger(value)&&value>=0;
const timeText=value=>String(Math.floor(value/60)).padStart(2,'0')+':'+String(value%60).padStart(2,'0');
const minutes=value=>/^\d{2}:\d{2}$/.test(value)?Number(value.slice(0,2))*60+Number(value.slice(3)):NaN;
const validSchedule=s=>s&&integer(s.closeWeekday)&&s.closeWeekday<=6&&integer(s.closeMinuteOfDay)&&s.closeMinuteOfDay<1440&&
 integer(s.creationCutoffMinutes)&&s.creationCutoffMinutes<s.closeWeekday*1440+s.closeMinuteOfDay;
const validWindow=w=>w&&['opensAtMs','newAuctionCutoffAtMs','bidClosesAtMs','scheduledResolutionAtMs','nextOpensAtMs'].every(k=>integer(w[k]))&&typeof w.canStart==='boolean';
export function LeagueAuctionScheduleControls({leagueId,renderCalendar,embedded=false}){
 const session=useSession(),client=useQueryClient();
 const [editor,setEditor]=useState(null),[preview,setPreview]=useState(null),[receipt,setReceipt]=useState('');
 const base='/api/v1/leagues/'+encodeURIComponent(leagueId)+'/calendar/auction-schedule';
 function validate(data,kind){
  let valid=data?.leagueId===leagueId;
  if(kind==='accepted')valid&&=data.accepted===true&&typeof data.id==='string'&&typeof data.replayed==='boolean';
  else{
   try{new Intl.DateTimeFormat('en',{timeZone:data?.timeZone});}catch{valid=false;}
   valid&&=typeof data.timeZone==='string'&&integer(data.serverNowMs)&&integer(data.revision)&&integer(data.openAuctionCount)&&
    typeof data.legacyDaily==='boolean'&&(data.schedule===null||validSchedule(data.schedule))&&validWindow(data.window)&&
    Array.isArray(data.history)&&data.history.length<=25&&data.history.every(h=>typeof h.id==='string'&&typeof h.actorName==='string'&&typeof h.reason==='string'&&integer(h.createdAtMs)&&validSchedule(h));
  }
  if(kind==='preview')valid&&=validSchedule(data.proposed)&&typeof data.proposed.reason==='string'&&validWindow(data.newWindow)&&
   typeof data.opensNow==='boolean'&&typeof data.closesNow==='boolean'&&/^[a-f0-9]{64}$/.test(data.previewHash||'');
  if(!valid)throw new ResponseContractError('The auction schedule response could not be verified.');
  return true;
 }
 async function request(suffix,options,kind='status'){
  const response=await session.httpClient.request(base+suffix,{...options,authenticated:true,dataKind:'object',validateData:data=>validate(data,kind)});
  validate(response.data,kind);return response.data;
 }
 const state=useQuery({queryKey:['league',leagueId,'calendar','auction-schedule'],queryFn:({signal})=>request('',{signal}),
  enabled:session.status==='authenticated',retry:false,meta:{private:true,leagueId}});
 const review=useMutation({mutationFn:()=>request('/preview',{method:'POST',body:{closeWeekday:Number(editor.day),closeMinuteOfDay:minutes(editor.time),creationCutoffMinutes:Number(editor.gap),reason:editor.reason}},'preview'),
  onSuccess:data=>setPreview({...data,key:createIdempotencyKey('auction-schedule')})});
 const apply=useMutation({mutationFn:saved=>request('/apply',{method:'POST',idempotencyKey:saved.key,body:{...saved.proposed,confirmed:true,previewHash:saved.previewHash}},'accepted'),
  onSuccess:async()=>{setPreview(null);setEditor(null);setReceipt('Auction schedule updated. League members have been notified.');await client.invalidateQueries({queryKey:['league',leagueId]});}});
 const busy=review.isPending||apply.isPending,available=session.status==='authenticated'&&state.data&&!state.isError;
 const display=value=>new Intl.DateTimeFormat(undefined,{timeZone:state.data.timeZone,dateStyle:'medium',timeStyle:'short'}).format(value);
 const description=s=>days[s.closeWeekday]+' at '+timeText(s.closeMinuteOfDay)+', with a '+s.creationCutoffMinutes+'-minute start cutoff';
 function edit(change){setEditor(old=>({...old,...change}));setPreview(null);setReceipt('');review.reset();apply.reset();}
 const Container=embedded?'div':Surface;
 return <Container as={embedded?undefined:'section'} className={styles.section} aria-label="Recurring auction schedule controls">
  {renderCalendar?.({disabled:busy||!available,editing:!!editor,onSelectDay:day=>{
   if(busy||!available)return;
   const current=state.data.schedule||{closeWeekday:6,closeMinuteOfDay:960,creationCutoffMinutes:3840};
   const closeWeekday=(new Date(day+'T12:00:00Z').getUTCDay()+6)%7;
   setEditor({day:String(closeWeekday),time:editor?.time||timeText(current.closeMinuteOfDay),gap:editor?.gap??String(current.creationCutoffMinutes),reason:editor?.reason||''});setReceipt('');setPreview(null);review.reset();apply.reset();
  }})}
  <h2 data-calendar-editor={!editor||undefined}>In-season auction schedule</h2>
  <p>Choose when newly started auctions close each week and how long before closing new auctions must stop. Each weekly window opens Monday at midnight.</p>
  {state.isPending&&<LoadingBlock>Loading auction schedule…</LoadingBlock>}
  {state.error&&<ErrorBlock error={state.error} fallback="Auction schedule controls are unavailable."/>}
  {available&&<>
   <p>Current rule: <strong>{state.data.schedule?description(state.data.schedule):state.data.legacyDaily?'Daily at 16:00, with no start cutoff gap':'Sunday at 16:00; new auctions stop Friday at midnight'}</strong> ({state.data.timeZone}).</p>
   <p>{state.data.openAuctionCount} existing auctions keep their saved closing times. <a href={'/leagues/'+encodeURIComponent(leagueId)+'/auctions'}>Edit an existing auction</a>.</p>
   {!editor&&<button type="button" className="hl-button hl-button--secondary" onClick={()=>{
    const s=state.data.schedule||{closeWeekday:6,closeMinuteOfDay:960,creationCutoffMinutes:3840};
    setEditor({day:String(s.closeWeekday),time:timeText(s.closeMinuteOfDay),gap:String(s.creationCutoffMinutes),reason:''});setReceipt('');
   }}>Edit auction schedule</button>}
   {editor&&<form data-calendar-editor className={styles.editor} onSubmit={event=>{event.preventDefault();setPreview(null);apply.reset();review.mutate();}}>
    <label>Closing day<select aria-label="Closing day" disabled={busy} value={editor.day} onChange={event=>edit({day:event.target.value})}>{days.map((d,i)=><option key={d} value={i}>{d}</option>)}</select></label>
    <label>Closing time ({state.data.timeZone})<input type="time" required disabled={busy} value={editor.time} onChange={event=>edit({time:event.target.value})}/></label>
    <label>Minutes before closing to stop new auctions<input type="number" min="0" max="10078" step="1" required disabled={busy} value={editor.gap} onChange={event=>edit({gap:event.target.value})}/></label>
    <p>Zero allows starts until closing. Gaps use elapsed minutes. A closing time skipped by daylight saving moves forward by the clock change.</p>
    <label>Reason for auction schedule change<input required minLength={3} maxLength={500} disabled={busy} value={editor.reason} onChange={event=>edit({reason:event.target.value})}/></label>
    <div className={styles.actions}><button type="submit" className="hl-button hl-button--secondary" disabled={busy||editor.reason.trim().length<3||editor.gap===''||!validSchedule({closeWeekday:Number(editor.day),closeMinuteOfDay:minutes(editor.time),creationCutoffMinutes:Number(editor.gap)})}>Review auction schedule</button>
     <button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={()=>{setEditor(null);setPreview(null);review.reset();apply.reset();}}>Cancel auction schedule editing</button></div>
   </form>}
   {review.error&&<ErrorBlock error={review.error} fallback="The auction schedule could not be previewed."/>}
   {preview&&<section className={styles.preview} aria-label="Auction schedule preview">
    <h3>Review auction schedule</h3>
    <p>New rule: <strong>{description(preview.proposed)}</strong> ({preview.timeZone}).</p>
    <p>This week’s new-auction cutoff: {display(preview.newWindow.newAuctionCutoffAtMs)}. Closing time: {display(preview.newWindow.bidClosesAtMs)}.</p>
    {preview.opensNow&&<p><strong>This reopens the weekly start window immediately, subject to the league’s other auction requirements.</strong></p>}
    {preview.closesNow&&<p><strong>This stops new auctions immediately for the rest of this weekly window.</strong></p>}
    {preview.legacyDaily&&<p>This replaces the existing daily schedule with the weekly rule shown above.</p>}
    <p>{preview.openAuctionCount} existing auctions keep their saved times and bids. League members will receive a notice. Reason: {preview.proposed.reason}</p>
    <div className={styles.actions}><button type="button" className="hl-button hl-button--primary" disabled={busy} onClick={()=>apply.mutate(preview)}>{apply.isPending?'Saving schedule…':'Confirm auction schedule'}</button>
     <button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={()=>{setPreview(null);apply.reset();}}>Keep current auction schedule</button></div>
    {apply.error&&<ErrorBlock error={apply.error} fallback="The auction schedule could not be saved. Retry or review again."/>}
   </section>}
   {state.data.history.length>0&&<details><summary>Recent auction schedule changes</summary><ol>{state.data.history.map(h=><li key={h.id}>{display(h.createdAtMs)} — {h.actorName}: {description(h)}. Reason: {h.reason}</li>)}</ol></details>}
  </>}
  {receipt&&<p role="status">{receipt}</p>}
 </Container>;
}

