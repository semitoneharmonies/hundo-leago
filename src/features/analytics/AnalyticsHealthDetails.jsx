import { useEffect, useId } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyBlock, LoadingBlock } from "../../components/HundoUi.jsx";
import { useSession } from "../session/sessionContext.js";
import { HEALTH_GROUP_LABELS, HEALTH_KIND_LABELS, HEALTH_STATUS_LABELS, analyticsHealthQuery } from "./analyticsHealthQueries.js";
import styles from "./AnalyticsHealthDetails.module.css";

export { HEALTH_GROUP_LABELS } from "./analyticsHealthQueries.js";
const dateFormat = new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
function timestamp(value) { return value === null ? "Not recorded" : dateFormat.format(new Date(value - 8 * 60 * 60 * 1000)) + " UTC−8"; }
const reasons = Object.freeze({
  provider_unavailable: ["Provider unavailable", "Check whether the statistics or injury provider is available. Compare the latest successful update with this failure; a later success may mean the issue has recovered."],
  provider_timeout: ["Provider timed out", "Check provider availability and the next scheduled update. If repeated attempts time out, have the operator investigate connectivity before changing update settings."],
  provider_rate_limited: ["Provider rate limit reached", "Allow the provider cooldown to finish. Avoid repeated manual refreshes; if this persists, have the operator check the provider quota and update schedule."],
  provider_credentials: ["Provider access problem", "Have the operator verify the configured provider credential and access permissions. Keep credentials out of this page and shared messages."],
  incomplete_data: ["Required data incomplete", "Wait for complete official game or injury data, then check the next scheduled update. If the same record remains blocked after a successful update, ask the operator to inspect its coverage."],
  invalid_data: ["Source data rejected", "The update did not pass validation. Check for a later successful update. If rejections continue, have the operator inspect the provider format before accepting or changing data."],
  storage_failure: ["Update could not be saved", "Have the operator check database availability, disk space and storage permissions. Confirm a later successful update before treating the data as current."],
  disk_space: ["Insufficient backup space", "Have the operator check free disk space and the backup retention policy. Preserve a verified recoverable backup before removing any files."],
  lease_expired: ["Processing lease expired", "The recorded processing window has expired. Check whether the background worker is healthy and whether a later attempt completed. This status alone does not prove that no work was saved."],
  state_conflict: ["State changed during update", "Another operation changed the expected state. Check for a later successful update; if conflicts repeat, have the operator inspect overlapping workers."],
  stale_data: ["Source data is too old", "Compare the latest successful update with the expected game data. If official data is available but still stale here, have the operator inspect the scheduled refresh."],
  identity_conflict: ["Player mapping needs review", "The update could not safely match a player. Ask the operator to review provider-to-player mappings before changing injuries or accepting the record."],
  scheduled: ["Scheduled for later", "This job is waiting for its scheduled time. No intervention is indicated by a future schedule alone."],
  queued: ["Ready for a worker", "This job has reached its scheduled time. Refresh later; if it remains pending while other jobs progress, ask the operator to check the worker and prerequisites."],
  in_progress: ["Processing in progress", "A worker has claimed this job. Refresh later to check its state; do not start a duplicate operation while it may still be processing."],
  awaiting_matchup_data: ["Matchup data pending", "The matchup week is waiting for required scoring evidence. Check statistics freshness. If the required official game data is complete and this persists, ask the operator to inspect coverage and scheduled matchup processing."],
  awaiting_daily_scoring: ["Daily result pending", "The draft has ended, but a final result is not recorded. This can be normal while NHL games are underway or final data is pending. If all games are final and the room remains pending, ask the operator to check the Daily feed and scoring worker."],
});
function guidance(row) {
  if (reasons[row.reasonCode]) return reasons[row.reasonCode];
  const area = row.kind === "backup" ? "backup worker, storage and latest successful backup" : row.kind === "statistics" || row.kind === "injuries" ? "latest successful update and the scheduled refresh worker" : "background worker and the affected feature";
  return ["Reason not recorded", `A specific cause is not available in these safe diagnostics. Check the ${area}. If the issue persists, have the operator inspect protected diagnostics using the type and time shown here.`];
}
function HealthContent({ session, group, period }) {
  const client = useQueryClient();
  const options = analyticsHealthQuery(session.httpClient, session.user.id, group, period);
  const query = useQuery(options);
  const denied = [401, 403].includes(query.error?.status) || query.error?.code === "PLATFORM_ADMINISTRATOR_REQUIRED";
  const key = options.queryKey;
  useEffect(() => {
    if (denied) client.removeQueries({ queryKey: key, exact: true });
  }, [client, denied, key]);
  if (denied) return <EmptyBlock title="Administrator access required">Health details are no longer available for this session.</EmptyBlock>;
  if (query.isPending) return <LoadingBlock>Loading health details…</LoadingBlock>;
  if (query.isError) return <div role="alert"><p>Health details could not be loaded. The activity totals remain available.</p><button type="button" onClick={() => query.refetch()} disabled={query.isFetching}>Retry health details</button></div>;
  const data = query.data;
  return <>
    <div className={styles.meta}><span>{data.scope === "current" ? "Current backlog, independent of the selected dates" : `Failures recorded ${data.period.startDate} through ${data.period.endDate}`}</span><span>Checked {timestamp(data.asOfMs)}</span></div>
    <p className={styles.note}>These details may be newer than the summary above. Refreshing reads stored records; it does not retry jobs or change site data.</p>
    {data.status !== "available" ? <EmptyBlock title={data.status === "not_measured" ? "Daily records are not available yet" : "This source is unavailable"}>No healthy zero is assumed. Try again later; if this continues, ask the operator to check the source database and worker.</EmptyBlock> : data.total === 0 ? <EmptyBlock title="No matching records">No records currently match this health group and its scope.</EmptyBlock> : <>
      <p className={styles.count}>{data.truncated ? `Showing the first 50 of ${data.total.toLocaleString("en-CA")} records` : `${data.total.toLocaleString("en-CA")} ${data.total === 1 ? "record" : "records"}`}{group === "daily_scoring_pending" ? " · Earliest scheduled first" : " · Most recently updated or completed first"}</p>
      <ol className={styles.records}>{data.items.map((row, index) => {
        const [reason, advice] = guidance(row);
        return <li key={index}><div className={styles.rowHeading}><h4>{HEALTH_KIND_LABELS[row.kind]}</h4><span>{HEALTH_STATUS_LABELS[row.status]}</span></div>
          <dl>{row.attempts !== null && <div><dt>Attempts</dt><dd>{row.attempts}</dd></div>}
            {[["Scheduled", row.scheduledAtMs], ["Started", row.startedAtMs], ["Completed", row.completedAtMs], ["Last updated", row.updatedAtMs]].filter(([, value]) => value !== null).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{timestamp(value)}</dd></div>)}
          </dl><strong className={styles.reason}>{reason}</strong><p className={styles.advice}>{advice}</p></li>;
      })}</ol>
    </>}
    <button className={styles.refresh} type="button" onClick={() => query.refetch()} disabled={query.isFetching}>{query.isFetching ? "Refreshing details…" : "Refresh health details"}</button>
  </>;
}
export function AnalyticsHealthDetails({ group, period, onClose }) {
  const session = useSession();
  const titleId = useId();
  if (session.status !== "authenticated" || !session.user?.id) return null;
  return <section className={styles.panel} aria-labelledby={titleId}>
    <div className={styles.heading}><h3 id={titleId}>{HEALTH_GROUP_LABELS[group]}</h3>{onClose && <button type="button" onClick={onClose} aria-label="Close health details">Close</button>}</div>
    <HealthContent key={`${session.user.id}:${group}:${period?.kind || "days"}:${period?.value || period?.days || 28}`} session={session} group={group} period={period}/>
  </section>;
}
