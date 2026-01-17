// src/components/LeagueHistoryPanel.jsx
import React, { useMemo } from "react";

const HISTORY_MAX_HEIGHT_PX = 420;
const HISTORY_MAX_ENTRIES_UI = 50; // UI shows newest 50 (even if backend has more)

function formatTimestamp(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString();
}

const normalizeNhlId = (raw) => {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const stripped = s.toLowerCase().startsWith("id:") ? s.slice(3).trim() : s;
  const n = Number(stripped);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
};

const resolvePlayerTokenLabel = (token, playerApi) => {
  const raw = String(token || "").trim();
  if (!raw) return "";

  const pid = normalizeNhlId(raw);
  if (pid) {
    if (playerApi?.getPlayerNameById) {
      const nm = playerApi.getPlayerNameById(pid);
      if (nm) return nm;
    }
    const byId = playerApi?.byId;
    const obj =
      byId?.get?.(pid) ||
      byId?.get?.(String(pid)) ||
      byId?.[pid] ||
      byId?.[String(pid)];
    const nm = obj?.fullName || obj?.name;
    if (nm) return String(nm).trim();
    return raw;
  }

  return raw;
};

const joinPlayers = (arr, playerApi) => {
  if (!Array.isArray(arr) || arr.length === 0) return "nothing";
  return arr.map((p) => resolvePlayerTokenLabel(p, playerApi)).join(", ");
};

// ---------- grouping + colors ----------
function getEntryGroup(entry) {
  const t = String(entry?.type || "");

  if (t === "buyout") return "buyouts";

  if (
    t === "tradeProposed" ||
    t === "tradeAccepted" ||
    t === "tradeRejected" ||
    t === "tradeCancelled" ||
    t === "tradeExpired"
  ) {
    return "trades";
  }

  if (t === "faSigned" || t === "faAuctionStarted" || t === "commRemoveBid") return "auctions";

  if (
    t === "commRemovePlayer" ||
    t === "commEditTeam" ||
    t === "commFreezeToggle" ||
    t === "commClearAllBids" ||
    t === "commClearPendingTrades" ||
    t === "commCancelTrade" ||
    t === "commRestoreSnapshot" ||
    t === "commCreateSnapshot" ||
    t === "commResetDefaults" ||
    t === "commIdBackfill" ||
    t === "commNormalizeRosterNames"
  ) {
    return "comm";
  }

  return "other";
}

function getEntryIcon(entry) {
  switch (entry?.type) {
    // Commish
    case "commEditTeam":
      return "🛠️";
    case "commFreezeToggle":
      return "🧊";
    case "commClearAllBids":
      return "🧽";
    case "commClearPendingTrades":
      return "🚫";
    case "commCancelTrade":
      return "🛑";
    case "commRestoreSnapshot":
      return "🕘";
    case "commCreateSnapshot":
      return "📸";
    case "commResetDefaults":
      return "⚠️";
    case "commRemovePlayer":
      return "🧹";
    case "commIdBackfill":
      return "🧬";
    case "commNormalizeRosterNames":
      return "🧾";

    // Buyouts
    case "buyout":
      return "💸";

    // Trades
    case "tradeProposed":
      return "📤";
    case "tradeAccepted":
      return "✅";
    case "tradeRejected":
      return "❌";
    case "tradeCancelled":
      return "🚫";
    case "tradeExpired":
      return "⏰";

    // Auctions
    case "faSigned":
      return "🆓";
    case "faAuctionStarted":
      return "🔨";
    case "commRemoveBid":
      return "🧯";

    default:
      return "•";
  }
}

function getGroupTheme(group) {
  // Auctions yellow, Trades green, Buyouts purple, Commish red
  if (group === "auctions") {
    return { accent: "#fbbf24", bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.25)" };
  }
  if (group === "trades") {
    return { accent: "#22c55e", bg: "rgba(34,197,94,0.10)", border: "rgba(34,197,94,0.25)" };
  }
  if (group === "buyouts") {
    return { accent: "#a855f7", bg: "rgba(168,85,247,0.10)", border: "rgba(168,85,247,0.25)" };
  }
  if (group === "comm") {
    return { accent: "#ef4444", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.25)" };
  }
  return { accent: "#334155", bg: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.15)" };
}

// ---------- English rendering ----------
function renderEntryText(entry, playerApi) {
  const t = String(entry?.type || "");

  if (t === "buyout") {
    const who = resolvePlayerTokenLabel(entry.player, playerApi);
    const team = entry.team || "Unknown team";
    const pen = Number(entry.penalty) || 0;
    return `${team} bought out ${who || "a player"} (penalty $${pen}).`;
  }

  if (t === "tradeProposed") {
    const offered = joinPlayers(entry.offeredPlayers, playerApi);
    const requested = joinPlayers(entry.requestedPlayers, playerApi);
    return `${entry.fromTeam || "A team"} proposed a trade to ${entry.toTeam || "another team"}: send ${offered} for ${requested}.`;
  }

  if (t === "tradeAccepted") {
    const offered = joinPlayers(entry.offeredPlayers, playerApi);
    const requested = joinPlayers(entry.requestedPlayers, playerApi);

    const penaltyBits = [];
    if (entry.penaltyFrom && entry.penaltyFrom > 0) penaltyBits.push(`${entry.fromTeam} sent $${entry.penaltyFrom} buyout penalty`);
    if (entry.penaltyTo && entry.penaltyTo > 0) penaltyBits.push(`${entry.toTeam} sent $${entry.penaltyTo} buyout penalty`);

    const penaltyText = penaltyBits.length ? ` Included ${penaltyBits.join(" and ")}.` : "";
    return `Trade completed: ${entry.fromTeam} sent ${offered} to ${entry.toTeam} for ${requested}.${penaltyText}`;
  }

  if (t === "tradeRejected") return `Trade rejected: ${entry.fromTeam || "A team"} → ${entry.toTeam || "another team"}.`;
  if (t === "tradeCancelled") {
    const reason = entry.reason ? ` (${String(entry.reason)})` : "";
    return `Trade cancelled: ${entry.fromTeam || "A team"} → ${entry.toTeam || "another team"}${reason}.`;
  }
  if (t === "tradeExpired") return `Trade expired: ${entry.fromTeam || "A team"} → ${entry.toTeam || "another team"}.`;

  if (t === "faAuctionStarted") {
    const who = resolvePlayerTokenLabel(entry.playerId ? `id:${entry.playerId}` : entry.player, playerApi);
    return `${who || "A player"} is up for auction!`;
  }

  if (t === "faSigned") {
    const who = resolvePlayerTokenLabel(entry.playerId ? `id:${entry.playerId}` : entry.player, playerApi);
    const team = entry.team || "Unknown team";
    const amt = Number(entry.amount) || 0;
    return `${team} won free agent ${who || "a player"} for $${amt}.`;
  }

  // This is the “raw json” one in your screenshot:
  if (t === "commRemoveBid") {
    const team = entry.team || "Unknown team";
    const who = resolvePlayerTokenLabel(entry.playerId ? `id:${entry.playerId}` : entry.player, playerApi);
    return `Commissioner removed an auction bid: ${team} → ${who || "a player"}.`;
  }

  if (t === "commRemovePlayer") {
    const who = resolvePlayerTokenLabel(entry.player, playerApi);
    return `Commissioner removed ${who || "a player"} from ${entry.team || "a team"}.`;
  }
  if (t === "commEditTeam") return `Commissioner updated ${entry.team || "a team"}${entry.summary ? ` (${entry.summary})` : ""}.`;
  if (t === "commFreezeToggle") return entry.frozen ? "Commissioner froze the league." : "Commissioner unfroze the league.";
  if (t === "commClearAllBids") return "Commissioner cleared all auction bids.";
  if (t === "commClearPendingTrades") return "Commissioner cancelled all pending trades.";
  if (t === "commCancelTrade") return "Commissioner force-cancelled a trade.";
  if (t === "commRestoreSnapshot") return `Commissioner restored snapshot ${entry.snapshotId || "(unknown)"}.`;
  if (t === "commCreateSnapshot") return `Commissioner created a snapshot${entry.snapshotId ? ` (${entry.snapshotId})` : ""}.`;
  if (t === "commResetDefaults") return "Commissioner reset the league to defaults.";
  if (t === "commIdBackfill") return `Commissioner backfilled missing player IDs (${entry.count ?? entry.changedCount ?? "?"}).`;
  if (t === "commNormalizeRosterNames") return `Commissioner normalized roster names from DB (${entry.changedCount ?? "?"} changed).`;

  // fallback (English, no JSON)
  const bits = [];
  if (entry?.team) bits.push(`team=${entry.team}`);
  if (entry?.fromTeam) bits.push(`from=${entry.fromTeam}`);
  if (entry?.toTeam) bits.push(`to=${entry.toTeam}`);
  if (entry?.player || entry?.playerId) {
    const who = resolvePlayerTokenLabel(entry.playerId ? `id:${entry.playerId}` : entry.player, playerApi);
    if (who) bits.push(`player=${who}`);
  }
  const suffix = bits.length ? ` (${bits.join(", ")})` : "";
  return `Unknown activity: ${t || "unknown type"}${suffix}.`;
}

export default function LeagueHistoryPanel({
  leagueLog,
  historyFilter,
  setHistoryFilter,
  currentUser,
  onDeleteLogEntry,
  playerApi,
}) {
  const entries = useMemo(() => (Array.isArray(leagueLog) ? [...leagueLog] : []), [leagueLog]);

  const filtered = useMemo(() => {
    const list = entries.filter((entry) => {
      const group = getEntryGroup(entry);
      if (historyFilter === "all") return true;
      if (historyFilter === "buyouts") return group === "buyouts";
      if (historyFilter === "trades") return group === "trades";
      if (historyFilter === "auctions") return group === "auctions";
      if (historyFilter === "comm") return group === "comm";
      return true;
    });

    // Show newest first (your data is already newest-first, but this also handles mixed ordering safely)
    list.sort((a, b) => Number(b?.timestamp || 0) - Number(a?.timestamp || 0));

    // UI cap (separate from the real “delete oldest” rule, which we implement in App.jsx below)
    return list.slice(0, HISTORY_MAX_ENTRIES_UI);
  }, [entries, historyFilter]);

  const isCommissioner = currentUser?.role === "commissioner";
  const canDelete = isCommissioner && typeof onDeleteLogEntry === "function";

  const panelStyle = {
    marginTop: "16px",
    padding: "12px 14px",
    borderRadius: "10px",
    background: "#020617",
    border: "1px solid #1f2937",
    color: "#e5e7eb",
  };

  const smallLabel = { fontSize: "0.8rem", color: "#94a3b8" };

  const pillBase = (active) => ({
    padding: "4px 10px",
    borderRadius: "999px",
    border: "1px solid #1f2937",
    cursor: "pointer",
    background: active ? "#1d4ed8" : "#111827",
    color: "#e5e7eb",
    fontSize: "0.8rem",
    lineHeight: 1.2,
  });

  return (
    <div style={panelStyle}>
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center", marginBottom: 10 }}>
        <div>
          <h3 style={{ margin: 0 }}>League Activity History</h3>
          <div style={{ marginTop: 4, ...smallLabel }}>Showing {filtered.length} entries (newest first)</div>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button onClick={() => setHistoryFilter("all")} style={pillBase(historyFilter === "all")}>All</button>
          <button onClick={() => setHistoryFilter("buyouts")} style={pillBase(historyFilter === "buyouts")}>Buyouts</button>
          <button onClick={() => setHistoryFilter("trades")} style={pillBase(historyFilter === "trades")}>Trades</button>
          <button onClick={() => setHistoryFilter("auctions")} style={pillBase(historyFilter === "auctions")}>Auctions</button>
          <button onClick={() => setHistoryFilter("comm")} style={pillBase(historyFilter === "comm")}>Commish</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p style={{ fontSize: "0.9rem", color: "#9ca3af", margin: 0 }}>No activity yet.</p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            fontSize: "0.92rem",
            maxHeight: `${HISTORY_MAX_HEIGHT_PX}px`,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
            paddingRight: "6px",
          }}
        >
          {filtered.map((entry, idx) => {
            const group = getEntryGroup(entry);
            const theme = getGroupTheme(group);
            const icon = getEntryIcon(entry);
            const text = renderEntryText(entry, playerApi);
            const ts = entry?.timestamp ?? entry?.ts ?? null;
            const tsLabel = formatTimestamp(ts);

            return (
              <div
                key={`log:${String(entry?.id ?? "noid")}:${String(entry?.type ?? "notype")}:${String(entry?.timestamp ?? "")}:${idx}`}
                style={{
                  borderRadius: "10px",
                  border: `1px solid ${theme.border}`,
                  background: theme.bg,
                  padding: "10px 12px",
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto auto",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                {/* accent + icon */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 4, height: 22, borderRadius: 999, background: theme.accent }} />
                  <div style={{ width: 22, textAlign: "center", fontSize: "1.05rem" }}>{icon}</div>
                </div>

                {/* single-line English (wrap if needed) */}
                <div style={{ color: "#e2e8f0", lineHeight: 1.25, minWidth: 0 }}>{text}</div>

                {/* timestamp */}
                <div style={{ fontSize: "0.78rem", color: "#94a3b8", whiteSpace: "nowrap" }}>{tsLabel}</div>

                {/* delete */}
                {canDelete ? (
                  <button
                    onClick={() => onDeleteLogEntry(entry)}
                    title="Delete this log entry"
                    style={{
                      padding: "4px 10px",
                      fontSize: "0.85rem",
                      lineHeight: 1.1,
                      borderRadius: "8px",
                      border: "1px solid rgba(239,68,68,0.45)",
                      cursor: "pointer",
                      backgroundColor: "rgba(239,68,68,0.14)",
                      color: "#fecaca",
                    }}
                  >
                    X
                  </button>
                ) : (
                  <div />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}



