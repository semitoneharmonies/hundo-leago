import { calendarPeriod, currentAnalyticsDate, shiftAnalyticsDate } from "../features/analytics/analyticsPeriods.js";
import { healthSelection } from "../features/analytics/analyticsHealthQueries.js";
export function analyticsHealthFixture({ group = "failed_jobs", period = { days: 28 }, asOfMs = Date.now(), status = "available", total = 2, items } = {}) {
  const selected = healthSelection(period), today = currentAnalyticsDate(asOfMs);
  const chosen = selected.kind === "days" ? { startDate: shiftAnalyticsDate(today, 1 - selected.days), endDate: today } : calendarPeriod(selected.kind, selected.value, today);
  const examples = {
    failed_jobs: ["backup", "failed", "disk_space"], pending_jobs: ["matchup_finalize", "pending", "scheduled"], running_jobs: ["statistics", "running", "in_progress"],
    daily_scoring_pending: ["daily_scheduled", "pending_scoring", "awaiting_daily_scoring"], matchups_awaiting_data: ["matchup", "awaiting_data", "awaiting_matchup_data"],
    failed_statistics: ["statistics", "rejected", "incomplete_data"], failed_injuries: ["injuries", "failed", "provider_rate_limited"],
  };
  const [kind, rowStatus, reasonCode] = examples[group];
  const recordedAtMs = Math.min(asOfMs - 900000, Date.parse(chosen.endDate + "T08:00:00Z") + 86400000 - 900000);
  const rows = items ?? Array.from({ length: Math.min(50, total) }, (_, index) => ({ kind, status: rowStatus, attempts: group.endsWith("jobs") ? index + 1 : null,
    scheduledAtMs: group === "pending_jobs" ? asOfMs + 3600000 : null, startedAtMs: group === "pending_jobs" ? null : recordedAtMs - 900000,
    completedAtMs: ["failed_jobs", "failed_statistics", "failed_injuries"].includes(group) ? recordedAtMs : null,
    updatedAtMs: group.endsWith("jobs") ? recordedAtMs : null, reasonCode }));
  return { code: "ADMIN_ANALYTICS_HEALTH_FOUND", group, scope: ["failed_statistics", "failed_injuries"].includes(group) ? "period" : "current", asOfMs,
    period: { startDate: chosen.startDate, endDate: chosen.endDate }, status, total: status === "available" ? total : null, limit: 50,
    truncated: status === "available" && total > 50, items: status === "available" ? rows : [] };
}
