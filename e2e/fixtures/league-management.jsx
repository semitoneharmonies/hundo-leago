import {createRoot} from 'react-dom/client';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import {SessionContext} from '../../src/features/session/sessionContext.js';
import {LeagueManagementPanel} from '../../src/features/commissioner/LeagueManagementPanel.jsx';
import '../../src/styles/theme-a.css';
const leagueId='11111111-1111-4111-8111-111111111111',teamId='22222222-2222-4222-8222-222222222222';
const readiness={leagueId,checkedAtMs:Date.parse('2026-09-29T19:00:00Z'),season:null,drafts:[],teams:[{id:teamId,name:'North Stars',status:'setup',managerName:null,cardStatus:'empty',
 roster:{legal:false,requiredNow:false,reasonCodes:['ACTIVE_FORWARD_SLOTS_INCOMPLETE'],counts:{},cap:{}}}],calendarIssues:['SEASON_DATES_UNSET'],missingPicks:[{draftId:'draft',teamId,teamName:'North Stars',round:4}],operations:[],
 summary:{teams:1,missingManagers:1,unfinishedCards:1,illegalRosters:0,missingPicks:1,calendarIssues:1,operations:0}};
window.managementRequests=[];
const httpClient={async request(url,options){
 window.managementRequests.push({url,method:options.method||'GET'});if(options.method&&options.method!=='GET')throw Error('Reports must remain readonly');
 const data=url.includes('/readiness')?readiness:url.includes('/history')?{leagueId,changes:[{id:'private_review:record',recordId:'record',kind:'private_review',at:readiness.checkedAtMs,
  summary:'Selected auction bid explicitly reviewed',reason:'Review requested by manager',actorName:'Commissioner Taylor',targetId:'auction',before:null,after:null}],page:{hasMore:false,nextCursor:null}}:
 {leagueId,format:'hundo-league-export-v1',generatedAtMs:readiness.checkedAtMs,scope:'current-season',league:{id:leagueId},season:null,teams:[],rosters:[],picks:[],results:[],excluded:['Private bids'],notice:'Synthetic reference export'};
 options.validateData(data);return{data};
}};
createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><SessionContext.Provider value={{status:'authenticated',httpClient}}>
 <main style={{maxWidth:1000,margin:'24px auto',padding:16}}><h1>Synthetic league management</h1><LeagueManagementPanel leagueId={leagueId}/></main>
 </SessionContext.Provider></MemoryRouter></QueryClientProvider>);
