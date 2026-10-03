import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {SessionContext} from '../../src/features/session/sessionContext.js';
import {SeasonRolloverPreview} from '../../src/features/commissioner/SeasonRolloverPreview.jsx';
import '../../src/styles/theme-a.css';
const leagueId='11111111-1111-4111-8111-111111111111';window.seasonRequests=[];
const data={leagueId,readOnly:true,projectionAvailable:true,source:{label:'2026'},target:{label:'2027'},archived:{weeks:24,results:48},issues:['NEXT_CALENDAR_UNSET','NEXT_DRAFT_NOT_SCHEDULED'],drafts:[],bindings:[],picks:[{id:'pick',round:2,position:1,originalTeamName:'Ice Owls',ownerTeamName:'Harbour Seals',status:'unused'}],
 contracts:[{id:'contract',playerName:'Casey Skater',teamName:'Ice Owls',currentYears:1,nextYears:0,aavCents:250,outcome:'expire'},{id:'contract2',playerName:'Taylor Forward',teamName:'Harbour Seals',currentYears:3,nextYears:2,aavCents:500,outcome:'continue'}],obligations:[{id:'obligation',kind:'buyout',playerName:'Riley Skater',teamName:'Ice Owls',currentAmountCents:100,nextAmountCents:0,outcome:'complete'}],
 summary:{contractsContinuing:1,contractsExpiring:1,playersCarried:1,playersReleased:1,obligationsContinuing:0,obligationsCompleting:1,tradesCancelled:0}};
const httpClient={async request(url,options){window.seasonRequests.push({url,method:options.method||'GET'});options.validateData(data);return {data};}};
createRoot(document.getElementById('root')).render(<MemoryRouter><QueryClientProvider client={new QueryClient()}><SessionContext.Provider value={{status:'authenticated',httpClient}}><main style={{maxWidth:1000,margin:'24px auto',padding:16}}><h1>Synthetic season preview</h1><SeasonRolloverPreview leagueId={leagueId}/></main></SessionContext.Provider></QueryClientProvider></MemoryRouter>);
