import {createRoot} from 'react-dom/client';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {SessionContext} from '../../src/features/session/sessionContext.js';
import {LeaguePickRepairControls} from '../../src/features/commissioner/LeaguePickRepairControls.jsx';
import '../../src/styles/theme-a.css';
const leagueId='11111111-1111-4111-8111-111111111111';
const missing={teamId:'north',teamName:'North Stars',round:4,position:2,ownerTeamId:'north'};
window.pickRepairRequests=[];let applied=false;
const httpClient={async request(url,options){
  window.pickRepairRequests.push({url,method:options.method||'GET',body:options.body,key:options.idempotencyKey});
  let data={leagueId,drafts:[{id:'draft',seasonLabel:'2026–27',teams:[{id:'north',name:'North Stars'},{id:'south',name:'South Stars'}],missing:applied?[]:[missing],blockedReason:null}]};
  if(url.endsWith('/preview'))data={leagueId,proposed:options.body,additions:[{...missing,ownerTeamId:options.body.owners[0].ownerTeamId,ownerName:options.body.owners[0].ownerTeamId==='south'?'South Stars':'North Stars'}],preservedCount:15,previewHash:'a'.repeat(64)};
  if(url.endsWith('/apply')){applied=true;data={leagueId,id:'receipt',accepted:true,replayed:false};}
  options.validateData(data);return {data};
}};
createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient()}><SessionContext.Provider value={{status:'authenticated',httpClient}}>
  <main style={{maxWidth:1000,margin:'24px auto',padding:16}}><h1>Synthetic draft-pick repair</h1><LeaguePickRepairControls leagueId={leagueId}/></main>
</SessionContext.Provider></QueryClientProvider>);
