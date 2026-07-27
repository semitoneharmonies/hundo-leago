function segment(value, description) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${description} is required.`);
  }
  return encodeURIComponent(value);
}

function tradeAssetQuery({
  assetDirection,
  assetId,
  assetType,
  proposingTeamId,
  sourceTeamId,
}) {
  const query = new URLSearchParams({
    assetDirection,
    assetType,
    assetId: segment(assetId, "Trade asset ID"),
    sourceTeamId: segment(sourceTeamId, "Trade source team ID"),
  });
  if (proposingTeamId) {
    query.set(
      "proposingTeamId",
      segment(proposingTeamId, "Trade proposing team ID")
    );
  }
  return query.toString();
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
  leagueAuctionForPlayer: (leagueId, playerId) =>
    `/leagues/${segment(leagueId, "League ID")}/auctions?playerId=${segment(
      playerId,
      "Player ID"
    )}`,
  leagueTrades: (leagueId) =>
    `/leagues/${segment(leagueId, "League ID")}/trades`,
  leagueTradeForAsset: (leagueId, assetType, assetId) =>
    `/leagues/${segment(
      leagueId,
      "League ID"
    )}/trades?assetType=${encodeURIComponent(
      assetType
    )}&assetId=${segment(assetId, "Trade asset ID")}`,
  leagueTradeForOfferedAsset: (
    leagueId,
    proposingTeamId,
    assetType,
    assetId
  ) =>
    `/leagues/${segment(
      leagueId,
      "League ID"
    )}/trades?${tradeAssetQuery({
      assetDirection: "offered",
      assetType,
      assetId,
      proposingTeamId,
      sourceTeamId: proposingTeamId,
    })}`,
  leagueTradeForRequestedAsset: (
    leagueId,
    proposingTeamId,
    sourceTeamId,
    assetType,
    assetId
  ) =>
    `/leagues/${segment(
      leagueId,
      "League ID"
    )}/trades?${tradeAssetQuery({
      assetDirection: "requested",
      assetType,
      assetId,
      proposingTeamId,
      sourceTeamId,
    })}`,
  trade: (leagueId, tradeId) =>
    `/leagues/${segment(leagueId, "League ID")}/trades/${segment(
      tradeId,
      "Trade ID"
    )}`,
  tradeAcceptance: (leagueId, tradeId) =>
    `${routePaths.trade(leagueId, tradeId)}?preview=acceptance`,
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
  account: "/account",
  admin: "/admin",
  publicTeamRoster: (leagueId, teamId) =>
    `/public/leagues/${segment(leagueId, "League ID")}/teams/${segment(
      teamId,
      "Team ID"
    )}/roster`,
});
