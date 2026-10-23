import { capOutlookId } from './capOutlookFixture.js';

// Fictional local examples: never a claim about a real league's transactions.
export function createPlayerCardFixture(fixture, player = fixture.players[0]) {
  const appearance = {
    'Connor McDavid': { jerseyNumber: 97, nhlTeam: 'EDM' },
    'Nikita Kucherov': { jerseyNumber: 86, nhlTeam: 'TBL' },
    'Cale Makar': { jerseyNumber: 8, nhlTeam: 'COL' },
    'Nick Suzuki': { jerseyNumber: 14, nhlTeam: 'MTL' },
    'Mark Stone': { jerseyNumber: 61, nhlTeam: 'VGK' },
  }[player.name] || null;
  const contract = player.contract ? { ...player.contract,
    originalTotalValueCents: player.contract.aavCents * player.contract.originalTermYears,
    netAavCents: player.contract.aavCents - player.contract.retainedAavCents } : null;
  const teams = [{ id: capOutlookId(90), name: 'Puck Luck Club' }, { id: fixture.team.id, name: fixture.team.name }, { id: capOutlookId(91), name: 'Ice Wardens' }];
  const statistics = player.name === 'Unsigned Prospect' ? null : { season: '20252026', gamesPlayed: 76, goals: 42, assists: 78, fantasyPointsHundredths: 23475, sourceUpdatedAtMs: Date.parse('2026-09-26T20:00:00Z') };
  const fpg = statistics ? statistics.fantasyPointsHundredths / 100 / statistics.gamesPlayed : null;
  return {
    leagueId: fixture.league.id, playerId: player.playerId, name: player.name, birthDate: '1997-01-13', position: player.normalizedPosition,
    nhlTeam: appearance?.nhlTeam || player.nhlTeamAbbreviation,
    appearance,
    injury: player.injury || { status: 'unknown', needsReview: false }, statistics,
    ownership: { kind: player.ownershipKind, category: player.rosterCategory, team: {
      id: fixture.team.id, name: fixture.team.name,
      primaryColour: fixture.team.primaryColour, secondaryColour: fixture.team.secondaryColour,
      tertiaryColour: fixture.team.tertiaryColour ?? null, patternTemplate: fixture.team.patternTemplate ?? null,
    } }, contract,
    value: { fantasyPointsPerGame: fpg, perCapDollar: fpg !== null && contract ? fpg / (contract.netAavCents / 100) : null },
    history: { signings: contract ? [{ id: capOutlookId(95), atMs: Date.parse('2025-09-15T22:00:00Z'), season: '2025–26', method: 'Candidate Card', status: 'active', team: teams[0], aavCents: contract.aavCents, termYears: contract.originalTermYears, totalValueCents: contract.originalTotalValueCents }] : [],
      trades: contract ? [{ id: capOutlookId(96), atMs: Date.parse('2026-02-20T22:00:00Z'), status: 'completed', teams,
        assets: [
          { id: 'asset-1', type: 'contract', sourceTeamId: teams[0].id, destinationTeamId: teams[1].id, snapshot: { player: { id: player.playerId, name: player.name }, contract: { aavCents: contract.aavCents, originalTermYears: 3 } } },
          { id: 'asset-2', type: 'requested_retention', sourceTeamId: teams[0].id, destinationTeamId: teams[1].id, snapshot: { player: { id: player.playerId, name: player.name }, retainedAavCents: 200 } },
          { id: 'asset-3', type: 'draft_pick', sourceTeamId: teams[1].id, destinationTeamId: teams[2].id, snapshot: { targetSeasonLabel: '2027–28', roundNumber: 1, positionNumber: 7, originalTeam: { name: fixture.team.name } } },
          { id: 'asset-4', type: 'prospect_right', sourceTeamId: teams[2].id, destinationTeamId: teams[0].id, snapshot: { player: { id: fixture.players[6].playerId, name: fixture.players[6].name } } },
          { id: 'asset-5', type: 'future_consideration_instruction', sourceTeamId: teams[1].id, destinationTeamId: teams[0].id, snapshot: { description: 'A 2028 second-round pick if the team reaches the final.' } },
        ] }] : [] },
  };
}
