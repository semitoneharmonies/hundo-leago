import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {ErrorBlock,LoadingBlock,Surface,TableScroll} from '../../components/HundoUi.jsx';
import {ResponseContractError} from '../../shared/api/responseContracts.js';
import {routePaths} from '../../app/routePaths.js';
import {useSession} from '../session/sessionContext.js';
import styles from './LeagueCommunications.module.css';
const issues={CURRENT_SEASON_MISSING:'Choose the current league season.',NEXT_SEASON_MISSING:'The next season has not been prepared.',NEXT_SEASON_AMBIGUOUS:'More than one next-season record needs review.',LEAGUE_PAUSED:'The league is paused. Review its deadlines before resuming.',SOURCE_DRAFT_UNFINISHED:'Finish the current Free Agent Draft.',SOURCE_COMPETITION_UNFINISHED:'Finish the scheduled matchups and finalize the current standings.',AUCTIONS_UNFINISHED:'Finish or cancel the remaining open auctions.',NEXT_CALENDAR_UNSET:'Set the next season and playoff dates.',NEXT_DRAFT_NOT_SCHEDULED:'Prepare and schedule the next entry draft.',RECORDS_NEED_REVIEW:'Contracts, roster rights, obligations or outstanding trades need correction before an exact projection is available.'};
const money=value=>'$'+(value/100).toFixed(2);
export function SeasonRolloverPreview({leagueId}){
 const session=useSession(),[opened,setOpened]=useState(false);
 function validate(d){let valid=d?.leagueId===leagueId&&d.readOnly===true&&typeof d.projectionAvailable==='boolean'&&Array.isArray(d.issues)&&d.issues.every(i=>Object.hasOwn(issues,i))&&['contracts','obligations','picks','drafts','bindings'].every(k=>Array.isArray(d[k]))&&Number.isSafeInteger(d.archived?.results)&&Number.isSafeInteger(d.archived?.weeks);
  if(d?.projectionAvailable)valid&&=d.summary&&Object.values(d.summary).every(n=>Number.isSafeInteger(n)&&n>=0)&&d.contracts.every(c=>typeof c.playerName==='string'&&typeof c.teamName==='string'&&['continue','expire'].includes(c.outcome)&&Number.isSafeInteger(c.nextYears)&&Number.isSafeInteger(c.currentYears)&&Number.isSafeInteger(c.aavCents))&&d.obligations.every(o=>['retention','buyout'].includes(o.kind)&&typeof o.playerName==='string'&&typeof o.teamName==='string'&&Number.isSafeInteger(o.currentAmountCents)&&Number.isSafeInteger(o.nextAmountCents));
  if(!valid)throw new ResponseContractError('The season preview could not be verified.');return true;}
 const state=useQuery({queryKey:['league',leagueId,'season-preview'],queryFn:async({signal})=>{const r=await session.httpClient.request('/api/v1/leagues/'+encodeURIComponent(leagueId)+'/management/season-preview',{authenticated:true,dataKind:'object',signal,validateData:validate});validate(r.data);return r.data;},enabled:opened&&session.status==='authenticated',retry:false,meta:{private:true,leagueId}});
 const data=state.data&&!state.isError?state.data:null;
 return <Surface as="section" className={styles.section} aria-label="Season rollover preview"><details onToggle={e=>setOpened(e.currentTarget.open)}><summary>Preview next season</summary>{opened&&<>
  <p>Review the next season using the saved rollover rules. This preview does not advance contracts, move players, schedule a draft or change the current season.</p>
  {state.isPending&&<LoadingBlock>Calculating the season preview…</LoadingBlock>}{state.error&&<ErrorBlock error={state.error} fallback="The season preview could not be loaded."/>}
  {data&&<>
   <h3>{data.source?.label||'Current season'} → {data.target?.label||'Next season not prepared'}</h3>
   <p>{data.archived.weeks} matchup weeks and {data.archived.results} recorded results stay in the current season’s history. Existing draft-pick owners remain recorded.</p>
   {data.issues.length>0&&<section aria-label="Season preparation checklist"><h4>Preparation still needed</h4><ul>{data.issues.map(i=><li key={i}>{issues[i]}</li>)}</ul></section>}
   {data.projectionAvailable?<>
    <ul><li>{data.summary.contractsContinuing} contracts continue; {data.summary.contractsExpiring} expire</li><li>{data.summary.playersCarried} player rights carry forward; {data.summary.playersReleased} are released</li><li>{data.summary.obligationsContinuing} retention or buyout obligations continue; {data.summary.obligationsCompleting} finish</li><li>{data.summary.tradesCancelled} trade proposals would be cancelled because their assets change</li></ul>
    <details><summary>Contract changes ({data.contracts.length})</summary><TableScroll label="Next-season contract projection"><table className="hl-data-table"><thead><tr><th>Player</th><th>Team</th><th>Current years</th><th>Next years</th><th>AAV</th><th>Outcome</th></tr></thead><tbody>{data.contracts.map(c=><tr key={c.id}><td>{c.playerName}</td><td>{c.teamName}</td><td>{c.currentYears}</td><td>{c.nextYears}</td><td>{money(c.aavCents)}</td><td>{c.outcome==='expire'?'Expires':'Continues'}</td></tr>)}</tbody></table></TableScroll></details>
    <details><summary>Retention and buyout obligations ({data.obligations.length})</summary><TableScroll label="Next-season obligations"><table className="hl-data-table"><thead><tr><th>Player</th><th>Responsible team</th><th>Kind</th><th>Current</th><th>Next season</th></tr></thead><tbody>{data.obligations.map(o=><tr key={o.id}><td>{o.playerName}</td><td>{o.teamName}</td><td>{o.kind}</td><td>{money(o.currentAmountCents)}</td><td>{money(o.nextAmountCents)}</td></tr>)}</tbody></table></TableScroll></details>
   </>:<p>An exact player and obligation projection will appear once the next season exists and the affected records are consistent.</p>}
   <details><summary>Next-season draft picks ({data.picks.length})</summary><TableScroll label="Next-season draft picks"><table className="hl-data-table"><thead><tr><th>Round</th><th>Position</th><th>Original team</th><th>Current owner</th><th>Status</th></tr></thead><tbody>{data.picks.map(p=><tr key={p.id}><td>{p.round}</td><td>{p.position||'Not drawn'}</td><td>{p.originalTeamName}</td><td>{p.ownerTeamName}</td><td>{p.status.replaceAll('_',' ')}</td></tr>)}</tbody></table></TableScroll></details>
   <p>Rollover occurs through the separately scheduled entry draft after its final checks. This is a current-state projection; later roster, trade and calendar changes can change it.</p>
   <div className={styles.actions}><button type="button" className="hl-button hl-button--secondary" disabled={state.isFetching} onClick={()=>state.refetch()}>Refresh season preview</button><Link to={routePaths.leagueDrafts(leagueId)}>Review draft preparation</Link></div>
  </>}
 </>}</details></Surface>;
}
