import { buildTradeAsset, centsToDollarInput } from "./transactionContracts.js";

export function counterProposalDraft(proposal, { leagueId, tradeId, managedTeamIds }) {
  if (proposal?.id !== tradeId || proposal.leagueId !== leagueId ||
      proposal.storageStatus !== "proposed" ||
      !managedTeamIds.includes(proposal.receivingTeam?.id)) {
    throw new Error("Only the receiving team's manager can counter a pending offer.");
  }
  const sides = new Map([
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
    sides.get(asset.sourceTeamId).push(item);
  }
  for (const asset of proposal.assets.filter(({ type }) => type === "requested_retention")) {
    const { contractId, retainedAavCents } = asset.snapshot;
    const item = sides.get(asset.sourceTeamId)?.find(({ reference }) => reference === `contract:${contractId}`);
    if (!item || item.retainedAavDollars || !Number.isSafeInteger(retainedAavCents) || retainedAavCents <= 0) {
      throw new Error("The offer's retained salary could not be loaded.");
    }
    item.retainedAavDollars = centsToDollarInput(retainedAavCents);
  }
  if ([...sides.values()].some(assets => assets.length === 0)) {
    throw new Error("Both sides of the original offer are required to prepare a counter proposal.");
  }
  return {
    proposingTeamId: proposal.receivingTeam.id,
    receivingTeamId: proposal.proposingTeam.id,
    proposingAssets: sides.get(proposal.receivingTeam.id),
    receivingAssets: sides.get(proposal.proposingTeam.id),
  };
}
