import {ResponseContractError} from '../../shared/api/responseContracts.js';
import {validateScoringWeights} from '../../shared/scoringCategories.js';
const id=value=>typeof value==='string'&&/^[a-f0-9-]{36}$/.test(value);
const integer=value=>Number.isSafeInteger(value)&&value>=0;
export function validateLeagueScoring(data,leagueId,kind='state') {
  let valid=data?.leagueId===leagueId;
  if(kind==='accepted') valid&&=data.accepted===true&&id(data.id)&&typeof data.replayed==='boolean';
  else {
    valid&&=id(data.seasonId)&&integer(data.currentWeekSequence)&&integer(data.serverNowMs)&&
      typeof data.current?.version==='string'&&Array.isArray(data.weeks)&&Array.isArray(data.rules);
    validateScoringWeights(data.current?.weights);validateScoringWeights(data.defaults);
    valid&&=data.weeks.every(w=>id(w.id)&&integer(w.sequence)&&w.sequence>0&&typeof w.status==='string'&&integer(w.startsAtMs)&&integer(w.endsAtMs)&&typeof w.editable==='boolean');
    valid&&=data.rules.every(r=>id(r.id)&&integer(r.revision)&&integer(r.effectiveWeekSequence)&&integer(r.createdAtMs)&&validateScoringWeights(r.weights)&&(!r.beforeWeights||validateScoringWeights(r.beforeWeights)));
  }
  if(kind==='preview') {
    valid&&=data.proposed&&integer(data.proposed.effectiveWeekSequence)&&typeof data.proposed.reason==='string'&&validateScoringWeights(data.proposed.weights)&&
      (data.endsBeforeWeek===null||integer(data.endsBeforeWeek))&&(data.comparisonWeekSequence===null||integer(data.comparisonWeekSequence))&&
      /^[a-f0-9]{64}$/.test(data.previewHash||'')&&Array.isArray(data.changes)&&Array.isArray(data.impacts);
    valid&&=data.changes.every(c=>typeof c.label==='string'&&['F','D'].includes(c.position)&&Number.isSafeInteger(c.before)&&Number.isSafeInteger(c.after));
    valid&&=data.impacts.every(m=>id(m.matchupId)&&typeof m.homeName==='string'&&typeof m.awayName==='string'&&typeof m.available==='boolean'&&
      (m.available?['beforeHome','beforeAway','afterHome','afterAway'].every(k=>Number.isSafeInteger(m[k])):typeof m.reason==='string'));
  }
  if(!valid)throw new ResponseContractError('The league scoring response could not be verified.');
  return true;
}
