// src/components/CommissionerPanel.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * CommissionerPanel (Phase 2 + Roster Editor stability + strict DB gating)
 *
 * What this version fixes (per your scope):
 * A) Editor stability: Add Player / Add Buyout / Add Retention no longer disappears.
 *    - Local edits are not clobbered by re-init effects.
 * B) Apply gating: "Apply edits…" is disabled unless ALL filled rows are DB-backed (id:#### / valid).
 * C) Simplify buyouts/retained: editor does NOT attempt to render legacy buyouts/retained.
 *    - You can explicitly overwrite (wipe/replace) buyouts/retained via checkboxes (safety-first).
 * D) Safety-first: never reseeds; never writes empty/default league state; only patches the chosen team.
 *
 * Expected props (same as your current wiring):
 * - currentUser, apiUrl
 * - teams, tradeProposals, freeAgents, leagueLog, tradeBlock
 * - onResolveAuctions, onCommissionerRemoveBid
 * - leagueSettings
 * - commitLeagueUpdate
 * - onCleanupDeleteLogs (optional)
 * - playerApi (optional but recommended):
 *    playerApi.byId (Map or object)
 *    playerApi.byName (optional)
 *    playerApi.searchPlayers(q, limit) => Promise<array>
 *    playerApi.getPlayerByName(name) (optional)
 */

function safeNumber(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

let __localIdSeq = 1;
function nowId() {
  __localIdSeq += 1;
  return `id_${Date.now()}_${__localIdSeq}`;
}

function sortRosterDefault(roster = []) {
  const list = [...(roster || [])];
  const posRank = (p) => (p?.position === "D" ? 1 : 0);
  const sal = (p) => Number(p?.salary) || 0;
  const nameKey = (p) => String(p?.name || "").toLowerCase();

  list.sort((a, b) => {
    const pr = posRank(a) - posRank(b);
    if (pr !== 0) return pr;

    const sd = sal(b) - sal(a);
    if (sd !== 0) return sd;

    return nameKey(a).localeCompare(nameKey(b));
  });

  return list;
}

function getPlayerFromById(byId, pid) {
  if (!byId) return null;

  const idNum = Number(pid);
  if (!Number.isFinite(idNum) || idNum <= 0) return null;

  const kNum = idNum;
  const kStr = String(idNum);

  const candidates = [
    kNum,
    kStr,
    `id:${kStr}`,
    `ID:${kStr}`,
    `player:${kStr}`,
    `playerId:${kStr}`,
    `nhl:${kStr}`,
    `NHL:${kStr}`,
    `pid:${kStr}`,
  ];

  // Map
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

  // Object
  for (const k of candidates) {
    const key = String(k);
    if (byId[key]) return byId[key];
    const lower = key.toLowerCase();
    if (byId[lower]) return byId[lower];
  }

  return byId[kNum] || null;
}

function getCanonicalNameFromDb(playerApi, playerId) {
  const pidNum = Number(playerId);
  if (!Number.isFinite(pidNum) || pidNum <= 0) return "";

  const p = getPlayerFromById(playerApi?.byId, pidNum);
  if (!p) return "";

  const raw =
    p.fullName ??
    p.name ??
    p.full_name ??
    p.displayName ??
    p.display_name ??
    p.playerName ??
    p.player_name ??
    "";

  return String(raw || "").trim();
}

function getIdFromToken(token) {
  const s = String(token || "").trim();
  if (!s) return null;

  if (s.toLowerCase().startsWith("id:")) {
    const n = Number(s.slice(3).trim());
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
  }

  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
}

function normalizeNameKey(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}
function looseNameKey(s) {
  return normalizeNameKey(s).replace(/[.'’\-]/g, "");
}

function mapGetAny(maybeMap, keys) {
  if (!maybeMap) return null;
  try {
    if (typeof maybeMap.get === "function") {
      for (const k of keys) {
        const v = maybeMap.get(k);
        if (v) return v;
      }
      return null;
    }
    for (const k of keys) {
      const kk = String(k);
      if (maybeMap[kk]) return maybeMap[kk];
    }
    return null;
  } catch {
    return null;
  }
}

function getCanonicalLabelForToken(token, playerApi) {
  const raw = String(token || "").trim();
  if (!raw) return "";

  const pid = getIdFromToken(raw);
  if (pid) {
    const canon = getCanonicalNameFromDb(playerApi, pid);
    return canon || "Unknown player";
  }

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

  const byNameHit = mapGetAny(playerApi?.byName, [exact, norm, loose]);
  if (byNameHit) return String(byNameHit.fullName || byNameHit.name || raw).trim();

  return raw;
}

function normalizeAllRosterNamesFromDb({ teams, playerApi }) {
  const inputTeams = Array.isArray(teams) ? teams : [];
  let changed = 0;

  const nextTeams = inputTeams.map((t) => {
    const roster = Array.isArray(t?.roster) ? t.roster : [];
    let rosterChanged = false;

    const nextRoster = roster.map((p) => {
      const pid = Number(p?.playerId);
      if (!Number.isFinite(pid) || pid <= 0) return p;

      const canon = getCanonicalNameFromDb(playerApi, pid);
      if (!canon) return p;

      const cur = String(p?.name || "").trim();
      if (cur === canon) return p;

      rosterChanged = true;
      changed += 1;
      return { ...p, name: canon };
    });

    if (!rosterChanged) return t;
    return { ...t, roster: nextRoster };
  });

  return { nextTeams, changed };
}

function hasAnyMeaningfulRosterInput(row) {
  const q = String(row?.query || "").trim();
  const pid = Number(row?.playerId);
  const salary = safeNumber(row?.salary, 0);
  const pos = String(row?.position || "").trim();
  // If they typed a query, picked a playerId, changed salary above 0, or have a position set.
  // (position defaults to "F" in our UI; so salary/query/playerId do most of the detection)
  return !!q || (Number.isFinite(pid) && pid > 0) || salary > 0 || (pos === "F" || pos === "D");
}

function isValidDbPlayerId(playerApi, pid) {
  const n = Number(pid);
  if (!Number.isFinite(n) || n <= 0) return false;
  return !!getPlayerFromById(playerApi?.byId, n);
}

// -----------------------------
// Matchups schedule editor helpers
// -----------------------------
function pad2(n) {
  return String(n).padStart(2, "0");
}

// For <input type="datetime-local"> which uses local timezone
function msToLocalInput(ms) {
  if (ms == null) return "";
  const d = new Date(Number(ms));
  if (!Number.isFinite(d.getTime())) return "";
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

function localInputToMs(s) {
  const v = String(s || "").trim();
  if (!v) return null;
  const d = new Date(v); // local time
  const ms = d.getTime();
  return Number.isFinite(ms) ? ms : null;
}

function fmtLocal(ms) {
  if (ms == null) return "—";
  const d = new Date(Number(ms));
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString();
}

// round ms to minute boundary (helps avoid “off by a few ms” ugliness)
function roundToMinute(ms) {
  if (!Number.isFinite(ms)) return ms;
  return Math.round(ms / 60000) * 60000;
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

  playerApi,
}) {
  const isCommish = currentUser?.role === "commissioner";

  // -----------------------------------------
  // Styles
  // -----------------------------------------
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

  const disabledButton = {
    ...buttonStyle,
    opacity: 0.55,
    cursor: "not-allowed",
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
    gridTemplateColumns: "1.2fr 0.6fr 0.6fr 0.4fr 0.2fr",
    gap: "8px",
    alignItems: "center",
    marginBottom: "8px",
  };

  const buyoutGrid = {
    display: "grid",
    gridTemplateColumns: "1.3fr 0.5fr 0.2fr",
    gap: "8px",
    alignItems: "start",
    marginBottom: "8px",
  };

  const retentionGrid = {
    display: "grid",
    gridTemplateColumns: "1.0fr 0.5fr 1.0fr 0.2fr",
    gap: "8px",
    alignItems: "start",
    marginBottom: "8px",
  };

  // -----------------------------------------
  // Derived API base
  // -----------------------------------------
  const apiBase = useMemo(() => {
    if (!apiUrl) return "";
    return apiUrl.replace(/\/api\/league\/?$/, "");
  }, [apiUrl]);

  // -----------------------------------------
  // Busy + messaging
  // -----------------------------------------
  const [busy, setBusy] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");

  // -----------------------------------------
  // Player DB tick (forces re-render while playerApi.byId is being populated)
  // -----------------------------------------
  const [playerApiTick, setPlayerApiTick] = useState(0);

  useEffect(() => {
    if (!playerApi?.byId) return;

    const id = window.setInterval(() => {
      setPlayerApiTick((t) => t + 1);
    }, 500);

    return () => window.clearInterval(id);
  }, [playerApi]);

  // -----------------------------------------
  // Freeze toggle
  // -----------------------------------------
  const frozen = Boolean(leagueSettings?.frozen);
  const setFrozen = (nextFrozen) => {
    const nextVal = Boolean(nextFrozen);

    if (nextVal) {
      const ok = window.confirm("Freeze the league? Managers will be blocked from making changes.");
      if (!ok) return;
    }

    if (typeof commitLeagueUpdate !== "function") {
      window.alert("Freeze toggle unavailable (commitLeagueUpdate missing).");
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
        leagueLog: [entry, ...(Array.isArray(prev?.leagueLog) ? prev.leagueLog : [])],
      };
    });
  };

  // -----------------------------------------
  // Snapshots (backend endpoints)
  // -----------------------------------------
  const [snapshots, setSnapshots] = useState([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState("");
  const [newSnapshotName, setNewSnapshotName] = useState("");
  // -----------------------------------------
  // Matchups — schedule editor (Session 2.5)
  // -----------------------------------------
  const [schedLoading, setSchedLoading] = useState(false);
  const [schedError, setSchedError] = useState("");
  const [matchupsState, setMatchupsState] = useState(null); // raw matchups from /api/league

  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);

  // local editable draft for the selected week
  const [weekDraft, setWeekDraft] = useState({
    weekStartLocal: "",
    weekEndLocal: "",
    lockLocal: "",
  });

  const loadMatchupsSchedule = async () => {
    if (!apiBase) return;
    setSchedLoading(true);
    setSchedError("");
    try {
      const res = await fetch(`${apiBase}/api/league`);
      const st = await res.json().catch(() => ({}));
      const m = st?.matchups || null;

      const weeks = Array.isArray(m?.scheduleWeeks) ? m.scheduleWeeks : [];
      if (!weeks.length) {
        setMatchupsState(m || { scheduleWeeks: [] });
        setSchedError("No scheduleWeeks found yet. Generate the schedule on the backend first.");
        return;
      }

      setMatchupsState(m);

      // choose "next week" by default (or currentWeekIndex if that’s all you have)
      const now = Date.now();
      const firstFutureIdx = weeks.findIndex((w) => Number(w?.weekStartAtMs) > now);
      const idx = firstFutureIdx >= 0 ? firstFutureIdx : Math.max(0, Number(m?.currentWeekIndex) || 0);

      setSelectedWeekIndex(idx);
    } catch (e) {
      console.error("[MATCHUPS] load schedule failed:", e);
      setSchedError(e?.message || "Failed to load schedule.");
    } finally {
      setSchedLoading(false);
    }
  };

  useEffect(() => {
    loadMatchupsSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

    const scheduleWeeks = useMemo(() => {
    return Array.isArray(matchupsState?.scheduleWeeks) ? matchupsState.scheduleWeeks : [];
  }, [matchupsState]);

  const selectedWeek = useMemo(() => {
    if (!scheduleWeeks.length) return null;
    const idx = Math.max(0, Math.min(scheduleWeeks.length - 1, Number(selectedWeekIndex) || 0));
    return scheduleWeeks[idx] || null;
  }, [scheduleWeeks, selectedWeekIndex]);

  const isSelectedWeekFuture = useMemo(() => {
    if (!selectedWeek) return false;
    return Number(selectedWeek.weekStartAtMs) > Date.now();
  }, [selectedWeek]);

  // When you change the selected week, re-init the draft inputs from that week
  useEffect(() => {
    if (!selectedWeek) return;

    setWeekDraft({
      weekStartLocal: msToLocalInput(selectedWeek.weekStartAtMs),
      weekEndLocal: msToLocalInput(selectedWeek.weekEndAtMs),
      lockLocal: msToLocalInput(selectedWeek.lockAtMs),
    });
  }, [selectedWeek?.weekId]); // key off weekId so it re-inits cleanly

  const loadSnapshots = async () => {
    if (!apiBase) return;
    setSnapshotsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/snapshots`);
      const data = await res.json().catch(() => ({}));
      const list = Array.isArray(data?.snapshots) ? data.snapshots : [];
      setSnapshots(list);
      if (list.length && !selectedSnapshotId) setSelectedSnapshotId(list[0].id);
    } catch (e) {
      console.error("[SNAPSHOTS] load failed:", e);
      setAdminMessage("Failed to load snapshots.");
    } finally {
      setSnapshotsLoading(false);
    }
  };

  useEffect(() => {
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

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);

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
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);

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
      setAdminMessage(`Snapshot create failed. ${e.message || ""}`.trim());
    } finally {
      setBusy(false);
    }
  };

    const saveSelectedWeek = async () => {
    if (!apiBase) return;
    if (!selectedWeek) return;

    if (!isSelectedWeekFuture) {
      window.alert("Safety: only future weeks can be edited.");
      return;
    }

    // Parse draft → ms
    const startMsRaw = localInputToMs(weekDraft.weekStartLocal);
    const endMsRaw = localInputToMs(weekDraft.weekEndLocal);
    const lockMsRaw = localInputToMs(weekDraft.lockLocal);

    if (!startMsRaw || !endMsRaw || !lockMsRaw) {
      window.alert("Please fill Week start, Week end, and Roster lock.");
      return;
    }

    const weekStartAtMs = roundToMinute(startMsRaw);
    const weekEndAtMs = roundToMinute(endMsRaw);
    const lockAtMs = roundToMinute(lockMsRaw);
    const baselineAtMs = weekStartAtMs + 60 * 60 * 1000;


    if (!(weekEndAtMs > weekStartAtMs)) {
      window.alert("Week end must be after week start.");
      return;
    }

    // Option A: rollover should equal NEXT week start (no overlap)
    const nextWeek = scheduleWeeks[(Number(selectedWeekIndex) || 0) + 1] || null;
    if (!nextWeek) {
      window.alert("Cannot save: this is the last scheduled week (no next week for rollover alignment).");
      return;
    }

    const rolloverAtMs = Number(nextWeek.weekStartAtMs);

    const ok = window.confirm(
      `Save changes to ${selectedWeek.weekId}?\n\n` +
        `Start: ${fmtLocal(weekStartAtMs)}\n` +
        `Lock: ${fmtLocal(lockAtMs)}\n` +
        `End: ${fmtLocal(weekEndAtMs)}\n` +
        `Rollover (Option A): ${fmtLocal(rolloverAtMs)}\n\n` +
        `Note: rollover stays pinned to next week start to prevent overlap.`
    );
    if (!ok) return;

    setBusy(true);
    setAdminMessage("");
    setSchedError("");

    try {
      const res = await fetch(`${apiBase}/api/matchups/schedule/updateWeek`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meta: { actorRole: "commissioner" },
          weekIndex: Number(selectedWeek.weekIndex ?? selectedWeekIndex),
          weekStartAtMs,
          weekEndAtMs,
          lockAtMs,
          rolloverAtMs,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      setAdminMessage(`Saved: ${selectedWeek.weekId}`);
      await loadMatchupsSchedule(); // reload schedule from server so UI matches source of truth
    } catch (e) {
      console.error("[MATCHUPS] save failed:", e);
      setSchedError(e?.message || "Save failed.");
      setAdminMessage(`Save failed: ${e?.message || "unknown error"}`);
    } finally {
      setBusy(false);
    }
  };

  // -----------------------------------------
  // Login history
  // -----------------------------------------
  const managerLastLogin = leagueSettings?.managerLastLogin || {};
  const loginHistory = (teams || [])
    .filter((t) => t?.name)
    .map((t) => {
      const entry = managerLastLogin[t.name] || null;
      return { teamName: t.name, timestamp: entry?.timestamp || null };
    })
    .sort((a, b) => a.teamName.localeCompare(b.teamName));

  // -----------------------------------------
  // Phase 2 Migration Tool: backfill missing roster playerId + legacy buyout names
  // -----------------------------------------
  const [legacyRows, setLegacyRows] = useState([]); // missing playerId OR legacy buyout names
  const [queryByKey, setQueryByKey] = useState({});
  const [resultsByKey, setResultsByKey] = useState({});
  const [selectionsByKey, setSelectionsByKey] = useState({});
  const [loadingKey, setLoadingKey] = useState(null);
  const [canonNameByKey, setCanonNameByKey] = useState({}); // checkbox

  // per-row debounce timers (fixes "typing in one cancels another")
  const migrateTimersRef = useRef({});

  const scanLegacyMissingIds = () => {
    const rows = [];

    for (const t of teams || []) {
      const teamName = t?.name || "Unknown Team";

      // roster rows missing playerId
      const roster = Array.isArray(t?.roster) ? t.roster : [];
      for (let i = 0; i < roster.length; i++) {
        const p = roster[i];
        const pid = Number(p?.playerId);
        if (!Number.isFinite(pid) || pid <= 0) {
          const name = String(p?.name || "").trim();
          rows.push({
            type: "rosterMissingId",
            key: `roster__${teamName}__${i}__${name || "unknown"}`,
            teamName,
            rosterIndex: i,
            name,
            salary: safeNumber(p?.salary, 0),
            position: p?.position === "D" ? "D" : "F",
            onIR: !!p?.onIR,
          });
        }
      }

      // buyouts / retained rows with legacy names (NOT id tokens)
      const buyouts = Array.isArray(t?.buyouts) ? t.buyouts : [];
      for (let j = 0; j < buyouts.length; j++) {
        const b = buyouts[j];
        const raw = String(b?.player || "").trim();
        if (!raw) continue;
        if (getIdFromToken(raw)) continue;

        const isRetained = !!b?.retained;

        rows.push({
          type: isRetained ? "retainedLegacyName" : "buyoutLegacyName",
          key: `${isRetained ? "retained" : "buyout"}__${teamName}__${j}__${raw}`,
          teamName,
          buyoutIndex: j,
          name: raw,
          salary: 0,
          position: "",
          onIR: false,
        });
      }
    }

    setLegacyRows(rows);
  };

  const runSearchForKey = async (rowKey, rawQuery) => {
    const q = String(rawQuery || "").trim();
    if (!q) {
      setResultsByKey((prev) => ({ ...prev, [rowKey]: [] }));
      return;
    }
    if (!playerApi?.searchPlayers) {
      window.alert("playerApi.searchPlayers is missing — pass playerApi into CommissionerPanel.");
      return;
    }

    setLoadingKey(rowKey);
    try {
      const res = await playerApi.searchPlayers(q, 12);
      setResultsByKey((prev) => ({ ...prev, [rowKey]: Array.isArray(res) ? res : [] }));
    } catch (e) {
      console.warn("[MIGRATION] search failed:", e);
      setResultsByKey((prev) => ({ ...prev, [rowKey]: [] }));
    } finally {
      setLoadingKey(null);
    }
  };

  const pickResultForRow = (rowKey, playerObj) => {
    if (!playerObj) return;
    setSelectionsByKey((prev) => ({ ...prev, [rowKey]: playerObj }));

    const label = String(playerObj.fullName || playerObj.name || "").trim();
    if (label) setQueryByKey((prev) => ({ ...prev, [rowKey]: label }));

    setResultsByKey((prev) => ({ ...prev, [rowKey]: [] }));
  };

  const toggleCanonName = (rowKey) => {
    setCanonNameByKey((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }));
  };

  const applyLegacyMappings = () => {
    if (typeof commitLeagueUpdate !== "function") {
      window.alert("Apply mappings unavailable (commitLeagueUpdate missing).");
      return;
    }

    const planned = legacyRows
      .map((r) => {
        const sel = selectionsByKey[r.key];
        const id = Number(sel?.id);
        if (!Number.isFinite(id) || id <= 0) return null;
        return {
          ...r,
          selectedId: Math.trunc(id),
          selectedName: String(sel?.fullName || sel?.name || "").trim(),
        };
      })
      .filter(Boolean);

    if (planned.length === 0) {
      window.alert("No mappings selected yet.");
      return;
    }

    const ok = window.confirm(
      `Apply ${planned.length} playerId mappings?\n\nThis only fills missing playerId values and converts legacy buyout names to id:####.`
    );
    if (!ok) return;

    commitLeagueUpdate("commBackfillRosterPlayerIds", (prev) => {
      const prevTeams = Array.isArray(prev?.teams) ? prev.teams : [];

      const nextTeams = prevTeams.map((t) => {
        const teamName = t?.name || "";
        const roster = Array.isArray(t?.roster) ? t.roster : [];
        const buyouts = Array.isArray(t?.buyouts) ? t.buyouts : [];

        const relevant = planned.filter((p) => p.teamName === teamName);
        if (relevant.length === 0) return t;

        // roster updates
        const nextRoster = roster.map((p, idx) => {
          const hit = relevant.find((x) => x.type === "rosterMissingId" && x.rosterIndex === idx);
          if (!hit) return p;

          const existingPid = Number(p?.playerId);
          if (Number.isFinite(existingPid) && existingPid > 0) return p;

          const patch = { ...p, playerId: hit.selectedId };
          if (canonNameByKey[hit.key] && hit.selectedName) patch.name = hit.selectedName;
          return patch;
        });

        // buyout/retained updates
        const nextBuyouts = buyouts.map((b, j) => {
          const hit = relevant.find(
            (x) =>
              (x.type === "buyoutLegacyName" || x.type === "retainedLegacyName") && x.buyoutIndex === j
          );
          if (!hit) return b;

          const raw = String(b?.player || "").trim();
          if (!raw) return b;
          if (getIdFromToken(raw)) return b;

          return { ...b, player: `id:${hit.selectedId}` };
        });

        return { ...t, roster: nextRoster, buyouts: nextBuyouts };
      });

      const prevLog = Array.isArray(prev?.leagueLog) ? prev.leagueLog : [];
      const entry = {
        id: nowId(),
        type: "commIdBackfill",
        by: "Commissioner",
        count: planned.length,
        timestamp: Date.now(),
      };

      return { teams: nextTeams, leagueLog: [entry, ...prevLog] };
    });

    setAdminMessage("Applied playerId mappings.");
  };

  // -----------------------------------------
  // Normalize names from DB
  // -----------------------------------------
  const normalizeRosterNames = () => {
    if (typeof commitLeagueUpdate !== "function") {
      window.alert("Normalize unavailable (commitLeagueUpdate missing).");
      return;
    }
    if (!playerApi?.byId) {
      window.alert("playerApi.byId missing — cannot normalize names from DB.");
      return;
    }

    const ok = window.confirm(
      "Normalize roster player names from the database for ALL teams?\n\nThis sets roster[].name = canonical DB name whenever playerId is present."
    );
    if (!ok) return;

    commitLeagueUpdate("commNormalizeRosterNames", (prev) => {
      const prevTeams = Array.isArray(prev?.teams) ? prev.teams : [];
      const prevLog = Array.isArray(prev?.leagueLog) ? prev.leagueLog : [];

      const { nextTeams, changed } = normalizeAllRosterNamesFromDb({
        teams: prevTeams,
        playerApi,
      });

      const entry = {
        id: nowId(),
        type: "commNormalizeRosterNames",
        by: "Commissioner",
        changedCount: changed,
        timestamp: Date.now(),
      };

      return { teams: nextTeams, leagueLog: [entry, ...prevLog] };
    });

    setAdminMessage("Normalized roster names from DB.");
  };

  // -----------------------------------------
  // Roster Editor (stable + strict DB gating)
  // -----------------------------------------
  const [editTeamName, setEditTeamName] = useState(teams?.[0]?.name || "");

  const [editRoster, setEditRoster] = useState([]);
  const [editBuyouts, setEditBuyouts] = useState([]);
  const [editRetained, setEditRetained] = useState([]);

  // Editor stability guards
  const [editorDirty, setEditorDirty] = useState(false);
  const editorInitKeyRef = useRef(""); // last initialized teamName

  // Search UI (shared approach) — per-row results, per-row timers
  const [searchResultsByRowId, setSearchResultsByRowId] = useState({});
  const [searchLoadingRowId, setSearchLoadingRowId] = useState(null);

  const rosterTimersRef = useRef({});
  const buyoutTimersRef = useRef({});
  const retainedTimersRef = useRef({});

  // keep editTeamName valid if teams list changes
  useEffect(() => {
    if (!editTeamName && (teams || []).length) setEditTeamName(teams[0].name);
    if (editTeamName && !(teams || []).some((t) => t?.name === editTeamName)) {
      setEditTeamName((teams || [])[0]?.name || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teams]);

  const currentEditTeam = useMemo(() => {
    return (teams || []).find((t) => t?.name === editTeamName) || null;
  }, [teams, editTeamName]);

  // IMPORTANT: Initialize editor rows ONLY when:
  // - switching to a different team (editTeamName changes),
  // - OR the current team changed and the editor is NOT dirty (safe refresh).
  useEffect(() => {
    if (!currentEditTeam) return;

    const initKey = String(currentEditTeam?.name || "");

    // If we already initialized this team AND user has started editing, do not clobber.
    if (editorDirty && editorInitKeyRef.current === initKey) return;

    // If switching team, always initialize (and clear dirty).
    const switchingTeam = editorInitKeyRef.current !== initKey;

    // Initialize roster from live team
    const roster = Array.isArray(currentEditTeam?.roster) ? currentEditTeam.roster : [];
    setEditRoster(
      roster.map((p) => {
        const pid = Number(p?.playerId);
        const hasPid = Number.isFinite(pid) && pid > 0;

        const canon = hasPid ? getCanonicalNameFromDb(playerApi, pid) : "";
        const display = String(canon || p?.name || "").trim();

        return {
          _rowId: nowId(),
          playerId: hasPid ? Math.trunc(pid) : null,
          query: display || "", // input shows this; but user can type to search/replace
          salary: safeNumber(p?.salary, 0),
          position: p?.position === "D" ? "D" : "F",
        };
      })
    );

    // SIMPLIFICATION: do NOT attempt to render existing buyouts/retained in the editor.
    // You can explicitly overwrite (wipe/replace) them using the checkboxes.
    setEditBuyouts([]);
    setEditRetained([]);

    // Clear search UI state
    setSearchResultsByRowId({});
    setSearchLoadingRowId(null);

    // Clear dirty when switching team; keep dirty false on safe refresh
    if (switchingTeam) setEditorDirty(false);

    editorInitKeyRef.current = initKey;
  }, [currentEditTeam, playerApi, editorDirty]);

  // Search helper (shared)
  const runRowSearch = async (rowId, rawQuery) => {
    const q = String(rawQuery || "").trim();
    if (!q) {
      setSearchResultsByRowId((prev) => ({ ...(prev || {}), [rowId]: [] }));
      return;
    }
    if (!playerApi?.searchPlayers) {
      window.alert("playerApi.searchPlayers is missing — cannot search Player DB.");
      return;
    }

    setSearchLoadingRowId(rowId);
    try {
      const res = await playerApi.searchPlayers(q, 10);
      setSearchResultsByRowId((prev) => ({ ...(prev || {}), [rowId]: Array.isArray(res) ? res : [] }));
    } catch (e) {
      console.warn("[ROW SEARCH] failed:", e);
      setSearchResultsByRowId((prev) => ({ ...(prev || {}), [rowId]: [] }));
    } finally {
      setSearchLoadingRowId(null);
    }
  };

  const pickDbPlayerForRosterRow = (rowId, playerObj) => {
    if (!rowId || !playerObj) return;
    const pid = Number(playerObj?.id);
    if (!Number.isFinite(pid) || pid <= 0) return;

    const canon = String(playerObj.fullName || playerObj.name || "").trim();

    setEditRoster((prev) => {
      const next = [...(prev || [])];
      const idx = next.findIndex((r) => r?._rowId === rowId);
      if (idx >= 0) {
        next[idx] = {
          ...next[idx],
          playerId: Math.trunc(pid),
          query: canon || "",
        };
      }
      return next;
    });

    setSearchResultsByRowId((prev) => ({ ...(prev || {}), [rowId]: [] }));
    setEditorDirty(true);
  };

  const pickDbPlayerForBuyoutRow = (rowId, playerObj) => {
    if (!rowId || !playerObj) return;
    const pid = Number(playerObj?.id);
    if (!Number.isFinite(pid) || pid <= 0) return;

    const canon = String(playerObj.fullName || playerObj.name || "").trim();

    setEditBuyouts((prev) => {
      const next = [...(prev || [])];
      const idx = next.findIndex((r) => r?._rowId === rowId);
      if (idx >= 0) {
        next[idx] = {
          ...next[idx],
          player: `id:${Math.trunc(pid)}`,
          query: canon || "",
        };
      }
      return next;
    });

    setSearchResultsByRowId((prev) => ({ ...(prev || {}), [rowId]: [] }));
    setEditorDirty(true);
  };

  const pickDbPlayerForRetainedRow = (rowId, playerObj) => {
    if (!rowId || !playerObj) return;
    const pid = Number(playerObj?.id);
    if (!Number.isFinite(pid) || pid <= 0) return;

    const canon = String(playerObj.fullName || playerObj.name || "").trim();

    setEditRetained((prev) => {
      const next = [...(prev || [])];
      const idx = next.findIndex((r) => r?._rowId === rowId);
      if (idx >= 0) {
        next[idx] = {
          ...next[idx],
          player: `id:${Math.trunc(pid)}`,
          query: canon || "",
        };
      }
      return next;
    });

    setSearchResultsByRowId((prev) => ({ ...(prev || {}), [rowId]: [] }));
    setEditorDirty(true);
  };

  const addRosterRow = () => {
    setEditRoster((prev) => [
      ...(prev || []),
      {
        _rowId: nowId(),
        playerId: null,
        query: "",
        salary: 0, // IMPORTANT: avoid blocking Apply due to default salary
        position: "F",
      },
    ]);
    setEditorDirty(true);
  };

  const addBuyoutRow = () => {
    setEditBuyouts((prev) => [
      ...(prev || []),
      { _rowId: nowId(), player: "", query: "", penalty: 0 },
    ]);
    setEditorDirty(true);
  };

  const addRetentionRow = () => {
    setEditRetained((prev) => [
      ...(prev || []),
      { _rowId: nowId(), player: "", query: "", amount: 0, note: "" },
    ]);
    setEditorDirty(true);
  };

  // -----------------------------
  // Strict validation + Apply gating
  // -----------------------------
  const validation = useMemo(() => {
    const problems = [];

    // Roster: any "filled" row must have a valid DB playerId that exists in playerApi.byId
    const rosterRows = Array.isArray(editRoster) ? editRoster : [];
    for (let i = 0; i < rosterRows.length; i++) {
      const r = rosterRows[i] || {};
      const isFilled =
        String(r?.query || "").trim() ||
        (Number.isFinite(Number(r?.playerId)) && Number(r.playerId) > 0) ||
        safeNumber(r?.salary, 0) > 0;

      if (!isFilled) continue;

      const pid = Number(r?.playerId);
      if (!Number.isFinite(pid) || pid <= 0) {
        problems.push(`Roster row ${i + 1}: pick a player from the DB`);
        continue;
      }
      if (!isValidDbPlayerId(playerApi, pid)) {
        problems.push(`Roster row ${i + 1}: playerId ${pid} not found in DB`);
        continue;
      }
    }

    // Buyouts: if penalty > 0, must have id:#### token that resolves
    const buyouts = Array.isArray(editBuyouts) ? editBuyouts : [];
    for (let i = 0; i < buyouts.length; i++) {
      const b = buyouts[i] || {};
      const pen = safeNumber(b?.penalty, 0);
      if (pen <= 0) continue;

      const pid = getIdFromToken(b?.player);
      if (!pid) {
        problems.push(`Buyout row ${i + 1}: pick a DB player (required when penalty > 0)`);
        continue;
      }
      if (!isValidDbPlayerId(playerApi, pid)) {
        problems.push(`Buyout row ${i + 1}: player id:${pid} not found in DB`);
        continue;
      }
    }

    // Retained: if amount > 0, must have id:#### token that resolves
    const retained = Array.isArray(editRetained) ? editRetained : [];
    for (let i = 0; i < retained.length; i++) {
      const r = retained[i] || {};
      const amt = safeNumber(r?.amount, 0);
      if (amt <= 0) continue;

      const pid = getIdFromToken(r?.player);
      if (!pid) {
        problems.push(`Retained row ${i + 1}: pick a DB player (required when amount > 0)`);
        continue;
      }
      if (!isValidDbPlayerId(playerApi, pid)) {
        problems.push(`Retained row ${i + 1}: player id:${pid} not found in DB`);
        continue;
      }
    }

    return {
      ok: problems.length === 0,
      problems,
      firstProblem: problems[0] || "",
    };
  }, [editRoster, editBuyouts, editRetained, playerApi, playerApiTick]);

  const applyDisabled = busy || !validation.ok;

  const applyRosterEdits = () => {
    if (typeof commitLeagueUpdate !== "function") {
      window.alert("Roster edits unavailable (commitLeagueUpdate missing).");
      return;
    }
    if (!validation.ok) {
      window.alert(validation.firstProblem || "Fix validation errors before applying.");
      return;
    }

    const liveTeam = (teams || []).find((t) => t?.name === editTeamName) || null;
    if (!liveTeam) {
      window.alert("Selected team not found.");
      return;
    }

    // ---- roster build (strict DB) ----
    const cleanedRoster = (editRoster || [])
      .map((row) => {
        const pid = Number(row?.playerId);
        const salary = safeNumber(row?.salary, 0);

        const isFilled =
          String(row?.query || "").trim() ||
          (Number.isFinite(pid) && pid > 0) ||
          salary > 0;

        if (!isFilled) return null;

        // validation already guarantees this exists
        const canon = getCanonicalNameFromDb(playerApi, pid);
        const savedNameLive =
          (liveTeam?.roster || []).find((p) => Number(p?.playerId) === pid)?.name || "";

        const finalName = String(canon || savedNameLive || "").trim() || "Unknown player";

        return {
          name: finalName,
          playerId: Math.trunc(pid),
          salary: salary,
          position: row?.position === "D" ? "D" : "F",
        };
      })
      .filter(Boolean);

    // ---- buyouts build (strict id token if penalty>0) ----
    const cleanedBuyouts = (editBuyouts || [])
      .map((b) => {
        const pen = Math.max(0, safeNumber(b?.penalty, 0));
        if (pen <= 0) return null;

        const pid = getIdFromToken(b?.player);
        if (!pid) return null;

        return {
          player: `id:${pid}`,
          penalty: pen,
        };
      })
      .filter(Boolean);

    // ---- retained build (strict id token if amount>0) ----
    const cleanedRetained = (editRetained || [])
      .map((r) => {
        const amt = Math.max(0, safeNumber(r?.amount, 0));
        if (amt <= 0) return null;

        const pid = getIdFromToken(r?.player);
        if (!pid) return null;

        return {
          player: `id:${pid}`,
          penalty: amt,
          retained: true,
          note: String(r?.note || "").trim(),
        };
      })
      .filter(Boolean);

        const ok = window.confirm(
      `Apply edits to ${editTeamName}?\n\n` +
        `Roster: ${cleanedRoster.length} players\n` +
        `Buyouts: ${cleanedBuyouts.length} rows\n` +
        `Retained: ${cleanedRetained.length} rows\n\n` +
        `NOTE: This will REPLACE (wipe) existing buyouts/retained for this team.\n\n` +
        `Safety note: nothing else in the league is modified.`
    );


    commitLeagueUpdate("commEditTeam", (prev) => {
      const prevTeams = Array.isArray(prev?.teams) ? prev.teams : [];
      const prevLog = Array.isArray(prev?.leagueLog) ? prev.leagueLog : [];
      const now = Date.now();

      const nextTeams = prevTeams.map((t) => {
        if (t?.name !== editTeamName) return t;

                return {
          ...t,
          roster: sortRosterDefault(cleanedRoster),
          // Phase 2 overhaul behavior: ALWAYS replace buyouts/retained for this team
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

      return { teams: nextTeams, leagueLog: [entry, ...prevLog] };
    });

    setAdminMessage(`Saved edits for ${editTeamName}`);

    // After successful apply, editor is no longer "dirty"
    setEditorDirty(false);
  };

  // -----------------------------------------
  // Trades admin
  // -----------------------------------------
  const pendingTrades = (tradeProposals || []).filter((t) => t?.status === "pending");

  const forceCancelTrade = (tradeId) => {
    if (!tradeId) return;

    const ok = window.confirm("Force-cancel this trade? This cannot be undone.");
    if (!ok) return;

    if (typeof commitLeagueUpdate !== "function") {
      window.alert("Force-cancel unavailable (commitLeagueUpdate missing).");
      return;
    }

    commitLeagueUpdate("commCancelTrade", (prev) => {
      const prevTrades = Array.isArray(prev?.tradeProposals) ? prev.tradeProposals : [];
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

      const entry = { id: nowId(), type: "commCancelTrade", by: "Commissioner", tradeId, timestamp: now };

      return { tradeProposals: nextTrades, leagueLog: [entry, ...prevLog] };
    });
  };

  // -----------------------------------------
  // Auctions admin
  // -----------------------------------------
  const clearAllBids = () => {
    const ok = window.confirm("Clear ALL auction bids? This cannot be undone.");
    if (!ok) return;

    if (typeof commitLeagueUpdate !== "function") {
      window.alert("Clear bids unavailable (commitLeagueUpdate missing).");
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

      return { freeAgents: [], leagueLog: [entry, ...prevLog] };
    });
  };

  // -----------------------------------------
  // Render
  // -----------------------------------------
  if (!isCommish) return null;

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center" }}>
        <h2 style={{ margin: 0, color: "#ff4d4f" }}>Commissioner Panel</h2>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={smallLabel}>League frozen:</span>
          <button
            style={frozen ? dangerButton : buttonStyle}
            onClick={() => setFrozen(!frozen)}
            disabled={busy}
            title="Freeze prevents managers from making changes."
          >
            {frozen ? "Unfreeze" : "Freeze"}
          </button>

          <button
            style={buttonStyle}
            onClick={normalizeRosterNames}
            disabled={busy || !playerApi?.byId}
            title="Fix typos: sets roster[].name to canonical DB name wherever playerId exists."
          >
            Normalize names from DB
          </button>
        </div>
      </div>

      {adminMessage && (
        <div style={{ marginTop: "10px", padding: "10px", borderRadius: "8px", border: "1px solid #334155", color: "#cbd5e1" }}>
          {adminMessage}
        </div>
      )}

      {/* Snapshots */}
      <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #1e293b" }}>
        <h3 style={sectionTitle}>Snapshots</h3>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <button style={buttonStyle} onClick={loadSnapshots} disabled={snapshotsLoading || busy}>
            {snapshotsLoading ? "Loading…" : "Refresh list"}
          </button>

          <div style={{ minWidth: "260px" }}>
            <select style={inputStyle} value={selectedSnapshotId} onChange={(e) => setSelectedSnapshotId(e.target.value)}>
              <option value="">Select a snapshot…</option>
              {(snapshots || []).map((s, i) => (
                <option key={`snap:${String(s?.id ?? "noid")}:${i}`} value={s.id}>
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

        <p style={{ ...smallLabel, marginTop: "8px" }}>Auto-weekly snapshots are a backend feature.</p>
      </div>

            {/* Matchups Schedule Editor */}
      <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #1e293b" }}>
        <h3 style={sectionTitle}>Matchups — Schedule Editor</h3>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button style={buttonStyle} onClick={loadMatchupsSchedule} disabled={busy || schedLoading}>
            {schedLoading ? "Loading…" : "Refresh schedule"}
          </button>

          <div style={smallLabel}>
            Weeks: <strong>{scheduleWeeks.length}</strong>
          </div>
        </div>

        {schedError && (
          <div style={{ marginTop: 10, color: "#f59e0b", fontSize: "0.9rem" }}>
            {schedError}
          </div>
        )}

        {!scheduleWeeks.length ? (
          <div style={{ ...smallLabel, marginTop: 10 }}>
            No schedule loaded yet. Generate it on the backend first.
          </div>
        ) : (
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6, maxWidth: 520 }}>
              <div style={smallLabel}>Select week (future edits only)</div>
              <select
                style={inputStyle}
                value={selectedWeekIndex}
                onChange={(e) => setSelectedWeekIndex(Number(e.target.value) || 0)}
              >
                {scheduleWeeks.map((w, i) => {
                  const isFuture = Number(w?.weekStartAtMs) > Date.now();
                  const label =
                    `${w.weekId || `Week ${i + 1}`}` +
                    ` • start ${fmtLocal(w.weekStartAtMs)}` +
                    (isFuture ? "" : " (locked)");
                  return (
                    <option key={w.weekId || i} value={i}>
                      {label}
                    </option>
                  );
                })}
              </select>

              {selectedWeek && (
                <div style={{ marginTop: 6, ...smallLabel }}>
                  Current:
                  {" "}
                  <strong>{selectedWeek.weekId}</strong>
                  {" "}
                  | Start {fmtLocal(selectedWeek.weekStartAtMs)}
                  {" "}
                  | End {fmtLocal(selectedWeek.weekEndAtMs)}
                  {" "}
                  | Lock {fmtLocal(selectedWeek.lockAtMs)}
                  {" "}
                  | Rollover {fmtLocal(selectedWeek.rolloverAtMs)}
                </div>
              )}

              {!isSelectedWeekFuture && (
                <div style={{ marginTop: 6, color: "#f59e0b", fontSize: "0.85rem" }}>
                  Safety: past/current weeks are not editable in the UI.
                </div>
              )}
            </div>

            {/* Editable inputs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, maxWidth: 520 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={smallLabel}>Week start (PT)</div>
                <input
                  style={inputStyle}
                  type="datetime-local"
                  value={weekDraft.weekStartLocal}
                  onChange={(e) => setWeekDraft((d) => ({ ...d, weekStartLocal: e.target.value }))}
                  disabled={busy || !isSelectedWeekFuture}
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={smallLabel}>Roster lock (PT)</div>
                <input
                  style={inputStyle}
                  type="datetime-local"
                  value={weekDraft.lockLocal}
                  onChange={(e) => setWeekDraft((d) => ({ ...d, lockLocal: e.target.value }))}
                  disabled={busy || !isSelectedWeekFuture}
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={smallLabel}>Week end (PT)</div>
                <input
                  style={inputStyle}
                  type="datetime-local"
                  value={weekDraft.weekEndLocal}
                  onChange={(e) => setWeekDraft((d) => ({ ...d, weekEndLocal: e.target.value }))}
                  disabled={busy || !isSelectedWeekFuture}
                />
              </div>

              <div style={{ ...smallLabel, marginTop: 2 }}>
                Option A rules:
                {" "}
                baseline = start + 1h,
                {" "}
                rollover = next week start (prevents overlap).
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  style={!isSelectedWeekFuture || busy ? disabledButton : buttonStyle}
                  onClick={saveSelectedWeek}
                  disabled={!isSelectedWeekFuture || busy}
                >
                  Save week
                </button>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Phase 2: Player ID migration tool */}
      <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #1e293b" }}>
        <h3 style={sectionTitle}>Player ID Migration Tool (temporary)</h3>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <button style={buttonStyle} onClick={scanLegacyMissingIds} disabled={busy}>
            Scan roster + buyouts for legacy names
          </button>

          <button
            style={dangerButton}
            onClick={applyLegacyMappings}
            disabled={busy || legacyRows.length === 0}
            title="Applies the selected mappings to team rosters (fills missing playerId) and buyouts (legacy name -> id:####)."
          >
            Apply selected mappings
          </button>

          <div style={smallLabel}>
            Missing: <strong>{legacyRows.length}</strong>
          </div>
        </div>

        {legacyRows.length === 0 ? (
          <div style={{ ...smallLabel, marginTop: "10px" }}>
            Scan to find roster rows missing <code>playerId</code> (and legacy buyout/retained strings).
          </div>
        ) : (
          <div style={{ marginTop: "12px", display: "grid", gap: "10px" }}>
            {legacyRows.map((r) => {
              const q = queryByKey[r.key] ?? r.name;
              const results = resultsByKey[r.key] || [];
              const selected = selectionsByKey[r.key] || null;

              return (
                <div
                  key={r.key}
                  style={{
                    border: "1px solid #334155",
                    borderRadius: "10px",
                    padding: "10px",
                    background: "#020617",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                    <div style={{ color: "#e2e8f0", fontSize: "0.9rem" }}>
                      <strong>{r.teamName}</strong>: {r.name || "Unknown"} ({r.position}) ${r.salary}
                      {r.onIR ? " (IR)" : ""}
                      {selected ? (
                        <div style={{ marginTop: 4, color: "#22c55e", fontSize: "0.8rem" }}>
                          Selected: {selected.fullName || selected.name} (id:{selected.id})
                        </div>
                      ) : (
                        <div style={{ marginTop: 4, color: "#f59e0b", fontSize: "0.8rem" }}>No selection yet</div>
                      )}
                    </div>

                    <label style={{ ...smallLabel, display: "flex", gap: 6, alignItems: "center" }}>
                      <input type="checkbox" checked={!!canonNameByKey[r.key]} onChange={() => toggleCanonName(r.key)} />
                      Replace name with canonical
                    </label>
                  </div>

                  <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr auto", gap: "10px" }}>
                    <input
                      style={inputStyle}
                      value={q}
                      onChange={(e) => {
                        const next = e.target.value;
                        setQueryByKey((prev) => ({ ...prev, [r.key]: next }));

                        // per-row debounce (NOT global)
                        if (!migrateTimersRef.current) migrateTimersRef.current = {};
                        if (migrateTimersRef.current[r.key]) window.clearTimeout(migrateTimersRef.current[r.key]);
                        migrateTimersRef.current[r.key] = window.setTimeout(() => {
                          runSearchForKey(r.key, next);
                        }, 200);
                      }}
                      placeholder="Search player DB…"
                    />

                    <button style={buttonStyle} onClick={() => runSearchForKey(r.key, q)} disabled={loadingKey === r.key}>
                      {loadingKey === r.key ? "Searching…" : "Search"}
                    </button>
                  </div>

                  {results.length > 0 && (
                    <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                      {results.map((p) => (
                        <button
                          key={String(p.id)}
                          style={{ ...buttonStyle, textAlign: "left", width: "100%", background: "#071023" }}
                          onClick={() => pickResultForRow(r.key, p)}
                        >
                          <strong>{p.fullName || p.name}</strong>{" "}
                          <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>(id:{p.id})</span>
                          <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: 2 }}>
                            {p.position || ""} {p.teamAbbrev ? `• ${p.teamAbbrev}` : ""}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full roster editor */}
      <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #1e293b" }}>
        <h3 style={sectionTitle}>Roster Editor</h3>

        <div style={{ ...smallLabel, marginBottom: 8 }}>
          Player DB loaded:{" "}
          <strong>
            {playerApi?.byId
              ? typeof playerApi.byId.get === "function"
                ? `Map(${playerApi.byId.size})`
                : `Object(${Object.keys(playerApi.byId || {}).length})`
              : "NO"}
          </strong>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ minWidth: "240px" }}>
            <select
              style={inputStyle}
              value={editTeamName}
              onChange={(e) => {
                setEditTeamName(e.target.value);
                // switching team should clear dirty; init effect will handle it
              }}
            >
              {(teams || []).map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <button
            style={applyDisabled ? disabledButton : buttonStyle}
            onClick={applyRosterEdits}
            disabled={applyDisabled}
            title={applyDisabled ? validation.firstProblem || "Fix validation errors." : "Apply edits"}
          >
            Apply edits to {editTeamName}
          </button>

          <button
            style={buttonStyle}
            onClick={() => {
              setEditRoster((prev) => sortRosterDefault(prev));
              setEditorDirty(true);
            }}
            disabled={busy}
            title="Sort roster: F first then D, by salary desc."
          >
            Re-sort roster
          </button>
        </div>

               <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
          <div style={smallLabel}>
            Phase 2 roster editor: buyouts/retained are edited here and will replace whatever is currently saved for this team when you click Apply.
          </div>

          {!validation.ok && (
            <div style={{ color: "#f59e0b", fontSize: "0.85rem" }}>
              Blocked: {validation.firstProblem}
            </div>
          )}
        </div>


        {/* Roster table */}
        <div style={{ marginTop: "12px" }}>
          <div style={{ ...smallLabel, marginBottom: "6px" }}>Players (DB-backed)</div>

          <div style={{ ...rowGrid, ...smallLabel }}>
            <div>Player (search DB)</div>
            <div>Player ID</div>
            <div>Salary</div>
            <div>Pos</div>
            <div></div>
          </div>

          {(editRoster || []).map((p, idx) => {
            const rowId = p?._rowId ?? `roster_${idx}`;
            const q = String(p?.query || "");
            const results = searchResultsByRowId[rowId] || [];
           

            return (
              <div key={`roster:${editTeamName}:${String(rowId)}`} style={rowGrid}>
                {/* Player search */}
                <div style={{ position: "relative", display: "grid", gap: 4 }}>
                  <input
                    style={inputStyle}
                    value={q}
                    onChange={(e) => {
                      const val = e.target.value;

                      setEditRoster((prev) => {
                        const next = [...(prev || [])];
                        next[idx] = { ...next[idx], query: val, playerId: null };
                        return next;
                      });

                      setEditorDirty(true);

                      // per-row debounce
                      if (rosterTimersRef.current[rowId]) window.clearTimeout(rosterTimersRef.current[rowId]);
                      rosterTimersRef.current[rowId] = window.setTimeout(() => {
                        runRowSearch(rowId, val);
                      }, 150);
                    }}
                    placeholder="Type to search Player DB…"
                    disabled={!playerApi?.searchPlayers}
                  />

                  {results.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 80,
                        background: "#020617",
                        border: "1px solid #334155",
                        borderRadius: 10,
                        overflow: "hidden",
                        marginTop: 6,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
                      }}
                    >
                      {results.map((pl) => (
                        <button
                          key={String(pl.id)}
                          type="button"
                          style={{
                            ...buttonStyle,
                            width: "100%",
                            textAlign: "left",
                            border: "none",
                            borderBottom: "1px solid #0f172a",
                            borderRadius: 0,
                            background: "#071023",
                          }}
                          onClick={() => pickDbPlayerForRosterRow(rowId, pl)}
                        >
                          <strong>{pl.fullName || pl.name}</strong>
                          <span style={{ marginLeft: 8, color: "#94a3b8", fontSize: "0.85rem" }}>
                            {pl.position ? `(${pl.position})` : ""}
                            {pl.teamAbbrev ? ` • ${pl.teamAbbrev}` : ""}
                          </span>
                        </button>
                      ))}
                      <div style={{ padding: "6px 10px", ...smallLabel }}>
                        {searchLoadingRowId === rowId ? "Searching…" : "Click a player to select"}
                      </div>
                    </div>
                  )}
                </div>

                {/* Player ID (read-only, DB-selected) */}
                <input style={{ ...inputStyle, opacity: 0.85 }} type="text" value={p.playerId ?? ""} disabled placeholder="DB-picked" />

                {/* Salary */}
                <input
                  style={inputStyle}
                  type="number"
                  value={p.salary}
                  onChange={(e) => {
                    setEditRoster((prev) => {
                      const next = [...(prev || [])];
                      next[idx] = { ...next[idx], salary: safeNumber(e.target.value, 0) };
                      return next;
                    });
                    setEditorDirty(true);
                  }}
                />

                {/* Position */}
                <select
                  style={inputStyle}
                  value={p.position}
                  onChange={(e) => {
                    setEditRoster((prev) => {
                      const next = [...(prev || [])];
                      next[idx] = { ...next[idx], position: e.target.value === "D" ? "D" : "F" };
                      return next;
                    });
                    setEditorDirty(true);
                  }}
                >
                  <option value="F">F</option>
                  <option value="D">D</option>
                </select>

                {/* Delete */}
                <button
                  style={dangerButton}
                  onClick={() => {
                    const rid = rowId;
                    setEditRoster((prev) => (prev || []).filter((r) => (r?._rowId ?? "") !== rid));
                    setSearchResultsByRowId((prev) => {
                      const next = { ...(prev || {}) };
                      delete next[rid];
                      return next;
                    });
                    setEditorDirty(true);
                  }}
                  disabled={busy}
                  title="Remove row"
                >
                  ✕
                </button>
              </div>
            );
          })}

          <button style={{ ...buttonStyle, marginTop: "8px" }} onClick={addRosterRow} disabled={busy}>
            + Add player
          </button>

          <div style={{ ...smallLabel, marginTop: 8 }}>
            Roster rows must be DB-selected. If you add a row, pick a player before Apply (or delete the row).
          </div>
        </div>

        {/* Buyouts */}
        <div style={{ marginTop: "14px" }}>
          <div style={{ ...smallLabel, marginBottom: "6px" }}>Buyouts (DB-backed tokens)</div>

          <div style={{ ...buyoutGrid, ...smallLabel }}>
            <div>Player</div>
            <div>Penalty</div>
            <div></div>
          </div>

          {(editBuyouts || []).map((b, idx) => {
            const rowId = b?._rowId ?? `buyout_${idx}`;
            const q = String(b?.query || "");
            const results = searchResultsByRowId[rowId] || [];
            const resolved = getCanonicalLabelForToken(b?.player, playerApi);

            return (
              <div key={`buyout:${editTeamName}:${String(rowId)}`} style={buyoutGrid}>
                <div style={{ position: "relative", display: "grid", gap: 4 }}>
                  <input
                    style={inputStyle}
                    value={q}
                    onChange={(e) => {
                      const val = e.target.value;

                      setEditBuyouts((prev) => {
                        const next = [...(prev || [])];
                        next[idx] = { ...next[idx], query: val, player: "" };
                        return next;
                      });

                      setEditorDirty(true);

                      // per-row debounce
                      if (buyoutTimersRef.current[rowId]) window.clearTimeout(buyoutTimersRef.current[rowId]);
                      buyoutTimersRef.current[rowId] = window.setTimeout(() => {
                        runRowSearch(rowId, val);
                      }, 150);
                    }}
                    placeholder="Type to search Player DB…"
                    disabled={!playerApi?.searchPlayers}
                  />

                  <div style={{ ...smallLabel, lineHeight: 1.1 }}>{resolved || "—"}</div>

                  {results.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 80,
                        background: "#020617",
                        border: "1px solid #334155",
                        borderRadius: 10,
                        overflow: "hidden",
                        marginTop: 6,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
                      }}
                    >
                      {results.map((pl) => (
                        <button
                          key={String(pl.id)}
                          type="button"
                          style={{
                            ...buttonStyle,
                            width: "100%",
                            textAlign: "left",
                            border: "none",
                            borderBottom: "1px solid #0f172a",
                            borderRadius: 0,
                            background: "#071023",
                          }}
                          onClick={() => pickDbPlayerForBuyoutRow(rowId, pl)}
                        >
                          <strong>{pl.fullName || pl.name}</strong>
                          <span style={{ marginLeft: 8, color: "#94a3b8", fontSize: "0.85rem" }}>
                            {pl.position ? `(${pl.position})` : ""}
                            {pl.teamAbbrev ? ` • ${pl.teamAbbrev}` : ""}
                          </span>
                        </button>
                      ))}
                      <div style={{ padding: "6px 10px", ...smallLabel }}>
                        {searchLoadingRowId === rowId ? "Searching…" : "Click a player to select"}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gap: 4 }}>
                  <input
                    style={inputStyle}
                    type="number"
                    value={b.penalty}
                    onChange={(e) => {
                      setEditBuyouts((prev) => {
                        const next = [...(prev || [])];
                        next[idx] = { ...next[idx], penalty: safeNumber(e.target.value, 0) };
                        return next;
                      });
                      setEditorDirty(true);
                    }}
                  />
                  <div style={{ ...smallLabel, lineHeight: 1.1, visibility: "hidden" }}>.</div>
                </div>

                <button
                  style={dangerButton}
                  onClick={() => {
                    const rid = rowId;
                    setEditBuyouts((prev) => (prev || []).filter((r) => (r?._rowId ?? "") !== rid));
                    setSearchResultsByRowId((prev) => {
                      const next = { ...(prev || {}) };
                      delete next[rid];
                      return next;
                    });
                    setEditorDirty(true);
                  }}
                  disabled={busy}
                >
                  ✕
                </button>
              </div>
            );
          })}

          <button style={{ ...buttonStyle, marginTop: "8px" }} onClick={addBuyoutRow} disabled={busy}>
            + Add buyout
          </button>
        </div>

        {/* Retained Salaries */}
        <div style={{ marginTop: "14px" }}>
          <div style={{ ...smallLabel, marginBottom: "6px" }}>Retained Salaries (DB-backed tokens)</div>

          <div style={{ ...retentionGrid, ...smallLabel }}>
            <div>Player</div>
            <div>Amount</div>
            <div>Note</div>
            <div></div>
          </div>

          {(editRetained || []).map((r, idx) => {
            const rowId = r?._rowId ?? `retained_${idx}`;
            const q = String(r?.query || "");
            const results = searchResultsByRowId[rowId] || [];
            const resolved = getCanonicalLabelForToken(r?.player, playerApi);

            return (
              <div key={`retained:${editTeamName}:${String(rowId)}`} style={retentionGrid}>
                <div style={{ position: "relative", display: "grid", gap: 4 }}>
                  <input
                    style={inputStyle}
                    value={q}
                    onChange={(e) => {
                      const val = e.target.value;

                      setEditRetained((prev) => {
                        const next = [...(prev || [])];
                        next[idx] = { ...next[idx], query: val, player: "" };
                        return next;
                      });

                      setEditorDirty(true);

                      // per-row debounce
                      if (retainedTimersRef.current[rowId]) window.clearTimeout(retainedTimersRef.current[rowId]);
                      retainedTimersRef.current[rowId] = window.setTimeout(() => {
                        runRowSearch(rowId, val);
                      }, 150);
                    }}
                    placeholder="Type to search Player DB…"
                    disabled={!playerApi?.searchPlayers}
                  />

                  <div style={{ ...smallLabel, lineHeight: 1.1 }}>{resolved || "—"}</div>

                  {results.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 80,
                        background: "#020617",
                        border: "1px solid #334155",
                        borderRadius: 10,
                        overflow: "hidden",
                        marginTop: 6,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
                      }}
                    >
                      {results.map((pl) => (
                        <button
                          key={String(pl.id)}
                          type="button"
                          style={{
                            ...buttonStyle,
                            width: "100%",
                            textAlign: "left",
                            border: "none",
                            borderBottom: "1px solid #0f172a",
                            borderRadius: 0,
                            background: "#071023",
                          }}
                          onClick={() => pickDbPlayerForRetainedRow(rowId, pl)}
                        >
                          <strong>{pl.fullName || pl.name}</strong>
                          <span style={{ marginLeft: 8, color: "#94a3b8", fontSize: "0.85rem" }}>
                            {pl.position ? `(${pl.position})` : ""}
                            {pl.teamAbbrev ? ` • ${pl.teamAbbrev}` : ""}
                          </span>
                        </button>
                      ))}
                      <div style={{ padding: "6px 10px", ...smallLabel }}>
                        {searchLoadingRowId === rowId ? "Searching…" : "Click a player to select"}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gap: 4 }}>
                  <input
                    style={inputStyle}
                    type="number"
                    value={r.amount}
                    onChange={(e) => {
                      setEditRetained((prev) => {
                        const next = [...(prev || [])];
                        next[idx] = { ...next[idx], amount: safeNumber(e.target.value, 0) };
                        return next;
                      });
                      setEditorDirty(true);
                    }}
                  />
                  <div style={{ ...smallLabel, lineHeight: 1.1, visibility: "hidden" }}>.</div>
                </div>

                <div style={{ display: "grid", gap: 4 }}>
                  <input
                    style={inputStyle}
                    value={r.note}
                    onChange={(e) => {
                      setEditRetained((prev) => {
                        const next = [...(prev || [])];
                        next[idx] = { ...next[idx], note: e.target.value };
                        return next;
                      });
                      setEditorDirty(true);
                    }}
                    placeholder="e.g. retained from Pacino / deadline / etc."
                  />
                  <div style={{ ...smallLabel, lineHeight: 1.1, visibility: "hidden" }}>.</div>
                </div>

                <button
                  style={dangerButton}
                  onClick={() => {
                    const rid = rowId;
                    setEditRetained((prev) => (prev || []).filter((x) => (x?._rowId ?? "") !== rid));
                    setSearchResultsByRowId((prev) => {
                      const next = { ...(prev || {}) };
                      delete next[rid];
                      return next;
                    });
                    setEditorDirty(true);
                  }}
                  disabled={busy}
                >
                  ✕
                </button>
              </div>
            );
          })}

          <button style={{ ...buttonStyle, marginTop: "8px" }} onClick={addRetentionRow} disabled={busy}>
            + Add retained salary
          </button>
        </div>
      </div>

      {/* Trades admin */}
      <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #1e293b" }}>
        <h3 style={sectionTitle}>Trades Admin</h3>

        <div style={smallLabel}>Pending trades: {pendingTrades.length}</div>

        {pendingTrades.length === 0 ? (
          <div style={{ ...smallLabel, marginTop: "8px" }}>No pending trades.</div>
        ) : (
          <div style={{ marginTop: "10px", display: "grid", gap: "8px" }}>
            {pendingTrades.map((tr, i) => (
              <div
                key={`trade:${String(tr?.id ?? "noid")}:${String(tr?.fromTeam ?? "")}:${String(tr?.toTeam ?? "")}:${i}`}
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
                  Offers: {(tr.offeredPlayers || []).join(", ") || "—"} | Requests: {(tr.requestedPlayers || []).join(", ") || "—"}
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

      {/* Auctions admin */}
      <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #1e293b" }}>
        <h3 style={sectionTitle}>Auctions Admin</h3>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button style={buttonStyle} onClick={onResolveAuctions} disabled={busy}>
            Resolve auctions now
          </button>
          <button style={dangerButton} onClick={clearAllBids} disabled={busy}>
            Clear all bids
          </button>

          {typeof onCleanupDeleteLogs === "function" && (
            <button
              style={dangerButton}
              onClick={() => onCleanupDeleteLogs()}
              disabled={busy}
              title="Removes old meta log entries created by the previous delete-log bug"
            >
              Cleanup old delete-logs
            </button>
          )}
        </div>

        <div style={{ marginTop: "10px" }}>
          <div style={smallLabel}>Current bids: {(freeAgents || []).length}</div>

          {(freeAgents || []).length === 0 ? (
            <div style={{ ...smallLabel, marginTop: "6px" }}>No active bids.</div>
          ) : (
            <div style={{ marginTop: "8px", display: "grid", gap: "6px" }}>
              {(freeAgents || []).slice(0, 50).map((b, i) => (
                <div
                  key={`bid:${String(b?.id ?? "noid")}:${String(b?.team ?? "")}:${String(b?.playerId ?? b?.player ?? "")}:${i}`}
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
                  <div style={{ color: "#e2e8f0" }} title={`Bid: $${b.amount} • Team: ${b.team || "—"}`}>
                    <strong>{getCanonicalLabelForToken(b.playerId ? `id:${b.playerId}` : b.player, playerApi)}</strong>
                    {b.position ? ` (${b.position})` : ""}
                    <span style={{ marginLeft: "8px", color: "#94a3b8", fontSize: "0.8rem" }}>(hover for bid + team)</span>
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
              {(freeAgents || []).length > 50 && <div style={smallLabel}>Showing first 50 bids…</div>}
            </div>
          )}
        </div>
      </div>

      {/* Login history */}
      <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #1e293b" }}>
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
