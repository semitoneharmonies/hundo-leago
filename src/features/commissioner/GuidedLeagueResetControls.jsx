import {useRef,useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {useSession} from '../session/sessionContext.js';
import {Surface,TableScroll} from '../../components/HundoUi.jsx';
import {createOperationId} from '../../shared/api/idempotency.js';
import styles from '../leagues/PlayerCatalogueControls.module.css';
export function GuidedLeagueResetControls({leagueId}){
 const {httpClient}=useSession(),client=useQueryClient(),base='/api/v1/leagues/'+encodeURIComponent(leagueId)+'/management/reset';
 const [open,setOpen]=useState(false),[state,setState]=useState(null),[archiveId,setArchiveId]=useState(''),[reason,setReason]=useState(''),[preview,setPreview]=useState(null),[confirmation,setConfirmation]=useState(''),[pending,setPending]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState('');
 const busy=useRef(false),attempt=useRef(null);
 async function run(fn){if(busy.current)return;busy.current=true;setPending(true);setError('');try{await fn();}catch(e){setError(e.code?.startsWith('LEAGUE_RESET_')?e.message:'The operation could not be verified. Refresh and review the current league state.');}finally{busy.current=false;setPending(false);}}
 function valid(d){if(d?.leagueId!==leagueId)throw Error('Wrong league');return true;}
 async function load(){await run(async()=>{const r=await httpClient.request(base,{authenticated:true,dataKind:'object',validateData:d=>{valid(d);if(!Array.isArray(d.archives)||!d.league)throw Error('Invalid state');return true;}});setState(r.data);setPreview(null);attempt.current=null;});}
 async function review(action){await run(async()=>{setSaved('');setPreview(null);setConfirmation('');attempt.current=null;const proposed={action,archiveId:action==='restore'?archiveId:null,reason:reason.trim()};const r=await httpClient.request(base+'/preview',{method:'POST',authenticated:true,dataKind:'object',body:proposed,validateData:d=>{valid(d);if(d.action!==action||!d.recoveryVerified||!Array.isArray(d.manifest?.clear)||!Array.isArray(d.manifest?.preserved)||typeof d.confirmation!=='string'||!/^[a-f0-9]{64}$/.test(d.previewHash))throw Error('Invalid review');return true;}});setPreview({...r.data,proposed});});}
 async function apply(){await run(async()=>{if(!attempt.current)attempt.current={key:createOperationId(),body:{...preview.proposed,confirmation,previewHash:preview.previewHash}};await httpClient.request(base+'/apply',{method:'POST',authenticated:true,dataKind:'object',idempotencyKey:attempt.current.key,body:attempt.current.body,validateData:d=>valid(d)&&d.recoveryVerified===true&&d.action===preview.action});setSaved(preview.action==='reset'?'League returned to setup. Choose new dates before starting again.':'League restored. Competition remains paused for review.');setPreview(null);setState(null);setConfirmation('');setReason('');attempt.current=null;await client.invalidateQueries({queryKey:['league',leagueId]});});}
 return <Surface as="section" className={styles.panel}><button className="hl-button hl-button--secondary" aria-expanded={open} onClick={()=>{setOpen(!open);if(!open&&!state)load();}}>Restart preseason setup</button>
  {open&&<><p>Restart an eligible preseason league while keeping its identity, managers, team appearance and rules. Pause competition first. Played seasons and locked matchups cannot be reset here.</p>
   {state&&<><p>League: <strong>{state.league.name}</strong></p>{state.blockedReason&&<p>{state.blockedReason}</p>}
    <label>Reason for reset or restore<input value={reason} maxLength={500} disabled={pending||!!preview} onChange={e=>setReason(e.target.value)}/></label>
    <button className="hl-button hl-button--secondary" disabled={pending||!!preview||!!state.blockedReason||reason.trim().length<3} onClick={()=>review('reset')}>Preview preseason reset</button>
    {!!state.archives.length&&<><label>Recovery archive<select value={archiveId} disabled={pending||!!preview} onChange={e=>setArchiveId(e.target.value)}><option value="">Choose an archive</option>{state.archives.map(a=><option key={a.id} value={a.id} disabled={a.restored}>{new Date(a.at).toLocaleString()} · {a.actorName}{a.restored?' · Already restored':''}</option>)}</select></label><p>Restoration is available only before later league changes. Private cards and bids remain encrypted and are never displayed here.</p><button className="hl-button hl-button--secondary" disabled={pending||!!preview||!archiveId||reason.trim().length<3} onClick={()=>review('restore')}>Preview archive restore</button></>}
   </>}
   {preview&&<section aria-label="Preseason reset review"><h3>{preview.action==='reset'?'Reset':'Restore'} {preview.manifest.leagueName}</h3>
    <p>{preview.action==='reset'?'The following records will be cleared from current preseason play and retained in an encrypted recovery archive.':'The following archived records will be restored. Competition will remain paused.'}</p>
    <TableScroll><table><thead><tr><th>Records</th><th>Count</th></tr></thead><tbody>{preview.manifest.clear.map(g=><tr key={g.label}><th>{g.label}</th><td>{g.count}</td></tr>)}</tbody></table></TableScroll>
    <p>Preserved:</p><ul>{preview.manifest.preserved.map(p=><li key={p}>{p}</li>)}</ul><p>{preview.manifest.preparation}</p><p>{preview.manifest.recovery}</p><p>Recovery rehearsal passed. Current members receive an in-app notice.</p>
    <label>Type {preview.confirmation} to confirm<input autoComplete="off" value={confirmation} disabled={pending||!!attempt.current} onChange={e=>setConfirmation(e.target.value)}/></label>
    <button className="hl-button" disabled={pending||confirmation!==preview.confirmation} onClick={apply}>{preview.action==='reset'?'Confirm preseason reset':'Confirm archive restore'}</button>{' '}
    <button className="hl-button hl-button--secondary" disabled={pending} onClick={()=>{setPreview(null);attempt.current=null;setError('');}}>Cancel reset review</button>
   </section>}
   <button className="hl-button hl-button--secondary" disabled={pending||!!preview} onClick={load}>Refresh reset status</button>{pending&&<p role="status">Checking reset and recovery…</p>}{saved&&<p role="status">{saved}</p>}{error&&<p role="alert">{error}</p>}
  </>}
 </Surface>;
}
