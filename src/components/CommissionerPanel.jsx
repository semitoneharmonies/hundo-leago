// src/components/CommissionerPanel.jsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * CommissionerPanel
 *
 * This component is UI + small helper logic.
 * App.jsx should pass the league state + setters + a few callbacks.
 *
 * Required props:
 * - currentUser
 * - apiUrl (the same API_URL you use in App.jsx, e.g. https://.../api/league)
 * - teams, setTeams
 * - tradeProposals, setTradeProposals
 * - freeAgents, setFreeAgents
 * - leagueLog, setLeagueLog
 * - tradeBlock, setTradeBlock
 * - onResolveAuctions (commissioner action you already have)
 * - onCommissionerRemoveBid (commissioner action you already have)
 *
 * Also recommended:
 * - getDefaultLeagueState()  -> returns { teams, tradeProposals, freeAgents, leagueLog, tradeBlock, settings? }
 *   (we’ll wire this from App.jsx later)
 */

function safeNumber(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function nowId() {
  return Date.now() + Math.random();
}

function sortRosterDefault(roster = []) {
  const forwards = roster.filter((p) => p.position !== "D");
  const defense = roster.filter((p) => p.position === "D");
  forwards.sort((a, b) => (b.salary || 0) - (a.salary || 0));
  defense.sort((a, b) => (b.salary || 0) - (a.salary || 0));
  return [...forwards, ...defense];
}

export default function CommissionerPanel({
  currentUser,
  apiUrl,

  teams,
  tradeProposals,
  freeAgents,
  leagueLog,
  tradeBlock,
  onResolveAuctions,
  onCommissionerRemoveBid,
  leagueSettings,
  commitLeagueUpdate,
    onCleanupDeleteLogs,

}) {
  const isCommish = currentUser?.role === "commissioner";


 const managerLastLogin = leagueSettings?.managerLastLogin || {};

// One row per team, sorted by team name (or sort by timestamp if you want)
const loginHistory = (teams || [])
  .filter((t) => t?.name)
  .map((t) => {
    const entry = managerLastLogin[t.name] || null;
    return {
      teamName: t.name,
      timestamp: entry?.timestamp || null,
    };
  })
  .sort((a, b) => a.teamName.localeCompare(b.teamName));




  // Derive API base so we can call /api/snapshots using the same origin
  const apiBase = useMemo(() => {
    // apiUrl expected to end with "/api/league"
    if (!apiUrl) return "";
    return apiUrl.replace(/\/api\/league\/?$/, "");
  }, [apiUrl]);

  // ----------------------------
  // Local UI state
  // ----------------------------
  const [busy, setBusy] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");

  // Freeze league (stored in settings if provided; otherwise local-only)
  const frozen = Boolean(leagueSettings?.frozen);

  // Snapshots
  const [snapshots, setSnapshots] = useState([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState("");
  const [newSnapshotName, setNewSnapshotName] = useState("");

  // Roster editor
  const [editTeamName, setEditTeamName] = useState(teams?.[0]?.name || "");
  const [editRoster, setEditRoster] = useState([]);
  const [editBuyouts, setEditBuyouts] = useState([]);
  const [editRetained, setEditRetained] = useState([]);

  // ----------------------------
  // Init roster editor when team changes
  // ----------------------------
  useEffect(() => {
    const team = (teams || []).find((t) => t.name === editTeamName);
    setEditRoster(
  (team?.roster || []).map((p) => ({
    _rowId: nowId(),
    name: p.name || "",
    salary: safeNumber(p.salary, 0),
    position: p.position === "D" ? "D" : "F",
  }))
);

   setEditBuyouts(
  (team?.buyouts || [])
    .filter((b) => !b?.retained)
    .map((b) => ({
      _rowId: nowId(),
      player: b.player || "",
      penalty: safeNumber(b.penalty, 0),
    }))
);


  setEditRetained(
  (team?.buyouts || [])
    .filter((b) => b?.retained)
    .map((r) => ({
      _rowId: nowId(),
      player: r.player || "",
      amount: safeNumber(r.penalty, 0),
      note: r.note || r.fromTeam || "",
    }))
);


  }, [editTeamName, teams]);

  // ----------------------------
  // Helpers
  // ----------------------------

  const effectiveFrozen = frozen;


const setFrozen = (nextFrozen) => {
  const nextVal = Boolean(nextFrozen);

  // Small safety confirm (freezing affects everyone)
  if (nextVal) {
    const ok = window.confirm(
      "Freeze the league? Managers will be blocked from making changes."
    );
    if (!ok) return;
  }

  if (typeof commitLeagueUpdate !== "function") {
    window.alert("Freeze toggle is unavailable (commitLeagueUpdate missing).");
    return;
  }

  commitLeagueUpdate("commFreezeToggle", (prev) => {
    const prevSettings = prev?.settings || {};
    const now = Date.now();

    const entry = {
      id: nowId(),
      type: "commFreezeToggle",
      by: "Commissioner",
      frozen: nextVal,
      timestamp: now,
    };

    return {
      settings: { ...prevSettings, frozen: nextVal },
      leagueLog: [
        entry,
        ...(Array.isArray(prev?.leagueLog) ? prev.leagueLog : []),
      ],
    };
  });
};



  // ----------------------------
  // Snapshot calls
  // ----------------------------
  const loadSnapshots = async () => {
    if (!apiBase) return;
    setSnapshotsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/snapshots`);
      const data = await res.json();
      const list = Array.isArray(data?.snapshots) ? data.snapshots : [];
      setSnapshots(list);
      if (list.length && !selectedSnapshotId) {
        setSelectedSnapshotId(list[0].id);
      }
    } catch (e) {
      console.error("[SNAPSHOTS] load failed:", e);
      setAdminMessage("Failed to load snapshots.");
    } finally {
      setSnapshotsLoading(false);
    }
  };

  useEffect(() => {
    // Load snapshot list when panel first appears
    loadSnapshots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

 const restoreSnapshot = async (snapshotId) => {
  if (!apiBase || !snapshotId) return;
  if (!window.confirm(`Restore snapshot "${snapshotId}"? This overwrites the league state.`)) return;

  setBusy(true);
  setAdminMessage("");
  try {
    const res = await fetch(`${apiBase}/api/snapshots/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: snapshotId }),
    });

    const data = await res.json();
    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }

    // Log it through the single write funnel (safe + consistent)
    if (typeof commitLeagueUpdate === "function") {
      commitLeagueUpdate("commRestoreSnapshot", (prev) => {
        const prevLog = Array.isArray(prev?.leagueLog) ? prev.leagueLog : [];
        const entry = {
          id: nowId(),
          type: "commRestoreSnapshot",
          by: "Commissioner",
          snapshotId,
          timestamp: Date.now(),
        };
        return { leagueLog: [entry, ...prevLog] };
      });
    }

    setAdminMessage(`Snapshot restored: ${snapshotId}`);
  } catch (e) {
    console.error("[SNAPSHOTS] restore failed:", e);
    setAdminMessage(`Restore failed: ${e.message || "unknown error"}`);
  } finally {
    setBusy(false);
  }
};


 const createSnapshot = async () => {
  if (!apiBase) return;

  const name = (newSnapshotName || "").trim();

  setBusy(true);
  setAdminMessage("");
  try {
    const res = await fetch(`${apiBase}/api/snapshots/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || null }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }

    if (typeof commitLeagueUpdate === "function") {
      commitLeagueUpdate("commCreateSnapshot", (prev) => {
        const prevLog = Array.isArray(prev?.leagueLog) ? prev.leagueLog : [];
        const entry = {
          id: nowId(),
          type: "commCreateSnapshot",
          by: "Commissioner",
          snapshotId: data.snapshotId || null,
          timestamp: Date.now(),
        };
        return { leagueLog: [entry, ...prevLog] };
      });
    }

    setNewSnapshotName("");
    setAdminMessage("Snapshot created.");
    await loadSnapshots();
  } catch (e) {
    console.error("[SNAPSHOTS] create failed:", e);
    setAdminMessage(
      `Snapshot create failed (likely missing backend endpoint). ${e.message || ""}`.trim()
    );
  } finally {
    setBusy(false);
  }
};



  // ----------------------------
  // Roster editor apply
  // ----------------------------
 const applyRosterEdits = () => {
  const cleanedRoster = (editRoster || [])
    .map((p) => ({
      name: (p.name || "").trim(),
      salary: safeNumber(p.salary, 0),
      position: p.position === "D" ? "D" : "F",
    }))
    .filter((p) => p.name);

  const cleanedBuyouts = (editBuyouts || [])
    .map((b) => ({
      player: (b.player || "").trim(),
      penalty: Math.max(0, safeNumber(b.penalty, 0)),
    }))
    .filter((b) => b.player && b.penalty > 0);

  const cleanedRetained = (editRetained || [])
    .map((r) => ({
      player: (r.player || "").trim(),
      penalty: Math.max(0, safeNumber(r.amount, 0)),
      retained: true,
      note: (r.note || "").trim(),
    }))
    .filter((r) => r.player && r.penalty > 0);

  const ok = window.confirm(`Apply roster edits to ${editTeamName}?`);
  if (!ok) return;

  if (typeof commitLeagueUpdate !== "function") {
    window.alert("Roster edits are unavailable (commitLeagueUpdate missing).");
    return;
  }

  commitLeagueUpdate("commEditTeam", (prev) => {
    const prevTeams = Array.isArray(prev?.teams) ? prev.teams : [];
    const prevLog = Array.isArray(prev?.leagueLog) ? prev.leagueLog : [];
    const now = Date.now();

    const nextTeams = prevTeams.map((t) => {
      if (t?.name !== editTeamName) return t;
      return {
        ...t,
        roster: sortRosterDefault(cleanedRoster),
        buyouts: [...cleanedBuyouts, ...cleanedRetained],
      };
    });

    const entry = {
      id: nowId(),
      type: "commEditTeam",
      by: "Commissioner",
      team: editTeamName,
      summary: "Edited roster/buyouts/retained",
      timestamp: now,
    };

    return {
      teams: nextTeams,
      leagueLog: [entry, ...prevLog],
    };
  });

  setAdminMessage(`Saved edits for ${editTeamName}`);
};


const addRosterRow = () => {
  setEditRoster((prev) => [...(prev || []), { _rowId: nowId(), name: "", salary: 1, position: "F" }]);
};


  const addBuyoutRow = () => {
  setEditBuyouts((prev) => [...(prev || []), { _rowId: nowId(), player: "", penalty: 0 }]);
};

  const addRetentionRow = () => {
  setEditRetained((prev) => [...(prev || []), { _rowId: nowId(), player: "", amount: 0, note: "" }]);
};


  // ----------------------------
  // Trades admin
  // ----------------------------
  const forceCancelTrade = (tradeId) => {
  if (!tradeId) return;

  const ok = window.confirm("Force-cancel this trade? This cannot be undone.");
  if (!ok) return;

  if (typeof commitLeagueUpdate !== "function") {
    window.alert("Force-cancel is unavailable (commitLeagueUpdate missing).");
    return;
  }

  commitLeagueUpdate("commCancelTrade", (prev) => {
    const prevTrades = Array.isArray(prev?.tradeProposals)
      ? prev.tradeProposals
      : [];
    const prevLog = Array.isArray(prev?.leagueLog) ? prev.leagueLog : [];
    const now = Date.now();

    const nextTrades = prevTrades.map((tr) => {
      if (tr?.id !== tradeId) return tr;
      return {
        ...tr,
        status: "cancelled",
        cancelledBy: "Commissioner",
        autoCancelled: false,
        reason: "commissionerForceCancel",
        updatedAt: now,
      };
    });

    const entry = {
      id: nowId(),
      type: "commCancelTrade",
      by: "Commissioner",
      tradeId,
      timestamp: now,
    };

    return {
      tradeProposals: nextTrades,
      leagueLog: [entry, ...prevLog],
    };
  });
};


  const clearAllPendingTrades = () => {
  const ok = window.confirm("Clear ALL pending trades?");
  if (!ok) return;

  if (typeof commitLeagueUpdate === "function") {
    commitLeagueUpdate("commClearPendingTrades", (prev) => {
      const prevTrades = Array.isArray(prev?.tradeProposals)
        ? prev.tradeProposals
        : [];
      const prevLog = Array.isArray(prev?.leagueLog)
        ? prev.leagueLog
        : [];

      const now = Date.now();

      const nextTrades = prevTrades.map((tr) =>
        tr.status === "pending"
          ? {
              ...tr,
              status: "cancelled",
              cancelledBy: "Commissioner",
              updatedAt: now,
            }
          : tr
      );

      const entry = {
        id: now + Math.random(),
        type: "commClearPendingTrades",
        by: "Commissioner",
        cancelledCount: prevTrades.filter((t) => t.status === "pending").length,
        timestamp: now,
      };

      return {
        tradeProposals: nextTrades,
        leagueLog: [entry, ...prevLog],
      };
    });

    return;
  }

  // No fallback. In Phase 1, if commitLeagueUpdate is missing, we do nothing.
};


  // ----------------------------
  // Auctions admin
  // ----------------------------
  const clearAllBids = () => {
  const ok = window.confirm("Clear ALL auction bids? This cannot be undone.");
  if (!ok) return;

  if (typeof commitLeagueUpdate !== "function") {
    window.alert("Clear bids is unavailable (commitLeagueUpdate missing).");
    return;
  }

  commitLeagueUpdate("commClearAllBids", (prev) => {
    const now = Date.now();
    const prevLog = Array.isArray(prev?.leagueLog) ? prev.leagueLog : [];

    const entry = {
      id: nowId(),
      type: "commClearAllBids",
      by: "Commissioner",
      clearedCount: Array.isArray(prev?.freeAgents) ? prev.freeAgents.length : 0,
      timestamp: now,
    };

    return {
      freeAgents: [],
      leagueLog: [entry, ...prevLog],
    };
  });
};


  // ----------------------------
  // UI
  // ----------------------------
  const panelStyle = {
    background: "#071023",
    border: "1px solid #1e293b",
    borderRadius: "10px",
    padding: "14px 16px",
    marginBottom: "14px",
  };

  const sectionTitle = {
    margin: "0 0 10px 0",
    fontSize: "1.0rem",
    color: "#e2e8f0",
  };

  const smallLabel = { fontSize: "0.8rem", color: "#94a3b8" };

  const buttonStyle = {
    padding: "6px 10px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#0b1220",
    color: "#e2e8f0",
    cursor: "pointer",
  };

  const dangerButton = {
    ...buttonStyle,
    border: "1px solid #7f1d1d",
    background: "#2a0f12",
    color: "#fecaca",
  };

  const inputStyle = {
    padding: "6px 10px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#020617",
    color: "#e2e8f0",
    width: "100%",
  };

  const rowGrid = {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.6fr 0.4fr 0.2fr",
    gap: "8px",
    alignItems: "center",
    marginBottom: "8px",
  };

  const buyoutGrid = {
    display: "grid",
    gridTemplateColumns: "1.3fr 0.5fr 0.2fr",
    gap: "8px",
    alignItems: "center",
    marginBottom: "8px",
  };

  const retentionGrid = {
    display: "grid",
    gridTemplateColumns: "1.0fr 0.5fr 1.0fr 0.2fr",
    gap: "8px",
    alignItems: "center",
    marginBottom: "8px",
  };

  const pendingTrades = (tradeProposals || []).filter((t) => t.status === "pending");

  if (!isCommish) return null;

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center" }}>
        <h2 style={{ margin: 0, color: "#ff4d4f" }}>Commissioner Panel</h2>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={smallLabel}>League frozen:</span>
          <button
            style={effectiveFrozen ? dangerButton : buttonStyle}
            onClick={() => setFrozen(!effectiveFrozen)}
            disabled={busy}
            title="Freeze prevents managers from making changes (we’ll wire enforcement next)."
          >
            {effectiveFrozen ? "Unfreeze" : "Freeze"}
          </button>
        </div>
      </div>

      {adminMessage && (
        <div style={{ marginTop: "10px", padding: "10px", borderRadius: "8px", border: "1px solid #334155", color: "#cbd5e1" }}>
          {adminMessage}
        </div>
      )}

      {/* SNAPSHOTS */}
      <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #1e293b" }}>
        <h3 style={sectionTitle}>Snapshots</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <button style={buttonStyle} onClick={loadSnapshots} disabled={snapshotsLoading || busy}>
            {snapshotsLoading ? "Loading…" : "Refresh list"}
          </button>

          <div style={{ minWidth: "260px" }}>
            <select
              style={inputStyle}
              value={selectedSnapshotId}
              onChange={(e) => setSelectedSnapshotId(e.target.value)}
            >
              <option value="">Select a snapshot…</option>
              {(snapshots || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} ({new Date(s.createdAt).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <button
            style={dangerButton}
            onClick={() => restoreSnapshot(selectedSnapshotId)}
            disabled={!selectedSnapshotId || busy}
            title="Restores the snapshot on the backend. All clients update via WebSocket."
          >
            Restore snapshot
          </button>
        </div>

        <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr auto", gap: "10px", alignItems: "center" }}>
          <input
            style={inputStyle}
            value={newSnapshotName}
            onChange={(e) => setNewSnapshotName(e.target.value)}
            placeholder="Optional snapshot name (e.g. 'Post-testing cleanup')"
          />
          <button style={buttonStyle} onClick={createSnapshot} disabled={busy} title="Requires backend endpoint /api/snapshots/create">
            Create snapshot now
          </button>
        </div>

        <p style={{ ...smallLabel, marginTop: "8px" }}>
          Auto-weekly snapshots are a backend feature. We’ll add them after manual snapshots work.
        </p>
      </div>


      {/* FULL ROSTER EDITOR */}
      <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #1e293b" }}>
        <h3 style={sectionTitle}>Roster Editor</h3>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ minWidth: "240px" }}>
            <select style={inputStyle} value={editTeamName} onChange={(e) => setEditTeamName(e.target.value)}>
              {(teams || []).map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <button style={buttonStyle} onClick={applyRosterEdits} disabled={busy}>
            Apply edits to {editTeamName}
          </button>

          <button
            style={buttonStyle}
            onClick={() => setEditRoster((prev) => sortRosterDefault(prev))}
            disabled={busy}
            title="Sort roster: F first then D, by salary desc."
          >
            Re-sort roster
          </button>
        </div>

        {/* Roster table */}
        <div style={{ marginTop: "12px" }}>
          <div style={{ ...smallLabel, marginBottom: "6px" }}>Players</div>

          <div style={{ ...rowGrid, ...smallLabel }}>
            <div>Name</div>
            <div>Salary</div>
            <div>Pos</div>
            <div></div>
          </div>

          {(editRoster || []).map((p, idx) => (
  <div key={p._rowId || idx} style={rowGrid}>

              <input
                style={inputStyle}
                value={p.name}
                onChange={(e) =>
                  setEditRoster((prev) => {
                    const next = [...prev];
                    next[idx] = { ...next[idx], name: e.target.value };
                    return next;
                  })
                }
                placeholder="Player name"
              />
              <input
                style={inputStyle}
                type="number"
                value={p.salary}
                onChange={(e) =>
                  setEditRoster((prev) => {
                    const next = [...prev];
                    next[idx] = { ...next[idx], salary: safeNumber(e.target.value, 0) };
                    return next;
                  })
                }
              />
              <select
                style={inputStyle}
                value={p.position}
                onChange={(e) =>
                  setEditRoster((prev) => {
                    const next = [...prev];
                    next[idx] = { ...next[idx], position: e.target.value === "D" ? "D" : "F" };
                    return next;
                  })
                }
              >
                <option value="F">F</option>
                <option value="D">D</option>
              </select>
              <button
                style={dangerButton}
                onClick={() => setEditRoster((prev) => prev.filter((_, i) => i !== idx))}
                disabled={busy}
                title="Remove row"
              >
                ✕
              </button>
            </div>
          ))}

          <button style={{ ...buttonStyle, marginTop: "8px" }} onClick={addRosterRow} disabled={busy}>
            + Add player
          </button>
        </div>

        {/* Buyouts */}
        <div style={{ marginTop: "14px" }}>
          <div style={{ ...smallLabel, marginBottom: "6px" }}>Buyouts</div>

          <div style={{ ...buyoutGrid, ...smallLabel }}>
            <div>Player</div>
            <div>Penalty</div>
            <div></div>
          </div>

          {(editBuyouts || []).map((b, idx) => (
  <div key={b._rowId || idx} style={buyoutGrid}>

              <input
                style={inputStyle}
                value={b.player}
                onChange={(e) =>
                  setEditBuyouts((prev) => {
                    const next = [...prev];
                    next[idx] = { ...next[idx], player: e.target.value };
                    return next;
                  })
                }
                placeholder="Player"
              />
              <input
                style={inputStyle}
                type="number"
                value={b.penalty}
                onChange={(e) =>
                  setEditBuyouts((prev) => {
                    const next = [...prev];
                    next[idx] = { ...next[idx], penalty: safeNumber(e.target.value, 0) };
                    return next;
                  })
                }
              />
              <button
                style={dangerButton}
                onClick={() => setEditBuyouts((prev) => prev.filter((_, i) => i !== idx))}
                disabled={busy}
              >
                ✕
              </button>
            </div>
          ))}

          <button style={{ ...buttonStyle, marginTop: "8px" }} onClick={addBuyoutRow} disabled={busy}>
            + Add buyout
          </button>
        </div>

        {/* Retentions */}
        <div style={{ marginTop: "14px" }}>
          <div style={{ ...smallLabel, marginBottom: "6px" }}>Retained Salaries</div>

          <div style={{ ...retentionGrid, ...smallLabel }}>
            <div>Player</div>
            <div>Amount</div>
            <div>Note</div>
            <div></div>
          </div>

         {(editRetained || []).map((r, idx) => (
  <div key={r._rowId || idx} style={retentionGrid}>

              <input
                style={inputStyle}
                value={r.player}
                onChange={(e) =>
                  setEditRetained((prev) => {
                    const next = [...prev];
                    next[idx] = { ...next[idx], player: e.target.value };
                    return next;
                  })
                }
                placeholder="Player"
              />
              <input
                style={inputStyle}
                type="number"
                value={r.amount}
                onChange={(e) =>
                  setEditRetained((prev) => {
                    const next = [...prev];
                    next[idx] = { ...next[idx], amount: safeNumber(e.target.value, 0) };
                    return next;
                  })
                }
              />
              <input
                style={inputStyle}
                value={r.note}
                onChange={(e) =>
                  setEditRetained((prev) => {
                    const next = [...prev];
                    next[idx] = { ...next[idx], note: e.target.value };
                    return next;
                  })
                }
                placeholder="e.g. retained from Pacino / deadline / etc."
              />
              <button
                style={dangerButton}
                onClick={() => setEditRetained((prev) => prev.filter((_, i) => i !== idx))}
                disabled={busy}
              >
                ✕
              </button>
            </div>
          ))}

          <button style={{ ...buttonStyle, marginTop: "8px" }} onClick={addRetentionRow} disabled={busy}>
            + Add retained salary
          </button>
        </div>
      </div>

      {/* TRADES ADMIN */}
      <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #1e293b" }}>
        <h3 style={sectionTitle}>Trades Admin</h3>

        <div style={smallLabel}>Pending trades: {pendingTrades.length}</div>

        {(pendingTrades || []).length === 0 ? (
          <div style={{ ...smallLabel, marginTop: "8px" }}>No pending trades.</div>
        ) : (
          <div style={{ marginTop: "10px", display: "grid", gap: "8px" }}>
            {pendingTrades.map((tr) => (
              <div
                key={tr.id}
                style={{
                  border: "1px solid #334155",
                  borderRadius: "10px",
                  padding: "10px",
                  background: "#020617",
                }}
              >
                <div style={{ color: "#e2e8f0", fontSize: "0.9rem" }}>
                  <strong>{tr.fromTeam}</strong> → <strong>{tr.toTeam}</strong>
                </div>
                <div style={smallLabel}>
                  Offers: {(tr.offeredPlayers || []).join(", ") || "—"} | Requests:{" "}
                  {(tr.requestedPlayers || []).join(", ") || "—"}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                  <button style={dangerButton} onClick={() => forceCancelTrade(tr.id)} disabled={busy}>
                    Force-cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AUCTIONS ADMIN */}
      <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #1e293b" }}>
        <h3 style={sectionTitle}>Auctions Admin</h3>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button style={buttonStyle} onClick={onResolveAuctions} disabled={busy}>
            Resolve auctions now
          </button>
          <button style={dangerButton} onClick={clearAllBids} disabled={busy}>
            Clear all bids
          </button>
           <button
    style={dangerButton}
    onClick={() => onCleanupDeleteLogs?.()}
    disabled={busy}
    title="Removes old meta log entries created by the previous delete-log bug"
  >
    Cleanup old delete-logs
  </button>
        </div>

        <div style={{ marginTop: "10px" }}>
          <div style={smallLabel}>Current bids: {(freeAgents || []).length}</div>

          {(freeAgents || []).length === 0 ? (
            <div style={{ ...smallLabel, marginTop: "6px" }}>No active bids.</div>
          ) : (
            <div style={{ marginTop: "8px", display: "grid", gap: "6px" }}>
              {(freeAgents || []).slice(0, 50).map((b) => (
                <div
                  key={b.id}
                  style={{
                    border: "1px solid #334155",
                    borderRadius: "10px",
                    padding: "8px 10px",
                    background: "#020617",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                 <div
  style={{ color: "#e2e8f0" }}
  title={`Bid: $${b.amount} • Team: ${b.team || "—"}`}
>
  <strong>{b.player}</strong>
  {b.position ? ` (${b.position})` : ""}

  <span style={{ marginLeft: "8px", color: "#94a3b8", fontSize: "0.8rem" }}>
    (hover for bid + team)
  </span>
</div>

                  <button
                    style={dangerButton}
                    onClick={() => onCommissionerRemoveBid?.(b.id)}
                    disabled={busy}
                    title="Remove this bid"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {(freeAgents || []).length > 50 && (
                <div style={smallLabel}>Showing first 50 bids…</div>
              )}
            </div>
          )}
        </div>
      </div>
{/* LOGIN HISTORY */}
<div
  style={{
    marginTop: "14px",
    paddingTop: "14px",
    borderTop: "1px solid #1e293b",
  }}
>
  <h3 style={sectionTitle}>Manager Login History</h3>

  {loginHistory.length === 0 ? (
    <div style={smallLabel}>No manager logins recorded yet.</div>
  ) : (
    <div style={{ display: "grid", gap: "6px", marginTop: "8px" }}>
{loginHistory.map((e) => (
        <div
          key={e.teamName}
          style={{
            border: "1px solid #334155",
            borderRadius: "8px",
            padding: "6px 10px",
            background: "#020617",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.85rem",
          }}
        >
          <span style={{ color: "#e2e8f0" }}>
            <strong>{e.teamName}</strong> logged in
          </span>
          <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>
            {e.timestamp ? new Date(e.timestamp).toLocaleString() : "—"}
          </span>
        </div>
      ))}
    </div>
  )}
</div>

    </div>
  );
}
