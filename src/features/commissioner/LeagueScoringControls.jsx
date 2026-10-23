import {useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {ErrorBlock,LoadingBlock,Surface,TableScroll} from '../../components/HundoUi.jsx';
import {SCORING_CATEGORIES} from '../../shared/scoringCategories.js';
import {createIdempotencyKey} from '../../shared/api/idempotency.js';
import {useSession} from '../session/sessionContext.js';
import {validateLeagueScoring} from './leagueScoringContracts.js';
import styles from './LeagueCommunications.module.css';
import scoringStyles from './LeagueScoringControls.module.css';
const points=value=>(value/100).toFixed(2);
function hundredths(text) {
  if(!/^-?\d{1,4}(?:\.\d{1,2})?$/.test(text))return NaN;
  const [whole,fraction='']=text.replace('-','').split('.');
  return (Number(whole)*100+Number(fraction.padEnd(2,'0')))*(text.startsWith('-')?-1:1);
}
const editableWeights=weights=>Object.fromEntries(['F','D'].map(p=>[p,Object.fromEntries(SCORING_CATEGORIES.map(c=>[c.key,points(weights[p][c.key])]))]));
export function LeagueScoringControls({leagueId}) {
  const session=useSession(),client=useQueryClient(),[editor,setEditor]=useState(null),[preview,setPreview]=useState(null),[receipt,setReceipt]=useState('');
  const base='/api/v1/leagues/'+encodeURIComponent(leagueId)+'/scoring';
  async function request(suffix,options,kind='state') {
    const response=await session.httpClient.request(base+suffix,{...options,authenticated:true,dataKind:'object',validateData:data=>validateLeagueScoring(data,leagueId,kind)});
    validateLeagueScoring(response.data,leagueId,kind);return response.data;
  }
  const state=useQuery({queryKey:['league',leagueId,'scoring'],queryFn:({signal})=>request('',{signal}),enabled:session.status==='authenticated',retry:false,meta:{private:true,leagueId}});
  const review=useMutation({mutationFn:()=>request('/preview',{method:'POST',body:{effectiveWeekSequence:Number(editor.week),comparisonWeekId:editor.comparison||null,reason:editor.reason,
    weights:Object.fromEntries(['F','D'].map(p=>[p,Object.fromEntries(SCORING_CATEGORIES.map(c=>[c.key,hundredths(editor.weights[p][c.key])]))]))}},'preview'),
    onSuccess:data=>setPreview({...data,key:createIdempotencyKey('scoring')})});
  const apply=useMutation({mutationFn:saved=>request('/apply',{method:'POST',idempotencyKey:saved.key,body:{...saved.proposed,confirmed:true,previewHash:saved.previewHash}},'accepted'),
    onSuccess:async()=>{setEditor(null);setPreview(null);setReceipt('Scoring values saved. League members have been notified.');await client.invalidateQueries({queryKey:['league',leagueId]});}});
  const busy=review.isPending||apply.isPending,available=session.status==='authenticated'&&state.data&&!state.isError;
  function edit(change){setEditor(old=>({...old,...change}));setPreview(null);setReceipt('');review.reset();apply.reset();}
  const valid=editor&&editor.reason.trim().length>=3&&['F','D'].every(p=>SCORING_CATEGORIES.every(c=>Number.isSafeInteger(hundredths(editor.weights[p][c.key]))&&Math.abs(hundredths(editor.weights[p][c.key]))<=100000));
  const weeks=state.data?.weeks.filter(w=>w.editable)||[];
  return <Surface as="section" className={styles.section} aria-label="League scoring controls">
    <h2>Scoring values</h2><p>Set fantasy points for each statistic, including game-winning goals and defence values. Choose when the new rules take effect.</p>
    {state.isPending&&<LoadingBlock>Loading scoring rules…</LoadingBlock>}
    {state.error&&<ErrorBlock error={state.error} fallback="Scoring controls are unavailable."/>}
    {available&&<>
      <p>Season player totals and rankings use the current league weights. Each matchup uses the rules effective for its week. Completed results stay recorded.</p>
      {!editor&&<button type="button" className="hl-button hl-button--secondary" disabled={state.data.weeks.length>0&&!weeks.length} onClick={()=>{
        const future=weeks.find(w=>w.startsAtMs>state.data.serverNowMs)||weeks[0],week=future?.sequence||1;
        const planned=state.data.rules.filter(r=>r.effectiveWeekSequence<=week).sort((a,b)=>b.effectiveWeekSequence-a.effectiveWeekSequence||b.revision-a.revision)[0];
        setEditor({week:String(week),comparison:'',reason:'',weights:editableWeights(planned?.weights||state.data.defaults)});setReceipt('');
      }}>Edit scoring values</button>}
      {editor&&<form className={styles.editor} onSubmit={event=>{event.preventDefault();setPreview(null);apply.reset();review.mutate();}}>
        <p>Current matchup: Week {state.data.currentWeekSequence}. Choose a later week to schedule a change.</p>
        <label>Effective matchup week<select disabled={busy} value={editor.week} onChange={event=>edit({week:event.target.value})}>
          {state.data.weeks.length?weeks.map(w=><option key={w.id} value={w.sequence}>Week {w.sequence}{w.startsAtMs<=state.data.serverNowMs?' — already started':''}</option>):<option value="1">Week 1 — schedule pending</option>}
        </select></label>
        <p>Selecting an already-started week changes its live points from the beginning of that week. Saved lineups and original statistics stay intact.</p>
        <TableScroll label="Scoring value editor"><table className={'hl-data-table '+scoringStyles.weights}><caption>Fantasy points per recorded statistic</caption>
          <thead><tr><th scope="col">Statistic</th><th scope="col">Forward</th><th scope="col">Defence</th></tr></thead>
          <tbody>{SCORING_CATEGORIES.map(c=><tr key={c.key}><th scope="row">{c.label}</th>{['F','D'].map(p=><td key={p}><input aria-label={c.label+' '+(p==='F'?'forward':'defence')}
            type="number" min="-1000" max="1000" step="0.01" required disabled={busy} value={editor.weights[p][c.key]}
            onChange={event=>edit({weights:{...editor.weights,[p]:{...editor.weights[p],[c.key]:event.target.value}}})}/></td>)}</tr>)}</tbody></table></TableScroll>
        <button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={()=>edit({weights:editableWeights(state.data.defaults)})}>Use default values in this draft</button>
        <label>Compare scores using<select disabled={busy} value={editor.comparison} onChange={event=>edit({comparison:event.target.value})}>
          <option value="">The effective week</option>{state.data.weeks.map(w=><option key={w.id} value={w.id}>Week {w.sequence}{w.sequence===state.data.currentWeekSequence?" — current week":""} — preview only</option>)}
        </select></label>
        <label>Reason for scoring change<input required minLength={3} maxLength={500} disabled={busy} value={editor.reason} onChange={event=>edit({reason:event.target.value})}/></label>
        <div className={styles.actions}><button type="submit" className="hl-button hl-button--secondary" disabled={busy||!valid}>Review scoring change</button>
          <button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={()=>{setEditor(null);setPreview(null);review.reset();apply.reset();}}>Cancel scoring editing</button></div>
      </form>}
      {review.error&&<ErrorBlock error={review.error} fallback="The scoring change could not be previewed."/>}
      {preview&&<section className={styles.preview} aria-label="Scoring change preview">
        <h3>Review scoring change</h3><p>Effective from Week {preview.proposed.effectiveWeekSequence}{preview.endsBeforeWeek?`, until the separately scheduled rules for Week ${preview.endsBeforeWeek}`:' for the remainder of this season'}.</p>
        <ul>{preview.changes.map(c=><li key={c.position+c.key}>{c.label} ({c.position}): {points(c.before)} → {points(c.after)} FP</li>)}</ul>
        <h4>Week {preview.comparisonWeekSequence||preview.proposed.effectiveWeekSequence} score comparison</h4>
        <p>This comparison does not change completed results. It uses available statistics and the original locked lineups.</p>
        {!preview.impacts.length&&<p>No matchup comparison is available yet.</p>}
        <ul>{preview.impacts.map(m=><li key={m.matchupId}>{m.homeName} vs {m.awayName}: {m.available?<>
          calculated {points(m.beforeHome)}–{points(m.beforeAway)} → {points(m.afterHome)}–{points(m.afterAway)} FP.
          {m.officialHomeScore!==null&&<> Recorded result: {points(m.officialHomeScore)}–{points(m.officialAwayScore)} FP.</>}
          {m.pendingGameCount>0&&' Games are still pending.'}</>:m.reason}</li>)}</ul>
        <p>Reason: {preview.proposed.reason}. League members will receive a notice.</p>
        <div className={styles.actions}><button type="button" className="hl-button hl-button--primary" disabled={busy} onClick={()=>apply.mutate(preview)}>Confirm scoring values</button>
          <button type="button" className="hl-button hl-button--quiet" disabled={busy} onClick={()=>{setPreview(null);apply.reset();}}>Keep current scoring values</button></div>
        {apply.error&&<ErrorBlock error={apply.error} fallback="The scoring values could not be saved."/>}
      </section>}
      {state.data.rules.length>0&&<details><summary>Scoring change history</summary><ol>{state.data.rules.map(r=><li key={r.id}>From Week {r.effectiveWeekSequence} — {r.actorName}: {r.reason}<ul>{['F','D'].flatMap(position=>SCORING_CATEGORIES.filter(c=>r.beforeWeights && r.beforeWeights[position]?.[c.key]!==r.weights[position][c.key]).map(c=><li key={position+c.key}>{c.label} ({position==='F'?'Forward':'Defence'}): {points(r.beforeWeights[position][c.key])} → {points(r.weights[position][c.key])} FP</li>))}</ul>{!r.beforeWeights&&<span> Previous values unavailable for this record.</span>}</li>)}</ol></details>}
    </>}
    {receipt&&<p role="status">{receipt}</p>}
  </Surface>;
}
