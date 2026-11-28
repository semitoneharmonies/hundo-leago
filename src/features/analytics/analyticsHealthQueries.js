import { queryOptions } from "@tanstack/react-query";
import { ResponseContractError } from "../../shared/api/responseContracts.js";
import { calendarPeriod, currentAnalyticsDate, normalizeAnalyticsSelection, shiftAnalyticsDate } from "./analyticsPeriods.js";

export const HEALTH_GROUP_LABELS = Object.freeze({ failed_jobs: "Failed jobs", pending_jobs: "Pending jobs", running_jobs: "Running jobs", daily_scoring_pending: "Daily scoring pending", matchups_awaiting_data: "Matchups awaiting data", failed_statistics: "Failed statistics updates", failed_injuries: "Failed injury updates" });
export const HEALTH_KIND_LABELS = Object.freeze({ statistics: "Statistics refresh", injuries: "Injury refresh", matchup_baseline: "Matchup baseline", matchup_lock: "Matchup lock", matchup_finalize: "Matchup finalization", matchup_rollover: "Matchup rollover", season_rollover: "Season rollover", auction: "Auction resolution", backup: "Scheduled backup", draft: "Free-agent draft", other_job: "Other background job", matchup: "Matchup week", daily_practice: "Daily practice room", daily_scheduled: "Daily scheduled room" });
export const HEALTH_STATUS_LABELS = Object.freeze({ failed: "Failed", rejected: "Rejected", abandoned: "Interrupted", pending: "Pending", leased: "Claimed", running: "Running", awaiting_data: "Awaiting data", pending_scoring: "Scoring pending" });
export const HEALTH_REASONS = Object.freeze(["unknown", "provider_unavailable", "provider_timeout", "provider_rate_limited", "provider_credentials", "incomplete_data", "invalid_data", "storage_failure", "disk_space", "lease_expired", "state_conflict", "stale_data", "identity_conflict", "scheduled", "queued", "in_progress", "awaiting_matchup_data", "awaiting_daily_scoring"]);
export function healthSelection(period) {
  return normalizeAnalyticsSelection(period?.kind === "week" || period?.kind === "month" ? { kind: period.kind, value: period.value } : period?.days ?? 28);
}
function check(value) { if (!value) throw new ResponseContractError("Invalid analytics health details."); }
function record(value, keys) {
  check(value !== null && typeof value === "object" && !Array.isArray(value));
  check(Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key)));
}
function natural(value) { return Number.isSafeInteger(value) && value >= 0; }
function time(value) { return value === null || (natural(value) && value <= 8_640_000_000_000_000); }
export function validateAnalyticsHealth(data, group, selected = normalizeAnalyticsSelection(28)) {
  record(data, ["code", "group", "scope", "asOfMs", "period", "status", "total", "limit", "truncated", "items"]);
  check(data.code === "ADMIN_ANALYTICS_HEALTH_FOUND" && Object.hasOwn(HEALTH_GROUP_LABELS, group) && data.group === group);
  check(data.scope === (["failed_statistics", "failed_injuries"].includes(group) ? "period" : "current"));
  check(data.asOfMs !== null && time(data.asOfMs));
  record(data.period, ["startDate", "endDate"]);
  const today = currentAnalyticsDate(data.asOfMs);
  const expected = selected.kind === "days" ? { startDate: shiftAnalyticsDate(today, 1 - selected.days), endDate: today } : calendarPeriod(selected.kind, selected.value, today);
  check(data.period.startDate === expected.startDate && data.period.endDate === expected.endDate);
  check(["available", "unavailable", "not_measured"].includes(data.status) && data.limit === 50 && typeof data.truncated === "boolean" && Array.isArray(data.items));
  if (data.status !== "available") {
    check(data.total === null && !data.truncated && data.items.length === 0 && (data.status !== "not_measured" || group === "daily_scoring_pending"));
    return true;
  }
  check(natural(data.total) && data.items.length === Math.min(50, data.total) && data.truncated === (data.total > 50));
  const statusByGroup = { failed_jobs: ["failed"], pending_jobs: ["pending"], running_jobs: ["leased", "running"], failed_statistics: ["failed", "rejected"], failed_injuries: ["failed", "abandoned"], daily_scoring_pending: ["pending_scoring"], matchups_awaiting_data: ["awaiting_data"] };
  for (const row of data.items) {
    record(row, ["kind", "status", "attempts", "scheduledAtMs", "startedAtMs", "completedAtMs", "updatedAtMs", "reasonCode"]);
    check(Object.hasOwn(HEALTH_KIND_LABELS, row.kind) && statusByGroup[group].includes(row.status) && HEALTH_REASONS.includes(row.reasonCode));
    check(row.attempts === null || natural(row.attempts));
    for (const key of ["scheduledAtMs", "startedAtMs", "completedAtMs", "updatedAtMs"]) check(time(row[key]));
    if (data.scope === "period") check(row.completedAtMs !== null && row.completedAtMs >= Date.parse(data.period.startDate + "T08:00:00Z") && row.completedAtMs < Date.parse(data.period.endDate + "T08:00:00Z") + 86400000);
    if (group === "failed_statistics") check(row.kind === "statistics");
    if (group === "failed_injuries") check(row.kind === "injuries");
    if (group === "matchups_awaiting_data") check(row.kind === "matchup");
    if (group === "daily_scoring_pending") check(["daily_practice", "daily_scheduled"].includes(row.kind));
  }
  return true;
}
export function analyticsHealthKey(userId, group, selection) {
  const chosen = normalizeAnalyticsSelection(selection);
  return ["admin", "analytics-health", userId, group, chosen.kind, chosen.kind === "days" ? chosen.days : chosen.value];
}
export function analyticsHealthQuery(httpClient, userId, group, period) {
  if (typeof userId !== "string" || !userId || !Object.hasOwn(HEALTH_GROUP_LABELS, group)) throw new TypeError("Choose a valid health detail group.");
  const selected = healthSelection(period);
  const selector = selected.kind === "days" ? `days=${selected.days}` : `${selected.kind}=${encodeURIComponent(selected.value)}`;
  return queryOptions({
    queryKey: analyticsHealthKey(userId, group, selected),
    queryFn: async ({ signal }) => {
      const response = await httpClient.request(`/api/v1/admin/analytics/health?group=${group}&${selector}`, {
        authenticated: true, dataKind: "object", signal, validateData: data => validateAnalyticsHealth(data, group, selected),
      });
      return response.data;
    },
    meta: { private: true, suppressGlobalError: true }, gcTime: 0, staleTime: 0, retry: false,
    refetchOnWindowFocus: false, refetchOnReconnect: false, refetchInterval: false, refetchIntervalInBackground: false,
  });
}
