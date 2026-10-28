import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '../../src/app/AppProviders.jsx';
import { TeamRosterPage } from '../../src/features/rosters/TeamRosterPage.jsx';
import { createCapOutlookFixture, capOutlookId as id } from '../../src/test/capOutlookFixture.js';
import '../../src/index.css';

// Entirely synthetic, including these illustrative NHL game counts.
const fixture = createCapOutlookFixture();
const params = new URLSearchParams(location.search);
fixture.setCanManage(!params.has('viewer'));
fixture.players.forEach(player => {
  player.injury = { status: 'unknown', source: null, needsReview: false, stale: false };
  player.injuredReserveEligible = false;
});
fixture.players[1].injury.status = 'injured';
fixture.players[1].injuredReserveEligible = true;
fixture.players[5].injury.status = 'healthy';
fixture.failApply = false;
fixture.staleApply = false;
const revision = 'f'.repeat(64);
const proposed = [[1, 'Injured Reserve', 0], [4, 'Active', 4], [5, 'Active', 4]];
const nextWeek = Date.now() + 7 * 86400000;
function workspace() {
  const result = fixture.workspace();
  const healthyIr = result.players.filter(player => player.rosterCategory === 'Injured Reserve' && player.injury.status === 'healthy');
  if (params.has('blocked')) {
    result.cap.limitCents = 1000;
    result.cap.spaceCents = 1000 - result.cap.usageCents;
  }
  result.legality = { legal: !healthyIr.length && result.cap.spaceCents >= 0,
    reasons: [...healthyIr.map(player => ({ code: 'HEALTHY_PLAYER_ON_IR', playerId: player.playerId })), ...(result.cap.spaceCents < 0 ? [{ code: 'SALARY_CAP_EXCEEDED' }] : [])],
    counts: {}, limits: {}, cap: {} };
  return result;
}
function preview() {
  const current = workspace();
  const blocked = params.has('blocked');
  return { code: 'ROSTER_REPAIR_PREVIEW', leagueId: fixture.league.id, teamId: fixture.team.id, seasonId: current.season.id,
    revision: blocked ? null : revision, status: blocked ? 'no_solution' : 'ready', canApply: !blocked,
    strategy: 'scheduled_games', timing: 'future_week',
    week: { id: id(99), label: 'Week 2', startsAtMs: nextWeek, endsAtMs: nextWeek + 7 * 86400000, locksAtMs: nextWeek },
    message: blocked ? 'Roster moves alone can’t fix this team.' : 'This week is already locked. These moves target Week 2; the current scoring lineup stays unchanged.',
    before: { capUsageCents: current.cap.usageCents, capLimitCents: current.cap.limitCents, scheduledGames: 6 },
    after: { capUsageCents: blocked ? current.cap.usageCents : 5113, capLimitCents: current.cap.limitCents, scheduledGames: blocked ? 6 : 14 },
    moves: blocked ? [] : proposed.map(([index, to, scheduledGames]) => ({
      ownershipId: fixture.players[index].ownershipId, playerId: fixture.players[index].playerId, name: fixture.players[index].name,
      from: fixture.players[index].rosterCategory, to, scheduledGames,
    })),
    blockers: blocked ? ['No legal arrangement is possible using roster moves alone. Review a trade or buyout manually; no contract will be changed here.'] : [],
  };
}
window.repairFixture = fixture;
export function Preview() {
  const [, redraw] = useState(0);
  const client = { resourceUrl: value => value, request: async (path, options = {}) => {
    fixture.requests.push({ path, method: options.method || 'GET', body: options.body });
    let data;
    if (path.endsWith('/repair-preview')) data = preview();
    else if (path.endsWith('/repair')) {
      if (fixture.failApply) throw new Error('Synthetic connection failure');
      if (fixture.staleApply || options.body.expectedRevision !== revision) throw Object.assign(new Error('Roster changed'), { code: 'ROSTER_REPAIR_STALE' });
      if (params.has('viewer') || params.has('blocked') || options.body.confirmed !== true) throw new Error('Unauthorized synthetic repair');
      for (const [index, destination] of proposed) {
        fixture.players[index].rosterCategory = destination;
        fixture.players[index].ownershipVersion += 1;
      }
      data = { code: 'ROSTER_REPAIR_APPLIED', leagueId: fixture.league.id, teamId: fixture.team.id, seasonId: id(4), moved: proposed.length,
        legality: { legal: true }, lateLock: { status: 'not_applicable' } };
      redraw(value => value + 1);
    } else if (options.method === 'POST') throw new Error('Unexpected synthetic write');
    else data = workspace();
    options.validateData?.(data);
    return { data };
  } };
  return <main className="hl-page" style={{ maxWidth: 1280, margin: 'auto', padding: 16 }}>
    <p>Local roster repair preview · synthetic roster and game counts</p>
    <TeamRosterPage workspace={workspace()} teams={[fixture.team]} currentUserId={id(3)} httpClient={client} onTeamChange={() => {}} />
  </main>;
}
createRoot(document.getElementById('root')).render(<AppProviders Router={MemoryRouter} enableSession={false}
  config={{ appEnv: 'local', apiOrigin: 'http://127.0.0.1:4199', socketOrigin: 'http://127.0.0.1:4199', buildId: null }}><Preview /></AppProviders>);
