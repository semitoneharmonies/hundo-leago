import {useRef,useState} from 'react';
import {useSession} from '../session/sessionContext.js';
import {Surface,TableScroll} from '../../components/HundoUi.jsx';
import {createOperationId} from '../../shared/api/idempotency.js';
import styles from '../leagues/PlayerCatalogueControls.module.css';
function rows(value,feature,teamName){return feature==='roster'?[['Team',teamName(value.teamId)],['Roster category',value.rosterCategory],['Position',value.positionGroup],['Slot',value.slotNumber??'Unassigned']]:[['Team',teamName(value.teamId)],['Contract total','$'+(value.originalTotalValueCents/100).toFixed(2)],['Term',value.originalTermYears+' years'],['Annual value','$'+(value.aavCents/100).toFixed(2)]];}
export function CorrectionReversalControls({leagueId}){
 const {httpClient}=useSession(),base='/api/v1/leagues/'+encodeURIComponent(leagueId)+'/management/reversals';
 const [open,setOpen]=useState(false),[items,setItems]=useState(null),[selected,setSelected]=useState(''),[reason,setReason]=useState(''),[preview,setPreview]=useState(null),[pending,setPending]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
 const busy=useRef(false),attempt=useRef(null);
 const [lateLock,setLateLock]=useState(null);
 async function run(fn){if(busy.current)return;busy.current=true;setPending(true);setError('');try{await fn();}catch(e){setError(e.code==='CORRECTION_REVERSAL_CONFLICT'?'Current player or league changes prevent this reversal. Refresh the list and review again, or use the existing correction tools.':'The reversal could not be completed. Check your access and try again.');}finally{busy.current=false;setPending(false);}}
 function validate(data){if(data?.leagueId!==leagueId)throw Error('Wrong league');return true;}
 async function load(){await run(async()=>{const r=await httpClient.request(base,{authenticated:true,dataKind:'object',validateData:d=>{validate(d);if(!Array.isArray(d.corrections))throw Error('Invalid list');return true;}});setItems(r.data.corrections);setPreview(null);setSelected('');attempt.current=null;});}
 async function review(){await run(async()=>{setSaved(false);setPreview(null);attempt.current=null;const r=await httpClient.request(base+'/preview',{method:'POST',authenticated:true,dataKind:'object',body:{correctionId:selected,reason:reason.trim()},validateData:d=>{validate(d);if(d.correctionId!==selected||!['roster','contract'].includes(d.feature)||!d.current||!d.restore||!Array.isArray(d.warnings)||!Array.isArray(d.teamNames)||!/^[a-f0-9]{64}$/.test(d.previewHash))throw Error('Invalid preview');return true;}});setPreview(r.data);});}
 async function apply(){await run(async()=>{if(!attempt.current)attempt.current={key:createOperationId(),body:{correctionId:selected,reason:reason.trim(),previewHash:preview.previewHash,confirmed:true}};const response=await httpClient.request(base+'/apply',{method:'POST',authenticated:true,dataKind:'object',idempotencyKey:attempt.current.key,body:attempt.current.body,validateData:d=>validate(d)&&typeof d.correctionId==='string'});setSaved(true);setLateLock(response.data.lateLockStatus||null);setPreview(null);setItems(null);setReason('');attempt.current=null;});}
 const teamName=id=>preview.teamNames.find(t=>t.id===id)?.name||'Previous team';
 return <Surface as="section" className={styles.panel}><button className="hl-button hl-button--secondary" aria-expanded={open} onClick={()=>{setOpen(!open);if(!open&&!items)load();}}>Reverse an administrative correction</button>
  {open&&<><p>Restore earlier values from an eligible roster or contract correction. Each reversal adds a new correction and retains the original history. Later player transactions, changed ownership, or incompatible dependencies prevent reversal.</p>
   {items&&<><label>Previous correction<select value={selected} disabled={pending||!!preview} onChange={e=>setSelected(e.target.value)}><option value="">Choose a correction</option>{items.map(c=><option key={c.id} value={c.id} disabled={!!c.reversed}>{c.playerName} · {c.feature} · {new Date(c.at).toLocaleString()}{c.reversed?' · Already reversed':''}</option>)}</select></label>
    {selected&&<p>Original reason: {items.find(c=>c.id===selected)?.reason||'No reason recorded'}</p>}
    <label>Reason for reversal<input maxLength={500} value={reason} disabled={pending||!!preview} onChange={e=>setReason(e.target.value)}/></label><button className="hl-button hl-button--secondary" disabled={pending||!!preview||!selected||reason.trim().length<3} onClick={review}>Preview reversal</button></>}
   {preview&&<div><h3>Restore {preview.playerName}</h3><TableScroll><table><thead><tr><th>Field</th><th>Current</th><th>After reversal</th></tr></thead><tbody>{rows(preview.current,preview.feature,teamName).map(([name,value],i)=><tr key={name}><th>{name}</th><td>{value}</td><td>{rows(preview.restore,preview.feature,teamName)[i][1]}</td></tr>)}</tbody></table></TableScroll>
    {!!preview.warnings.length&&<><p>Confirming also accepts these roster and cap warnings:</p><ul>{preview.warnings.map((w,i)=><li key={i}>{w.code.replaceAll('_',' ').toLowerCase()}{w.teamId?' · '+teamName(w.teamId):''}</li>)}</ul></>}
    <p>Current league members receive an in-app notice. Saved lineup locks and recorded results keep their existing history.</p><button className="hl-button" disabled={pending} onClick={apply}>Confirm reversal</button>{' '}<button className="hl-button hl-button--secondary" disabled={pending} onClick={()=>{setPreview(null);attempt.current=null;setError('');}}>Cancel reversal preview</button></div>}
   <button className="hl-button hl-button--secondary" disabled={pending||!!preview} onClick={load}>Refresh corrections</button>{saved&&<p role="status">Correction reversed. Original history retained.</p>}
   {saved&&lateLock==='awaiting_data'&&<p role="status">The reversal is saved. A roster lock is waiting for statistics; check matchup recovery.</p>}
   {saved&&lateLock==='still_illegal'&&<p role="status">The reversal is saved. The roster still needs eligibility or lineup corrections before it can lock.</p>}
   {pending&&<p role="status">Checking correction…</p>}{error&&<p role="alert">{error}</p>}
  </>}
 </Surface>;
}
