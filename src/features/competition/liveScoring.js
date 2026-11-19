import { ResponseContractError } from '../../shared/api/responseContracts.js';

export const LIVE_STAT_POLL_INTERVAL_MS = 120_000;

export function validateLiveScoringStatus(live) {
  if (live === undefined) return;
  const validTime = value => value === null || (Number.isSafeInteger(value) && value >= 0 && value <= 8.64e15);
  if (!live || !['fresh', 'stale', 'unavailable'].includes(live.status) ||
      !Number.isSafeInteger(live.provisionalGameCount) || live.provisionalGameCount < 0 ||
      !validTime(live.updatedAtMs) ||
      (live.lastAttemptAtMs !== undefined && !validTime(live.lastAttemptAtMs))) {
    throw new ResponseContractError('The provisional scoring status is invalid.');
  }
}

export function matchupRefetchInterval(query) {
  return query.state.data?.status === 'final' ? false : LIVE_STAT_POLL_INTERVAL_MS;
}
