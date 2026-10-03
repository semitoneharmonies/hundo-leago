import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {SCORING_CATEGORIES,scoringWeight} from '../shared/scoringCategories.js';
import {validateLeagueScoring} from '../features/commissioner/leagueScoringContracts.js';
import {ErrorBlock,LoadingBlock} from './HundoUi.jsx';
export function ScoringValuesTable({weights}) {
  return <table className="hl-data-table hl-scoring-rules-table"><caption>Fantasy points per recorded stat</caption>
    <thead><tr><th scope="col">Stat</th><th scope="col">Forward</th><th scope="col">Defence</th></tr></thead>
    <tbody>{SCORING_CATEGORIES.map(c=><tr key={c.key}><th scope="row">{c.label}</th><td>{(scoringWeight(c,'F',weights)/100).toFixed(2)}</td><td>{(scoringWeight(c,'D',weights)/100).toFixed(2)}</td></tr>)}</tbody>
  </table>;
}
export function LeagueScoringReference({leagueId,httpClient}) {
  const [week,setWeek]=useState('');
  const rules=useQuery({queryKey:['league',leagueId,'scoring','rules'],queryFn:async({signal})=>{
    const result=await httpClient.request('/api/v1/leagues/'+encodeURIComponent(leagueId)+'/scoring/rules',{
      authenticated:true,signal,dataKind:'object',validateData:data=>validateLeagueScoring(data,leagueId)});
    validateLeagueScoring(result.data,leagueId);return result.data;
  },retry:false,meta:{private:true,leagueId}});
  if(rules.isPending)return <LoadingBlock>Loading league scoring…</LoadingBlock>;
  if(rules.error)return <ErrorBlock error={rules.error} fallback="League scoring could not be loaded."/>;
  const sequence=week?Number(week):rules.data.currentWeekSequence;
  const selected=rules.data.rules.filter(r=>r.effectiveWeekSequence<=sequence).sort((a,b)=>b.effectiveWeekSequence-a.effectiveWeekSequence||b.revision-a.revision)[0];
  return <div><label>Scoring for matchup week<select value={week} onChange={e=>setWeek(e.target.value)}>
    <option value="">Current rules — Week {rules.data.currentWeekSequence}</option>
    {rules.data.weeks.map(w=><option key={w.id} value={w.sequence}>Week {w.sequence}</option>)}
  </select></label><ScoringValuesTable weights={selected?.weights||rules.data.defaults}/>
    <p>Season player totals and rankings use current league values. Matchups use the values effective for their week.</p></div>;
}
