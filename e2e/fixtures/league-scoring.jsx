import {createRoot} from 'react-dom/client';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {SessionContext} from '../../src/features/session/sessionContext.js';
import {LeagueScoringControls} from '../../src/features/commissioner/LeagueScoringControls.jsx';
import {SCORING_CATEGORIES,scoringWeight} from '../../src/shared/scoringCategories.js';
import '../../src/styles/theme-a.css';
const leagueId='11111111-1111-4111-8111-111111111111',seasonId='22222222-2222-4222-8222-222222222222',weekId='33333333-3333-4333-8333-333333333333';
const defaults=Object.fromEntries(['F','D'].map(p=>[p,Object.fromEntries(SCORING_CATEGORIES.map(c=>[c.key,scoringWeight(c,p)]))]));
const state={leagueId,seasonId,current:{version:'expanded-2026-v1',weights:defaults},defaults,currentWeekSequence:1,serverNowMs:100,
 weeks:[{id:weekId,sequence:2,status:'scheduled',startsAtMs:200,endsAtMs:300,editable:true}],rules:[]};
window.scoringRequests=[];
const httpClient={async request(url,options){
 window.scoringRequests.push({url,method:options.method||'GET',body:options.body});let data=state;
 if(url.endsWith('/preview'))data={...state,proposed:options.body,changes:[{key:'hits',label:'Hits',position:'F',before:20,after:5},{key:'hits',label:'Hits',position:'D',before:35,after:10}],
  endsBeforeWeek:null,comparisonWeekSequence:2,previewHash:'a'.repeat(64),impacts:[{matchupId:'44444444-4444-4444-8444-444444444444',homeName:'North Stars',awayName:'Coastal Wolves',status:'live',
   available:true,beforeHome:22000,beforeAway:20500,afterHome:18500,afterAway:19500,officialHomeScore:null,officialAwayScore:null,pendingGameCount:1}]};
 else if(options.method==='POST')throw Error('Browser fixture does not accept writes');
 options.validateData(data);return{data};
}};
createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient()}><SessionContext.Provider value={{status:'authenticated',httpClient}}>
 <main style={{maxWidth:1000,margin:'24px auto',padding:16}}><h1>Synthetic commissioner scoring</h1><LeagueScoringControls leagueId={leagueId}/></main>
 </SessionContext.Provider></QueryClientProvider>);
