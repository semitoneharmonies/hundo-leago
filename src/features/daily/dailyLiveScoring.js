import { ResponseContractError } from '../../shared/api/responseContracts.js';

export function validateDailyLiveScoring(live) {
  if (live === undefined) return;
  const validTime = value => value === null || (Number.isSafeInteger(value) && value >= 0 && value <= 8.64e15);
  if (!live || !['fresh', 'stale', 'unavailable'].includes(live.status) ||
      !Number.isSafeInteger(live.provisionalGameCount) || live.provisionalGameCount < 0 ||
      !validTime(live.updatedAtMs) ||
      (live.lastAttemptAtMs !== undefined && !validTime(live.lastAttemptAtMs))) {
    throw new ResponseContractError('The live scoring status is unavailable.');
  }
}

export const hasProvisionalStats = row => row?.live?.provisional === true;
