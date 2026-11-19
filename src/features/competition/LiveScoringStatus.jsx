export function LiveScoringStatus({ live }) {
  if (!live || (live.status === 'fresh' && live.provisionalGameCount === 0)) return null;
  const updatedAt = live.updatedAtMs === null ? null : new Date(live.updatedAtMs);
  const delayed = live.status !== 'fresh';
  return <p className="hl-live-scoring-status" role="status">
    <strong>{delayed ? 'Live updates delayed' : 'Provisional scores'}</strong>
    {updatedAt && <> · <span>Updated <time dateTime={updatedAt.toISOString()}>{updatedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time></span></>}
    <span>{live.provisionalGameCount > 0 ? ' Final stats may adjust these scores.' : ' Showing completed-game scores.'}</span>
  </p>;
}
