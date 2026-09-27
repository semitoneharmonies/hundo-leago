import { RosterLockSummary } from '../../src/features/rosters/RosterLockNotice.jsx';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '../../src/app/AppProviders.jsx';
import { TeamRosterPage } from '../../src/features/rosters/TeamRosterPage.jsx';
import { PlayerInjuryAdminPanel } from '../../src/features/injuries/PlayerInjuryAdminPanel.jsx';
import { createCapOutlookFixture } from '../../src/test/capOutlookFixture.js';
import { createPlayerCardFixture } from '../../src/test/playerCardFixture.js';
import { SCORING_CATEGORIES, EXPANDED_SCORING_VERSION } from '../../src/shared/scoringCategories.js';
import '../../src/index.css';

const fixture = createCapOutlookFixture();
Object.assign(fixture.team, { secondaryColour: '#ffffff', tertiaryColour: '#f1cb16', patternTemplate: 'chevrons' });
const versions = new Map();
const history = [];
fixture.players.forEach((player, index) => {
  player.injury = { status: [1, 5].includes(index) ? 'injured' : 'unknown', source: 'admin', observedAtMs: Date.now(), stale: false, needsReview: false };
  player.injuredReserveEligible = player.injury.status === 'injured';
  versions.set(player.playerId, 1);
  player.statistics = { gamesPlayed: 72, goals: 30, assists: 45, nhlPoints: 75, fantasyPointsHundredths: 18325, scoringRuleVersion: EXPANDED_SCORING_VERSION, scoringStats: Object.fromEntries(SCORING_CATEGORIES.map((category, i) => [category.key, i + 10])) };
});
fixture.players[1].onTradeBlock = true;
fixture.players[4].onTradeBlock = true;
if (new URLSearchParams(location.search).has('issues')) {
  fixture.players[0].contract.aavCents = 10000;
  fixture.players[5].injury.status = 'healthy';
  fixture.players[5].injuredReserveEligible = false;
}
export function Preview() {
  const [, redraw] = useState(0);
  const workspace = fixture.workspace();
  const reasons = fixture.players.filter(p => p.rosterCategory === 'Injured Reserve' && p.injury.status === 'healthy').map(p => ({ code: 'HEALTHY_PLAYER_ON_IR', playerId: p.playerId }));
  if (workspace.cap.spaceCents < 0) reasons.push({ code: 'SALARY_CAP_EXCEEDED' });
  workspace.legality = { ...workspace.legality, legal: reasons.length === 0, reasons };
  const client = {
    resourceUrl: value => value,
    async request(url, options = {}) {
      if (url.endsWith('/card')) {
        const player = fixture.players.find(p => url.includes(p.playerId));
        if (!player) throw new Error('Player not in this local preview.');
        return { data: createPlayerCardFixture(fixture, player) };
      }
      if (url.startsWith('/api/v1/admin/injuries')) {
        if (options.method === 'POST') {
          const input = options.body, player = fixture.players.find(p => p.playerId === input.playerId);
          if (versions.get(input.playerId) !== input.expectedVersion) throw Object.assign(new Error(), { code: 'INJURY_VERSION_CONFLICT' });
          player.injury = { ...player.injury, status: input.status, observedAtMs: Date.now() };
          player.injuredReserveEligible = input.status === 'injured';
          versions.set(input.playerId, input.expectedVersion + 1);
          history.unshift({ id: String(history.length + 1), name: player.name, reason: input.reason, actor: 'Preview admin', createdAtMs: Date.now() });
          redraw(n => n + 1); return { data: {} };
        }
        const search = new URL(url, location.origin).searchParams.get('search') || '';
        return { data: { players: fixture.players.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => ({ id: p.playerId, name: p.name, status: p.injury.status, source: 'admin', version: versions.get(p.playerId), birthDate: null })), history: [...history], unmatched: [], importsAvailable: false, sync: { enabled: false } } };
      }
      const response = await fixture.request(url, options); redraw(n => n + 1); return response;
    },
  };
  return <main style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
    <p style={{ color: '#a9b9d1', fontSize: 13 }}>Local preview · fictional stats, injuries and transaction history · click a player’s name to open their hockey card</p>
    <TeamRosterPage rosterLockNotice={<RosterLockSummary leagueId={fixture.league.id} seasonId={workspace.season.id} weeks={[{ leagueId: fixture.league.id, seasonId: workspace.season.id, sequence: 1, status: 'scheduled', locksAtMs: Date.parse('2026-09-29T23:00:00Z'), locksAtDisplay: 'Tuesday, September 29, 2026 at 4:00 PM Pacific Daylight Time' }]} />} workspace={workspace} teams={[fixture.team]} currentUserId={fixture.team.currentManager.userId} managerName="Preview manager" onTeamChange={() => {}} httpClient={client} />
    <PlayerInjuryAdminPanel httpClient={client} />
  </main>;
}
createRoot(document.getElementById('root')).render(<AppProviders Router={MemoryRouter} enableSession={false} config={{ appEnv: 'local', apiOrigin: 'http://127.0.0.1:4199', socketOrigin: 'http://127.0.0.1:4199', buildId: null }}><Preview /></AppProviders>);
