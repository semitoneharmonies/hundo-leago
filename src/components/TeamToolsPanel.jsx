// src/components/TeamToolsPanel.jsx
import React, { useState, useEffect } from "react";
import {
  buildTradeImpactPreview,
  getNextSundayDeadline,
  getNewAuctionCutoff,
  formatCountdown,
  countRetentionSpots,
  totalBuyoutPenalty,
  computeBidUiStateForAuction,
} from "../leagueUtils";

/**
 * Optional playerApi shape (safe if undefined):
 * playerApi = {
 *   byId: { [id]: { id, name, position, ... } } OR Map(id -> player)
 *   byName: { [lowerName]: { id, name, ... } } OR Map(lowerName -> player)
 * }
 */
// EXACT roster-position pill (shared look)
const ROSTER_POS_COLORS = {
  F: "#22c55e", // green
  D: "#a855f7", // purple
};

const TEAM_COLORS = {
  "Pacino Amigo": "#f59e0b",   // amber
  "Bottle O Draino": "#22c55e", // green
  "Imano Lizzo": "#a855f7",     // purple
  "El Camino": "#38bdf8",       // light blue
  "DeNiro Amigo": "#ef4444",    // red
  "Champino": "#e879f9",        // pink
};

const getTeamColor = (teamName) => TEAM_COLORS[teamName] || "#334155";

const rosterPosPill = (pos) => {
  const color = ROSTER_POS_COLORS[pos === "D" ? "D" : "F"];

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    borderRadius: "50%",
    backgroundColor: color,
    color: "#020617", // dark text like roster
    fontWeight: 900,
    fontSize: "0.75rem",
    lineHeight: 1,
    flexShrink: 0,
  };
};
function TeamToolsPanel({
  currentUser,
  selectedTeam,
  teams,
  capLimit,
  maxRosterSize,
  minForwards,
  minDefensemen,
  tradeDraft,
  setTradeDraft,
  tradeProposals,
  onSubmitTradeDraft,
  onAcceptTrade,
  onRejectTrade,
  onCancelTrade,
  onCounterTrade,
  tradeBlock,
  onRemoveTradeBlockEntry,
  freeAgents,
  onPlaceBid,
  onResolveAuctions,
  onCommissionerRemoveBid,

  // NEW (optional): player lookup helpers for ID-ready UI
  playerApi,
}) {
  // --- Auction state (for starting new auctions) ---
  const [bidPlayerName, setBidPlayerName] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  // Phase 2A: player search dropdown (start auction)
  const [playerSearchQuery, setPlayerSearchQuery] = useState("");
  const [playerSearchResults, setPlayerSearchResults] = useState([]);
  const [playerSearchOpen, setPlayerSearchOpen] = useState(false);
  const [playerSearchLoading, setPlayerSearchLoading] = useState(false);
    const [selectedAuctionPlayer, setSelectedAuctionPlayer] = useState(null); 
  // shape: { id, fullName, position, teamAbbrev }


  // Per-player inline inputs for live auctions (blind bidding)
  const [liveBidInputs, setLiveBidInputs] = useState({});

  // Commissioner toggle: show/hide bid amounts
  const [showBidAmounts, setShowBidAmounts] = useState(false);

  // Countdown to next Sunday 4pm
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  // Phase 2A: fetch player search results (debounced)
  useEffect(() => {
    const q = String(playerSearchQuery || "").trim();

    // nothing typed -> clear dropdown
    if (!q) {
      setPlayerSearchResults([]);
      setPlayerSearchLoading(false);
      setPlayerSearchOpen(false);
      return;
    }

    // only run if App.jsx provided the real API
    if (!playerApi || typeof playerApi.searchPlayers !== "function") {
      return;
    }

    setPlayerSearchLoading(true);

    const t = setTimeout(async () => {
      try {
        const results = await playerApi.searchPlayers(q, 12);
        setPlayerSearchResults(Array.isArray(results) ? results : []);
        setPlayerSearchOpen(true);
      } catch (e) {
        setPlayerSearchResults([]);
      } finally {
        setPlayerSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [playerSearchQuery, playerApi]);

  // ✅ early return comes *after* hooks
  if (!currentUser) return null;

  const isManager = currentUser?.role === "manager";
  const isCommissioner = currentUser?.role === "commissioner";
  const myTeamName = isManager ? currentUser.teamName : null;

  const nowDate = new Date(nowMs);
  const nextSunday = getNextSundayDeadline(nowDate);
  const auctionCutoff = getNewAuctionCutoff(nextSunday);
  const timeRemainingMs = Math.max(0, nextSunday.getTime() - nowMs);
  // ✅ Phase 2A: gate starting auctions to dropdown selection + valid amount
const canStartAuction =
  Number.isFinite(Number(selectedAuctionPlayer?.id)) &&
  Number(selectedAuctionPlayer?.id) > 0 &&
  String(selectedAuctionPlayer?.fullName || "").trim().length > 0 &&
  Number(bidAmount) > 0;


  // -----------------------------
  // ID-ready helpers (safe today)
  // -----------------------------
  const normalizeName = (s) => String(s || "").trim().toLowerCase();

  // Phase 2A: normalize NHL player id from various shapes
const normalizeNhlId = (raw) => {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;

  const stripped = s.toLowerCase().startsWith("id:") ? s.slice(3).trim() : s;
  const n = Number(stripped);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.trunc(n);
};



// Phase 2A: ensure dropdown player object is in the canonical shape we expect
const normalizeSearchPlayer = (p) => {
  if (!p) return null;

  // Accept common backend keys without refactors:
  // id | playerId | nhlId | nhlPlayerId
  const pid =
    normalizeNhlId(p.id) ??
    normalizeNhlId(p.playerId) ??
    normalizeNhlId(p.nhlId) ??
    normalizeNhlId(p.nhlPlayerId);

  if (!pid) return null;

  const fullName =
    String(p.fullName || p.name || p.playerName || "").trim();

  const position =
    String(p.position || p.pos || p.primaryPosition || "").trim();

  const teamAbbrev =
    String(p.teamAbbrev || p.team || p.teamCode || "").trim();

  return {
    id: pid, // ✅ ALWAYS numeric NHL id
    fullName,
    position,
    teamAbbrev,
  };
};

  const mapGet = (maybeMap, key) => {
    if (!maybeMap || !key) return null;
    try {
      if (typeof maybeMap.get === "function") return maybeMap.get(key) || null;
      return maybeMap[key] || null;
    } catch (_) {
      return null;
    }
  };

  // If given "Connor McDavid" -> returns player object if playerApi.byName exists
  const lookupPlayerByName = (name) => {
    const key = normalizeName(name);
    return mapGet(playerApi?.byName, key);
  };

// If given an id -> returns player object if playerApi.byId exists
const lookupPlayerById = (id) => {
  const pid = normalizeNhlId(id);
  if (!pid) return null;

  const byId = playerApi?.byId;
  if (!byId) return null;

  // Support Map and plain object with either numeric or string keys
  if (typeof byId.get === "function") {
    return byId.get(pid) || byId.get(String(pid)) || null;
  }

  return byId[pid] || byId[String(pid)] || null;
};



  // If someone gives us "either name or id", try both safely.
 const lookupPlayerAny = (ref) => {
  const raw = String(ref || "").trim();
  if (!raw) return null;

  const byId = lookupPlayerById(raw);
  if (byId) return byId;

  const byName = lookupPlayerByName(raw);
  if (byName) return byName;

  return null;
};


const looksLikeOnlyAnId = (val) => {
  const s = String(val || "").trim().toLowerCase();
  if (!s) return false;
  if (s.startsWith("id:")) return true;
  return /^[0-9]+$/.test(s);
};

// Use this everywhere we display a player string
const getPlayerDisplayName = (ref) => {
  if (!ref) return "";
  const raw = String(ref).trim();

  // If the ref is an ID, try DB lookup first.
  const p = lookupPlayerAny(raw);
  const nm = String(p?.fullName || p?.name || "").trim();
  if (nm) return nm;

  // Never show IDs in the UI.
  if (looksLikeOnlyAnId(raw)) return "Unknown player";

  // If it's not an ID (already a readable name), show it.
  return raw;
};

// Live-auction title: prefer DB name, else fall back to bid-provided readable name, else never show ID.
const getAuctionDisplayName = (auction) => {
  const pid =
    normalizeNhlId(auction?.playerId) ||
    normalizeNhlId(auction?.auctionKey) ||
    normalizeNhlId(auction?.key) ||
    null;

  // 1) DB lookup by id (best)
  if (pid) {
    const p = lookupPlayerById(pid);
    const nm = String(p?.fullName || p?.name || "").trim();
    if (nm) return nm;
  }

  // 2) Fall back to a readable name stored on any bid (playerName or player),
  // but ONLY if it isn't an id/id:...
  const bids = Array.isArray(auction?.bids) ? auction.bids : [];
  const candidate = bids
    .map((b) => b?.playerName || b?.player)
    .map((x) => String(x || "").trim())
    .find((x) => x && !looksLikeOnlyAnId(x));

  if (candidate) return candidate;

  // 3) Never show an ID in UI
  return "Unknown player";
};

const getBidDisplayName = (bid) => {
  if (!bid) return "Unknown player";

  const pid =
    normalizeNhlId(bid?.playerId) ||
    normalizeNhlId(bid?.auctionKey) ||
    normalizeNhlId(bid?.player) ||
    null;

  // 1) DB lookup by id
  if (pid) {
    const p = lookupPlayerById(pid);
    const nm = String(p?.fullName || p?.name || "").trim();
    if (nm) return nm;
  }

  // 2) fall back to stored readable name fields (only if not an ID)
  const candidate = [bid?.playerName, bid?.player]
    .map((x) => String(x || "").trim())
    .find((x) => x && !looksLikeOnlyAnId(x));

  if (candidate) return candidate;

  return "Unknown player";
};


  // Try to resolve a playerId from a name (only possible if playerApi.byName exists)
  const resolvePlayerIdFromName = (name) => {
    const p = lookupPlayerByName(name);
    const id = p?.id ?? p?.playerId ?? null;
    return id != null ? String(id) : null;
  };

  // Find a player object in a roster (works whether roster stores {name} or {playerId})
  const findRosterPlayer = (teamObj, playerRef) => {
    const roster = Array.isArray(teamObj?.roster) ? teamObj.roster : [];
    const refStr = String(playerRef || "").trim();
    if (!refStr) return null;

    // If refStr matches a known id, compare ids
    const pById = lookupPlayerById(refStr);
    const refId = pById ? String(pById.id ?? pById.playerId ?? refStr) : null;

    if (refId) {
      const hit = roster.find((pl) => {
        const pid = pl?.playerId ?? pl?.id ?? null;
        return pid != null && String(pid) === refId;
      });
      if (hit) return hit;
    }

    // Otherwise compare by name (case-insensitive)
    const refNameKey = normalizeName(refStr);
    return (
      roster.find((pl) => normalizeName(pl?.name) === refNameKey) || null
    );
  };

  // 🔒 Helper: is this player already on any roster?
  const isPlayerRostered = (playerNameOrId) => {
    if (!teams || !teams.length) return false;
    const raw = String(playerNameOrId || "").trim();
    if (!raw) return false;

    // If we can resolve an id, check by id first
    const resolvedId =
      lookupPlayerById(raw)?.id ||
      lookupPlayerById(raw)?.playerId ||
      resolvePlayerIdFromName(raw);

    if (resolvedId) {
      const idStr = String(resolvedId);
      return teams.some((t) =>
        (t.roster || []).some((p) => {
          const pid = p?.playerId ?? p?.id ?? null;
          return pid != null && String(pid) === idStr;
        })
      );
    }

    // Fallback: check by name
    const key = normalizeName(raw);
    return teams.some((t) =>
      (t.roster || []).some((p) => normalizeName(p?.name) === key)
    );
  };

  const bids = freeAgents || [];
  const activeBids = bids.filter((b) => !b.resolved);
  const myBids = isManager
    ? bids.filter((b) => b.team === myTeamName && !b.resolved)
    : [];

  // Group active bids by player (for live auctions list)
  // Group active bids by auctionKey (ID-only) for live auctions list
const activeAuctionsByPlayer = (() => {
  const byKey = new Map();

  for (const b of activeBids) {
    // Canonical: auctionKey ("id:123")
    const rawKey = String(b?.auctionKey || "").trim();
    if (!rawKey) continue;

    const key = rawKey.toLowerCase(); // "id:123"
    const pid = normalizeNhlId(rawKey) ?? normalizeNhlId(b?.playerId);

    if (!byKey.has(key)) {
      byKey.set(key, {
        key,              // "id:123"
        auctionKey: key,  // same
        playerId: pid,    // numeric NHL id
        position: b.position || "F",
        bids: [],
      });
    }
    byKey.get(key).bids.push(b);
  }

  return Array.from(byKey.values());
})();


  const handleLiveBidInputChange = (playerKey, value) => {
    setLiveBidInputs((prev) => ({
      ...prev,
      [playerKey]: value,
    }));
  };

  // 🔒 Strengthened: no inline bids after Sunday deadline
const handleLiveBidSubmit = (auction) => {
  const playerKey = auction.key; // "id:123"
  const rawAmount = (liveBidInputs[playerKey] || "").trim();

  if (!rawAmount) {
    window.alert("Enter a bid amount for this player.");
    return;
  }

  if (nowMs > nextSunday.getTime()) {
    window.alert(
      "Auction window is closed. Bids after the Sunday 4:00 PM deadline do not count."
    );
    return;
  }

  if (typeof onPlaceBid !== "function") {
    window.alert("Auction error: onPlaceBid is not wired (not a function).");
    return;
  }

  const pid =
    normalizeNhlId(auction?.playerId) ||
    normalizeNhlId(auction?.auctionKey) ||
    normalizeNhlId(auction?.key) ||
    null;

  if (!pid) {
    window.alert("Auction error: missing playerId for this auction.");
    return;
  }

  const p = lookupPlayerById(pid);
  const displayName = String(p?.name || "").trim(); // optional (for UX/log text only)

  onPlaceBid({
    playerId: String(pid),
    playerName: displayName, // ok if blank; leagueUtils will fallback safely
    position: auction.position,
    amount: rawAmount,
  });

  setLiveBidInputs((prev) => ({
    ...prev,
    [playerKey]: "",
  }));
};


  // --- Trade draft helpers ---
  const activeDraftFromThisManager =
    isManager && tradeDraft && tradeDraft.fromTeam === currentUser.teamName;

  const canSubmitTrade =
    activeDraftFromThisManager &&
    (tradeDraft?.requestedPlayers || []).length > 0 &&
    (tradeDraft?.offeredPlayers || []).length > 0;

  const handleClearTradeDraft = () => setTradeDraft(null);

  const updateDraftField = (field, value) => {
    setTradeDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  const updateRetention = (which, playerRef, value) => {
    setTradeDraft((prev) => {
      if (!prev) return prev;
      const key = which === "from" ? "retentionFrom" : "retentionTo";
      return {
        ...prev,
        [key]: {
          ...(prev[key] || {}),
          [playerRef]: value,
        },
      };
    });
  };

  // --- Pending trades visible to this user ---
  const pendingTradesForUser = (tradeProposals || []).filter((tr) => {
    if (!tr || tr.status !== "pending") return false;

    if (currentUser.role === "commissioner") return true;

    if (currentUser.role === "manager") {
      return tr.fromTeam === currentUser.teamName || tr.toTeam === currentUser.teamName;
    }

    return false;
  });

  const canAcceptOrReject = (tr) =>
    currentUser.role === "commissioner" ||
    (currentUser.role === "manager" && tr.toTeam === currentUser.teamName);

  const canCancel = (tr) =>
    currentUser.role === "commissioner" ||
    (currentUser.role === "manager" && tr.fromTeam === currentUser.teamName);

  const canCounter = (tr) => canAcceptOrReject(tr);

  // --- CapFriendly-style preview for current draft ---
  let preview = null;
  if (activeDraftFromThisManager && tradeDraft && teams?.length) {
    const fromTeamObj = teams.find((t) => t.name === tradeDraft.fromTeam);
    const toTeamObj = teams.find((t) => t.name === tradeDraft.toTeam);

    if (fromTeamObj && toTeamObj) {
      preview = buildTradeImpactPreview({
        fromTeam: fromTeamObj,
        toTeam: toTeamObj,
        offeredPlayers: tradeDraft.offeredPlayers || [],
        requestedPlayers: tradeDraft.requestedPlayers || [],
        retentionFrom: tradeDraft.retentionFrom || {},
        retentionTo: tradeDraft.retentionTo || {},
        penaltyFrom: tradeDraft.penaltyFrom,
        penaltyTo: tradeDraft.penaltyTo,
        capLimit,
        maxRosterSize,
        minForwards,
        minDefensemen,
      });
    }
  }

  const fromPreview = preview?.fromPreview || null;
  const toPreview = preview?.toPreview || null;
  const previewIssues = preview?.issues || [];

  // --- Retention spot validation (max 3 per team) ---
  const MAX_RETENTION_SPOTS = 3;
  let retentionIssues = [];

  if (activeDraftFromThisManager && tradeDraft && teams?.length) {
    const fromTeamObj = teams.find((t) => t.name === tradeDraft.fromTeam);
    const toTeamObj = teams.find((t) => t.name === tradeDraft.toTeam);

    if (fromTeamObj && toTeamObj) {
      const currentFromRetention = countRetentionSpots(fromTeamObj);
      const currentToRetention = countRetentionSpots(toTeamObj);

      const newFromRetention = Object.entries(tradeDraft.retentionFrom || {}).filter(
        ([ref, value]) => {
          const amount = Number(value);
          if (!tradeDraft.offeredPlayers?.includes(ref)) return false;
          return amount > 0;
        }
      ).length;

      const newToRetention = Object.entries(tradeDraft.retentionTo || {}).filter(
        ([ref, value]) => {
          const amount = Number(value);
          if (!tradeDraft.requestedPlayers?.includes(ref)) return false;
          return amount > 0;
        }
      ).length;

      const fromRetentionAfter = currentFromRetention + newFromRetention;
      const toRetentionAfter = currentToRetention + newToRetention;

      if (fromRetentionAfter > MAX_RETENTION_SPOTS) {
        retentionIssues.push(
          `${tradeDraft.fromTeam} would have ${fromRetentionAfter} retained-salary positions (max ${MAX_RETENTION_SPOTS}).`
        );
      }
      if (toRetentionAfter > MAX_RETENTION_SPOTS) {
        retentionIssues.push(
          `${tradeDraft.toTeam} would have ${toRetentionAfter} retained-salary positions (max ${MAX_RETENTION_SPOTS}).`
        );
      }
    }
  }

  const allIssues = [...previewIssues, ...retentionIssues];
  const tradeBlockedByRetention = retentionIssues.length > 0;

  const capColor = (capAfter, capBefore) => {
    const diff = capAfter - capBefore;
    if (diff > 0) return "#f97373";
    if (diff < 0) return "#bbf7d0";
    return "#e5e7eb";
  };

  const rosterColor = (sizeAfter) => (sizeAfter > maxRosterSize ? "#f97373" : "#e5e7eb");

  const posColor = (posAfter) => {
    if (posAfter.F < minForwards || posAfter.D < minDefensemen) return "#facc15";
    return "#e5e7eb";
  };

  const pillStyle = {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "999px",
    border: "1px solid #334155",
    background: "#0b1220",
    color: "#e2e8f0",
    fontSize: "0.75rem",
    marginRight: "6px",
    marginTop: "4px",
    whiteSpace: "nowrap",
  };

  const canSubmitThisTrade = canSubmitTrade && !tradeBlockedByRetention;


// Try to match the roster-name feel (bold, slightly larger, crisp)
const auctionNameStyle = {
  fontWeight: 800,
  fontSize: "0.95rem",
  color: "#e5e7eb",
};

  // --- Render ---
  return (
    <div
      style={{
        background: "#0f172a",
        padding: "16px",
        borderRadius: "8px",
        border: "1px solid #1e293b",
        color: "#e5e7eb",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Team Tools</h2>

    

     {/* ===========================
    Trades (ONE section)
   =========================== */}
<hr style={{ margin: "12px 0", borderColor: "#334155" }} />

<div
  style={{
    padding: "12px",
    borderRadius: "10px",
    background: "#0b1220",
    border: "1px solid #1f2937",
  }}
>
  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, fontWeight:1200 }}>
    <h3 style={{ margin: 0 }}>Trades</h3>
    
  </div>

  {/* ---------- Trade Builder (current draft) ---------- */}
  <div style={{ marginTop: 10 }}>
    <div style={{ fontWeight: 800, marginBottom: 6 }}>Trade builder</div>

    {isManager ? (
      <>
        {activeDraftFromThisManager && tradeDraft ? (
          <div
            style={{
              padding: "10px",
              borderRadius: "10px",
              background: "#020617",
              border: "1px solid #1f2937",
              fontSize: "0.85rem",
            }}
          >
            {(() => {
              const getTeamByName = (name) => (teams || []).find((t) => t.name === name);

              const getMaxBuyoutForTeam = (teamName) => {
                const t = getTeamByName(teamName);
                return totalBuyoutPenalty(t);
              };

              const getPlayerSalary = (teamName, playerRef) => {
                const t = getTeamByName(teamName);
                const p = findRosterPlayer(t, playerRef);
                return Number(p?.salary) || 0;
              };

              const getMaxRetentionForPlayer = (teamName, playerRef) => {
                const s = getPlayerSalary(teamName, playerRef);
                return Math.ceil(s * 0.5);
              };

              const maxPenaltyFrom = getMaxBuyoutForTeam(tradeDraft.fromTeam);
              const maxPenaltyTo = getMaxBuyoutForTeam(tradeDraft.toTeam);

              return (
                <>
                  <div style={{ marginBottom: 8, color: "#a5b4fc" }}>
                    <strong>{tradeDraft.fromTeam}</strong> → <strong>{tradeDraft.toTeam}</strong>
                  </div>

                  <div style={{ display: "grid", gap: 6 }}>
                    <div>
                      <span style={{ color: "#94a3b8" }}>Requested:</span>{" "}
                      <strong>
                        {tradeDraft.requestedPlayers?.length
                          ? tradeDraft.requestedPlayers.map(getPlayerDisplayName).join(", ")
                          : "—"}
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: "#94a3b8" }}>Offered:</span>{" "}
                      <strong>
                        {tradeDraft.offeredPlayers?.length
                          ? tradeDraft.offeredPlayers.map(getPlayerDisplayName).join(", ")
                          : "—"}
                      </strong>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: "1px solid #111827",
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <label style={{ fontSize: "0.8rem" }}>
                        <strong>Your buyout penalty</strong>{" "}
                        <span style={{ color: "#94a3b8" }}>(max ${maxPenaltyFrom})</span>
                        <br />
                        <input
                          type="number"
                          min="0"
                          max={maxPenaltyFrom}
                          value={tradeDraft.penaltyFrom ?? ""}
                          onChange={(e) => updateDraftField("penaltyFrom", e.target.value)}
                          style={{ marginTop: 4, width: 90, fontSize: "0.85rem" }}
                        />{" "}
                        $
                      </label>

                      <label style={{ fontSize: "0.8rem" }}>
                        <strong>Their buyout penalty</strong>{" "}
                        <span style={{ color: "#94a3b8" }}>(max ${maxPenaltyTo})</span>
                        <br />
                        <input
                          type="number"
                          min="0"
                          max={maxPenaltyTo}
                          value={tradeDraft.penaltyTo ?? ""}
                          onChange={(e) => updateDraftField("penaltyTo", e.target.value)}
                          style={{ marginTop: 4, width: 90, fontSize: "0.85rem" }}
                        />{" "}
                        $
                      </label>
                    </div>

                    {(tradeDraft.offeredPlayers?.length > 0 || tradeDraft.requestedPlayers?.length > 0) && (
                      <div style={{ fontSize: "0.8rem" }}>
                        <div style={{ fontWeight: 800, marginBottom: 6 }}>
                          Salary retention <span style={{ color: "#94a3b8" }}>(max 50%)</span>
                        </div>

                        {tradeDraft.offeredPlayers?.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <div style={{ color: "#94a3b8", marginBottom: 4 }}>You retain on:</div>
                            {tradeDraft.offeredPlayers.map((ref) => {
                              const maxRet = getMaxRetentionForPlayer(tradeDraft.fromTeam, ref);
                              return (
                                <div
                                  key={ref}
                                  style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}
                                >
                                  <span style={{ minWidth: 140 }}>{getPlayerDisplayName(ref)}</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max={maxRet}
                                    value={(tradeDraft.retentionFrom || {})[ref] ?? ""}
                                    onChange={(e) => updateRetention("from", ref, e.target.value)}
                                    style={{ width: 90, fontSize: "0.85rem" }}
                                  />
                                  <span style={{ color: "#94a3b8" }}>$ (max {maxRet})</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {tradeDraft.requestedPlayers?.length > 0 && (
                          <div>
                            <div style={{ color: "#94a3b8", marginBottom: 4 }}>Ask them to retain on:</div>
                            {tradeDraft.requestedPlayers.map((ref) => {
                              const maxRet = getMaxRetentionForPlayer(tradeDraft.toTeam, ref);
                              return (
                                <div
                                  key={ref}
                                  style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}
                                >
                                  <span style={{ minWidth: 140 }}>{getPlayerDisplayName(ref)}</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max={maxRet}
                                    value={(tradeDraft.retentionTo || {})[ref] ?? ""}
                                    onChange={(e) => updateRetention("to", ref, e.target.value)}
                                    style={{ width: 90, fontSize: "0.85rem" }}
                                  />
                                  <span style={{ color: "#94a3b8" }}>$ (max {maxRet})</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {fromPreview && toPreview && (
                    <div style={{ marginTop: 10 }}>
                      {/* keep your existing preview box exactly as-is */}
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "8px",
                          borderRadius: "6px",
                          background: "#020617",
                          border: "1px solid #1f2937",
                        }}
                      >
                        <div style={{ fontSize: "0.8rem", marginBottom: "4px" }}>
                          {allIssues.length === 0 ? (
                            <span style={{ color: "#4ade80" }}>✔ Both teams remain legal.</span>
                          ) : (
                            <span style={{ color: "#facc15" }}>⚠ Issues if accepted.</span>
                          )}
                        </div>

                        <div style={{ fontSize: "0.8rem", marginBottom: "4px", color: "#a5b4fc" }}>
                          Trade impact preview
                        </div>

                        <div style={{ display: "flex", gap: "12px", fontSize: "0.8rem", flexWrap: "wrap" }}>
                          <div style={{ flex: 1, minWidth: "160px" }}>
                            <div style={{ fontWeight: 800, marginBottom: "4px", fontSize: "1.05rem" }}>
                              {tradeDraft.fromTeam}
                            </div>
                            <div>
                              Cap: ${fromPreview.capBefore} →{" "}
                              <span style={{ color: capColor(fromPreview.capAfter, fromPreview.capBefore) }}>
                                ${fromPreview.capAfter}
                              </span>
                            </div>
                            <div>
                              Roster:{" "}
                              <span style={{ color: rosterColor(fromPreview.sizeAfter) }}>
                                {fromPreview.sizeBefore} → {fromPreview.sizeAfter}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: posColor(fromPreview.posAfter) }}>
                                F: {fromPreview.posBefore.F} → {fromPreview.posAfter.F}, D:{" "}
                                {fromPreview.posBefore.D} → {fromPreview.posAfter.D}
                              </span>
                            </div>
                            <div>Buyouts: ${fromPreview.penaltiesBefore} → ${fromPreview.penaltiesAfter}</div>
                            <div>Retentions: {fromPreview.retentionBefore} → {fromPreview.retentionAfter}</div>
                          </div>

                          <div style={{ flex: 1, minWidth: "160px" }}>
                            <div style={{ fontWeight: 800, marginBottom: "4px", fontSize: "1.05rem" }}>
                              {tradeDraft.toTeam}
                            </div>
                            <div>
                              Cap: ${toPreview.capBefore} →{" "}
                              <span style={{ color: capColor(toPreview.capAfter, toPreview.capBefore) }}>
                                ${toPreview.capAfter}
                              </span>
                            </div>
                            <div>
                              Roster:{" "}
                              <span style={{ color: rosterColor(toPreview.sizeAfter) }}>
                                {toPreview.sizeBefore} → {toPreview.sizeAfter}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: posColor(toPreview.posAfter) }}>
                                F: {toPreview.posBefore.F} → {toPreview.posAfter.F}, D:{" "}
                                {toPreview.posBefore.D} → {toPreview.posAfter.D}
                              </span>
                            </div>
                            <div>Buyouts: ${toPreview.penaltiesBefore} → ${toPreview.penaltiesAfter}</div>
                            <div>Retentions: {toPreview.retentionBefore} → {toPreview.retentionAfter}</div>
                          </div>
                        </div>

                        {allIssues.length > 0 && (
                          <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "#facc15" }}>
                            <div style={{ fontWeight: "bold" }}>Issues:</div>
                            <ul style={{ margin: 0, paddingLeft: "16px" }}>
                              {allIssues.map((msg, idx) => (
                                <li key={idx}>{msg}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                    <button
                      onClick={handleClearTradeDraft}
                      style={{
                        padding: "5px 10px",
                        fontSize: "0.85rem",
                        backgroundColor: "#374151",
                        color: "#e5e7eb",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      Clear
                    </button>

                    <button
                      onClick={() => onSubmitTradeDraft(tradeDraft)}
                      disabled={!canSubmitThisTrade}
                      style={{
                        padding: "5px 12px",
                        fontSize: "0.85rem",
                        backgroundColor: canSubmitThisTrade ? "#16a34a" : "#4b5563",
                        color: "#e5e7eb",
                        border: "none",
                        borderRadius: "8px",
                        cursor: canSubmitThisTrade ? "pointer" : "not-allowed",
                        opacity: canSubmitThisTrade ? 1 : 0.8,
                      }}
                    >
                      Submit offer
                    </button>
                  </div>

                  {!canSubmitTrade && (
                    <div style={{ marginTop: 6, fontSize: "0.78rem", color: "#9ca3af" }}>
                      Add at least 1 requested player and 1 offered player.
                    </div>
                  )}

                  <div style={{ marginTop: 6, fontSize: "0.78rem", color: "#9ca3af" }}>
                    Use <em>Request</em> on another roster, then <em>Offer</em> on your roster.
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
            Use <em>Request</em> on another roster, then <em>Offer</em> on your roster.
          </div>
        )}
      </>
    ) : (
      <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Log in as a manager to build trade offers.</div>
    )}
  </div>

  {/* ---------- Pending Trades (same section, no divider) ---------- */}
  <div style={{ marginTop: 14 }}>
    <div style={{ fontWeight: 800, marginBottom: 6 }}>Pending</div>

    {pendingTradesForUser.length === 0 ? (
      <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No pending trades.</div>
    ) : (
      pendingTradesForUser.map((tr) => {
        const youAreFrom = currentUser.role === "manager" && tr.fromTeam === currentUser.teamName;
        const youAreTo = currentUser.role === "manager" && tr.toTeam === currentUser.teamName;
const offeredList = tr.offeredPlayers || []; // fromTeam sends
const requestedList = tr.requestedPlayers || []; // toTeam sends

const penaltyFromAmt = Number(tr.penaltyFrom) || 0;
const penaltyToAmt = Number(tr.penaltyTo) || 0;

const hasPenaltyFrom = penaltyFromAmt > 0;
const hasPenaltyTo = penaltyToAmt > 0;

// retention maps (ONLY players with >0 retained)
const rFrom = Object.fromEntries(
  Object.entries(tr.retentionFrom || {}).filter(([, v]) => Number(v) > 0)
);
const rTo = Object.fromEntries(
  Object.entries(tr.retentionTo || {}).filter(([, v]) => Number(v) > 0)
);

const leftTeam = tr.fromTeam;
const rightTeam = tr.toTeam;

const leftColor = getTeamColor(leftTeam);
const rightColor = getTeamColor(rightTeam);

const sideBox = (teamColor) => ({
  flex: 1,
  minWidth: 170,
  borderRadius: 12,
  border: "1px solid #1f2937",
  background: `linear-gradient(
    180deg,
    ${teamColor}55 0%,
    ${teamColor}22 35%,
    rgba(2,6,23,0) 80%
  )`,
  padding: "10px 10px 8px",
});

const itemRow = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 10,
  padding: "6px 8px",
  borderRadius: 10,
  border: "1px solid #1f2937",
  background: "#020617",
};

const subLine = {
  color: "#94a3b8",
  fontSize: "0.78rem",
  marginTop: 6,
};

return (
  <div
    key={tr.id}
    style={{
      padding: 10,
      background: "#0b1220",
      borderRadius: 12,
      border: "1px solid #1f2937",
      marginBottom: 10,
      fontSize: "0.85rem",
      boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    }}
  >
    {/* Header */}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <div style={{ fontWeight: 900 }}>
        {leftTeam} <span style={{ color: "#94a3b8" }}>↔</span> {rightTeam}
      </div>
      <div style={{ color: "#94a3b8", fontSize: "0.78rem" }}>Pending</div>
    </div>

    {/* Two columns */}
    <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
      {/* LEFT: fromTeam receives what toTeam sends = requestedList */}
      <div style={sideBox(leftColor)}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>
          {leftTeam} <span style={{ color: "#94a3b8" }}>receives</span>
        </div>

        {requestedList.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {requestedList.map((ref) => {
              const nm = getPlayerDisplayName(ref);
              const retained = Number(rTo[ref] || 0); // retention by right team on what it sends
              return (
                <div key={`L-${ref}`} style={itemRow}>
                  <span style={{ fontWeight: 800 }}>{nm}</span>
                  {retained > 0 && (
                    <span style={{ color: "#fbbf24", fontWeight: 900, whiteSpace: "nowrap" }}>
                      ${retained} retained
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ color: "#94a3b8" }}>—</div>
        )}

        {hasPenaltyTo && (
          <div style={subLine}>
            + {rightTeam} buyout: <strong style={{ color: "#e5e7eb" }}>${penaltyToAmt}</strong>
          </div>
        )}
      </div>

      {/* RIGHT: toTeam receives what fromTeam sends = offeredList */}
      <div style={sideBox(rightColor)}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>
          {rightTeam} <span style={{ color: "#94a3b8" }}>receives</span>
        </div>

        {offeredList.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {offeredList.map((ref) => {
              const nm = getPlayerDisplayName(ref);
              const retained = Number(rFrom[ref] || 0); // retention by left team on what it sends
              return (
                <div key={`R-${ref}`} style={itemRow}>
                  <span style={{ fontWeight: 800 }}>{nm}</span>
                  {retained > 0 && (
                    <span style={{ color: "#fbbf24", fontWeight: 900, whiteSpace: "nowrap" }}>
                      ${retained} retained
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ color: "#94a3b8" }}>—</div>
        )}

        {hasPenaltyFrom && (
          <div style={subLine}>
            + {leftTeam} buyout: <strong style={{ color: "#e5e7eb" }}>${penaltyFromAmt}</strong>
          </div>
        )}
      </div>
    </div>

    {/* Actions */}
    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
      {canAcceptOrReject(tr) && (
        <>
          <button
            onClick={() => onAcceptTrade(tr.id)}
            style={{
              padding: "4px 10px",
              fontSize: "0.85rem",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              backgroundColor: "#16a34a",
              color: "#e5e7eb",
              fontWeight: 800,
            }}
          >
            Accept
          </button>
          <button
            onClick={() => onRejectTrade(tr.id)}
            style={{
              padding: "4px 10px",
              fontSize: "0.85rem",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              backgroundColor: "#b91c1c",
              color: "#e5e7eb",
              fontWeight: 800,
            }}
          >
            Reject
          </button>
        </>
      )}

      {canCancel(tr) && (
        <button
          onClick={() => onCancelTrade(tr.id)}
          style={{
            padding: "4px 10px",
            fontSize: "0.85rem",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            backgroundColor: "#334155",
            color: "#e5e7eb",
            fontWeight: 800,
          }}
        >
          Cancel
        </button>
      )}

      {canCounter(tr) && (
        <button
          onClick={() => onCounterTrade && onCounterTrade(tr)}
          style={{
            padding: "4px 10px",
            fontSize: "0.85rem",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            backgroundColor: "#0ea5e9",
            color: "#e5e7eb",
            fontWeight: 800,
          }}
        >
          Counter
        </button>
      )}
    </div>

    {(youAreFrom || youAreTo) && (
      <div style={{ marginTop: 6, fontSize: "0.78rem", color: "#9ca3af" }}>
        {youAreTo ? "You can accept/reject this offer." : "Waiting on the other team."}
      </div>
    )}
  </div>
);


      })
    )}
  </div>

  {/* ---------- Trade Block (same section, no divider) ---------- */}
  <div style={{ marginTop: 14 }}>
    <div style={{ fontWeight: 800, marginBottom: 6 }}>Trade block</div>

    {(!tradeBlock || tradeBlock.length === 0) ? (
      <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>No players on the trade block yet.</div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.85rem" }}>
        {tradeBlock.map((entry) => {
          const canRemove =
            currentUser.role === "commissioner" ||
            (currentUser.role === "manager" && currentUser.teamName === entry.team);

          return (
            <div
              key={entry.id}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                background: "#020617",
                border: "1px solid #1f2937",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <span>
                  <strong>{entry.team}</strong> — {getPlayerDisplayName(entry.player)}
                </span>

                {canRemove && (
                  <button
                    onClick={() => onRemoveTradeBlockEntry(entry)}
                    style={{
                      padding: "4px 10px",
                      fontSize: "0.8rem",
                      borderRadius: 8,
                      border: "none",
                      cursor: "pointer",
                      backgroundColor: "#6b7280",
                      color: "#e5e7eb",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              {entry.needs && (
                <div style={{ marginTop: 4, color: "#9ca3af" }}>
                  <strong>Notes:</strong> {entry.needs}
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}

    {isManager && (
      <div style={{ marginTop: 6, fontSize: "0.78rem", color: "#9ca3af" }}>
        Add players using <em>Add to trade block</em> on your roster.
      </div>
    )}
  </div>
</div>


      {/* ---------- Free Agent Auctions ---------- */}
      <hr style={{ border: "none", borderTop: "1px solid #334155", margin: "16px 0" }} />

      <h3 style={{ marginTop: 0 }}>Free Agent Auctions</h3>

      <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: 0, marginBottom: "6px" }}>
        <div>Time remaining:</div>

        <div
          className={`auction-countdown ${timeRemainingMs < 24 * 60 * 60 * 1000 ? "urgent" : ""} ${
            timeRemainingMs < 60 * 60 * 1000 ? "critical" : ""
          }`}
        >
          <div className="label">{timeRemainingMs < 60 * 60 * 1000 ? "FINAL HOUR" : "Auction rollover in"}</div>
          <div className="time">{formatCountdown(timeRemainingMs)}</div>
        </div>
      </div>

      {/* Manager: start a new auction */}
      {isManager ? (
        <div
          style={{
            marginTop: "8px",
            marginBottom: "12px",
            padding: "8px",
            borderRadius: "6px",
            background: "#020617",
            border: "1px solid #1f2937",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "6px" }}>
                        <div style={{ position: "relative", flex: "1 1 140px" }}>
              <input
                type="text"
                placeholder="Search player"
                value={playerSearchQuery}
                onChange={(e) => {
  const v = e.target.value;

 setPlayerSearchQuery(v);
setPlayerSearchOpen(true);

if (
  selectedAuctionPlayer &&
  v.trim() !== String(selectedAuctionPlayer.fullName || "").trim()
) {
  setSelectedAuctionPlayer(null);
  setBidPlayerName(""); // keep bidPlayerName derived from selection only
}

  setPlayerSearchOpen(true);

  // 🔒 If they type after selecting, selection is no longer trusted
  if (selectedAuctionPlayer && v.trim() !== String(selectedAuctionPlayer.fullName || "").trim()) {
    setSelectedAuctionPlayer(null);
  }
}}

                onFocus={() => {
                  if (playerSearchResults.length > 0) setPlayerSearchOpen(true);
                }}
                onBlur={() => {
                  // small delay so click can register
                  setTimeout(() => setPlayerSearchOpen(false), 150);
                }}
                style={{ width: "100%" }}
              />

              {playerSearchOpen &&
                (playerSearchLoading || playerSearchResults.length > 0) && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      marginTop: 4,
                      background: "#020617",
                      border: "1px solid #1f2937",
                      borderRadius: 6,
                      zIndex: 50,
                      maxHeight: 260,
                      overflowY: "auto",
                    }}
                  >
                    {playerSearchLoading && (
                      <div style={{ padding: "8px", fontSize: "0.85rem", color: "#9ca3af" }}>
                        Searching…
                      </div>
                    )}

                    {!playerSearchLoading &&
                      playerSearchResults.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onMouseDown={(evt) => evt.preventDefault()} // prevents blur killing the click
                          onClick={() => {
  const norm = normalizeSearchPlayer(p);

  // TEMP DEBUG (remove after verification)
  console.log("[AUCTION] dropdown raw player:", p);
  console.log("[AUCTION] dropdown normalized:", norm);

  if (!norm?.id) {
    window.alert("That player result is missing a valid NHL playerId. Try another search result.");
    return;
  }

  setSelectedAuctionPlayer(norm);       // ✅ store canonical shape
  setBidPlayerName(norm.fullName);      // keep existing auction storage
  setPlayerSearchQuery(norm.fullName);  // show selection
  setPlayerSearchOpen(false);

  // Optional: auto-set position
  if (norm.position === "D") setBidPosition("D");
}}


                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "8px 10px",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "#e5e7eb",
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>
                            {p.fullName}
                            <span style={{ fontWeight: 400, color: "#94a3b8" }}>
                              {" "}
                              · {p.position || "?"} · {p.teamAbbrev || "?"}
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
            </div>

            
            <input
              type="number"
              min="1"
              placeholder="Bid $"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              style={{ width: "90px" }}
            />
          </div>

          <button
  disabled={!canStartAuction}
  onClick={() => {
    if (!canStartAuction) return;

    try {
      const trimmedName = bidPlayerName.trim();
      if (!trimmedName || !bidAmount) {
        window.alert("Enter a player name and bid amount.");
        return;
      }

      // 🔒 Phase 2A: only allow auctions for players picked from dropdown
      if (!selectedAuctionPlayer || !selectedAuctionPlayer.id) {
        window.alert("Pick a player from the dropdown list (you can’t auction custom names).");
        return;
      }

      if (typeof onPlaceBid !== "function") {
        window.alert("Auction error: onPlaceBid is not wired (not a function).");
        console.error("[AUCTION] onPlaceBid is not a function:", onPlaceBid);
        return;
      }

      const auctionKey = `id:${String(selectedAuctionPlayer.id).trim()}`.toLowerCase();
const isExistingAuction = activeAuctionsByPlayer.some((a) => a.key === auctionKey);



      if (nowMs > nextSunday.getTime()) {
        window.alert("Auction window is closed. Bids after the Sunday 4:00 PM deadline do not count.");
        return;
      }

      if (!isExistingAuction && nowMs > auctionCutoff.getTime()) {
        window.alert(
          "Too late to start a new auction for this week. You can start new auctions again after this Sunday’s deadline."
        );
        return;
      }

if (!isExistingAuction && isPlayerRostered(selectedAuctionPlayer.id || selectedAuctionPlayer.fullName)) {
        window.alert(
          "This player is already on a roster. You cannot start a free-agent auction for rostered players."
        );
        return;
      }

     onPlaceBid({
  playerId: String(selectedAuctionPlayer.id),
  playerName: selectedAuctionPlayer.fullName,
  
  amount: bidAmount,
});


      setBidPlayerName("");
      setBidAmount("");
      setPlayerSearchQuery("");
      setSelectedAuctionPlayer(null);
      setPlayerSearchResults([]);
      setPlayerSearchOpen(false);
    } catch (err) {
      console.error("[AUCTION] Start/place bid crashed:", err);
      window.alert("Auction crashed — check console for [AUCTION] error.");
    }
  }}
  style={{
    padding: "4px 10px",
    fontSize: "0.85rem",
    backgroundColor: canStartAuction ? "#16a34a" : "#4b5563",
    color: "#e5e7eb",
    border: "none",
    borderRadius: "4px",
    cursor: canStartAuction ? "pointer" : "not-allowed",
    opacity: canStartAuction ? 1 : 0.8,
  }}
>

            Start / place bid
          </button>
        </div>
      ) : (
        <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>Log in as a manager to place free-agent bids.</p>
      )}

      {/* Live auctions grouped by player (blind bidding) */}
      <div style={{ marginTop: "8px" }}>
        <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem" }}>Live auctions</h4>

        {activeAuctionsByPlayer.length === 0 ? (
          <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>No live auctions at the moment.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.85rem" }}>
            {activeAuctionsByPlayer.map((auction) => {
              const bidCount = auction.bids.length;
              const hasMyBid = isManager && auction.bids.some((b) => b.team === myTeamName);

              const playerKey = auction.key;
              const inputValue = liveBidInputs[playerKey] || "";

              const sortedBids = [...auction.bids].sort((a, b) => {
                const aAmt = Number(a.amount) || 0;
                const bAmt = Number(b.amount) || 0;
                if (bAmt !== aAmt) return bAmt - aAmt;
                const aTs = Number(a.firstTimestamp ?? a.timestamp ?? 0) || 0;
                const bTs = Number(b.firstTimestamp ?? b.timestamp ?? 0) || 0;
                return aTs - bTs;
              });

              return (
                <div
                  key={playerKey}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "6px",
                    background: "#020617",
                    border: "1px solid #1f2937",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                    <div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
<span style={rosterPosPill(auction.position)}>
  {auction.position}
</span>
  <span style={auctionNameStyle}>{getAuctionDisplayName(auction)}</span>
</div>

                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                        {bidCount === 0 ? "No bids placed yet." : bidCount === 1 ? "1 bid placed." : `${bidCount} bids placed.`}
                        {hasMyBid && <span style={{ color: "#4ade80" }}> • You have a bid.</span>}
                      </div>
                    </div>

                    {isManager && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {(() => {
                          const ui = computeBidUiStateForAuction({
                            auctionBids: auction.bids,
                            myTeamName,
                            nowMs,
                            inputValue,
                          });

                          return (
                            <>
                              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                <input
                                  type="number"
                                  min={ui.minRequired}
                                  placeholder={`Bid $ (min ${ui.minRequired})`}
                                  value={inputValue}
                                  onChange={(e) => handleLiveBidInputChange(playerKey, e.target.value)}
                                  style={{ width: "120px", fontSize: "0.8rem" }}
                                />

                                <button
                                  onClick={() => {
                                    if (ui.disabled) return;
                                    handleLiveBidSubmit(auction);
                                  }}
                                  disabled={ui.disabled}
                                  title={ui.reason || ""}
                                  style={{
                                    padding: "3px 8px",
                                    fontSize: "0.8rem",
                                    backgroundColor: ui.disabled ? "#4b5563" : "#0ea5e9",
                                    color: "#e5e7eb",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: ui.disabled ? "not-allowed" : "pointer",
                                    whiteSpace: "nowrap",
                                    opacity: ui.disabled ? 0.75 : 1,
                                  }}
                                >
                                  Place bid
                                </button>
                              </div>

                              <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                                {ui.reason ? ui.reason : `Edits used: ${ui.editsUsed}/${ui.maxEdits}`}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {isCommissioner && showBidAmounts && sortedBids.length > 0 && (
                      <div style={{ marginTop: "4px", fontSize: "0.75rem", color: "#e5e7eb" }}>
                        <div style={{ marginBottom: "2px", color: "#fbbf24" }}>Bid details:</div>
                        <ul style={{ margin: 0, paddingLeft: "16px" }}>
                          {sortedBids.map((b) => (
                            <li key={b.id}>
                              {b.team}: ${b.amount} ({new Date(b.timestamp).toLocaleString()})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isCommissioner && (
        <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <label style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px", color: "#e5e7eb" }}>
            <input type="checkbox" checked={showBidAmounts} onChange={(e) => setShowBidAmounts(e.target.checked)} />
            Show bid amounts (commissioner only)
          </label>

          <button
            onClick={onResolveAuctions}
            style={{
              padding: "4px 10px",
              fontSize: "0.85rem",
              backgroundColor: "#16a34a",
              color: "#e5e7eb",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Resolve all auctions
          </button>
        </div>
      )}

      {isManager && (
        <div style={{ marginTop: "12px" }}>
          <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem" }}>Your active bids</h4>

          {myBids.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>You have no bids yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.85rem" }}>
              {myBids.map((b) => (
                <div
                  key={b.id}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    background: "#020617",
                    border: "1px solid #1f2937",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
<span style={rosterPosPill(b.position)}>
  {b.position}
</span>
  <span style={auctionNameStyle}>{getBidDisplayName(b)}</span>
  <span style={{ color: "#9ca3af", fontWeight: 700 }}>
    — ${b.amount}
  </span>
</span>


                  <span style={{ color: "#6b7280", fontSize: "0.7rem", whiteSpace: "nowrap" }}>
                    {new Date(b.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TeamToolsPanel;
