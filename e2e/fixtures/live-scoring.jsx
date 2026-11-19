/* eslint-disable react-refresh/only-export-components -- Standalone synthetic browser fixture. */
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { SessionContext } from '../../src/features/session/sessionContext.js';
import { MatchupCard } from '../../src/features/competition/CompetitionPages.jsx';
import { matchupQuery } from '../../src/features/competition/competitionQueries.js';
import { SCORING_CATEGORIES, EXPANDED_SCORING_VERSION } from '../../src/shared/scoringCategories.js';
import '../../src/styles/theme-a.css';

// Read-only synthetic fixtures. This page never contacts a league API.
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
let feed = 'live';
const requests = [];
const updatedAtMs = Date.parse('2026-11-19T02:30:00Z');
const live = () => ({ status: feed === 'delayed' ? 'stale' : 'fresh', provisionalGameCount: ['official', 'final'].includes(feed) ? 0 : 1, updatedAtMs });
function player(n, shots) {
  return { playerId: id(n), fullName: n === 10 ? 'Alex Mercer' : 'Jordan Campbell', positionGroup: 'F', nhlTeamAbbreviation: 'BOS', slotNumber: 1,
    gamesPlayedDelta: 1, goalDelta: 0, assistDelta: 0, pointDelta: 0, scoreHundredths: shots * 20, dataStatus: 'available',
    scoringRuleVersion: EXPANDED_SCORING_VERSION,
    scoringStats: Object.fromEntries(SCORING_CATEGORIES.map(({ key }) => [key, key === 'shotsOnGoal' ? shots : 0])),
  };
}
function snapshot() {
  const team = (teamId, scoredPlayer) => ({ teamId, legal: true, players: [scoredPlayer], scoreHundredths: scoredPlayer.scoreHundredths, scoringRuleVersion: EXPANDED_SCORING_VERSION });
  const home = team(id(5), player(10, feed === 'corrected' ? 3 : ['official', 'final'].includes(feed) ? 4 : 5));
  const away = team(id(6), player(11, 1));
  const source = { refreshId: id(9), completedAtMs: updatedAtMs, live: live() };
  return { id: id(4), leagueId: id(1), seasonId: id(2), weekId: id(3), version: 1, status: feed === 'final' ? 'final' : 'live',
    homeTeam: { id: id(5), name: 'North Stars' }, awayTeam: { id: id(6), name: 'Harbour Wolves' },
    liveScore: feed === 'final' ? null : { home, away, source },
    scoring: { mode: feed === 'final' ? 'final' : 'live', source, home, away },
    health: { scoring: { status: 'fresh' } }, result: feed === 'final' ? { id: id(12), version: 1, currentVersion: { homeScoreHundredths: 80, awayScoreHundredths: 20 } } : null,
  };
}
const httpClient = {
  resourceUrl: path => path,
  async request(path, options) {
    requests.push(path);
    const matchup = snapshot();
    const data = path.endsWith('/game-progress') ? { code: 'MATCHUP_GAME_PROGRESS_FOUND', leagueId: id(1), seasonId: id(2), weekId: id(3), matchupId: id(4),
      home: { teamId: id(5), status: 'available', tallied: 1, remaining: 1, total: 2 },
      away: { teamId: id(6), status: 'available', tallied: 1, remaining: 1, total: 2 },
    } : { code: 'MATCHUP_FOUND', matchup };
    options.validateData(data);
    return { data };
  },
};
function Preview() {
  const query = useQuery(matchupQuery(httpClient, id(1), id(2), id(3), id(4)));
  const matchup = query.data;
  const day = matchup && { date: '2026-11-18', timeZone: 'America/Vancouver', asOfMs: updatedAtMs,
    live: matchup.scoring.source.live, home: { ...matchup.scoring.home, status: 'available' }, away: { ...matchup.scoring.away, status: 'available' } };
  return <main className="hl-page">
    <h1>Live scoring · Local verification</h1>
    <p>Synthetic fixtures only. The controls change the next read response.</p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      {['corrected', 'official', 'delayed', 'final'].map(value => <button key={value} type="button" onClick={() => { feed = value; }}>Simulate {value}</button>)}
      <button type="button" onClick={() => query.refetch()}>Read latest scores</button>
    </div>
    <output aria-label="Score requests">{requests.filter(path => !path.endsWith('/game-progress')).length}</output>
    {query.error ? <p role="alert">{query.error.message}</p> : matchup && <MatchupCard matchup={matchup} dayView={day} dayViews={[day]} />}
  </main>;
}
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
createRoot(document.getElementById('root')).render(<QueryClientProvider client={queryClient}><MemoryRouter><SessionContext.Provider value={{ status: 'authenticated', httpClient }}><Preview /></SessionContext.Provider></MemoryRouter></QueryClientProvider>);
