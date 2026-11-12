import { queryOptions } from "@tanstack/react-query";
import { ResponseContractError } from "../../shared/api/responseContracts.js";

const TEAM = /^[A-Z]{2,3}$/;
const PLAYER_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const STATES = new Set(["scheduled", "live", "final", "postponed", "cancelled"]);

export function validateRosterSchedule(data, scope) {
  const invalid = () => { throw new ResponseContractError("The roster schedule response is invalid."); };
  if (data?.code !== "ROSTER_SCHEDULE_FOUND" || ["leagueId", "seasonId", "weekId"].some((key) => data[key] !== scope[key])) invalid();
  for (const key of ["startsAtMs", "endsAtMs", "fetchedAtMs"]) if (!Number.isSafeInteger(data[key]) || data[key] < 0) invalid();
  if (data.endsAtMs <= data.startsAtMs || typeof data.timeZone !== "string" || !Array.isArray(data.games)) invalid();
  try { new Intl.DateTimeFormat("en", { timeZone: data.timeZone }).format(0); } catch { invalid(); }
  const ids = new Set();
  for (const game of data.games) {
    if (!game || !/^[0-9]+$/.test(game.id) || ids.has(game.id) || !TEAM.test(game.homeTeam) || !TEAM.test(game.awayTeam) || game.homeTeam === game.awayTeam || !STATES.has(game.status) || typeof game.timeTbd !== "boolean" || !Number.isSafeInteger(game.startsAtMs) || game.startsAtMs < data.startsAtMs || game.startsAtMs >= data.endsAtMs) invalid();
    ids.add(game.id);
    if (game.playerPoints !== undefined) {
      if (game.status !== "final" || !Array.isArray(game.playerPoints)) invalid();
      const players = new Set();
      for (const result of game.playerPoints) {
        if (typeof result?.playerId !== "string" || !PLAYER_ID.test(result.playerId)
          || players.has(result.playerId) || !Number.isSafeInteger(result.fantasyPointsHundredths)) invalid();
        players.add(result.playerId);
      }
    }
  }
  return true;
}

export function rosterScheduleQuery(httpClient, leagueId, seasonId, weekId) {
  const scope = { leagueId, seasonId, weekId };
  return queryOptions({
    queryKey: ["league", leagueId, "season", seasonId, "roster-schedule", weekId],
    enabled: Boolean(leagueId && seasonId && weekId),
    queryFn: async ({ signal }) => (await httpClient.request(
      `/api/v1/leagues/${encodeURIComponent(leagueId)}/seasons/${encodeURIComponent(seasonId)}/matchup-weeks/${encodeURIComponent(weekId)}/nhl-schedule`,
      { authenticated: true, dataKind: "object", signal, validateData: (data) => validateRosterSchedule(data, scope) },
    )).data,
    staleTime: 300_000,
    meta: { private: true, leagueId },
  });
}
