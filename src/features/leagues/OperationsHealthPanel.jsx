import {useRef,useState} from 'react';
import {Surface} from '../../components/HundoUi.jsx';
import styles from './OperationsHealthPanel.module.css';

function time(value) {
  return Number.isSafeInteger(value)&&value>=0 ? new Date(value).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}) : 'No successful run recorded';
}

function validateHealth(value) {
  if(!value || !['starting','ready','stopping','stopped'].includes(value.lifecycle) ||
      typeof value.scheduler?.enabled!=='boolean' || typeof value.scheduler.state!=='string' ||
      typeof value.accountEmailDelivery?.enabled!=='boolean' ||
      !['pending','publishing','failed'].every(key=>Number.isSafeInteger(value.outbox?.[key])&&value.outbox[key]>=0)) {
    throw Error('Health response is incomplete.');
  }
  if(value.jobs&&!['pending','running','failed','interrupted'].every(k=>Number.isSafeInteger(value.jobs[k])&&value.jobs[k]>=0))throw Error('Job status is incomplete.');
  if(value.accountEmailDelivery.pending!==undefined&&!['pending','publishing','failed'].every(k=>Number.isSafeInteger(value.accountEmailDelivery[k])&&value.accountEmailDelivery[k]>=0))throw Error('Email status is incomplete.');
  return true;
}

export function OperationsHealthPanel({httpClient}) {
  const [state,setState]=useState({pending:false,data:null,error:false});
  const inFlight=useRef(false);
  async function refresh() {
    if(inFlight.current)return;
    inFlight.current=true;setState({pending:true,data:null,error:false});
    try {
      const response=await httpClient.request('/api/v1/operations/health',{
        method:'GET',authenticated:true,dataKind:'object',validateData:validateHealth,
      });
      validateHealth(response.data);
      setState({pending:false,data:response.data,error:false});
    } catch {setState({pending:false,data:null,error:true});}
    finally {inFlight.current=false;}
  }
  const health=state.data;
  return <Surface as="section" className={styles.panel} aria-labelledby="operations-health-title">
    <p className="hl-eyebrow">Platform administration</p>
    <h2 id="operations-health-title">Site health</h2>
    <p>Check background processing and the latest successful statistics and backup runs.</p>
    <button type="button" className="hl-button hl-button--secondary" disabled={state.pending} onClick={refresh}>
      {state.pending?'Checking site health…':'Check site health'}
    </button>
    {state.error&&<p role="alert">Site health could not be loaded. Check your administrator access and try again.</p>}
    {health&&<div role="status" aria-live="polite">
      <dl className={styles.details}>
        <div><dt>Application</dt><dd>{health.lifecycle==='ready'?'Ready':'Starting or stopping'}</dd></div>
        <div><dt>Background processing</dt><dd>{health.scheduler.enabled?health.scheduler.state.replaceAll('_',' '):'Disabled'}</dd></div>
        <div><dt>Account email delivery</dt><dd>{health.accountEmailDelivery.enabled?'Enabled':'Disabled'}</dd></div>
        {health.accountEmailDelivery.pending!==undefined&&<div><dt>Account email queue</dt><dd>{health.accountEmailDelivery.pending} waiting · {health.accountEmailDelivery.publishing} sending · {health.accountEmailDelivery.failed} failed</dd></div>}
        {health.jobs&&<div><dt>Scheduled operations</dt><dd>{health.jobs.pending} waiting · {health.jobs.running} running · {health.jobs.failed} failed · {health.jobs.interrupted} interrupted</dd></div>}
        <div><dt>Latest successful statistics</dt><dd>{time(health.lastValidStatisticsRefresh?.completedAtMs)}</dd></div>
        <div><dt>Latest verified backup</dt><dd>{time(health.lastVerifiedBackup?.verifiedAtMs)}</dd></div>
        <div><dt>Scheduled backups</dt><dd>{health.backupSchedule?.enabled?'Enabled':'Disabled'}</dd></div>
        {health.backupSchedule?.latestRun&&<div><dt>Latest backup attempt</dt><dd>{health.backupSchedule.latestRun.status.replaceAll('_',' ')}{health.backupSchedule.latestRun.nextAttemptAtMs?' · retry '+time(health.backupSchedule.latestRun.nextAttemptAtMs):''}</dd></div>}
        <div><dt>All delivery queues</dt><dd>{health.outbox.pending} waiting · {health.outbox.publishing} publishing · {health.outbox.failed} failed</dd></div>
      </dl>
      {health.outbox.failed>0&&<p>Some deliveries failed. Refresh the affected league page to read its saved state while checking the delivery status.</p>}
      <p>Use NHL statistics below to request a supported statistics refresh. Candidate Card and auction recovery actions are available inside the affected league.</p>
      <p>Account email and live-update delivery use their existing retry process. If an account link expired, request a fresh link through account recovery. Backup failures require a successful verified backup before any destructive recovery.</p>
    </div>}
  </Surface>;
}
