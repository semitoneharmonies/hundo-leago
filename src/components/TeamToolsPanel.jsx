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
}) {
  // --- Auction state (for starting new auctions) ---
  const [bidPlayerName, setBidPlayerName] = useState("");
  const [bidPosition, setBidPosition] = useState("F");
  const [bidAmount, setBidAmount] = useState("");

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

  // ✅ early return comes *after* hooks
  if (!currentUser) return null;

  const isManager = currentUser?.role === "manager";
  const isCommissioner = currentUser?.role === "commissioner";
  const myTeamName = isManager ? currentUser.teamName : null;

  const nowDate = new Date(nowMs);
  const nextSunday = getNextSundayDeadline(nowDate);
  const auctionCutoff = getNewAuctionCutoff(nextSunday);
  const timeRemainingMs = Math.max(0, nextSunday.getTime() - nowMs);

  const bids = freeAgents || [];
  const activeBids = bids.filter((b) => !b.resolved);
  const myBids = isManager
  ? bids.filter((b) => b.team === myTeamName && !b.resolved)
  : [];


  // Group active bids by player (for live auctions list)
  const activeAuctionsByPlayer = (() => {
    const byKey = new Map(); // key = lower(playerName)
    for (const b of activeBids) {
      const playerName = b.player || "";
      if (!playerName) continue;
const key = String(b.auctionKey || playerName).trim().toLowerCase();
      if (!byKey.has(key)) {
        byKey.set(key, {
          key,
          playerName,
          position: b.position || "F",
          bids: [],
        });
      }
      byKey.get(key).bids.push(b);
    }
    return Array.from(byKey.values());
  })();

  // 🔒 Helper: is this player already on any roster?
 const normalizeName = (s) => String(s || "").trim().toLowerCase();

const isPlayerRostered = (playerName) => {
  if (!teams || !teams.length) return false;
  const key = normalizeName(playerName);
  if (!key) return false;

  return teams.some((t) =>
    (t.roster || []).some((p) => normalizeName(p?.name) === key)
  );
};


  const handleLiveBidInputChange = (playerKey, value) => {
    setLiveBidInputs((prev) => ({
      ...prev,
      [playerKey]: value,
    }));
  };

  // 🔒 Strengthened: no inline bids after Sunday deadline
  const handleLiveBidSubmit = (auction) => {
    const playerKey = auction.key;
    const rawAmount = (liveBidInputs[playerKey] || "").trim();

    if (!rawAmount) {
      window.alert("Enter a bid amount for this player.");
      return;
    }

    // No bids after Sunday 4:00 PM
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

    onPlaceBid({
  playerName: auction.playerName, // keep display name
  position: auction.position,
  amount: rawAmount,
});


    // Clear just this player's inline input
    setLiveBidInputs((prev) => ({
      ...prev,
      [playerKey]: "",
    }));
  };

  // --- Trade draft helpers ---

  const activeDraftFromThisManager =
    isManager &&
    tradeDraft &&
    tradeDraft.fromTeam === currentUser.teamName;

  const canSubmitTrade =
    activeDraftFromThisManager &&
    (tradeDraft?.requestedPlayers || []).length > 0 &&
    (tradeDraft?.offeredPlayers || []).length > 0;

  const handleClearTradeDraft = () => setTradeDraft(null);

  const updateDraftField = (field, value) => {
    setTradeDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const updateRetention = (which, playerName, value) => {
    setTradeDraft((prev) => {
      if (!prev) return prev;
      const key = which === "from" ? "retentionFrom" : "retentionTo";
      return {
        ...prev,
        [key]: {
          ...(prev[key] || {}),
          [playerName]: value,
        },
      };
    });
  };

  // --- Pending trades visible to this user ---

  const pendingTradesForUser = (tradeProposals || []).filter((tr) => {
    if (!tr || tr.status !== "pending") return false;

    if (currentUser.role === "commissioner") return true;

    if (currentUser.role === "manager") {
      return (
        tr.fromTeam === currentUser.teamName ||
        tr.toTeam === currentUser.teamName
      );
    }

    return false;
  });

  const canAcceptOrReject = (tr) =>
    currentUser.role === "commissioner" ||
    (currentUser.role === "manager" &&
      tr.toTeam === currentUser.teamName);

  const canCancel = (tr) =>
    currentUser.role === "commissioner" ||
    (currentUser.role === "manager" &&
      tr.fromTeam === currentUser.teamName);

  const canCounter = (tr) => canAcceptOrReject(tr);

  // --- CapFriendly-style preview for current draft ---

  let preview = null;
  if (activeDraftFromThisManager && tradeDraft && teams?.length) {
    const fromTeamObj = teams.find(
      (t) => t.name === tradeDraft.fromTeam
    );
    const toTeamObj = teams.find(
      (t) => t.name === tradeDraft.toTeam
    );

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
  let fromRetentionAfter = null;
  let toRetentionAfter = null;

  if (activeDraftFromThisManager && tradeDraft && teams?.length) {
    const fromTeamObj = teams.find((t) => t.name === tradeDraft.fromTeam);
    const toTeamObj = teams.find((t) => t.name === tradeDraft.toTeam);

    if (fromTeamObj && toTeamObj) {
      const currentFromRetention = countRetentionSpots(fromTeamObj);
      const currentToRetention = countRetentionSpots(toTeamObj);

      // Each non-zero entry in retentionFrom is a new retention slot
      const newFromRetention = Object.entries(
        tradeDraft.retentionFrom || {}
      ).filter(([name, value]) => {
        const amount = Number(value);
        if (!tradeDraft.offeredPlayers?.includes(name)) return false;
        return amount > 0;
      }).length;

      // Each non-zero entry in retentionTo is a new retention slot
      const newToRetention = Object.entries(
        tradeDraft.retentionTo || {}
      ).filter(([name, value]) => {
        const amount = Number(value);
        if (!tradeDraft.requestedPlayers?.includes(name)) return false;
        return amount > 0;
      }).length;

      fromRetentionAfter = currentFromRetention + newFromRetention;
      toRetentionAfter = currentToRetention + newToRetention;

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

  // Combine normal preview issues + retention-limit issues
  const allIssues = [...previewIssues, ...retentionIssues];
  const tradeBlockedByRetention = retentionIssues.length > 0;

  const capColor = (capAfter, capBefore) => {
    const diff = capAfter - capBefore;
    if (diff > 0) return "#f97373"; // red
    if (diff < 0) return "#bbf7d0"; // green
    return "#e5e7eb";
  };

  const rosterColor = (sizeAfter) =>
    sizeAfter > maxRosterSize ? "#f97373" : "#e5e7eb";

  const posColor = (posAfter) => {
    if (posAfter.F < minForwards || posAfter.D < minDefensemen) {
      return "#facc15"; // yellow
    }
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


  // Final “can submit” check: must have players selected
  // AND must not break retention limits.
  const canSubmitThisTrade = canSubmitTrade && !tradeBlockedByRetention;

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

      {currentUser.role === "manager" && selectedTeam && (
        <p style={{ color: "#94a3b8", marginTop: 0 }}>
          You are managing <strong>{currentUser.teamName}</strong>.
        </p>
      )}

      <hr style={{ margin: "12px 0", borderColor: "#334155" }} />

      {/* ---------- Trade Builder (current draft) ---------- */}
<h3 style={{ marginTop: 0 }}>Trade builder</h3>

{isManager ? (
  <>
    {activeDraftFromThisManager && tradeDraft ? (
      <div
        style={{
          marginBottom: "12px",
          padding: "8px",
          borderRadius: "6px",
          background: "#020617",
          border: "1px solid #1f2937",
          fontSize: "0.85rem",
        }}
      >
        {/*
          --- Helpers used ONLY inside this block ---
          (Keeping them here so you don't have to hunt around your file)
        */}
        {(() => {
          const getTeamByName = (name) =>
            (teams || []).find((t) => t.name === name);

          const getMaxBuyoutForTeam = (teamName) => {
            const t = getTeamByName(teamName);
            return totalBuyoutPenalty(t);
          };

          const getPlayerSalary = (teamName, playerName) => {
            const t = getTeamByName(teamName);
            const p = (t?.roster || []).find((pl) => pl.name === playerName);
            return Number(p?.salary) || 0;
          };

          const getMaxRetentionForPlayer = (teamName, playerName) => {
            const s = getPlayerSalary(teamName, playerName);
            return Math.ceil(s * 0.5);
          };

          const maxPenaltyFrom = getMaxBuyoutForTeam(tradeDraft.fromTeam);
          const maxPenaltyTo = getMaxBuyoutForTeam(tradeDraft.toTeam);

          return (
            <>
              <div style={{ marginBottom: "4px", color: "#a5b4fc" }}>
                Building trade from <strong>{tradeDraft.fromTeam}</strong> to{" "}
                <strong>{tradeDraft.toTeam}</strong>
              </div>

              {/* Players summary */}
              <div style={{ marginBottom: "4px" }}>
                <strong>Requested players (from {tradeDraft.toTeam}):</strong>{" "}
                {tradeDraft.requestedPlayers && tradeDraft.requestedPlayers.length > 0
                  ? tradeDraft.requestedPlayers.join(", ")
                  : "none yet"}
              </div>

              <div style={{ marginBottom: "6px" }}>
                <strong>Offered players (from {tradeDraft.fromTeam}):</strong>{" "}
                {tradeDraft.offeredPlayers && tradeDraft.offeredPlayers.length > 0
                  ? tradeDraft.offeredPlayers.join(", ")
                  : "none yet"}
              </div>

              {/* Buyout penalty fields */}
              <div
                style={{
                  marginTop: "6px",
                  marginBottom: "6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <label style={{ fontSize: "0.8rem" }}>
                  <strong>Include your buyout penalty</strong> in this trade (sent
                  from {tradeDraft.fromTeam} to {tradeDraft.toTeam}){" "}
                  <span style={{ color: "#94a3b8" }}>
                    (max ${maxPenaltyFrom})
                  </span>
                  :
                  <br />
                  <input
                    type="number"
                    min="0"
                    max={maxPenaltyFrom}
                    value={tradeDraft.penaltyFrom ?? ""}
                    onChange={(e) => updateDraftField("penaltyFrom", e.target.value)}
                    style={{
                      marginTop: "2px",
                      width: "80px",
                      fontSize: "0.8rem",
                    }}
                  />{" "}
                  $
                </label>

                <label style={{ fontSize: "0.8rem" }}>
                  <strong>Request their buyout penalty</strong> (sent from{" "}
                  {tradeDraft.toTeam} to {tradeDraft.fromTeam}){" "}
                  <span style={{ color: "#94a3b8" }}>
                    (max ${maxPenaltyTo})
                  </span>
                  :
                  <br />
                  <input
                    type="number"
                    min="0"
                    max={maxPenaltyTo}
                    value={tradeDraft.penaltyTo ?? ""}
                    onChange={(e) => updateDraftField("penaltyTo", e.target.value)}
                    style={{
                      marginTop: "2px",
                      width: "80px",
                      fontSize: "0.8rem",
                    }}
                  />{" "}
                  $
                </label>
              </div>

              {/* Salary retention fields */}
              {(tradeDraft.offeredPlayers?.length > 0 ||
                tradeDraft.requestedPlayers?.length > 0) && (
                <div
                  style={{
                    marginTop: "6px",
                    marginBottom: "6px",
                    fontSize: "0.8rem",
                  }}
                >
                  <div style={{ marginBottom: "4px", fontWeight: "bold" }}>
                    Salary retention (max 50% of salary, per player)
                  </div>

                  {/* Retention on offered players (you retain) */}
                  {tradeDraft.offeredPlayers?.length > 0 && (
                    <div style={{ marginBottom: "4px" }}>
                      <div style={{ marginBottom: "2px" }}>
                        You retain on players you are sending:
                      </div>

                      {tradeDraft.offeredPlayers.map((name) => {
                        const maxRet = getMaxRetentionForPlayer(
                          tradeDraft.fromTeam,
                          name
                        );

                        return (
                          <div
                            key={name}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              marginBottom: "2px",
                            }}
                          >
                            <span style={{ minWidth: "110px", fontSize: "0.8rem" }}>
                              {name}
                            </span>

                            <input
                              type="number"
                              min="0"
                              max={maxRet}
                              value={(tradeDraft.retentionFrom || {})[name] ?? ""}
                              onChange={(e) =>
                                updateRetention("from", name, e.target.value)
                              }
                              style={{ width: "80px", fontSize: "0.8rem" }}
                            />{" "}
                            $

                            <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                              (max ${maxRet})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Retention you request from the other team */}
                  {tradeDraft.requestedPlayers?.length > 0 && (
                    <div>
                      <div style={{ marginBottom: "2px" }}>
                        Ask the other team to retain on players you receive:
                      </div>

                      {tradeDraft.requestedPlayers.map((name) => {
                        const maxRet = getMaxRetentionForPlayer(
                          tradeDraft.toTeam,
                          name
                        );

                        return (
                          <div
                            key={name}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              marginBottom: "2px",
                            }}
                          >
                            <span style={{ minWidth: "110px", fontSize: "0.8rem" }}>
                              {name}
                            </span>

                            <input
                              type="number"
                              min="0"
                              max={maxRet}
                              value={(tradeDraft.retentionTo || {})[name] ?? ""}
                              onChange={(e) =>
                                updateRetention("to", name, e.target.value)
                              }
                              style={{ width: "80px", fontSize: "0.8rem" }}
                            />{" "}
                            $

                            <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                              (max ${maxRet})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Trade validity summary + CapFriendly-style preview box */}
              {fromPreview && toPreview && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "8px",
                    borderRadius: "6px",
                    background: "#020617",
                    border: "1px solid #1f2937",
                  }}
                >
                  {/* Validity summary */}
                  <div style={{ fontSize: "0.8rem", marginBottom: "4px" }}>
                    {allIssues.length === 0 ? (
                      <span style={{ color: "#4ade80" }}>
                        ✔ Both teams remain legal if this trade is accepted.
                      </span>
                    ) : (
                      <span style={{ color: "#facc15" }}>
                        ⚠ This trade would cause roster/cap or retention issues for
                        at least one team.
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: "0.8rem",
                      marginBottom: "4px",
                      color: "#a5b4fc",
                    }}
                  >
                    Trade impact preview
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      fontSize: "0.8rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* From team preview */}
<div style={{ flex: 1, minWidth: "160px" }}>
  <div style={{ fontWeight: 800, marginBottom: "4px", fontSize: "1.05rem" }}>
    {tradeDraft.fromTeam}
  </div>

  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "6px" }}>
    Receiving:
    {tradeDraft.requestedPlayers?.length ? (
      <span style={{ marginLeft: "6px" }}>
        {tradeDraft.requestedPlayers.map((name) => (
          <span key={`recv-from-${name}`} style={pillStyle}>
            {name}
          </span>
        ))}
      </span>
    ) : (
      <span style={{ marginLeft: "6px" }}>—</span>
    )}
  </div>

  <div>
    Cap:{" "}
    <span>
      ${fromPreview.capBefore} →{" "}
      <span style={{ color: capColor(fromPreview.capAfter, fromPreview.capBefore) }}>
        ${fromPreview.capAfter}
      </span>{" "}
      ({fromPreview.capDiff >= 0 ? "+" : ""}
      {fromPreview.capDiff})
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

  <div>
    Buyouts: ${fromPreview.penaltiesBefore} → ${fromPreview.penaltiesAfter}
  </div>

  <div>
    Retentions: {fromPreview.retentionBefore} → {fromPreview.retentionAfter}
  </div>
</div>


                    {/* To team preview */}
<div style={{ flex: 1, minWidth: "160px" }}>
  <div style={{ fontWeight: 800, marginBottom: "4px", fontSize: "1.05rem" }}>
    {tradeDraft.toTeam}
  </div>

  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "6px" }}>
    Receiving:
    {tradeDraft.offeredPlayers?.length ? (
      <span style={{ marginLeft: "6px" }}>
        {tradeDraft.offeredPlayers.map((name) => (
          <span key={`recv-to-${name}`} style={pillStyle}>
            {name}
          </span>
        ))}
      </span>
    ) : (
      <span style={{ marginLeft: "6px" }}>—</span>
    )}
  </div>

  <div>
    Cap:{" "}
    <span>
      ${toPreview.capBefore} →{" "}
      <span style={{ color: capColor(toPreview.capAfter, toPreview.capBefore) }}>
        ${toPreview.capAfter}
      </span>{" "}
      ({toPreview.capDiff >= 0 ? "+" : ""}
      {toPreview.capDiff})
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

  <div>
    Buyouts: ${toPreview.penaltiesBefore} → ${toPreview.penaltiesAfter}
  </div>

  <div>
    Retentions: {toPreview.retentionBefore} → {toPreview.retentionAfter}
  </div>
</div>
                  </div>

                  {allIssues.length > 0 && (
                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "0.75rem",
                        color: "#facc15",
                      }}
                    >
                      <div style={{ fontWeight: "bold" }}>Issues if accepted:</div>
                      <ul style={{ margin: 0, paddingLeft: "16px" }}>
                        {allIssues.map((msg, idx) => (
                          <li key={idx}>{msg}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Trade buttons */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "8px",
                }}
              >
                <button
                  onClick={handleClearTradeDraft}
                  style={{
                    padding: "4px 8px",
                    fontSize: "0.8rem",
                    backgroundColor: "#374151",
                    color: "#e5e7eb",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Clear this trade
                </button>

                <button
                  onClick={() => onSubmitTradeDraft(tradeDraft)}
                  disabled={!canSubmitThisTrade}
                  style={{
                    padding: "4px 10px",
                    fontSize: "0.8rem",
                    backgroundColor: canSubmitThisTrade ? "#16a34a" : "#4b5563",
                    color: "#e5e7eb",
                    border: "none",
                    borderRadius: "4px",
                    cursor: canSubmitThisTrade ? "pointer" : "not-allowed",
                  }}
                >
                  Submit trade offer
                </button>
              </div>

              {!canSubmitTrade && (
                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "0.75rem",
                    color: "#9ca3af",
                  }}
                >
                  Pick at least one requested player on the other team and at least
                  one offered player on your team to enable submission.
                </div>
              )}

              <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "#9ca3af" }}>
                Use <em>Request</em> beside players on the other team, and{" "}
                <em>Offer</em> beside players on your own roster.
              </div>
            </>
          );
        })()}
      </div>
    ) : (
      <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
        To start a trade, view another team&apos;s roster and click <em>Request</em>{" "}
        beside any player you want. Then switch back to your own team and use{" "}
        <em>Offer</em> on your players.
      </p>
    )}
  </>
) : (
  <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
    Log in as a manager to build trade offers.
  </p>
)}

<hr style={{ margin: "12px 0", borderColor: "#334155" }} />


      {/* ---------- Pending Trades (grouped view) ---------- */}
      <h3 style={{ marginTop: 0 }}>Pending trades</h3>

      {pendingTradesForUser.length === 0 && (
        <p style={{ color: "#94a3b8" }}>No pending trades.</p>
      )}

      {pendingTradesForUser.map((tr) => {
        const youAreFrom =
          currentUser.role === "manager" &&
          tr.fromTeam === currentUser.teamName;
        const youAreTo =
          currentUser.role === "manager" &&
          tr.toTeam === currentUser.teamName;

        const offeredList = tr.offeredPlayers || [];
        const requestedList = tr.requestedPlayers || [];

        // Buyout penalty summary
        const hasPenaltyFrom = tr.penaltyFrom && tr.penaltyFrom > 0;
        const hasPenaltyTo = tr.penaltyTo && tr.penaltyTo > 0;
        const hasAnyPenalty = hasPenaltyFrom || hasPenaltyTo;

        // Salary retention summaries (maps: { playerName: amount })
        const retentionFromEntries = Object.entries(
          tr.retentionFrom || {}
        ).filter(([, val]) => Number(val) > 0);
        const retentionToEntries = Object.entries(
          tr.retentionTo || {}
        ).filter(([, val]) => Number(val) > 0);

        const hasAnyRetention =
          retentionFromEntries.length > 0 || retentionToEntries.length > 0;

        return (
          <div
            key={tr.id}
            style={{
              padding: "10px",
              background: "#1e293b",
              borderRadius: "6px",
              marginBottom: "10px",
              fontSize: "0.85rem",
            }}
          >
            <div style={{ marginBottom: "4px" }}>
              <strong>
                {tr.fromTeam} → {tr.toTeam}
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {/* Outgoing from fromTeam */}
              <div
                style={{
                  minWidth: "150px",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "2px",
                  }}
                >
                  {tr.fromTeam} sends:
                </div>
                {offeredList.length === 0 ? (
                  <div>nothing</div>
                ) : (
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "16px",
                    }}
                  >
                    {offeredList.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Incoming to fromTeam */}
              <div
                style={{
                  minWidth: "150px",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "2px",
                  }}
                >
                  {tr.toTeam} sends:
                </div>
                {requestedList.length === 0 ? (
                  <div>nothing</div>
                ) : (
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "16px",
                    }}
                  >
                    {requestedList.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Extra: buyout penalty + salary retention details */}
            {(hasAnyPenalty || hasAnyRetention) && (
              <div
                style={{
                  marginTop: "6px",
                  padding: "6px 8px",
                  borderRadius: "4px",
                  background: "#020617",
                  border: "1px solid #1f2937",
                  fontSize: "0.8rem",
                }}
              >
                {hasAnyPenalty && (
                  <div style={{ marginBottom: hasAnyRetention ? "4px" : 0 }}>
                    <strong>Buyout penalty in trade:</strong>{" "}
                    {hasPenaltyFrom && (
                      <span>
                        {tr.fromTeam} sends ${tr.penaltyFrom}
                        {hasPenaltyTo && " · "}
                      </span>
                    )}
                    {hasPenaltyTo && (
                      <span>
                        {tr.toTeam} sends ${tr.penaltyTo}
                      </span>
                    )}
                  </div>
                )}

                {hasAnyRetention && (
                  <div>
                    <strong>Salary retention:</strong>
                    <div style={{ marginTop: "2px" }}>
                      {retentionFromEntries.length > 0 && (
                        <div>
                          <span>{tr.fromTeam} retains on:</span>
                          <ul
                            style={{
                              margin: "2px 0 0 16px",
                              paddingLeft: 0,
                            }}
                          >
                            {retentionFromEntries.map(
                              ([playerName, amt]) => (
                                <li key={`from-${playerName}`}>
                                  {playerName}: ${amt}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                      {retentionToEntries.length > 0 && (
                        <div style={{ marginTop: "2px" }}>
                          <span>{tr.toTeam} retains on:</span>
                          <ul
                            style={{
                              margin: "2px 0 0 16px",
                              paddingLeft: 0,
                            }}
                          >
                            {retentionToEntries.map(
                              ([playerName, amt]) => (
                                <li key={`to-${playerName}`}>
                                  {playerName}: ${amt}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div
              style={{
                marginTop: "8px",
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              {canAcceptOrReject(tr) && (
                <>
                  <button
                    onClick={() => onAcceptTrade(tr.id)}
                    style={{
                      padding: "3px 8px",
                      fontSize: "0.8rem",
                      borderRadius: "4px",
                      border: "none",
                      cursor: "pointer",
                      backgroundColor: "#16a34a",
                      color: "#e5e7eb",
                    }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onRejectTrade(tr.id)}
                    style={{
                      padding: "3px 8px",
                      fontSize: "0.8rem",
                      borderRadius: "4px",
                      border: "none",
                      cursor: "pointer",
                      backgroundColor: "#b91c1c",
                      color: "#e5e7eb",
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
                    padding: "3px 8px",
                    fontSize: "0.8rem",
                    borderRadius: "4px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: "#6b7280",
                    color: "#e5e7eb",
                  }}
                >
                  Cancel
                </button>
              )}

              {canCounter(tr) && (
                <button
                  onClick={() => onCounterTrade && onCounterTrade(tr)}
                  style={{
                    padding: "3px 8px",
                    fontSize: "0.8rem",
                    borderRadius: "4px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: "#0ea5e9",
                    color: "#e5e7eb",
                  }}
                >
                  Counter offer
                </button>
              )}
            </div>

            {(youAreFrom || youAreTo) && (
              <div
                style={{
                  marginTop: "4px",
                  fontSize: "0.75rem",
                  color: "#9ca3af",
                }}
              >
                {youAreTo && "You are the receiving team for this trade."}
                {youAreFrom &&
                  !youAreTo &&
                  "You are the offering team for this trade."}
              </div>
            )}
          </div>
        );
      })}

      <hr style={{ margin: "12px 0", borderColor: "#334155" }} />

      {/* ---------- Trade Block ---------- */}
      <h3 style={{ marginTop: 0 }}>Trade block</h3>

      {isManager && (
        <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
          To add a player to your trade block, use the{" "}
          <em>Add to trade block</em> button next to their name on your
          roster.
        </p>
      )}

      {(!tradeBlock || tradeBlock.length === 0) && (
        <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
          No players listed on the trade block yet.
        </p>
      )}

      {tradeBlock && tradeBlock.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            fontSize: "0.85rem",
          }}
        >
          {tradeBlock.map((entry) => {
            const canRemove =
              currentUser.role === "commissioner" ||
              (currentUser.role === "manager" &&
                currentUser.teamName === entry.team);

            return (
              <div
                key={entry.id}
                style={{
                  padding: "6px 8px",
                  borderRadius: "6px",
                  background: "#020617",
                  border: "1px solid #1f2937",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "2px",
                  }}
                >
                  <span>
                    <strong>{entry.team}</strong> – {entry.player}
                  </span>
                  {canRemove && (
                    <button
                      onClick={() =>
                        onRemoveTradeBlockEntry &&
                        onRemoveTradeBlockEntry(entry.id)
                      }
                      style={{
                        padding: "2px 6px",
                        fontSize: "0.75rem",
                        borderRadius: "4px",
                        border: "none",
                        cursor: "pointer",
                        backgroundColor: "#6b7280",
                        color: "#e5e7eb",
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                {entry.needs && (
                  <div style={{ color: "#9ca3af" }}>
                    <strong>Notes:</strong> {entry.needs}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ---------- Free Agent Auctions ---------- */}
      <hr
        style={{
          border: "none",
          borderTop: "1px solid #334155",
          margin: "16px 0",
        }}
      />

      <h3 style={{ marginTop: 0 }}>Free Agent Auctions</h3>
     <div
  style={{
    fontSize: "0.8rem",
    color: "#9ca3af",
    marginTop: 0,
    marginBottom: "6px",
  }}
>
  <div>Time remaining:</div>

  <div
    className={`auction-countdown ${
      timeRemainingMs < 24 * 60 * 60 * 1000 ? "urgent" : ""
    } ${
      timeRemainingMs < 60 * 60 * 1000 ? "critical" : ""
    }`}
  >
    <div className="label">
      {timeRemainingMs < 60 * 60 * 1000
        ? "FINAL HOUR"
        : "Auction rollover in"}
    </div>
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
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "6px",
            }}
          >
            <input
              type="text"
              placeholder="Player name"
              value={bidPlayerName}
              onChange={(e) => setBidPlayerName(e.target.value)}
              style={{ flex: "1 1 140px" }}
            />
            <select
              value={bidPosition}
              onChange={(e) => setBidPosition(e.target.value)}
              style={{ width: "80px" }}
            >
              <option value="F">F</option>
              <option value="D">D</option>
            </select>
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
  onClick={() => {
  try {
    console.log("[AUCTION] Start/place bid clicked", {
      bidPlayerName,
      bidPosition,
      bidAmount,
      nowMs,
      nextSunday: nextSunday?.toISOString?.(),
      auctionCutoff: auctionCutoff?.toISOString?.(),
      hasOnPlaceBid: typeof onPlaceBid,
    });

    const trimmedName = bidPlayerName.trim();

    if (!trimmedName || !bidAmount) {
      window.alert("Enter a player name and bid amount.");
      return;
    }

    if (typeof onPlaceBid !== "function") {
      window.alert("Auction error: onPlaceBid is not wired (not a function).");
      console.error("[AUCTION] onPlaceBid is not a function:", onPlaceBid);
      return;
    }

    // ✅ define once, use everywhere
const lowerName = normalizeName(trimmedName);

    // Existing auction?
    const isExistingAuction = activeAuctionsByPlayer.some(
      (a) => a.key === lowerName
    );

    // ⛔ No bids after Sunday deadline
    if (nowMs > nextSunday.getTime()) {
      window.alert(
        "Auction window is closed. Bids after the Sunday 4:00 PM deadline do not count."
      );
      return;
    }

    // ⛔ Too late to START a new auction
    if (!isExistingAuction && nowMs > auctionCutoff.getTime()) {
      window.alert(
        "Too late to start a new auction for this week. You can start new auctions again after this Sunday’s deadline."
      );
      return;
    }

    // ✅ Case-insensitive roster check
if (!isExistingAuction && isPlayerRostered(trimmedName)) {
  window.alert(
    "This player is already on a roster. You cannot start a free-agent auction for rostered players."
  );
  return;
}


    onPlaceBid({
      playerName: trimmedName, // keep original casing for display
      position: bidPosition,
      amount: bidAmount,
    });

    setBidPlayerName("");
    setBidAmount("");
  } catch (err) {
    console.error("[AUCTION] Start/place bid crashed:", err);
    window.alert("Auction crashed — check console for [AUCTION] error.");
  }
}}

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
  Start / place bid
</button>

        </div>
      ) : (
        <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
          Log in as a manager to place free-agent bids.
        </p>
      )}

      {/* Live auctions grouped by player (blind bidding) */}
      <div style={{ marginTop: "8px" }}>
        <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem" }}>
          Live auctions
        </h4>
        {activeAuctionsByPlayer.length === 0 ? (
          <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
            No live auctions at the moment.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontSize: "0.85rem",
            }}
          >
            {activeAuctionsByPlayer.map((auction) => {
              const bidCount = auction.bids.length;
              const hasMyBid =
                isManager &&
                auction.bids.some((b) => b.team === myTeamName);

              const playerKey = auction.key;
              const inputValue = liveBidInputs[playerKey] || "";

              // Sorted bids for commissioner view (highest first)
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
                    padding: "6px 8px",
                    borderRadius: "6px",
                    background: "#020617",
                    border: "1px solid #1f2937",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div>
                      <div>
                        <strong>
                          {auction.playerName} ({auction.position})
                        </strong>
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#9ca3af",
                        }}
                      >
                        {bidCount === 0
                          ? "No bids placed yet."
                          : bidCount === 1
                          ? "1 bid placed."
                          : `${bidCount} bids placed.`}
                        {hasMyBid && (
                          <span style={{ color: "#4ade80" }}>
                            {" "}
                            • You have a bid.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Inline bid input for managers */}
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
              onChange={(e) =>
                handleLiveBidInputChange(playerKey, e.target.value)
              }
              style={{
                width: "120px",
                fontSize: "0.8rem",
              }}
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

          {/* small status line */}
          <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
            {ui.reason
              ? ui.reason
              : `Edits used: ${ui.editsUsed}/${ui.maxEdits}`}
          </div>
        </>
      );
    })()}
  </div>
)}


                  {/* Commissioner optional per-bid details */}
                                   {isCommissioner && showBidAmounts && sortedBids.length > 0 && (
                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "0.75rem",
                        color: "#e5e7eb",
                      }}
                    >
                      <div style={{ marginBottom: "2px", color: "#fbbf24" }}>
                        Bid details:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: "16px" }}>
                        {sortedBids.map((b) => (
                          <li key={b.id}>
                            {b.team}: ${b.amount} (
                            {new Date(b.timestamp).toLocaleString()})
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

      {/* Commissioner-only controls */}
      {isCommissioner && (
        <div
          style={{
            marginTop: "10px",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <label
            style={{
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "#e5e7eb",
            }}
          >
            <input
              type="checkbox"
              checked={showBidAmounts}
              onChange={(e) =>
                setShowBidAmounts(e.target.checked)
              }
            />
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

      {/* Manager: my bids summary */}
      {isManager && (
        <div style={{ marginTop: "12px" }}>
          <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem" }}>
            Your active bids
          </h4>
          {myBids.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
              You have no bids yet.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                fontSize: "0.85rem",
              }}
            >
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
                  <span>
                    {b.player} ({b.position}) — ${b.amount}
                    {b.resolved && b.winningTeam === myTeamName && (
                      <span
                        style={{ color: "#4ade80", marginLeft: "6px" }}
                      >
                        (won)
                      </span>
                    )}
                    {b.resolved &&
                      b.winningTeam &&
                      b.winningTeam !== myTeamName && (
                        <span
                          style={{ color: "#f97373", marginLeft: "6px" }}
                        >
                          (lost)
                        </span>
                      )}
                    {b.resolved && !b.winningTeam && (
                      <span
                        style={{ color: "#fbbf24", marginLeft: "6px" }}
                      >
                        (no valid winner)
                      </span>
                    )}
                  </span>
                  <span
                    style={{
                      color: "#6b7280",
                      fontSize: "0.7rem",
                      whiteSpace: "nowrap",
                    }}
                  >
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
