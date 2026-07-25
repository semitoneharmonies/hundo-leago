function segment(value, description) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${description} is required.`);
  }
  return encodeURIComponent(value);
}

export const routePaths = Object.freeze({
  home: "/",
  verifyEmail: "/verify-email",
  setupAccount: "/setup-account",
  resetPassword: "/reset-password",
  reactivate: "/reactivate",
  leagues: "/leagues",
  league: (leagueId) => `/leagues/${segment(leagueId, "League ID")}`,
  leagueTeams: (leagueId) =>
    `/leagues/${segment(leagueId, "League ID")}/teams`,
  teamRoster: (leagueId, teamId) =>
    `/leagues/${segment(leagueId, "League ID")}/teams/${segment(
      teamId,
      "Team ID"
    )}/roster`,
  leaguePlayers: (leagueId) =>
    `/leagues/${segment(leagueId, "League ID")}/players`,
  player: (leagueId, playerId) =>
    `/leagues/${segment(leagueId, "League ID")}/players/${segment(
      playerId,
      "Player ID"
    )}`,
  leagueAuctions: (leagueId) =>
    `/leagues/${segment(leagueId, "League ID")}/auctions`,
  leagueTrades: (leagueId) =>
    `/leagues/${segment(leagueId, "League ID")}/trades`,
  trade: (leagueId, tradeId) =>
    `/leagues/${segment(leagueId, "League ID")}/trades/${segment(
      tradeId,
      "Trade ID"
    )}`,
  leagueMatchups: (leagueId) =>
    `/leagues/${segment(leagueId, "League ID")}/matchups`,
  leagueStandings: (leagueId) =>
    `/leagues/${segment(leagueId, "League ID")}/standings`,
  leagueActivity: (leagueId) =>
    `/leagues/${segment(leagueId, "League ID")}/activity`,
  leagueSecurity: (leagueId) =>
    `/leagues/${segment(leagueId, "League ID")}/security`,
  leagueCommissioner: (leagueId) =>
    `/leagues/${segment(leagueId, "League ID")}/commissioner`,
  leagueCommissionerRoster: (leagueId) =>
    `/leagues/${segment(leagueId, "League ID")}/commissioner/rosters`,
  notifications: "/notifications",
  admin: "/admin",
  publicTeamRoster: (leagueId, teamId) =>
    `/public/leagues/${segment(leagueId, "League ID")}/teams/${segment(
      teamId,
      "Team ID"
    )}/roster`,
});
