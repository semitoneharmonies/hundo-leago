import { buildTradeAsset } from "./transactionContracts.js";

export function tradeDraftSides(body) {
  return body.participants || [
    { teamId: body.proposingTeamId, assets: body.proposingAssets.map(asset => ({ ...asset, destinationTeamId: body.receivingTeamId })) },
    { teamId: body.receivingTeamId, assets: body.receivingAssets.map(asset => ({ ...asset, destinationTeamId: body.proposingTeamId })) },
  ];
}

// Reuse the authoritative draft-preview endpoint for an already visible offer.
// This only rebuilds asset references; it never calculates cap or roster rules.
export function proposalDraftInput(proposal) {
  if (proposal.detailsVisible === false || !proposal.assets?.length) throw new Error("The trade details are unavailable.");
  const ids = proposal.participants?.map(p => p.teamId) || [proposal.proposingTeam.id, proposal.receivingTeam.id];
  const sides = ids.map(teamId => ({ teamId, assets: [] }));
  for (const asset of proposal.assets) {
    const snapshot = asset.snapshot;
    const reference = asset.type === "contract" ? snapshot.contract?.id
      : asset.type === "prospect_right" ? snapshot.player?.id
        : asset.type === "requested_retention" ? snapshot.contractId
          : asset.type === "future_consideration_instruction" ? snapshot.description : snapshot.id;
    const input = buildTradeAsset({ type: asset.type, reference, retainedAavCents: snapshot.retainedAavCents });
    const side = sides.find(p => p.teamId === asset.sourceTeamId);
    if (!side || !ids.includes(asset.destinationTeamId) || asset.sourceTeamId === asset.destinationTeamId) throw new Error("The trade's asset destinations are invalid.");
    side.assets.push(proposal.participants ? { ...input, destinationTeamId: asset.destinationTeamId } : input);
  }
  return proposal.participants ? { proposingTeamId: proposal.proposingTeam.id, participants: sides }
    : { proposingTeamId: proposal.proposingTeam.id, receivingTeamId: proposal.receivingTeam.id, proposingAssets: sides[0].assets, receivingAssets: sides[1].assets };
}

export function draftReviewAssets(body, workspaces, leagueId) {
  return tradeDraftSides(body).flatMap(side => {
    const workspace = workspaces.find(w => w?.team.id === side.teamId);
    if (!workspace || workspace.league.id !== leagueId) throw new Error("The team's current assets could not be loaded. Return to the editor and try again.");
    return side.assets.map((asset, index) => {
      const choices = workspace.tradeAssets;
      let snapshot, summaryLabel;
      const player = workspace.players.find(p => asset.type === "contract" ? p.contract?.id === asset.contractId : p.playerId === asset.playerId);
      const choice = asset.type === "contract" ? choices.contracts.find(c => c.id === asset.contractId)
        : asset.type === "prospect_right" ? choices.prospects.find(c => c.id === asset.playerId)
          : asset.type === "draft_pick" ? choices.draftPicks.find(c => c.id === asset.draftPickId)
            : asset.type === "buyout_obligation" ? choices.buyouts.find(c => c.id === asset.buyoutObligationId)
              : asset.type === "future_consideration" ? choices.futureConsiderations.find(c => c.id === asset.futureConsiderationId) : null;
      if (!["requested_retention", "future_consideration_instruction"].includes(asset.type) && !choice) throw new Error("An offered item is no longer available. Edit the trade to choose a replacement or remove it.");
      switch (asset.type) {
        case "contract":
          snapshot = { contract: { ...player?.contract, id: asset.contractId }, player: player && { id: player.playerId, name: player.name }, ownership: player && { rosterCategory: player.rosterCategory } };
          if (!player) summaryLabel = choice.label;
          break;
        case "prospect_right":
          snapshot = { player: { id: asset.playerId, name: player?.name || choice.label }, fantasyElc: player?.contract || null };
          if (!player) summaryLabel = choice.label;
          break;
        case "draft_pick": {
          const pick = workspace.draftPicks.find(p => p.id === asset.draftPickId);
          snapshot = { id: asset.draftPickId, targetSeasonLabel: pick?.targetSeason.label, roundNumber: pick?.round, positionNumber: pick?.position };
          if (!pick) summaryLabel = choice.label;
          break;
        }
        case "buyout_obligation":
          snapshot = { id: asset.buyoutObligationId, player: { name: choice.playerName }, annualPenaltyBasisCents: choice.annualPenaltyCents, remainingYears: choice.remainingYears };
          break;
        case "requested_retention":
          snapshot = { contractId: asset.contractId, retainedAavCents: asset.retainedAavCents };
          break;
        case "future_consideration":
          snapshot = { id: asset.futureConsiderationId, description: choice.label };
          break;
        case "future_consideration_instruction":
          snapshot = { description: asset.description };
          break;
        default: throw new Error("This asset cannot be included in a new trade.");
      }
      return { id: `draft:${side.teamId}:${index}`, type: asset.type, sourceTeamId: side.teamId, destinationTeamId: asset.destinationTeamId, snapshot, summaryLabel };
    });
  });
}
