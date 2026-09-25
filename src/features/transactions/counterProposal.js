import { buildTradeAsset, centsToDollarInput } from "./transactionContracts.js";

export function counterProposalDraft(proposal, { leagueId, tradeId, managedTeamIds, respondingTeamId }) {
  const multi = proposal?.participants?.length === 3;
  const counterTeamId = multi ? respondingTeamId || proposal.participants.find(p => managedTeamIds.includes(p.teamId) && p.teamId !== proposal.proposingTeam.id)?.teamId : proposal?.receivingTeam?.id;
  if (proposal?.id !== tradeId || proposal.leagueId !== leagueId ||
      !(multi ? ["proposed", "declined"] : ["proposed"]).includes(proposal.storageStatus) ||
      !managedTeamIds.includes(counterTeamId) || (multi && (!proposal.participants.some(p => p.teamId === counterTeamId) || (proposal.storageStatus === "proposed" && counterTeamId === proposal.proposingTeam.id)))) {
    throw new Error("Only the receiving team's manager can counter a pending offer.");
  }
  const sides = new Map(multi ? [counterTeamId, ...proposal.participants.map(p => p.teamId).filter(id => id !== counterTeamId)].map(id => [id, []]) : [
    [proposal.receivingTeam.id, []],
    [proposal.proposingTeam.id, []],
  ]);
  for (const asset of proposal.assets) {
    if (!sides.has(asset.sourceTeamId)) throw new Error("The offer's teams could not be loaded.");
    if (asset.type === "requested_retention") continue;
    const snapshot = asset.snapshot;
    let item;
    switch (asset.type) {
      case "contract":
        item = { type: "player", reference: `contract:${snapshot.contract?.id}` };
        break;
      case "prospect_right":
        item = { type: "player", reference: `prospect_right:${snapshot.player?.id}` };
        break;
      case "draft_pick":
      case "buyout_obligation":
        item = { type: asset.type, reference: snapshot.id };
        break;
      case "future_consideration":
        item = { type: "future_considerations", mode: "existing", reference: snapshot.id };
        break;
      case "future_consideration_instruction":
        item = { type: "future_considerations", mode: "new", reference: snapshot.description };
        break;
      default:
        throw new Error("This offer includes a historical asset that cannot be used in a new proposal.");
    }
    buildTradeAsset(item);
    if (multi) {
      if (!sides.has(asset.destinationTeamId) || asset.destinationTeamId === asset.sourceTeamId) throw new Error("The offer's asset destinations could not be loaded.");
      item.destinationTeamId = asset.destinationTeamId;
    }
    sides.get(asset.sourceTeamId).push(item);
  }
  for (const asset of proposal.assets.filter(({ type }) => type === "requested_retention")) {
    const { contractId, retainedAavCents } = asset.snapshot;
    const item = sides.get(asset.sourceTeamId)?.find(({ reference }) => reference === `contract:${contractId}`);
    if (!item || (multi && item.destinationTeamId !== asset.destinationTeamId) || item.retainedAavDollars || !Number.isSafeInteger(retainedAavCents) || retainedAavCents <= 0) {
      throw new Error("The offer's retained salary could not be loaded.");
    }
    item.retainedAavDollars = centsToDollarInput(retainedAavCents);
  }
  if ([...sides.values()].some(assets => assets.length === 0)) {
    throw new Error("Both sides of the original offer are required to prepare a counter proposal.");
  }
  if (multi) return { proposingTeamId: counterTeamId, participants: [...sides].map(([teamId, assets]) => ({ teamId, assets })) };
  return {
    proposingTeamId: proposal.receivingTeam.id,
    receivingTeamId: proposal.proposingTeam.id,
    proposingAssets: sides.get(proposal.receivingTeam.id),
    receivingAssets: sides.get(proposal.proposingTeam.id),
  };
}
