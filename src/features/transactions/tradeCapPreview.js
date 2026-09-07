import { dollarsToCents } from "./transactionContracts.js";

function currentUsage(workspace) {
  if (
    workspace?.cap?.complete === false ||
    !Number.isSafeInteger(workspace?.cap?.usageCents)
  ) {
    return null;
  }
  return workspace.cap.usageCents;
}

function playerAsset(reference) {
  const separator = String(reference || "").indexOf(":");
  if (separator < 1) return null;
  const type = reference.slice(0, separator);
  const id = reference.slice(separator + 1);
  return ["contract", "prospect_right"].includes(type) && id
    ? { type, id }
    : null;
}

function unavailable(message, currentCents) {
  return {
    available: false,
    message,
    teams: currentCents.map((value) => ({
      currentCents: value,
      changeCents: null,
      projectedCents: null,
    })),
  };
}

export function projectDraftTradeCap({
  proposingAssets,
  proposingWorkspace,
  receivingAssets,
  receivingWorkspace,
}) {
  const workspaces = [proposingWorkspace, receivingWorkspace];
  const currentCents = workspaces.map(currentUsage);
  if (currentCents.some((value) => !Number.isSafeInteger(value))) {
    return unavailable(
      "Complete current cap totals are required before this proposal can be projected.",
      currentCents
    );
  }

  const deltas = [0, 0];
  const seenAssets = new Set();

  function addDelta(index, cents) {
    const next = deltas[index] + cents;
    if (!Number.isSafeInteger(next)) {
      throw new Error("The proposed cap change is too large to calculate.");
    }
    deltas[index] = next;
  }

  function applySide(assets, sourceIndex, destinationIndex) {
    const workspace = workspaces[sourceIndex];
    for (const asset of assets) {
      if (asset.type === "future_considerations") {
        if (!String(asset.reference || "").trim()) {
          throw new Error(
            "Finish describing each Future Considerations item to calculate this proposal."
          );
        }
        continue;
      }

      if (!asset.reference) {
        throw new Error(
          "Choose every proposed asset to calculate the conditional cap impact."
        );
      }

      if (asset.type === "player") {
        const selected = playerAsset(asset.reference);
        if (!selected) {
          throw new Error(
            "Choose every proposed player asset to calculate the conditional cap impact."
          );
        }
        const identity = `${selected.type}:${selected.id}`;
        if (seenAssets.has(identity)) {
          throw new Error(
            "Remove duplicate assets before calculating the conditional cap impact."
          );
        }
        seenAssets.add(identity);
        if (selected.type === "prospect_right") continue;

        const rosterPlayer = workspace.players.find(
          (player) => player.contract?.id === selected.id
        );
        if (
          !rosterPlayer ||
          !Number.isSafeInteger(rosterPlayer.contract?.aavCents) ||
          !Number.isSafeInteger(rosterPlayer.contract?.retainedAavCents)
        ) {
          throw new Error(
            "The selected contract is missing current cap details, so no estimate is shown."
          );
        }
        const currentNetAav = Math.max(
          0,
          rosterPlayer.contract.aavCents -
            rosterPlayer.contract.retainedAavCents
        );
        let requestedRetentionCents = 0;
        if (String(asset.retainedAavDollars || "").trim()) {
          requestedRetentionCents = dollarsToCents(asset.retainedAavDollars);
          const retentionCeilingCents = Math.floor(
            rosterPlayer.contract.aavCents / 2
          );
          if (
            requestedRetentionCents <= 0 ||
            rosterPlayer.contract.retainedAavCents +
              requestedRetentionCents >
              retentionCeilingCents
          ) {
            throw new Error(
              "Enter a valid retained AAV before calculating the conditional cap impact."
            );
          }
        }
        addDelta(sourceIndex, requestedRetentionCents);
        if (rosterPlayer.rosterCategory === "Active") {
          addDelta(sourceIndex, -currentNetAav);
          addDelta(
            destinationIndex,
            Math.max(0, currentNetAav - requestedRetentionCents)
          );
        }
        continue;
      }

      const identity = `${asset.type}:${asset.reference}`;
      if (seenAssets.has(identity)) {
        throw new Error(
          "Remove duplicate assets before calculating the conditional cap impact."
        );
      }
      seenAssets.add(identity);
      if (asset.type === "buyout_obligation") {
        const buyout = workspace.tradeAssets.buyouts.find(
          ({ id }) => id === asset.reference
        );
        if (!Number.isSafeInteger(buyout?.annualPenaltyCents)) {
          throw new Error(
            "The selected buyout is missing current cap details, so no estimate is shown."
          );
        }
        addDelta(sourceIndex, -buyout.annualPenaltyCents);
        addDelta(destinationIndex, buyout.annualPenaltyCents);
      }
    }
  }

  try {
    applySide(proposingAssets, 0, 1);
    applySide(receivingAssets, 1, 0);
  } catch (error) {
    return unavailable(error.message, currentCents);
  }

  return {
    available: true,
    message: null,
    teams: currentCents.map((value, index) => ({
      currentCents: value,
      changeCents: deltas[index],
      projectedCents: value + deltas[index],
    })),
  };
}
