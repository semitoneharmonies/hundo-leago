import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryObserver, focusManager } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LiveScoringStatus } from './LiveScoringStatus.jsx';
import { validateLiveScoringStatus } from './liveScoring.js';
import { matchupQuery } from './competitionQueries.js';

const live = { status: 'fresh', provisionalGameCount: 2, updatedAtMs: Date.parse('2026-11-19T02:30:00Z') };
afterEach(() => { cleanup(); focusManager.setFocused(undefined); vi.useRealTimers(); });

describe('provisional matchup score presentation', () => {
  it('identifies provisional scores and their actual update time', () => {
    render(<LiveScoringStatus live={live} />);
    expect(screen.getByRole('status')).toHaveTextContent('Provisional scores');
    expect(screen.getByRole('status')).toHaveTextContent('Final stats may adjust these scores.');
    expect(screen.getByRole('status').querySelector('time')).toHaveAttribute('dateTime', '2026-11-19T02:30:00.000Z');
  });
  it('keeps a delayed snapshot visibly provisional', () => {
    render(<LiveScoringStatus live={{ ...live, status: 'stale' }} />);
    expect(screen.getByRole('status')).toHaveTextContent('Live updates delayed');
    expect(screen.getByRole('status')).toHaveTextContent('Final stats may adjust these scores.');
  });
  it('explains the completed-game fallback without fabricating an update time', () => {
    render(<LiveScoringStatus live={{ status: 'unavailable', updatedAtMs: null, provisionalGameCount: 0 }} />);
    expect(screen.getByRole('status')).toHaveTextContent('Showing completed-game scores.');
    expect(screen.getByRole('status').querySelector('time')).toBeNull();
  });
  it('removes the provisional notice when official stats replace the live contribution', () => {
    const view = render(<LiveScoringStatus live={live} />);
    view.rerender(<LiveScoringStatus live={{ ...live, provisionalGameCount: 0 }} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    view.rerender(<LiveScoringStatus />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('rejects malformed live metadata instead of presenting it as a valid update', () => {
    expect(() => validateLiveScoringStatus(undefined)).not.toThrow();
    expect(() => validateLiveScoringStatus(live)).not.toThrow();
    for (const change of [{ status: 'unknown' }, { updatedAtMs: 'now' }, { updatedAtMs: -1 }, { updatedAtMs: Number.MAX_SAFE_INTEGER }, { provisionalGameCount: -1 }, { provisionalGameCount: 1.5 }, { lastAttemptAtMs: NaN }]) {
      expect(() => validateLiveScoringStatus({ ...live, ...change })).toThrow();
    }
  });
});

describe('visible matchup polling', () => {
  it('updates every two minutes, pauses while hidden, and stops after finalization', async () => {
    vi.useFakeTimers();
    focusManager.setFocused(true);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    let status = 'live';
    const queryFn = vi.fn(async () => ({ status }));
    const options = { ...matchupQuery({}, 'league', 'season', 'week', 'matchup'), queryFn };
    const observer = new QueryObserver(client, options);
    const unsubscribe = observer.subscribe(() => {});
    try {
      await vi.advanceTimersByTimeAsync(0);
      expect(queryFn).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(119_999);
      expect(queryFn).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(queryFn).toHaveBeenCalledTimes(2);
      focusManager.setFocused(false);
      await vi.advanceTimersByTimeAsync(240_000);
      expect(queryFn).toHaveBeenCalledTimes(2);
      focusManager.setFocused(true);
      status = 'final';
      await observer.refetch();
      const finalCount = queryFn.mock.calls.length;
      await vi.advanceTimersByTimeAsync(240_000);
      expect(queryFn).toHaveBeenCalledTimes(finalCount);
    } finally { unsubscribe(); client.clear(); }
  });
});
