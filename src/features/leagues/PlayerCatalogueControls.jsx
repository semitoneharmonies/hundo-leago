import {useRef,useState} from 'react';
import {Surface} from '../../components/HundoUi.jsx';
import {createOperationId} from '../../shared/api/idempotency.js';
import styles from './PlayerCatalogueControls.module.css';
const base='/api/v1/operations/catalogue';
function validPreview(data){if(!data||!['refresh','import'].includes(data.action)||typeof data.after?.name!=='string'||!/^[a-f0-9]{64}$/.test(data.previewHash)||!Array.isArray(data.preserved))throw Error('Incomplete player preview.');return true;}
export function PlayerCatalogueControls({httpClient}){
 const [open,setOpen]=useState(false),[search,setSearch]=useState(''),[list,setList]=useState(null),[nhlId,setId]=useState(''),[preview,setPreview]=useState(null),[reason,setReason]=useState(''),[pending,setPending]=useState(false),[error,setError]=useState(''),[result,setResult]=useState(null);
 const busy=useRef(false),attempt=useRef(null);
 async function run(fn){if(busy.current)return;busy.current=true;setPending(true);setError('');try{await fn();}catch(e){setError(e?.code==='CATALOGUE_PREVIEW_CHANGED'?'The player or affected state changed. Cancel and review a fresh preview.':e?.code==='CATALOGUE_IDENTITY_CONFLICT'?'A possible duplicate needs identity review. Existing players were preserved.':'The request could not be completed. Check your access and NHL player ID, then try again.');}finally{busy.current=false;setPending(false);}}
 async function load(){await run(async()=>{const r=await httpClient.request(base+'?search='+encodeURIComponent(search.trim()),{authenticated:true,dataKind:'object',validateData:d=>{if(!Array.isArray(d?.players)||!Array.isArray(d.history))throw Error('Invalid catalogue.');return true;}});setList(r.data);});}
 async function review(id=nhlId){await run(async()=>{attempt.current=null;setPreview(null);setResult(null);setId(id);const r=await httpClient.request(base+'/preview',{method:'POST',authenticated:true,dataKind:'object',body:{nhlId:id.trim()},validateData:d=>validPreview(d)&&d.nhlId===id.trim()});validPreview(r.data);if(r.data.nhlId!==id.trim())throw Error('Wrong player');setPreview(r.data);});}
 async function apply(){await run(async()=>{if(!attempt.current)attempt.current={nhlId:preview.nhlId,previewHash:preview.previewHash,reason:reason.trim(),operationId:createOperationId()};const r=await httpClient.request(base+'/apply',{method:'POST',authenticated:true,dataKind:'object',body:attempt.current,validateData:d=>{if(d?.operationId!==attempt.current.operationId||typeof d.playerId!=='string'||!Number.isSafeInteger(d.revalidationOccurrenceCount))throw Error('Invalid result');return true;}});setResult(r.data);setPreview(null);setReason('');attempt.current=null;});}
 return <Surface as="section" className={`hl-admin-league-panel ${styles.panel}`}><details open={open} onToggle={e=>setOpen(e.currentTarget.open)}><summary><strong>Player catalogue</strong></summary>
  {open&&<><p>Look up a saved player or review one NHL player for import or refresh. This changes the shared catalogue for every league.</p>
   <form onSubmit={e=>{e.preventDefault();load();}}><label>Saved player name or NHL ID<input value={search} maxLength={100} onChange={e=>setSearch(e.target.value)} disabled={pending}/></label><button className="hl-button hl-button--secondary" disabled={pending}>Search catalogue</button></form>
   {list&&<><ul>{list.players.map(p=><li key={p.id}>{p.name} · {p.status} {p.nhlId?<button className="hl-button hl-button--secondary" disabled={pending||!!preview} onClick={()=>review(p.nhlId)}>Review {p.name}</button>:<span>No verified NHL ID</span>}</li>)}</ul>
    <details><summary>Recent catalogue changes ({list.history.length})</summary><ul>{list.history.map(h=><li key={h.id}>{h.after.name} · {h.actorName} · {new Date(h.at).toLocaleString()} · {h.reason}</li>)}</ul></details></>}
   <form onSubmit={e=>{e.preventDefault();review();}}><label>NHL player ID<input inputMode="numeric" value={nhlId} maxLength={13} onChange={e=>setId(e.target.value)} disabled={pending||!!preview} required pattern="[1-9][0-9]*"/></label><button className="hl-button hl-button--secondary" disabled={pending||!!preview}>Preview player</button></form>
   {preview&&<div><h3>{preview.action==='import'?'Import':'Refresh'} {preview.after.name}</h3><p>{preview.after.position} · {preview.after.team||'No NHL team'} · {preview.after.status} · Born {preview.after.birthDate}</p>
    {preview.before&&<p>Saved: {preview.before.name} · {preview.before.status} · {preview.before.sources.map(s=>`${s.position||'Unclassified'} / ${s.team||'No team'} (${s.provider})`).join(', ')}</p>}
    <p>Currently owned in {preview.ownedInLeagues} leagues. {preview.openDrafts} unfinished drafts may need eligibility checks if a player’s position or active status changes.</p><p>{preview.notice}</p>
    <p>Preserved: {preview.preserved.join('; ')}.</p><label>Reason<input value={reason} maxLength={500} disabled={pending||!!attempt.current} onChange={e=>setReason(e.target.value)}/></label>
    <button className="hl-button" disabled={pending||reason.trim().length<3} onClick={apply}>Confirm catalogue change</button>{' '}<button className="hl-button hl-button--secondary" disabled={pending} onClick={()=>{setPreview(null);attempt.current=null;setError('');}}>Cancel preview</button></div>}
   {result&&<p role="status">Player catalogue saved. {result.revalidationOccurrenceCount} eligibility checks queued. League ownerships and contracts were preserved.</p>}
   {pending&&<p role="status">Checking player catalogue…</p>}{error&&<p role="alert">{error}</p>}
  </>}
 </details></Surface>;
}
