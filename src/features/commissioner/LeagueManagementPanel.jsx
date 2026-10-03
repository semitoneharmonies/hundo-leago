import {OperationStatus} from './OperationStatus.jsx';
import {commissionerSectionPath} from './commissionerSections.js';
import {useState} from 'react';
import {useMutation,useQuery} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {ErrorBlock,LoadingBlock,Surface} from '../../components/HundoUi.jsx';
import {ResponseContractError} from '../../shared/api/responseContracts.js';
import {routePaths} from '../../app/routePaths.js';
import {useSession} from '../session/sessionContext.js';
import styles from './LeagueCommunications.module.css';
const integer=v=>Number.isSafeInteger(v)&&v>=0;
const categories=[['all','All changes'],['preseason_reset','Preseason resets and restores'],['pick_repair','Draft-pick repair'],['pause','League paused'],['resume','League resumed'],['reverse_correction','Correction reversals'],['calendar','League calendar'],['scoring','Scoring'],['auction_schedule','Auction schedule'],['auction_timing','Auction timing'],['private_review','Private reviews'],['trade_deadline','Trade deadline'],['fad_timing','FAD timing'],['fad_cutoff','FAD cutoff'],['fad_deadline','FAD deadline'],['roster_correction','Roster and contract corrections'],['communication','Announcements and reminders'],['communication_archive','Archived announcements'],['competition','Competition corrections']];
const calendarLabels={NO_CURRENT_SEASON:'Choose the current season',SEASON_DATES_UNSET:'Set season and playoff dates',MATCHUPS_NOT_SCHEDULED:'Schedule matchup weeks',MATCHUP_DATES_CONFLICT:'Review overlapping or inconsistent matchup dates',PLAYOFF_DATES_CONFLICT:'Review playoff dates',CANDIDATE_DEADLINE_UNSET:'Set the Candidate Card target deadline'};
const rosterLabels={ACTIVE_FORWARD_SLOTS_INCOMPLETE:'Fill all 12 forward slots',ACTIVE_DEFENCE_SLOTS_INCOMPLETE:'Fill all 6 defence slots',HEALTHY_PLAYER_ON_IR:'Review a healthy player on IR',SALARY_CAP_EXCEEDED:'Reduce active salary-cap usage',SALARY_CAP_CALCULATION_INCOMPLETE:'Review incomplete contract or cap records',ACTIVE_CONTRACT_MISSING:'Review a player without an active contract'};
function validate(data,leagueId,kind) {
  let valid=data?.leagueId===leagueId;
  if(kind==='readiness')valid&&=integer(data.checkedAtMs)&&Array.isArray(data.teams)&&Array.isArray(data.drafts)&&Array.isArray(data.calendarIssues)&&
    Array.isArray(data.missingPicks)&&Array.isArray(data.operations)&&data.summary&&['teams','missingManagers','unfinishedCards','illegalRosters','missingPicks','calendarIssues','operations'].every(k=>integer(data.summary[k]))&&
    data.teams.every(t=>typeof t.id==='string'&&typeof t.name==='string'&&(t.managerName===null||typeof t.managerName==='string')&&
      (t.cardStatus===null||['not_created','empty','incomplete','complete'].includes(t.cardStatus))&&(t.roster===null||typeof t.roster.legal==='boolean'&&typeof t.roster.requiredNow==='boolean'&&Array.isArray(t.roster.reasonCodes)));
  if(kind==='history')valid&&=Array.isArray(data.changes)&&data.changes.length<=50&&data.changes.every(c=>typeof c.id==='string'&&integer(c.at)&&typeof c.actorName==='string'&&typeof c.summary==='string'&&categories.some(([k])=>k===c.kind))&&
    typeof data.page?.hasMore==='boolean'&&(data.page.nextCursor===null||typeof data.page.nextCursor==='string');
  if(kind==='export')valid&&=Object.keys(data).sort().join()==='excluded,format,generatedAtMs,league,leagueId,notice,picks,results,rosters,scope,season,teams'&&data.format==='hundo-league-export-v1'&&data.scope==='current-season'&&data.league?.id===leagueId&&integer(data.generatedAtMs)&&
    ['teams','rosters','picks','results','excluded'].every(k=>Array.isArray(data[k]));
  if(!valid)throw new ResponseContractError('The league management response could not be verified.');return true;
}
function values(value,prefix='') {
  if(value===null||value===undefined)return [];
  if(typeof value!=='object')return [[prefix,typeof value==='number'&&prefix.toLowerCase().includes('weights')?(value/100).toFixed(2)+' FP':String(value)]];
  return Object.entries(value).filter(([key])=>!/(^id$|_id$|Id$|version|status|json$)/i.test(key)).flatMap(([key,item])=>{
    const label=(prefix?prefix+' · ':'')+key.replace(/([a-z])([A-Z])/g,'$1 $2').replaceAll('_',' ').replace(/ at ms$/i,'');
    if((/AtMs$|_at_ms$/).test(key)&&integer(item))return [[label,new Date(item).toLocaleString()]];
    return values(item,label);
  }).slice(0,80);
}
export function LeagueManagementPanel({leagueId,initialSection='readiness',standalone=false}) {
  const session=useSession(),[opened,setOpened]=useState(standalone),[section,setSection]=useState(initialSection),[search,setSearch]=useState(''),[filter,setFilter]=useState({q:'',kind:'all',cursor:null}),[downloaded,setDownloaded]=useState(false);
  const base='/api/v1/leagues/'+encodeURIComponent(leagueId)+'/management/';
  async function request(kind,query='',signal) {
    const result=await session.httpClient.request(base+kind+query,{authenticated:true,dataKind:'object',signal,validateData:data=>validate(data,leagueId,kind)});
    validate(result.data,leagueId,kind);return result.data;
  }
  const enabled=opened&&session.status==='authenticated';
  const readiness=useQuery({queryKey:['league',leagueId,'management','readiness'],queryFn:({signal})=>request('readiness','',signal),enabled:enabled&&section==='readiness',retry:false,meta:{private:true,leagueId}});
  const history=useQuery({queryKey:['league',leagueId,'management','history',filter],queryFn:({signal})=>request('history','?'+new URLSearchParams({q:filter.q,kind:filter.kind,...(filter.cursor?{cursor:filter.cursor}:{})}),signal),enabled:enabled&&section==='history',retry:false,meta:{private:true,leagueId}});
  const download=useMutation({mutationFn:()=>request('export'),onSuccess:data=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='hundo-league-'+leagueId+'-'+new Date(data.generatedAtMs).toISOString().slice(0,10)+'.json';
    document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);setDownloaded(true);
  }});
  const info=readiness.data;
  return <Surface as="section" className={styles.section} aria-label="League management reports"><details open={opened} onToggle={e=>setOpened(e.currentTarget.open)}>
    <summary>{standalone?({readiness:'League readiness',history:'Change history',export:'Export data (JSON)'})[section]:'League readiness, change history and export'}</summary>
    {opened&&session.status==='authenticated'&&<>{!standalone&&<div className={styles.actions}>{[['readiness','League readiness'],['history','Change history'],['export','Export league data']].map(([key,label])=><button key={key} type="button" className={'hl-button '+(section===key?'hl-button--primary':'hl-button--secondary')} aria-pressed={section===key} onClick={()=>setSection(key)}>{label}</button>)}</div>}
      {section==='readiness'&&<div>
        <h3>League readiness</h3><p>Read-only check of teams, dates and scheduled operations. Refresh to check again.</p>
        {readiness.isPending&&<LoadingBlock>Checking league readiness…</LoadingBlock>}
        {readiness.error&&<ErrorBlock error={readiness.error} fallback="The readiness check could not be completed."/>}
        {info&&!readiness.isError&&<>
          <p>Checked {new Date(info.checkedAtMs).toLocaleString()}.</p>
          <ul className={styles.summaryGrid}><li>{info.summary.missingManagers} teams without an active manager</li><li>{info.summary.unfinishedCards} unfinished Candidate Cards</li>
            <li>{info.summary.illegalRosters} rosters needing attention for competition</li><li>{info.summary.missingPicks} missing draft picks</li>
            <li>{info.summary.calendarIssues} calendar items to review</li><li>{info.summary.operations} failed or interrupted operations</li></ul>
          {!info.teams.length&&<p>No active teams are configured. <Link to={routePaths.leagueTeams(leagueId)}>Manage teams</Link></p>}
          <ul className={styles.cards}>{info.teams.filter(t=>!t.managerName||(t.cardStatus&&t.cardStatus!=='complete')||(t.roster&&!t.roster.legal)).map(t=><li key={t.id}><div><strong>{t.name}</strong><p>{t.managerName||'No active manager'}{t.cardStatus?' · Candidate Card: '+t.cardStatus.replace('_',' '):''}</p>
            {t.roster&&!t.roster.legal&&<p>{t.roster.requiredNow?'Roster attention needed':'Roster preparation before competition'}: {t.roster.reasonCodes.map(c=>rosterLabels[c]||'Review roster limits and assignments').join('; ')}.</p>}
            {!t.roster&&<p>Roster checks await an available season and roster.</p>}</div><Link to={routePaths.leagueCommissionerRoster(leagueId)}>Review roster</Link></li>)}</ul>
          {info.calendarIssues.length>0&&<><h4>Calendar</h4><ul>{info.calendarIssues.map(c=><li key={c}>{calendarLabels[c]||'Review league calendar'}</li>)}</ul><Link to={commissionerSectionPath(leagueId,'calendar')}>Review league calendar</Link></>}
          {info.missingPicks.length>0&&<><h4>Missing draft picks</h4><ul>{info.missingPicks.map(p=><li key={p.draftId+p.teamId+p.round}>{p.teamName} · Round {p.round}</li>)}</ul><Link to={routePaths.leagueDrafts(leagueId)}>Review entry draft</Link></>}
          {info.operations.length>0&&<><h4>Operations to review</h4><p>Use the supported FAD or matchup recovery controls. This check does not retry operations.</p><ul className={styles.cards}>{info.operations.map(j=><OperationStatus key={j.id} job={j} checkedAtMs={info.checkedAtMs} leagueId={leagueId}/>)}</ul></>}
          {info.summary.operations>info.operations.length&&<p>Showing the first {info.operations.length} of {info.summary.operations} operations needing review.</p>}
          <div className={styles.actions}><button type="button" className="hl-button hl-button--secondary" disabled={readiness.isFetching} onClick={()=>readiness.refetch()}>Refresh readiness check</button></div>
        </>}
      </div>}
      {section==='history'&&<div><h3>Administrative change history</h3><p>Search changes by person, reason or category. Private contents stay hidden.</p>
        <form className={styles.filterBar} onSubmit={e=>{e.preventDefault();setFilter(old=>({...old,q:search,cursor:null}));}}>
          <label>Search changes<input maxLength={120} value={search} onChange={e=>setSearch(e.target.value)}/></label>
          <label>Change category<select value={filter.kind} onChange={e=>setFilter(old=>({...old,kind:e.target.value,cursor:null}))}>{categories.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
          <button type="submit" className="hl-button hl-button--secondary">Search history</button>
        </form>
        {history.isPending&&<LoadingBlock>Loading change history…</LoadingBlock>}{history.error&&<ErrorBlock error={history.error} fallback="Change history could not be loaded."/>}
        {history.data&&!history.isError&&<>{!history.data.changes.length&&<p>No matching changes.</p>}<ol className={styles.historyGrid}>{history.data.changes.map(c=><li key={c.id} className={styles.notice}>
          <strong>{c.summary}</strong><p>{new Date(c.at).toLocaleString()} · {c.actorName}</p>{c.reason&&<p>Reason: {c.reason}</p>}
          {(c.before||c.after)&&<details><summary>Before and after</summary><div className={styles.comparisonGrid}><section><h4>Before</h4><ul>{values(c.before).map(([label,value],i)=><li key={i}>{label}: {value}</li>)}</ul></section><section><h4>After</h4><ul>{values(c.after).map(([label,value],i)=><li key={i}>{label}: {value}</li>)}</ul></section></div></details>}
        </li>)}</ol><div className={styles.actions}>{filter.cursor&&<button type="button" className="hl-button hl-button--secondary" onClick={()=>setFilter(old=>({...old,cursor:null}))}>Newest changes</button>}
          {history.data.page.hasMore&&<button type="button" className="hl-button hl-button--secondary" onClick={()=>setFilter(old=>({...old,cursor:history.data.page.nextCursor}))}>Older changes</button>}</div></>}
      </div>}
      {section==='export'&&<div><h3>Export current-season league data</h3><p>Download current teams, rosters, contracts, picks and results as JSON for technical analysis or reference. This is a data file, not a formatted report.</p>
        <p>Candidate Cards, private bids, trade proposals, account contact details and private administrative notes are excluded. This is a reference export; restoring league state uses the separate recovery workflow.</p>
        <button type="button" className="hl-button hl-button--secondary" disabled={download.isPending} onClick={()=>{setDownloaded(false);download.mutate();}}>Export data (JSON)</button>
        {download.error&&<ErrorBlock error={download.error} fallback="The export could not be downloaded."/>}{downloaded&&<p role="status">League export downloaded.</p>}
      </div>}
    </>}
  </details></Surface>;
}
