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

  if (candidate <= d) candidate.setDate(candidate.getDate() + 7);
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

// Total cap = roster (excluding IR) + buyout penalties + retained salary penalties
export const totalCap = (team) => {
  if (!team) return 0;

  const rosterCap = (team.roster || []).reduce((sum, p) => {
    if (p?.onIR) return sum;
    return sum + (Number(p?.salary) || 0);
  }, 0);

  const allBuyouts = team.buyouts || [];

  const pureBuyoutCap = allBuyouts
    .filter((b) => !b?.retained)
    .reduce((sum, b) => sum + (Number(b?.penalty) || 0), 0);

  const retainedCap = allBuyouts
    .filter((b) => !!b?.retained)
    .reduce((sum, b) => sum + (Number(b?.penalty) || 0), 0);

  return rosterCap + pureBuyoutCap + retainedCap;
};

// Total buyout penalty (excludes retained salary)
export const totalBuyoutPenalty = (team) => {
  if (!team) return 0;
  return (team.buyouts || [])
    .filter((b) => !b?.retained)
    .reduce((sum, b) => sum + (Number(b?.penalty) || 0), 0);
};

// Total retained salary cap hit (separate bucket)
export const totalRetainedSalary = (team) => {
  if (!team) return 0;
  return (team.buyouts || [])
    .filter((b) => !!b?.retained)
    .reduce((sum, b) => sum + (Number(b?.penalty) || 0), 0);
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

// -------------------------------
// Phase 2: one-time roster playerId backfill
// -------------------------------
const normName = (s) => String(s || "").trim().toLowerCase();

export function applyRosterIdBackfill({
  teams,
  nameToIdMap,
  playerApi,
  updateNameFromDb = false,
}) {
  const inputTeams = Array.isArray(teams) ? teams : [];
  const mapObj = nameToIdMap || {};
  const byName =
    playerApi && playerApi.byName && typeof playerApi.byName === "object"
      ? playerApi.byName
      : null;

  const report = {
    totalMissingBefore: 0,
    filledByMap: 0,
    filledByDbNameMatch: 0,
    stillMissingAfter: 0,
    unknownNames: [],
  };

  const nextTeams = inputTeams.map((t) => {
    const roster = Array.isArray(t?.roster) ? t.roster : [];
    const nextRoster = roster.map((p) => {
      const hasPid = Number.isFinite(Number(p?.playerId)) && Number(p.playerId) > 0;
      if (hasPid) return p;

      report.totalMissingBefore += 1;

      const key = normName(p?.name);
      let pid = null;

      const mapped = mapObj[key];
      if (Number.isFinite(Number(mapped)) && Number(mapped) > 0) {
        pid = Number(mapped);
        report.filledByMap += 1;
      } else if (byName && byName[key] && Number.isFinite(Number(byName[key]?.id))) {
        pid = Number(byName[key].id);
        report.filledByDbNameMatch += 1;
      }

      if (!pid) {
        report.stillMissingAfter += 1;
        if (key) report.unknownNames.push({ team: t?.name || "Unknown Team", name: p?.name || "" });
        return p;
      }

      const next = { ...p, playerId: pid };

      if (updateNameFromDb && byName && byName[key]?.name) {
        next.name = byName[key].name;
      }

      return next;
    });

    return { ...t, roster: nextRoster };
  });

  return { nextTeams, report };
}



// -------------------------------
// Phase 2: token helpers for trades
// Supports tokens like "Connor McDavid" OR "id:8478402"
// -------------------------------
const norm = (s) => String(s || "").trim().toLowerCase();

const parseIdToken = (token) => {
  const s = String(token || "").trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  if (!lower.startsWith("id:")) return null;
  const raw = s.slice(3).trim();
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.trunc(n);
};

const playerIdFromRosterObj = (p) => {
  const n = Number(p?.playerId);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.trunc(n);
};

// If token is id:####, matches by playerId; else matches normalized name
const tokenMatchesRosterPlayer = (token, p) => {
  if (!token || !p) return false;

  const tokPid = parseIdToken(token);
  if (tokPid) {
    const pid = playerIdFromRosterObj(p);
    return pid ? pid === tokPid : false;
  }

  return norm(p?.name) === norm(token);
};

// If both are id tokens, compare ids; else compare normalized strings
const tokenEqualsToken = (a, b) => {
  const aPid = parseIdToken(a);
  const bPid = parseIdToken(b);
  if (aPid && bPid) return aPid === bPid;
  return norm(a) === norm(b);
};

// Build lookup sets from token arrays for faster checks
const buildTokenSets = (tokens) => {
  const ids = new Set();
  const names = new Set();
  for (const t of tokens || []) {
    const pid = parseIdToken(t);
    if (pid) ids.add(pid);
    else {
      const k = norm(t);
      if (k) names.add(k);
    }
  }
  return { ids, names };
};

const rosterPlayerMatchesTokenSets = (p, sets) => {
  const pid = playerIdFromRosterObj(p);
  if (pid && sets.ids.has(pid)) return true;
  const nk = norm(p?.name);
  if (nk && sets.names.has(nk)) return true;
  return false;
};

// Convert a roster player into a "best token"
// Prefer id token when available; fallback to name token.
const rosterPlayerToBestToken = (p) => {
  const pid = playerIdFromRosterObj(p);
  if (pid) return `id:${pid}`;
  return String(p?.name || "").trim();
};

// -------------------------------
//   Roster counts / legality
// -------------------------------

// Count forwards / defensemen (IR players don’t count)
export const countPositions = (team) => {
  const counts = { F: 0, D: 0 };
  if (!team || !Array.isArray(team.roster)) return counts;

  team.roster.forEach((p) => {
    if (p?.onIR) return;
    const pos = p?.position || "F";
    if (pos === "D") counts.D++;
    else counts.F++;
  });

  return counts;
};

// Count how many retained-salary *players* exist on this team
// Uses playerId if present on the buyout entry; otherwise falls back to string label
export const countRetentionSpots = (team) => {
  if (!team) return 0;

  const buyouts = team.buyouts || [];
  const ids = new Set();
  const names = new Set();

  for (const b of buyouts) {
    if (!b?.retained) continue;
    if (!(Number(b?.penalty) > 0)) continue;

    const pid = Number(b?.playerId);
    if (Number.isFinite(pid) && pid > 0) {
      ids.add(Math.trunc(pid));
      continue;
    }

    const k = norm(b?.player);
    if (k) names.add(k);
  }

  return ids.size + names.size;
};

// -------------------------------
//   Buyout penalty transfer helper
// -------------------------------

// Move buyout penalty from one team to another.
export function transferBuyoutPenalty(fromTeamObj, toTeamObj, amount) {
  const amt = Number(amount) || 0;
  if (!fromTeamObj || !toTeamObj || amt <= 0) {
    return { from: fromTeamObj, to: toTeamObj, transferred: 0 };
  }

  let remaining = amt;

  const fromBuyouts = (fromTeamObj.buyouts || []).map((b) => ({
    ...b,
    penalty: Number(b?.penalty) || 0,
  }));

  for (let i = 0; i < fromBuyouts.length && remaining > 0; i++) {
    const p = Number(fromBuyouts[i]?.penalty) || 0;
    if (p <= 0) continue;

    if (p <= remaining) {
      remaining -= p;
      fromBuyouts[i].penalty = 0;
    } else {
      fromBuyouts[i].penalty = p - remaining;
      remaining = 0;
    }
  }

  const actualTransferred = amt - remaining;
  const cleanedFrom = fromBuyouts.filter((b) => (Number(b?.penalty) || 0) > 0);

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

  const { capLimit, maxRosterSize, minForwards, minDefensemen } = options || {};

  const activeRoster = (team.roster || []).filter((p) => !p?.onIR);
  const cap = totalCap(team);
  const size = activeRoster.length;

  const pos = countPositions({ ...team, roster: activeRoster });

  if (capLimit != null && cap > capLimit) return true;
  if (maxRosterSize != null && size > maxRosterSize) return true;
  if (minForwards != null && pos.F < minForwards) return true;
  if (minDefensemen != null && pos.D < minDefensemen) return true;

  return false;
}

// -------------------------------
//   Trades
// -------------------------------

// Build a normalized trade object
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
  const idAlreadyUsed = (existingTrades || []).some((t) => t?.id === baseId);
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

// Visibility helpers
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

// Expiry
export function isTradeExpired(tr, now = Date.now()) {
  if (!tr || tr.status !== "pending") return false;
  if (!tr.expiresAt) return false;
  return tr.expiresAt <= now;
}

// Does a pending trade involve this player token for this team?
export function tradeInvolvesPlayer(tr, teamName, playerToken) {
  if (!tr || !teamName || !playerToken) return false;
  if (tr.status !== "pending") return false;

  const teamKey = norm(teamName);
  if (!teamKey) return false;

  const fromKey = norm(tr.fromTeam);
  const toKey = norm(tr.toTeam);

  if (fromKey === teamKey) {
    return (tr.offeredPlayers || []).some((p) => tokenEqualsToken(p, playerToken));
  }

  if (toKey === teamKey) {
    return (tr.requestedPlayers || []).some((p) => tokenEqualsToken(p, playerToken));
  }

  return false;
}

export function getPendingTradesWithPlayer(tradeProposals, teamName, playerToken) {
  return (tradeProposals || []).filter((tr) => tradeInvolvesPlayer(tr, teamName, playerToken));
}

// Normalize incoming proposals (durable defaults)
export function normalizeTradeProposals(rawProposals) {
  const now = Date.now();

  return (rawProposals || []).map((tr) => {
    const createdAt = tr?.createdAt || now;
    const expiresAt = tr?.expiresAt || createdAt + 7 * 24 * 60 * 60 * 1000;

    return {
      ...tr,
      status: tr?.status || "pending",
      penaltyFrom: typeof tr?.penaltyFrom === "number" ? tr.penaltyFrom : Number(tr?.penaltyFrom || 0),
      penaltyTo: typeof tr?.penaltyTo === "number" ? tr.penaltyTo : Number(tr?.penaltyTo || 0),
      createdAt,
      expiresAt,
      retentionFrom: tr?.retentionFrom || tr?.retention || {},
      retentionTo: tr?.retentionTo || {},
    };
  });
}

// Resolve retention value for a given roster player from a retention map.
// Supports map keys as "id:####" OR player name.
const getRetentionForPlayer = (player, retentionMap) => {
  const pid = playerIdFromRosterObj(player);
  const keyId = pid ? `id:${pid}` : null;
  const keyName = String(player?.name || "").trim();

  const m = retentionMap || {};
  if (keyId && m[keyId] != null && m[keyId] !== "") return Number(m[keyId]);
  if (m[keyName] != null && m[keyName] !== "") return Number(m[keyName]);

  return 0;
};

// Trade impact preview helper (pure, no writes)
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

    const offeredSets = buildTokenSets(offeredPlayers || []);
    const requestedSets = buildTokenSets(requestedPlayers || []);

    const offeredObjs = previewFrom.roster.filter((p) => rosterPlayerMatchesTokenSets(p, offeredSets));
    const requestedObjs = previewTo.roster.filter((p) => rosterPlayerMatchesTokenSets(p, requestedSets));

    const retainedFromEntries = [];
    const retainedToEntries = [];

    const adjustedOffered = offeredObjs.map((player) => {
      const raw = getRetentionForPlayer(player, retentionFrom);
      const amt = Number(raw) || 0;
      if (!(amt > 0)) return player;

      const maxAllowed = Math.ceil((Number(player.salary) || 0) * 0.5);
      const applied = Math.min(amt, maxAllowed);
      if (!(applied > 0)) return player;

      retainedFromEntries.push({
        player: String(player?.name || "").trim(),
        playerId: playerIdFromRosterObj(player) || null,
        note: "retained in trade",
        penalty: applied,
        retained: true,
      });

      return { ...player, salary: Math.max(0, (Number(player.salary) || 0) - applied) };
    });

    const adjustedRequested = requestedObjs.map((player) => {
      const raw = getRetentionForPlayer(player, retentionTo);
      const amt = Number(raw) || 0;
      if (!(amt > 0)) return player;

      const maxAllowed = Math.ceil((Number(player.salary) || 0) * 0.5);
      const applied = Math.min(amt, maxAllowed);
      if (!(applied > 0)) return player;

      retainedToEntries.push({
        player: String(player?.name || "").trim(),
        playerId: playerIdFromRosterObj(player) || null,
        note: "retained in trade",
        penalty: applied,
        retained: true,
      });

      return { ...player, salary: Math.max(0, (Number(player.salary) || 0) - applied) };
    });

    previewFrom.buyouts = [...(previewFrom.buyouts || []), ...retainedFromEntries];
    previewTo.buyouts = [...(previewTo.buyouts || []), ...retainedToEntries];

    previewFrom.roster = previewFrom.roster.filter((p) => !rosterPlayerMatchesTokenSets(p, offeredSets));
    previewTo.roster = previewTo.roster.filter((p) => !rosterPlayerMatchesTokenSets(p, requestedSets));

    previewFrom.roster.push(...adjustedRequested);
    previewTo.roster.push(...adjustedOffered);

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

    const fromPreview = buildPreview(fromTeam, simFrom);
    const toPreview = buildPreview(toTeam, simTo);

    const issues = [];

    if (capLimit != null) {
      if (fromPreview.capAfter > capLimit) issues.push(`${fromTeam.name} would be over the cap by $${fromPreview.capAfter - capLimit}.`);
      if (toPreview.capAfter > capLimit) issues.push(`${toTeam.name} would be over the cap by $${toPreview.capAfter - capLimit}.`);
    }

    if (maxRosterSize != null) {
      if (fromPreview.sizeAfter > maxRosterSize) issues.push(`${fromTeam.name} would have ${fromPreview.sizeAfter} players (limit ${maxRosterSize}).`);
      if (toPreview.sizeAfter > maxRosterSize) issues.push(`${toTeam.name} would have ${toPreview.sizeAfter} players (limit ${maxRosterSize}).`);
    }

    if (minForwards != null || minDefensemen != null) {
      if (minForwards != null || minDefensemen != null) {
        if ((minForwards != null && fromPreview.posAfter.F < minForwards) || (minDefensemen != null && fromPreview.posAfter.D < minDefensemen)) {
          const parts = [];
          if (minForwards != null && fromPreview.posAfter.F < minForwards) parts.push(`${fromPreview.posAfter.F} F (min ${minForwards}) for ${fromTeam.name}`);
          if (minDefensemen != null && fromPreview.posAfter.D < minDefensemen) parts.push(`${fromPreview.posAfter.D} D (min ${minDefensemen}) for ${fromTeam.name}`);
          issues.push(`Positional minimum issue: ${parts.join(", ")}.`);
        }

        if ((minForwards != null && toPreview.posAfter.F < minForwards) || (minDefensemen != null && toPreview.posAfter.D < minDefensemen)) {
          const parts = [];
          if (minForwards != null && toPreview.posAfter.F < minForwards) parts.push(`${toPreview.posAfter.F} F (min ${minForwards}) for ${toTeam.name}`);
          if (minDefensemen != null && toPreview.posAfter.D < minDefensemen) parts.push(`${toPreview.posAfter.D} D (min ${minDefensemen}) for ${toTeam.name}`);
          issues.push(`Positional minimum issue: ${parts.join(", ")}.`);
        }
      }
    }

    return { fromPreview, toPreview, issues };
  } catch (err) {
    console.error("[buildTradeImpactPreview] Failed to build preview", err);
    return { fromPreview: null, toPreview: null, issues: [] };
  }
}

// Post-trade legality issues (pure)
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
  if (capLimit != null && fromCap > capLimit) issues.push(`${fromName} would be over the cap by $${fromCap - capLimit}.`);

  const toCap = totalCap(toTeam);
  if (capLimit != null && toCap > capLimit) issues.push(`${toName} would be over the cap by $${toCap - capLimit}.`);

  const fromSize = (fromTeam.roster || []).length;
  if (maxRosterSize != null && fromSize > maxRosterSize) issues.push(`${fromName} would have ${fromSize} players (limit ${maxRosterSize}).`);

  const toSize = (toTeam.roster || []).length;
  if (maxRosterSize != null && toSize > maxRosterSize) issues.push(`${toName} would have ${toSize} players (limit ${maxRosterSize}).`);

  const fromPos = countPositions(fromTeam);
  if ((minForwards != null && fromPos.F < minForwards) || (minDefensemen != null && fromPos.D < minDefensemen)) {
    const parts = [];
    if (minForwards != null && fromPos.F < minForwards) parts.push(`${fromPos.F} F (min ${minForwards}) for ${fromName}`);
    if (minDefensemen != null && fromPos.D < minDefensemen) parts.push(`${fromPos.D} D (min ${minDefensemen}) for ${fromName}`);
    issues.push(`Positional minimum issue: ${parts.join(", ")}.`);
  }

  const toPos = countPositions(toTeam);
  if ((minForwards != null && toPos.F < minForwards) || (minDefensemen != null && toPos.D < minDefensemen)) {
    const parts = [];
    if (minForwards != null && toPos.F < minForwards) parts.push(`${toPos.F} F (min ${minForwards}) for ${toName}`);
    if (minDefensemen != null && toPos.D < minDefensemen) parts.push(`${toPos.D} D (min ${minDefensemen}) for ${toName}`);
    issues.push(`Positional minimum issue: ${parts.join(", ")}.`);
  }

  return issues;
}

// Apply a trade to two teams (pure, returns updated teams)
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

  const offeredSets = buildTokenSets(trade.offeredPlayers || []);
  const requestedSets = buildTokenSets(trade.requestedPlayers || []);

  const offeredObjs = previewFrom.roster.filter((p) => rosterPlayerMatchesTokenSets(p, offeredSets));
  const requestedObjs = previewTo.roster.filter((p) => rosterPlayerMatchesTokenSets(p, requestedSets));

  const retainedFromEntries = [];
  const retainedToEntries = [];

  const adjustedOffered = offeredObjs.map((player) => {
    const raw = getRetentionForPlayer(player, trade.retentionFrom);
    const amt = Number(raw) || 0;
    if (!(amt > 0)) return player;

    const maxAllowed = Math.ceil((Number(player.salary) || 0) * 0.5);
    const applied = Math.min(amt, maxAllowed);
    if (!(applied > 0)) return player;

    retainedFromEntries.push({
      player: String(player?.name || "").trim(),
      playerId: playerIdFromRosterObj(player) || null,
      note: "retained in trade",
      penalty: applied,
      retained: true,
    });

    return { ...player, salary: Math.max(0, (Number(player.salary) || 0) - applied) };
  });

  const adjustedRequested = requestedObjs.map((player) => {
    const raw = getRetentionForPlayer(player, trade.retentionTo);
    const amt = Number(raw) || 0;
    if (!(amt > 0)) return player;

    const maxAllowed = Math.ceil((Number(player.salary) || 0) * 0.5);
    const applied = Math.min(amt, maxAllowed);
    if (!(applied > 0)) return player;

    retainedToEntries.push({
      player: String(player?.name || "").trim(),
      playerId: playerIdFromRosterObj(player) || null,
      note: "retained in trade",
      penalty: applied,
      retained: true,
    });

    return { ...player, salary: Math.max(0, (Number(player.salary) || 0) - applied) };
  });

  previewFrom.buyouts = [...(previewFrom.buyouts || []), ...retainedFromEntries];
  previewTo.buyouts = [...(previewTo.buyouts || []), ...retainedToEntries];

  previewFrom.roster = previewFrom.roster.filter((p) => !rosterPlayerMatchesTokenSets(p, offeredSets));
  previewTo.roster = previewTo.roster.filter((p) => !rosterPlayerMatchesTokenSets(p, requestedSets));

  previewFrom.roster.push(...adjustedRequested);
  previewTo.roster.push(...adjustedOffered);

  previewFrom.roster = sortRosterStandard(previewFrom.roster);
  previewTo.roster = sortRosterStandard(previewTo.roster);

  const penaltyFromDraft = trade.penaltyFrom === "" || trade.penaltyFrom == null ? 0 : Number(trade.penaltyFrom);
  const penaltyToDraft = trade.penaltyTo === "" || trade.penaltyTo == null ? 0 : Number(trade.penaltyTo);

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

  simFrom = { ...simFrom, roster: sortRosterStandard(simFrom.roster || []) };
  simTo = { ...simTo, roster: sortRosterStandard(simTo.roster || []) };

  return { updatedFromTeam: simFrom, updatedToTeam: simTo };
}

// Validate a trade draft (pure)
export function validateTradeDraft({
  tradeDraft,
  fromTeamObj,
  toTeamObj,
  existingProposals = [],
  maxRetentionSpots = 3,
}) {
  if (!tradeDraft) return { ok: false, errorMessage: "No trade draft in progress." };

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

  const maxPenaltyFrom = totalBuyoutPenalty(fromTeamObj);
  const maxPenaltyTo = totalBuyoutPenalty(toTeamObj);

  let penaltyFromAmount = 0;
  let penaltyToAmount = 0;

  if (penaltyFrom !== undefined && penaltyFrom !== "") {
    const n = Number(penaltyFrom);
    if (!Number.isFinite(n) || n < 0) {
      return { ok: false, errorMessage: "Please enter a valid non-negative buyout penalty to include from your team, or leave it blank." };
    }
    if (n > maxPenaltyFrom) {
      return { ok: false, errorMessage: `You can only include up to $${maxPenaltyFrom} of your current buyout penalties in this trade.` };
    }
    penaltyFromAmount = n;
  }

  if (penaltyTo !== undefined && penaltyTo !== "") {
    const n = Number(penaltyTo);
    if (!Number.isFinite(n) || n < 0) {
      return { ok: false, errorMessage: "Please enter a valid non-negative buyout penalty you are requesting from the other team, or leave it blank." };
    }
    if (n > maxPenaltyTo) {
      return { ok: false, errorMessage: `${toTeam} currently only has $${maxPenaltyTo} in buyout penalties.` };
    }
    penaltyToAmount = n;
  }

  // Retention validation: keys may be id tokens or names.
  const validatedRetentionFrom = {};
  const validatedRetentionTo = {};

  // Retention on players YOU send out
  for (const [tokenKey, raw] of Object.entries(retentionFrom || {})) {
    if (raw === "" || raw == null) continue;

    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount < 0) {
      return { ok: false, errorMessage: `Invalid retention amount for ${tokenKey}. Please enter a non-negative number.` };
    }

    const isInOffered = (offeredPlayers || []).some((t) => tokenEqualsToken(t, tokenKey));
    if (!isInOffered) {
      return { ok: false, errorMessage: `You can only retain salary on players you are trading away. ${tokenKey} is not in your offered players.` };
    }

    const fromPlayerObj = (fromTeamObj.roster || []).find((p) => tokenMatchesRosterPlayer(tokenKey, p));
    if (!fromPlayerObj) {
      return { ok: false, errorMessage: `Could not find ${tokenKey} on your roster for retention calculation.` };
    }

    const maxRetain = Math.ceil((Number(fromPlayerObj.salary) || 0) * 0.5);
    if (amount > maxRetain) {
      return { ok: false, errorMessage: `You can retain at most 50% of ${fromPlayerObj.name}'s salary ($${maxRetain}).` };
    }

    // Store using best token (prefer id token when possible)
    if (amount > 0) {
      const bestKey = rosterPlayerToBestToken(fromPlayerObj);
      validatedRetentionFrom[bestKey] = amount;
    }
  }

  // Retention you REQUEST from the other team (on players you receive)
  for (const [tokenKey, raw] of Object.entries(retentionTo || {})) {
    if (raw === "" || raw == null) continue;

    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount < 0) {
      return { ok: false, errorMessage: `Invalid requested retention amount for ${tokenKey}. Please enter a non-negative number.` };
    }

    const isInRequested = (requestedPlayers || []).some((t) => tokenEqualsToken(t, tokenKey));
    if (!isInRequested) {
      return { ok: false, errorMessage: `You can only request retention on players you are receiving. ${tokenKey} is not in your requested players.` };
    }

    const toPlayerObj = (toTeamObj.roster || []).find((p) => tokenMatchesRosterPlayer(tokenKey, p));
    if (!toPlayerObj) {
      return { ok: false, errorMessage: `Could not find ${tokenKey} on the other roster for retention calculation.` };
    }

    const maxRetain = Math.ceil((Number(toPlayerObj.salary) || 0) * 0.5);
    if (amount > maxRetain) {
      return { ok: false, errorMessage: `${toTeam} can retain at most 50% of ${toPlayerObj.name}'s salary ($${maxRetain}).` };
    }

    if (amount > 0) {
      const bestKey = rosterPlayerToBestToken(toPlayerObj);
      validatedRetentionTo[bestKey] = amount;
    }
  }

  // Retention spot cap checks
  const existingRetentionSpotsFrom = countRetentionSpots(fromTeamObj);
  const newRetentionPlayersFrom = new Set(Object.keys(validatedRetentionFrom));
  if (existingRetentionSpotsFrom + newRetentionPlayersFrom.size > maxRetentionSpots) {
    return {
      ok: false,
      errorMessage:
        `${fromTeam} would exceed the maximum of ${maxRetentionSpots} retained-salary players ` +
        `(currently ${existingRetentionSpotsFrom}, adding ${newRetentionPlayersFrom.size}).`,
    };
  }

  const existingRetentionSpotsTo = countRetentionSpots(toTeamObj);
  const newRetentionPlayersTo = new Set(Object.keys(validatedRetentionTo));
  if (existingRetentionSpotsTo + newRetentionPlayersTo.size > maxRetentionSpots) {
    return {
      ok: false,
      errorMessage:
        `${toTeam} would exceed the maximum of ${maxRetentionSpots} retained-salary players ` +
        `(currently ${existingRetentionSpotsTo}, adding ${newRetentionPlayersTo.size}).`,
    };
  }

  // Conflict check: no overlap with ANY other pending trade
  const draftTokens = [...(offeredPlayers || []), ...(requestedPlayers || [])];

  const conflictingTrade = (existingProposals || []).find((tr) => {
    if (tr?.status !== "pending") return false;

    const otherTokens = [...(tr.offeredPlayers || []), ...(tr.requestedPlayers || [])];
    return otherTokens.some((ot) => draftTokens.some((dt) => tokenEqualsToken(dt, ot)));
  });

  if (conflictingTrade) {
    return {
      ok: false,
      errorMessage:
        "One or more of the players in this trade are already part of another pending trade.\n\n" +
        "Resolve or cancel those trades before creating a new one involving the same players.",
    };
  }

  return {
    ok: true,
    penaltyFromAmount,
    penaltyToAmount,
    validatedRetentionFrom,
    validatedRetentionTo,
  };
}

// Accepting a trade by ID (full flow)
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

  const offeredDetails = (trade.offeredPlayers || []).map((token) => {
    const p = (fromTeam?.roster || []).find((pl) => tokenMatchesRosterPlayer(token, pl)) || null;
    const baseSalary = p ? Number(p.salary) || 0 : 0;
    const retainedAmount = p ? (getRetentionForPlayer(p, trade.retentionFrom) || 0) : 0;
    const newSalary = Math.max(0, baseSalary - retainedAmount);

    return { token, name: p?.name || token, fromTeam: trade.fromTeam, toTeam: trade.toTeam, baseSalary, retainedAmount, newSalary };
  });

  const requestedDetails = (trade.requestedPlayers || []).map((token) => {
    const p = (toTeam?.roster || []).find((pl) => tokenMatchesRosterPlayer(token, pl)) || null;
    const baseSalary = p ? Number(p.salary) || 0 : 0;
    const retainedAmount = p ? (getRetentionForPlayer(p, trade.retentionTo) || 0) : 0;
    const newSalary = Math.max(0, baseSalary - retainedAmount);

    return { token, name: p?.name || token, fromTeam: trade.toTeam, toTeam: trade.fromTeam, baseSalary, retainedAmount, newSalary };
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

// Trade rejection / cancellation
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

export function cancelTradeById(tradeProposals, leagueLog, tradeId, options = {}, now = Date.now()) {
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
  if (expired.length === 0) return { nextTradeProposals: trades, nextLeagueLog: log };

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

export function cancelTradesForPlayer(tradeProposals, leagueLog, teamName, playerToken, options = {}) {
  const { reason = "playerRemoved", autoCancelled = true } = options || {};
  const affected = getPendingTradesWithPlayer(tradeProposals, teamName, playerToken);

  if (!affected.length) {
    return { nextTradeProposals: tradeProposals, nextLeagueLog: leagueLog, affectedTrades: [] };
  }

  let nextTrades = tradeProposals;
  let nextLog = leagueLog;

  for (const tr of affected) {
    const res = cancelTradeById(nextTrades, nextLog, tr.id, { autoCancelled, reason });
    nextTrades = res.nextTradeProposals;
    nextLog = res.nextLeagueLog;
  }

  return { nextTradeProposals: nextTrades, nextLeagueLog: nextLog, affectedTrades: affected };
}

// -------------------------------
//   Auctions / bids helpers
// -------------------------------
const normalizeName = (s) => String(s || "").trim().toLowerCase();
const normalizeTeam = (s) => String(s || "").trim().toLowerCase();

const isIdAuctionKey = (key) => /^id:\d+$/i.test(String(key || "").trim());

const getBidFirstTs = (b) => Number(b?.firstTimestamp ?? b?.timestamp ?? 0) || 0;

export function resolveAuctions({
  teams,
  freeAgents,
  capLimit, // not used to block winners (grace period is allowed)
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

  // Active bids: ID-only auctions only
  const activeBids = (bids || []).filter((b) => {
    if (b?.resolved) return false;
    const key = String(b?.auctionKey || "").trim();
    if (!isIdAuctionKey(key)) return false;
    const team = String(b?.team || "").trim();
    const amt = Number(b?.amount) || 0;
    const pid = Number(b?.playerId);
    return Boolean(b?.id && team && amt > 0 && Number.isFinite(pid) && pid > 0);
  });

  // If nothing active, still clean out any junk legacy rows (optional)
  if (activeBids.length === 0) {
    const nextFreeAgents = (bids || []).filter((b) => {
      if (b?.resolved) return false;
      const key = String(b?.auctionKey || "").trim();
      if (!isIdAuctionKey(key)) return false;
      const team = String(b?.team || "").trim();
      const amt = Number(b?.amount) || 0;
      const pid = Number(b?.playerId);
      return Boolean(b?.id && team && amt > 0 && Number.isFinite(pid) && pid > 0);
    });
    return { nextTeams: originalTeams, nextFreeAgents, newLogs: [] };
  }

  // Group bids by auctionKey
  const bidsByPlayer = new Map();
  for (const bid of activeBids) {
    const key = String(bid?.auctionKey || "").trim().toLowerCase();
    if (!key) continue;
    if (!bidsByPlayer.has(key)) bidsByPlayer.set(key, []);
    bidsByPlayer.get(key).push(bid);
  }

  const resolvedBidIds = new Set();
  const newLogs = [];

  for (const [, playerBids] of bidsByPlayer.entries()) {
    // Sort by amount DESC; tie-break by earliest firstTimestamp
    const sorted = [...playerBids].sort((a, b) => {
      const aAmt = Number(a?.amount) || 0;
      const bAmt = Number(b?.amount) || 0;
      if (bAmt !== aAmt) return bAmt - aAmt;
      return getBidFirstTs(a) - getBidFirstTs(b);
    });

    if (sorted.length === 0) continue;

    const winningTeamKeyFor = (bid) => normalizeTeam(bid?.team);

    // Hard block: player already on ANY roster (prefer ID; fallback to name label)
    const isRosteredSomewhere = (bid) => {
      const pid = Number(bid?.playerId);
      const nameKey = normalizeName(bid?.playerName || bid?.player);

      return (nextTeams || []).some((t) =>
        (t.roster || []).some((p) => {
          const rosterPid = Number(p?.playerId);
          if (Number.isFinite(pid) && pid > 0 && Number.isFinite(rosterPid) && rosterPid > 0) {
            return rosterPid === pid;
          }
          // legacy fallback only
          return nameKey && normalizeName(p?.name) === nameKey;
        })
      );
    };

    // Anti-bluff pricing
    const computePricePaid = (candidateWinner, allBidsForPlayer) => {
      const winningKey = normalizeTeam(candidateWinner?.team);

      const distinctTeams = new Set(
        (allBidsForPlayer || []).map((b) => normalizeTeam(b?.team)).filter(Boolean)
      ).size;

      let pricePaid = Number(candidateWinner?.amount) || 0;
      if (distinctTeams <= 1) return pricePaid;

      const otherBids = (allBidsForPlayer || []).filter(
        (b) => normalizeTeam(b?.team) !== winningKey
      );

      const othersHighest = otherBids.reduce((max, b) => {
        const amt = Number(b?.amount) || 0;
        return amt > max ? amt : max;
      }, 0);

      const winnerMinRaw = Number(candidateWinner?.minAmount ?? candidateWinner?.amount);
      const winnerMin =
        Number.isFinite(winnerMinRaw) && winnerMinRaw > 0
          ? winnerMinRaw
          : Number(candidateWinner?.amount) || 0;

      if (winnerMin > othersHighest) return winnerMin;

      if (winnerMin === othersHighest) {
        const winnerTs = getBidFirstTs(candidateWinner);

        let bestOtherTs = Infinity;
        for (const b of otherBids) {
          const amt = Number(b?.amount) || 0;
          if (amt !== othersHighest) continue;
          const ts = getBidFirstTs(b);
          if (ts < bestOtherTs) bestOtherTs = ts;
        }

        if (winnerTs && bestOtherTs !== Infinity && winnerTs < bestOtherTs) return winnerMin;
        return Number(candidateWinner?.amount) || 0;
      }

      return Number(candidateWinner?.amount) || 0;
    };

    // Choose winner: highest bid, tie earliest; do NOT block for temporary illegality
    let winningBid = null;
    let finalPricePaid = 0;

    for (const candidate of sorted) {
      if (isRosteredSomewhere(candidate)) continue;

      const teamKey = winningTeamKeyFor(candidate);
      const teamIdx = nextTeams.findIndex((t) => normalizeTeam(t?.name) === teamKey);
      if (teamIdx === -1) continue;

      const pricePaid = computePricePaid(candidate, playerBids);
      if (!(Number(pricePaid) > 0)) continue;

      winningBid = candidate;
      finalPricePaid = Number(pricePaid) || 0;
      break;
    }

    if (!winningBid) continue;

    // Mark all bids in this auction for deletion
    for (const b of playerBids) {
      if (b?.id) resolvedBidIds.add(b.id);
    }

    const winningTeamName = String(winningBid?.team || "").trim();
    const winningTeamKey = normalizeTeam(winningTeamName);

    const teamIdx = nextTeams.findIndex((t) => normalizeTeam(t?.name) === winningTeamKey);
    if (teamIdx === -1) continue;

    const team = nextTeams[teamIdx];
    const position = winningBid?.position || "F";

    const pid = Number(winningBid?.playerId);
    const nameLabel =
      String(winningBid?.playerName || winningBid?.player || "").trim() ||
      (Number.isFinite(pid) && pid > 0 ? `id:${pid}` : "Unknown");

    const newPlayer = {
      playerId: Number.isFinite(pid) && pid > 0 ? Math.trunc(pid) : null, // ✅ identity
      name: nameLabel, // ✅ display
      salary: Number(finalPricePaid) || 0,
      position,
      buyoutLockedUntil: (typeof now === "number" ? now : now.getTime()) + BUYOUT_LOCK_MS,
    };

    const candidateTeam = {
      ...team,
      roster: sortRosterStandard([...(team.roster || []), newPlayer]),
    };

    nextTeams = nextTeams.map((t, idx) => (idx === teamIdx ? candidateTeam : t));

    newLogs.push({
      type: "faSigned",
      id: (typeof now === "number" ? now : now.getTime()) + Math.random(),
      team: winningTeamName,
      playerId: newPlayer.playerId,
      player: nameLabel,
      amount: Number(finalPricePaid) || 0,
      position,
      timestamp: typeof now === "number" ? now : now.getTime(),
    });
  }

  // Delete all bids resolved this rollover + drop junk rows
  const nextFreeAgents = (bids || []).filter((b) => {
    if (b?.resolved) return false;
    if (resolvedBidIds.has(b?.id)) return false;

    const key = String(b?.auctionKey || "").trim();
    if (!isIdAuctionKey(key)) return false;

    const team = String(b?.team || "").trim();
    const amt = Number(b?.amount) || 0;
    const pid = Number(b?.playerId);
    return Boolean(b?.id && team && amt > 0 && Number.isFinite(pid) && pid > 0);
  });

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

// 1h15m cooldown
export const BID_EDIT_COOLDOWN_MS = 75 * 60 * 1000;

// -------------------------------
//   Auction UI helpers (single source of truth)
// -------------------------------
function normalizeTeamName(s) {
  return String(s || "").trim().toLowerCase();
}

function getMyActiveBidForAuctionBids(auctionBids, teamName) {
  const t = normalizeTeamName(teamName);
  return (auctionBids || []).find((b) => !b?.resolved && normalizeTeamName(b?.team) === t) || null;
}

function getAuctionStartedByKeyFromBids(auctionBids) {
  const bids = auctionBids || [];
  const raw = bids.find((b) => b?.auctionStartedBy)?.auctionStartedBy;
  if (raw) return normalizeTeamName(raw);

  const firstTeam = bids[0]?.team;
  return normalizeTeamName(firstTeam);
}

/**
 * UI-only: should the "Place bid" button be enabled, and why?
 * Mirrors the same rules enforced in placeFreeAgentBid:
 * - joining existing auction must be >= $2
 * - edit limits (starter 2, others 1)
 * - 75 minute cooldown between edits
 */
export function computeBidUiStateForAuction({ auctionBids, myTeamName, nowMs, inputValue }) {
  const myBid = getMyActiveBidForAuctionBids(auctionBids, myTeamName);
  const hasMyBid = !!myBid;

  const startedByKey = getAuctionStartedByKeyFromBids(auctionBids);
  const isStarterTeam = normalizeTeamName(myTeamName) === startedByKey;

  const maxEdits = isStarterTeam ? 2 : 1;
  const editsUsed = Number(myBid?.editCount || 0);

  const lastEditAt = Number(myBid?.lastEditAt || myBid?.timestamp || 0) || 0;
  const cooldownLeftMs = lastEditAt ? Math.max(0, BID_EDIT_COOLDOWN_MS - (nowMs - lastEditAt)) : 0;

  const amount = Number(String(inputValue ?? "").trim());

  // joining existing auction must be >= 2; editing your own bid can be >= 1
  const minRequired = hasMyBid ? 1 : 2;

  const invalidAmount = !Number.isFinite(amount) || amount <= 0;
  const belowMin = !invalidAmount && amount < minRequired;

  const editLimitReached = hasMyBid && editsUsed >= maxEdits;
  const cooldownActive = hasMyBid && cooldownLeftMs > 0;

  const disabled = invalidAmount || belowMin || editLimitReached || cooldownActive;

  let reason = "";
  if (invalidAmount) reason = "Enter a valid bid amount.";
  else if (belowMin) reason = `Minimum bid is $${minRequired} to join this auction.`;
  else if (editLimitReached) reason = `No edits left (${editsUsed}/${maxEdits}).`;
  else if (cooldownActive) {
    const mins = Math.ceil(cooldownLeftMs / 60000);
    reason = `Cooldown active (${mins} min left).`;
  }

  return {
    hasMyBid,
    isStarterTeam,
    maxEdits,
    editsUsed,
    cooldownLeftMs,
    minRequired,
    disabled,
    reason,
  };
}

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
  playerId,
  now = Date.now(),
}) {
  const allTeams = teams || [];
  const bids = freeAgents || [];

  const team = allTeams.find((t) => t.name === biddingTeamName);
  if (!team) return { ok: false, errorMessage: "Your team could not be found." };

  const trimmedName = String(playerName || "").trim();

  // Phase 2A: ID-only auctions. No free-text.
  const pidNum = Number(playerId);
  const hasPid = Number.isFinite(pidNum) && pidNum > 0;

  if (!hasPid) {
    return {
      ok: false,
      errorMessage:
        "Select a player from the search results (player ID required). Free-text auctions are disabled.",
    };
  }

  // Identity is ID-only. Name is display-only.
  const auctionKey = `id:${Math.trunc(pidNum)}`;
  const displayName = trimmedName || auctionKey;

  // Block starting/bidding on a player already rostered anywhere
  const isOnRoster = allTeams.some((t) =>
    (t.roster || []).some((p) => {
      const rosterPid = Number(p?.playerId);
      if (Number.isFinite(rosterPid) && rosterPid > 0) return rosterPid === pidNum;
      // legacy fallback only
      if (trimmedName) return normalizeName(p?.name) === normalizeName(trimmedName);
      return false;
    })
  );

  if (isOnRoster) {
    return { ok: false, errorMessage: `${displayName} is already on a roster and cannot be put up for auction.` };
  }

  const amount = Number(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, errorMessage: "Please enter a valid positive bid amount." };
  }

  // Find if auction already exists (active)
  const existingActive = bids.find((fa) => {
    if (fa?.resolved) return false;
    return String(fa?.auctionKey || "").trim().toLowerCase() === auctionKey.toLowerCase();
  });

  const hasActiveAuction = !!existingActive;
  const createdNewAuction = !hasActiveAuction;

  // Auction cutoff logic
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

  // Cap warning (unchanged)
  const teamCap = totalCap(team);
  const totalAfterBid = teamCap + amount;
  let warningMessage = null;
  if (totalAfterBid > capLimit) {
    const overBy = totalAfterBid - capLimit;
    warningMessage =
      `Note: if you win this bid, ${biddingTeamName} will be OVER the cap by $${overBy}. ` +
      `You'll need to buy out players to get back under $${capLimit}.`;
  }

  const timestamp = typeof now === "number" ? now : now.getTime();

  // Find this team's existing ACTIVE bid for this auction (if any)
  const existingTeamBid = bids.find((b) => {
    if (b?.resolved) return false;
    const sameAuction = String(b?.auctionKey || "").trim().toLowerCase() === auctionKey.toLowerCase();
    const sameTeam = normalizeTeam(b?.team) === normalizeTeam(biddingTeamName);
    return sameAuction && sameTeam;
  });

  const isEdit = !!existingTeamBid;

  const auctionStartedBy =
    existingTeamBid?.auctionStartedBy ||
    existingActive?.auctionStartedBy ||
    (createdNewAuction ? normalizeTeam(biddingTeamName) : null);

  const isStarterTeam = normalizeTeam(biddingTeamName) === normalizeTeam(auctionStartedBy);

  // NEW RULE 1: Non-starter first bids must be >= $2
  if (hasActiveAuction && !existingTeamBid) {
    if (amount < 2) {
      return { ok: false, errorMessage: "Minimum bid is $2 when joining an existing auction (non-starter bid)." };
    }
  }

  // NEW RULE 2 + 3: Edit limits + cooldown
  if (isEdit) {
    const maxEdits = isStarterTeam ? 2 : 1;

    const prevEditCount = Number(existingTeamBid?.editCount || 0);
    if (prevEditCount >= maxEdits) {
      return {
        ok: false,
        errorMessage: isStarterTeam
          ? "You have used your 2 bid edits for this auction."
          : "You have used your 1 bid edit for this auction.",
      };
    }

    const lastEditAt = Number(existingTeamBid?.lastEditAt || existingTeamBid?.timestamp || 0) || 0;
    if (lastEditAt && timestamp - lastEditAt < BID_EDIT_COOLDOWN_MS) {
      const msLeft = BID_EDIT_COOLDOWN_MS - (timestamp - lastEditAt);
      const minsLeft = Math.ceil(msLeft / 60000);
      return { ok: false, errorMessage: `Cooldown active. You can edit this bid again in about ${minsLeft} minute(s).` };
    }
  }

  // Preserve tie-break + lowest bid (for anti-bluff logic)
  const firstTimestamp = Number(existingTeamBid?.firstTimestamp ?? existingTeamBid?.timestamp ?? timestamp) || timestamp;
  const prevMin = Number(existingTeamBid?.minAmount ?? existingTeamBid?.amount ?? amount) || amount;
  const minAmount = Math.min(prevMin, amount);

  const nextEditCount = isEdit ? Number(existingTeamBid?.editCount || 0) + 1 : 0;

  // Preserve “canonical” position from existing entries
  const finalPosition = existingActive?.position || position || "F";

  const newEntry = {
    id: `bid-${timestamp}-${Math.random().toString(36).slice(2)}`,
    auctionKey,
    playerId: Math.trunc(pidNum), // ✅ identity
    player: displayName, // ✅ display label (legacy field)
    playerName: displayName, // ✅ explicit display label
    team: biddingTeamName,

    amount, // current/max willingness to pay
    minAmount, // lowest amount they've bid in this auction
    firstTimestamp, // when they first bid in this auction

    auctionStartedBy: auctionStartedBy || normalizeTeam(biddingTeamName),
    auctionStartedAt: Number(existingActive?.auctionStartedAt || timestamp) || timestamp,
    editCount: nextEditCount,
    lastEditAt: timestamp,

    position: finalPosition,
    assigned: false,
    resolved: false,
    timestamp,
  };

  // Enforce: one ACTIVE bid per team per auction (replace if exists)
  const nextFreeAgents = (() => {
    const next = [];
    for (const b of bids) {
      const sameAuction = String(b?.auctionKey || "").trim().toLowerCase() === auctionKey.toLowerCase();
      const sameTeam = normalizeTeam(b?.team) === normalizeTeam(biddingTeamName);
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
        id: timestamp + Math.random(),
        playerId: Math.trunc(pidNum),
        player: displayName,
        position: finalPosition,
        startedBy: biddingTeamName,
        timestamp,
      }
    : null;

  return { ok: true, nextFreeAgents, logEntry, warningMessage };
}
