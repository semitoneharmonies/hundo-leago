import {Link} from 'react-router-dom';
import {commissionerSectionPath} from './commissionerSections.js';
function operationLabel(kind='') {
 const labels={fad_deadline:'Candidate Card deadline',fad_readiness:'Draft opening checks',fad_fallback_activation:'Draft fallback auction activation',fad_allocation:'Candidate Card allocation',fad_rollover:'Draft auction rollover',fad_completion:'Draft completion','matchup:baseline':'Matchup statistics baseline','matchup:lock':'Matchup roster lock','matchup:statistics_refresh':'Matchup statistics refresh','matchup:finalize':'Matchup finalization','matchup:rollover':'Matchup week transition'};
 return labels[kind] || kind.replace(/^free_agent_draft[:_]?/,'Draft ').replace(/^fad[:_]/,'Draft ').replaceAll('_',' ').replaceAll(':',' · ') || 'Scheduled league operation';
}
export function OperationStatus({job,checkedAtMs,leagueId}) {
 const kind=job.kind||job.jobName||job.type||'',expired=['running','leased'].includes(job.status)&&Number.isSafeInteger(job.leaseExpiresAtMs)&&job.leaseExpiresAtMs<checkedAtMs;
 const fad=kind.startsWith('fad')||kind.startsWith('free_agent');
 return <li><strong>{operationLabel(kind)}</strong><p>{expired?'Interrupted — processing lease expired':job.status==='failed'?'Failed':job.status} · {job.attempts} attempts</p>
 <p>Scheduled: {new Date(job.scheduledForMs).toLocaleString()}{expired?' · Lease ended '+new Date(job.leaseExpiresAtMs).toLocaleString():''}</p>
 {job.nextAttemptAtMs&&<p>Next attempt: {new Date(job.nextAttemptAtMs).toLocaleString()}</p>}
 <p>{expired?'This is not confirmed active work. Review recovery before retrying; refreshing this page does not clear it.':'Review the affected workflow before retrying.'}</p>
 <Link to={commissionerSectionPath(leagueId,fad?'fad':'recovery')}>{fad?'Review draft recovery':'Review recovery options'}</Link></li>;
}
