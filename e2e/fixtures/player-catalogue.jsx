import {createRoot} from 'react-dom/client';
import {PlayerCatalogueControls} from '../../src/features/leagues/PlayerCatalogueControls.jsx';
import '../../src/styles/theme-a.css';
window.catalogueRequests=[];
const preview={nhlId:'8479999',action:'refresh',previewHash:'a'.repeat(64),before:{name:'Casey Skater',status:'active',sources:[{provider:'nhl',position:'F',team:'VAN'}]},after:{name:'Casey Skater',status:'active',position:'F',team:'SEA',birthDate:'1998-02-03'},ownedInLeagues:2,openDrafts:1,preserved:['Player identity','League ownerships and contracts','Saved bids, cards and history'],notice:'Existing eligibility checks may be queued.'};
const httpClient={async request(url,o){window.catalogueRequests.push({url,method:o.method||'GET',body:o.body});const data=url.endsWith('/apply')?{operationId:o.body.operationId,playerId:'player',revalidationOccurrenceCount:1}:url.endsWith('/preview')?preview:{players:[{id:'player',name:'Casey Skater',status:'active',nhlId:'8479999'}],history:[]};o.validateData(data);return {data};}};
createRoot(document.getElementById('root')).render(<main style={{maxWidth:850,margin:'24px auto',padding:16}}><h1>Synthetic player catalogue</h1><PlayerCatalogueControls httpClient={httpClient}/></main>);
