import {createRoot} from 'react-dom/client';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {SessionContext} from '../../src/features/session/sessionContext.js';
import {GuidedLeagueResetControls} from '../../src/features/commissioner/GuidedLeagueResetControls.jsx';
import '../../src/styles/theme-a.css';
const leagueId='11111111-1111-4111-8111-111111111111';window.resetRequests=[];
const manifest={leagueName:'Test League',clear:[{label:'Candidate Cards',count:4},{label:'Saved Candidate Card entries',count:48},{label:'Auctions',count:12},{label:'Saved bids',count:23},{label:'Roster ownerships',count:8},{label:'Contracts',count:8}],preserved:['League identity and name','Manager accounts and team access','Team names, colours and logos','Other leagues and global players'],preparation:'Choose new dates through setup before starting the league again.',recovery:'An encrypted archive retains cleared records. Later manager work prevents restoration.'};
const httpClient={async request(url,o){window.resetRequests.push({url,method:o.method||'GET'});const data=url.endsWith('/apply')?{leagueId,action:o.body.action,recoveryVerified:true}:url.endsWith('/preview')?{leagueId,action:o.body.action,manifest,recoveryVerified:true,confirmation:'RESET Test League',previewHash:'a'.repeat(64)}:{leagueId,league:{name:'Test League'},blockedReason:null,archives:[]};o.validateData(data);return {data};}};
createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient()}><SessionContext.Provider value={{httpClient}}><main style={{maxWidth:850,margin:'24px auto',padding:16}}><h1>Synthetic preseason reset</h1><GuidedLeagueResetControls leagueId={leagueId}/></main></SessionContext.Provider></QueryClientProvider>);
