export const FAD_AUCTION_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function candidateDeadlineForWeekOne(weekOneAtMs) {
  return Number.isSafeInteger(weekOneAtMs) && weekOneAtMs >= FAD_AUCTION_WEEK_MS
    ? weekOneAtMs - FAD_AUCTION_WEEK_MS : null;
}

export function weekOneForCandidateDeadline(deadlineAtMs) {
  const value = deadlineAtMs + FAD_AUCTION_WEEK_MS;
  return Number.isSafeInteger(deadlineAtMs) && deadlineAtMs >= 0 && Number.isSafeInteger(value)
    ? value : null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
export const MAX_ROLLOVERS = 1000;

export function suggestedRollovers(deadlineAtMs, weekOneAtMs, requestedCount) {
  if (!Number.isSafeInteger(deadlineAtMs) || !Number.isSafeInteger(weekOneAtMs) || deadlineAtMs >= weekOneAtMs) return [];
  const dailyCount = Math.ceil((weekOneAtMs - deadlineAtMs) / DAY_MS);
  const count = requestedCount ?? dailyCount;
  if (!Number.isSafeInteger(count) || count < 1 || count > MAX_ROLLOVERS) return [];
  const dailyRounds = Math.min(count, dailyCount - 1);
  const times = Array.from({ length: dailyRounds }, (_, index) => deadlineAtMs + (index + 1) * DAY_MS);
  const lastDaily = times.at(-1) ?? deadlineAtMs;
  const remaining = count - dailyRounds;
  for (let index = 1; index <= remaining; index += 1) {
    times.push(lastDaily + Math.floor((weekOneAtMs - lastDaily) * index / remaining / 60000) * 60000);
  }
  return times;
}

export function draftTimingIssue(deadlineAtMs, rolloverTimesAtMs, weekOneAtMs, nowMs) {
  if (!Number.isSafeInteger(deadlineAtMs) || deadlineAtMs <= nowMs) return "Choose a Candidate Card deadline in the future.";
  if (!Number.isSafeInteger(weekOneAtMs) || deadlineAtMs >= weekOneAtMs) return "The Candidate Card deadline must be before Week 1.";
  if (!rolloverTimesAtMs.length || rolloverTimesAtMs.length > MAX_ROLLOVERS) return `Choose between 1 and ${MAX_ROLLOVERS} rapid-auction rounds.`;
  let previous = deadlineAtMs;
  for (const [index, time] of rolloverTimesAtMs.entries()) {
    if (!Number.isSafeInteger(time) || time <= previous) return `Round ${index + 1} must end after ${index === 0 ? "the Candidate Card deadline" : `round ${index}`}.`;
    if (time > weekOneAtMs) return `Round ${index + 1} must end by Week 1.`;
    previous = time;
  }
  return null;
}
