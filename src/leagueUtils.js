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

// -------------------------------
//   Buyout lock after FA signing
// -------------------------------

// 14 days (in ms)
export const BUYOUT_LOCK_MS = 14 * 24 * 60 * 60 * 1000;

export function isBuyoutLocked(player, now = Date.now()) {
  const until = Number(player?.buyoutLockedUntil || 0);
  return until > now;
}

export function getBuyoutLockDaysLeft(player, now = Date.now()) {
  const until = Number(player?.buyoutLockedUntil || 0);
  if (!until || until <= now) return 0;
  return Math.ceil((until - now) / (24 * 60 * 60 * 1000));
}

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
// Tie-breaker: name A -> Z
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

// Count forwards / defensemen (IR players don’t count)
export const countPositions = (team) => {
  const counts = { F: 0, D: 0 };
  if (!team || !Array.isArray(team.roster)) return counts;

  team.roster.forEach((p) => {
    if (p.onIR) return;
    const pos = p.position || "F";
    if (pos === "D") counts.D++;
    else counts.F++;
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
      .map((b) => String(b.player || "").trim().toLowerCase())
      .filter(Boolean)
  );

  return players.size;
};

// Move buyout penalty from one team to another.
export function transferBuyoutPenalty(fromTeamObj, toTeamObj, amount) {
  const amt = Number(amount) || 0;

  if (!fromTeamObj || !toTeamObj || amt <= 0) {
    return { from: fromTeamObj, to: toTeamObj, transferred: 0 };
  }

  let remaining = amt;

  // Clone buyouts
  const fromBuyouts = (fromTeamObj.buyouts || []).map((b) => ({
    ...b,
    penalty: Number(b.penalty) || 0,
  }));

  for (let i = 0; i < fromBuyouts.length && remaining > 0; i++) {
    const p = fromBuyouts[i].penalty;
    if (p <= remaining) {
      remaining -= p;
      fromBuyouts[i].penalty = 0;
    } else {
      fromBuyouts[i].penalty = p - remaining;
      remaining = 0;
    }
  }

  const actualTransferred = amt - remaining;

  const cleanedFrom = fromBuyouts.filter((b) => (Number(b.penalty) || 0) > 0);

  const toBuyouts = [...(toTeamObj.buyouts || [])];
  if (actualTransferred > 0) {
        toBuyouts.push({
      player: `Traded penalty from ${fromTeamObj.name}`,
      penalty: actualTransferred,
      retained: false,
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
  if (timeRemainingMs == null) return "calculating...";

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

  const { capLimit, maxRosterSize, minForwards, minDefensemen } = options;

  const activeRoster = (team.roster || []).filter((p) => !p.onIR);
  const cap = totalCap(team);
  const size = activeRoster.length;

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
    if (!fromTeam || !toTeam || (!offeredPlayers?.length && !requestedPlayers?.length)) {
      return { fromPreview: null, toPreview: null, issues: [] };
    }

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

    const offeredObjs = previewFrom.roster.filter((p) => offeredNames.includes(p.name));
    const requestedObjs = previewTo.roster.filter((p) => requestedNames.includes(p.name));

    const retentionFromMap = retentionFrom || {};
    const retentionToMap = retentionTo || {};

    const retainedFromEntries = [];
    const retainedToEntries = [];

    const adjustedOffered = offeredObjs.map((player) => {
      const raw = retentionFromMap[player.name];
      if (raw == null || raw === "") return player;

      const amt = Number(raw);
      if (!amt || amt <= 0) return player;

      const maxAllowed = Math.ceil((Number(player.salary) || 0) * 0.5);
      const applied = Math.min(amt, maxAllowed);
      if (applied <= 0) return player;

            retainedFromEntries.push({
        player: player.name, // stable identity for retention-spot counting
        note: "retained in trade",
        penalty: applied,
        retained: true,
      });


      return { ...player, salary: Math.max(0, (Number(player.salary) || 0) - applied) };
    });

    const adjustedRequested = requestedObjs.map((player) => {
      const raw = retentionToMap[player.name];
      if (raw == null || raw === "") return player;

      const amt = Number(raw);
      if (!amt || amt <= 0) return player;

      const maxAllowed = Math.ceil((Number(player.salary) || 0) * 0.5);
      const applied = Math.min(amt, maxAllowed);
      if (applied <= 0) return player;

            retainedToEntries.push({
        player: player.name, // stable identity for retention-spot counting
        note: "retained in trade",
        penalty: applied,
        retained: true,
      });


      return { ...player, salary: Math.max(0, (Number(player.salary) || 0) - applied) };
    });

    previewFrom.buyouts = [...(previewFrom.buyouts || []), ...retainedFromEntries];
    previewTo.buyouts = [...(previewTo.buyouts || []), ...retainedToEntries];

    previewFrom.roster = previewFrom.roster.filter((p) => !offeredNames.includes(p.name));
    previewTo.roster = previewTo.roster.filter((p) => !requestedNames.includes(p.name));

    previewFrom.roster.push(...adjustedRequested);
    previewTo.roster.push(...adjustedOffered);

    // ✅ Sort preview rosters
    previewFrom.roster = sortRosterStandard(previewFrom.roster);
    previewTo.roster = sortRosterStandard(previewTo.roster);

    const penaltyFromNum = penaltyFrom === "" || penaltyFrom == null ? 0 : Number(penaltyFrom);
    const penaltyToNum = penaltyTo === "" || penaltyTo == null ? 0 : Number(penaltyTo);

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

    const newIssues = [];

    if (fromPreview.capAfter > capLimit) {
      newIssues.push(`${fromTeam.name} would be over the cap by $${fromPreview.capAfter - capLimit}.`);
    }
    if (toPreview.capAfter > capLimit) {
      newIssues.push(`${toTeam.name} would be over the cap by $${toPreview.capAfter - capLimit}.`);
    }

    if (fromPreview.sizeAfter > maxRosterSize) {
      newIssues.push(`${fromTeam.name} would have ${fromPreview.sizeAfter} players (limit ${maxRosterSize}).`);
    }
    if (toPreview.sizeAfter > maxRosterSize) {
      newIssues.push(`${toTeam.name} would have ${toPreview.sizeAfter} players (limit ${maxRosterSize}).`);
    }

    if (fromPreview.posAfter.F < minForwards || fromPreview.posAfter.D < minDefensemen) {
      const parts = [];
      if (fromPreview.posAfter.F < minForwards) parts.push(`${fromPreview.posAfter.F} F (min ${minForwards}) for ${fromTeam.name}`);
      if (fromPreview.posAfter.D < minDefensemen) parts.push(`${fromPreview.posAfter.D} D (min ${minDefensemen}) for ${fromTeam.name}`);
      newIssues.push(`Positional minimum issue: ${parts.join(", ")}.`);
    }

    if (toPreview.posAfter.F < minForwards || toPreview.posAfter.D < minDefensemen) {
      const parts = [];
      if (toPreview.posAfter.F < minForwards) parts.push(`${toPreview.posAfter.F} F (min ${minForwards}) for ${toTeam.name}`);
      if (toPreview.posAfter.D < minDefensemen) parts.push(`${toPreview.posAfter.D} D (min ${minDefensemen}) for ${toTeam.name}`);
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

  const fromCap = totalCap(fromTeam);
  if (fromCap > capLimit) issues.push(`${fromName} would be over the cap by $${fromCap - capLimit}.`);

  const toCap = totalCap(toTeam);
  if (toCap > capLimit) issues.push(`${toName} would be over the cap by $${toCap - capLimit}.`);

  const fromSize = (fromTeam.roster || []).length;
  if (fromSize > maxRosterSize) issues.push(`${fromName} would have ${fromSize} players (limit ${maxRosterSize}).`);

  const toSize = (toTeam.roster || []).length;
  if (toSize > maxRosterSize) issues.push(`${toName} would have ${toSize} players (limit ${maxRosterSize}).`);

  const fromPos = countPositions(fromTeam);
  if (fromPos.F < minForwards || fromPos.D < minDefensemen) {
    const parts = [];
    if (fromPos.F < minForwards) parts.push(`${fromPos.F} F (min ${minForwards}) for ${fromName}`);
    if (fromPos.D < minDefensemen) parts.push(`${fromPos.D} D (min ${minDefensemen}) for ${fromName}`);
    issues.push(`Positional minimum issue: ${parts.join(", ")}.`);
  }

  const toPos = countPositions(toTeam);
  if (toPos.F < minForwards || toPos.D < minDefensemen) {
    const parts = [];
    if (toPos.F < minForwards) parts.push(`${toPos.F} F (min ${minForwards}) for ${toName}`);
    if (toPos.D < minDefensemen) parts.push(`${toPos.D} D (min ${minDefensemen}) for ${toName}`);
    issues.push(`Positional minimum issue: ${parts.join(", ")}.`);
  }

  return issues;
}

// -------------------------------
//   Apply a trade to two teams
// -------------------------------
export function applyTradeToTeams({ fromTeam, toTeam, trade }) {
  if (!fromTeam || !toTeam || !trade) {
    return { updatedFromTeam: fromTeam, updatedToTeam: toTeam };
  }

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

  const offeredObjs = previewFrom.roster.filter((p) => offeredNames.includes(p.name));
  const requestedObjs = previewTo.roster.filter((p) => requestedNames.includes(p.name));

  const retentionFromDraftMap = trade.retentionFrom || {};
  const retentionToDraftMap = trade.retentionTo || {};

  const retainedFromEntries = [];
  const retainedToEntries = [];

  const adjustedOffered = offeredObjs.map((player) => {
    const raw = retentionFromDraftMap[player.name];
    if (raw == null || raw === "") return player;

    const amt = Number(raw);
    if (!amt || amt <= 0) return player;

    const maxAllowed = Math.ceil((Number(player.salary) || 0) * 0.5);
    const applied = Math.min(amt, maxAllowed);
    if (applied <= 0) return player;

        retainedFromEntries.push({
      player: player.name, // stable identity for retention-spot counting
      note: "retained in trade",
      penalty: applied,
      retained: true,
    });


    return { ...player, salary: Math.max(0, (Number(player.salary) || 0) - applied) };
  });

  const adjustedRequested = requestedObjs.map((player) => {
    const raw = retentionToDraftMap[player.name];
    if (raw == null || raw === "") return player;

    const amt = Number(raw);
    if (!amt || amt <= 0) return player;

    const maxAllowed = Math.ceil((Number(player.salary) || 0) * 0.5);
    const applied = Math.min(amt, maxAllowed);
    if (applied <= 0) return player;

        retainedToEntries.push({
      player: player.name, // stable identity for retention-spot counting
      note: "retained in trade",
      penalty: applied,
      retained: true,
    });

    return { ...player, salary: Math.max(0, (Number(player.salary) || 0) - applied) };
  });

  previewFrom.buyouts = [...(previewFrom.buyouts || []), ...retainedFromEntries];
  previewTo.buyouts = [...(previewTo.buyouts || []), ...retainedToEntries];

  previewFrom.roster = previewFrom.roster.filter((p) => !offeredNames.includes(p.name));
  previewTo.roster = previewTo.roster.filter((p) => !requestedNames.includes(p.name));

  previewFrom.roster.push(...adjustedRequested);
  previewTo.roster.push(...adjustedOffered);

  // ✅ THIS is the “new code”: always keep rosters sorted after the trade
  previewFrom.roster = sortRosterStandard(previewFrom.roster);
  previewTo.roster = sortRosterStandard(previewTo.roster);

  const penaltyFromDraft =
    trade.penaltyFrom === "" || trade.penaltyFrom == null ? 0 : Number(trade.penaltyFrom);
  const penaltyToDraft =
    trade.penaltyTo === "" || trade.penaltyTo == null ? 0 : Number(trade.penaltyTo);

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

  // (Optional but nice) ensure sorting is still true after penalty transfers
  simFrom = { ...simFrom, roster: sortRosterStandard(simFrom.roster || []) };
  simTo = { ...simTo, roster: sortRosterStandard(simTo.roster || []) };

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
  const expiresAt = created + 7 * 24 * 60 * 60 * 1000;

  const baseId = `trade-${created}`;
  const idAlreadyUsed = existingTrades.some((t) => t.id === baseId);
  const id = idAlreadyUsed ? `${baseId}-${existingTrades.length + 1}` : baseId;

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
export function getVisiblePendingTradesForUser(currentUser, tradeProposals) {
  if (!currentUser) return [];

  const pending = (tradeProposals || []).filter((tr) => tr && tr.status === "pending");

  if (currentUser.role === "commissioner") return pending;

  if (currentUser.role === "manager") {
    return pending.filter(
      (tr) => tr.fromTeam === currentUser.teamName || tr.toTeam === currentUser.teamName
    );
  }

  return [];
}

// -------------------------------
//   Trade expiry / auto-cancel helpers
// -------------------------------
export function isTradeExpired(tr, now = Date.now()) {
  if (!tr || tr.status !== "pending") return false;
  if (!tr.expiresAt) return false;
  return tr.expiresAt <= now;
}

// -------------------------------
//   Trade helpers
// -------------------------------
export function tradeInvolvesPlayer(tr, teamName, playerName) {
  if (!tr || !teamName || !playerName) return false;
  if (tr.status !== "pending") return false;

  const norm = (s) => String(s || "").trim().toLowerCase();
  const teamKey = norm(teamName);
  const playerKey = norm(playerName);
  if (!teamKey || !playerKey) return false;

  const fromKey = norm(tr.fromTeam);
  const toKey = norm(tr.toTeam);

  if (
    fromKey === teamKey &&
    (tr.offeredPlayers || []).some((p) => norm(p) === playerKey)
  ) {
    return true;
  }

  if (
    toKey === teamKey &&
    (tr.requestedPlayers || []).some((p) => norm(p) === playerKey)
  ) {
    return true;
  }

  return false;
}


export function getPendingTradesWithPlayer(tradeProposals, teamName, playerName) {
  return (tradeProposals || []).filter((tr) => tradeInvolvesPlayer(tr, teamName, playerName));
}

// -------------------------------
//   Trade normalization helpers
// -------------------------------
export function normalizeTradeProposals(rawProposals) {
  const now = Date.now();

  return (rawProposals || []).map((tr) => {
    const createdAt = tr.createdAt || now;
    const expiresAt = tr.expiresAt || createdAt + 7 * 24 * 60 * 60 * 1000;

    return {
      ...tr,
      status: tr.status || "pending",
      penaltyFrom: typeof tr.penaltyFrom === "number" ? tr.penaltyFrom : Number(tr.penaltyFrom || 0),
      penaltyTo: typeof tr.penaltyTo === "number" ? tr.penaltyTo : Number(tr.penaltyTo || 0),
      createdAt,
      expiresAt,
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
    return { ok: false, errorMessage: "No trade draft in progress." };
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

  if (!requestedPlayers.length || !offeredPlayers.length) {
    return {
      ok: false,
      errorMessage:
        "Select at least one player you want to receive and at least one you are offering.",
    };
  }

  if (!fromTeamObj || !toTeamObj) {
    return { ok: false, errorMessage: "One of the teams in this trade no longer exists." };
  }

    const norm = (s) => String(s || "").trim().toLowerCase();

  const offeredNorm = new Set((offeredPlayers || []).map(norm));
  const requestedNorm = new Set((requestedPlayers || []).map(norm));

  const maxPenaltyFrom = totalBuyoutPenalty(fromTeamObj);
  const maxPenaltyTo = totalBuyoutPenalty(toTeamObj);

  let penaltyFromAmount = 0;
  let penaltyToAmount = 0;

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

  const validatedRetentionFrom = {};
  const validatedRetentionTo = {};

  // Retention on players YOU send out
  for (const [playerName, raw] of Object.entries(retentionFrom || {})) {
    if (raw === "" || raw == null) continue;

    const amount = Number(raw);
    if (isNaN(amount) || amount < 0) {
      return {
        ok: false,
        errorMessage: `Invalid retention amount for ${playerName}. Please enter a non-negative number.`,
      };
    }

    if (!offeredNorm.has(norm(playerName))) {
      return {
        ok: false,
        errorMessage: `You can only retain salary on players you are trading away. ${playerName} is not in your offered players.`,
      };
    }

    const fromPlayerObj = (fromTeamObj.roster || []).find(
      (p) => norm(p?.name) === norm(playerName)
    );
    if (!fromPlayerObj) {
      return {
        ok: false,
        errorMessage: `Could not find ${playerName} on your roster for retention calculation.`,
      };
    }

    const maxRetain = Math.ceil((Number(fromPlayerObj.salary) || 0) * 0.5);
    if (amount > maxRetain) {
      return {
        ok: false,
        errorMessage: `You can retain at most 50% of ${playerName}'s salary ($${maxRetain}).`,
      };
    }

    if (amount > 0) validatedRetentionFrom[playerName] = amount;
  }

  // Retention you REQUEST from the other team (on players you receive)
  for (const [playerName, raw] of Object.entries(retentionTo || {})) {
    if (raw === "" || raw == null) continue;

    const amount = Number(raw);
    if (isNaN(amount) || amount < 0) {
      return {
        ok: false,
        errorMessage: `Invalid requested retention amount for ${playerName}. Please enter a non-negative number.`,
      };
    }

    if (!requestedNorm.has(norm(playerName))) {
      return {
        ok: false,
        errorMessage: `You can only request retention on players you are receiving. ${playerName} is not in your requested players.`,
      };
    }

    const toPlayerObj = (toTeamObj.roster || []).find(
      (p) => norm(p?.name) === norm(playerName)
    );
    if (!toPlayerObj) {
      return {
        ok: false,
        errorMessage: `Could not find ${playerName} on the other roster for retention calculation.`,
      };
    }

    const maxRetain = Math.ceil((Number(toPlayerObj.salary) || 0) * 0.5);
    if (amount > maxRetain) {
      return {
        ok: false,
        errorMessage: `${toTeam} can retain at most 50% of ${playerName}'s salary ($${maxRetain}).`,
      };
    }

    if (amount > 0) validatedRetentionTo[playerName] = amount;
  }

  const existingRetentionSpotsFrom = countRetentionSpots(fromTeamObj);
  const newRetentionPlayersFrom = new Set(Object.keys(validatedRetentionFrom));
  const totalRetentionSpotsFrom = existingRetentionSpotsFrom + newRetentionPlayersFrom.size;
  if (totalRetentionSpotsFrom > maxRetentionSpots) {
    return {
      ok: false,
      errorMessage:
        `${fromTeam} would exceed the maximum of ${maxRetentionSpots} retained-salary players ` +
        `(currently ${existingRetentionSpotsFrom}, adding ${newRetentionPlayersFrom.size}).`,
    };
  }

  const existingRetentionSpotsTo = countRetentionSpots(toTeamObj);
  const newRetentionPlayersTo = new Set(Object.keys(validatedRetentionTo));
  const totalRetentionSpotsTo = existingRetentionSpotsTo + newRetentionPlayersTo.size;
  if (totalRetentionSpotsTo > maxRetentionSpots) {
    return {
      ok: false,
      errorMessage:
        `${toTeam} would exceed the maximum of ${maxRetentionSpots} retained-salary players ` +
        `(currently ${existingRetentionSpotsTo}, adding ${newRetentionPlayersTo.size}).`,
    };
  }

 

    const conflictingTrade = (existingProposals || []).find((tr) => {
    if (tr?.status !== "pending") return false;

    const trOffered = tr.offeredPlayers || [];
    const trRequested = tr.requestedPlayers || [];

    const offeredConflictFrom =
      tr.fromTeam === fromTeam &&
      trOffered.some((p) => offeredNorm.has(norm(p)));

    const requestedConflictFrom =
      tr.toTeam === fromTeam &&
      trRequested.some((p) => offeredNorm.has(norm(p)));

    const offeredConflictTo =
      tr.fromTeam === toTeam &&
      trOffered.some((p) => requestedNorm.has(norm(p)));

    const requestedConflictTo =
      tr.toTeam === toTeam &&
      trRequested.some((p) => requestedNorm.has(norm(p)));

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

  return { ok: true, penaltyFromAmount, penaltyToAmount, validatedRetentionFrom, validatedRetentionTo };
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

  const trade = (tradeProposals || []).find((tr) => tr.id === tradeId);
  if (!trade) return { ok: false, error: "This trade no longer exists." };
  if (trade.status !== "pending") return { ok: false, error: "This trade is no longer pending." };

  if (isTradeExpired(trade)) {
    const updatedTrades = (tradeProposals || []).map((tr) =>
      tr.id === trade.id ? { ...tr, status: "cancelled", expired: true } : tr
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

    return { ok: false, error: "This trade has already expired.", tradeProposals: updatedTrades, logEntries };
  }

  const fromTeam = (teams || []).find((t) => t.name === trade.fromTeam);
  const toTeam = (teams || []).find((t) => t.name === trade.toTeam);
  if (!fromTeam || !toTeam) return { ok: false, error: "One of the teams in this trade no longer exists." };

  // ✅ applyTradeToTeams now returns sorted rosters, so acceptTradeById doesn't need to sort
  const applyResult = applyTradeToTeams({ fromTeam, toTeam, trade }) || {};
  const { updatedFromTeam, updatedToTeam } = applyResult;

  const fromAfter = updatedFromTeam || fromTeam;
  const toAfter = updatedToTeam || toTeam;

  if (!fromAfter || !toAfter) {
    return { ok: false, error: "Internal error applying this trade (missing updated team data)." };
  }

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

  const updatedTeams = (teams || []).map((t) => {
    if (t.name === fromAfter.name) return fromAfter;
    if (t.name === toAfter.name) return toAfter;
    return t;
  });

  const updatedTrades = (tradeProposals || []).map((tr) =>
    tr.id === trade.id ? { ...tr, status: "accepted" } : tr
  );

  const offeredDetails = (trade.offeredPlayers || []).map((name) => {
    const p = (fromTeam?.roster || []).find((pl) => pl.name === name) || null;
    const baseSalary = p ? Number(p.salary) || 0 : 0;
    const retainedAmount = Number(trade.retentionFrom?.[name] || 0) || 0;
    const newSalary = Math.max(0, baseSalary - retainedAmount);

    return { name, fromTeam: trade.fromTeam, toTeam: trade.toTeam, baseSalary, retainedAmount, newSalary };
  });

  const requestedDetails = (trade.requestedPlayers || []).map((name) => {
    const p = (toTeam?.roster || []).find((pl) => pl.name === name) || null;
    const baseSalary = p ? Number(p.salary) || 0 : 0;
    const retainedAmount = Number(trade.retentionTo?.[name] || 0) || 0;
    const newSalary = Math.max(0, baseSalary - retainedAmount);

    return { name, fromTeam: trade.toTeam, toTeam: trade.fromTeam, baseSalary, retainedAmount, newSalary };
  });

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

  return { ok: true, teams: updatedTeams, tradeProposals: updatedTrades, logEntries, warnings: warningIssues };
}

// -------------------------------
//   Trade rejection / cancellation
// -------------------------------
export function rejectTradeById(tradeProposals, leagueLog, tradeId, now = Date.now()) {
  const trades = tradeProposals || [];
  const log = leagueLog || [];

  const target = trades.find((tr) => tr.id === tradeId);
  if (!target || target.status !== "pending") {
    return { nextTradeProposals: trades, nextLeagueLog: log };
  }

  const nextTradeProposals = trades.map((tr) =>
    tr.id === tradeId && tr.status === "pending" ? { ...tr, status: "rejected" } : tr
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

  return { nextTradeProposals, nextLeagueLog: [logEntry, ...log] };
}

export function cancelTradeById(
  tradeProposals,
  leagueLog,
  tradeId,
  options = {},
  now = Date.now()
) {
  const trades = tradeProposals || [];
  const log = leagueLog || [];

  const { autoCancelled = false, reason = null, cancelledBy = null } = options || {};

  const target = trades.find((tr) => tr.id === tradeId);
  if (!target || target.status !== "pending") {
    return { nextTradeProposals: trades, nextLeagueLog: log };
  }

  const nextTradeProposals = trades.map((tr) =>
    tr.id === tradeId && tr.status === "pending" ? { ...tr, status: "cancelled" } : tr
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

  return { nextTradeProposals, nextLeagueLog: [logEntry, ...log] };
}

export function expirePendingTrades(tradeProposals, leagueLog, now = Date.now()) {
  const trades = tradeProposals || [];
  const log = leagueLog || [];

  const expired = trades.filter((tr) => tr.status === "pending" && isTradeExpired(tr, now));
  if (expired.length === 0) {
    return { nextTradeProposals: trades, nextLeagueLog: log };
  }

  const nextTradeProposals = trades.map((tr) =>
    tr.status === "pending" && isTradeExpired(tr, now)
      ? { ...tr, status: "cancelled", expired: true }
      : tr
  );

  const newLogs = expired.map((tr) => ({
    type: "tradeExpired",
    id: now + Math.random(),
    fromTeam: tr.fromTeam,
    toTeam: tr.toTeam,
    requestedPlayers: [...(tr.requestedPlayers || [])],
    offeredPlayers: [...(tr.offeredPlayers || [])],
    timestamp: now,
  }));

  return { nextTradeProposals, nextLeagueLog: [...newLogs, ...log] };
}

export function cancelTradesForPlayer(
  tradeProposals,
  leagueLog,
  teamName,
  playerName,
  options = {}
) {
  const { reason = "playerRemoved", autoCancelled = true } = options;

  const affected = getPendingTradesWithPlayer(tradeProposals, teamName, playerName);
  if (!affected.length) {
    return { nextTradeProposals: tradeProposals, nextLeagueLog: leagueLog, affectedTrades: [] };
  }

  let nextTrades = tradeProposals;
  let nextLog = leagueLog;

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

  return { nextTradeProposals: nextTrades, nextLeagueLog: nextLog, affectedTrades: affected };
}

// -------------------------------
//   Auctions / bids helpers
// -------------------------------
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

  let nextTeams = originalTeams.map((t) => ({
    ...t,
    roster: [...(t.roster || [])],
    buyouts: [...(t.buyouts || [])],
  }));

    const activeBids = (bids || []).filter((b) => {
  if (b?.resolved) return false;
  const key = String(b?.auctionKey || b?.player || "").trim();
  const team = String(b?.team || "").trim();
  const amt = Number(b?.amount) || 0;
  return Boolean(b?.id && key && team && amt > 0);
});

if (activeBids.length === 0) {
  // Drop anything already resolved. Keep everything else as-is.
  const nextFreeAgents = (bids || []).filter((b) => !b?.resolved);
  return { nextTeams: originalTeams, nextFreeAgents, newLogs: [] };
}


  const bidsByPlayer = new Map();

 for (const bid of activeBids) {
const key = String(bid?.auctionKey || bid?.player || "").trim().toLowerCase();

  if (!key) continue;
  if (!bidsByPlayer.has(key)) bidsByPlayer.set(key, []);
  bidsByPlayer.get(key).push(bid);
}


  const resolvedBidIds = new Set();
  const newLogs = [];

  for (const [, playerBids] of bidsByPlayer.entries()) {
    const sorted = [...playerBids].sort((a, b) => {
  const aAmt = Number(a.amount) || 0;
  const bAmt = Number(b.amount) || 0;
  if (bAmt !== aAmt) return bAmt - aAmt;

  // ✅ Tie-break: who bid first for this auction (not who edited most recently)
  const aTs = Number(a.firstTimestamp ?? a.timestamp ?? 0) || 0;
  const bTs = Number(b.firstTimestamp ?? b.timestamp ?? 0) || 0;
  return aTs - bTs;
});


    const winner = sorted[0];
    if (!winner) continue;

       const playerName = winner.player;
    const winningTeamName = winner.team;

    // ✅ Anti-bluff pricing (team-normalized so spacing/casing can't create fake "other teams")
    const normTeam = (t) => String(t || "").trim().toLowerCase();
    const winningTeamKey = normTeam(winningTeamName);

    const distinctTeams = new Set(
      playerBids
        .map((b) => normTeam(b?.team))
        .filter(Boolean)
    ).size;

    let pricePaid = Number(winner.amount) || 0;

    // If only one team bid on this player: pay most recent bid amount (current behavior)
    if (distinctTeams <= 1) {
      pricePaid = Number(winner.amount) || 0;
    } else {
      // Multiple teams bid: winner may pay their LOWER original bid if it still would have won
      const otherBids = playerBids.filter((b) => normTeam(b?.team) !== winningTeamKey);

      const othersHighest = otherBids.reduce((max, b) => {
        const amt = Number(b.amount) || 0;
        return amt > max ? amt : max;
      }, 0);

      const winnerMinRaw = Number(winner.minAmount ?? winner.amount);
      const winnerMin =
        Number.isFinite(winnerMinRaw) && winnerMinRaw > 0
          ? winnerMinRaw
          : Number(winner.amount) || 0;

      if (winnerMin > othersHighest) {
        // Winner's original/lowest bid still beats all others
        pricePaid = winnerMin;
      } else if (winnerMin === othersHighest) {
        // Tie case: winner only "still would win" if they were earlier than the best other team
        const winnerTs = Number(winner.firstTimestamp ?? winner.timestamp ?? 0) || 0;

        let bestOtherTs = Infinity;
        for (const b of otherBids) {
          const amt = Number(b.amount) || 0;
          if (amt !== othersHighest) continue;

          const ts = Number(b.firstTimestamp ?? b.timestamp ?? 0) || 0;
          if (ts < bestOtherTs) bestOtherTs = ts;
        }

        if (winnerTs && bestOtherTs !== Infinity && winnerTs < bestOtherTs) {
          pricePaid = winnerMin;
        } else {
          pricePaid = Number(winner.amount) || 0;
        }
      } else {
        // WinnerMin is not enough to win, so they pay their current bid
        pricePaid = Number(winner.amount) || 0;
      }
    }


    for (const bid of playerBids) resolvedBidIds.add(bid.id);

        const teamIdx = nextTeams.findIndex(
      (t) => String(t?.name || "").trim().toLowerCase() === winningTeamKey
    );
    if (teamIdx === -1) continue;


    const team = nextTeams[teamIdx];
const newSalary = Number(pricePaid) || 0;
    const position = winner.position || "F";

const newPlayer = {
  name: playerName,
  salary: newSalary,
  position,
  buyoutLockedUntil: now + BUYOUT_LOCK_MS,
};

    const candidateTeam = {
      ...team,
      roster: sortRosterStandard([...(team.roster || []), newPlayer]),
    };

    nextTeams = nextTeams.map((t, idx) => (idx === teamIdx ? candidateTeam : t));

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

// ✅ Delete all bids for auctions that were resolved this rollover
// Also drop any already-resolved bids to keep storage clean.
const nextFreeAgents = bids.filter(
  (bid) => !bid?.resolved && !resolvedBidIds.has(bid.id)
);

return { nextTeams, nextFreeAgents, newLogs };


}

export function removeAuctionBidById(freeAgents, bidId) {
  const bids = freeAgents || [];
  const removedBid = bids.find((b) => b.id === bidId) || null;
  const nextFreeAgents = bids.filter((b) => b.id !== bidId);
  return { nextFreeAgents, removedBid };
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
const norm = (s) => String(s || "").trim();

  const team = allTeams.find((t) => t.name === biddingTeamName);
  if (!team) return { ok: false, errorMessage: "Your team could not be found." };

 const normalizeName = (s) => String(s || "").trim().toLowerCase();
const normTeam = (s) => String(s || "").trim();

const trimmedName = (playerName || "").trim();
if (!trimmedName) return { ok: false, errorMessage: "Please enter a player name to bid on." };

const key = normalizeName(trimmedName);

const isOnRoster = allTeams.some((t) =>
  (t.roster || []).some((p) => normalizeName(p?.name) === key)
);

  if (isOnRoster) {
    return {
      ok: false,
      errorMessage: `${trimmedName} is already on a roster and cannot be put up for auction.`,
    };
  }

  const amount = Number(rawAmount);
  if (isNaN(amount) || amount <= 0) {
    return { ok: false, errorMessage: "Please enter a valid positive bid amount." };
  }

  // normalize once and use everywhere
const lowerName = key; // key is already normalizeName(trimmedName)

const existingActive = bids.find((fa) => {
  if (fa?.resolved) return false;
  const faKey = String(fa?.auctionKey || normalizeName(fa?.player)).trim().toLowerCase();
  return faKey === lowerName;
});

const hasActiveAuction = !!existingActive;
const createdNewAuction = !hasActiveAuction;


  const baseDate = typeof now === "number" ? new Date(now) : now;
  const nextSunday = getNextSundayDeadline(baseDate);
  const newAuctionCutoff = getNewAuctionCutoff(nextSunday);

  if (!hasActiveAuction && baseDate > newAuctionCutoff) {
    return {
      ok: false,
      errorMessage:
        "New free agent auctions are closed for this week's run.\n\n" +
        "You can still place bids on existing auctions until Sunday at 4:00 PM,\n" +
        "but new players can only be put up for auction for the next week.",
    };
  }

  const teamCap = totalCap(team);
  const totalAfterBid = teamCap + amount;

  let warningMessage = null;
  if (totalAfterBid > capLimit) {
    const overBy = totalAfterBid - capLimit;
    warningMessage =
      `Note: if you win this bid, ${biddingTeamName} will be OVER the cap by $${overBy}. ` +
      `You'll need to buy out players to get back under $${capLimit}.`;
  }

const existingEntry =
  existingActive ||
  bids.find((f) => {
    const fKey = String(f?.auctionKey || normalizeName(f?.player))
      .trim()
      .toLowerCase();
    return fKey === lowerName;
  });

  const finalPosition = existingEntry?.position || position || "F";

  const timestamp = typeof now === "number" ? now : now.getTime();

// ✅ Find this team's existing ACTIVE bid for this auction (if any)
const existingTeamBid = bids.find((b) => {
  if (b?.resolved) return false;

  const sameAuction =
    String(b?.auctionKey || normalizeName(b?.player)).trim().toLowerCase() === lowerName;

const sameTeam = normTeam(b?.team) === normTeam(biddingTeamName);
  return sameAuction && sameTeam;
});

// ✅ Preserve "who bid first" tie-break + preserve the lowest bid they've made
const firstTimestamp =
  Number(existingTeamBid?.firstTimestamp ?? existingTeamBid?.timestamp ?? timestamp) || timestamp;

const prevMin =
  Number(existingTeamBid?.minAmount ?? existingTeamBid?.amount ?? amount) || amount;

const minAmount = Math.min(prevMin, amount);

const newEntry = {
  id: `bid-${timestamp}-${Math.random().toString(36).slice(2)}`,
  auctionKey: lowerName, // ✅ canonical key for this auction/player
  player: trimmedName,
  team: biddingTeamName,
  amount, // current/max willingness to pay
  minAmount, // ✅ lowest bid they've placed this auction
  firstTimestamp, // ✅ when they first bid this auction
  position: finalPosition,
  assigned: false,
  resolved: false,
  timestamp, // last updated time (still useful for UI/debug)
};



// ✅ Enforce: one ACTIVE bid per team per player
// If this team already has an active bid for this player, replace it.
// (We only touch bids where !resolved, and same player + same team)
const nextFreeAgents = (() => {
  const next = [];

  for (const b of bids) {
const sameAuction =
  String(b?.auctionKey || normalizeName(b?.player)).trim().toLowerCase() === lowerName;
const sameTeam = normTeam(b?.team) === normTeam(biddingTeamName);
    const active = !b?.resolved;

if (active && sameAuction && sameTeam) continue;

    next.push(b);
  }

  next.push(newEntry);
  return next;
})();

  const logEntry = createdNewAuction
  ? {
      type: "faAuctionStarted",
      id: now + Math.random(),
      player: trimmedName,
      position: finalPosition,
      timestamp,
    }
  : null;


  return { ok: true, nextFreeAgents, logEntry, warningMessage };
}
