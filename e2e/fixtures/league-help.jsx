import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {SessionContext} from '../../src/features/session/sessionContext.js';
import {LeagueHelpPanel} from '../../src/features/leagues/LeagueHelpPanel.jsx';
import '../../src/styles/theme-a.css';
const leagueId='11111111-1111-4111-8111-111111111111',teamId='22222222-2222-4222-8222-222222222222',id='33333333-3333-4333-8333-333333333333';
let record={id,teamId,teamName:'Ice Owls',requesterName:'Morgan',kind:'auction',targetId:'44444444-4444-4444-8444-444444444444',targetLabel:'Casey Skater auction',subject:'Please cancel accidental auction',message:'I selected the wrong player. Please cancel this auction if possible.',status:'open',version:1};const events=[];window.helpRequests=[];
const httpClient={async request(url,options){window.helpRequests.push({url,method:options.method||'GET',body:options.body});let data={leagueId,canManage:true,teams:[],requests:[record],cardHelp:[],nextCursor:null};
 if(url.endsWith('/'+id))data={leagueId,canManage:true,isRequester:false,request:record,events};
 if(options.method==='POST'){events.push({id:'55555555-5555-4555-8555-555555555555',action:options.body.action,message:options.body.message,actorName:'Commissioner'});record={...record,status:'resolved',version:2};data={leagueId,id,accepted:true,replayed:false};}
 options.validateData(data);return {data};}};
createRoot(document.getElementById('root')).render(<MemoryRouter><QueryClientProvider client={new QueryClient()}><SessionContext.Provider value={{status:'authenticated',httpClient}}><main style={{maxWidth:1000,margin:'24px auto',padding:16}}><h1>Synthetic private league help</h1><LeagueHelpPanel leagueId={leagueId}/></main></SessionContext.Provider></QueryClientProvider></MemoryRouter>);
