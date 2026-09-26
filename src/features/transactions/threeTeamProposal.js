import { buildTradeAsset, dollarsToCents } from "./transactionContracts.js";

export function buildThreeTeamProposal(proposingTeamId, participants) {
  const ids = participants.map(p => p.teamId);
  if (ids.length !== 3 || new Set(ids).size !== 3 || ids.some(id => !id) || ids[0] !== proposingTeamId) throw new Error("Choose three different teams.");
  return { proposingTeamId, participants: participants.map(side => ({ teamId: side.teamId,
    assets: side.assets.flatMap(item => {
      if (!ids.includes(item.destinationTeamId) || item.destinationTeamId === side.teamId) throw new Error("Choose a receiving team for every asset.");
      const asset = { ...buildTradeAsset(item), destinationTeamId: item.destinationTeamId };
      if (asset.type !== "contract" || !String(item.retainedAavDollars || "").trim()) return [asset];
      return [asset, { type: "requested_retention", contractId: asset.contractId,
        retainedAavCents: dollarsToCents(item.retainedAavDollars), destinationTeamId: item.destinationTeamId }];
    }),
  })) };
}
