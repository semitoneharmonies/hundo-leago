import {
  centsToDollarInput,
  dollarsToCents,
} from "../transactions/transactionContracts.js";

const JOINING_MINIMUMS = Object.freeze({ 1: 150, 2: 300, 3: 500 });

export function auctionAavCents(totalValueCents, termYears) {
  const whole = Math.floor(totalValueCents / termYears);
  const remainder = totalValueCents % termYears;
  return whole + (remainder * 2 >= termYears ? 1 : 0);
}

export function auctionTotalValueCents(aavCents, termYears) {
  const totalValueCents = aavCents * termYears;
  if (!Number.isSafeInteger(totalValueCents) || totalValueCents < 1) {
    throw new Error("The calculated total contract value is invalid.");
  }
  return totalValueCents;
}

function quarterAavForTotal(totalValueCents, termYears) {
  return Math.ceil(Math.ceil(totalValueCents / termYears) / 25) * 25;
}
function contractMinimum(termYears) {
  return termYears * 100;
}

function offerMinimum({ action, sourceKind, termYears }) {
  if (action === "join" || (action === "edit" && sourceKind === "fad_restricted")) {
    return JOINING_MINIMUMS[termYears];
  }
  return contractMinimum(termYears);
}

function floorComparison(totalValueCents, aavCents, floor) {
  if (totalValueCents !== floor.totalValueCents) {
    return totalValueCents > floor.totalValueCents ? 1 : -1;
  }
  if (aavCents === floor.aavCents) return 0;
  return aavCents > floor.aavCents ? 1 : -1;
}

export function validateAuctionOffer(
  value,
  termValue,
  {
    action,
    sourceKind = "ordinary_weekly",
    fadOrigin = null,
    minimumContract = null,
  }
) {
  const termYears = Number(termValue);
  if (!Number.isSafeInteger(termYears) || termYears < 1 || termYears > 3) {
    throw new Error("Choose a contract term from one to three years.");
  }
  const aavCents = dollarsToCents(value);
  if (aavCents < 100) {
    throw new Error("AAV must be at least $1.00 per year.");
  }
  if (aavCents % 25 !== 0) {
    throw new Error("AAV must use whole-dollar or 25-cent increments.");
  }
  const totalValueCents = auctionTotalValueCents(aavCents, termYears);
  const minimum = offerMinimum({ action, sourceKind, termYears });
  if (totalValueCents < minimum) {
    const kind = action === "start" ? "opening" : action === "join" ? "joining" : "edited";
    throw new Error(
      `The minimum ${kind} total for this term is ${centsToDollarInput(minimum)} dollars.`
    );
  }
  if (minimumContract !== null) {
    const comparison = floorComparison(totalValueCents, aavCents, minimumContract);
    if (sourceKind === "fad_restricted" && comparison <= 0) {
      throw new Error(
        "To contend, this bid must improve the Candidate minimum with a higher total, or the same total and a higher AAV."
      );
    }
    if (
      fadOrigin === "restricted_no_improvement_fallback" &&
      comparison < 0
    ) {
      throw new Error(
        "This bid must meet the fallback floor with a higher total, or the same total and at least the same AAV."
      );
    }
  }
  return Object.freeze({ totalValueCents, termYears, aavCents });
}

export function initialAuctionOffer(auction, viewerTeam) {
  if (viewerTeam?.bid) {
    return Object.freeze({
      aav: centsToDollarInput(viewerTeam.bid.aavCents),
      term: String(viewerTeam.bid.termYears),
    });
  }
  const floor = auction.minimumContract;
  const termYears = floor?.termYears ?? 1;
  let aavCents = quarterAavForTotal(JOINING_MINIMUMS[termYears], termYears);
  if (floor !== null) {
    while (
      floorComparison(
        auctionTotalValueCents(aavCents, termYears),
        aavCents,
        floor
      ) < (auction.sourceKind === "fad_restricted" ? 1 : 0)
    ) {
      aavCents += 25;
    }
  }
  return Object.freeze({
    aav: centsToDollarInput(aavCents),
    term: String(termYears),
  });
}

export function auctionTotalPreview(value, termValue) {
  try {
    const aavCents = dollarsToCents(value);
    const termYears = Number(termValue);
    if (!Number.isSafeInteger(termYears) || termYears < 1 || termYears > 3) {
      return "";
    }
    return centsToDollarInput(auctionTotalValueCents(aavCents, termYears));
  } catch {
    return "";
  }
}

export function sourceLabel(auction) {
  if (auction.sourceKind === "ordinary_weekly") return "Auction";
  if (["fad_restricted", "fad_open_rapid"].includes(auction.sourceKind)) {
    return "Free Agent Draft Rapid Auction";
  }
  return "Auction";
}

export function capabilityMessage(reasonCode) {
  return {
    NOT_AUTHORIZED: "You are not authorized to take this action for that team.",
    HELP_NOT_GRANTED: "Commissioner help access does not authorize this action.",
    PHASE_CLOSED: "This action isn’t available right now.",
    DEADLINE_PASSED: "This auction is no longer accepting changes.",
    LEAGUE_FROZEN: "League transaction writes are currently frozen.",
    SLOT_LOCKED: "The related Candidate slot is locked.",
    SLOT_OCCUPIED: "The related Candidate slot is already occupied.",
    ENTRY_NOT_EDITABLE: "This bid cannot be changed in its current state.",
    PLAYER_INELIGIBLE: "The player is not currently eligible for this action.",
    TEAM_NOT_PARTICIPANT: "This team is not an eligible participant in this auction.",
    COOLDOWN_ACTIVE: "The server-enforced edit cooldown is still active.",
    EDIT_LIMIT_REACHED: "This bid has used every manager edit.",
    PLAYER_QUARANTINED: "The player is awaiting a Free Agent Draft result or recovery.",
    RECOVERY_NOT_AVAILABLE: "This action is unavailable while recovery is pending.",
  }[reasonCode] || "This action is not currently available.";
}
