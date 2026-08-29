import { queryOptions } from "@tanstack/react-query";

import {
  validateCurrentWeek,
  validateMatchupDetail,
  validateStandings,
  validateWeekDetail,
  validateWeekList,
} from "./competitionContracts.js";

const part = (value) => encodeURIComponent(value);
const base = (leagueId, seasonId) =>
  `/api/v1/leagues/${part(leagueId)}/seasons/${part(seasonId)}`;

export const competitionKeys = Object.freeze({
  weeks: (leagueId, seasonId) => ["league", leagueId, "season", seasonId, "matchup-weeks"],
  current: (leagueId, seasonId) => ["league", leagueId, "season", seasonId, "current-matchup-week"],
  week: (leagueId, seasonId, weekId) => ["league", leagueId, "season", seasonId, "matchup-week", weekId],
  matchup: (leagueId, seasonId, weekId, matchupId) => [
    "league", leagueId, "season", seasonId, "matchup-week", weekId, "matchup", matchupId,
  ],
  standings: (leagueId, seasonId) => ["league", leagueId, "season", seasonId, "standings"],
});

export function matchupWeeksQuery(httpClient, leagueId, seasonId) {
  return queryOptions({
    queryKey: competitionKeys.weeks(leagueId, seasonId),
    queryFn: async ({ signal }) => (await httpClient.request(`${base(leagueId, seasonId)}/matchup-weeks`, {
      authenticated: true, dataKind: "object", validateData: validateWeekList, signal,
    })).data,
    meta: { private: true, leagueId },
    staleTime: 30_000,
  });
}

export function currentMatchupWeekQuery(httpClient, leagueId, seasonId) {
  return queryOptions({
    queryKey: competitionKeys.current(leagueId, seasonId),
    queryFn: async ({ signal }) => (await httpClient.request(`${base(leagueId, seasonId)}/matchup-weeks/current`, {
      authenticated: true, dataKind: "object", validateData: validateCurrentWeek, signal,
    })).data,
    meta: { private: true, leagueId },
    staleTime: 15_000,
  });
}

export function matchupWeekQuery(httpClient, leagueId, seasonId, weekId) {
  return queryOptions({
    queryKey: competitionKeys.week(leagueId, seasonId, weekId),
    queryFn: async ({ signal }) => (await httpClient.request(
      `${base(leagueId, seasonId)}/matchup-weeks/${part(weekId)}`,
      { authenticated: true, dataKind: "object", validateData: validateWeekDetail, signal }
    )).data.week,
    meta: { private: true, leagueId },
    staleTime: 15_000,
  });
}

export function matchupQuery(httpClient, leagueId, seasonId, weekId, matchupId) {
  return queryOptions({
    queryKey: competitionKeys.matchup(leagueId, seasonId, weekId, matchupId),
    queryFn: async ({ signal }) => (await httpClient.request(
      `${base(leagueId, seasonId)}/matchup-weeks/${part(weekId)}/matchups/${part(matchupId)}`,
      { authenticated: true, dataKind: "object", validateData: validateMatchupDetail, signal }
    )).data.matchup,
    meta: { private: true, leagueId },
    staleTime: 10_000,
  });
}

export function standingsQuery(httpClient, leagueId, seasonId) {
  return queryOptions({
    queryKey: competitionKeys.standings(leagueId, seasonId),
    queryFn: async ({ signal }) => (await httpClient.request(`${base(leagueId, seasonId)}/standings`, {
      authenticated: true, dataKind: "object", validateData: validateStandings, signal,
    })).data,
    meta: { private: true, leagueId },
    staleTime: 30_000,
  });
}

async function command(httpClient, path, method, body, { version, idempotencyKey } = {}) {
  return (await httpClient.request(path, {
    method,
    body,
    authenticated: true,
    ...(version === undefined ? {} : { version }),
    ...(idempotencyKey ? { idempotencyKey } : {}),
    dataKind: "object",
  })).data;
}

export function scheduleCommand(httpClient, leagueId, seasonId, confirmed, version) {
  return command(httpClient, `${base(leagueId, seasonId)}/matchup-schedules`, "POST", { confirmed }, { version });
}

export function weekTransitionCommand(httpClient, leagueId, seasonId, weekId, confirmed, version, idempotencyKey) {
  return command(
    httpClient,
    `${base(leagueId, seasonId)}/matchup-weeks/${part(weekId)}`,
    "PATCH",
    { confirmed },
    { version, idempotencyKey }
  );
}

export function resultCorrectionCommand(
  httpClient,
  leagueId,
  seasonId,
  resultId,
  input,
  version,
  idempotencyKey
) {
  return command(
    httpClient,
    `${base(leagueId, seasonId)}/matchup-results/${part(resultId)}/corrections`,
    "POST",
    input,
    { version, idempotencyKey }
  );
}

export function standingsRebuildCommand(httpClient, leagueId, seasonId, input, version, idempotencyKey) {
  return command(
    httpClient,
    `${base(leagueId, seasonId)}/standings/rebuilds`,
    "POST",
    input,
    { version, idempotencyKey }
  );
}
