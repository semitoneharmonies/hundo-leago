import { formatTime } from './dailyApi.js';

export function DailyLiveScoring({ live }) {
  if (!live || (live.status === 'fresh' && live.provisionalGameCount === 0)) return null;
  const updatedAt = live.updatedAtMs === null ? null : new Date(live.updatedAtMs);
  return <p className="hds-live-scoring" role="status">
    <strong>{live.status === 'fresh' ? 'Provisional scores' : 'Live updates delayed'}</strong>
    {updatedAt && <> · Updated <time dateTime={updatedAt.toISOString()}>{formatTime(updatedAt)}</time></>}
    <span>{live.provisionalGameCount > 0 ? ' Final stats may adjust these scores.' : ' Showing completed-game scores.'}</span>
  </p>;
}
