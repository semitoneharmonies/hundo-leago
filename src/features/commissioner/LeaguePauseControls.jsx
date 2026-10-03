import {useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {ErrorBlock,LoadingBlock,Surface} from '../../components/HundoUi.jsx';
import {createIdempotencyKey} from '../../shared/api/idempotency.js';
import {ResponseContractError} from '../../shared/api/responseContracts.js';
import {useSession} from '../session/sessionContext.js';
import styles from './LeagueCommunications.module.css';
export function LeaguePauseControls({leagueId}) {
  const session=useSession(),client=useQueryClient();
  const [opened,setOpened]=useState(false),[reason,setReason]=useState(''),[preview,setPreview]=useState(null),[acknowledged,setAcknowledged]=useState(false),[receipt,setReceipt]=useState('');
  const base='/api/v1/leagues/'+encodeURIComponent(leagueId)+'/management/pause';
  function validate(data,kind){
    let valid=data?.leagueId===leagueId;
    if(kind==='read')valid&&=typeof data.paused==='boolean'&&typeof data.canResume==='boolean'&&Number.isInteger(data.busyJobs)&&data.busyJobs>=0&&typeof data.scope==='string'&&Array.isArray(data.jobs);
    if(kind==='preview')valid&&=['pause','resume'].includes(data.proposed?.action)&&typeof data.proposed.reason==='string'&&typeof data.overdue==='boolean'&&
      ['pendingJobs','dueJobs','openAuctions','dueAuctions','pendingProposals','expiredProposals'].every(k=>Number.isSafeInteger(data.impacts?.[k])&&data.impacts[k]>=0)&&/^[a-f0-9]{64}$/.test(data.previewHash||'');
    if(kind==='apply')valid&&=data.accepted===true&&typeof data.id==='string'&&typeof data.replayed==='boolean';
    if(!valid)throw new ResponseContractError('The pause response could not be verified.');return true;
  }
  async function request(kind,options={}){const response=await session.httpClient.request(base+(kind==='read'?'':'/'+kind),{...options,authenticated:true,dataKind:'object',validateData:data=>validate(data,kind)});validate(response.data,kind);return response.data;}
  const state=useQuery({queryKey:['league',leagueId,'pause'],queryFn:({signal})=>request('read',{signal}),enabled:opened&&session.status==='authenticated',retry:false,meta:{private:true,leagueId}});
  const review=useMutation({mutationFn:()=>request('preview',{method:'POST',body:{action:state.data.paused?'resume':'pause',reason}}),onSuccess:data=>{setPreview({...data,key:createIdempotencyKey('league-pause')});setAcknowledged(false);}});
  const apply=useMutation({mutationFn:saved=>request('apply',{method:'POST',idempotencyKey:saved.key,body:{...saved.proposed,confirmed:true,previewHash:saved.previewHash}}),
    onSuccess:async(_data,saved)=>{setReceipt(saved.proposed.action==='pause'?'League paused. Members have been notified.':'League resumed. Members have been notified.');setPreview(null);setReason('');await client.invalidateQueries({queryKey:['league',leagueId]});}});
  const busy=review.isPending||apply.isPending;
  return <Surface as="section" className={styles.section} aria-label="League pause controls"><details onToggle={e=>setOpened(e.currentTarget.open)}>
    <summary>Pause or resume league competition</summary>
    {opened&&session.status==='authenticated'&&<>
      <p>Pause manager transactions and automatic league competition processing. League records, saved bids and history remain intact. Reading, announcements and administrative timing controls remain available.</p>
      <p><strong>Deadlines keep their saved times.</strong> Pausing does not extend auctions or trades. Review dates before resuming; overdue operations may process immediately. Global statistics and site backups continue.</p>
      {state.isPending&&<LoadingBlock>Checking pause status…</LoadingBlock>}{state.error&&<ErrorBlock error={state.error} fallback="Pause controls could not be loaded."/>}
      {state.data&&!state.isError&&<>
        <p>League is {state.data.paused?'paused':'not paused'}.</p>{state.data.reason&&<p>Pause reason: {state.data.reason}</p>}
        {state.data.paused&&!state.data.canResume?<p>This pause requires its original recovery workflow before resuming.</p>:state.data.busyJobs>0?<p>{state.data.interruptedJobs>0?state.data.interruptedJobs+' operations have expired processing leases and need recovery review. Pausing remains blocked until they are resolved.':state.data.busyJobs+' operations are still in progress. Let them finish before pausing.'} <a href={'/leagues/'+encodeURIComponent(leagueId)+'/commissioner/recovery'}>Review recovery</a></p>:
          <form className={styles.editor} onSubmit={e=>{e.preventDefault();setPreview(null);apply.reset();review.mutate();}}>
            <label>Reason for {state.data.paused?'resuming':'pausing'}<input required minLength={3} maxLength={500} disabled={busy} value={reason} onChange={e=>{setReason(e.target.value);setPreview(null);review.reset();apply.reset();setReceipt('');}}/></label>
            <button type="submit" className="hl-button hl-button--secondary" disabled={busy||reason.trim().length<3}>{state.data.paused?'Review resume':'Review pause'}</button>
          </form>}
        <button type="button" className="hl-button hl-button--quiet" disabled={busy||state.isFetching} onClick={()=>{setPreview(null);state.refetch();}}>Refresh pause status</button>
      </>}
      {review.error&&<ErrorBlock error={review.error} fallback="The pause change could not be previewed."/>}
      {preview&&<section className={styles.preview} aria-label="Pause change preview"><h3>{preview.proposed.action==='pause'?'Review league pause':'Review league resume'}</h3>
        <ul><li>{preview.impacts.openAuctions} open auctions; {preview.impacts.dueAuctions} already due for resolution</li><li>{preview.impacts.pendingProposals} pending trade proposals; {preview.impacts.expiredProposals} past their deadline</li>
          <li>{preview.impacts.pendingJobs} pending or failed operations; {preview.impacts.dueJobs} have reached their scheduled time</li></ul>
        <p>Saved bids, proposals, rosters, results and all deadline timestamps remain unchanged by this action. Members will receive an in-app notice.</p>
        {preview.proposed.action==='resume'&&preview.overdue&&<p><strong>Due operations may run immediately after resuming. This can award auctions, expire proposals or advance competition. Failed operations still need their supported retry.</strong></p>}
        <label className={styles.check}><input type="checkbox" disabled={busy} checked={acknowledged} onChange={e=>setAcknowledged(e.target.checked)}/>I have reviewed the unchanged deadlines and processing impact.</label>
        <div className={styles.actions}><button type="button" className="hl-button hl-button--primary" disabled={busy||!acknowledged} onClick={()=>apply.mutate(preview)}>{preview.proposed.action==='pause'?'Confirm league pause':'Confirm league resume'}</button>
          <button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={()=>{setPreview(null);apply.reset();}}>Keep current state</button></div>
        {apply.error&&<ErrorBlock error={apply.error} fallback="The pause change could not be saved."/>}
      </section>}
      {receipt&&<p role="status">{receipt}</p>}
    </>}
  </details></Surface>;
}
