import {calendarInputValue,calendarTimestamp} from '../../shared/leagueCalendar.js';
import {calendarDay,offsetDay,leagueCalendarEvents} from './seasonCalendarModel.js';
export const seasonLabels={regularSeasonStartsAtMs:'NHL season starts',regularSeasonEndsAtMs:'NHL season ends',fantasyPlayoffsStartAtMs:'Playoffs start',fantasyPlayoffsEndAtMs:'Playoffs end'};
const weekKeys=['startsAtMs','baselineAtMs','locksAtMs','endsAtMs','rollsOverAtMs'];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export const localDayDifference=(a,b)=>Math.round((Date.parse(a+'T12:00:00Z')-Date.parse(b+'T12:00:00Z'))/86400000);
export function makeCalendarDraft(data){
 return {calendar:{...data.calendar},weeks:data.weeks.map(w=>({...w})),tradeDeadlineAtMs:data.trade.tradeDeadlineAtMs,
  schedule:{...(data.schedule.schedule||{closeWeekday:6,closeMinuteOfDay:960,creationCutoffMinutes:2400})},
  drafts:data.drafts.map(d=>({id:d.id,deadlineAtMs:d.deadlineAtMs,rolloverTimesAtMs:[...d.rolloverTimesAtMs]})),
  auctions:data.auctions.map(a=>({id:a.id,closesAtMs:a.closesAtMs}))};
}
export function calendarOperations(original,draft){
 const before=makeCalendarDraft(original),ops=[];
 const add=(kind,id,value)=>ops.push({kind,id,value});
 if(!same(before.calendar,draft.calendar)||!same(before.weeks,draft.weeks))add('calendar',null,{calendar:draft.calendar,weeks:draft.weeks.map(w=>({id:w.id,...Object.fromEntries(weekKeys.map(k=>[k,w[k]]))}))});
 if(before.tradeDeadlineAtMs!==draft.tradeDeadlineAtMs)add('trade',null,{tradeDeadlineAtMs:draft.tradeDeadlineAtMs});
 if(!same(before.schedule,draft.schedule))add('schedule',null,draft.schedule);
 for(const d of draft.drafts)if(!same(d,before.drafts.find(x=>x.id===d.id)))add('fad',d.id,{deadlineAtMs:d.deadlineAtMs,rolloverTimesAtMs:d.rolloverTimesAtMs});
 for(const a of draft.auctions)if(!same(a,before.auctions.find(x=>x.id===a.id)))add('auction',a.id,{closesAtMs:a.closesAtMs});
 return ops;
}
export function moveMatchupStart(week,at,timeZone){
 const old=calendarInputValue(week.startsAtMs,timeZone),lock=calendarInputValue(week.locksAtMs,timeZone),next=calendarInputValue(at,timeZone);
 // Preserve the league-local gap, including the time of day, across DST.
 const gap=Date.parse(lock+'Z')-Date.parse(old+'Z');
 const lockLocal=new Date(Date.parse(next+'Z')+gap).toISOString().slice(0,16);
 const lockAt=calendarTimestamp(lockLocal,timeZone);
 if(lockAt===null)throw Error('The automatic roster lock falls in a daylight-saving clock change. Choose another start time.');
 return {...week,startsAtMs:at,baselineAtMs:at,locksAtMs:lockAt};
}
export function matchupNeighbour(draft,original,event){
 if(event?.type!=='week'||!['start','end'].includes(event.edge))return null;
 const status=original.weekStatus.find(w=>w.id===event.recordId),week=draft.weeks.find(w=>w.id===event.recordId);
 if(!status||!week)return null;
 const neighbourStatus=original.weekStatus.find(w=>w.sequence===status.sequence+(event.edge==='start'?-1:1)),neighbour=draft.weeks.find(w=>w.id===neighbourStatus?.id);
 if(!neighbour)return null;
 const previous=event.edge==='start'?neighbour:week,next=event.edge==='start'?week:neighbour;
 const previousSequence=event.edge==='start'?neighbourStatus.sequence:status.sequence,nextSequence=previousSequence+1;
 return {week:neighbour,sequence:neighbourStatus.sequence,currentSequence:status.sequence,edge:event.edge==='start'?'end':'start',joined:previous.endsAtMs===next.startsAtMs,key:previous.id+':'+next.id,label:'Week '+previousSequence+' ends / Week '+nextSequence+' starts'};
}
export function calendarEventChoices(items,draft,original){
 const choices=new Map();
 for(const event of items){
  const neighbour=matchupNeighbour(draft,original,event),joined=neighbour?.joined&&!event.blockedReason;
  const key=joined?neighbour.key:event.id;
  if(!choices.has(key)||(joined&&event.edge==='start'))choices.set(key,joined?{...event,label:neighbour.label}:event);
 }
 return [...choices.values()];
}
export function moveMatchupBoundary(draft,original,id,edge,at,options={}){
 const weeks=draft.weeks.map(w=>({...w})),week=weeks.find(w=>w.id===id),status=original.weekStatus.find(w=>w.id===id);
 if(!week||!status)throw Error('This matchup is no longer available.');
 const prev=weeks.find(w=>original.weekStatus.find(s=>s.id===w.id)?.sequence===status.sequence-1);
 const next=weeks.find(w=>original.weekStatus.find(s=>s.id===w.id)?.sequence===status.sequence+1);
 const before=week[edge==='start'?'startsAtMs':edge==='lock'?'locksAtMs':'endsAtMs'];
 if(edge==='start'){
  Object.assign(week,moveMatchupStart(week,at,original.timeZone));
  if(prev){const together=options.moveTogether??prev.endsAtMs===before,previousEnd=together?at:options.otherAtMs??prev.endsAtMs;if(previousEnd!==prev.endsAtMs){prev.endsAtMs=previousEnd;prev.rollsOverAtMs=previousEnd;}}
 }else if(edge==='lock')week.locksAtMs=at;
 else{
  week.endsAtMs=at;week.rollsOverAtMs=at;
  if(next){const together=options.moveTogether??next.startsAtMs===before,nextStart=together?at:options.otherAtMs??next.startsAtMs;if(nextStart!==next.startsAtMs)Object.assign(next,moveMatchupStart(next,nextStart,original.timeZone));}
 }
 for(const w of weeks){
  if(same(w,draft.weeks.find(x=>x.id===w.id)))continue;
  const saved=original.weeks.find(x=>x.id===w.id),s=original.weekStatus.find(x=>x.id===w.id);
  if(['final','cancelled'].includes(s.status))throw Error('Week '+s.sequence+' is completed or cancelled. Its dates are protected.');
  if(s.sequence===1&&w.startsAtMs!==saved.startsAtMs)throw Error('Week 1 start is tied to draft recovery. Use the Week 1 recovery control.');
  if(!(w.startsAtMs<=w.baselineAtMs&&w.baselineAtMs<=w.locksAtMs&&w.locksAtMs<w.endsAtMs))throw Error('This would leave Week '+s.sequence+' without room for its start and roster lock.');
  for(const key of weekKeys)if(w[key]!==saved[key]&&(w[key]<=original.serverNowMs||(saved[key]<=original.serverNowMs&&key!=='locksAtMs')))throw Error('Week '+s.sequence+' has an elapsed boundary. It cannot move here.');
 }
 const ordered=[...weeks].sort((a,b)=>original.weekStatus.find(s=>s.id===a.id).sequence-original.weekStatus.find(s=>s.id===b.id).sequence);
 if(ordered.some((w,i)=>i>0&&ordered[i-1].endsAtMs>w.startsAtMs))throw Error('These weeks would overlap. Move both weeks together, or end the earlier week before the next one starts.');
 return {...draft,weeks};
}
export function stageCalendarEdit(draft,original,event,at,cutoffMinutes,boundaryOptions={}){
 if(!Number.isSafeInteger(at))throw Error('Choose a valid local date and time. This time may not exist during a daylight-saving change.');
 if(event.blockedReason)throw Error(event.blockedReason);
 if(boundaryOptions.otherAtMs!==undefined&&!Number.isSafeInteger(boundaryOptions.otherAtMs))throw Error('Choose a valid date and time for the neighbouring week.');
 if(event.type==='week')return moveMatchupBoundary(draft,original,event.recordId,event.edge,at,boundaryOptions);
 if(event.type==='season'){
  let updated={...draft,calendar:{...draft.calendar,[event.field]:at}};
  if(event.field==='fantasyPlayoffsStartAtMs'){
   const last=[...draft.weeks].sort((a,b)=>b.endsAtMs-a.endsAtMs)[0];
   if(last&&(last.endsAtMs===draft.calendar.fantasyPlayoffsStartAtMs||last.endsAtMs>at))updated=moveMatchupBoundary(updated,original,last.id,'end',at);
  }
  return updated;
 }
 if(event.type==='trade')return {...draft,tradeDeadlineAtMs:at};
 if(event.type==='schedule'){
  const local=calendarInputValue(at,original.timeZone),weekday=(new Date(local.slice(0,10)+'T12:00:00Z').getUTCDay()+6)%7;
  return {...draft,schedule:{closeWeekday:weekday,closeMinuteOfDay:Number(local.slice(11,13))*60+Number(local.slice(14,16)),creationCutoffMinutes:Number(cutoffMinutes)}};
 }
 if(event.type==='schedule-cutoff'){
  const minutes=(event.closeAtMs-at)/60000;
  if(!Number.isSafeInteger(minutes)||minutes<0||minutes>=draft.schedule.closeWeekday*1440+draft.schedule.closeMinuteOfDay)throw Error('Keep the cutoff after Monday midnight and no later than the auction close.');
  return {...draft,schedule:{...draft.schedule,creationCutoffMinutes:minutes}};
 }
 if(event.type==='auction')return {...draft,auctions:draft.auctions.map(a=>a.id===event.recordId?{...a,closesAtMs:at}:a)};
 if(event.type==='fad')return {...draft,drafts:draft.drafts.map(d=>d.id!==event.recordId?d:{...d,...(event.index===-1?{deadlineAtMs:at}:{rolloverTimesAtMs:d.rolloverTimesAtMs.map((v,i)=>i===event.index?at:v)})})};
 return draft;
}
export function editableCalendarEvents(original,draft){
 const z=original.timeZone,events=[],point=(id,label,kind,atMs,extra={})=>{
  if(Number.isSafeInteger(atMs))events.push({id,label,kind,atMs,firstDay:calendarDay(atMs,z),lastDay:calendarDay(atMs,z),...extra});
 };
 for(const w of draft.weeks){
  const s=original.weekStatus.find(s=>s.id===w.id),blockedReason=original.blockedReason||(['final','cancelled'].includes(s.status)?'Completed and cancelled weeks cannot move.':null);
  point('week-start:'+w.id,'Week '+s.sequence+' starts','weekOdd',w.startsAtMs,{type:'week',recordId:w.id,edge:'start',blockedReason:blockedReason||(s.sequence===1?'Week 1 start is managed through draft schedule recovery.':null)});
  point('week-end:'+w.id,'Week '+s.sequence+' ends','weekEven',w.endsAtMs,{type:'week',recordId:w.id,edge:'end',firstDay:calendarDay(w.endsAtMs-1,z),lastDay:calendarDay(w.endsAtMs-1,z),blockedReason});
  point('lock:'+w.id,'Week '+s.sequence+' roster lock','season',w.locksAtMs,{type:'week',recordId:w.id,edge:'lock',blockedReason});
 }
 for(const [field,label]of Object.entries(seasonLabels)){
  const end=['regularSeasonEndsAtMs','fantasyPlayoffsEndAtMs'].includes(field),at=draft.calendar[field];
  point(field,label,'season',at,{type:'season',field,edge:end?'end':'start',...(end?{firstDay:calendarDay(at-1,z),lastDay:calendarDay(at-1,z)}:{}),blockedReason:original.blockedReason});
 }
 point('trade-deadline','Trade deadline','trade',draft.tradeDeadlineAtMs,{type:'trade',blockedReason:original.trade.blockedReason});
 for(const [index,a]of draft.auctions.entries()){const saved=original.auctions.find(x=>x.id===a.id);point('auction:'+a.id,(saved.playerName||'Auction '+(index+1))+' · auction closes','auction',a.closesAtMs,{type:'auction',recordId:a.id,blockedReason:saved.blockedReason});}
 const scheduleChanged=!same(draft.schedule,makeCalendarDraft(original).schedule);
 const recurring=original.events.filter(e=>e.recurring&&e.kind==='auction');
 if(!scheduleChanged){
  for(const e of recurring)if(e.atMs>=draft.calendar.regularSeasonStartsAtMs&&e.atMs<draft.calendar.fantasyPlayoffsStartAtMs)point(e.id,e.label,'auction',e.atMs,{type:'schedule',recurring:true});
 }
 else if(recurring.length){
  const start=calendarDay(Math.max(original.serverNowMs,draft.calendar.regularSeasonStartsAtMs),z),end=calendarDay(draft.calendar.fantasyPlayoffsStartAtMs,z);
  for(let day=start,n=0;day<=end&&n<500;day=offsetDay(day,1),n++){
   if((new Date(day+'T12:00:00Z').getUTCDay()+6)%7!==draft.schedule.closeWeekday)continue;
   const min=draft.schedule.closeMinuteOfDay,at=calendarTimestamp(day+'T'+String(Math.floor(min/60)).padStart(2,'0')+':'+String(min%60).padStart(2,'0'),z);
   if(at>=original.serverNowMs&&at<draft.calendar.fantasyPlayoffsStartAtMs)point('weekly-close:'+day,'Weekly auctions close','auction',at,{type:'schedule',recurring:true});
  }
 }
 for(const d of draft.drafts){
  const saved=original.drafts.find(x=>x.id===d.id),blocked=saved.blockedReason;
  point('fad-target:'+d.id,'FAD · Candidate Card deadline','draft',d.deadlineAtMs,{type:'fad',recordId:d.id,index:-1,blockedReason:blocked||(!saved.canEditDeadline?'Candidate Cards have already closed.':null)});
  d.rolloverTimesAtMs.forEach((at,i)=>point('fad-round:'+d.id+':'+i,'FAD · Round '+(i+1)+' closes','auction',at,{type:'fad',recordId:d.id,index:i,blockedReason:blocked||saved.roundDates.find(r=>r.sequence===i+1)?.blockedReason}));
 }
 return events;
}
export function workspaceEvents(original,draft){
 const z=original.timeZone,editable=editableCalendarEvents(original,draft),all=leagueCalendarEvents(draft.calendar,draft.weeks,original.weekStatus,[],z).filter(e=>['matchup','playoffs'].includes(e.kind));
 all.push(...editable);
 const ordered=[...draft.weeks].sort((a,b)=>a.startsAtMs-b.startsAtMs);
 for(let i=1;i<ordered.length;i++){
  const previous=ordered[i-1],next=ordered[i];if(previous.endsAtMs>=next.startsAtMs)continue;
  const format=at=>new Intl.DateTimeFormat('en',{timeZone:z,dateStyle:'medium',timeStyle:'short'}).format(at);
  all.push({id:'matchup-break:'+next.id,kind:'league-break',label:'Matchup break',firstDay:calendarDay(previous.endsAtMs,z),lastDay:calendarDay(next.startsAtMs-1,z),atMs:previous.endsAtMs,blockedReason:'No matchup from '+format(previous.endsAtMs)+' to '+format(next.startsAtMs)+'. Games in this gap will not score.'});
 }
 for(const e of original.events.filter(e=>!e.recurring&&!e.fadId&&e.kind==='draft'))all.push({...e,firstDay:calendarDay(e.atMs,z),lastDay:calendarDay(e.atMs,z),blockedReason:'Entry Draft timing is managed from the Entry Draft tools.'});
 for(const d of original.drafts)if(Number.isSafeInteger(d.openedAtMs))all.push({id:'fad-opened:'+d.id,kind:'draft',label:'FAD · Candidate Cards opened',atMs:d.openedAtMs,firstDay:calendarDay(d.openedAtMs,z),lastDay:calendarDay(d.openedAtMs,z),blockedReason:'This is the recorded opening of the draft. Its history stays unchanged.'});
 const scheduleChanged=!same(draft.schedule,makeCalendarDraft(original).schedule);
 for(const close of editable.filter(e=>e.recurring)){
  const gap=scheduleChanged?draft.schedule.creationCutoffMinutes:(original.schedule.legacyDaily?0:draft.schedule.creationCutoffMinutes);
  const atMs=close.atMs-gap*60000;
  all.push({id:'cutoff:'+close.id,kind:'auction-cutoff',label:'New-auction cutoff',atMs,firstDay:calendarDay(atMs,z),lastDay:calendarDay(atMs,z),type:'schedule-cutoff',closeAtMs:close.atMs,blockedReason:original.schedule.legacyDaily&&!scheduleChanged?'Choose a weekly closing day first to replace the daily test schedule.':null});
 }
 for(const d of draft.drafts)d.rolloverTimesAtMs.forEach((at,i)=>{
  const savedClose=original.events.find(e=>e.fadId===d.id&&e.field==='round'&&e.sequence===i+1);
  const savedCutoff=original.events.find(e=>e.fadId===d.id&&e.kind==='auction-cutoff'&&e.label.includes('round '+(i+1)+' '));
  const gap=savedClose&&savedCutoff?savedClose.atMs-savedCutoff.atMs:0,opens=i?d.rolloverTimesAtMs[i-1]:d.deadlineAtMs;
  for(const [kind,label,time,index]of [['draft','opens',opens,i-1],['auction-cutoff','new-auction cutoff',Math.max(opens,at-gap),i]]){
   const editEvent=editable.find(e=>e.type==='fad'&&e.recordId===d.id&&e.index===index);
   all.push({id:'fad-'+label+':'+d.id+':'+i,kind,label:'FAD · Round '+(i+1)+' '+label,atMs:time,firstDay:calendarDay(time,z),lastDay:calendarDay(time,z),...(label==='opens'?{editEvent,type:'fad'}:{blockedReason:'The cutoff follows this round’s closing time and the FAD cutoff setting.'})});
  }
 });
 return [...all,...(original.breaks||[])];
}
export function calendarChangeRows(original,draft){
 const rows=[],before=makeCalendarDraft(original),date=at=>Number.isSafeInteger(at)?new Intl.DateTimeFormat('en',{timeZone:original.timeZone,dateStyle:'medium',timeStyle:'short'}).format(at):'Not set';
 const add=(label,a,b)=>{if(a!==b)rows.push({label,before:date(a),after:date(b)});};
 for(const [field,label]of Object.entries(seasonLabels))add(label,before.calendar[field],draft.calendar[field]);
 for(const w of draft.weeks){const saved=before.weeks.find(x=>x.id===w.id),s=original.weekStatus.find(x=>x.id===w.id);for(const [field,label]of [['startsAtMs','starts'],['endsAtMs','ends'],['locksAtMs','roster lock']])add('Week '+s.sequence+' '+label,saved[field],w[field]);}
 add('Trade deadline',before.tradeDeadlineAtMs,draft.tradeDeadlineAtMs);
 if(!same(before.schedule,draft.schedule)){const describe=s=>['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][s.closeWeekday]+' '+String(Math.floor(s.closeMinuteOfDay/60)).padStart(2,'0')+':'+String(s.closeMinuteOfDay%60).padStart(2,'0')+' · cutoff '+s.creationCutoffMinutes+' min earlier';rows.push({label:'Weekly auctions',before:original.schedule.legacyDaily?'Daily at 16:00':describe(before.schedule),after:describe(draft.schedule)});}
 for(const [index,a]of draft.auctions.entries())add('Auction '+(index+1)+' closes',before.auctions.find(x=>x.id===a.id).closesAtMs,a.closesAtMs);
 for(const d of draft.drafts){const saved=before.drafts.find(x=>x.id===d.id);add('FAD Candidate Cards',saved.deadlineAtMs,d.deadlineAtMs);d.rolloverTimesAtMs.forEach((at,i)=>add('FAD Round '+(i+1)+' closes',saved.rolloverTimesAtMs[i],at));}
 return rows;
}
