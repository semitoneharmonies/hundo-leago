import { createCounterFixture, counterIds } from './counterProposalFixture.js';
import { createThreeTeamFixture } from './threeTeamTradeFixture.js';

export function privateTrade(proposal) {
  const result = { detailsVisible: false, assets: [], history: [] };
  for (const field of ['id', 'leagueId', 'seasonId', 'proposingTeam', 'receivingTeam', 'status', 'storageStatus', 'createdAtMs', 'expiresAtMs', 'effectiveDeadlineAtMs', 'version']) result[field] = proposal[field];
  if (proposal.participants) result.participants = proposal.participants.map(({ teamId, name }) => ({ teamId, name }));
  return result;
}

export function createTradePrivacyFixture({ three = true, role = 'observer', leagueId = counterIds.league, status = 'proposed', hidden = true } = {}) {
  const fixture = (three ? createThreeTeamFixture : createCounterFixture)({ role, leagueId, status });
  const baseFetch = fixture.fetch;
  fixture.hidden = hidden;
  fixture.fetch = async (url, options = {}) => {
    const pathname = new URL(url).pathname;
    if (pathname.endsWith('/activity')) {
      fixture.requests.push({ pathname, method: 'GET' });
      return new Response(JSON.stringify({ data: { code: 'LEAGUE_ACTIVITY_FOUND', page: { limit: 25, nextCursor: null }, activity: [{
        id: counterIds.counter, leagueId, seasonId: counterIds.season, type: 'trade_proposal_created', actor: { userId: null, authority: null, displayName: null },
        teamId: null, playerId: null, team: null, player: null, related: { type: 'trade', id: counterIds.trade }, reason: null, occurredAtMs: 1,
        summary: `Trade involving ${fixture.teams.map(team => team.name).join(' ↔ ')}. Details are private until execution.`,
        metadata: { proposalId: counterIds.trade, detailsVisible: false, teams: fixture.teams.map(({ id, name }) => ({ id, name })) },
      }] }, meta: { requestId: 'fog-fixture' } }), { headers: { 'content-type': 'application/json' } });
    }
    const response = await baseFetch(url, options);
    if ((options.method || 'GET') !== 'GET' || !/\/trades(?:\/[^/]+)?$/.test(pathname)) return response;
    const body = await response.json();
    const project = proposal => fixture.hidden ? privateTrade(proposal) : { ...proposal, detailsVisible: true };
    if (body.data.proposal) body.data.proposal = project(body.data.proposal);
    if (body.data.proposals) body.data.proposals = body.data.proposals.map(project);
    return new Response(JSON.stringify(body), { status: response.status, headers: response.headers });
  };
  return fixture;
}
