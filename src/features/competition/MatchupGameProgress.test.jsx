import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { MatchupGameProgress } from './MatchupGameProgress.jsx';
import { matchupGameProgressQuery, validateMatchupGameProgress } from './matchupGameProgressQueries.js';
import { ScoringStatGuide } from '../../components/ScoringStatGuide.jsx';

const matchup = { leagueId: 'league', seasonId: 'season', weekId: 'week', id: 'matchup', status: 'live', homeTeam: { id: 'home', name: 'North Stars' }, awayTeam: { id: 'away', name: 'Harbour Wolves' } };
const counts = () => ({ code: 'MATCHUP_GAME_PROGRESS_FOUND', leagueId: 'league', seasonId: 'season', weekId: 'week', matchupId: 'matchup',
  home: { teamId: 'home', status: 'available', tallied: 12, remaining: 38, total: 50 },
  away: { teamId: 'away', status: 'available', tallied: 15, remaining: 34, total: 49 },
});
function show(request) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><ScoringStatGuide summaryAside={<MatchupGameProgress matchup={matchup} httpClient={{ request }} />} /></QueryClientProvider>);
}

describe('compact matchup player-game totals', () => {
  it('shows both totals inside the stat-key summary and leaves the key usable', async () => {
    const request = vi.fn(async () => ({ data: counts() }));
    show(request);
    await screen.findByLabelText('Games played: 12');
    expect(within(screen.getByLabelText('North Stars games')).getByLabelText('Games remaining: 38')).toHaveTextContent('GR 38');
    expect(within(screen.getByLabelText('Harbour Wolves games')).getByLabelText('Games played: 15')).toHaveTextContent('GP 15');
    expect(within(screen.getByLabelText('Harbour Wolves games')).getByLabelText('Games remaining: 34')).toHaveTextContent('GR 34');
    expect(screen.getByLabelText('Matchup player-game totals')).not.toHaveTextContent(/North Stars|Harbour Wolves|tallied|remaining/);
    const summary = screen.getByText('Scoring stat key').closest('summary');
    expect(within(summary).getByLabelText('Matchup player-game totals')).toBeInTheDocument();
    expect(summary.parentElement).not.toHaveAttribute('open');
    expect(request.mock.calls[0][0]).toBe('/api/v1/leagues/league/seasons/season/matchup-weeks/week/matchups/matchup/game-progress');
    expect(request.mock.calls[0][1].authenticated).toBe(true);
  });
  it('does not present loading or failed queries as zero games', async () => {
    let reject;
    show(() => new Promise((resolve, fail) => { reject = fail; }));
    expect(screen.getAllByLabelText('Games played: loading')).toHaveLength(2);
    reject(new Error('offline'));
    expect(await screen.findAllByLabelText('Games played: unavailable')).toHaveLength(2);
    expect(screen.getAllByLabelText('Games remaining: unavailable')).toHaveLength(2);
    expect(screen.queryByLabelText('Games remaining: 0')).not.toBeInTheDocument();
  });
  it('keeps accepted counts visible when future schedule is unavailable', async () => {
    const data = counts();
    data.home = { ...data.home, status: 'schedule_unavailable', remaining: null, total: null };
    data.away = { ...data.away, status: 'not_scoring', tallied: 0, remaining: 0, total: 0 };
    show(async () => ({ data }));
    await screen.findByLabelText('Games played: 12');
    expect(screen.getByLabelText('Games remaining: unavailable')).toHaveTextContent('GR —');
    expect(screen.getByLabelText('Games played: 0')).toHaveAttribute('title', 'Games played. Not scoring');
  });
  it('isolates leagues, weeks, matchups and updated scoring refreshes in cache keys', () => {
    const key = matchupGameProgressQuery({}, matchup).queryKey;
    for (const change of [{ leagueId: 'other' }, { weekId: 'other' }, { id: 'other' }, { status: 'final' }, { liveScore: { source: { refreshId: 'new' } } }]) {
      expect(matchupGameProgressQuery({}, { ...matchup, ...change }).queryKey).not.toEqual(key);
    }
    expect(matchupGameProgressQuery({}, { ...matchup, status: 'final' }).refetchInterval).toBe(60_000);
  });
  it('rejects cross-scope responses and contradictory or invalid counts', () => {
    expect(validateMatchupGameProgress(counts(), matchup)).toBe(true);
    for (const key of ['leagueId', 'seasonId', 'weekId', 'matchupId']) expect(() => validateMatchupGameProgress({ ...counts(), [key]: 'other' }, matchup)).toThrow();
    for (const change of [{ teamId: 'other' }, { tallied: -1 }, { remaining: 0.5 }, { total: 999 }, { status: 'complete' }, { status: 'schedule_unavailable' }, { status: 'available', tallied: null }]) {
      const data = counts(); Object.assign(data.home, change);
      expect(() => validateMatchupGameProgress(data, matchup)).toThrow();
    }
  });
  it('rejects invalid detail time zones, duplicate games and lists that disagree with GR', () => {
    const data = counts();
    data.home.remaining = 1; data.home.total = 13;
    data.home.details = { timeZone: 'America/Vancouver', asOfMs: 1000, games: [
      { playerId: 'player', playerName: 'Player', gameId: 'game', startsAtMs: 2000, opponent: 'SEA', isHome: true, status: 'scheduled' },
    ] };
    expect(validateMatchupGameProgress(data, matchup)).toBe(true);
    for (const change of [{ timeZone: 'invalid' }, { games: [] }, { games: [...data.home.details.games, ...data.home.details.games] }]) {
      const invalid = structuredClone(data); Object.assign(invalid.home.details, change);
      expect(() => validateMatchupGameProgress(invalid, matchup)).toThrow();
    }
  });
});
