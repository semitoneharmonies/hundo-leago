// src/components/TeamRosterPanel.jsx
import React, { useState } from "react";
import {
  totalCap,
  totalBuyoutPenalty,
  calculateBuyout,
  countPositions,
  isTeamIllegal,
  countRetentionSpots,
    isBuyoutLocked,
  getBuyoutLockDaysLeft,

} from "../leagueUtils";

const MAX_IR = 4;
const MAX_RETENTION_SPOTS = 3;

function TeamRosterPanel({
  team,
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
  onAddToTradeBlock,
}) {
  // -----------------------
  // Local UI state
  // -----------------------
  const [hoveredBuyoutPlayer, setHoveredBuyoutPlayer] = useState(null);
  const [dragFromIndex, setDragFromIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  if (!team) {
    return (
      <div style={panelStyle}>
        <p>No team selected.</p>
      </div>
    );
  }

  // -----------------------
  // Split ACTIVE vs IR
  // -----------------------
  const fullRoster = team.roster || [];
  const activeRoster = fullRoster.filter((p) => !p.onIR);
  const irPlayers = fullRoster.filter((p) => p.onIR);

 // ACTIVE TEAM (used for size + positional rules)
const activeTeam = { ...team, roster: activeRoster };

// -----------------------
// Derived league info
// -----------------------
// Cap already ignores IR inside totalCap(), so use full team for cap math
const capUsed = totalCap(team);
const capRemaining = capLimit - capUsed;

// Positional + roster-size checks should be ACTIVE ONLY
const { F, D } = countPositions(activeTeam);
const rosterSize = activeRoster.length;

const rosterIllegal = isTeamIllegal(activeTeam, {
  capLimit,
  maxRosterSize,
  minForwards,
  minDefensemen,
});


  // -----------------------
  // Buyouts / retention
  // -----------------------
  const allBuyouts = team.buyouts || [];
  const retainedBuyouts = allBuyouts.filter((b) => b.retained);
  const normalBuyouts = allBuyouts.filter((b) => !b.retained);
  const retentionSpotsUsed = countRetentionSpots(team);

  // -----------------------
  // Permissions
  // -----------------------
  const canEditThisTeam = canManageTeam(team.name);
  const isManager =
    currentUser && currentUser.role === "manager" && currentUser.teamName;
  const isManagerViewingOwnTeam =
    isManager && currentUser.teamName === team.name;
  const isManagerViewingOtherTeam =
    isManager && currentUser.teamName !== team.name;

  const activeDraftFromThisManager =
    isManager && tradeDraft && tradeDraft.fromTeam === currentUser.teamName;

  // -----------------------
  // Drag & drop (ACTIVE ONLY)
  // -----------------------
  const handleDragStart = (e, index) => {
    if (!canEditThisTeam) return;
    setDragFromIndex(index);
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e, index) => {
    if (!canEditThisTeam) return;
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e, index) => {
    if (!canEditThisTeam) return;
    e.preventDefault();

    const fromIdx = Number(e.dataTransfer.getData("text/plain"));
    if (Number.isNaN(fromIdx) || fromIdx === index) return;

    const reordered = [...activeRoster];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(index, 0, moved);

    onUpdateTeamRoster(team.name, [...reordered, ...irPlayers]);
    setDragFromIndex(null);
    setDragOverIndex(null);
  };

  // -----------------------
  // IR handlers
  // -----------------------
  const moveToIR = (playerName) => {
    if (!canEditThisTeam) return;
    if (irPlayers.length >= MAX_IR) {
      window.alert("IR is full (4 players max).");
      return;
    }

    const updated = fullRoster.map((p) =>
      p.name === playerName ? { ...p, onIR: true } : p
    );
    onUpdateTeamRoster(team.name, updated);
  };

  const returnFromIR = (playerName) => {
    if (!canEditThisTeam) return;

    const updated = fullRoster.map((p) =>
      p.name === playerName ? { ...p, onIR: false } : p
    );
    onUpdateTeamRoster(team.name, updated);
  };

  // -----------------------
  // Trade helpers
  // -----------------------
  const isPlayerRequested = (playerName) => {
    if (!tradeDraft || !isManagerViewingOtherTeam) return false;
    return (
      tradeDraft.fromTeam === currentUser.teamName &&
      tradeDraft.toTeam === team.name &&
      tradeDraft.requestedPlayers?.includes(playerName)
    );
  };

  const isPlayerOffered = (playerName) => {
    if (!tradeDraft || !isManagerViewingOwnTeam) return false;
    return tradeDraft.offeredPlayers?.includes(playerName);
  };

  const toggleRequestPlayer = (playerName) => {
    if (!isManagerViewingOtherTeam) return;

    setTradeDraft((prev) => {
      if (!prev || prev.toTeam !== team.name) {
        return {
          fromTeam: currentUser.teamName,
          toTeam: team.name,
          requestedPlayers: [playerName],
          offeredPlayers: [],
          penaltyFrom: "",
          penaltyTo: "",
          retentionFrom: {},
          retentionTo: {},
        };
      }

      const current = prev.requestedPlayers || [];
      return {
        ...prev,
        requestedPlayers: current.includes(playerName)
          ? current.filter((n) => n !== playerName)
          : [...current, playerName],
      };
    });
  };

  const toggleOfferPlayer = (playerName) => {
    if (!activeDraftFromThisManager) return;

    setTradeDraft((prev) => {
      const current = prev.offeredPlayers || [];
      return {
        ...prev,
        offeredPlayers: current.includes(playerName)
          ? current.filter((n) => n !== playerName)
          : [...current, playerName],
      };
    });
  };

  // -----------------------
  // Render
  // -----------------------
  return (
    <div style={panelStyle}>
      {/* Header */}
      <Header
        team={team}
        isManagerViewingOwnTeam={isManagerViewingOwnTeam}
        onManagerProfileImageChange={onManagerProfileImageChange}
        rosterSize={rosterSize}
        maxRosterSize={maxRosterSize}
        F={F}
        D={D}
      />

{/* Cap summary (IR excluded automatically) */}
      <div
  style={{
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "12px",
    fontSize: "0.9rem",
    color: "#e5e7eb",
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
    <strong>Retention spots used:</strong> {retentionSpotsUsed} /{" "}
    {MAX_RETENTION_SPOTS}
  </div>
</div>


      {rosterIllegal && (
        <div style={illegalStyle}>
          <strong>Illegal roster:</strong> active roster violates cap or F/D
          rules.
        </div>
      )}

      {/* ACTIVE ROSTER */}
      <Section title="Roster">
        {activeRoster.map((p, index) => {
          const requested = isPlayerRequested(p.name);
          const offered = isPlayerOffered(p.name);
          const penalty = calculateBuyout(p.salary);
const countsForCapNow = !p.onIR; // cap ignores IR
const newCap = capUsed - (countsForCapNow ? Number(p.salary) || 0 : 0) + penalty;
const locked = isBuyoutLocked(p);
const daysLeft = locked ? getBuyoutLockDaysLeft(p) : 0;

          return (
            <div
              key={`${p.name}-${p.position}-${p.salary}`}
              draggable={canEditThisTeam}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              style={{
                ...rowStyle,
                background: requested
                  ? "#022c22"
                  : offered
                  ? "#1e293b"
                  : "#020617",
              }}
            >
              <div>
                <div>{p.name}</div>
                <div style={subText}>
                  {p.position} • ${p.salary}
                </div>
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                {canEditThisTeam && (
  <div
    style={{ position: "relative", display: "inline-block" }}
    onMouseEnter={() => setHoveredBuyoutPlayer(p.name)}
    onMouseLeave={() => setHoveredBuyoutPlayer(null)}
  >
    <button
      onClick={() => {
        if (locked) return;
        onBuyout(team.name, p.name);
      }}
      disabled={locked}
      style={
        locked
          ? {
              backgroundColor: "#1e40af",
              opacity: 0.55,
              cursor: "not-allowed",
            }
          : undefined
      }
      title={locked ? `Buyout locked: ${daysLeft} day(s) left` : undefined}
    >
      {locked ? `Buyout (${daysLeft}d)` : "Buyout"}
    </button>

    {hoveredBuyoutPlayer === p.name && (
      <div style={tooltipStyle}>
        Penalty: ${penalty}
        <br />
        New cap: ${newCap}
      </div>
    )}
  </div>
)}


                {canEditThisTeam && (
                  <button onClick={() => moveToIR(p.name)}>IR</button>
                )}
                
{canEditThisTeam && onAddToTradeBlock && (
  <button
    onClick={() =>
      onAddToTradeBlock({
        team: team.name,
        player: p.name,
        needs: "",
      })
    }
    title="Adds this player to your Trade Block list"
  >
    Trade Block
  </button>
)}

                {isManagerViewingOtherTeam && (
                  <button onClick={() => toggleRequestPlayer(p.name)}>
                    {requested ? "Unrequest" : "Request"}
                  </button>
                )}

                {isManagerViewingOwnTeam && activeDraftFromThisManager && (
                  <button onClick={() => toggleOfferPlayer(p.name)}>
                    {offered ? "Remove offer" : "Offer"}
                  </button>
                )}

                {currentUser?.role === "commissioner" && (
                  <button
                    onClick={() =>
                      onCommissionerRemovePlayer(team.name, p.name)
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </Section>

      {/* IR */}
      <Section title={`Injured Reserve (${irPlayers.length}/${MAX_IR})`}>
        {irPlayers.map((p) => (
  <div key={`${p.name}-${p.position}-${p.salary}-ir`} style={rowStyle}>
            <div>
              {p.name}
              <div style={subText}>
                {p.position} • ${p.salary}
              </div>
            </div>
            {canEditThisTeam && (
              <button onClick={() => returnFromIR(p.name)}>Return</button>
            )}
          </div>
        ))}
      </Section>

      {/* Buyouts */}
      <Section title="Buyouts">
        {normalBuyouts.map((b, i) => (
          <div key={i} style={rowStyle}>
            <span>{b.player}</span>
            <span>${b.penalty}</span>
          </div>
        ))}
      </Section>

      {/* Retention */}
      <Section title="Retained Salary">
        {retainedBuyouts.map((b, i) => (
          <div key={i} style={rowStyle}>
            <span>{b.player}</span>
            <span>${b.penalty}</span>
          </div>
        ))}
        <div style={subText}>
          Spots used: {retentionSpotsUsed}/{MAX_RETENTION_SPOTS}
        </div>
      </Section>
    </div>
  );
}

/* ------------------ */
/* Small UI helpers   */
/* ------------------ */

const panelStyle = {
  padding: "12px 14px",
  borderRadius: "8px",
  background: "#020617",
  border: "1px solid #1f2937",
  color: "#e5e7eb",
};

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "4px 8px",
  borderRadius: "4px",
  border: "1px solid #1f2937",
  marginBottom: 4,
};

const subText = { fontSize: "0.8rem", color: "#9ca3af" };

const illegalStyle = {
  marginBottom: 10,
  padding: "6px 8px",
  borderRadius: 6,
  background: "#450a0a",
  border: "1px solid #b91c1c",
  color: "#fecaca",
};

const tooltipStyle = {
  position: "absolute",
  left: "100%",
  top: "50%",
  transform: "translate(8px, -50%)",
  background: "#020617",
  border: "1px solid #4b5563",
  padding: "6px 8px",
  fontSize: "0.75rem",
  zIndex: 50,
  whiteSpace: "nowrap",
  pointerEvents: "none", // critical: tooltip can’t steal hover/click
  borderRadius: 6,
  boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
};


const Section = ({ title, children }) => {
  const childArray = React.Children.toArray(children);
  const isEmpty = childArray.length === 0;

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ marginBottom: 8 }}>{title}</h3>
      {isEmpty ? (
        <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>None</p>
      ) : (
        childArray
      )}
    </div>
  );
};


const Header = ({
  team,
  isManagerViewingOwnTeam,
  onManagerProfileImageChange,
  rosterSize,
  maxRosterSize,
  F,
  D,
}) => (
  <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
    {team.profilePic ? (
      <img
        src={team.profilePic}
        alt=""
        style={{ width: 60, height: 60, borderRadius: "50%" }}
      />
    ) : (
      <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#111827" }} />
    )}
    <div style={{ flex: 1 }}>
      <h2 style={{ margin: 0 }}>{team.name}</h2>
      <div style={subText}>
        Active roster: {rosterSize}/{maxRosterSize} • F {F} / D {D}
      </div>
    </div>

    {isManagerViewingOwnTeam && (
  <label
    style={{
      padding: "6px 10px",
      fontSize: "0.8rem",
      backgroundColor: "#1d4ed8",
      color: "#e5e7eb",
      borderRadius: "4px",
      cursor: "pointer",
      display: "inline-block",
    }}
  >
    <input
      type="file"
      hidden
      accept="image/*"
      onChange={onManagerProfileImageChange}
    />
    Change logo
  </label>
)}

  </div>
);

export default TeamRosterPanel;
