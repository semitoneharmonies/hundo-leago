import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { SessionContext } from '../../src/features/session/sessionContext.js';
import { ConnectedMatchupCard } from '../../src/features/competition/CompetitionPages.jsx';
import { sampleCompletedMatchup } from '../../src/features/competition/sampleCompletedMatchup.js';
import '../../src/styles/theme-a.css';
import '../../src/components/DesktopSidebar.css';

// Synthetic local-only preview; no real league requests or stored data.
const matchup = { ...structuredClone(sampleCompletedMatchup), leagueId: 'sample-league', seasonId: 'sample-season', weekId: 'sample-week', status: 'live' };
matchup.scoring.mode = 'live';
for (const side of ['home', 'away']) {
  matchup.scoring[side].players.forEach((player, i) => { player.gamesPlayedDelta = i < (side === 'home' ? 12 : 15) ? 1 : 0; });
}
const unavailable = new URLSearchParams(location.search).has('unavailable');
const timeZone = 'America/Vancouver';
// Freeze the demonstration day so the preview remains repeatable.
const asOfMs = Date.parse('2026-10-11T19:00:00Z');
function sampleSchedule(side, remaining) {
  const players = matchup.scoring[side].players;
  const games = Array.from({ length: remaining }, (_, i) => {
    const player = players[i < 2 ? i : (i - 2) % players.length];
    const day = i < 2 ? -1 : Math.floor((i - 2) / 6);
    return { playerId: player.playerId, playerName: player.fullName,
      gameId: `sample-${side}-${day}-${player.nhlTeamAbbreviation}`, startsAtMs: asOfMs + day * 86_400_000 + 7 * 3_600_000,
      opponent: ['SEA', 'MTL', 'LAK', 'WPG', 'OTT', 'NYR'][(i < 2 ? i : i - 2) % 6],
      isHome: i % 2 === 0, status: i < 2 ? 'awaiting_scoring' : 'scheduled' };
  });
  // Today's examples: accepted final, final awaiting stats, live, and upcoming.
  games[2] = { ...games[2], startsAtMs: asOfMs - 3 * 3_600_000, status: 'collected' };
  games[3] = { ...games[3], startsAtMs: asOfMs - 2 * 3_600_000, status: 'awaiting_scoring' };
  games[4] = { ...games[4], startsAtMs: asOfMs - 30 * 60_000, status: 'live' };
  games.push({ ...games[2], gameId: `sample-${side}-replacement`, startsAtMs: asOfMs + 86_400_000 + 7 * 3_600_000, status: 'scheduled', opponent: 'NYI' });
  return { timeZone, asOfMs, games };
}
const scheduleDetails = { home: sampleSchedule('home', 38), away: sampleSchedule('away', 34) };
const httpClient = { async request(path, options) {
  if (!path.endsWith('/game-progress')) throw new Error('Synthetic preview cannot make API requests');
  if (unavailable) throw new Error('Synthetic unavailable schedule');
  const data = { code: 'MATCHUP_GAME_PROGRESS_FOUND', leagueId: matchup.leagueId, seasonId: matchup.seasonId, weekId: matchup.weekId, matchupId: matchup.id,
    home: { teamId: matchup.homeTeam.id, status: 'available', tallied: 12, remaining: 38, total: 50, details: scheduleDetails.home },
    away: { teamId: matchup.awayTeam.id, status: 'available', tallied: 15, remaining: 34, total: 49, details: scheduleDetails.away },
  };
  options.validateData(data);
  return { data };
} };
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}><MemoryRouter><SessionContext.Provider value={{ status: 'authenticated', httpClient }}>
    <div className="hl-app-shell"><div className="hl-app-shell__content">
      <header className="hl-app-header" style={{ height: 72, padding: 20 }}>Hundo Leago · Local preview</header>
      <aside className="hl-desktop-sidebar" style={{ padding: 20 }}>Synthetic matchup</aside>
      <main className="hl-page"><h1>Matchups</h1><ConnectedMatchupCard matchup={matchup} initialPlayerView="compact" /></main>
    </div></div>
  </SessionContext.Provider></MemoryRouter></QueryClientProvider>,
);
