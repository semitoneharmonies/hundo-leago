const at=Date.parse,id=n=>'11111111-1111-4111-8111-'+String(n).padStart(12,'0');
export function calendarWorkspaceFixture(){
 const weeks=[5,12,19].map((day,i)=>({id:id(i+10),startsAtMs:at('2026-10-'+day.toString().padStart(2,'0')+'T07:00Z'),baselineAtMs:at('2026-10-'+day.toString().padStart(2,'0')+'T07:00Z'),locksAtMs:at('2026-10-'+day.toString().padStart(2,'0')+'T19:00Z'),endsAtMs:at('2026-10-'+(day+7).toString().padStart(2,'0')+'T07:00Z'),rollsOverAtMs:at('2026-10-'+(day+7).toString().padStart(2,'0')+'T07:00Z')}));
 return {leagueId:id(1),seasonId:id(2),expectedVersion:'a'.repeat(64),timeZone:'America/Vancouver',serverNowMs:at('2026-09-29T19:00Z'),blockedReason:null,
  calendar:{regularSeasonStartsAtMs:at('2026-09-29T07:00Z'),regularSeasonEndsAtMs:at('2027-04-12T07:00Z'),fantasyPlayoffsStartAtMs:at('2027-03-15T07:00Z'),fantasyPlayoffsEndAtMs:at('2027-04-12T07:00Z')},
  weeks,weekStatus:weeks.map((w,i)=>({id:w.id,sequence:i+1,status:'scheduled'})),history:[],
  events:[4,11,18].flatMap(day=>[{id:'weekly-close:'+day,kind:'auction',label:'Weekly auctions close',atMs:at('2026-10-'+String(day).padStart(2,'0')+'T23:00Z'),recurring:true}]),
  breaks:[{id:'christmas',kind:'break',label:'Christmas break',firstDay:'2026-12-23',lastDay:'2026-12-25',source:'https://www.nhl.com/news/nhl-stats-pack-2026-27-regular-season-schedule'},{id:'allstar',kind:'break',label:'All-Star break',firstDay:'2027-02-04',lastDay:'2027-02-07',source:'https://www.nhl.com/news/nhl-stats-pack-2026-27-regular-season-schedule'}],
  schedule:{schedule:{closeWeekday:6,closeMinuteOfDay:960,creationCutoffMinutes:60},legacyDaily:false},
  trade:{tradeDeadlineAtMs:at('2027-02-15T00:00Z'),canEdit:true,blockedReason:null},
  drafts:[{id:id(30),status:'cards_open',deadlineAtMs:at('2026-09-30T23:00Z'),rolloverTimesAtMs:[at('2026-10-02T23:00Z'),at('2026-10-03T23:00Z')],canEditDeadline:true,blockedReason:null,roundDates:[{sequence:1,canEdit:true,blockedReason:null},{sequence:2,canEdit:true,blockedReason:null}]}],
  auctions:[]};
}
