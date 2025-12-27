// src/components/LeagueHistoryPanel.jsx
import React from "react";

function formatTimestamp(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString();
}

function getEntryIcon(entry) {
  switch (entry.type) {
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
    case "buyout":
      return "💸";
    case "commRemovePlayer":
      return "🧹";
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
    case "faSigned":
      return "🆓";
      case "faAuctionStarted":
  return "🔨";

    default:
      return "•";
  }
}
const HISTORY_MAX_HEIGHT_PX = 420; // ~10 rows depending on font/spacing


function LeagueHistoryPanel({
  leagueLog,
  historyFilter,
  setHistoryFilter,
  currentUser,
  onDeleteLogEntry,
}) {
  const entries = leagueLog || [];

  const filtered = entries.filter((entry) => {
  if (historyFilter === "all") return true;

  if (historyFilter === "buyouts") return entry.type === "buyout";

  if (historyFilter === "trades") {
    return (
      entry.type === "tradeProposed" ||
      entry.type === "tradeAccepted" ||
      entry.type === "tradeRejected" ||
      entry.type === "tradeCancelled" ||
      entry.type === "tradeExpired"
    );
  }

  if (historyFilter === "comm") {
  return (
    entry.type === "commRemovePlayer" ||
    entry.type === "commEditTeam" ||
    entry.type === "commFreezeToggle" ||
    entry.type === "commClearAllBids" ||
    entry.type === "commClearPendingTrades" ||
    entry.type === "commCancelTrade" ||
    entry.type === "commRestoreSnapshot" ||
    entry.type === "commCreateSnapshot" ||
    entry.type === "commResetDefaults"
  );
}


  if (historyFilter === "auctions") {
    // auction-related items (currently FA signings)
return entry.type === "faSigned" || entry.type === "faAuctionStarted";
  }

  return true;
});


  return (
    <div
      style={{
        marginTop: "16px",
        padding: "12px 14px",
        borderRadius: "8px",
        background: "#020617",
        border: "1px solid #1f2937",
        color: "#e5e7eb",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "8px",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0 }}>League Activity History</h3>
        <div
          style={{
            display: "flex",
            gap: "6px",
            fontSize: "0.8rem",
          }}
        >
          <button
            onClick={() => setHistoryFilter("all")}
            style={{
              padding: "2px 6px",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
              backgroundColor:
                historyFilter === "all" ? "#1d4ed8" : "#111827",
              color: "#e5e7eb",
            }}
          >
            All
          </button>
          <button
            onClick={() => setHistoryFilter("buyouts")}
            style={{
              padding: "2px 6px",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
              backgroundColor:
                historyFilter === "buyouts" ? "#1d4ed8" : "#111827",
              color: "#e5e7eb",
            }}
          >
            Buyouts
          </button>
          <button
            onClick={() => setHistoryFilter("trades")}
            style={{
              padding: "2px 6px",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
              backgroundColor:
                historyFilter === "trades" ? "#1d4ed8" : "#111827",
              color: "#e5e7eb",
            }}
          >
            Trades
          </button>
          <button
    onClick={() => setHistoryFilter("auctions")}
    style={{
      padding: "2px 6px",
      borderRadius: "4px",
      border: "none",
      cursor: "pointer",
      backgroundColor:
        historyFilter === "auctions" ? "#1d4ed8" : "#111827",
      color: "#e5e7eb",
    }}
  >
    Auctions
  </button>
          <button
            onClick={() => setHistoryFilter("comm")}
            style={{
              padding: "2px 6px",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
              backgroundColor:
                historyFilter === "comm" ? "#1d4ed8" : "#111827",
              color: "#e5e7eb",
            }}
          >
            Commish
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
          No activity yet.
        </p>
      ) : (
        <div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "0.9rem",

    // ✅ fixed-size scroll box
    maxHeight: "420px",
    overflowY: "auto",
    overflowX: "hidden",
    WebkitOverflowScrolling: "touch",
    paddingRight: "6px",
  }}
>

          {filtered.map((entry) => {
            let text = "";

            if (entry.type === "buyout") {
              text = `${entry.team} bought out ${entry.player} (penalty $${entry.penalty}).`;
            } else if (entry.type === "commRemovePlayer") {
              text = `Commissioner removed ${entry.player} from ${entry.team}.`;
            } else if (entry.type === "tradeProposed") {
              const offered = (entry.offeredPlayers || []).join(", ") || "nothing";
              const requested =
                (entry.requestedPlayers || []).join(", ") || "nothing";
              text = `${entry.fromTeam} proposed a trade to ${entry.toTeam}: send ${offered} for ${requested}.`;
            } else if (entry.type === "tradeAccepted") {
              const offered = (entry.offeredPlayers || []).join(", ") || "nothing";
              const requested =
                (entry.requestedPlayers || []).join(", ") || "nothing";

              const penaltyBits = [];
              if (entry.penaltyFrom && entry.penaltyFrom > 0) {
                penaltyBits.push(
                  `${entry.fromTeam} sent $${entry.penaltyFrom} in buyout penalty`
                );
              }
              if (entry.penaltyTo && entry.penaltyTo > 0) {
                penaltyBits.push(
                  `${entry.toTeam} sent $${entry.penaltyTo} in buyout penalty`
                );
              }

              const penaltyText =
                penaltyBits.length > 0
                  ? ` Included ${penaltyBits.join(" and ")}.`
                  : "";

              text = `Trade completed: ${entry.fromTeam} sent ${offered} to ${entry.toTeam} for ${requested}.${penaltyText}`;
            } else if (entry.type === "tradeRejected") {
              text = `Trade rejected by ${entry.toTeam} (from ${entry.fromTeam}).`;
            } else if (entry.type === "tradeCancelled") {
              text = `Trade cancelled between ${entry.fromTeam} and ${entry.toTeam}.`;
            } else if (entry.type === "tradeExpired") {
              text = `Trade between ${entry.fromTeam} and ${entry.toTeam} expired.`;
            } else if (entry.type === "faSigned") {
              text = `${entry.team} won free agent ${entry.player} for $${entry.amount}.`;
              } else if (entry.type === "faAuctionStarted") {
  text = `${entry.player} is up for auction!`;
            } else if (entry.type === "commEditTeam") {
text = `Commissioner updated ${entry.team}${entry.summary ? ` (${entry.summary})` : ""}.`;
            } else if (entry.type === "commFreezeToggle") {
              text = entry.frozen
                ? "Commissioner froze the league."
                : "Commissioner unfroze the league.";
            } else if (entry.type === "commClearAllBids") {
              text = "Commissioner cleared all auction bids.";
            } else if (entry.type === "commClearPendingTrades") {
              text = "Commissioner cancelled all pending trades.";
            } else if (entry.type === "commCancelTrade") {
              text = "Commissioner force-cancelled a trade.";
            } else if (entry.type === "commRestoreSnapshot") {
              text = `Commissioner restored snapshot ${entry.snapshotId}.`;
            } else if (entry.type === "commCreateSnapshot") {
              text = `Commissioner created a snapshot${entry.snapshotId ? ` (${entry.snapshotId})` : ""}.`;
            } else if (entry.type === "commResetDefaults") {
              text = "Commissioner reset the league to defaults.";

            } else {
              text = JSON.stringify(entry);
            }

            const icon = getEntryIcon(entry);
            

            return (
              <div
                key={entry.id}
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  background: "#020617",
                  border: "1px solid #1f2937",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "18px", textAlign: "center" }}>{icon}</span>
                  <span>{text}</span>
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
  <span
    style={{
      fontSize: "0.75rem",
      color: "#6b7280",
      whiteSpace: "nowrap",
    }}
  >
    {formatTimestamp(entry.timestamp)}
  </span>
  

  {currentUser?.role === "commissioner" && typeof onDeleteLogEntry === "function" && (
    <button
      onClick={() => onDeleteLogEntry(entry)}
      title="Delete this log entry"
      style={{
        padding: "2px 8px",
        fontSize: "0.8rem",
        lineHeight: 1.2,
        borderRadius: "4px",
        border: "none",
        cursor: "pointer",
        backgroundColor: "#b91c1c",
        color: "#f9fafb",
      }}
    >
      X
    </button>
  )}
</div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LeagueHistoryPanel;
