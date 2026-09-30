import {createRoot} from 'react-dom/client';
import {SessionContext} from '../../src/features/session/sessionContext.js';
import {CorrectionReversalControls} from '../../src/features/commissioner/CorrectionReversalControls.jsx';
import '../../src/styles/theme-a.css';
const leagueId='11111111-1111-4111-8111-111111111111',correctionId='22222222-2222-4222-8222-222222222222';window.reversalRequests=[];
const preview={leagueId,correctionId,feature:'roster',playerName:'Casey Skater',current:{teamId:'team',rosterCategory:'Bench',positionGroup:'F',slotNumber:1},restore:{teamId:'team',rosterCategory:'Active',positionGroup:'F',slotNumber:2},warnings:[{code:'TEAM_ROSTER_INCOMPLETE',teamId:'team'}],teamNames:[{id:'team',name:'Ice Owls'}],previewHash:'a'.repeat(64)};
const httpClient={async request(url,o){window.reversalRequests.push({url,method:o.method||'GET'});const data=url.endsWith('/apply')?{leagueId,correctionId}:url.endsWith('/preview')?preview:{leagueId,corrections:[{id:correctionId,feature:'roster',playerName:'Casey Skater',at:1790000000000,reason:'Moved to bench',reversed:0}]};o.validateData(data);return {data};}};
createRoot(document.getElementById('root')).render(<SessionContext.Provider value={{httpClient}}><main style={{maxWidth:850,margin:'24px auto',padding:16}}><h1>Synthetic correction reversal</h1><CorrectionReversalControls leagueId={leagueId}/></main></SessionContext.Provider>);
