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
  const totalValueCents = dollarsToCents(value);
  if (termYears > 1 && totalValueCents % 100 !== 0) {
    throw new Error("Two- and three-year auction totals must be whole dollars.");
  }
  const minimum = offerMinimum({ action, sourceKind, termYears });
  if (totalValueCents < minimum) {
    const kind = action === "start" ? "opening" : action === "join" ? "joining" : "edited";
    throw new Error(
      `The minimum ${kind} total for this term is ${centsToDollarInput(minimum)} dollars.`
    );
  }
  const aavCents = auctionAavCents(totalValueCents, termYears);
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
      total: centsToDollarInput(viewerTeam.bid.totalValueCents),
      term: String(viewerTeam.bid.termYears),
    });
  }
  const floor = auction.minimumContract;
  const termYears = floor?.termYears ?? 1;
  let totalValueCents = JOINING_MINIMUMS[termYears];
  if (floor !== null) {
    const increment = termYears === 1 ? 1 : 100;
    totalValueCents = Math.max(
      totalValueCents,
      floor.totalValueCents +
        (auction.sourceKind === "fad_restricted" ? increment : 0)
    );
  }
  return Object.freeze({
    total: centsToDollarInput(totalValueCents),
    term: String(termYears),
  });
}

export function sourceLabel(auction) {
  if (auction.sourceKind === "ordinary_weekly") return "Weekly auction";
  if (auction.sourceKind === "fad_restricted") return "Restricted Candidate tie";
  if (auction.fadOrigin === "restricted_no_improvement_fallback") {
    return "League-wide FAD fallback";
  }
  if (auction.fadOrigin === "queued_nomination") return "Queued FAD nomination";
  return "FAD rapid auction";
}

export function capabilityMessage(reasonCode) {
  return {
    NOT_AUTHORIZED: "You are not authorized to take this action for that team.",
    HELP_NOT_GRANTED: "Commissioner help access does not authorize this action.",
    PHASE_CLOSED: "This action is closed in the current league phase.",
    DEADLINE_PASSED: "The server deadline for this action has passed.",
    LEAGUE_FROZEN: "League transaction writes are currently frozen.",
    SLOT_LOCKED: "The related Candidate slot is locked.",
    SLOT_OCCUPIED: "The related Candidate slot is already occupied.",
    ENTRY_NOT_EDITABLE: "This bid cannot be changed in its current state.",
    PLAYER_INELIGIBLE: "The player is not currently eligible for this action.",
    TEAM_NOT_PARTICIPANT: "This team is not an eligible participant in this auction.",
    COOLDOWN_ACTIVE: "The server-enforced edit cooldown is still active.",
    EDIT_LIMIT_REACHED: "This bid has used every manager edit.",
    PLAYER_QUARANTINED: "The player is awaiting an authoritative FAD result or recovery.",
    RECOVERY_NOT_AVAILABLE: "This action is unavailable while recovery is pending.",
  }[reasonCode] || "This action is not currently available.";
}
