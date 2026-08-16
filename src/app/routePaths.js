function required(value, description) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${description} is required.`);
  }
  return value;
}

function segment(value, description) {
  return encodeURIComponent(required(value, description));
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
  leagueDrafts: (leagueId) =>
    `/leagues/${segment(leagueId, "League ID")}/drafts`,
  leagueFreeAgentDrafts: (leagueId) =>
    `${routePaths.leagueDrafts(leagueId)}/free-agent`,
  leagueEntryDrafts: (leagueId) =>
    `${routePaths.leagueDrafts(leagueId)}/entry`,
  draftFreeAgentCard: (leagueId, fadId, teamId) =>
    `${routePaths.leagueFreeAgentDrafts(leagueId)}/${segment(
      fadId,
      "Free Agent Draft ID"
    )}/cards/${segment(teamId, "Team ID")}`,
  draftFreeAgentAllocationResults: (leagueId, fadId) =>
    `${routePaths.leagueFreeAgentDrafts(leagueId)}/${segment(
      fadId,
      "Free Agent Draft ID"
    )}/results`,
  leagueFreeAgentDraft: (leagueId) =>
    `/leagues/${segment(leagueId, "League ID")}/free-agent-draft`,
  freeAgentDraft: (leagueId, fadId) =>
    `${routePaths.leagueFreeAgentDraft(leagueId)}/${segment(
      fadId,
      "Free Agent Draft ID"
    )}`,
  freeAgentDraftResults: (leagueId, fadId) =>
    `${routePaths.freeAgentDraft(leagueId, fadId)}/results`,
  freeAgentDraftCard: (leagueId, fadId, teamId) =>
    `${routePaths.freeAgentDraft(leagueId, fadId)}/cards/${segment(
      teamId,
      "Team ID"
    )}`,
  leagueAuctions: (leagueId) =>
    `/leagues/${segment(leagueId, "League ID")}/auctions`,
  auctionDetail: (leagueId, auctionId) =>
    `${routePaths.leagueAuctions(leagueId)}/${segment(
      auctionId,
      "Auction ID"
    )}`,
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
  commissionerFadRecovery: (leagueId, fadId, recoveryId) => {
    const query = new URLSearchParams({
      fadId: required(fadId, "Free Agent Draft ID"),
      recoveryId: required(recoveryId, "FAD recovery ID"),
    });
    return `${routePaths.leagueCommissioner(leagueId)}?${query}`;
  },
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
