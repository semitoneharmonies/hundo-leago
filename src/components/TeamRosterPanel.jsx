// src/components/TeamRosterPanel.jsx
import React, { useMemo, useState } from "react";
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
  playerApi, // optional: lookup helpers
}) {
  // -----------------------
  // Local UI state
  // -----------------------
  const [hoveredBuyoutRef, setHoveredBuyoutRef] = useState(null);
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
  // Phase 2: identity helpers
  // -----------------------
  const normalizeNhlId = (raw) => {
    if (raw == null) return null;
    const s = String(raw).trim();
    if (!s) return null;
    const stripped = s.toLowerCase().startsWith("id:") ? s.slice(3).trim() : s;
    const n = Number(stripped);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.trunc(n);
  };

  // Canonical “player ref” used throughout the app during migration:
  // - preferred: "id:<pid>"
  // - fallback: "<name>"
  const getPlayerRef = (p) => {
    if (!p) return "";
    const pid = normalizeNhlId(p.playerId ?? p.id);
    if (pid) return `id:${pid}`;
    const nm = String(p.name || "").trim();
    return nm;
  };

  const getPlayerId = (p) => normalizeNhlId(p?.playerId ?? p?.id);

  const mapGet = (maybeMap, key) => {
    if (!maybeMap || key == null) return null;
    try {
      if (typeof maybeMap.get === "function") return maybeMap.get(key) || null;
      return maybeMap[key] || null;
    } catch {
      return null;
    }
  };
    const lookupPlayerById = (pid) => {
  const n = normalizeNhlId(pid);
  if (!n) return null;

  const kNum = n;
  const kStr = String(n);

  // try many real-world key variants (Map or object)
  const candidates = [
    kNum,
    kStr,
    `id:${kStr}`,
    `ID:${kStr}`,
    `player:${kStr}`,
    `playerId:${kStr}`,
    `pid:${kStr}`,
    `nhl:${kStr}`,
    `NHL:${kStr}`,
  ];

  const byId = playerApi?.byId;
  if (!byId) return null;

  // Map support
  if (typeof byId.get === "function") {
    for (const k of candidates) {
      const v = byId.get(k);
      if (v) return v;

      // also try lowercase string keys
      if (typeof k === "string") {
        const v2 = byId.get(k.toLowerCase());
        if (v2) return v2;
      }
    }
    return null;
  }

  // object support
  for (const k of candidates) {
    const kk = String(k);
    if (byId[kk]) return byId[kk];
    const lower = kk.toLowerCase();
    if (byId[lower]) return byId[lower];
  }

  // numeric key fallback
  return byId[kNum] || null;
};


  const getPlayerDisplayName = (p) => {
    if (!p) return "";
    const pid = getPlayerId(p);

    // preferred helper
    if (pid && playerApi?.getPlayerNameById) {
      const nm = String(playerApi.getPlayerNameById(pid) || "").trim();
      if (nm) return nm;
    }

    // fallback: byId lookup
    if (pid) {
      const obj = lookupPlayerById(pid);
      const nm = String(obj?.name || obj?.fullName || "").trim();
      if (nm) return nm;
    }

    // legacy fallback
    return String(p?.name || "").trim();
  };


  // Normalize a name for lookup keys (handles extra spaces/case)
  const normalizeNameKey = (s) => {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  };

  // A looser key (drops common punctuation) for name caches that normalize differently
  const looseNameKey = (s) => {
    return normalizeNameKey(s).replace(/[.'’\-]/g, "");
  };

  // Display any stored token (buyouts/tradeblock/etc) as a canonical DB name when possible.
  // Supports:
  //   - "id:####"
  //   - "####"
  //   - legacy name strings (tries multiple name-key strategies)
  // Never shows IDs in the UI.
  const resolvePlayerTokenLabel = (token) => {
    const raw = String(token || "").trim();
    if (!raw) return "";

    // ----- ID path -----
    const pid = normalizeNhlId(raw); // handles "id:####" or "####"
    if (pid) {
      // preferred: provided helper
      if (playerApi?.getPlayerNameById) {
        const nm = String(playerApi.getPlayerNameById(pid) || "").trim();
        if (nm) return nm;
      }

      // fallback: byId map/object
      const obj = lookupPlayerById(pid);
      const nm = String(obj?.name || obj?.fullName || "").trim();
      if (nm) return nm;

      // If we can't resolve the ID, DO NOT leak it in UI
      return "Unknown player";
    }

    // ----- Name path -----
    // Try multiple lookup strategies (exact -> normalized -> loose)
    const exact = raw;
    const norm = normalizeNameKey(raw);
    const loose = looseNameKey(raw);

    // 1) if you have a getPlayerByName helper, try it a few ways
    if (typeof playerApi?.getPlayerByName === "function") {
      const hit =
        playerApi.getPlayerByName(exact) ||
        playerApi.getPlayerByName(norm) ||
        playerApi.getPlayerByName(loose);
      if (hit) return String(hit.fullName || hit.name || raw).trim();
    }

    // 2) if you maintain a byName map/object, try keys there
    const byName =
      mapGet(playerApi?.byName, exact) ||
      mapGet(playerApi?.byName, norm) ||
      mapGet(playerApi?.byName, loose);

if (byName) {
  const label = String(byName.fullName || byName.name || "").trim();
  // Only replace if it actually adds information
  if (label && label.toLowerCase() !== raw.toLowerCase()) {
    return label;
  }
}

    // Fallback: show what was stored (legacy string)
    return raw;
  };


  // Match a roster row against a ref (id:<pid>) or legacy name
  const playerMatchesRef = (p, ref) => {
    if (!p) return false;
    const token = String(ref || "").trim();
    if (!token) return false;

    const tokenId = normalizeNhlId(token);
    const pid = getPlayerId(p);
    if (tokenId && pid) return tokenId === pid;

    // fallback: name compare
    const a = String(p.name || "").trim().toLowerCase();
    const b = token.toLowerCase();
    return a && b && a === b;
  };

  // -----------------------
  // Split ACTIVE vs IR
  // -----------------------
  const fullRoster = Array.isArray(team.roster) ? team.roster : [];
  const activeRoster = fullRoster.filter((p) => !p.onIR);
  const irPlayers = fullRoster.filter((p) => p.onIR);

  // ACTIVE TEAM (used for size + positional rules)
  const activeTeam = { ...team, roster: activeRoster };

  // -----------------------
  // Derived league info
  // -----------------------
  const capUsed = totalCap(team);
  const capRemaining = capLimit - capUsed;

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
  const allBuyouts = Array.isArray(team.buyouts) ? team.buyouts : [];
  const retainedBuyouts = allBuyouts.filter((b) => b?.retained);
  const normalBuyouts = allBuyouts.filter((b) => !b?.retained);
  const retentionSpotsUsed = countRetentionSpots(team);

  // -----------------------
  // Permissions
  // -----------------------
  const canEditThisTeam = canManageTeam(team.name);

  const isManager =
    currentUser && currentUser.role === "manager" && currentUser.teamName;
  const isManagerViewingOwnTeam = isManager && currentUser.teamName === team.name;
  const isManagerViewingOtherTeam = isManager && currentUser.teamName !== team.name;

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
  // IR handlers (ID-first)
  // -----------------------
  const moveToIR = (playerRef) => {
    if (!canEditThisTeam) return;
    if (irPlayers.length >= MAX_IR) {
      window.alert("IR is full (4 players max).");
      return;
    }

    const updated = fullRoster.map((p) =>
      playerMatchesRef(p, playerRef) ? { ...p, onIR: true } : p
    );
    onUpdateTeamRoster(team.name, updated);
  };

  const returnFromIR = (playerRef) => {
    if (!canEditThisTeam) return;

    const updated = fullRoster.map((p) =>
      playerMatchesRef(p, playerRef) ? { ...p, onIR: false } : p
    );
    onUpdateTeamRoster(team.name, updated);
  };

  // -----------------------
  // Trade helpers (ID-ready refs)
  // -----------------------
  const isPlayerRequested = (p) => {
    if (!tradeDraft || !isManagerViewingOtherTeam) return false;
    const ref = getPlayerRef(p);
    return (
      tradeDraft.fromTeam === currentUser.teamName &&
      tradeDraft.toTeam === team.name &&
      (tradeDraft.requestedPlayers || []).includes(ref)
    );
  };

  const isPlayerOffered = (p) => {
    if (!tradeDraft || !isManagerViewingOwnTeam) return false;
    const ref = getPlayerRef(p);
    return (tradeDraft.offeredPlayers || []).includes(ref);
  };

  const toggleRequestPlayer = (p) => {
    if (!isManagerViewingOtherTeam) return;

    const ref = getPlayerRef(p);

    setTradeDraft((prev) => {
      if (!prev || prev.toTeam !== team.name) {
        return {
          fromTeam: currentUser.teamName,
          toTeam: team.name,
          requestedPlayers: [ref],
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
        requestedPlayers: current.includes(ref)
          ? current.filter((x) => x !== ref)
          : [...current, ref],
      };
    });
  };

  const toggleOfferPlayer = (p) => {
    if (!activeDraftFromThisManager) return;

    const ref = getPlayerRef(p);

    setTradeDraft((prev) => {
      const current = prev?.offeredPlayers || [];
      return {
        ...prev,
        offeredPlayers: current.includes(ref)
          ? current.filter((x) => x !== ref)
          : [...current, ref],
      };
    });
  };

  // -----------------------
  // Keys (stable)
  // -----------------------
  const getRowKey = (p, index, suffix = "") => {
    const pid = getPlayerId(p);
    if (pid) return `pid:${pid}${suffix}`;
    const nm = String(p?.name || "").trim().toLowerCase();
    const pos = String(p?.position || "");
    const sal = String(p?.salary ?? "");
    return `legacy:${nm}:${pos}:${sal}:${index}${suffix}`;
  };

  // -----------------------
  // Render
  // -----------------------
  return (
    <div style={panelStyle}>
      <Header
        team={team}
        isManagerViewingOwnTeam={isManagerViewingOwnTeam}
        onManagerProfileImageChange={onManagerProfileImageChange}
        rosterSize={rosterSize}
        maxRosterSize={maxRosterSize}
        F={F}
        D={D}
      />

      {/* Cap summary */}
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
          <strong>Illegal roster:</strong> active roster violates cap or F/D rules.
        </div>
      )}

      {/* ACTIVE ROSTER */}
      <Section title="Roster">
        {activeRoster.map((p, index) => {
          const displayName = getPlayerDisplayName(p);
          const playerRef = getPlayerRef(p);

          const requested = isPlayerRequested(p);
          const offered = isPlayerOffered(p);

          const penalty = calculateBuyout(p.salary);
          const newCap = capUsed - (Number(p.salary) || 0) + penalty;

          const locked = isBuyoutLocked(p);
          const daysLeft = locked ? getBuyoutLockDaysLeft(p) : 0;

          return (
            <div
              key={getRowKey(p, index)}
              draggable={canEditThisTeam}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              style={{
                ...rowStyle,
                ...(dragOverIndex === index ? { outline: "2px solid #0ea5e9" } : {}),
                ...(requested || offered ? { background: "#083329" } : {}),
              }}
            >
              <div>
                <div>{displayName}</div>
                <div style={subText}>
                  {p.position} • ${p.salary}
                  {getPlayerId(p) ? (
                    <span style={{ marginLeft: 6, color: "#94a3b8" }}>
                      ({playerRef})
                    </span>
                  ) : null}
                </div>
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                {canEditThisTeam && (
                  <div
                    style={{ position: "relative", display: "inline-block" }}
                    onMouseEnter={() => setHoveredBuyoutRef(playerRef)}
                    onMouseLeave={() => setHoveredBuyoutRef(null)}
                  >
                    <button
                      onClick={() => {
                        if (locked) return;
                        // ID-first: pass ref (id:<pid>) when available
                        onBuyout(team.name, playerRef);
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

                    {hoveredBuyoutRef === playerRef && (
                      <div style={tooltipStyle}>
                        Penalty: ${penalty}
                        <br />
                        New cap: ${newCap}
                      </div>
                    )}
                  </div>
                )}

                {canEditThisTeam && <button onClick={() => moveToIR(playerRef)}>IR</button>}

                {canEditThisTeam && onAddToTradeBlock && (
                  <button
                    onClick={() =>
                      onAddToTradeBlock({
                        team: team.name,
                        player: playerRef, // ✅ store ref (id:<pid>) when possible
                        needs: "",
                      })
                    }
                    title="Adds this player to your Trade Block list"
                  >
                    Trade Block
                  </button>
                )}

                {isManagerViewingOtherTeam && (
                  <button onClick={() => toggleRequestPlayer(p)}>
                    {requested ? "Unrequest" : "Request"}
                  </button>
                )}

                {isManagerViewingOwnTeam && activeDraftFromThisManager && (
                  <button onClick={() => toggleOfferPlayer(p)}>
                    {offered ? "Remove offer" : "Offer"}
                  </button>
                )}

                {currentUser?.role === "commissioner" && (
                  <button
                    onClick={() => onCommissionerRemovePlayer(team.name, playerRef)}
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
        {irPlayers.map((p, index) => {
          const displayName = getPlayerDisplayName(p);
          const playerRef = getPlayerRef(p);

          return (
            <div key={getRowKey(p, index, ":ir")} style={rowStyle}>
              <div>
                {displayName}
                <div style={subText}>
                  {p.position} • ${p.salary}
                  {getPlayerId(p) ? (
                    <span style={{ marginLeft: 6, color: "#94a3b8" }}>
                      ({playerRef})
                    </span>
                  ) : null}
                </div>
              </div>
              {canEditThisTeam && (
                <button onClick={() => returnFromIR(playerRef)}>Return</button>
              )}
            </div>
          );
        })}
      </Section>

      {/* Buyouts */}
      <Section title="Buyouts">
        {normalBuyouts.map((b, i) => (
          <div key={i} style={rowStyle}>
<span>{resolvePlayerTokenLabel(b?.player || "")}</span>
            <span>${Number(b?.penalty) || 0}</span>
          </div>
        ))}
      </Section>

      {/* Retention */}
      <Section title="Retained Salary">
        {retainedBuyouts.map((b, i) => (
          <div key={i} style={rowStyle}>
<span>{resolvePlayerTokenLabel(b?.player || "")}</span>
            <span>${Number(b?.penalty) || 0}</span>
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
  pointerEvents: "none",
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
      <div
        style={{ width: 60, height: 60, borderRadius: "50%", background: "#111827" }}
      />
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
        <input type="file" hidden accept="image/*" onChange={onManagerProfileImageChange} />
        Change logo
      </label>
    )}
  </div>
);

export default TeamRosterPanel;
