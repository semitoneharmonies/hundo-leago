import {useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {ErrorBlock,LoadingBlock,Surface} from '../../components/HundoUi.jsx';
import {createIdempotencyKey} from '../../shared/api/idempotency.js';
import {ResponseContractError} from '../../shared/api/responseContracts.js';
import {useSession} from '../session/sessionContext.js';
import styles from './LeagueCommunications.module.css';
const key = p => p.teamId + ':' + p.round;
const validPick = p => p && typeof p.teamId==='string' && typeof p.teamName==='string' && typeof p.ownerTeamId==='string' &&
  Number.isInteger(p.round) && p.round>=1 && p.round<=4 && Number.isInteger(p.position) && p.position>=1;
export function LeaguePickRepairControls({leagueId}) {
  const session=useSession(),client=useQueryClient();
  const [opened,setOpened]=useState(false),[editor,setEditor]=useState(null),[preview,setPreview]=useState(null),[receipt,setReceipt]=useState('');
  const base='/api/v1/leagues/'+encodeURIComponent(leagueId)+'/management/picks';
  function validate(data,kind) {
    let valid=data?.leagueId===leagueId;
    if(kind==='read')valid&&=Array.isArray(data.drafts)&&data.drafts.every(d=>typeof d.id==='string'&&typeof d.seasonLabel==='string'&&
      (d.blockedReason===null||typeof d.blockedReason==='string')&&Array.isArray(d.teams)&&d.teams.every(t=>typeof t.id==='string'&&typeof t.name==='string')&&Array.isArray(d.missing)&&d.missing.every(validPick));
    if(kind==='preview')valid&&=Array.isArray(data.additions)&&data.additions.length>0&&data.additions.every(p=>validPick(p)&&typeof p.ownerName==='string')&&
      Number.isSafeInteger(data.preservedCount)&&data.preservedCount>=0&&typeof data.proposed?.draftId==='string'&&Array.isArray(data.proposed.owners)&&typeof data.proposed.reason==='string'&&/^[a-f0-9]{64}$/.test(data.previewHash||'');
    if(kind==='apply')valid&&=data.accepted===true&&typeof data.id==='string'&&typeof data.replayed==='boolean';
    if(!valid)throw new ResponseContractError('The draft-pick repair response could not be verified.');return true;
  }
  async function request(kind,options={}) {
    const response=await session.httpClient.request(base+(kind==='read'?'':'/'+kind),{...options,authenticated:true,dataKind:'object',validateData:data=>validate(data,kind)});
    validate(response.data,kind);return response.data;
  }
  const state=useQuery({queryKey:['league',leagueId,'pick-repair'],queryFn:({signal})=>request('read',{signal}),enabled:opened&&session.status==='authenticated',retry:false,meta:{private:true,leagueId}});
  const review=useMutation({mutationFn:()=>request('preview',{method:'POST',body:{draftId:editor.draft.id,owners:editor.owners,reason:editor.reason}}),
    onSuccess:data=>setPreview({...data,key:createIdempotencyKey('pick-repair')})});
  const apply=useMutation({mutationFn:saved=>request('apply',{method:'POST',idempotencyKey:saved.key,body:{...saved.proposed,previewHash:saved.previewHash,confirmed:true}}),
    onSuccess:async()=>{setEditor(null);setPreview(null);setReceipt('Missing picks added. League members have been notified.');await client.invalidateQueries({queryKey:['league',leagueId]});}});
  const busy=review.isPending||apply.isPending;
  function edit(change){setEditor(old=>({...old,...change}));setPreview(null);review.reset();apply.reset();setReceipt('');}
  return <Surface as="section" className={styles.section} aria-label="Missing draft-pick repair"><details onToggle={e=>setOpened(e.currentTarget.open)}>
    <summary>Repair missing draft picks</summary>
    {opened&&session.status==='authenticated'&&<>
      <p>Add missing picks before an entry draft begins. The recorded order determines each position. Review the owner of every proposed pick; existing ownership and trades stay intact.</p>
      {state.isPending&&<LoadingBlock>Checking entry drafts…</LoadingBlock>}{state.error&&<ErrorBlock error={state.error} fallback="Entry drafts could not be checked."/>}
      {state.data&&!state.isError&&!editor&&<>{!state.data.drafts.length&&<p>No upcoming entry drafts are available.</p>}
        <ul>{state.data.drafts.map(d=><li key={d.id}><strong>{d.seasonLabel}</strong>: {d.blockedReason||`${d.missing.length} missing picks`}
          {!d.blockedReason&&d.missing.length>0&&<button type="button" className="hl-button hl-button--secondary" onClick={()=>{setReceipt('');setEditor({draft:d,reason:'',owners:d.missing.map(p=>({teamId:p.teamId,round:p.round,ownerTeamId:p.ownerTeamId}))});}}>Review {d.seasonLabel} picks</button>}</li>)}</ul>
      </>}
      {editor&&<form className={styles.editor} onSubmit={e=>{e.preventDefault();setPreview(null);apply.reset();review.mutate();}}>
        <h3>{editor.draft.seasonLabel} missing picks</h3>
        {editor.draft.missing.map(p=><label key={key(p)}>Round {p.round}, position {p.position} · {p.teamName} original pick
          <select aria-label={`Owner of ${p.teamName} round ${p.round} pick`} disabled={busy} value={editor.owners.find(o=>key(o)===key(p)).ownerTeamId}
            onChange={e=>edit({owners:editor.owners.map(o=>key(o)===key(p)?{...o,ownerTeamId:e.target.value}:o)})}>
            {editor.draft.teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
          </select></label>)}
        <label>Reason for pick repair<input required minLength={3} maxLength={500} disabled={busy} value={editor.reason} onChange={e=>edit({reason:e.target.value})}/></label>
        <div className={styles.actions}><button type="submit" className="hl-button hl-button--secondary" disabled={busy||editor.reason.trim().length<3}>Preview pick repair</button>
          <button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={()=>{setEditor(null);setPreview(null);review.reset();apply.reset();}}>Cancel pick repair</button></div>
      </form>}
      {review.error&&<ErrorBlock error={review.error} fallback="The missing picks could not be previewed."/>}
      {preview&&<section className={styles.preview} aria-label="Draft-pick repair preview"><h3>Confirm new picks and owners</h3>
        <ul>{preview.additions.map(p=><li key={key(p)}>Round {p.round}, position {p.position} · {p.teamName} original pick → owned by {p.ownerName}</li>)}</ul>
        <p>{preview.preservedCount} existing picks remain unchanged. Each new pick starts unused. This does not replay trades or a lottery.</p><p>Reason: {preview.proposed.reason}</p>
        <button type="button" className="hl-button hl-button--primary" disabled={busy} onClick={()=>apply.mutate(preview)}>Confirm missing-pick repair</button>
        {apply.error&&<ErrorBlock error={apply.error} fallback="The missing picks could not be added."/>}
      </section>}
      {receipt&&<p role="status">{receipt}</p>}
    </>}
  </details></Surface>;
}
