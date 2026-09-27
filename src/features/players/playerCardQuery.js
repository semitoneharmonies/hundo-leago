import { ResponseContractError } from '../../shared/api/responseContracts.js';

export function validatePlayerCard(card, leagueId, playerId) {
  const validNumber = n => typeof n === 'number' && Number.isFinite(n);
  const timestamp = n => Number.isSafeInteger(n) && n >= 0 && n <= 8_640_000_000_000_000;
  if (!card || card.leagueId !== leagueId || card.playerId !== playerId || typeof card.name !== 'string' ||
    !card.value || !Array.isArray(card.history?.signings) || !Array.isArray(card.history?.trades) ||
    [card.value.fantasyPointsPerGame, card.value.perCapDollar].some(n => n !== null && !validNumber(n))) {
    throw new ResponseContractError('The player card is invalid or belongs to another league.');
  }
  if (card.statistics !== null && (!card.statistics || !/^\d{8}$/.test(card.statistics.season) ||
    !timestamp(card.statistics.sourceUpdatedAtMs) ||
    !['gamesPlayed', 'goals', 'assists'].every(key => Number.isSafeInteger(card.statistics[key]) && card.statistics[key] >= 0) ||
    !Number.isSafeInteger(card.statistics.fantasyPointsHundredths))) {
    throw new ResponseContractError('The player card statistics are invalid.');
  }
  if (card.appearance != null && (!Number.isInteger(card.appearance.jerseyNumber) ||
    card.appearance.jerseyNumber < 1 || card.appearance.jerseyNumber > 99 ||
    !/^[A-Z]{2,3}$/.test(card.appearance.nhlTeam) || card.appearance.nhlTeam !== card.nhlTeam)) {
    throw new ResponseContractError('The player jersey information is invalid.');
  }
  if (card.contract !== null && (!card.contract || !['aavCents', 'netAavCents', 'retainedAavCents', 'remainingYears'].every(key =>
    Number.isSafeInteger(card.contract[key]) && card.contract[key] >= 0) ||
    card.contract.netAavCents + card.contract.retainedAavCents !== card.contract.aavCents)) {
    throw new ResponseContractError('The player card cap information is invalid.');
  }
  for (const signing of card.history.signings) {
    if (!signing.id || !timestamp(signing.atMs) || typeof signing.method !== 'string' ||
      (signing.team !== null && typeof signing.team?.name !== 'string')) throw new ResponseContractError('The signing history is invalid.');
  }
  for (const trade of card.history.trades) {
    if (!trade.id || !timestamp(trade.atMs) || !Array.isArray(trade.teams) || !Array.isArray(trade.assets) ||
      !['completed', 'reversed', 'correction_required'].includes(trade.status) ||
      trade.teams.some(team => !team.id || typeof team.name !== 'string') ||
      trade.assets.some(asset => !asset.id || !asset.sourceTeamId || !asset.destinationTeamId || !asset.snapshot || typeof asset.snapshot !== 'object' ||
        (asset.detail !== undefined && !Array.isArray(asset.detail?.years)))) {
      throw new ResponseContractError('The public trade history is invalid.');
    }
  }
  return true;
}

export function playerCardQuery(httpClient, leagueId, playerId, privacyEpoch = 0) {
  return {
    queryKey: ['league', leagueId, 'players', 'card', playerId, privacyEpoch],
    queryFn: async ({ signal }) => {
      if (!httpClient) throw new Error('Player details are unavailable.');
      const response = await httpClient.request(`/api/v1/leagues/${encodeURIComponent(leagueId)}/players/${encodeURIComponent(playerId)}/card`, {
        authenticated: true, dataKind: 'object', signal,
        validateData: data => validatePlayerCard(data, leagueId, playerId),
      });
      validatePlayerCard(response.data, leagueId, playerId);
      return response.data;
    },
    staleTime: 0, gcTime: 0, meta: { private: true, leagueId },
  };
}
