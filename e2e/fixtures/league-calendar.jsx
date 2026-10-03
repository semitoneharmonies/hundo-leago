import {createRoot} from 'react-dom/client';
import {calendarWorkspaceFixture} from './calendar-workspace-data.js';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {SessionContext} from '../../src/features/session/sessionContext.js';
import {LeagueCalendarControls} from '../../src/features/commissioner/LeagueCalendarControls.jsx';
import {LeagueAuctionScheduleControls} from '../../src/features/commissioner/LeagueAuctionScheduleControls.jsx';
import {WeekOneShiftControls} from '../../src/features/commissioner/WeekOneShiftControls.jsx';
import '../../src/styles/theme-a.css';
const leagueId='11111111-1111-4111-8111-111111111111',at=Date.parse;
const state={leagueId,seasonId:'synthetic-season',timeZone:'America/Vancouver',serverNowMs:at('2026-09-29T19:00:00Z'),
 calendar:{regularSeasonStartsAtMs:at('2026-10-06T07:00:00Z'),regularSeasonEndsAtMs:at('2027-04-12T07:00:00Z'),
 fantasyPlayoffsStartAtMs:at('2027-03-15T07:00:00Z'),fantasyPlayoffsEndAtMs:at('2027-04-12T07:00:00Z')},
 weeks:[{id:'11111111-1111-4111-8111-111111111112',startsAtMs:at('2026-10-19T07:00:00Z'),baselineAtMs:at('2026-10-19T07:00:00Z'),
 locksAtMs:at('2026-10-19T19:00:00Z'),endsAtMs:at('2026-10-26T07:00:00Z'),rollsOverAtMs:at('2026-10-26T07:00:00Z')}],
 events:[{id:'weekly-close',kind:'auction',label:'Weekly auctions close',atMs:at('2026-10-04T23:00:00Z'),recurring:true},{id:'weekly-cutoff',kind:'auction-cutoff',label:'New-auction cutoff',atMs:at('2026-10-02T07:00:00Z'),recurring:true},{id:'trade-deadline',kind:'trade',label:'Trade deadline',atMs:at('2027-02-15T00:00:00Z')}],
 weekStatus:[{id:'11111111-1111-4111-8111-111111111112',sequence:2,status:'scheduled'}],history:[]};
window.calendarRequests=[];
const auctionMode=new URLSearchParams(location.search).has('auctions');
const shiftMode=new URLSearchParams(location.search).has('shift');
if(shiftMode){state.weekStatus[0].sequence=1;state.weekOneShift={weekId:state.weeks[0].id,version:1,startsAtMs:state.weeks[0].startsAtMs};}
const auctionState={leagueId,timeZone:state.timeZone,serverNowMs:state.serverNowMs,revision:0,openAuctionCount:2,schedule:null,legacyDaily:false,history:[],
 window:{opensAtMs:at('2026-09-28T07:00:00Z'),newAuctionCutoffAtMs:at('2026-10-02T07:00:00Z'),bidClosesAtMs:at('2026-10-04T23:00:00Z'),
 scheduledResolutionAtMs:at('2026-10-04T23:00:00Z'),nextOpensAtMs:at('2026-10-05T07:00:00Z'),canStart:true}};
const httpClient={async request(url,options){
 window.calendarRequests.push({url,method:options.method||'GET',body:options.body});
 if(url.includes('/calendar/workspace')){
  const workspace=calendarWorkspaceFixture();
  workspace.leagueId=leagueId;
  let data=workspace;
  if(url.endsWith('/preview'))data={leagueId:workspace.leagueId,proposed:options.body,previewHash:'a'.repeat(64),warnings:[{code:'short-week',message:'One matchup week is shorter than seven days.'}]};
  else if(options.method==='POST')throw Error('Fixture does not accept saves');
  options.validateData(data);return {data};
 }
 const isAuction=auctionMode||url.includes('/calendar/auction-schedule');
 let data=isAuction?auctionState:state;
 if(options.body?.action==='preview_shift_week_one'){
  data={code:'MATCHUP_WEEK_ONE_SHIFT_PREVIEWED',leagueId,seasonId:state.seasonId,weekId:state.weeks[0].id,expectedWeekVersion:1,
   previousFirstWeekStartsAtMs:state.weeks[0].startsAtMs,firstWeekStartsAtMs:options.body.firstWeekStartsAtMs,
   shiftedWeekCount:1,lastWeekEndsAtMs:state.weeks[0].startsAtMs,previewHash:'a'.repeat(64),
   weeks:[{sequence:1,startsAtMs:options.body.firstWeekStartsAtMs,endsAtMs:state.weeks[0].startsAtMs}]};
  options.validateData(data);return {data};
 }
 if(options.method==='PATCH')throw Error('Browser fixture does not accept confirmations');
 if(isAuction){
  if(url.endsWith('/preview'))data={...auctionState,proposed:options.body,previewHash:'a'.repeat(64),newWindow:{
   ...auctionState.window,newAuctionCutoffAtMs:at('2026-10-04T00:15:00Z'),bidClosesAtMs:at('2026-10-04T01:45:00Z'),
   scheduledResolutionAtMs:at('2026-10-04T01:45:00Z')},opensNow:false,closesNow:false};
  else if(options.method==='POST')throw Error('Browser fixture does not accept writes');
  options.validateData(data);return {data};
 }
 if(url.endsWith('/preview'))data={...state,proposed:options.body,previewHash:'a'.repeat(64),
  changes:[{id:state.weeks[0].id,sequence:2,fields:['locksAtMs'],before:state.weeks[0],after:options.body.weeks[0]}],
  seasonFields:['fantasyPlayoffsEndAtMs'],pendingJobs:1,reopensAuctions:false,closesAuctions:false};
 else if(options.method==='POST')throw Error('Browser fixture does not accept writes');
 options.validateData(data);return {data};
}};
createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient()}>
 <SessionContext.Provider value={{status:'authenticated',httpClient}}>
  <main style={{maxWidth:1450,margin:'24px auto',padding:16}}><h1>Synthetic commissioner calendar</h1>
   {auctionMode?<LeagueAuctionScheduleControls leagueId={leagueId}/>:shiftMode?<WeekOneShiftControls leagueId={leagueId} seasonId={state.seasonId} week={state.weekOneShift} timeZone={state.timeZone}/>:<LeagueCalendarControls leagueId={leagueId}/>}</main>
 </SessionContext.Provider>
</QueryClientProvider>);
