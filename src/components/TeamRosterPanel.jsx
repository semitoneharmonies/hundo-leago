// src/components/TeamRosterPanel.jsx
import React, { useState } from "react";
import {
  totalCap,
  totalBuyoutPenalty,
  calculateBuyout,
  countPositions,
  isTeamIllegal,
  countRetentionSpots,
} from "../leagueUtils";

function TeamRosterPanel({
  team,
  teams,
  capLimit,
  maxRosterSize,
  minForwards,
  minDefensemen,
  currentUser,
  tradeDraft,
  setTradeDraft,
  canManageTeam,
  onUpdateTeamRoster,
  onBuyout,
  onCommissionerRemovePlayer,
  onManagerProfileImageChange,
  onSubmitTradeDraft, // handler from App
  onAddToTradeBlock,
}) {
  // ✅ hook now inside the component
  const [hoveredBuyoutPlayer, setHoveredBuyoutPlayer] = useState(null);

  // If no team is selected yet
  if (!team) {
    return (
      <div
        style={{
          padding: "16px",
          borderRadius: "8px",
          background: "#020617",
          border: "1px solid #1f2937",
          color: "#e5e7eb",
        }}
      >
        <p>No team selected.</p>
      </div>
    );
  }

  // --- Basic derived info for the selected team ---
  const capUsed = totalCap(team);
  const capRemaining = capLimit - capUsed;
  const teamCap = capUsed;  

  const fullRoster = team.roster || [];
  const activeRoster = fullRoster.filter((p) => !p.onIR);
  const irPlayers = fullRoster.filter((p) => p.onIR);

  // Only active players count toward F/D + roster size
  const { F, D } = countPositions({ ...team, roster: activeRoster });
  const rosterSize = activeRoster.length;

  // Split buyouts into true buyouts vs retained salary
  const allBuyouts = team.buyouts || [];
  const retainedBuyouts = allBuyouts.filter((b) => b.retained);
  const normalBuyouts = allBuyouts.filter((b) => !b.retained);

  // Retained salary + retention spots
  const MAX_RETENTION_SPOTS = 3;
  const retentionSpotsUsed = countRetentionSpots(team);

  // For legacy references further down
  const buyouts = normalBuyouts;

  const canEditThisTeam = canManageTeam(team.name);

  const rosterIllegal = isTeamIllegal(team, {
    capLimit,
    maxRosterSize,
    minForwards,
    minDefensemen,
  });



  const isManager =
    currentUser && currentUser.role === "manager" && currentUser.teamName;
  const isManagerViewingOwnTeam =
    isManager && currentUser.teamName === team.name;
  const isManagerViewingOtherTeam =
    isManager && currentUser.teamName !== team.name;

  const activeDraftFromThisManager =
    isManager &&
    tradeDraft &&
    tradeDraft.fromTeam === currentUser.teamName;

  const isOnDraftFromTeam =
    activeDraftFromThisManager && tradeDraft.fromTeam === team.name;
  const isOnDraftToTeam =
    activeDraftFromThisManager && tradeDraft.toTeam === team.name;

  // --- Drag & drop state for roster reordering ---
  const [dragFromIndex, setDragFromIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = (e, index) => {
    if (!canEditThisTeam) return; // don't allow drag if you can't edit
    setDragFromIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e, index) => {
    if (!canEditThisTeam) return;
    e.preventDefault(); // required so drop can happen
    setDragOverIndex(index);
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, index) => {
  if (!canEditThisTeam) return;
  e.preventDefault();

  const fromIdx = Number(e.dataTransfer.getData("text/plain"));
  const toIdx = index;

  setDragOverIndex(null);
  setDragFromIndex(null);

  if (Number.isNaN(fromIdx) || fromIdx === toIdx) return;

  const currentActive = (team.roster || []).filter((p) => !p.onIR);
  const currentIR = (team.roster || []).filter((p) => p.onIR);

  const newActive = [...currentActive];
  const [moved] = newActive.splice(fromIdx, 1);
  newActive.splice(toIdx, 0, moved);

  const newFull = [...newActive, ...currentIR];
  onUpdateTeamRoster(team.name, newFull);
};


    const updateIRFlag = (playerName, toIR) => {
    const full = team.roster || [];
    const updated = full.map((p) =>
      p.name === playerName ? { ...p, onIR: toIR } : p
    );
    onUpdateTeamRoster(team.name, updated);
  };

  const handleDropToIR = (e) => {
    if (!canEditThisTeam) return;
    e.preventDefault();

    const fromIdx = dragFromIndex ?? Number(e.dataTransfer.getData("text/plain"));
    setDragOverIndex(null);
    setDragFromIndex(null);

    if (Number.isNaN(fromIdx)) return;

    const currentActive = (team.roster || []).filter((p) => !p.onIR);
    const currentIR = (team.roster || []).filter((p) => p.onIR);

    if (currentIR.length >= 4) {
      window.alert("IR is full (4 slots). Maximum 4 players.");
      return;
    }

    const player = currentActive[fromIdx];
    if (!player) return;

    updateIRFlag(player.name, true);
  };

  const handleReturnFromIR = (playerName) => {
    if (!canEditThisTeam) return;
    updateIRFlag(playerName, false);
  };


  // --- Trade: request players on other teams ---
  const handleRequestPlayer = (playerName) => {
    if (!isManager) return;
    if (!isManagerViewingOtherTeam) return;

    const fromTeam = currentUser.teamName;
    const toTeam = team.name;

    setTradeDraft((prev) => {
      // If no draft yet, or it's with different teams, start fresh
      if (
        !prev ||
        prev.fromTeam !== fromTeam ||
        prev.toTeam !== toTeam
      ) {
        return {
          fromTeam,
          toTeam,
          requestedPlayers: [playerName],
          offeredPlayers: [],
          penaltyFrom: "",
          penaltyTo: "",
          retentionFrom: {},
          retentionTo: {},
        };
      }

      // Same from/to – toggle this player
      const current = prev.requestedPlayers || [];
      const already = current.includes(playerName);
      return {
        ...prev,
        requestedPlayers: already
          ? current.filter((n) => n !== playerName)
          : [...current, playerName],
      };
    });
  };

  // --- Trade: offer players from your own team ---
  const handleToggleOfferPlayer = (playerName) => {
    if (!isManager) return;
    if (!isOnDraftFromTeam) return; // only offer from your own roster in this draft

    setTradeDraft((prev) => {
      if (!prev || prev.fromTeam !== currentUser.teamName) {
        return prev;
      }

      const current = prev.offeredPlayers || [];
      const already = current.includes(playerName);
      return {
        ...prev,
        offeredPlayers: already
          ? current.filter((n) => n !== playerName)
          : [...current, playerName],
      };
    });
  };

  const isPlayerRequested = (playerName) => {
    if (!tradeDraft || !isManager) return false;
    if (
      tradeDraft.fromTeam !== currentUser.teamName ||
      tradeDraft.toTeam !== team.name
    ) {
      return false;
    }
    return (tradeDraft.requestedPlayers || []).includes(playerName);
  };

  const isPlayerOffered = (playerName) => {
    if (!tradeDraft || !isManager) return false;
    if (tradeDraft.fromTeam !== currentUser.teamName) return false;
    if (team.name !== currentUser.teamName) return false;
    return (tradeDraft.offeredPlayers || []).includes(playerName);
  };

  const handleClearTradeDraft = () => {
    setTradeDraft(null);
  };

  const canSubmitTrade =
    activeDraftFromThisManager &&
    (tradeDraft.requestedPlayers || []).length > 0 &&
    (tradeDraft.offeredPlayers || []).length > 0;

      const handleAddToTradeBlockClick = (playerName) => {
    if (!isManagerViewingOwnTeam) return;
    if (!onAddToTradeBlock) return;

    const needs = window.prompt(
      `Optional: describe what you're looking for in return for ${playerName} (e.g. "picks, cap relief, D upgrade")`,
      ""
    );

    // If user hits Cancel, do nothing
    if (needs === null) return;

    onAddToTradeBlock({
      team: team.name,
      player: playerName,
      needs,
    });
  };


  // --- Render ---
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: "8px",
        background: "#020617",
        border: "1px solid #1f2937",
      }}
    >
      {/* Team header + profile pic */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        {team.profilePic ? (
          <img
            src={team.profilePic}
            alt={`${team.name} logo`}
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #4b5563",
            }}
          />
        ) : (
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "#111827",
              border: "2px solid #4b5563",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9ca3af",
              fontSize: "0.7rem",
              textAlign: "center",
              padding: "4px",
            }}
          >
            No logo
          </div>
        )}

        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0 }}>{team.name}</h2>
          <div
            style={{
              fontSize: "0.85rem",
              color: "#9ca3af",
              marginTop: "4px",
            }}
          >
            Roster size: {rosterSize} / {maxRosterSize} &nbsp;•&nbsp; F: {F}{" "}
            &nbsp; D: {D}
          </div>
        </div>

        {/* Only the manager of this team can change their profile image */}
        {isManagerViewingOwnTeam && (
          <div style={{ fontSize: "0.8rem" }}>
            <label
              style={{
                display: "inline-block",
                padding: "6px 10px",
                background: "#1d4ed8",
                borderRadius: "6px",
                cursor: "pointer",
                color: "#e5e7eb",
              }}
            >
              Change logo
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={onManagerProfileImageChange}
              />
            </label>
          </div>
        )}
      </div>

      {/* Cap summary */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "12px",
          fontSize: "0.9rem",
        }}
      >
        <div>
          <strong>Cap Used:</strong> ${capUsed}
        </div>
        <div>
          <strong>Cap Remaining:</strong>{" "}
          <span style={{ color: capRemaining < 0 ? "#f97373" : "#bbf7d0" }}>
            ${capRemaining}
          </span>
        </div>
        <div>
          <strong>Buyout Penalties:</strong> ${totalBuyoutPenalty(team)}
        </div>
                <div>
          <strong>Retention spots used:</strong>{" "}
          {retentionSpotsUsed} / {MAX_RETENTION_SPOTS}
        </div>

      </div>
        {rosterIllegal && (
          <div
            style={{
              marginTop: "-4px",
              marginBottom: "10px",
              padding: "6px 8px",
              borderRadius: "6px",
              background: "#450a0a",
              border: "1px solid #b91c1c",
              color: "#fecaca",
              fontSize: "0.85rem",
            }}
          >
            <strong>Illegal roster:</strong>{" "}
            This team is currently over the cap, over the roster limit, or
            below the minimum F/D requirements.
          </div>
        )}

      {/* Roster list */}
{/* Roster list */}
<div
  style={{
    borderTop: "1px solid #1f2937",
    paddingTop: "10px",
  }}
>
  <h3 style={{ marginTop: 0, marginBottom: "8px" }}>Roster</h3>
  {(team.roster || []).length === 0 && (
    <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
      No players on this roster.
    </p>
  )}

  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
    {(team.roster || []).map((p, index) => {
      const isDragOver = index === dragOverIndex;
      const requested = isPlayerRequested(p.name);
      const offered = isPlayerOffered(p.name);

      const bgColor = isDragOver
        ? "#111827"
        : requested
        ? "#022c22"
        : offered
        ? "#1e293b"
        : "#020617";

      const isHoveredForTooltip = hoveredBuyoutPlayer === p.name;
      const salary = Number(p.salary) || 0;
      const penalty = calculateBuyout(salary);
      const newCap = teamCap - salary + penalty;

      return (
        <div
          key={p.name}
          draggable={canEditThisTeam}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 8px",
            borderRadius: "4px",
            background: bgColor,
            border: "1px solid #1f2937",
            cursor: canEditThisTeam ? "move" : "default",
            gap: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            <span>
              {p.name}
              {requested && (
                <span
                  style={{
                    marginLeft: "6px",
                    fontSize: "0.75rem",
                    color: "#a7f3d0",
                  }}
                >
                  (requested)
                </span>
              )}
              {offered && (
                <span
                  style={{
                    marginLeft: "6px",
                    fontSize: "0.75rem",
                    color: "#bfdbfe",
                  }}
                >
                  (offered)
                </span>
              )}
            </span>
            <span
              style={{
                fontSize: "0.8rem",
                color: "#9ca3af",
              }}
            >
              Pos: {p.position || "F"} &nbsp;•&nbsp; Salary: ${p.salary}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "6px",
              alignItems: "center",
              position: "relative",
            }}
          >
            {/* Buyout only if you can manage this team */}
            {canEditThisTeam && (
              <>
                <button
                  onClick={() => onBuyout(team.name, p.name)}
                  onMouseEnter={() => setHoveredBuyoutPlayer(p.name)}
                  onMouseLeave={() => setHoveredBuyoutPlayer(null)}
                  style={{
                    padding: "2px 6px",
                    fontSize: "0.75rem",
                    backgroundColor: "#b91c1c",
                    color: "#f9fafb",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Buyout
                </button>

                {/* Hover tooltip */}
                {isHoveredForTooltip && (
                  <div
                    style={{
                      position: "absolute",
                      top: "120%",
                      right: 0,
                      background: "#020617",
                      border: "1px solid #4b5563",
                      borderRadius: "6px",
                      padding: "6px 8px",
                      fontSize: "0.75rem",
                      color: "#e5e7eb",
                      whiteSpace: "nowrap",
                      boxShadow:
                        "0 4px 6px rgba(15,23,42,0.6)",
                      zIndex: 10,
                    }}
                  >
                    <div>
                      <strong>Buyout penalty:</strong> ${penalty}
                    </div>
                    <div>
                      <strong>New total cap:</strong> ${newCap}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Add to trade block – only for manager viewing their own team */}
            {isManagerViewingOwnTeam && onAddToTradeBlock && (
              <button
                onClick={() => handleAddToTradeBlockClick(p.name)}
                style={{
                  padding: "2px 6px",
                  fontSize: "0.75rem",
                  backgroundColor: "#0ea5e9",
                  color: "#f9fafb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Add to trade block
              </button>
            )}

            {/* Commissioner can remove any player */}
            {currentUser && currentUser.role === "commissioner" && (
              <button
                onClick={() =>
                  onCommissionerRemovePlayer(team.name, p.name)
                }
                style={{
                  padding: "2px 6px",
                  fontSize: "0.75rem",
                  backgroundColor: "#6b7280",
                  color: "#f9fafb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Remove (Commish)
              </button>
            )}

            {/* Manager viewing OTHER team: always show Request button */}
            {isManagerViewingOtherTeam && (
              <button
                onClick={() => handleRequestPlayer(p.name)}
                style={{
                  padding: "2px 6px",
                  fontSize: "0.75rem",
                  backgroundColor: requested ? "#0369a1" : "#047857",
                  color: "#f9fafb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {requested ? "Unrequest" : "Request"}
              </button>
            )}

            {/* Manager viewing OWN team, with active draft: show Offer toggle */}
            {isManagerViewingOwnTeam && activeDraftFromThisManager && (
              <button
                onClick={() => handleToggleOfferPlayer(p.name)}
                style={{
                  padding: "2px 6px",
                  fontSize: "0.75rem",
                  backgroundColor: offered ? "#1d4ed8" : "#0f172a",
                  color: "#f9fafb",
                  border: "1px solid #1d4ed8",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {offered ? "Remove offer" : "Offer"}
              </button>
            )}
          </div>
        </div>
      );
    })}
  </div>
</div>


{/* Injured Reserve (IR) */}
<div
  style={{
    marginTop: "16px",
    borderTop: "1px solid #1f2937",
    paddingTop: "10px",
  }}
>
  <h3 style={{ marginTop: 0, marginBottom: "8px" }}>Injured Reserve (IR)</h3>

  <div
    onDragOver={(e) => {
      if (!canEditThisTeam) return;
      e.preventDefault();
    }}
    onDrop={handleDropToIR}
    style={{
      minHeight: "80px",
      padding: "8px",
      borderRadius: "6px",
      border: "1px dashed #4b5563",
      background: "#020617",
    }}
  >
    {irPlayers.length === 0 ? (
      <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
        Drag players here to place them on IR. Max 4 players. IR players do not
        count against cap or roster size.
      </p>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {irPlayers.map((p) => (
          <div
            key={p.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "4px 8px",
              borderRadius: "4px",
              background: "#111827",
              border: "1px solid #1f2937",
            }}
          >
            <div>
              <span style={{ color: "#f97373" }}>
                {p.name} (IR)
              </span>
              <div style={{ fontSize: "0.8rem", color: "#f97373" }}>
                Pos: {p.position || "F"} • Salary: ${p.salary}
              </div>
            </div>

            {canEditThisTeam && (
              <button
                onClick={() => handleReturnFromIR(p.name)}
                style={{
                  padding: "2px 6px",
                  fontSize: "0.75rem",
                  backgroundColor: "#4b5563",
                  color: "#f9fafb",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Return to roster
              </button>
            )}
          </div>
        ))}
      </div>
    )}

    {irPlayers.length < 4 && (
      <p
        style={{
          marginTop: "6px",
          fontSize: "0.8rem",
          color: "#9ca3af",
        }}
      >
        Empty IR slots: {4 - irPlayers.length}
      </p>
    )}
  </div>
</div>

      {/* Retained salary list */}
      <div
        style={{
          marginTop: "16px",
          borderTop: "1px solid #1f2937",
          paddingTop: "10px",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: "8px" }}>Retained salary</h3>
        {retainedBuyouts.length === 0 ? (
          <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
            No retained salary positions in use.
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "4px" }}
          >
            {retainedBuyouts.map((b, idx) => (
              <div
                key={`${team.name}-retained-${b.player}-${idx}`}
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  background: "#020617",
                  border: "1px solid #1f2937",
                  fontSize: "0.9rem",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>{b.player}</span>
                <span>Retained: ${b.penalty}</span>
              </div>
            ))}
          </div>
        )}
        <p
          style={{
            marginTop: "6px",
            fontSize: "0.8rem",
            color: "#9ca3af",
          }}
        >
          Retention spots used: {retentionSpotsUsed} / {MAX_RETENTION_SPOTS}
        </p>
      </div>

      {/* Buyouts list (non-retention) */}
      <div
        style={{
          marginTop: "16px",
          borderTop: "1px solid #1f2937",
          paddingTop: "10px",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: "8px" }}>Buyouts</h3>
        {normalBuyouts.length === 0 ? (
          <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
            No buyout penalties.
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "4px" }}
          >
            {normalBuyouts.map((b, idx) => (
              <div
                key={`${team.name}-buyout-${b.player}-${idx}`}
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  background: "#020617",
                  border: "1px solid #1f2937",
                  fontSize: "0.9rem",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>{b.player}</span>
                <span>Penalty: ${b.penalty}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamRosterPanel;
