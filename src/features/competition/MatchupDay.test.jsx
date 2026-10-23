import { fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SessionContext } from '../session/sessionContext.js';
import { MatchupCard, ConnectedMatchupCard } from './CompetitionPages.jsx';
import { sampleCompletedMatchup } from './sampleCompletedMatchup.js';
import { SCORING_CATEGORIES } from '../../shared/scoringCategories.js';
import { validateMatchupGameProgress } from './matchupGameProgressQueries.js';

const matchup = { ...sampleCompletedMatchup, leagueId: 'league', seasonId: 'season', weekId: 'week', status: 'live' };
function daily() {
  const player = (side, index, score = 0) => ({ ...matchup.scoring[side].players[index], gamesPlayedDelta: score ? 1 : 0,
    goalDelta: 0, assistDelta: 0, pointDelta: 0, scoreHundredths: score,
    scoringStats: Object.fromEntries(SCORING_CATEGORIES.map(({ key }) => [key, key === 'shotsOnGoal' ? score / 20 : 0])),
  });
  return { date: '2026-10-15', timeZone: 'America/Vancouver', asOfMs: Date.parse('2026-10-16T04:00Z'),
    home: { teamId: matchup.homeTeam.id, status: 'available', scoreHundredths: 40, players: [player('home', 0, 40), player('home', 12)] },
    away: { teamId: matchup.awayTeam.id, status: 'available', scoreHundredths: 0, players: [player('away', 2)] },
  };
}
function show(props = {}, httpClient = { request: async () => { throw Error('offline'); } }, connected = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Card = connected ? ConnectedMatchupCard : MatchupCard;
  return render(<QueryClientProvider client={client}><MemoryRouter><SessionContext.Provider value={{ status: 'authenticated', httpClient }}>
    <Card matchup={matchup} {...props} />
  </SessionContext.Provider></MemoryRouter></QueryClientProvider>);
}
const switchDay = () => fireEvent.click(screen.getByRole('switch', { name: 'Daily statistics' }));
function weekDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const day = daily();
    day.date = `2026-10-${12 + index}`;
    day.home.scoreHundredths = index * 20;
    day.home.players[0].scoreHundredths = index * 20;
    day.home.players[0].scoringStats.shotsOnGoal = index;
    return day;
  });
}

describe('Week / Day matchup view', () => {
  it('shows date choices only in Day and changes rows and points without changing Compact or Week', () => {
    const days = weekDays();
    show({ dayView: days[3], dayViews: days });
    expect(screen.queryByRole('group', { name: 'Matchup day' })).not.toBeInTheDocument();
    switchDay();
    expect(screen.getByRole('button', { name: 'Thursday, Oct 15' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Monday, Oct 12' }));
    expect(screen.getAllByText('daily points')).toHaveLength(2);
    expect(screen.getByText(/Monday · Oct 12/)).toBeInTheDocument();
    expect(document.querySelector('.hl-matchup-score__team b')).toHaveTextContent('0.00');
    fireEvent.click(screen.getByRole('button', { name: 'Saturday, Oct 17' }));
    expect(document.querySelector('.hl-matchup-score__team b')).toHaveTextContent('1.00');
    fireEvent.click(screen.getByRole('switch', { name: 'Full statistics' }));
    expect(screen.getByRole('button', { name: 'Saturday, Oct 17' })).toHaveAttribute('aria-pressed', 'true');
    switchDay();
    expect(screen.queryByRole('group', { name: 'Matchup day' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(36);
  });
  it('defaults to the last date of a past matchup and never shows weekly points for missing selected-day data', () => {
    const today = daily(); today.date = '2026-10-20'; today.asOfMs = Date.parse('2026-10-20T19:00Z');
    const days = weekDays(); days[6].home = { ...days[6].home, scoreHundredths: null, status: 'unavailable', players: [] };
    show({ dayView: today, dayViews: days }); switchDay();
    expect(screen.getByRole('button', { name: 'Sunday, Oct 18' })).toHaveAttribute('aria-pressed', 'true');
    expect(document.querySelector('.hl-matchup-score__team b')).toHaveTextContent('—');
    expect(screen.getByText('Selected day’s players and stats are temporarily unavailable for North Stars.')).toBeInTheDocument();
  });
  it('validates dated projections without requiring each selected date to be today', () => {
    const data = { ...payload(daily()), days: weekDays() };
    expect(validateMatchupGameProgress(data, matchup)).toBe(true);
    for (const change of [
      d => { d.days[0].date = '2026-02-30'; },
      d => { d.days[1].date = d.days[0].date; },
      d => { d.days[0].asOfMs += 1; },
      d => { d.days[0].home.teamId = 'other-team'; },
      d => { d.days[0].home.scoreHundredths = 3000; },
    ]) { const invalid = structuredClone(data); change(invalid); expect(() => validateMatchupGameProgress(invalid, matchup)).toThrow(); }
  });
  it('defaults to Week and restores full weekly rows and points after Day, independently of Compact / Full', () => {
    const before = structuredClone(matchup), dayView = daily();
    show({ dayView });
    const players = () => screen.getAllByRole('article');
    expect(players()).toHaveLength(36);
    expect(screen.getByRole('switch', { name: 'Daily statistics' })).toHaveAttribute('aria-checked', 'false');
    switchDay();
    expect(players()).toHaveLength(3);
    expect(screen.queryByText('Jordan Campbell')).not.toBeInTheDocument();
    expect(screen.queryByText(/Empty .* slot/)).not.toBeInTheDocument();
    const alex = screen.getByRole('article', { name: 'North Stars: Alex Mercer' });
    expect(alex.querySelector('.hl-matchup-player-fp')).toHaveTextContent('0.40 FP');
    expect(screen.getAllByText('today’s points')).toHaveLength(2);
    expect(within(alex).getByLabelText('Shots on goal: 2 × 0.20 = 0.40 FP')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch', { name: 'Full statistics' }));
    expect(players()).toHaveLength(3);
    expect(within(alex).queryByLabelText(/Shots on goal:/)).not.toBeInTheDocument();
    expect(screen.getByText('Scoring stat key').closest('details')).not.toHaveAttribute('open');
    switchDay();
    expect(players()).toHaveLength(36);
    expect(screen.getByRole('switch', { name: 'Full statistics' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getAllByText('fantasy points', { exact: true })).toHaveLength(2);
    expect(matchup).toEqual(before);
  });
  it('shows an empty day without empty roster slots or weekly totals', () => {
    const dayView = daily();
    for (const side of ['home', 'away']) Object.assign(dayView[side], { players: [], scoreHundredths: 0 });
    show({ dayView }); switchDay();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(screen.getByText('No players scheduled today for North Stars in this matchup.')).toBeInTheDocument();
  });
  it('distinguishes missing daily data from a zero-point day and preserves the available side', () => {
    const dayView = daily(); dayView.home = { ...dayView.home, status: 'unavailable', players: [], scoreHundredths: null };
    show({ dayView }); switchDay();
    expect(screen.getByText('Today’s players and stats are temporarily unavailable for North Stars.')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(document.querySelector('.hl-matchup-score__team b')).toHaveTextContent('—');
  });
  it('loads daily data through the connected read-only response', async () => {
    let resolve;
    const request = () => new Promise(done => { resolve = done; });
    show({}, { request }, true); switchDay();
    expect(screen.getByText('Loading today’s players and stats…')).toBeInTheDocument();
    resolve({ data: payload(daily()) });
    expect(await screen.findByText(/Today · Oct 15/)).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });
  it('validates daily team identity, roster membership, exact totals, dates and scoring categories', () => {
    const data = payload(daily());
    expect(validateMatchupGameProgress(data, matchup)).toBe(true);
    for (const change of [
      d => { d.day.home.teamId = 'other'; }, d => { d.day.date = '2026-10-16'; },
      d => { d.day.home.scoreHundredths = 12345; }, d => { d.day.home.players[0].playerId = 'other'; },
      d => { d.day.home.players.push(d.day.home.players[0]); }, d => { d.day.home.players[0].scoringStats = {}; },
    ]) {
      const invalid = structuredClone(data); change(invalid);
      expect(() => validateMatchupGameProgress(invalid, matchup)).toThrow();
    }
  });
});
function payload(day) {
  return { code: 'MATCHUP_GAME_PROGRESS_FOUND', leagueId: 'league', seasonId: 'season', weekId: 'week', matchupId: matchup.id,
    ...Object.fromEntries(['home', 'away'].map(side => [side, { teamId: matchup[`${side}Team`].id, status: 'available', tallied: 0, remaining: 0, total: 0 }])), day };
}
