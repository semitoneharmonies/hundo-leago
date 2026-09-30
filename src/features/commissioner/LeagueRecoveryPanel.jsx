import {useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {ErrorBlock,LoadingBlock,Surface,TableScroll} from '../../components/HundoUi.jsx';
import {routePaths} from '../../app/routePaths.js';
import {createOperationId} from '../../shared/api/idempotency.js';
import {ResponseContractError} from '../../shared/api/responseContracts.js';
import {standingsRebuildCommand} from '../competition/competitionQueries.js';
import {useSession} from '../session/sessionContext.js';
import styles from './LeagueCommunications.module.css';
function jobLabel(kind){if(kind.startsWith('free_agent_draft')||kind.startsWith('fad:'))return 'Free Agent Draft';if(kind.startsWith('matchup:'))return 'Matchup processing';if(kind.includes('rollover'))return 'Season rollover';return 'League operation';}
export function LeagueRecoveryPanel({leagueId,seasonId}){
 const session=useSession(),client=useQueryClient();const [opened,setOpened]=useState(false),[preview,setPreview]=useState(null),[reason,setReason]=useState(''),[receipt,setReceipt]=useState('');
 function validate(data){if(data?.leagueId!==leagueId||!Array.isArray(data.operations)||!Array.isArray(data.drafts)||!Array.isArray(data.weeks)||!Array.isArray(data.trades)||!Number.isInteger(data.operationCount)||!Number.isInteger(data.tradeCount))throw new ResponseContractError('Recovery status could not be verified.');return true;}
 const status=useQuery({queryKey:['league',leagueId,'recovery-hub'],queryFn:async({signal})=>{const r=await session.httpClient.request('/api/v1/leagues/'+encodeURIComponent(leagueId)+'/management/recovery',{authenticated:true,dataKind:'object',signal,validateData:validate});validate(r.data);return r.data;},enabled:opened&&session.status==='authenticated',retry:false,meta:{private:true,leagueId}});
 const review=useMutation({mutationFn:async()=>{
  const data=await standingsRebuildCommand(session.httpClient,leagueId,seasonId,{confirmed:false});
  if(data.code!=='MATCHUP_STANDINGS_REBUILD_PREVIEWED'||data.preview?.projection?.leagueId!==leagueId||data.preview?.projection?.seasonId!==seasonId||!Array.isArray(data.preview?.projection?.rows)||!data.preview.projection.rows.every(r=>typeof r.teamId==='string'&&typeof r.teamDisplayName==='string'&&['rank','wins','losses','ties','standingsPoints'].every(k=>Number.isSafeInteger(r[k])&&r[k]>=0))||!Number.isInteger(data.preview.expectedVersion)||data.preview.expectedVersion<1)throw new ResponseContractError('The standings preview could not be verified.');return data.preview;
 },onSuccess:data=>setPreview({...data,key:createOperationId()})});
 const rebuild=useMutation({mutationFn:async saved=>{
  const data=await standingsRebuildCommand(session.httpClient,leagueId,seasonId,{confirmed:true,expectedCurrentSnapshotId:saved.currentSnapshotId,reason:reason.trim()},saved.expectedVersion,saved.key);
  if(data.code!=='MATCHUP_STANDINGS_REBUILT'||typeof data.result?.replayed!=='boolean')throw new ResponseContractError('The rebuild confirmation could not be verified.');return data;
 },onSuccess:async()=>{setPreview(null);setReason('');setReceipt('Derived standings rebuilt. Recorded results and historical snapshots are retained.');await client.invalidateQueries({queryKey:['league',leagueId]});}});
 const info=status.data&&!status.isError?status.data:null,busy=review.isPending||rebuild.isPending;
 return <Surface as="section" id="league-recovery" className={styles.section} aria-label="League recovery tools"><details onToggle={e=>setOpened(e.currentTarget.open)}><summary>Recovery and supported retries</summary>{opened&&<>
  <p>Review the affected record before choosing a recovery. Every linked tool checks current eligibility and shows its own confirmation.</p>
  {status.isPending&&<LoadingBlock>Checking league operations…</LoadingBlock>}{status.error&&<ErrorBlock error={status.error} fallback="Recovery status could not be loaded."/>}
  {info&&<>
   <h3>Operations needing attention</h3><p>{info.operationCount} failed or interrupted operations. {info.operationCount>info.operations.length?'Showing the first '+info.operations.length+'.':''}</p>
   {!!info.operations.length&&<ul>{info.operations.map(j=><li key={j.id}>{jobLabel(j.kind)} · {j.status} · {j.attempts} attempts{j.nextAttemptAtMs?' · next scheduled attempt '+new Date(j.nextAttemptAtMs).toLocaleString():''}</li>)}</ul>}
   <p>Failed jobs may retry automatically. FAD actions below retry an eligible step using its saved occurrence. Running or expired leases are never cleared by this panel.</p>
   <div className={styles.preview}><h3>Free Agent Draft</h3><p>Opening checks, Candidate Card processing, allocations, restricted and fallback auctions, rollover and completion use the existing FAD recovery controls.</p>
    <ul>{info.drafts.map(d=><li key={d.id}><Link to={routePaths.leagueCommissioner(leagueId)+'?fadId='+encodeURIComponent(d.id)+'#fad-recovery'}>Review {d.status.replaceAll('_',' ')} draft</Link></li>)}</ul>
    <Link to={routePaths.leagueCommissioner(leagueId)+'?tools=fad#fad-recovery'}>Open FAD readiness and recovery</Link></div>
   <div className={styles.preview}><h3>Matchups and results</h3><p>Correct recorded scores from Matchups. Use Advance matchup week on this page for an eligible status transition. Completed results retain their correction history.</p>
    {!!info.weeks.length&&<ul>{info.weeks.map(w=><li key={w.id}>Week {w.sequence}: {w.status.replaceAll('_',' ')}</li>)}</ul>}<Link to={routePaths.leagueMatchups(leagueId)}>Review matchups and correct results</Link></div>
   <div className={styles.preview}><h3>Completed trades</h3><p>Preview exact reversal on the trade page. Later asset changes can prevent reversal; the existing correction workflow handles that case. Opening this list does not read proposals or offered assets.</p>
    {!info.trades.length?<p>No completed trades in the current season.</p>:<ul>{info.trades.map(t=><li key={t.id}><Link to={routePaths.trade(leagueId,t.id)}>{t.proposingTeam} / {t.receivingTeam}</Link></li>)}</ul>}
    {info.tradeCount>info.trades.length&&<p>Showing {info.trades.length} of {info.tradeCount}. <Link to={routePaths.leagueTrades(leagueId)}>Find older trades</Link></p>}</div>
   <p><Link to={routePaths.leagueCommissionerRoster(leagueId)}>Roster and contract corrections</Link> · <Link to={routePaths.leagues}>Platform site health and statistics refresh</Link></p>
   <button type="button" className="hl-button hl-button--secondary" disabled={status.isFetching||busy} onClick={()=>status.refetch()}>Refresh recovery status</button>
  </>}
  {seasonId&&<details><summary>Rebuild eligible derived standings</summary><p>Rebuild a derived standings snapshot from recorded results. Canonical finalized standings are protected; use result correction for those seasons. Scores, contracts and rosters are not changed by this rebuild.</p>
   <button type="button" className="hl-button hl-button--secondary" disabled={busy} onClick={()=>{setPreview(null);setReceipt('');rebuild.reset();review.mutate();}}>Preview standings rebuild</button>
   {review.error&&<ErrorBlock error={review.error} fallback="These standings are not eligible for a rebuild. Use result correction for finalized competition."/>}
   {preview&&<section className={styles.preview} aria-label="Standings rebuild preview"><h3>Projected standings</h3><TableScroll label="Projected standings"><table className="hl-data-table"><thead><tr><th>Team</th><th>Rank</th><th>Wins</th><th>Losses</th><th>Ties</th><th>Points</th></tr></thead><tbody>{preview.projection.rows.map(r=><tr key={r.teamId}><td>{r.teamDisplayName}</td><td>{r.rank}</td><td>{r.wins}</td><td>{r.losses}</td><td>{r.ties}</td><td>{r.standingsPoints}</td></tr>)}</tbody></table></TableScroll>
    <form className={styles.editor} onSubmit={e=>{e.preventDefault();rebuild.mutate(preview);}}><label>Rebuild reason<input required minLength={3} maxLength={500} disabled={busy||rebuild.isError} value={reason} onChange={e=>setReason(e.target.value)}/></label>
     <div className={styles.actions}><button type="submit" className="hl-button hl-button--primary" disabled={busy||reason.trim().length<3}>Confirm standings rebuild</button><button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={()=>{setPreview(null);rebuild.reset();}}>Cancel rebuild</button></div></form>
    {rebuild.error&&<ErrorBlock error={rebuild.error} fallback="The rebuild could not be confirmed. Retry unchanged or cancel and refresh its preview."/>}
   </section>}
  </details>}
  {receipt&&<p role="status">{receipt}</p>}
 </>}</details></Surface>;
}
