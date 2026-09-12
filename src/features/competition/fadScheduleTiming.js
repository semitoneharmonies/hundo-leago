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
