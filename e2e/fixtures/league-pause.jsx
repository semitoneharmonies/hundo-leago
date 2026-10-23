import {createRoot} from 'react-dom/client';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {SessionContext} from '../../src/features/session/sessionContext.js';
import {LeaguePauseControls} from '../../src/features/commissioner/LeaguePauseControls.jsx';
import '../../src/styles/theme-a.css';
const leagueId='11111111-1111-4111-8111-111111111111';let paused=true;window.pauseRequests=[];
const httpClient={async request(url,options){
  window.pauseRequests.push({url,method:options.method||'GET',body:options.body});
  let data={leagueId,paused,canResume:true,busyJobs:0,scope:'League competition',jobs:[],reason:paused?'Review league schedule':null};
  if(url.endsWith('/preview'))data={leagueId,proposed:options.body,restoredStatus:'active',overdue:true,impacts:{pendingJobs:4,dueJobs:2,openAuctions:3,dueAuctions:1,pendingProposals:2,expiredProposals:1},previewHash:'a'.repeat(64)};
  if(url.endsWith('/apply')){paused=options.body.action==='pause';data={leagueId,id:'receipt',accepted:true,replayed:false};}
  options.validateData(data);return {data};
}};
createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient()}><SessionContext.Provider value={{status:'authenticated',httpClient}}>
  <main style={{maxWidth:1000,margin:'24px auto',padding:16}}><h1>Synthetic league pause</h1><LeaguePauseControls leagueId={leagueId}/></main>
</SessionContext.Provider></QueryClientProvider>);
