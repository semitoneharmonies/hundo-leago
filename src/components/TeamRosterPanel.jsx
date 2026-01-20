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

// Colors (kept close to your current palette)
const BASE_BG = "#020617"; // current dark blue background
const BORDER = "#1f2937";
const TEXT = "#e5e7eb";
const MUTED = "#9ca3af";

const POS_COLORS = {
  F: { solid: "#22c55e", tint: "rgba(34,197,94,0.22)" }, // green
  D: { solid: "#a855f7", tint: "rgba(168,85,247,0.22)" }, // purple
  G: { solid: "#60a5fa", tint: "rgba(96,165,250,0.22)" }, // blue (fallback)
};

const HealthIcon = ({ size = 14 }) => {
  const s = size;
  const bar = Math.max(2, Math.round(s / 4));

  return (
    <span
      style={{
        width: s + 8,
        height: s + 8,
        borderRadius: "50%",
        background: "#dc2626", // red-600
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
      }}
    >
      <span
        style={{
          position: "relative",
          width: s,
          height: s,
        }}
      >
        {/* vertical bar */}
        <span
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            transform: "translateX(-50%)",
            width: bar,
            height: "100%",
            background: "#ffffff",
            borderRadius: 2,
          }}
        />
        {/* horizontal bar */}
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            transform: "translateY(-50%)",
            width: "100%",
            height: bar,
            background: "#ffffff",
            borderRadius: 2,
          }}
        />
      </span>
    </span>
  );
};


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
  // ID helpers
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

  const getPlayerId = (p) => normalizeNhlId(p?.playerId ?? p?.id);

  // Canonical “player ref” used for storage/actions:
  // - preferred: "id:<pid>"
  // - fallback: "<name>"
  const getPlayerRef = (p) => {
    if (!p) return "";
    const pid = getPlayerId(p);
    if (pid) return `id:${pid}`;
    return String(p?.name || "").trim();
  };

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

    if (typeof byId.get === "function") {
      for (const k of candidates) {
        const v = byId.get(k);
        if (v) return v;
        if (typeof k === "string") {
          const v2 = byId.get(k.toLowerCase());
          if (v2) return v2;
        }
      }
      return null;
    }

    for (const k of candidates) {
      const kk = String(k);
      if (byId[kk]) return byId[kk];
      const lower = kk.toLowerCase();
      if (byId[lower]) return byId[lower];
    }

    return byId[kNum] || null;
  };

  const getPlayerDisplayName = (p) => {
  if (!p) return "";

  const legacy = String(p?.name || "").trim();



  const pid = getPlayerId(p);

  // Preferred helper
  if (pid && playerApi?.getPlayerNameById) {
    const nm = String(playerApi.getPlayerNameById(pid) || "").trim();
    if (nm) return nm;
  }

  // Fallback: byId lookup
  if (pid) {
    const obj = lookupPlayerById(pid);
    const nm = String(obj?.name || obj?.fullName || "").trim();
    if (nm) return nm;
  }

  return legacy;
};


  // -----------------------
  // Age helper (needs birthDate on the player object)
  // -----------------------
  const computeAge = (birthDateStr) => {
    const s = String(birthDateStr || "").trim();
    if (!s) return null;

    // Expecting YYYY-MM-DD
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return null;

    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);

    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;

    const now = new Date();
    let age = now.getFullYear() - y;

    const nowMonth = now.getMonth() + 1; // 1-12
    const nowDay = now.getDate();

    if (nowMonth < mo || (nowMonth === mo && nowDay < d)) age -= 1;
    if (age < 0 || age > 60) return null; // sanity guard
    return age;
  };

  const getPlayerAge = (p) => {
    const pid = getPlayerId(p);
    if (!pid) return null;

    const obj = lookupPlayerById(pid);
    const birthDate = obj?.birthDate || obj?.birthdate || obj?.birth_date || null;
    return computeAge(birthDate);
  };

  // -----------------------
  // Token label resolver (buyouts/retention)
  // -----------------------
  const normalizeNameKey = (s) =>
    String(s || "").trim().toLowerCase().replace(/\s+/g, " ");

  const looseNameKey = (s) => normalizeNameKey(s).replace(/[.'’\-]/g, "");

  const resolvePlayerTokenLabel = (token) => {
    const raw = String(token || "").trim();
    if (!raw) return "";

    const pid = normalizeNhlId(raw);
    if (pid) {
      if (playerApi?.getPlayerNameById) {
        const nm = String(playerApi.getPlayerNameById(pid) || "").trim();
        if (nm) return nm;
      }
      const obj = lookupPlayerById(pid);
      const nm = String(obj?.name || obj?.fullName || "").trim();
      if (nm) return nm;
      return "Unknown player";
    }

    // name path
    const exact = raw;
    const norm = normalizeNameKey(raw);
    const loose = looseNameKey(raw);

    if (typeof playerApi?.getPlayerByName === "function") {
      const hit =
        playerApi.getPlayerByName(exact) ||
        playerApi.getPlayerByName(norm) ||
        playerApi.getPlayerByName(loose);
      if (hit) return String(hit.fullName || hit.name || raw).trim();
    }

    const byName =
      mapGet(playerApi?.byName, exact) ||
      mapGet(playerApi?.byName, norm) ||
      mapGet(playerApi?.byName, loose);

    if (byName) {
      const label = String(byName.fullName || byName.name || "").trim();
      if (label && label.toLowerCase() !== raw.toLowerCase()) return label;
    }

    return raw;
  };

  const playerMatchesRef = (p, ref) => {
    if (!p) return false;
    const token = String(ref || "").trim();
    if (!token) return false;

    const tokenId = normalizeNhlId(token);
    const pid = getPlayerId(p);
    if (tokenId && pid) return tokenId === pid;

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
  // IR handlers
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
  // Trade helpers
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
  // Stable keys
  // -----------------------
  const getRowKey = (p, index, suffix = "") => {
    const pid = getPlayerId(p);
    if (pid) return `pid:${pid}${suffix}`;
    const nm = String(p?.name || "").trim().toLowerCase();
    const pos = String(p?.position || "");
    const sal = String(p?.salary ?? "");
    return `legacy:${nm}:${pos}:${sal}:${index}${suffix}`;
  };

  const getPos = (p) => {
    const raw = String(p?.position || "").toUpperCase().trim();
    if (raw === "D") return "D";
    if (raw === "G") return "G";
    return "F";
  };

  const formatSalary = (n) => {
    const x = Number(n);
    if (!Number.isFinite(x)) return "-";
    return `$${x}`;
  };

  const ActionButton = ({ title, onClick, disabled, children, subtle }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        ...iconBtnStyle,
        ...(subtle ? iconBtnSubtleStyle : {}),
        ...(disabled ? iconBtnDisabledStyle : {}),
      }}
    >
      {children}
    </button>
  );

  const renderRosterRow = (p, index, { isIR }) => {
    const displayName = getPlayerDisplayName(p);
    const playerRef = getPlayerRef(p);

    const pos = getPos(p);
    const posColor = POS_COLORS[pos] || POS_COLORS.F;

    const requested = isPlayerRequested(p);
    const offered = isPlayerOffered(p);

    const locked = isBuyoutLocked(p);
    const daysLeft = locked ? getBuyoutLockDaysLeft(p) : 0;

    const penalty = calculateBuyout(p.salary);
    const newCap = capUsed - (Number(p.salary) || 0) + penalty;

    const age = getPlayerAge(p);

    // subtle green/purple tint on the RIGHT side
    const bg = `linear-gradient(90deg, ${BASE_BG} 0%, ${BASE_BG} 65%, ${posColor.tint} 100%)`;

    return (
      <div
        key={getRowKey(p, index, isIR ? ":ir" : "")}
        draggable={!isIR && canEditThisTeam}
        onDragStart={!isIR ? (e) => handleDragStart(e, index) : undefined}
        onDragOver={!isIR ? (e) => handleDragOver(e, index) : undefined}
        onDrop={!isIR ? (e) => handleDrop(e, index) : undefined}
        style={{
          ...playerRowStyle,
          background: bg,
          ...(dragOverIndex === index && !isIR ? { outline: "2px solid #0ea5e9" } : {}),
          ...(requested || offered ? { boxShadow: "0 0 0 1px rgba(34,197,94,0.35) inset" } : {}),
        }}
      >
        {/* POS PILL */}
        <div
          style={{
            ...posPillStyle,
            background: posColor.solid,
            justifySelf: "center",
          }}
          title={pos === "F" ? "Forward" : pos === "D" ? "Defense" : "Goalie"}
        >
          {pos}
        </div>

        {/* NAME */}
        <div style={nameCellStyle} title={displayName}>
          {displayName}
        </div>

        {/* AGE */}
        <div style={ageCellStyle} title={age == null ? "Age unavailable" : `Age: ${age}`}>
          {age == null ? "—" : age}
        </div>

        {/* SALARY */}
        <div style={salaryCellStyle}>{formatSalary(p.salary)}</div>

        {/* STATS (reserved space for later) */}
        <div style={statsCellStyle} />


        {/* ACTIONS */}
        <div style={actionsCellStyle}>
          {!isIR && canEditThisTeam && (
            <div
              style={{ position: "relative", display: "inline-block" }}
              onMouseEnter={() => setHoveredBuyoutRef(playerRef)}
              onMouseLeave={() => setHoveredBuyoutRef(null)}
            >
              <ActionButton
                title={locked ? `Buyout locked (${daysLeft}d)` : "Buyout"}
                onClick={() => {
                  if (locked) return;
                  onBuyout(team.name, playerRef);
                }}
                disabled={locked}
              >
                💲
              </ActionButton>

              {hoveredBuyoutRef === playerRef && (
                <div style={tooltipStyle}>
                  Penalty: ${penalty}
                  <br />
                  New cap: ${newCap}
                </div>
              )}
            </div>
          )}

          {canEditThisTeam && !isIR && (
  <ActionButton title="Move to IR" onClick={() => moveToIR(playerRef)} subtle>
    <HealthIcon />
  </ActionButton>
)}


          {canEditThisTeam && isIR && (
            <ActionButton title="Return from IR" onClick={() => returnFromIR(playerRef)} subtle>
              ↩
            </ActionButton>
          )}

          {canEditThisTeam && !isIR && onAddToTradeBlock && (
            <ActionButton
              title="Add to Trade Block"
              onClick={() =>
                onAddToTradeBlock({
                  team: team.name,
                  player: playerRef,
                  needs: "",
                })
              }
              subtle
            >
              📌
            </ActionButton>
          )}

          {isManagerViewingOtherTeam && !isIR && (
            <ActionButton
              title={requested ? "Unrequest player" : "Request player"}
              onClick={() => toggleRequestPlayer(p)}
            >
              {requested ? "✖" : "↔️"}
            </ActionButton>
          )}

          {isManagerViewingOwnTeam && activeDraftFromThisManager && !isIR && (
            <ActionButton
              title={offered ? "Remove offer" : "Offer player"}
              onClick={() => toggleOfferPlayer(p)}
            >
              {offered ? "✖" : "↔️"}
            </ActionButton>
          )}

          {currentUser?.role === "commissioner" && !isIR && (
            <ActionButton
              title="Remove player (commissioner)"
              onClick={() => onCommissionerRemovePlayer(team.name, playerRef)}
              subtle
            >
              🗑
            </ActionButton>
          )}
        </div>
      </div>
    );
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
      <div style={capSummaryStyle}>
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
          <strong>Retention spots used:</strong> {retentionSpotsUsed} / {MAX_RETENTION_SPOTS}
        </div>
      </div>

      {rosterIllegal && (
        <div style={illegalStyle}>
          <strong>Illegal roster:</strong> active roster violates cap or F/D rules.
        </div>
      )}

      {/* ACTIVE ROSTER */}
<Section title="Roster">
  {/* Column headers */}
  <RosterColumnHeader />


  {activeRoster.map((p, index) => renderRosterRow(p, index, { isIR: false }))}
</Section>


      {/* IR */}
<Section title={`Injured Reserve (${irPlayers.length}/${MAX_IR})`}>
  {/* Column headers */}
  <RosterColumnHeader />


  {irPlayers.map((p, index) => renderRosterRow(p, index, { isIR: true }))}
</Section>


      {/* Buyouts */}
      <Section title="Buyouts">
        {normalBuyouts.map((b, i) => (
          <div key={i} style={simpleRowStyle}>
            <span>{resolvePlayerTokenLabel(b?.player || "")}</span>
            <span>${Number(b?.penalty) || 0}</span>
          </div>
        ))}
      </Section>

      {/* Retention */}
      <Section title="Retained Salary">
        {retainedBuyouts.map((b, i) => (
          <div key={i} style={simpleRowStyle}>
            <span>{resolvePlayerTokenLabel(b?.player || "")}</span>
            <span>${Number(b?.penalty) || 0}</span>
          </div>
        ))}
        <div style={subText}>Spots used: {retentionSpotsUsed}/{MAX_RETENTION_SPOTS}</div>
      </Section>
    </div>
  );
}

/* ------------------ */
/* Styles             */
/* ------------------ */

const panelStyle = {
  padding: "12px 14px",
  borderRadius: "10px",
  background: BASE_BG,
  border: `1px solid ${BORDER}`,
  color: TEXT,
};

const capSummaryStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  marginBottom: "12px",
  fontSize: "0.9rem",
  color: TEXT,
};


// Shared grid so header lines up perfectly with rows
// Shared grid so header lines up perfectly with rows
const rosterGridTemplateColumns = "28px 1fr 44px 72px 120px 160px";

const playerRowStyle = {
  display: "grid",
  // pill | name | age | salary | (reserved stats area) | actions
  gridTemplateColumns: rosterGridTemplateColumns,
  alignItems: "center",
  gap: 10,
  padding: "6px 10px",
  borderRadius: 8,
  border: `1px solid ${BORDER}`,
  marginBottom: 6,
};

const rosterHeaderRowStyle = {
  display: "grid",
  gridTemplateColumns: rosterGridTemplateColumns,
  alignItems: "center",
  gap: 10,
  padding: "4px 10px",
  marginBottom: 6,
  color: "#94a3b8",
  fontSize: "0.72rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const headerRight = { justifySelf: "end" };
const headerCenter = { justifySelf: "center" };


const posPillStyle = {
  width: 24,
  height: 24,
  borderRadius: "999px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#0b1020",
  fontWeight: 900,
  fontSize: "0.8rem",
  boxShadow: "0 6px 14px rgba(0,0,0,0.35)",
  userSelect: "none",
};

const nameCellStyle = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: "0.98rem",
  fontWeight: 800,
  letterSpacing: "0.2px",
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans", "Liberation Sans", sans-serif',
};


const ageCellStyle = {
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
  color: "#cbd5e1",
};

const salaryCellStyle = {
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
  color: "#e2e8f0",
};

const statsCellStyle = {
  height: 1, // intentionally empty spacer column for future stats
};

const actionsCellStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 6,
  alignItems: "center",
};

const iconBtnStyle = {
  width: 32,
  height: 28,
  borderRadius: 8,
  border: `1px solid ${BORDER}`,
  background: "#0b1224",
  color: TEXT,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.9rem",
  lineHeight: 1,
};

const iconBtnSubtleStyle = {
  background: "#071022",
  opacity: 0.95,
};

const iconBtnDisabledStyle = {
  opacity: 0.45,
  cursor: "not-allowed",
};

const subText = { fontSize: "0.8rem", color: MUTED };

const illegalStyle = {
  marginBottom: 10,
  padding: "6px 8px",
  borderRadius: 8,
  background: "#450a0a",
  border: "1px solid #b91c1c",
  color: "#fecaca",
};

const tooltipStyle = {
  position: "absolute",
  left: "100%",
  top: "50%",
  transform: "translate(8px, -50%)",
  background: BASE_BG,
  border: "1px solid #4b5563",
  padding: "6px 8px",
  fontSize: "0.75rem",
  zIndex: 50,
  whiteSpace: "nowrap",
  pointerEvents: "none",
  borderRadius: 8,
  boxShadow: "0 10px 24px rgba(0,0,0,0.55)",
};

const simpleRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 8,
  border: `1px solid ${BORDER}`,
  marginBottom: 6,
  background: BASE_BG,
};

const RosterColumnHeader = () => (
  <div style={rosterHeaderRowStyle}>
    <div style={headerCenter}>POS</div>
    <div>NAME</div>
    <div style={headerRight}>AGE</div>
    <div style={headerRight}>SALARY</div>
    <div style={headerCenter}>STATS</div>
    <div style={headerRight}>ACTIONS</div>
  </div>
);

const Section = ({ title, children }) => {
  const childArray = React.Children.toArray(children);
  const isEmpty = childArray.length === 0;

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ marginBottom: 8 }}>{title}</h3>
      {isEmpty ? (
        <p style={{ color: MUTED, fontSize: "0.85rem" }}>None</p>
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
    {/* LOGO (clickable if manager) */}
    <label
      title={isManagerViewingOwnTeam ? "Click to change team logo" : ""}
      style={{
        width: 60,
        height: 60,
        borderRadius: "50%",
        overflow: "hidden",
        cursor: isManagerViewingOwnTeam ? "pointer" : "default",
        display: "inline-block",
        boxShadow: isManagerViewingOwnTeam
          ? "0 0 0 2px rgba(59,130,246,0.25)"
          : "none",
        transition: "transform 0.12s ease, box-shadow 0.12s ease",
      }}
      onMouseEnter={(e) => {
        if (!isManagerViewingOwnTeam) return;
        e.currentTarget.style.transform = "scale(1.04)";
        e.currentTarget.style.boxShadow =
          "0 0 0 2px rgba(59,130,246,0.4), 0 0 16px rgba(59,130,246,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = isManagerViewingOwnTeam
          ? "0 0 0 2px rgba(59,130,246,0.25)"
          : "none";
      }}
    >
      {team.profilePic ? (
        <img
          src={team.profilePic}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#111827",
          }}
        />
      )}

      {isManagerViewingOwnTeam && (
        <input
          type="file"
          hidden
          accept="image/*"
          onChange={onManagerProfileImageChange}
        />
      )}
    </label>

    {/* TEAM INFO */}
    <div style={{ flex: 1 }}>
      <h2 style={{ margin: 0 }}>{team.name}</h2>
      <div style={{ fontSize: "0.8rem", color: MUTED }}>
        Active roster: {rosterSize}/{maxRosterSize} • F {F} / D {D}
      </div>
    </div>
  </div>
);


export default TeamRosterPanel;
