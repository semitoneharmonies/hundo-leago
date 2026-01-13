// src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { io as socketIOClient } from "socket.io-client";


import TeamRosterPanel from "./components/TeamRosterPanel";
import LeagueHistoryPanel from "./components/LeagueHistoryPanel";
import TeamToolsPanel from "./components/TeamToolsPanel";
import CommissionerPanel from "./components/CommissionerPanel";
import TopBar from "./components/TopBar";
import {
  calculateBuyout,
  buildTradeFromDraft,
  validateTradeDraft,
  acceptTradeById,
  rejectTradeById,
  cancelTradeById,
  cancelTradesForPlayer, 
  placeFreeAgentBid,
  resolveAuctions,
  removeAuctionBidById,
  isTeamIllegal,
} from "./leagueUtils";

// Backend endpoint (Netlify env var first, fallback hard-coded)
const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://hundo-leago-backend.onrender.com/api/league";

  const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "https://hundo-leago-backend.onrender.com";

// League rules
const CAP_LIMIT = 100;
const MAX_ROSTER_SIZE = 15;
const MIN_FORWARDS = 8;
const MIN_DEFENSEMEN = 4;

  // Phase 0 safety: allow disabling autosave from Netlify env var
const DISABLE_AUTOSAVE = import.meta.env.VITE_DISABLE_AUTOSAVE === "true";



// Very simple "login" setup – front-end only
const managers = [
  { teamName: "Pacino Amigo", role: "manager", password: "pacino123" },
  { teamName: "Bottle O Draino", role: "manager", password: "draino123" },
  { teamName: "Imano Lizzo", role: "manager", password: "lizzo123" },
  { teamName: "El Camino", role: "manager", password: "camino123" },
  { teamName: "DeNiro Amigo", role: "manager", password: "deniro123" },
  { teamName: "Champino", role: "manager", password: "champino123" },
  // Commissioner user
  { teamName: "Commissioner", role: "commissioner", password: "commish123" },
];


function App() {

 // --- Phase 0 safety: prevent accidental wipes ---
// "Valid" means: looks like a real league, not an empty/malformed response.
const leagueStateLooksValid = (state) => {
  if (!state) return false;

  const teamsOk =
    Array.isArray(state.teams) &&
    state.teams.length === 6 && // you have 6 teams; strict on purpose for Phase 0
    state.teams.every((t) => typeof t?.name === "string");

  if (!teamsOk) return false;

  // must have at least one rostered player somewhere
  const hasAnyRosteredPlayer = state.teams.some(
    (t) => Array.isArray(t.roster) && t.roster.length > 0
  );
  if (!hasAnyRosteredPlayer) return false;

  return true;
};

const normalizeLoadedLeague = (data) => {
  const cleanLog = Array.isArray(data?.leagueLog)
    ? data.leagueLog.filter((e) => e?.type !== "faBidRemoved")
    : [];

  return {
    teams: Array.isArray(data?.teams) ? data.teams : null,
    tradeProposals: Array.isArray(data?.tradeProposals) ? data.tradeProposals : [],
    freeAgents: Array.isArray(data?.freeAgents) ? data.freeAgents : [],
    leagueLog: cleanLog,
    tradeBlock: Array.isArray(data?.tradeBlock) ? data.tradeBlock : [],
    settings: data?.settings || { frozen: false, managerLoginHistory: [] },
  };
};


  const [leagueSettings, setLeagueSettings] = useState({ frozen: false });
// Phase 0B Option A: show a clear message when writes are blocked (HTTP 423)
const [freezeBanner, setFreezeBanner] = useState("");
const freezeBannerTimerRef = useRef(null);
const showFreezeBanner = (msg = "League is frozen. Changes are disabled.") => {
  setFreezeBanner(msg);

  // auto-clear after a few seconds so it doesn't hang forever
  if (freezeBannerTimerRef.current) clearTimeout(freezeBannerTimerRef.current);
  freezeBannerTimerRef.current = setTimeout(() => {
    setFreezeBanner("");
    freezeBannerTimerRef.current = null;
  }, 8000);
};

  // --- Core league state ---
const [teams, setTeams] = useState([]); // start empty; backend is source of truth

  // Who is logged in?
  const [currentUser, setCurrentUser] = useState(null);

  // Selected team in the dropdown
  const [selectedTeamName, setSelectedTeamName] = useState("");


  // Very simple login form state
  const [loginTeamName, setLoginTeamName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Trade-related state
  const [tradeDraft, setTradeDraft] = useState(null);
  const [tradeProposals, setTradeProposals] = useState([]); // all trades across league
    // Trade block entries (players available, notes, needs)
  const [tradeBlock, setTradeBlock] = useState([]);
const [freeAgents, setFreeAgents] = useState([]); // all auction bids


  // League-wide activity log
  const [leagueLog, setLeagueLog] = useState([]);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [hasLoaded, setHasLoaded] = useState(false);
const saveTimerRef = useRef(null);
const lastSavedJsonRef = useRef("");
const autoCancelLockRef = useRef(false);


// ------------------------------------
// Option B: Single write funnel (Phase 0)
// ------------------------------------
const leagueStateRef = useRef({
  teams: [],
  tradeProposals: [],
  freeAgents: [],
  leagueLog: [],
  tradeBlock: [],
  settings: { frozen: false, managerLoginHistory: [] },
});

// Keep a live snapshot of latest state so commits can compute next state once
useEffect(() => {
  leagueStateRef.current = {
    teams,
    tradeProposals,
    freeAgents,
    leagueLog,
    tradeBlock,
    settings: leagueSettings,
  };
}, [teams, tradeProposals, freeAgents, leagueLog, tradeBlock, leagueSettings]);

/**
 * commitLeagueUpdate
 * - Blocks manager writes when frozen (Option B)
 * - Computes next state once, then applies state setters
 * - Safety: refuses to write invalid league shapes in Phase 0
 *
 * updater(prev) must return either:
 *  - null/undefined => no-op
 *  - { teams?, tradeProposals?, freeAgents?, leagueLog?, tradeBlock?, settings? }
 */
const commitLeagueUpdate = (reason, updater) => {
  // Local freeze gate (fast UX)
  if (typeof guardWriteIfFrozen === "function" && guardWriteIfFrozen()) {
    console.warn("[COMMIT] blocked (frozen):", reason);
    return false;
  }

  const prev = leagueStateRef.current;
  const patch = updater?.(prev);

  if (!patch) {
    console.warn("[COMMIT] no-op:", reason);
    return false;
  }

  const next = {
    ...prev,
    ...patch,
  };

  // Phase 0 shape safety: don’t allow accidental wipes / malformed writes
  if (!leagueStateLooksValid(next)) {
    console.error("[COMMIT] rejected (invalid next state):", reason, next);
    return false;
  }

  // Apply only the keys that changed
  if (patch.teams) setTeams(patch.teams);
  if (patch.tradeProposals) setTradeProposals(patch.tradeProposals);
  if (patch.freeAgents) setFreeAgents(patch.freeAgents);
  if (patch.leagueLog) setLeagueLog(patch.leagueLog);
  if (patch.tradeBlock) setTradeBlock(patch.tradeBlock);
  if (patch.settings) setLeagueSettings(patch.settings);

  return true;
};


// -------------------------
// Auction win sound (manager)
// -------------------------
const winSoundLockRef = useRef(false);

const playAuctionWinSound = async () => {
  if (winSoundLockRef.current) return;
  winSoundLockRef.current = true;
  setTimeout(() => (winSoundLockRef.current = false), 1500);

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();

    // attempt to resume if browser started it suspended
    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }

    const beep = (freq, start, dur, gainVal = 0.05) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.value = gainVal;

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };

    beep(523.25, 0.00, 0.12);
    beep(659.25, 0.13, 0.12);
    beep(783.99, 0.26, 0.18);

    setTimeout(() => ctx.close?.(), 800);
  } catch (e) {
    console.warn("[SOUND] win sound blocked or failed:", e);
  }
};
// ------------------------------------
// Auction win: play sound once per new win
// ------------------------------------
useEffect(() => {
  if (!currentUser || currentUser.role !== "manager") return;

  const teamName = currentUser.teamName;
  if (!teamName) return;

  // Find newest win entry for this manager
  const latestWin = (leagueLog || [])
    .filter((e) => e?.type === "faSigned" && e?.team === teamName)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];

  if (!latestWin?.timestamp) return;

  const key = `hundo_lastHeardAuctionWin_${teamName}`;
  const lastHeard = Number(localStorage.getItem(key) || "0");

  if (latestWin.timestamp > lastHeard) {
    // Mark first, then play (prevents double-play if re-render happens mid-sound)
    localStorage.setItem(key, String(latestWin.timestamp));
    playAuctionWinSound();
  }
}, [currentUser, leagueLog]);

// -------------------------
// Notifications (TopBar bell)
// -------------------------
const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);
const [lastSeenTs, setLastSeenTs] = useState(0);
const illegalFlagRef = useRef(false);


 const socketRef = useRef(null);

useEffect(() => {
  // Prevent double-connect in React Strict Mode dev
  if (socketRef.current) return;

  const socket = socketIOClient(SOCKET_URL, {
    transports: ["websocket"],
  });

  socketRef.current = socket;

  socket.on("connect", () => {
    console.log("[WS] connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    const msg = String(err?.message || "");
    if (import.meta.env.DEV && msg.includes("closed before the connection is established")) {
      // harmless strict-mode hiccup
      return;
    }
    console.warn("[WS] connect_error:", err);
  });

  socket.on("league:updated", () => {
    console.log("[WS] league updated → reloading");
    fetch(API_URL)
      .then((r) => r.json())
      .then((data) => {
        const loadedState = normalizeLoadedLeague(data);

        if (!leagueStateLooksValid(loadedState)) {
          console.error("[WS] Invalid or incomplete league state on reload. Ignoring update.");
          return;
        }

        setTeams(Array.isArray(loadedState.teams) ? loadedState.teams : []);
        setSelectedTeamName((prev) => prev || loadedState.teams?.[0]?.name || "");

        setTradeProposals(loadedState.tradeProposals);
        setFreeAgents(loadedState.freeAgents);
        setLeagueLog(loadedState.leagueLog);
        setTradeBlock(loadedState.tradeBlock);

        setLeagueSettings({
          frozen: false,
          managerLoginHistory: [],
          ...loadedState.settings,
        });

        lastSavedJsonRef.current = JSON.stringify({
          teams: loadedState.teams,
          tradeProposals: loadedState.tradeProposals,
          freeAgents: loadedState.freeAgents,
          leagueLog: loadedState.leagueLog,
          tradeBlock: loadedState.tradeBlock,
          settings: loadedState.settings,
        });
      })
      .catch((err) => console.error("[WS] reload failed:", err));
  });

  socket.on("disconnect", () => {
    console.log("[WS] disconnected");
  });

  return () => {
    socket.disconnect();
    socketRef.current = null;
  };
}, []);



// Load league from backend on first page load
useEffect(() => {
  console.log("[LOAD] Fetching league from backend:", API_URL);

  fetch(API_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      console.log("[LOAD] Backend responded with keys:", Object.keys(data || {}));

      const loadedState = normalizeLoadedLeague(data);

      // CRITICAL: Do NOT enter "loaded" mode unless the response is valid.
      if (!leagueStateLooksValid(loadedState)) {
        console.error(
          "[LOAD] Invalid or incomplete league state from backend. NOT enabling autosave."
        );
        return; // hasLoaded stays false -> autosave never runs
      }

      setTeams(Array.isArray(loadedState.teams) ? loadedState.teams : []);
      // Set a safe default selected team once real data is loaded
setSelectedTeamName((prev) => {
  if (prev) return prev; // keep whatever was already selected (e.g., login restore)
  return loadedState.teams?.[0]?.name || "";
});

      setTradeProposals(loadedState.tradeProposals);
      setFreeAgents(loadedState.freeAgents);
      setLeagueLog(loadedState.leagueLog);
      setTradeBlock(loadedState.tradeBlock);

      setLeagueSettings({
        frozen: false,
        managerLoginHistory: [],
        ...loadedState.settings,
      });

      // IMPORTANT: initialize lastSavedJson so autosave doesn't immediately fire
      lastSavedJsonRef.current = JSON.stringify({
  teams: loadedState.teams,
  tradeProposals: loadedState.tradeProposals,
  freeAgents: loadedState.freeAgents,
  leagueLog: loadedState.leagueLog,
  tradeBlock: loadedState.tradeBlock,
  settings: loadedState.settings,
});


      setHasLoaded(true);
    })
    .catch((err) => {
      console.error("[LOAD] Failed to load league from backend:", err);
      // DO NOT setHasLoaded(true) here
    });
}, []);


// Restore login from localStorage on refresh

useEffect(() => {
  try {
    const raw = localStorage.getItem("hundo_currentUser");
    if (!raw) return;

    const saved = JSON.parse(raw);
    if (!saved || !saved.role) return;

    setCurrentUser(saved);

    if (saved.role === "manager" && saved.teamName) {
      setSelectedTeamName(saved.teamName);
    }
  } catch (e) {
    console.warn("[LOGIN] Failed to restore saved login:", e);
  }
}, []);



// Save current league state to backend
// Returns: true = saved, false = rejected/failed
const saveLeagueToBackend = async (nextState) => {
  try {
    const payload = {
      ...nextState,
      meta: {
        actorRole: currentUser?.role || "unknown",
        actorTeam: currentUser?.teamName || null,
        clientTs: Date.now(),
      },
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.status === 423) {
  // Optional: still log details for debugging
  const text = await res.text().catch(() => "");
  console.warn("[SAVE] Blocked (423 frozen):", text);

  // ✅ Show banner to user (managers only)
  if (currentUser?.role === "manager") {
  showFreezeBanner("League is frozen. Changes are disabled.");
}


  return false; // ✅ rejected
}


    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[SAVE] Failed:", `HTTP ${res.status}`, text);
      return false; // ✅ failed
    }

    // ✅ Successful save clears any prior banner
    if (freezeBanner) setFreezeBanner("");

    return true; // ✅ success
  } catch (err) {
    console.error("[SAVE] Failed to save league to backend:", err);
    return false; // ✅ failed
  }
};




// Auto-save whenever league state changes (after initial load)
useEffect(() => {
  if (!hasLoaded) return;

  // If a save was queued previously, and we now want to bail, cancel it.
  const cancelQueuedSave = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  };

  if (DISABLE_AUTOSAVE) {
    cancelQueuedSave();
    console.warn("[SAVE] Autosave disabled via VITE_DISABLE_AUTOSAVE=true");
    return;
  }

  const stateToSave = {
    teams,
    tradeProposals,
    freeAgents,
    leagueLog,
    tradeBlock,
    settings: leagueSettings,
  };

  if (!leagueStateLooksValid(stateToSave)) {
    cancelQueuedSave();
    console.warn("[SAVE] Skipping save: state does not look valid/seeded yet.");
    return;
  }

  const json = JSON.stringify(stateToSave);

  // If nothing changed since last save, do nothing
  if (json === lastSavedJsonRef.current) return;

  // Debounce: wait a bit after the last change
  if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

  saveTimerRef.current = setTimeout(async () => {
  console.log("[SAVE] Debounced save…");

  const isManager = currentUser?.role === "manager";
  const isFrozen = Boolean(leagueSettings?.frozen);

  // ✅ Don’t even try autosave if frozen (backend will 423 anyway)
  if (isManager && isFrozen) {
    return;
  }

  const ok = await saveLeagueToBackend(stateToSave);

  // Only mark as saved if the backend actually accepted it
  if (ok) {
    lastSavedJsonRef.current = json;
  }
}, 800);




  return () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  };
}, [hasLoaded, teams, tradeProposals, freeAgents, leagueLog, tradeBlock, leagueSettings, DISABLE_AUTOSAVE, currentUser]);

// ------------------------------------
// Notifications: restore last-seen time
// ------------------------------------
useEffect(() => {
  if (!currentUser) return;

  const key =
    currentUser.role === "manager"
      ? `hundo_lastSeenNotif_${currentUser.teamName}`
      : "hundo_lastSeenNotif_commish";

  const raw = localStorage.getItem(key);
  const ts = raw ? Number(raw) : 0;
  setLastSeenTs(Number.isFinite(ts) ? ts : 0);
}, [currentUser]);

// ------------------------------------
// Notifications: compute notification list
// ------------------------------------
useEffect(() => {
  if (!currentUser) {
    setNotifications([]);
    setUnreadCount(0);
    return;
  }

  const myTeamName =
    currentUser.role === "manager" ? currentUser.teamName : null;

  // 1) Incoming trade offers (pending trades addressed to you)
  const tradeReceived = (tradeProposals || [])
    .filter((tr) => tr?.status === "pending")
    .filter((tr) =>
      currentUser.role === "commissioner" ? true : tr.toTeam === myTeamName
    )
    .map((tr) => ({
      id: `trade-received-${tr.id}`,
      timestamp: tr.createdAt || tr.updatedAt || tr.id || 0,
      title: `Trade offer from ${tr.fromTeam}`,
      body: `Offered: ${(tr.offeredPlayers || []).join(", ")}`,
    }));

  // 2) Trades you sent that got accepted
 const tradeAccepted = (leagueLog || [])
  .filter((e) => String(e?.type || "").toLowerCase() === "tradeaccepted")
  .filter((e) =>
    currentUser.role === "commissioner" ? true : e.fromTeam === myTeamName
  )
  .map((e) => ({
    id: `trade-accepted-${e.id}`,
    timestamp: e.timestamp,
    title: `Trade accepted by ${e.toTeam}`,
    body: `You received: ${(e.requestedPlayers || []).join(", ")}`,
  }));


  // 3) Auction wins
  const auctionWins = (leagueLog || [])
    .filter((e) => e?.type === "faSigned")
    .filter((e) =>
      currentUser.role === "commissioner" ? true : e.team === myTeamName
    )
    .map((e) => ({
      id: `auction-${e.id}`,
      timestamp: e.timestamp,
      title: `Auction won: ${e.player}`,
      body: `Signed for $${e.amount}`,
    }));

  // 4) Illegal roster (edge-triggered so it only fires when you become illegal)
  let illegalNotifs = [];
  if (currentUser.role === "manager") {
    const myTeam = teams.find((t) => t.name === myTeamName);

    const illegalNow = myTeam
  ? isTeamIllegal(
      { ...myTeam, roster: (myTeam.roster || []).filter((p) => !p.onIR) },
      {
        capLimit: CAP_LIMIT,
        maxRosterSize: MAX_ROSTER_SIZE,
        minForwards: MIN_FORWARDS,
        minDefensemen: MIN_DEFENSEMEN,
      }
    )
  : false;


    if (illegalNow && !illegalFlagRef.current) {
      illegalNotifs.push({
        id: `illegal-${myTeamName}`,
timestamp: Date.now(),

        title: "Illegal roster",
        body: "Your team violates cap or roster rules.",
      });
    }

    illegalFlagRef.current = illegalNow;
  }

  const combined = [
    ...tradeReceived,
    ...tradeAccepted,
    ...auctionWins,
    ...illegalNotifs,
  ].sort((a, b) => b.timestamp - a.timestamp);

  const withUnread = combined.map((n) => ({
    ...n,
    unread: n.timestamp > lastSeenTs,
  }));

  setNotifications(withUnread);
  setUnreadCount(withUnread.filter((n) => n.unread).length);
}, [currentUser, tradeProposals, leagueLog, teams, lastSeenTs]);

// ------------------------------------
// Notifications: "mark all read"
// ------------------------------------
const markAllNotificationsRead = () => {
  if (!currentUser) return;

  const key =
    currentUser.role === "manager"
      ? `hundo_lastSeenNotif_${currentUser.teamName}`
      : "hundo_lastSeenNotif_commish";

  const now = Date.now();
  localStorage.setItem(key, String(now));
  setLastSeenTs(now);
};

  // --- Helpers ---

  const selectedTeam =
  (Array.isArray(teams) ? teams : []).find((t) => t.name === selectedTeamName) || null;


  const canManageTeam = (teamName) => {
    if (!currentUser) return false;
    if (currentUser.role === "commissioner") return true;
    if (currentUser.role === "manager") {
      return currentUser.teamName === teamName;
    }
    return false;
  };
const isManagerFrozen =
  leagueSettings?.frozen === true && currentUser?.role === "manager";

const guardWriteIfFrozen = () => {
  if (!isManagerFrozen) return false; // not blocked
  showFreezeBanner("League is frozen. Changes are disabled.");
  return true; // blocked
};
const normalizeKey = (s) => String(s || "").trim().toLowerCase();

const rosterHasPlayer = (teamObj, playerName) => {
  const key = normalizeKey(playerName);
  return (teamObj?.roster || []).some((p) => normalizeKey(p?.name) === key);
};

// Decide reason for missing player:
// - if we can see a buyout log entry for that team+player at/after trade.createdAt -> playerBoughtOut
// - else -> playerRemoved
const getRemovalReasonForTrade = ({ trade, teamName, playerName, leagueLog }) => {
  const createdAt = Number(trade?.createdAt || 0) || 0;
  const tKey = normalizeKey(teamName);
  const pKey = normalizeKey(playerName);

  const buyoutHit = (leagueLog || []).some((e) => {
    if (e?.type !== "buyout") return false;
    if (normalizeKey(e?.team) !== tKey) return false;
    if (normalizeKey(e?.player) !== pKey) return false;
    const ts = Number(e?.timestamp || 0) || 0;
    return ts >= createdAt;
  });

  return buyoutHit ? "playerBoughtOut" : "playerRemoved";
};
// ------------------------------------
// Session 0D: auto-cancel broken pending trades (global safety net)
// Catches ANY player removal path (including commissioner edits that bypass handlers)
// ------------------------------------
useEffect(() => {
  if (!hasLoaded) return;
  if (autoCancelLockRef.current) return;

  const pending = (tradeProposals || []).filter((tr) => tr?.status === "pending");
  if (pending.length === 0) return;

  const teamsByName = new Map(
    (teams || []).map((t) => [normalizeKey(t?.name), t])
  );

  const cancellations = [];

  for (const tr of pending) {
    const fromTeam = teamsByName.get(normalizeKey(tr?.fromTeam));
    const toTeam = teamsByName.get(normalizeKey(tr?.toTeam));
    if (!fromTeam || !toTeam) continue;

    // If any offered player is missing from fromTeam roster -> cancel
    for (const pName of tr.offeredPlayers || []) {
      if (!rosterHasPlayer(fromTeam, pName)) {
        cancellations.push({
          tradeId: tr.id,
          reason: getRemovalReasonForTrade({
            trade: tr,
            teamName: tr.fromTeam,
            playerName: pName,
            leagueLog,
          }),
        });
        break;
      }
    }

    // If already cancelling, skip checking requested side
    if (cancellations.some((c) => c.tradeId === tr.id)) continue;

    // If any requested player is missing from toTeam roster -> cancel
    for (const pName of tr.requestedPlayers || []) {
      if (!rosterHasPlayer(toTeam, pName)) {
        cancellations.push({
          tradeId: tr.id,
          reason: getRemovalReasonForTrade({
            trade: tr,
            teamName: tr.toTeam,
            playerName: pName,
            leagueLog,
          }),
        });
        break;
      }
    }
  }

  if (cancellations.length === 0) return;

  autoCancelLockRef.current = true;

  commitLeagueUpdate("trade:autoCancelMissingPlayers", (prev) => {
    let nextTrades = prev.tradeProposals || [];
    let nextLog = prev.leagueLog || [];

    for (const c of cancellations) {
      const res = cancelTradeById(nextTrades, nextLog, c.tradeId, {
        autoCancelled: true,
        reason: c.reason,
        cancelledBy: "System",
      });
      nextTrades = res.nextTradeProposals;
      nextLog = res.nextLeagueLog;
    }

    return {
      tradeProposals: nextTrades,
      leagueLog: nextLog,
    };
  });

  // release lock next tick
  setTimeout(() => {
    autoCancelLockRef.current = false;
  }, 0);
}, [hasLoaded, teams, tradeProposals, leagueLog]);


 // Update roster order for a team (used by drag & drop in TeamRosterPanel)
const handleUpdateTeamRoster = (teamName, newRoster) => {
  commitLeagueUpdate("rosterReorder", (prev) => {
    const prevTeams = Array.isArray(prev?.teams) ? prev.teams : [];
    if (!teamName || !Array.isArray(newRoster)) return null;

    const nextTeams = prevTeams.map((t) =>
      t?.name === teamName ? { ...t, roster: newRoster } : t
    );

    return { teams: nextTeams };
  });
};
;

  // Buyout handler: remove player from roster, add penalty entry, log it
const handleBuyout = (teamName, playerName) => {
  commitLeagueUpdate("buyout", (prev) => {
    const prevTeams = Array.isArray(prev.teams) ? prev.teams : [];
    const prevTrades = Array.isArray(prev.tradeProposals) ? prev.tradeProposals : [];
    const prevLog = Array.isArray(prev.leagueLog) ? prev.leagueLog : [];

    // Find team + player to compute penalty
    const team = prevTeams.find((t) => t?.name === teamName);
    if (!team) return null;

    const player = (team.roster || []).find((p) => p?.name === playerName);
    if (!player) return null;

    const penalty = calculateBuyout(Number(player.salary) || 0);

    // ✅ Session 0D: cancel any pending trades involving this player (because of buyout)
    const cancelResult = cancelTradesForPlayer(
      prevTrades,
      prevLog,
      teamName,
      playerName,
      { reason: "playerBoughtOut", autoCancelled: true }
    );

    const nextTeams = prevTeams.map((t) => {
      if (t.name !== teamName) return t;

      const newRoster = (t.roster || []).filter((p) => p.name !== playerName);

      const buyouts = [
        ...(t.buyouts || []),
        { player: playerName, penalty },
      ];

      return { ...t, roster: newRoster, buyouts };
    });

    const now = Date.now();
    const buyoutLogEntry = {
      type: "buyout",
      id: now + Math.random(),
      team: teamName,
      player: playerName,
      penalty,
      timestamp: now,
    };

    // cancelResult.nextLeagueLog already includes the tradeCancelled logs (if any)
    return {
      teams: nextTeams,
      tradeProposals: cancelResult.nextTradeProposals,
      leagueLog: [buyoutLogEntry, ...(cancelResult.nextLeagueLog || prevLog)],
    };
  });
};



 // Commissioner removes a player altogether (no penalty)
// Session 0D: removing a player cancels affected pending trades
const handleCommissionerRemovePlayer = (teamName, playerName) => {
  if (!currentUser || currentUser.role !== "commissioner") return;

  commitLeagueUpdate("commRemovePlayer", (prev) => {
    const prevTeams = Array.isArray(prev?.teams) ? prev.teams : [];
    const prevTrades = Array.isArray(prev?.tradeProposals) ? prev.tradeProposals : [];
    const prevLog = Array.isArray(prev?.leagueLog) ? prev.leagueLog : [];

    if (!teamName || !playerName) return null;

    // 1) Remove player from roster
    const nextTeams = prevTeams.map((t) => {
      if (t?.name !== teamName) return t;

      const nextRoster = (t.roster || []).filter((p) => p?.name !== playerName);
      return { ...t, roster: nextRoster };
    });

    const now = Date.now();

    // 2) Cancel any pending trades involving this player (Session 0D)
    const cancelRes = cancelTradesForPlayer(
      prevTrades,
      prevLog,
      teamName,
      playerName,
      {
        reason: "playerRemoved",
        autoCancelled: true,
        cancelledBy: "Commissioner",
      }
    );

    const nextTrades = cancelRes?.nextTradeProposals ?? prevTrades;
    const logAfterCancels = cancelRes?.nextLeagueLog ?? prevLog;

    // 3) Log the commissioner removal itself
    const commRemoveLogEntry = {
      id: now + Math.random(),
      type: "commRemovePlayer",
      team: teamName,
      player: playerName,
      timestamp: now,
    };

    return {
      teams: nextTeams,
      tradeProposals: nextTrades,
      leagueLog: [commRemoveLogEntry, ...logAfterCancels],
    };
  });
};


// Remove exactly ONE matching log entry (by id when possible, fallback to signature)
const removeOneLogEntry = (prevLog, entryToRemove) => {
  if (!Array.isArray(prevLog)) return [];

  // Best case: id exists
  if (entryToRemove?.id != null) {
    let removed = false;
    return prevLog.filter((e) => {
      if (removed) return true;
      if (e?.id === entryToRemove.id) {
        removed = true;
        return false;
      }
      return true;
    });
  }

  // Fallback: match on a "signature" of stable-ish fields
  const sig = (e) =>
    JSON.stringify({
      type: e?.type ?? null,
      timestamp: e?.timestamp ?? null,
      team: e?.team ?? null,
      player: e?.player ?? null,
      fromTeam: e?.fromTeam ?? null,
      toTeam: e?.toTeam ?? null,
      amount: e?.amount ?? null,
      penalty: e?.penalty ?? null,
      // add more fields here if you ever need tighter matching
    });

  const targetSig = sig(entryToRemove);

  let removed = false;
  return prevLog.filter((e) => {
    if (removed) return true;
    if (sig(e) === targetSig) {
      removed = true;
      return false;
    }
    return true;
  });
};

const handleCommissionerDeleteLogEntry = (entry) => {
  if (!currentUser || currentUser.role !== "commissioner") return;

  const ok = window.confirm("Delete this activity log entry? This cannot be undone.");
  if (!ok) return;

  commitLeagueUpdate("commDeleteLogEntry", (prev) => {
    const prevLog = Array.isArray(prev?.leagueLog) ? prev.leagueLog : [];
    const nextLog = removeOneLogEntry(prevLog, entry);

    // optional: log that a deletion occurred (meta-log)
    const now = Date.now();
    const deletionLog = {
      type: "commDeleteLogEntry",
      id: now + Math.random(),
      deletedType: entry?.type || null,
      deletedId: entry?.id ?? null,
      timestamp: now,
    };

    return { leagueLog: [deletionLog, ...nextLog] };
  });
};


  // Manager profile picture upload
const handleManagerProfileImageChange = (event) => {
  const file = event?.target?.files?.[0];
  if (!file) return;

  if (!currentUser || currentUser.role !== "manager" || !currentUser.teamName) return;

  const teamName = currentUser.teamName;

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;

    commitLeagueUpdate("profilePic", (prev) => {
      const prevTeams = Array.isArray(prev?.teams) ? prev.teams : [];

      const nextTeams = prevTeams.map((t) =>
        t?.name === teamName ? { ...t, profilePic: dataUrl } : t
      );

      return { teams: nextTeams };
    });
  };

  reader.readAsDataURL(file);
};


   // --- Trade submission from draft (from TeamRosterPanel / TeamToolsPanel) ---
 // --- Trade submission from draft (from TeamRosterPanel / TeamToolsPanel) ---
const handleSubmitTradeDraft = (draft) => {
  if (!draft) return;

  const committed = commitLeagueUpdate("trade:propose", (prev) => {
    const prevTeams = Array.isArray(prev?.teams) ? prev.teams : [];
    const prevTrades = Array.isArray(prev?.tradeProposals)
      ? prev.tradeProposals
      : [];
    const prevLog = Array.isArray(prev?.leagueLog) ? prev.leagueLog : [];

    const fromTeamObj = prevTeams.find((t) => t.name === draft.fromTeam);
    const toTeamObj = prevTeams.find((t) => t.name === draft.toTeam);

    const validation = validateTradeDraft({
      tradeDraft: draft,
      fromTeamObj,
      toTeamObj,
      existingProposals: prevTrades,
      maxRetentionSpots: 3,
    });

    if (!validation.ok) {
      if (validation.errorMessage) window.alert(validation.errorMessage);
      return null;
    }

    const {
      penaltyFromAmount,
      penaltyToAmount,
      validatedRetentionFrom,
      validatedRetentionTo,
    } = validation;

    const newTrade = buildTradeFromDraft({
      fromTeam: draft.fromTeam,
      toTeam: draft.toTeam,
      offeredPlayers: draft.offeredPlayers,
      requestedPlayers: draft.requestedPlayers,
      penaltyFrom: penaltyFromAmount,
      penaltyTo: penaltyToAmount,
      retentionFrom: validatedRetentionFrom,
      retentionTo: validatedRetentionTo,
      existingTrades: prevTrades,
    });

    // Build per-player details for logging (based on current rosters)
    const offeredDetails = (newTrade.offeredPlayers || []).map((name) => {
      const p =
        (fromTeamObj?.roster || []).find((pl) => pl.name === name) || null;
      const baseSalary = p ? Number(p.salary) || 0 : 0;
      const retainedAmount = Number(newTrade.retentionFrom?.[name] || 0) || 0;
      const newSalary = Math.max(0, baseSalary - retainedAmount);

      return {
        name,
        fromTeam: newTrade.fromTeam,
        toTeam: newTrade.toTeam,
        baseSalary,
        retainedAmount,
        newSalary,
      };
    });

    const requestedDetails = (newTrade.requestedPlayers || []).map((name) => {
      const p =
        (toTeamObj?.roster || []).find((pl) => pl.name === name) || null;
      const baseSalary = p ? Number(p.salary) || 0 : 0;
      const retainedAmount = Number(newTrade.retentionTo?.[name] || 0) || 0;
      const newSalary = Math.max(0, baseSalary - retainedAmount);

      return {
        name,
        fromTeam: newTrade.toTeam,
        toTeam: newTrade.fromTeam,
        baseSalary,
        retainedAmount,
        newSalary,
      };
    });

    const logEntry = {
      type: "tradeProposed",
      id: newTrade.id,
      fromTeam: newTrade.fromTeam,
      toTeam: newTrade.toTeam,
      requestedPlayers: newTrade.requestedPlayers,
      offeredPlayers: newTrade.offeredPlayers,
      penaltyFrom: newTrade.penaltyFrom,
      penaltyTo: newTrade.penaltyTo,
      retentionFrom: newTrade.retentionFrom,
      retentionTo: newTrade.retentionTo,
      offeredDetails,
      requestedDetails,
      timestamp: newTrade.createdAt,
    };

    return {
      tradeProposals: [newTrade, ...prevTrades],
      leagueLog: [logEntry, ...prevLog],
    };
  });

  // UI-only state reset (don’t include in league writes)
  if (committed) setTradeDraft(null);
};



  // --- Trade handlers using helpers from leagueUtils ---

  const handleAcceptTrade = (tradeId) => {
    const result = acceptTradeById({
      tradeId,
      teams,
      tradeProposals,
      capLimit: CAP_LIMIT,
      maxRosterSize: MAX_ROSTER_SIZE,
      minForwards: MIN_FORWARDS,
      minDefensemen: MIN_DEFENSEMEN,
    });

    if (result.tradeProposals) {
      setTradeProposals(result.tradeProposals);
    }
    if (result.teams) {
      setTeams(result.teams);
    }
    if (result.logEntries && result.logEntries.length > 0) {
      setLeagueLog((prev) => [...result.logEntries, ...prev]);
    }

    if (!result.ok && result.error) {
      window.alert(result.error);
    }
    if (result.ok && result.warnings && result.warnings.length > 0) {
  window.alert(
    "Trade accepted, but it creates roster/cap issues:\n\n" +
      result.warnings.join("\n")
  );
}

  };

  const handleRejectTrade = (tradeId) => {
    const { nextTradeProposals, nextLeagueLog } = rejectTradeById(
      tradeProposals,
      leagueLog,
      tradeId
    );
    setTradeProposals(nextTradeProposals);
    setLeagueLog(nextLeagueLog);
  };

  const handleCancelTrade = (tradeId) => {
    const { nextTradeProposals, nextLeagueLog } = cancelTradeById(
      tradeProposals,
      leagueLog,
      tradeId,
      {
        cancelledBy:
          currentUser?.role === "commissioner"
            ? "Commissioner"
            : currentUser?.teamName || null,
      }
    );
    setTradeProposals(nextTradeProposals);
    setLeagueLog(nextLeagueLog);
  };
  // --- Trade Block handlers ---

  const handleAddTradeBlockEntry = ({ team, player, needs }) => {
  const trimmedTeam = (team || "").trim();
  const trimmedPlayer = (player || "").trim();
  if (!trimmedTeam || !trimmedPlayer) return;

  const trimmedNeeds = (needs || "").trim();

  commitLeagueUpdate("tradeBlock:add", (prev) => {
    const prevBlock = Array.isArray(prev?.tradeBlock) ? prev.tradeBlock : [];

    // Remove any existing entry for this team + player (case-insensitive)
    const filtered = prevBlock.filter(
      (e) =>
        !(
          String(e?.team || "").trim() === trimmedTeam &&
          String(e?.player || "").trim().toLowerCase() === trimmedPlayer.toLowerCase()
        )
    );

    const nextBlock = [
      {
        id: Date.now() + Math.random(),
        team: trimmedTeam,
        player: trimmedPlayer,
        needs: trimmedNeeds,
      },
      ...filtered,
    ];

    return { tradeBlock: nextBlock };
  });
};



  const handleRemoveTradeBlockEntry = (entryId) => {
  commitLeagueUpdate("tradeBlock:remove", (prev) => {
    const prevBlock = Array.isArray(prev?.tradeBlock) ? prev.tradeBlock : [];
    const nextBlock = prevBlock.filter((e) => e?.id !== entryId);

    // If nothing changed, treat as no-op (avoids pointless re-renders)
    if (nextBlock.length === prevBlock.length) return null;

    return { tradeBlock: nextBlock };
  });
};


    // --- Counter offer handler ---
const handleCounterTrade = (trade) => {
  if (!trade || !currentUser) return;

  console.log("[Counter] starting counter for trade:", trade);

  const now = Date.now();

  // 1) Cancel the existing trade (so players are free for the counter)
  const { nextTradeProposals, nextLeagueLog } = cancelTradeById(
    tradeProposals,
    leagueLog,
    trade.id,
    {
      autoCancelled: false,
      reason: "counterOffer",
      cancelledBy:
        currentUser.role === "commissioner"
          ? "Commissioner"
          : currentUser.teamName || null,
    },
    now
  );

  setTradeProposals(nextTradeProposals);
  setLeagueLog(nextLeagueLog);

  // 2) Build a new draft from the *receiving* team back to the original sender
  const newDraft = {
    fromTeam: trade.toTeam, // team that received the original offer
    toTeam: trade.fromTeam, // original offering team
    requestedPlayers: [...(trade.offeredPlayers || [])], // now they request what was offered
    offeredPlayers: [...(trade.requestedPlayers || [])], // and offer what they were asked for
    penaltyFrom: trade.penaltyTo ?? 0, // swap penalty directions
    penaltyTo: trade.penaltyFrom ?? 0,
    retentionFrom: { ...(trade.retentionTo || {}) },
    retentionTo: { ...(trade.retentionFrom || {}) },
  };

  console.log("[Counter] new draft built:", newDraft);

  setTradeDraft(newDraft);
};
// --- Auction handlers ---


// Manager places a free-agent bid
const handlePlaceBid = ({ playerName, position, amount }) => {
  if (!currentUser || currentUser.role !== "manager") {
    window.alert("Only logged-in managers can place bids.");
    return;
  }

  const biddingTeamName = currentUser.teamName;

  let errorToShow = null;

  const ok = commitLeagueUpdate("bid:place", (prev) => {
    const prevTeams = Array.isArray(prev?.teams) ? prev.teams : [];
    const prevFreeAgents = Array.isArray(prev?.freeAgents) ? prev.freeAgents : [];
    const prevLog = Array.isArray(prev?.leagueLog) ? prev.leagueLog : [];

    const result = placeFreeAgentBid({
      teams: prevTeams,
      freeAgents: prevFreeAgents,
      biddingTeamName,
      playerName,
      position,
      rawAmount: amount,
      capLimit: CAP_LIMIT,
      maxRosterSize: MAX_ROSTER_SIZE,
      minForwards: MIN_FORWARDS,
      minDefensemen: MIN_DEFENSEMEN,
    });

    if (!result.ok) {
      const raw = String(result.errorMessage || "");
      const meta =
        raw.toLowerCase().includes("cooldown") ||
        raw.toLowerCase().includes("edit") ||
        raw.toLowerCase().includes("minimum") ||
        raw.toLowerCase().includes("min bid");

      errorToShow = meta ? "Bid not allowed." : (result.errorMessage || "Bid not allowed.");
      return null; // no state change
    }

    const patch = { freeAgents: result.nextFreeAgents };

    if (result.logEntry) {
      patch.leagueLog = [result.logEntry, ...prevLog];
    }

    // OPTIONAL: if you want managers to see cap warnings (this is non-meta and useful)
    if (result.warningMessage) {
      // You can decide if you want to surface this or not
      // errorToShow = result.warningMessage; // (or handle separately)
    }

    return patch;
  });

  if (!ok && errorToShow) {
    window.alert(errorToShow);
  }
};



// Commissioner resolves all active auctions (atomic + logged + confirmed)
const handleResolveAuctions = () => {
  if (!currentUser || currentUser.role !== "commissioner") {
    window.alert("Only the commissioner can resolve auctions.");
    return;
  }

  const ok = window.confirm(
    "Resolve auctions now?\n\nThis will assign winning bids, clear resolved bids, and update rosters."
  );
  if (!ok) return;

  commitLeagueUpdate("commResolveAuctions", (prev) => {
    const prevTeams = Array.isArray(prev?.teams) ? prev.teams : [];
    const prevFreeAgents = Array.isArray(prev?.freeAgents) ? prev.freeAgents : [];
    const prevLog = Array.isArray(prev?.leagueLog) ? prev.leagueLog : [];

    const now = Date.now();

    const result = resolveAuctions({
      teams: prevTeams,
      freeAgents: prevFreeAgents,
      capLimit: CAP_LIMIT,
      maxRosterSize: MAX_ROSTER_SIZE,
      minForwards: MIN_FORWARDS,
      minDefensemen: MIN_DEFENSEMEN,
      now,
    });

    const commLog = {
      type: "commResolveAuctions",
      id: now + Math.random(),
      resolvedCount: Array.isArray(result?.newLogs) ? result.newLogs.length : 0,
      remainingBids: Array.isArray(result?.nextFreeAgents) ? result.nextFreeAgents.length : 0,
      timestamp: now,
    };

    const newLogs = Array.isArray(result?.newLogs) ? result.newLogs : [];

    return {
      teams: result?.nextTeams ?? prevTeams,
      freeAgents: result?.nextFreeAgents ?? prevFreeAgents,
      leagueLog: [commLog, ...newLogs, ...prevLog],
    };
  });

  // Optional UX message (kept outside commit so it doesn't affect state)
  window.alert("Auctions resolved. Check League Activity for signings.");
};

// Commissioner can remove a specific bid (e.g. typo) — atomic + confirmed + logged
const handleCommissionerRemoveBid = (bidId) => {
  if (!currentUser || currentUser.role !== "commissioner") {
    window.alert("Only the commissioner can remove bids.");
    return;
  }

  commitLeagueUpdate("commRemoveBid", (prev) => {
    const prevFreeAgents = Array.isArray(prev?.freeAgents) ? prev.freeAgents : [];
    const prevLog = Array.isArray(prev?.leagueLog) ? prev.leagueLog : [];

    const target = prevFreeAgents.find((b) => b?.id === bidId) || null;
    if (!target) return null;

    const ok = window.confirm(
      `Remove this bid?\n\nPlayer: ${target.player}\nTeam: ${target.team}\nAmount: $${target.amount}`
    );
    if (!ok) return null;

    const { nextFreeAgents, removedBid } = removeAuctionBidById(prevFreeAgents, bidId);

    const now = Date.now();
    const logEntry = {
      type: "commRemoveBid",
      id: now + Math.random(),
      bidId,
      player: removedBid?.player || target?.player || "",
      team: removedBid?.team || target?.team || "",
      amount: Number(removedBid?.amount ?? target?.amount ?? 0) || 0,
      timestamp: now,
    };

    return {
      freeAgents: nextFreeAgents,
      leagueLog: [logEntry, ...prevLog],
    };
  });
};


  // --- Login / logout ---

const handleLogin = () => {
  const trimmedTeam = loginTeamName.trim();
  const user = managers.find(
    (m) => m.teamName === trimmedTeam && m.password === loginPassword
  );

  if (!user) {
    setLoginError("Invalid team or password.");
    return;
  }

  const nextUser = {
    role: user.role,
    teamName: user.role === "manager" ? user.teamName : null,
  };

  setCurrentUser(nextUser);
 // Record manager last-login — one entry per team (no ever-growing history)
if (nextUser.role === "manager") {
  const now = Date.now();
  const entry = {
    id: now + Math.random(),
    teamName: nextUser.teamName,
    timestamp: now,
  };

  if (typeof commitLeagueUpdate === "function") {
    commitLeagueUpdate("managerLogin", (prev) => {
      const prevSettings = prev?.settings || {};
      const prevLast = prevSettings.managerLastLogin || {};

      return {
        settings: {
          ...prevSettings,
          managerLastLogin: {
            ...prevLast,
            [entry.teamName]: entry,
          },
        },
      };
    });
  }
}


  localStorage.setItem("hundo_currentUser", JSON.stringify(nextUser));

  setLoginError("");
  setLoginPassword("");

  // When a manager logs in, default selected team = their own
  if (user.role === "manager") {
    setSelectedTeamName(user.teamName);
  }
};


  const handleLogout = () => {
    setCurrentUser(null);
    setLoginTeamName("");
    setLoginPassword("");
    setLoginError("");
    setTradeDraft(null);
    localStorage.removeItem("hundo_currentUser");

  };


return (
  <div className="page">
    <div className="container">
            <TopBar
        currentUser={currentUser}
        loginTeamName={loginTeamName}
        loginPassword={loginPassword}
        loginError={loginError}
        selectedTeamName={selectedTeamName}
        teams={teams}
        managers={managers}
        setLoginTeamName={setLoginTeamName}
        setLoginPassword={setLoginPassword}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        setSelectedTeamName={setSelectedTeamName}
        notifications={notifications}
  unreadCount={unreadCount}
  onMarkAllNotificationsRead={markAllNotificationsRead}
  freezeBanner={freezeBanner}

      />
      

      {/* FULL WIDTH: Commissioner Panel (NOT inside the grid) */}
      <div style={{ marginTop: "12px", marginBottom: "12px" }}>
        <CommissionerPanel
          currentUser={currentUser}
          apiUrl={API_URL}
          teams={teams}
          tradeProposals={tradeProposals}
          freeAgents={freeAgents}
          leagueLog={leagueLog}
          tradeBlock={tradeBlock}
          onResolveAuctions={handleResolveAuctions}
          onCommissionerRemoveBid={handleCommissionerRemoveBid}
          leagueSettings={leagueSettings}
          commitLeagueUpdate={commitLeagueUpdate}
        />
      </div>

      {/* MAIN LAYOUT: 2 columns */}
      <div
        style={{
          background: "#020617",
          border: "1px solid #1e293b",
          borderRadius: "8px",
          padding: "12px 16px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "16px",
            alignItems: "flex-start",
          }}
        >
          <TeamRosterPanel
            team={selectedTeam}
            teams={teams}
            capLimit={CAP_LIMIT}
            maxRosterSize={MAX_ROSTER_SIZE}
            minForwards={MIN_FORWARDS}
            minDefensemen={MIN_DEFENSEMEN}
            currentUser={currentUser}
            tradeDraft={tradeDraft}
            setTradeDraft={setTradeDraft}
            canManageTeam={canManageTeam}
            onUpdateTeamRoster={handleUpdateTeamRoster}
            onBuyout={handleBuyout}
            onCommissionerRemovePlayer={handleCommissionerRemovePlayer}
            onManagerProfileImageChange={handleManagerProfileImageChange}
            onSubmitTradeDraft={handleSubmitTradeDraft}
            onAddToTradeBlock={handleAddTradeBlockEntry}
          />

          <TeamToolsPanel
            currentUser={currentUser}
            selectedTeam={selectedTeam}
            teams={teams}
            capLimit={CAP_LIMIT}
            maxRosterSize={MAX_ROSTER_SIZE}
            minForwards={MIN_FORWARDS}
            minDefensemen={MIN_DEFENSEMEN}
            tradeDraft={tradeDraft}
            setTradeDraft={setTradeDraft}
            tradeProposals={tradeProposals}
            onSubmitTradeDraft={handleSubmitTradeDraft}
            onAcceptTrade={handleAcceptTrade}
            onRejectTrade={handleRejectTrade}
            onCancelTrade={handleCancelTrade}
            onCounterTrade={handleCounterTrade}
            tradeBlock={tradeBlock}
            freeAgents={freeAgents}
            onPlaceBid={handlePlaceBid}
            onResolveAuctions={handleResolveAuctions}
            onCommissionerRemoveBid={handleCommissionerRemoveBid}
          />
        </div>
      </div>


        {/* FULL WIDTH: League history */}
        <LeagueHistoryPanel
          leagueLog={leagueLog}
          historyFilter={historyFilter}
          setHistoryFilter={setHistoryFilter}
            currentUser={currentUser}
  onDeleteLogEntry={handleCommissionerDeleteLogEntry}
        />
      </div>
    </div>
  );
}

export default App;
