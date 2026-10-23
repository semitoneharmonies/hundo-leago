import { queryOptions } from '@tanstack/react-query';
import { ResponseContractError } from '../../shared/api/responseContracts.js';
import { validateExpandedScoring } from '../../shared/scoringCategories.js';
import { scheduleDay } from './matchupSchedulePresentation.js';
import { validMatchupDate } from './matchupDaySelection.js';

const STATUSES = new Set(['available', 'complete', 'not_scoring', 'not_started', 'schedule_unavailable', 'scoring_unavailable', 'team_unavailable']);
export function validateMatchupGameProgress(data, matchup) {
  const valid = condition => { if (!condition) throw new ResponseContractError('Matchup game totals are unavailable.'); };
  valid(data?.code === 'MATCHUP_GAME_PROGRESS_FOUND');
  for (const key of ['leagueId','seasonId','weekId']) valid(data[key] === matchup[key]);
  valid(data.matchupId === matchup.id);
  for (const side of ['home','away']) {
    const count=data[side];
    valid(count && count.teamId === matchup[`${side}Team`].id && STATUSES.has(count.status));
    for (const key of ['tallied','remaining','total']) valid(count[key] === null || (Number.isSafeInteger(count[key]) && count[key] >= 0));
    if (['available','complete','not_scoring'].includes(count.status)) {
      valid(count.tallied !== null && count.remaining !== null && count.total === count.tallied + count.remaining);
      if (count.status === 'complete') valid(count.remaining === 0);
      if (count.status === 'not_scoring') valid(count.total === 0);
    } else valid(count.remaining === null && count.total === null);
    if (count.details != null) {
      const details = count.details;
      valid(['available', 'complete'].includes(count.status));
      valid(typeof details.timeZone === 'string' && Number.isSafeInteger(details.asOfMs) && Array.isArray(details.games));
      try { new Intl.DateTimeFormat('en', { timeZone: details.timeZone }); } catch { valid(false); }
      const seen = new Set();
      for (const game of details.games) {
        valid(typeof game.playerId === 'string' && game.playerId.length > 0 && typeof game.playerName === 'string');
        valid(typeof game.gameId === 'string' && game.gameId.length > 0 && Number.isSafeInteger(game.startsAtMs));
        valid(game.opponent === null || /^[A-Z]{2,3}$/.test(game.opponent));
        valid(game.isHome === null || typeof game.isHome === 'boolean');
        valid(['scheduled', 'live', 'awaiting_scoring', 'collected'].includes(game.status));
        valid(game.timeTbd === undefined || typeof game.timeTbd === 'boolean');
        const key = `${game.playerId}:${game.gameId}`;
        valid(!seen.has(key)); seen.add(key);
      }
      valid(details.games.filter(game => game.status !== 'collected').length === count.remaining);
    }
  }
  const validateDay = (day, today = false) => {
    valid(typeof day.timeZone === 'string' && Number.isSafeInteger(day.asOfMs));
    valid(validMatchupDate(day.date));
    try { valid(!today || day.date === scheduleDay(day.asOfMs, day.timeZone)); new Intl.DateTimeFormat('en', { timeZone: day.timeZone }); } catch { valid(false); }
    for (const side of ['home', 'away']) {
      const daily = day[side];
      valid(daily && daily.teamId === matchup[`${side}Team`].id && Array.isArray(daily.players));
      valid(['available', 'not_scoring', 'unavailable'].includes(daily.status));
      valid(daily.status === 'unavailable' ? daily.scoreHundredths === null : Number.isSafeInteger(daily.scoreHundredths));
      if (daily.status !== 'available') valid(daily.players.length === 0);
      const seen = new Set(), slots = new Set();
      for (const player of daily.players) {
        valid(typeof player.playerId === 'string' && player.playerId.length > 0 && !seen.has(player.playerId));
        seen.add(player.playerId);
        valid(typeof player.fullName === 'string' && ['F', 'D'].includes(player.positionGroup));
        valid(Number.isInteger(player.slotNumber) && player.slotNumber >= 1 && player.slotNumber <= (player.positionGroup === 'F' ? 12 : 6));
        const slot = `${player.positionGroup}:${player.slotNumber}`;
        valid(!slots.has(slot)); slots.add(slot);
        valid(player.dataStatus === 'available' && typeof player.scoringRuleVersion === 'string');
        for (const key of ['gamesPlayedDelta', 'goalDelta', 'assistDelta', 'pointDelta']) valid(Number.isSafeInteger(player[key]) && player[key] >= 0);
        validateExpandedScoring(player, player.positionGroup, 'scoreHundredths');
        if (matchup.scoring) valid(matchup.scoring[side].players.some(locked => locked.playerId === player.playerId
          && locked.positionGroup === player.positionGroup && locked.slotNumber === player.slotNumber));
      }
      if (daily.status !== 'unavailable') valid(daily.scoreHundredths === daily.players.reduce((sum, player) => sum + player.scoreHundredths, 0));
    }
  };
  if (data.day != null) validateDay(data.day, true);
  if (data.days != null) {
    valid(Array.isArray(data.days));
    let previous = null;
    for (const day of data.days) {
      valid(day != null && typeof day === 'object');
      validateDay(day);
      valid(data.day != null && day.timeZone === data.day.timeZone && day.asOfMs === data.day.asOfMs);
      if (previous) valid(Date.parse(`${day.date}T12:00:00Z`) - Date.parse(`${previous}T12:00:00Z`) === 86400000);
      previous = day.date;
    }
  }
  return true;
}

export function matchupGameProgressQuery(httpClient, matchup) {
  const {leagueId,seasonId,weekId,id}=matchup;
  const path=[leagueId,seasonId,weekId,id].map(encodeURIComponent);
  return queryOptions({
    queryKey:['league',leagueId,'season',seasonId,'matchup-week',weekId,'matchup',id,'game-progress',matchup.status,matchup.liveScore?.source?.refreshId ?? null,matchup.result?.version ?? null],
    queryFn:async({signal})=>(await httpClient.request(`/api/v1/leagues/${path[0]}/seasons/${path[1]}/matchup-weeks/${path[2]}/matchups/${path[3]}/game-progress`,{authenticated:true,dataKind:'object',validateData:data=>validateMatchupGameProgress(data,matchup),signal})).data,
    // Today changes even while a finalized matchup remains open overnight.
    meta:{private:true,leagueId},staleTime:30_000,refetchInterval:60_000,
  });
}
