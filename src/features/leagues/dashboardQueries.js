import { auctionListQuery } from "../auctions/auctionQueries.js";
import { currentMatchupWeekQuery, matchupQuery, standingsQuery } from "../competition/competitionQueries.js";
import { teamWorkspaceQuery } from "../rosters/teamWorkspaceQueries.js";
import { activityQuery, tradesQuery } from "../transactions/transactionQueries.js";

export function dashboardActivityQuery(httpClient, leagueId) {
  return activityQuery(httpClient, leagueId, null, "all", 5);
}

export function dashboardTeamQueries(httpClient, leagueId, teams) {
  return teams.map((team) => teamWorkspaceQuery(httpClient, leagueId, team.id));
}

export function dashboardMatchupQueries(httpClient, leagueId, seasonId, week) {
  return (week?.matchups || []).map((matchup) =>
    matchupQuery(httpClient, leagueId, seasonId, week.id, matchup.id)
  );
}

export function prefetchDashboardTeams(queryClient, httpClient, league, teams) {
  if (!league?.currentSeason?.id || league.membership?.status !== "active") return Promise.resolve();
  return Promise.all(dashboardTeamQueries(httpClient, league.id, teams)
    .map((query) => queryClient.prefetchQuery(query)));
}

// Called only after the session and visible-league membership are confirmed.
// Reuse the panels' keys so mounting a panel joins its in-flight request.
export function prefetchDashboardQueries(queryClient, httpClient, league) {
  const seasonId = league?.currentSeason?.id;
  if (!seasonId || league.membership?.status !== "active") return Promise.resolve();
  const leagueId = league.id;
  return Promise.all([
    queryClient.prefetchQuery(currentMatchupWeekQuery(httpClient, leagueId, seasonId)),
    queryClient.prefetchQuery(standingsQuery(httpClient, leagueId, seasonId)),
    queryClient.prefetchQuery(tradesQuery(httpClient, leagueId)),
    queryClient.prefetchQuery(dashboardActivityQuery(httpClient, leagueId)),
    queryClient.prefetchInfiniteQuery(auctionListQuery(httpClient, leagueId, { statuses: ["active"], limit: 3 })),
  ]);
}
