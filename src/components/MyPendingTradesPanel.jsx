// src/components/MyPendingTradesPanel.jsx
import React from "react";
import { getVisiblePendingTradesForUser } from "../leagueUtils";

function formatDateTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString();
}

function MyPendingTradesPanel({
  currentUser,
  tradeProposals,
  onAcceptTrade,
  onRejectTrade,
  onCancelTrade,
}) {
  if (!currentUser) {
    return null; // not logged in, no pending trades view
  }

  const visibleTrades = getVisiblePendingTradesForUser(
    currentUser,
    tradeProposals
  );

  return (
    <div
      style={{
        marginTop: "16px",
        padding: "10px 12px",
        borderRadius: "8px",
        background: "#020617",
        border: "1px solid #1f2937",
      }}
    >
      <h2 style={{ marginTop: 0 }}>My Pending Trades</h2>

      {visibleTrades.length === 0 ? (
        <p style={{ color: "#9ca3af", margin: 0 }}>
          You have no pending trades right now.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {visibleTrades.map((tr) => {
            const isFromTeam =
              currentUser.role === "manager" &&
              currentUser.teamName === tr.fromTeam;
            const isToTeam =
              currentUser.role === "manager" &&
              currentUser.teamName === tr.toTeam;
            const isCommissioner = currentUser.role === "commissioner";

            const canAcceptOrReject =
              tr.status === "pending" && (isToTeam || isCommissioner);
            const canCancel =
              tr.status === "pending" && (isFromTeam || isCommissioner);

            const penaltySummaryParts = [];
            if (tr.penaltyFrom && tr.penaltyFrom > 0) {
              penaltySummaryParts.push(
                `${tr.fromTeam} sends $${tr.penaltyFrom} in buyout penalties`
              );
            }
            if (tr.penaltyTo && tr.penaltyTo > 0) {
              penaltySummaryParts.push(
                `${tr.toTeam} sends $${tr.penaltyTo} in buyout penalties`
              );
            }
            const penaltySummary = penaltySummaryParts.join(" | ");

            return (
              <div
                key={tr.id}
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  background: "#020617",
                  border: "1px solid #374151",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "8px",
                    marginBottom: "4px",
                    fontSize: "0.85rem",
                    color: "#9ca3af",
                  }}
                >
                  <span>
                    From <strong>{tr.fromTeam}</strong> to{" "}
                    <strong>{tr.toTeam}</strong>
                  </span>
                  <span>Created: {formatDateTime(tr.createdAt)}</span>
                </div>

                <div style={{ fontSize: "0.9rem", marginBottom: "4px" }}>
                  <div>
                    <strong>{tr.fromTeam}</strong> offers:{" "}
                    {tr.offeredPlayers && tr.offeredPlayers.length
                      ? tr.offeredPlayers.join(", ")
                      : "(no players)"}
                  </div>
                  <div>
                    <strong>{tr.toTeam}</strong> sends:{" "}
                    {tr.requestedPlayers && tr.requestedPlayers.length
                      ? tr.requestedPlayers.join(", ")
                      : "(no players)"}
                  </div>
                  {penaltySummary && (
                    <div style={{ marginTop: "4px", color: "#e5e7eb" }}>
                      {penaltySummary}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      padding: "2px 6px",
                      borderRadius: "999px",
                      background:
                        tr.status === "pending"
                          ? "#fbbf24"
                          : tr.status === "accepted"
                          ? "#22c55e"
                          : tr.status === "rejected"
                          ? "#ef4444"
                          : "#6b7280",
                      color: "#020617",
                      fontWeight: 600,
                    }}
                  >
                    {tr.status.toUpperCase()}
                  </span>

                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      justifyContent: "flex-end",
                    }}
                  >
                    {canAcceptOrReject && (
                      <>
                        <button
                          onClick={() => onAcceptTrade(tr.id)}
                          style={{
                            padding: "4px 8px",
                            fontSize: "0.8rem",
                            borderRadius: "4px",
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: "#22c55e",
                            color: "#020617",
                          }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => onRejectTrade(tr.id)}
                          style={{
                            padding: "4px 8px",
                            fontSize: "0.8rem",
                            borderRadius: "4px",
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: "#ef4444",
                            color: "#020617",
                          }}
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {canCancel && (
                      <button
                        onClick={() => onCancelTrade(tr.id)}
                        style={{
                          padding: "4px 8px",
                          fontSize: "0.8rem",
                          borderRadius: "4px",
                          border: "none",
                          cursor: "pointer",
                          backgroundColor: "#6b7280",
                          color: "#f9fafb",
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyPendingTradesPanel;
