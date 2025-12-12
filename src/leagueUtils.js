// src/leagueUtils.js
// All the pure "league rules / math" helper functions live here.

// -------------------------------
//   Deadlines / scheduling
// -------------------------------

// Next Sunday at 4:00 PM PT (using browser local time as PT)
export function getNextSundayDeadline(from = new Date()) {
  const d = new Date(from);
  const day = d.getDay(); // 0 = Sunday
  const daysUntilSunday = (7 - day) % 7;
  const candidate = new Date(d);
  candidate.setDate(candidate.getDate() + daysUntilSunday);
  candidate.setHours(16, 0, 0, 0); // 4:00 PM

  if (candidate <= d) {
    candidate.setDate(candidate.getDate() + 7);
  }

  return candidate;
}

// Cutoff for starting new auctions = Thursday 11:59 PM before that Sunday
export function getNewAuctionCutoff(nextSundayDeadline) {
  const cutoff = new Date(nextSundayDeadline);
  cutoff.setDate(cutoff.getDate() - 3); // Thursday
  cutoff.setHours(23, 59, 59, 999);
  return cutoff;
}

// -------------------------------
//   Buyout & Cap Calculations
// -------------------------------

// Buyout = 25% of salary, rounded up, except salary 1 (or lower) has no penalty
export const calculateBuyout = (salary) => {
  const s = Number(salary) || 0;
  if (s <= 1) return 0;
  return Math.ceil(s * 0.25);
};

export const totalCap = (team) => {
  if (!team) return 0;

  // IR players do NOT count against the cap
  const rosterCap = (team.roster || []).reduce((sum, p) => {
    const salary = Number(p.salary) || 0;
    if (p.onIR) return sum;
    return sum + salary;
  }, 0);

  const allBuyouts = team.buyouts || [];

  // True buyout penalties (not retained salary)
  const pureBuyoutCap = allBuyouts
    .filter((b) => !b.retained)
    .reduce((sum, b) => sum + (Number(b.penalty) || 0), 0);

  // Retained-salary commitments (flagged with retained: true)
  const retainedCap = allBuyouts
    .filter((b) => b.retained)
    .reduce((sum, b) => sum + (Number(b.penalty) || 0), 0);

  return rosterCap + pureBuyoutCap + retainedCap;
};

// Total buyout penalty (used in trading & summaries) – excludes retained salary
export const totalBuyoutPenalty = (team) => {
  if (!team) return 0;

  return (team.buyouts || [])
    .filter((b) => !b.retained)
    .reduce((sum, b) => sum + (Number(b.penalty) || 0), 0);
};

// Total retained-salary cap hit (separate bucket)
export const totalRetainedSalary = (team) => {
  if (!team) return 0;

  return (team.buyouts || [])
    .filter((b) => b.retained)
    .reduce((sum, b) => sum + (Number(b.penalty) || 0), 0);
};


// -------------------------------
//   Roster position helpers
// -------------------------------

// Standard roster ordering:
// Forwards first, then Defense
// Within each group: salary high -> low
// Tie-breaker: name A -> Z (stable-ish)
export function sortRosterStandard(roster = []) {
  const list = [...(roster || [])];

  const posRank = (p) => ((p?.position || "F") === "D" ? 1 : 0);
  const salaryNum = (p) => Number(p?.salary) || 0;
  const nameKey = (p) => String(p?.name || "").toLowerCase();

  list.sort((a, b) => {
    const pr = posRank(a) - posRank(b);
    if (pr !== 0) return pr;

    const sd = salaryNum(b) - salaryNum(a);
    if (sd !== 0) return sd;

    return nameKey(a).localeCompare(nameKey(b));
  });

  return list;
}

// Count forwards / defensemen
export const countPositions = (team) => {
  const counts = { F: 0, D: 0 };
  if (!team || !Array.isArray(team.roster)) return counts;

  team.roster.forEach((p) => {
    // IR players don’t count toward F/D minimums
    if (p.onIR) return;

    const pos = p.position || "F";
    if (pos === "D") {
      counts.D++;
    } else {
      counts.F++;
    }
  });

  return counts;
};



// Count how many retained-salary *players* exist on this team
// Identified by buyout entries with { retained: true } and a positive penalty
export const countRetentionSpots = (team) => {
  if (!team) return 0;

  const buyouts = team.buyouts || [];

  const players = new Set(
    buyouts
      .filter((b) => b.retained && Number(b.penalty) > 0)
      .map((b) => b.player)
  );

  return players.size;
};


// Move buyout penalty from one team to another.
// Returns new copies of both teams plus how much was actually moved.
export function transferBuyoutPenalty(fromTeamObj, toTeamObj, amount) {
  const amt = Number(amount) || 0;

  if (!fromTeamObj || !toTeamObj || amt <= 0) {
    return {
      from: fromTeamObj,
      to: toTeamObj,
      transferred: 0,
    };
  }

  let remaining = amt;

  // Clone the "from" team buyouts so we don't mutate the original
  const fromBuyouts = (fromTeamObj.buyouts || []).map((b) => ({
    ...b,
    penalty: Number(b.penalty) || 0,
  }));

  for (let i = 0; i < fromBuyouts.length && remaining > 0; i++) {
    const p = fromBuyouts[i].penalty;

    if (p <= remaining) {
      // Use up this whole penalty entry
      remaining -= p;
      fromBuyouts[i].penalty = 0;
    } else {
      // Partially use this entry, leave the rest
      fromBuyouts[i].penalty = p - remaining;
      remaining = 0;
    }
  }

  const actualTransferred = amt - remaining;

  // Remove any entries that are now 0
  const cleanedFrom = fromBuyouts.filter((b) => b.penalty > 0);

  // Add a new penalty entry on the receiving team
  const toBuyouts = [...(toTeamObj.buyouts || [])];

  if (actualTransferred > 0) {
    toBuyouts.push({
      player: `Traded penalty from ${fromTeamObj.name}`,
      penalty: actualTransferred,
    });
  }

  return {
    from: { ...fromTeamObj, buyouts: cleanedFrom },
    to: { ...toTeamObj, buyouts: toBuyouts },
    transferred: actualTransferred,
  };
}

// -------------------------------
//   Countdown formatting helper
// -------------------------------
export function formatCountdown(timeRemainingMs) {
  if (timeRemainingMs == null) {
    return "calculating...";
  }

  const totalSeconds = Math.max(0, Math.floor(timeRemainingMs / 1000));
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// -------------------------------
//   Roster legality helper
// -------------------------------
export function isTeamIllegal(team, options) {
  if (!team) return false;

  const {
    capLimit,
    maxRosterSize,
    minForwards,
    minDefensemen,
  } = options;

  // Only ACTIVE players (not on IR) count for size + positions.
  const activeRoster = (team.roster || []).filter((p) => !p.onIR);
  const cap = totalCap(team); // already ignores IR salaries
  const size = activeRoster.length;

  // Reuse countPositions but pass a team object with only active players
  const pos = countPositions({ ...team, roster: activeRoster });

  if (cap > capLimit) return true;
  if (size > maxRosterSize) return true;
  if (pos.F < minForwards) return true;
  if (pos.D < minDefensemen) return true;

  return false;
}


// -------------------------------
//   Trade impact preview helper
// -------------------------------
export function buildTradeImpactPreview({
  fromTeam,
  toTeam,
  offeredPlayers,
  requestedPlayers,
  retentionFrom,
  retentionTo,
  penaltyFrom,
  penaltyTo,
  capLimit,
  maxRosterSize,
  minForwards,
  minDefensemen,
}) {
  let fromPreview = null;
  let toPreview = null;
  let issues = [];

  try {
    if (
      !fromTeam ||
      !toTeam ||
      (!offeredPlayers?.length && !requestedPlayers?.length)
    ) {
      return { fromPreview: null, toPreview: null, issues: [] };
    }

    // Clone base teams so we don't mutate the originals
    let previewFrom = {
      ...fromTeam,
      roster: [...(fromTeam.roster || [])],
      buyouts: [...(fromTeam.buyouts || [])],
    };
    let previewTo = {
      ...toTeam,
      roster: [...(toTeam.roster || [])],
      buyouts: [...(toTeam.buyouts || [])],
    };

    const offeredNames = offeredPlayers || [];
    const requestedNames = requestedPlayers || [];

    const offeredObjs = previewFrom.roster.filter((p) =>
      offeredNames.includes(p.name)
    );
    const requestedObjs = previewTo.roster.filter((p) =>
      requestedNames.includes(p.name)
    );

    // --- Salary retention in preview (both sides) ---
    const retentionFromMap = retentionFrom || {};
    const retentionToMap = retentionTo || {};

    const retainedFromEntries = [];
    const retainedToEntries = [];

    // fromTeam retains salary on players it sends out
    const adjustedOffered = offeredObjs.map((player) => {
      const raw = retentionFromMap[player.name];
      if (raw == null || raw === "") return player;

      const amt = Number(raw);
      if (!amt || amt <= 0) return player;

      const maxAllowed = Math.floor(player.salary * 0.5);
      const applied = Math.min(amt, maxAllowed);
      if (applied <= 0) return player;

      retainedFromEntries.push({
        player: `${player.name} (retained in trade)`,
        penalty: applied,
        retained: true,
      });

      return {
        ...player,
        salary: Math.max(0, player.salary - applied),
      };
    });

    // toTeam retains salary on players it sends out (requested players)
    const adjustedRequested = requestedObjs.map((player) => {
      const raw = retentionToMap[player.name];
      if (raw == null || raw === "") return player;

      const amt = Number(raw);
      if (!amt || amt <= 0) return player;

      const maxAllowed = Math.floor(player.salary * 0.5);
      const applied = Math.min(amt, maxAllowed);
      if (applied <= 0) return player;

      retainedToEntries.push({
        player: `${player.name} (retained in trade)`,
        penalty: applied,
        retained: true,
      });

      return {
        ...player,
        salary: Math.max(0, player.salary - applied),
      };
    });

    // Attach retained-salary buyouts to the correct teams
    previewFrom.buyouts = [
      ...(previewFrom.buyouts || []),
      ...retainedFromEntries,
    ];
    previewTo.buyouts = [
      ...(previewTo.buyouts || []),
      ...retainedToEntries,
    ];

    // Move players
    previewFrom.roster = previewFrom.roster.filter(
      (p) => !offeredNames.includes(p.name)
    );
    previewTo.roster = previewTo.roster.filter(
      (p) => !requestedNames.includes(p.name)
    );

    // After retention, adjusted salaries travel with the player
    previewFrom.roster.push(...adjustedRequested);
    previewTo.roster.push(...adjustedOffered);
      // ✅ Re-sort rosters so incoming players land in the right spot
  previewFrom.roster = sortRosterStandard(previewFrom.roster);
  previewTo.roster = sortRosterStandard(previewTo.roster);


    // Apply buyout penalty transfers (same logic as accept handler)
    const penaltyFromNum =
      penaltyFrom === "" || penaltyFrom == null ? 0 : Number(penaltyFrom);
    const penaltyToNum =
      penaltyTo === "" || penaltyTo == null ? 0 : Number(penaltyTo);

    let simFrom = previewFrom;
    let simTo = previewTo;

    if (penaltyFromNum > 0) {
      const res = transferBuyoutPenalty(simFrom, simTo, penaltyFromNum);
      simFrom = res.from;
      simTo = res.to;
    }

    if (penaltyToNum > 0) {
      const res = transferBuyoutPenalty(simTo, simFrom, penaltyToNum);
      simTo = res.from;
      simFrom = res.to;
    }

    // Build per-team preview metrics
    const buildPreview = (beforeTeam, afterTeam) => {
      const capBefore = totalCap(beforeTeam);
      const capAfter = totalCap(afterTeam);
      const sizeBefore = (beforeTeam.roster || []).length;
      const sizeAfter = (afterTeam.roster || []).length;
      const posBefore = countPositions(beforeTeam);
      const posAfter = countPositions(afterTeam);
      const penaltiesBefore = totalBuyoutPenalty(beforeTeam);
      const penaltiesAfter = totalBuyoutPenalty(afterTeam);
      const retentionBefore = countRetentionSpots(beforeTeam);
      const retentionAfter = countRetentionSpots(afterTeam);

      return {
        capBefore,
        capAfter,
        capDiff: capAfter - capBefore,
        sizeBefore,
        sizeAfter,
        posBefore,
        posAfter,
        penaltiesBefore,
        penaltiesAfter,
        retentionBefore,
        retentionAfter,
      };
    };

    fromPreview = buildPreview(fromTeam, simFrom);
    toPreview = buildPreview(toTeam, simTo);

    // Same roster legality rules as the real accept handler
    const newIssues = [];

    if (fromPreview.capAfter > capLimit) {
      newIssues.push(
        `${fromTeam.name} would be over the cap by $${fromPreview.capAfter - capLimit}.`
      );
    }
    if (toPreview.capAfter > capLimit) {
      newIssues.push(
        `${toTeam.name} would be over the cap by $${toPreview.capAfter - capLimit}.`
      );
    }

    if (fromPreview.sizeAfter > maxRosterSize) {
      newIssues.push(
        `${fromTeam.name} would have ${fromPreview.sizeAfter} players (limit ${maxRosterSize}).`
      );
    }
    if (toPreview.sizeAfter > maxRosterSize) {
      newIssues.push(
        `${toTeam.name} would have ${toPreview.sizeAfter} players (limit ${maxRosterSize}).`
      );
    }

    if (
      fromPreview.posAfter.F < minForwards ||
      fromPreview.posAfter.D < minDefensemen
    ) {
      const parts = [];
      if (fromPreview.posAfter.F < minForwards) {
        parts.push(
          `${fromPreview.posAfter.F} F (min ${minForwards}) for ${fromTeam.name}`
        );
      }
      if (fromPreview.posAfter.D < minDefensemen) {
        parts.push(
          `${fromPreview.posAfter.D} D (min ${minDefensemen}) for ${fromTeam.name}`
        );
      }
      newIssues.push(`Positional minimum issue: ${parts.join(", ")}.`);
    }

    if (
      toPreview.posAfter.F < minForwards ||
      toPreview.posAfter.D < minDefensemen
    ) {
      const parts = [];
      if (toPreview.posAfter.F < minForwards) {
        parts.push(
          `${toPreview.posAfter.F} F (min ${minForwards}) for ${toTeam.name}`
        );
      }
      if (toPreview.posAfter.D < minDefensemen) {
        parts.push(
          `${toPreview.posAfter.D} D (min ${minDefensemen}) for ${toTeam.name}`
        );
      }
      newIssues.push(`Positional minimum issue: ${parts.join(", ")}.`);
    }

    issues = newIssues;
  } catch (err) {
    console.error("[buildTradeImpactPreview] Failed to build preview", err);
    return { fromPreview: null, toPreview: null, issues: [] };
  }

  return { fromPreview, toPreview, issues };
}

// -------------------------------
//   Post-trade legality issues
// -------------------------------
export function buildPostTradeIssues({
  fromTeam,
  toTeam,
  fromName,
  toName,
  capLimit,
  maxRosterSize,
  minForwards,
  minDefensemen,
}) {
  const issues = [];

  // Cap checks
  const fromCap = totalCap(fromTeam);
  if (fromCap > capLimit) {
    issues.push(
      `${fromName} would be over the cap by $${fromCap - capLimit}.`
    );
  }

  const toCap = totalCap(toTeam);
  if (toCap > capLimit) {
    issues.push(
      `${toName} would be over the cap by $${toCap - capLimit}.`
    );
  }

  // Roster size checks
  const fromSize = (fromTeam.roster || []).length;
  if (fromSize > maxRosterSize) {
    issues.push(
      `${fromName} would have ${fromSize} players (limit ${maxRosterSize}).`
    );
  }

  const toSize = (toTeam.roster || []).length;
  if (toSize > maxRosterSize) {
    issues.push(
      `${toName} would have ${toSize} players (limit ${maxRosterSize}).`
    );
  }

  // Positional minimums
  const fromPos = countPositions(fromTeam);
  if (fromPos.F < minForwards || fromPos.D < minDefensemen) {
    const parts = [];
    if (fromPos.F < minForwards) {
      parts.push(`${fromPos.F} F (min ${minForwards}) for ${fromName}`);
    }
    if (fromPos.D < minDefensemen) {
      parts.push(`${fromPos.D} D (min ${minDefensemen}) for ${fromName}`);
    }
    issues.push(`Positional minimum issue: ${parts.join(", ")}.`);
  }

  const toPos = countPositions(toTeam);
  if (toPos.F < minForwards || toPos.D < minDefensemen) {
    const parts = [];
    if (toPos.F < minForwards) {
      parts.push(`${toPos.F} F (min ${minForwards}) for ${toName}`);
    }
    if (toPos.D < minDefensemen) {
      parts.push(`${toPos.D} D (min ${minDefensemen}) for ${toName}`);
    }
    issues.push(`Positional minimum issue: ${parts.join(", ")}.`);
  }

  return issues;
}

// -------------------------------
//   Apply a trade to two teams
// -------------------------------
export function applyTradeToTeams({ fromTeam, toTeam, trade }) {
  if (!fromTeam || !toTeam || !trade) {
    return {
      updatedFromTeam: fromTeam,
      updatedToTeam: toTeam,
    };
  }

  // Start with cloned copies so we never mutate the originals
  let previewFrom = {
    ...fromTeam,
    roster: [...(fromTeam.roster || [])],
    buyouts: [...(fromTeam.buyouts || [])],
  };
  let previewTo = {
    ...toTeam,
    roster: [...(toTeam.roster || [])],
    buyouts: [...(toTeam.buyouts || [])],
  };

  const offeredNames = trade.offeredPlayers || [];
  const requestedNames = trade.requestedPlayers || [];

  const offeredObjs = previewFrom.roster.filter((p) =>
    offeredNames.includes(p.name)
  );
  const requestedObjs = previewTo.roster.filter((p) =>
    requestedNames.includes(p.name)
  );

  // --- Salary retention (both sides) ---
  const retentionFromDraftMap = trade.retentionFrom || {};
  const retentionToDraftMap = trade.retentionTo || {};

  const retainedFromEntries = [];
  const retainedToEntries = [];

  // fromTeam retains salary on players it sends out
  const adjustedOffered = offeredObjs.map((player) => {
    const raw = retentionFromDraftMap[player.name];
    if (raw == null || raw === "") return player;

    const amt = Number(raw);
    if (!amt || amt <= 0) return player;

    const maxAllowed = Math.floor(player.salary * 0.5);
    const applied = Math.min(amt, maxAllowed);
    if (applied <= 0) return player;

    retainedFromEntries.push({
      player: `${player.name} (retained in trade)`,
      penalty: applied,
      retained: true,
    });

    return {
      ...player,
      salary: Math.max(0, player.salary - applied),
    };
  });

  // toTeam retains salary on players it is sending out (requested players)
  const adjustedRequested = requestedObjs.map((player) => {
    const raw = retentionToDraftMap[player.name];
    if (raw == null || raw === "") return player;

    const amt = Number(raw);
    if (!amt || amt <= 0) return player;

    const maxAllowed = Math.floor(player.salary * 0.5);
    const applied = Math.min(amt, maxAllowed);
    if (applied <= 0) return player;

    retainedToEntries.push({
      player: `${player.name} (retained in trade)`,
      penalty: applied,
      retained: true,
    });

    return {
      ...player,
      salary: Math.max(0, player.salary - applied),
    };
  });

  // Attach retained-salary buyouts to the correct teams
  previewFrom.buyouts = [
    ...(previewFrom.buyouts || []),
    ...retainedFromEntries,
  ];
  previewTo.buyouts = [
    ...(previewTo.buyouts || []),
    ...retainedToEntries,
  ];

  // Move players (after retention)
  previewFrom.roster = previewFrom.roster.filter(
    (p) => !offeredNames.includes(p.name)
  );
  previewTo.roster = previewTo.roster.filter(
    (p) => !requestedNames.includes(p.name)
  );

  // Adjusted salaries travel with the player
  previewFrom.roster.push(...adjustedRequested);
  previewTo.roster.push(...adjustedOffered);

  // --- Buyout penalty transfers ---
  const penaltyFromDraft =
    trade.penaltyFrom === "" || trade.penaltyFrom == null
      ? 0
      : Number(trade.penaltyFrom);

  const penaltyToDraft =
    trade.penaltyTo === "" || trade.penaltyTo == null
      ? 0
      : Number(trade.penaltyTo);

  let simFrom = previewFrom;
  let simTo = previewTo;

  if (penaltyFromDraft > 0) {
    const res = transferBuyoutPenalty(simFrom, simTo, penaltyFromDraft);
    simFrom = res.from;
    simTo = res.to;
  }

  if (penaltyToDraft > 0) {
    const res = transferBuyoutPenalty(simTo, simFrom, penaltyToDraft);
    simTo = res.from;
    simFrom = res.to;
  }

  return {
    updatedFromTeam: simFrom,
    updatedToTeam: simTo,
  };
}

// -------------------------------
//   Build a normalized trade object
// -------------------------------
export function buildTradeFromDraft({
  fromTeam,
  toTeam,
  offeredPlayers,
  requestedPlayers,
  penaltyFrom,
  penaltyTo,
  retentionFrom,
  retentionTo,
  existingTrades = [],
  createdAt,
}) {
  const created = createdAt ?? Date.now();
  const expiresAt = created + 7 * 24 * 60 * 60 * 1000; // 7 days

  // Simple unique-ish id
  const baseId = `trade-${created}`;
  const idAlreadyUsed = existingTrades.some((t) => t.id === baseId);
  const id = idAlreadyUsed
    ? `${baseId}-${existingTrades.length + 1}`
    : baseId;

  return {
    id,
    fromTeam,
    toTeam,
    offeredPlayers: [...(offeredPlayers || [])],
    requestedPlayers: [...(requestedPlayers || [])],
    penaltyFrom: Number(penaltyFrom) || 0,
    penaltyTo: Number(penaltyTo) || 0,
    retentionFrom: { ...(retentionFrom || {}) },
    retentionTo: { ...(retentionTo || {}) },
    status: "pending",
    createdAt: created,
    expiresAt,
  };
}

// -------------------------------
//   Trade visibility helpers
// -------------------------------

/**
 * Return the list of pending trades that the current user
 * should see in "My Pending Trades".
 */
export function getVisiblePendingTradesForUser(currentUser, tradeProposals) {
  if (!currentUser) return [];

  const pending = (tradeProposals || []).filter(
    (tr) => tr && tr.status === "pending"
  );

  if (currentUser.role === "commissioner") {
    // Commissioner sees all pending trades
    return pending;
  }

  if (currentUser.role === "manager") {
    return pending.filter(
      (tr) =>
        tr.fromTeam === currentUser.teamName ||
        tr.toTeam === currentUser.teamName
    );
  }

  // Any other role (viewer, etc.) sees nothing here
  return [];
}

// -------------------------------
//   Trade expiry / auto-cancel helpers
// -------------------------------

/**
 * Has this pending trade expired by the given time?
 * A trade only "expires" if:
 *  - status is "pending"
 *  - expiresAt exists
 *  - expiresAt is in the past
 */
export function isTradeExpired(tr, now = Date.now()) {
  if (!tr || tr.status !== "pending") return false;
  if (!tr.expiresAt) return false;
  return tr.expiresAt <= now;
}

// -------------------------------
//   Trade helpers
// -------------------------------

/**
 * Does this trade involve a specific player on a specific team?
 */
export function tradeInvolvesPlayer(tr, teamName, playerName) {
  if (!tr || !teamName || !playerName) return false;
  if (tr.status !== "pending") return false;

  const lowerPlayer = playerName.toLowerCase();

  // Player being OFFERED by this team
  if (
    tr.fromTeam === teamName &&
    tr.offeredPlayers?.some((p) => p.toLowerCase() === lowerPlayer)
  ) {
    return true;
  }

  // Player being REQUESTED from this team
  if (
    tr.toTeam === teamName &&
    tr.requestedPlayers?.some((p) => p.toLowerCase() === lowerPlayer)
  ) {
    return true;
  }

  return false;
}

/**
 * Get all pending trades that involve a given team + player.
 * This is your "auto-cancel these" list.
 */
export function getPendingTradesWithPlayer(
  tradeProposals,
  teamName,
  playerName
) {
  return (tradeProposals || []).filter((tr) =>
    tradeInvolvesPlayer(tr, teamName, playerName)
  );
}

// -------------------------------
//   Trade normalization helpers
// -------------------------------

export function normalizeTradeProposals(rawProposals) {
  const now = Date.now();

  return (rawProposals || []).map((tr) => {
    const createdAt = tr.createdAt || now;
    const expiresAt =
      tr.expiresAt || createdAt + 7 * 24 * 60 * 60 * 1000; // 7 days

    return {
      ...tr,
      status: tr.status || "pending",
      penaltyFrom:
        typeof tr.penaltyFrom === "number"
          ? tr.penaltyFrom
          : Number(tr.penaltyFrom || 0),
      penaltyTo:
        typeof tr.penaltyTo === "number"
          ? tr.penaltyTo
          : Number(tr.penaltyTo || 0),
      createdAt,
      expiresAt,
      // support old "retention" field from earlier versions
      retentionFrom: tr.retentionFrom || tr.retention || {},
      retentionTo: tr.retentionTo || {},
    };
  });
}

// -------------------------------
//   Trade validation helper
// -------------------------------

export function validateTradeDraft({
  tradeDraft,
  fromTeamObj,
  toTeamObj,
  existingProposals = [],
  maxRetentionSpots = 3,
}) {
  if (!tradeDraft) {
    return {
      ok: false,
      errorMessage: "No trade draft in progress.",
    };
  }

  const {
    fromTeam,
    toTeam,
    requestedPlayers = [],
    offeredPlayers = [],
    penaltyFrom,
    penaltyTo,
    retentionFrom = {},
    retentionTo = {},
  } = tradeDraft;

  // Basic checks
  if (!requestedPlayers.length || !offeredPlayers.length) {
    return {
      ok: false,
      errorMessage:
        "Select at least one player you want to receive and at least one you are offering.",
    };
  }

  if (!fromTeamObj || !toTeamObj) {
    return {
      ok: false,
      errorMessage:
        "One of the teams in this trade no longer exists.",
    };
  }

  // --- Buyout penalty validation ---

  const maxPenaltyFrom = totalBuyoutPenalty(fromTeamObj);
  const maxPenaltyTo = totalBuyoutPenalty(toTeamObj);

  let penaltyFromAmount = 0;
  let penaltyToAmount = 0;

  // Penalty you SEND (fromTeam -> toTeam)
  if (penaltyFrom !== undefined && penaltyFrom !== "") {
    const numericFrom = Number(penaltyFrom);
    if (isNaN(numericFrom) || numericFrom < 0) {
      return {
        ok: false,
        errorMessage:
          "Please enter a valid non-negative buyout penalty to include from your team, or leave it blank.",
      };
    }
    if (numericFrom > maxPenaltyFrom) {
      return {
        ok: false,
        errorMessage: `You can only include up to $${maxPenaltyFrom} of your current buyout penalties in this trade.`,
      };
    }
    penaltyFromAmount = numericFrom;
  }

  // Penalty you REQUEST (toTeam -> fromTeam)
  if (penaltyTo !== undefined && penaltyTo !== "") {
    const numericTo = Number(penaltyTo);
    if (isNaN(numericTo) || numericTo < 0) {
      return {
        ok: false,
        errorMessage:
          "Please enter a valid non-negative buyout penalty you are requesting from the other team, or leave it blank.",
      };
    }
    if (numericTo > maxPenaltyTo) {
      return {
        ok: false,
        errorMessage: `${toTeam} currently only has $${maxPenaltyTo} in buyout penalties.`,
      };
    }
    penaltyToAmount = numericTo;
  }

  // --- Salary retention validation ---

  const validatedRetentionFrom = {};
  const validatedRetentionTo = {};

  // 1) Retention on players YOU are sending out (fromTeam -> toTeam)
  for (const [playerName, raw] of Object.entries(retentionFrom || {})) {
    if (raw === "" || raw == null) continue;

    const amount = Number(raw);
    if (isNaN(amount) || amount < 0) {
      return {
        ok: false,
        errorMessage: `Invalid retention amount for ${playerName}. Please enter a non-negative number.`,
      };
    }

    if (!offeredPlayers.includes(playerName)) {
      return {
        ok: false,
        errorMessage: `You can only retain salary on players you are trading away. ${playerName} is not in your offered players.`,
      };
    }

    const fromPlayerObj = (fromTeamObj.roster || []).find(
      (p) => p.name === playerName
    );
    if (!fromPlayerObj) {
      return {
        ok: false,
        errorMessage: `Could not find ${playerName} on your roster for retention calculation.`,
      };
    }

    const maxRetain = Math.floor(fromPlayerObj.salary * 0.5);
    if (amount > maxRetain) {
      return {
        ok: false,
        errorMessage: `You can retain at most 50% of ${playerName}'s salary ($${maxRetain}).`,
      };
    }

    if (amount > 0) {
      validatedRetentionFrom[playerName] = amount;
    }
  }

  // 2) Retention you are REQUESTING from the other team (toTeam keeps some cap)
  for (const [playerName, raw] of Object.entries(retentionTo || {})) {
    if (raw === "" || raw == null) continue;

    const amount = Number(raw);
    if (isNaN(amount) || amount < 0) {
      return {
        ok: false,
        errorMessage: `Invalid requested retention amount for ${playerName}. Please enter a non-negative number.`,
      };
    }

    if (!requestedPlayers.includes(playerName)) {
      return {
        ok: false,
        errorMessage: `You can only request retention on players you are receiving. ${playerName} is not in your requested players.`,
      };
    }

    const toPlayerObj = (toTeamObj.roster || []).find(
      (p) => p.name === playerName
    );
    if (!toPlayerObj) {
      return {
        ok: false,
        errorMessage: `Could not find ${playerName} on the other roster for retention calculation.`,
      };
    }

    const maxRetain = Math.floor(toPlayerObj.salary * 0.5);
    if (amount > maxRetain) {
      return {
        ok: false,
        errorMessage: `${toTeam} can retain at most 50% of ${playerName}'s salary ($${maxRetain}).`,
      };
    }

    if (amount > 0) {
      validatedRetentionTo[playerName] = amount;
    }
  }

  // --- Retention spots limit (max 3 per team) ---

  const existingRetentionSpotsFrom = countRetentionSpots(fromTeamObj);
  const newRetentionPlayersFrom = new Set(
    Object.keys(validatedRetentionFrom)
  );
  const totalRetentionSpotsFrom =
    existingRetentionSpotsFrom + newRetentionPlayersFrom.size;

  if (totalRetentionSpotsFrom > maxRetentionSpots) {
    return {
      ok: false,
      errorMessage:
        `${fromTeam} would exceed the maximum of ${maxRetentionSpots} ` +
        `retained-salary players (currently ${existingRetentionSpotsFrom}, ` +
        `adding ${newRetentionPlayersFrom.size}).`,
    };
  }

  const existingRetentionSpotsTo = countRetentionSpots(toTeamObj);
  const newRetentionPlayersTo = new Set(
    Object.keys(validatedRetentionTo)
  );
  const totalRetentionSpotsTo =
    existingRetentionSpotsTo + newRetentionPlayersTo.size;

  if (totalRetentionSpotsTo > maxRetentionSpots) {
    return {
      ok: false,
      errorMessage:
        `${toTeam} would exceed the maximum of ${maxRetentionSpots} ` +
        `retained-salary players (currently ${existingRetentionSpotsTo}, ` +
        `adding ${newRetentionPlayersTo.size}).`,
    };
  }

  // --- Prevent players already in another pending trade ---

  const lowerOffered = offeredPlayers.map((name) =>
    name.toLowerCase()
  );
  const lowerRequested = requestedPlayers.map((name) =>
    name.toLowerCase()
  );

  const conflictingTrade = (existingProposals || []).find((tr) => {
    if (tr.status !== "pending") return false;

    const offeredConflictFrom =
      tr.fromTeam === fromTeam &&
      tr.offeredPlayers.some((p) =>
        lowerOffered.includes(p.toLowerCase())
      );

    const requestedConflictFrom =
      tr.toTeam === fromTeam &&
      tr.requestedPlayers.some((p) =>
        lowerOffered.includes(p.toLowerCase())
      );

    const offeredConflictTo =
      tr.fromTeam === toTeam &&
      tr.offeredPlayers.some((p) =>
        lowerRequested.includes(p.toLowerCase())
      );

    const requestedConflictTo =
      tr.toTeam === toTeam &&
      tr.requestedPlayers.some((p) =>
        lowerRequested.includes(p.toLowerCase())
      );

    return (
      offeredConflictFrom ||
      requestedConflictFrom ||
      offeredConflictTo ||
      requestedConflictTo
    );
  });

  if (conflictingTrade) {
    return {
      ok: false,
      errorMessage:
        "One or more of the players in this trade are already part of another pending trade.\n\n" +
        "Resolve or cancel those trades before creating a new one involving the same players.",
    };
  }

  // ✅ All good
  return {
    ok: true,
    penaltyFromAmount,
    penaltyToAmount,
    validatedRetentionFrom,
    validatedRetentionTo,
  };
}
// --------------------------------------
//   Accepting a trade by ID (full flow)
// --------------------------------------
export function acceptTradeById({
  tradeId,
  teams,
  tradeProposals,
  capLimit,
  maxRosterSize,
  minForwards,
  minDefensemen,
}) {
  const now = Date.now();

  console.log("[acceptTradeById] called with tradeId:", tradeId);

  // 1) Find the trade
  const trade = (tradeProposals || []).find((tr) => tr.id === tradeId);
  if (!trade) {
    console.warn("[acceptTradeById] trade not found");
    return { ok: false, error: "This trade no longer exists." };
  }

  if (trade.status !== "pending") {
    console.warn("[acceptTradeById] trade not pending:", trade.status);
    return { ok: false, error: "This trade is no longer pending." };
  }

  // 2) Check expiry
  if (isTradeExpired(trade)) {
    console.log("[acceptTradeById] trade is expired, marking cancelled");

    const updatedTrades = (tradeProposals || []).map((tr) =>
      tr.id === trade.id
        ? { ...tr, status: "cancelled", expired: true }
        : tr
    );

    const logEntries = [
      {
        type: "tradeExpired",
        id: now + Math.random(),
        fromTeam: trade.fromTeam,
        toTeam: trade.toTeam,
        requestedPlayers: [...(trade.requestedPlayers || [])],
        offeredPlayers: [...(trade.offeredPlayers || [])],
        timestamp: now,
      },
    ];

    return {
      ok: false,
      error: "This trade has already expired.",
      tradeProposals: updatedTrades,
      logEntries,
    };
  }

  // 3) Find current team objects
  const fromTeam = (teams || []).find((t) => t.name === trade.fromTeam);
  const toTeam = (teams || []).find((t) => t.name === trade.toTeam);

  if (!fromTeam || !toTeam) {
    console.warn("[acceptTradeById] missing fromTeam or toTeam");
    return {
      ok: false,
      error: "One of the teams in this trade no longer exists.",
    };
  }

  // 4) Apply the trade using your core helper (correct call)
  const applyResult =
    applyTradeToTeams({ fromTeam, toTeam, trade }) || {};

  const {
    updatedFromTeam,
    updatedToTeam,
    fromAfter: rawFromAfter,
    toAfter: rawToAfter,
    fromTeam: legacyFrom,
    toTeam: legacyTo,
  } = applyResult;

  const fromAfter =
    updatedFromTeam || rawFromAfter || legacyFrom || fromTeam;
  const toAfter =
    updatedToTeam || rawToAfter || legacyTo || toTeam;

  if (!fromAfter || !toAfter) {
    console.error(
      "[acceptTradeById] applyTradeToTeams did not return usable teams",
      applyResult
    );
    return {
      ok: false,
      error:
        "Internal error applying this trade (missing updated team data).",
    };
  }

  // 5) Run post-trade legality checks (cap, roster size, positions)
// NOTE: We NO LONGER block acceptance. We only warn + log.
const issues = buildPostTradeIssues({
  fromTeam: fromAfter,
  toTeam: toAfter,
  fromName: trade.fromTeam,
  toName: trade.toTeam,
  capLimit,
  maxRosterSize,
  minForwards,
  minDefensemen,
});

const warningIssues = Array.isArray(issues) ? issues : [];


  // 6) Build updated teams array
  const updatedTeams = (teams || []).map((t) => {
    if (t.name === fromAfter.name) return fromAfter;
    if (t.name === toAfter.name) return toAfter;
    return t;
  });

  // 7) Mark this trade as accepted
  const updatedTrades = (tradeProposals || []).map((tr) =>
    tr.id === trade.id ? { ...tr, status: "accepted" } : tr
  );

    // 7) Build detailed per-player info for logging
  const offeredDetails = (trade.offeredPlayers || []).map((name) => {
    const p =
      (fromTeam?.roster || []).find((pl) => pl.name === name) || null;
    const baseSalary = p ? Number(p.salary) || 0 : 0;
    const retainedAmount =
      Number(trade.retentionFrom?.[name] || 0) || 0;
    const newSalary = Math.max(0, baseSalary - retainedAmount);

    return {
      name,
      fromTeam: trade.fromTeam,
      toTeam: trade.toTeam,
      baseSalary,
      retainedAmount,
      newSalary,
    };
  });

  const requestedDetails = (trade.requestedPlayers || []).map((name) => {
    const p =
      (toTeam?.roster || []).find((pl) => pl.name === name) || null;
    const baseSalary = p ? Number(p.salary) || 0 : 0;
    const retainedAmount =
      Number(trade.retentionTo?.[name] || 0) || 0;
    const newSalary = Math.max(0, baseSalary - retainedAmount);

    return {
      name,
      fromTeam: trade.toTeam,
      toTeam: trade.fromTeam,
      baseSalary,
      retainedAmount,
      newSalary,
    };
  });

    // 8) Build log entry
  // 8) Build log entry
const logEntries = [
  {
    type: "tradeAccepted",
    id: now + Math.random(),
    fromTeam: trade.fromTeam,
    toTeam: trade.toTeam,
    requestedPlayers: [...(trade.requestedPlayers || [])],
    offeredPlayers: [...(trade.offeredPlayers || [])],
    penaltyFrom: trade.penaltyFrom ?? 0,
    penaltyTo: trade.penaltyTo ?? 0,
    retentionFrom: trade.retentionFrom || {},
    retentionTo: trade.retentionTo || {},
    offeredDetails,
    requestedDetails,
    timestamp: now,
  },
];

// If accepting the trade creates roster/cap issues, we log them as warnings (but still accept)
if (warningIssues.length > 0) {
  logEntries.unshift({
    type: "illegalRosterWarning",
    id: now + Math.random(),
    context: "tradeAccepted",
    fromTeam: trade.fromTeam,
    toTeam: trade.toTeam,
    tradeId: trade.id,
    issues: warningIssues,
    timestamp: now,
  });
}



 return {
  ok: true,
  teams: updatedTeams,
  tradeProposals: updatedTrades,
  logEntries,
  warnings: warningIssues, // <-- NEW
};
}


// -------------------------------
//   Trade rejection / cancellation
// -------------------------------

/**
 * Mark a pending trade as REJECTED and create a log entry.
 */
export function rejectTradeById(tradeProposals, leagueLog, tradeId, now = Date.now()) {
  const trades = tradeProposals || [];
  const log = leagueLog || [];

  const target = trades.find((tr) => tr.id === tradeId);
  if (!target || target.status !== "pending") {
    // Nothing to do
    return {
      nextTradeProposals: trades,
      nextLeagueLog: log,
    };
  }

  const nextTradeProposals = trades.map((tr) =>
    tr.id === tradeId && tr.status === "pending"
      ? { ...tr, status: "rejected" }
      : tr
  );

  const logEntry = {
    type: "tradeRejected",
    id: now + Math.random(),
    fromTeam: target.fromTeam,
    toTeam: target.toTeam,
    offeredPlayers: [...(target.offeredPlayers || [])],
    requestedPlayers: [...(target.requestedPlayers || [])],
    timestamp: now,
  };

  const nextLeagueLog = [logEntry, ...log];

  return {
    nextTradeProposals,
    nextLeagueLog,
  };
}

/**
 * Mark a pending trade as CANCELLED and create a log entry.
 * Used when a manager manually cancels a trade from "My Pending Trades".
 * Also works for future auto-cancel use (buyouts, player removed, etc.)
 */
export function cancelTradeById(
  tradeProposals,
  leagueLog,
  tradeId,
  options = {},
  now = Date.now()
) {
  const trades = tradeProposals || [];
  const log = leagueLog || [];

  const {
    autoCancelled = false, // true for auto-cancel from buyout/roster change
    reason = null,         // e.g. "playerRemoved"
    cancelledBy = null,    // e.g. manager name/team
  } = options || {};

  const target = trades.find((tr) => tr.id === tradeId);
  if (!target || target.status !== "pending") {
    // Nothing to do
    return {
      nextTradeProposals: trades,
      nextLeagueLog: log,
    };
  }

  const nextTradeProposals = trades.map((tr) =>
    tr.id === tradeId && tr.status === "pending"
      ? { ...tr, status: "cancelled" }
      : tr
  );

  const logEntry = {
    type: "tradeCancelled",
    id: now + Math.random(),
    fromTeam: target.fromTeam,
    toTeam: target.toTeam,
    offeredPlayers: [...(target.offeredPlayers || [])],
    requestedPlayers: [...(target.requestedPlayers || [])],
    autoCancelled,
    reason,
    cancelledBy,
    timestamp: now,
  };

  const nextLeagueLog = [logEntry, ...log];

  return {
    nextTradeProposals,
    nextLeagueLog,
  };
}

// -------------------------------
//   Trade expiry (7-day timeout)
// -------------------------------

/**
 * Auto-expire any pending trades whose expiresAt has passed.
 * Uses isTradeExpired(tr, now) helper.
 */
export function expirePendingTrades(
  tradeProposals,
  leagueLog,
  now = Date.now()
) {
  const trades = tradeProposals || [];
  const log = leagueLog || [];

  // Find all pending trades that are now expired
  const expired = trades.filter(
    (tr) => tr.status === "pending" && isTradeExpired(tr, now)
  );

  // Nothing to do → return original references so caller can no-op
  if (expired.length === 0) {
    return {
      nextTradeProposals: trades,
      nextLeagueLog: log,
    };
  }

  // Mark them as cancelled + expired
  const nextTradeProposals = trades.map((tr) =>
    tr.status === "pending" && isTradeExpired(tr, now)
      ? { ...tr, status: "cancelled", expired: true }
      : tr
  );

  // Create log entries for each expired trade
  const newLogs = expired.map((tr) => ({
    type: "tradeExpired",
    id: now + Math.random(),
    fromTeam: tr.fromTeam,
    toTeam: tr.toTeam,
    requestedPlayers: [...(tr.requestedPlayers || [])],
    offeredPlayers: [...(tr.offeredPlayers || [])],
    timestamp: now,
  }));

  const nextLeagueLog = [...newLogs, ...log];

  return {
    nextTradeProposals,
    nextLeagueLog,
  };
}

// -------------------------------
//   Cancel all trades for a player
// -------------------------------

/**
 * Cancel all pending trades that involve a specific team + player.
 * Returns:
 *  - nextTradeProposals
 *  - nextLeagueLog
 *  - affectedTrades: the list of trades that were cancelled
 */
export function cancelTradesForPlayer(
  tradeProposals,
  leagueLog,
  teamName,
  playerName,
  options = {}
) {
  const { reason = "playerRemoved", autoCancelled = true } = options;

  // Which trades are affected?
  const affected = getPendingTradesWithPlayer(
    tradeProposals,
    teamName,
    playerName
  );

  if (!affected.length) {
    return {
      nextTradeProposals: tradeProposals,
      nextLeagueLog: leagueLog,
      affectedTrades: [],
    };
  }

  let nextTrades = tradeProposals;
  let nextLog = leagueLog;

  // Run each affected trade through cancelTradeById so logs stay consistent
  for (const tr of affected) {
    const { nextTradeProposals, nextLeagueLog } = cancelTradeById(
      nextTrades,
      nextLog,
      tr.id,
      { autoCancelled, reason }
    );
    nextTrades = nextTradeProposals;
    nextLog = nextLeagueLog;
  }

  return {
    nextTradeProposals: nextTrades,
    nextLeagueLog: nextLog,
    affectedTrades: affected,
  };
}

// -------------------------------
//   Auctions / bids helpers
// -------------------------------

/**
 * Resolve all active auctions (free-agent bids) and return:
 *  - nextTeams: updated team array
 *  - nextFreeAgents: updated bids array with resolved flags
 *  - newLogs: league log entries (FA signings)
 */
export function resolveAuctions({
  teams,
  freeAgents,
  capLimit,
  maxRosterSize,
  minForwards,
  minDefensemen,
  now = Date.now(),
}) {
  const originalTeams = teams || [];
  const bids = freeAgents || [];

  // Clone teams so we never mutate originals
  let nextTeams = originalTeams.map((t) => ({
    ...t,
    roster: [...(t.roster || [])],
    buyouts: [...(t.buyouts || [])],
  }));

  // Only unresolved bids participate in this run
  const activeBids = bids.filter((b) => !b.resolved);
  if (activeBids.length === 0) {
    return {
      nextTeams: originalTeams,
      nextFreeAgents: bids,
      newLogs: [],
    };
  }

  // Group bids by player (case-insensitive)
  const bidsByPlayer = new Map();
  for (const bid of activeBids) {
    const key = (bid.player || "").toLowerCase();
    if (!key) continue;
    if (!bidsByPlayer.has(key)) {
      bidsByPlayer.set(key, []);
    }
    bidsByPlayer.get(key).push(bid);
  }

  const winningBidIds = new Set();
  const resolvedBidIds = new Set();
  const newLogs = [];

  // For each player, pick a winner (highest bid, then earliest timestamp)
  for (const [, playerBids] of bidsByPlayer.entries()) {
    const sorted = [...playerBids].sort((a, b) => {
      const aAmt = Number(a.amount) || 0;
      const bAmt = Number(b.amount) || 0;
      if (bAmt !== aAmt) return bAmt - aAmt;

      const aTs = a.timestamp || 0;
      const bTs = b.timestamp || 0;
      return aTs - bTs;
    });

    const winner = sorted[0];
    if (!winner) continue;

    const playerName = winner.player;
    const winningTeamName = winner.team;

    // Mark all bids for this player as resolved (winner + losers)
    for (const bid of playerBids) {
      resolvedBidIds.add(bid.id);
    }

    // Find the winning team in nextTeams
    const teamIdx = nextTeams.findIndex((t) => t.name === winningTeamName);
    if (teamIdx === -1) {
      // Team disappeared? Resolve bids, but don't award the player
      continue;
    }

    const team = nextTeams[teamIdx];
    const newSalary = Number(winner.amount) || 0;
    const position = winner.position || "F";

    const newPlayer = {
      name: playerName,
      salary: newSalary,
      position,
    };

    // Simulate adding this player
     const candidateTeam = {
  ...team,
  roster: sortRosterStandard([...(team.roster || []), newPlayer]),
};


    // ✅ Always award the player, even if it makes the roster illegal.
    // Your existing UI that uses isTeamIllegal(...) will flag the team later.
    nextTeams = nextTeams.map((t, idx) =>
      idx === teamIdx ? candidateTeam : t
    );

    // Mark winning bid
    winningBidIds.add(winner.id);

    // One league log entry per successful signing
    newLogs.push({
      type: "faSigned",
      id: now + Math.random(),
      team: winningTeamName,
      player: playerName,
      amount: newSalary,
      position,
      timestamp: now,
    });
  }

  // Updated freeAgents: mark every touched bid as resolved, with winningTeam flags
  const nextFreeAgents = bids.map((bid) => {
    if (!resolvedBidIds.has(bid.id)) {
      return bid;
    }
    const isWinner = winningBidIds.has(bid.id);
    return {
      ...bid,
      resolved: true,
      winningTeam: isWinner ? bid.team : null,
    };
  });

  return {
    nextTeams,
    nextFreeAgents,
    newLogs,
  };
}


/**
 * Remove a single bid entry by id.
 * Returns:
 *  - nextFreeAgents
 *  - removedBid (so the caller can log if desired)
 */
export function removeAuctionBidById(freeAgents, bidId) {
  const bids = freeAgents || [];
  const removedBid = bids.find((b) => b.id === bidId) || null;
  const nextFreeAgents = bids.filter((b) => b.id !== bidId);

  return {
    nextFreeAgents,
    removedBid,
  };
}

// -------------------------------
//   Free-agent bid creation / validation
// -------------------------------

export function placeFreeAgentBid({
  teams,
  freeAgents,
  biddingTeamName,
  playerName,
  position,
  rawAmount,
  capLimit,
  maxRosterSize,
  minForwards,
  minDefensemen,
  now = Date.now(),
}) {
  const allTeams = teams || [];
  const bids = freeAgents || [];

  const team = allTeams.find((t) => t.name === biddingTeamName);
  if (!team) {
    return {
      ok: false,
      errorMessage: "Your team could not be found.",
    };
  }

  const trimmedName = (playerName || "").trim();
  if (!trimmedName) {
    return {
      ok: false,
      errorMessage: "Please enter a player name to bid on.",
    };
  }

  const lowerName = trimmedName.toLowerCase();

  // 🚫 Prevent bidding on players who are already on any roster
  const isOnRoster = allTeams.some((t) =>
    (t.roster || []).some(
      (p) => (p.name || "").toLowerCase() === lowerName
    )
  );

  if (isOnRoster) {
    return {
      ok: false,
      errorMessage: `${trimmedName} is already on a roster and cannot be put up for auction.`,
    };
  }

  // Amount validation
  const amount = Number(rawAmount);
  if (isNaN(amount) || amount <= 0) {
    return {
      ok: false,
      errorMessage: "Please enter a valid positive bid amount.",
    };
  }

  // Is there already an active auction for this player?
  const existingActive = bids.find(
    (fa) => !fa.resolved && fa.player.toLowerCase() === lowerName
  );
  const hasActiveAuction = !!existingActive;

  // Compute this week's cutoff based on "now"
  const baseDate = typeof now === "number" ? new Date(now) : now;
  const nextSunday = getNextSundayDeadline(baseDate);
  const newAuctionCutoff = getNewAuctionCutoff(nextSunday);

  // After the cutoff, you can only bid on *existing* auctions
  if (!hasActiveAuction && baseDate > newAuctionCutoff) {
    return {
      ok: false,
      errorMessage:
        "New free agent auctions are closed for this week's run.\n\n" +
        "You can still place bids on existing auctions until Sunday at 4:00 PM,\n" +
        "but new players can only be put up for auction for the next week.",
    };
  }

  // Soft cap check: WARN but do not block
  const teamCap = totalCap(team);
  const totalAfterBid = teamCap + amount;

  let warningMessage = null;
  if (totalAfterBid > capLimit) {
    const overBy = totalAfterBid - capLimit;
    warningMessage =
      `Note: if you win this bid, ${biddingTeamName} will be OVER the cap by $${overBy}. ` +
      `You'll need to buy out players to get back under $${capLimit}.`;
  }

  // Use position from existing auction if present; else provided position; default "F"
  const existingEntry =
    existingActive ||
    bids.find((f) => f.player.toLowerCase() === lowerName);

  const finalPosition = existingEntry?.position || position || "F";

  const timestamp =
    typeof now === "number" ? now : now.getTime();

  const newEntry = {
    id: `bid-${timestamp}-${Math.random().toString(36).slice(2)}`,
    player: trimmedName,
    team: biddingTeamName,
    amount,
    position: finalPosition,
    assigned: false,
    resolved: false,
    timestamp,
  };

  const nextFreeAgents = [...bids, newEntry];

  return {
    ok: true,
    nextFreeAgents,
    logEntry: null, // we only log at resolve time
    warningMessage,
  };
}


