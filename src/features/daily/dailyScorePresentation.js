import { hasProvisionalStats } from './dailyLiveScoring.js';

export const scoreText = points => Number.isFinite(points) ? points.toFixed(2) : "—";
export const salaryText = spent => Number.isSafeInteger(spent) && spent >= 0 ? "$" + spent : "—";

export function statText(row, key) {
  if (!hasProvisionalStats(row) && !["partial", "collected"].includes(row?.statsStatus)) return "—";
  const value = row.scoringStats?.[key];
  return Number.isFinite(value) ? value : "—";
}
