// src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { io as socketIOClient } from "socket.io-client";
import { playSound } from "./sound";
import { HOCKEY_QUOTES } from "./quotes";
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
import { Routes, Route } from "react-router-dom";
import FreeAgentsPage from "./pages/FreeAgentsPage";


// Backend endpoint (Netlify env var first, fallback hard-coded)
const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://hundo-leago-backend.onrender.com/api/league";

  const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "https://hundo-leago-backend.onrender.com";

// Phase 2A: Players endpoint (derived from API_URL by default)
const PLAYERS_API_URL = API_URL.replace(/\/api\/league\/?$/, "/api/players");

// Phase X: Stats endpoint (derived from API_URL)
const STATS_API_URL =
  import.meta.env.VITE_STATS_URL ||
  API_URL.replace(/\/api\/league\/?$/, "/api/stats");


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
// ✅ Phase 2A safety: block manager writes if league contains legacy name-only players/bids
const [integrityLock, setIntegrityLock] = useState(false);
const [integrityMsg, setIntegrityMsg] = useState("");

  // --- Random quote (UI only) ---
  const [dailyQuote, setDailyQuote] = useState(null);

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

// ===============================
// Phase 2A: Player lookup cache (frontend)
// ===============================
const playersByIdRef = useRef(new Map());
const playersByNameRef = useRef(new Map()); // ✅ NEW: normalized fullName/name -> player object
const [playersTick, setPlayersTick] = useState(0);
const [playersReady, setPlayersReady] = useState(false);

const normalizeKey = (s) => String(s || "").trim().toLowerCase();

const upsertPlayers = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return;
  let changed = false;

  // local helper (kept inside for minimal scope)
  const normalizeNhlId = (raw) => {
    if (raw == null) return null;
    const s = String(raw).trim();
    if (!s) return null;

    const stripped = s.toLowerCase().startsWith("id:") ? s.slice(3).trim() : s;
    const n = Number(stripped);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.trunc(n);
  };

  const normalizePlayerShape = (p) => {
    if (!p) return null;

    // Accept common backend keys:
    // id | playerId | nhlId | nhlPlayerId
    const pid =
      normalizeNhlId(p.id) ??
      normalizeNhlId(p.playerId) ??
      normalizeNhlId(p.nhlId) ??
      normalizeNhlId(p.nhlPlayerId);

    if (!pid) return null;

    const fullName = String(p.fullName || p.name || p.playerName || "").trim();

    // Keep original fields, but force canonical keys
    return {
      ...p,
      id: pid,            // ✅ canonical numeric id
      fullName,           // ✅ canonical name
    };
  };

  for (const raw of arr) {
    const p = normalizePlayerShape(raw);
    if (!p) continue;

    const id = p.id;

    const prev = playersByIdRef.current.get(id);

    // crude “did it change” check; good enough for now
    const nextStr = JSON.stringify(p);
    const prevStr = prev ? JSON.stringify(prev) : "";
    if (nextStr !== prevStr) {
      playersByIdRef.current.set(id, p);
      changed = true;
    }

    // name cache (for mapping legacy string players -> IDs)
    const fullNameKey = normalizeKey(p?.fullName || p?.name);
    if (fullNameKey) {
      playersByNameRef.current.set(fullNameKey, p);
    }
  }

  if (changed) setPlayersTick((x) => x + 1);
};

const [statsByPlayerId, setStatsByPlayerId] = useState({});
const [statsReady, setStatsReady] = useState(false);


const getPlayerById = (id) => {
  const pid = Number(id);
  if (!Number.isFinite(pid)) return null;
  return playersByIdRef.current.get(pid) || null;
};

const getPlayerNameById = (id) => {
  const p = getPlayerById(id);
  return p?.fullName || p?.name || "";
};

// Fetch one player by ID (cached)
const fetchPlayerById = async (id) => {
  const pid = Number(id);
  if (!Number.isFinite(pid)) return null;

  const cached = getPlayerById(pid);
  if (cached) return cached;

  const res = await fetch(`${PLAYERS_API_URL}/${pid}`);
  if (!res.ok) return null;

  const data = await res.json();
  const p = data?.player || null;
  if (p) upsertPlayers([p]);
  return p || null;
};

// Search players by name (cached)
const searchPlayers = async (query, limit = 25) => {
  const q = String(query || "").trim();
  if (!q) return [];

  const url = `${PLAYERS_API_URL}?query=${encodeURIComponent(q)}&limit=${encodeURIComponent(
    limit
  )}`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  const rawArr = Array.isArray(data?.players) ? data.players : [];

  // push into caches (normalizes ids + names)
  upsertPlayers(rawArr);

  // return normalized shape from the id cache when possible
  const out = [];
  for (const raw of rawArr) {
    const tryId =
      normalizePlayerIdStrict(raw?.id) ??
      normalizePlayerIdStrict(raw?.playerId) ??
      normalizePlayerIdStrict(raw?.nhlId) ??
      normalizePlayerIdStrict(raw?.nhlPlayerId);

    if (tryId) {
      const cached = getPlayerById(tryId);
      if (cached) {
        out.push(cached);
        continue;
      }
    }

    // fallback: return something usable even if caching failed
    out.push(raw);
  }

  return out;
};


const getPlayerByName = (name) => {
  const key = normalizeKey(name);
  return playersByNameRef.current.get(key) || null;
};
// ===============================
// Phase 2A: Preload full player DB once (fast, professional name resolution)
// ===============================
useEffect(() => {
  if (!hasLoaded) return;
  if (playersReady) return;

  let cancelled = false;

  (async () => {
    try {
      const url = `${PLAYERS_API_URL}?limit=100000`;
      console.log("[PLAYERS] preload url =", url);

      const res = await fetch(url);
      console.log("[PLAYERS] preload status =", res.status);

      if (!res.ok) return;

      const data = await res.json();
      const arr = Array.isArray(data?.players) ? data.players : [];
      console.log("[PLAYERS] preload count =", arr.length);

      if (cancelled) return;

      // Important: mark ready ONLY if we actually loaded a real DB
      if (arr.length > 1000) {
        upsertPlayers(arr);
        setPlayersReady(true);
        setPlayersTick((x) => x + 1);
      } else {
        console.warn("[PLAYERS] preload too small, leaving playersReady=false");
      }
    } catch (e) {
      console.warn("[PLAYERS] preload failed:", e);
    }
  })();

  return () => {
    cancelled = true;
  };
}, [hasLoaded, playersReady, PLAYERS_API_URL]);

useEffect(() => {
  if (!hasLoaded) return;

  let cancelled = false;

  const fetchStats = async () => {
    try {
      console.log("[STATS] fetching:", STATS_API_URL);
      const res = await fetch(STATS_API_URL);
      console.log("[STATS] status:", res.status);

      if (!res.ok) return;

      const data = await res.json();
      if (cancelled) return;

      const by =
  data?.byPlayerId && typeof data.byPlayerId === "object" ? data.byPlayerId : {};

const count = Object.keys(by).length;

// ✅ “Ready” means: fetch succeeded AND we actually have stats
const ready = res.ok && count > 0;

setStatsByPlayerId(by);
setStatsReady(ready);

console.log("[STATS] ready =", ready, "count =", count);

    } catch (e) {
      console.warn("[STATS] fetch failed:", e);
    }
  };

  fetchStats();

  // optional: re-pull occasionally (keeps things fresh without spamming)
  const t = setInterval(fetchStats, 5 * 60 * 1000);

  return () => {
    cancelled = true;
    clearInterval(t);
  };
}, [hasLoaded, STATS_API_URL]);

// ===============================
// Phase 2A: Prefetch names for all rostered players (so UI shows DB names)
// ===============================
const prefetchLockRef = useRef({ running: false, lastKey: "" });

useEffect(() => {
  if (!hasLoaded) return;
if (playersReady) return;

  // Normalize any id-ish value into a positive int
  const normId = (raw) => {
    if (raw == null) return null;
    const s = String(raw).trim();
    if (!s) return null;
    const stripped = s.toLowerCase().startsWith("id:") ? s.slice(3).trim() : s;
    const n = Number(stripped);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.trunc(n);
  };

  // Collect all playerIds we currently need names for (rosters + active auctions)
  const ids = new Set();

  for (const t of (Array.isArray(teams) ? teams : [])) {
    for (const p of (Array.isArray(t?.roster) ? t.roster : [])) {
      const pid = normId(p?.playerId ?? p?.id);
      if (pid) ids.add(pid);
    }
  }

  for (const b of (Array.isArray(freeAgents) ? freeAgents : [])) {
    if (b?.resolved) continue;
    const pid = normId(b?.playerId);
    if (pid) ids.add(pid);
  }

  // Only fetch what we don’t already have cached
  const missing = Array.from(ids).filter((pid) => !playersByIdRef.current.has(pid));
if (missing.length === 0) {
  if (!playersReady) setPlayersReady(true); // ✅ NEW
  return;
}


  // Avoid re-running the same prefetch batch repeatedly
  missing.sort((a, b) => a - b);
  const key = missing.join(",");
  if (prefetchLockRef.current.lastKey === key) return;
  prefetchLockRef.current.lastKey = key;

  if (prefetchLockRef.current.running) return;
  prefetchLockRef.current.running = true;

  (async () => {
  try {
    // Don’t hammer the endpoint—cap per pass
    const batch = missing.slice(0, 120);

    for (const pid of batch) {
      // eslint-disable-next-line no-await-in-loop
      await fetchPlayerById(pid);
    }

    // ✅ NEW: if we now have all ids needed for roster + active bids, mark ready
    const stillMissing = Array.from(ids).some(
      (pid) => !playersByIdRef.current.has(pid)
    );
    if (!stillMissing) setPlayersReady(true);
  } catch (e) {
    console.warn("[PLAYERS] prefetch failed:", e);
  } finally {
    prefetchLockRef.current.running = false;
  }
})();

}, [hasLoaded, teams, freeAgents, playersReady]);

const playerApi = {
  byId: playersByIdRef.current,
  byName: playersByNameRef.current,

  getPlayerById,
  getPlayerNameById,
  getPlayerByName,

  fetchPlayerById,
  searchPlayers,

  playersReady,          // ✅ NEW
  _playersTick: playersTick,
};



// ------------------------------------
// Random quote: pick once per full page load
// ------------------------------------
useEffect(() => {
  if (!Array.isArray(HOCKEY_QUOTES) || HOCKEY_QUOTES.length === 0) return;

  const lastIndex = Number(localStorage.getItem("hundo_lastQuoteIndex") || -1);

  let nextIndex = Math.floor(Math.random() * HOCKEY_QUOTES.length);
  if (HOCKEY_QUOTES.length > 1 && nextIndex === lastIndex) {
    nextIndex = (nextIndex + 1) % HOCKEY_QUOTES.length;
  }

  localStorage.setItem("hundo_lastQuoteIndex", String(nextIndex));
  setDailyQuote(HOCKEY_QUOTES[nextIndex]);
}, []);

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
const MAX_LEAGUE_LOG = 50;

function trimLeagueLogNewestFirst(log) {
  const arr = Array.isArray(log) ? log : [];
  if (arr.length <= MAX_LEAGUE_LOG) return arr;

  // Your log is stored newest-first (you prepend entries).
  // Oldest entries are at the end, so keep the first 50.
  return arr.slice(0, MAX_LEAGUE_LOG);
}

const commitLeagueUpdate = (reason, updater) => {
  // Local freeze gate (fast UX)
  if (typeof guardWriteIfFrozen === "function" && guardWriteIfFrozen()) {
    console.warn("[COMMIT] blocked (frozen):", reason);
    return false;
  }

  const prev = leagueStateRef.current;
  const patch = updater?.(prev);

    // Hard-cap leagueLog to 50 by deleting the oldest entries
  // (Only trims when the updater is actually changing leagueLog)
  let cappedPatch = patch;
  if (cappedPatch && Object.prototype.hasOwnProperty.call(cappedPatch, "leagueLog")) {
    cappedPatch = { ...cappedPatch, leagueLog: trimLeagueLogNewestFirst(cappedPatch.leagueLog) };
  }

  if (!cappedPatch) {
    console.warn("[COMMIT] no-op:", reason);
    return false;
  }

    const next = {
    ...prev,
    ...cappedPatch,
  };


  // Phase 0 shape safety: don’t allow accidental wipes / malformed writes
  if (!leagueStateLooksValid(next)) {
    console.error("[COMMIT] rejected (invalid next state):", reason, next);
    return false;
  }

  // Apply only the keys that changed
    if (cappedPatch.teams) setTeams(cappedPatch.teams);
  if (cappedPatch.tradeProposals) setTradeProposals(cappedPatch.tradeProposals);
  if (cappedPatch.freeAgents) setFreeAgents(cappedPatch.freeAgents);
  if (cappedPatch.leagueLog) setLeagueLog(cappedPatch.leagueLog);
  if (cappedPatch.tradeBlock) setTradeBlock(cappedPatch.tradeBlock);
  if (cappedPatch.settings) setLeagueSettings(cappedPatch.settings);


  return true;
};


// -------------------------
// Auction win sound (manager)
// -------------------------
const winSoundLockRef = useRef(false);

const playAuctionWinSound = () => {
  if (winSoundLockRef.current) return;
  winSoundLockRef.current = true;
  setTimeout(() => (winSoundLockRef.current = false), 1500);

  playSound("/sounds/VGauctionwin-crop.wav", { volume: 0.8 });
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

const detectLegacyIdIssues = (state) => {
  const issues = [];

  const teamsArr = Array.isArray(state?.teams) ? state.teams : [];
  const freeArr = Array.isArray(state?.freeAgents) ? state.freeAgents : [];

  // roster: require playerId
  for (const t of teamsArr) {
    for (const p of (t?.roster || [])) {
      const pid = Number(p?.playerId);
      if (!Number.isFinite(pid) || pid <= 0) {
        issues.push(`Roster player missing playerId: "${p?.name || "Unknown"}" on ${t?.name || "Unknown Team"}`);
      }
    }
  }

  // auctions: require playerId AND auctionKey="id:###"
  for (const b of freeArr) {
    if (b?.resolved) continue;
    const pid = Number(b?.playerId);
    const key = String(b?.auctionKey || "").trim().toLowerCase();

    if (!Number.isFinite(pid) || pid <= 0) {
      issues.push(`Auction bid missing playerId: "${b?.player || "Unknown"}" (${b?.team || "Unknown Team"})`);
      continue;
    }
    if (!key.startsWith("id:")) {
      issues.push(`Auction bid has non-id auctionKey for playerId ${pid}: "${b?.auctionKey || ""}"`);
    }
  }

  return issues;
};
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
                const legacyIssues = detectLegacyIdIssues(loadedState);
        if (legacyIssues.length > 0) {
          setIntegrityLock(true);
          setIntegrityMsg(
            "⚠️ Player ID migration required. Managers cannot make changes right now."
          );
          console.warn("[INTEGRITY] legacy issues:", legacyIssues);
        } else {
          setIntegrityLock(false);
          setIntegrityMsg("");
        }

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

      // ✅ Phase 2A: detect legacy name-only players/bids and block manager writes
      const legacyIssues = detectLegacyIdIssues(loadedState);
      if (legacyIssues.length > 0) {
        setIntegrityLock(true);
        setIntegrityMsg(
          "League contains legacy players/bids without playerId. Managers cannot make changes until commissioner migrates/fixes this."
        );
        console.warn("[INTEGRITY] legacy issues:", legacyIssues);
      } else {
        setIntegrityLock(false);
        setIntegrityMsg("");
      }

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
    if (isManager && integrityLock) {
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

const isManagerIntegrityLocked =
  integrityLock === true && currentUser?.role === "manager";

const guardWriteIfFrozen = () => {
  if (isManagerFrozen) {
    showFreezeBanner("League is frozen. Changes are disabled.");
    return true;
  }

  if (isManagerIntegrityLocked) {
    showFreezeBanner(integrityMsg || "Data migration in progress. Changes are disabled.");
    return true;
  }

  return false;
};


const rosterHasPlayer = (teamObj, token) => rosterHasPlayerToken(teamObj, token);


// Decide reason for missing player:
// - if we can see a buyout log entry for that team+player at/after trade.createdAt -> playerBoughtOut
// - else -> playerRemoved
const getRemovalReasonForTrade = ({ trade, teamName, playerName, leagueLog }) => {
  const createdAt = Number(trade?.createdAt || 0) || 0;
  const tKey = normalizeKey(teamName);

  const wantPid = getPlayerIdFromToken(playerName);
  const wantNameKey = normalizeKey(playerName);

  const buyoutHit = (leagueLog || []).some((e) => {
    if (e?.type !== "buyout") return false;
    if (normalizeKey(e?.team) !== tKey) return false;

    const ts = Number(e?.timestamp || 0) || 0;
    if (ts < createdAt) return false;

    // Compare by id if possible
    const ePid = getPlayerIdFromToken(e?.player);
    if (wantPid && ePid) return wantPid === ePid;

    // Fallback compare by normalized name
    return wantNameKey && normalizeKey(e?.player) === wantNameKey;
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
const handleBuyout = (teamName, playerToken) => {
  commitLeagueUpdate("buyout", (prev) => {
    const prevTeams = Array.isArray(prev.teams) ? prev.teams : [];
    const prevTrades = Array.isArray(prev.tradeProposals) ? prev.tradeProposals : [];
    const prevLog = Array.isArray(prev.leagueLog) ? prev.leagueLog : [];

    const team = prevTeams.find((t) => t?.name === teamName);
    if (!team) return null;

    // Find player by id or name (for salary + display)
    const player = findRosterPlayerByToken(team, playerToken);
    if (!player) return null;

    const penalty = calculateBuyout(Number(player.salary) || 0);

    // Use a stable “log token”: prefer id ref if available, else name
    const pid = normalizePlayerIdStrict(player?.playerId) || getPlayerIdFromToken(playerToken);
    const logPlayer = pid ? `id:${pid}` : String(player?.name || playerToken || "").trim();

    // Cancel trades using the SAME token that trades contain (supports both worlds)
    const cancelResult = cancelTradesForPlayer(
      prevTrades,
      prevLog,
      teamName,
      logPlayer,
      { reason: "playerBoughtOut", autoCancelled: true }
    );

    const nextTeams = prevTeams.map((t) => {
      if (t.name !== teamName) return t;

      const newRoster = removeRosterPlayerByToken(t, playerToken);

      const buyouts = [
        ...(t.buyouts || []),
        { player: logPlayer, penalty },
      ];

      return { ...t, roster: newRoster, buyouts };
    });

    const now = Date.now();
    const buyoutLogEntry = {
      type: "buyout",
      id: now + Math.random(),
      team: teamName,
      player: logPlayer,
      penalty,
      timestamp: now,
    };

    return {
      teams: nextTeams,
      tradeProposals: cancelResult.nextTradeProposals,
      leagueLog: [buyoutLogEntry, ...(cancelResult.nextLeagueLog || prevLog)],
    };
  });
};




 // Commissioner removes a player altogether (no penalty)
// Session 0D: removing a player cancels affected pending trades
const handleCommissionerRemovePlayer = (teamName, playerToken) => {
  if (!currentUser || currentUser.role !== "commissioner") return;

  commitLeagueUpdate("commRemovePlayer", (prev) => {
    const prevTeams = Array.isArray(prev?.teams) ? prev.teams : [];
    const prevTrades = Array.isArray(prev?.tradeProposals) ? prev.tradeProposals : [];
    const prevLog = Array.isArray(prev?.leagueLog) ? prev.leagueLog : [];

    if (!teamName || !playerToken) return null;

    const team = prevTeams.find((t) => t?.name === teamName);
    if (!team) return null;

    const player = findRosterPlayerByToken(team, playerToken);
    if (!player) return null;

    const pid = normalizePlayerIdStrict(player?.playerId) || getPlayerIdFromToken(playerToken);
    const logPlayer = pid ? `id:${pid}` : String(player?.name || playerToken || "").trim();

    // 1) Remove player from roster
    const nextTeams = prevTeams.map((t) => {
      if (t?.name !== teamName) return t;
      const nextRoster = removeRosterPlayerByToken(t, playerToken);
      return { ...t, roster: nextRoster };
    });

    const now = Date.now();

    // 2) Cancel affected pending trades (token-aware)
    const cancelRes = cancelTradesForPlayer(
      prevTrades,
      prevLog,
      teamName,
      logPlayer,
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
      player: logPlayer,
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

    // ✅ IMPORTANT: do NOT add a new log entry for the deletion
    return { leagueLog: nextLog };
  });
};

const handleCommissionerCleanupDeleteLogs = () => {
  if (!currentUser || currentUser.role !== "commissioner") return;

  const ok = window.confirm(
    "Remove old 'delete log' meta entries?\n\nThis will delete ALL leagueLog entries of type: commDeleteLogEntry.\nIt will NOT touch trades, auctions, buyouts, etc."
  );
  if (!ok) return;

  commitLeagueUpdate("commCleanupDeleteLogs", (prev) => {
    const prevLog = Array.isArray(prev?.leagueLog) ? prev.leagueLog : [];
    const nextLog = prevLog.filter((e) => e?.type !== "commDeleteLogEntry");
    return { leagueLog: nextLog };
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
    // Build per-player details for logging (based on current rosters)
const offeredDetails = (newTrade.offeredPlayers || []).map((name) => {
  const p = findRosterPlayerByToken(fromTeamObj, name);
  const baseSalary = p ? Number(p.salary) || 0 : 0; // ✅ define baseSalary
  const retainedAmount = Number(newTrade.retentionFrom?.[name] || 0) || 0;
  const newSalary = Math.max(0, baseSalary - retainedAmount);

  return {
    name: getDisplayNameFromToken(name),
    fromTeam: newTrade.fromTeam,
    toTeam: newTrade.toTeam,
    baseSalary,
    retainedAmount,
    newSalary,
  };
});


    const requestedDetails = (newTrade.requestedPlayers || []).map((name) => {
      const p = findRosterPlayerByToken(toTeamObj, name);
      const baseSalary = p ? Number(p.salary) || 0 : 0;
      const retainedAmount = Number(newTrade.retentionTo?.[name] || 0) || 0;
      const newSalary = Math.max(0, baseSalary - retainedAmount);

      return {
        name: getDisplayNameFromToken(name),
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
  if (committed) {
  setTradeDraft(null);
  playSound("/sounds/VGoffertrade-crop.wav", { volume: 0.55 });
}
};



  // --- Trade handlers using helpers from leagueUtils ---

  const handleAcceptTrade = (tradeId) => {
  if (!tradeId) return;

  let accepted = false;
  let warningMsg = null;
  let errorMsg = null;

  const ok = commitLeagueUpdate("trade:accept", (prev) => {
    const result = acceptTradeById({
      tradeId,
      teams: prev.teams,
      tradeProposals: prev.tradeProposals,
      capLimit: CAP_LIMIT,
      maxRosterSize: MAX_ROSTER_SIZE,
      minForwards: MIN_FORWARDS,
      minDefensemen: MIN_DEFENSEMEN,
    });

    if (!result.ok) {
      errorMsg = result.error || "Trade could not be accepted.";
      return null;
    }

    if (result.warnings && result.warnings.length > 0) {
      warningMsg =
        "Trade accepted, but it creates roster/cap issues:\n\n" +
        result.warnings.join("\n");
    }

    accepted = true;

    return {
      teams: result.teams ?? prev.teams,
      tradeProposals: result.tradeProposals ?? prev.tradeProposals,
      leagueLog:
        result.logEntries && result.logEntries.length > 0
          ? [...result.logEntries, ...(prev.leagueLog || [])]
          : prev.leagueLog,
    };
  });

  if (!ok && errorMsg) window.alert(errorMsg);
  if (ok && warningMsg) window.alert(warningMsg);

  if (accepted) {
    playSound("/sounds/VGaccepttrade-crop.wav", { volume: 0.6 });
  }
};


  const handleRejectTrade = (tradeId) => {
  if (!tradeId) return;

  const committed = commitLeagueUpdate("trade:reject", (prev) => {
    const { nextTradeProposals, nextLeagueLog } = rejectTradeById(
      prev.tradeProposals,
      prev.leagueLog,
      tradeId
    );

    return {
      tradeProposals: nextTradeProposals,
      leagueLog: nextLeagueLog,
    };
  });

  if (committed) {
    playSound("/sounds/VGrejecttrade.wav", { volume: 0.55 });
  }
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



 const handleRemoveTradeBlockEntry = (arg) => {
  // Accept either an id OR the full entry object
  const id = (arg && typeof arg === "object") ? arg.id : arg;
  const team = (arg && typeof arg === "object") ? arg.team : null;

  // Support older shapes just in case
  const player =
    (arg && typeof arg === "object")
      ? (arg.player ?? arg.playerName ?? arg.name ?? null)
      : null;

  if (typeof commitLeagueUpdate !== "function") return;

  commitLeagueUpdate("removeTradeBlockEntry", (prev) => {
    const prevBlock = Array.isArray(prev?.tradeBlock) ? prev.tradeBlock : [];

    const norm = (x) => String(x ?? "").trim().toLowerCase();

    const nextBlock = prevBlock.filter((e) => {
  // primary: remove by id (string-safe)
  if (id != null && e?.id != null) return String(e.id) !== String(id);

  // fallback: remove by team+player
  if (team && player) {
    return !(
      String(e?.team || "") === String(team) &&
      String(e?.player || "") === String(player)
    );
  }

  // if we have nothing usable, don't remove
  return true;
});
;

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

// Phase 2A: normalize playerId inputs (strict ID-first)
// Accepts: 8475798, "8475798", "id:8475798" (from legacy/accidental formats)
// Rejects: null/undefined/"undefined"/non-numeric
const normalizePlayerIdStrict = (raw) => {
  if (raw == null) return null;

  // If someone accidentally passes "id:####", strip it.
  const s = String(raw).trim();

  if (!s) return null;

  const stripped = s.toLowerCase().startsWith("id:")
    ? s.slice(3).trim()
    : s;

  const n = Number(stripped);

  if (!Number.isFinite(n) || n <= 0) return null;
  // NHL ids are ints; force int-ish (still safe if API ever returns numeric strings)
  return Math.trunc(n);
};

// ------------------------------
// Phase 2: Player ref helpers (name OR id:####)
// ------------------------------
const isIdRef = (token) => String(token || "").trim().toLowerCase().startsWith("id:");

const normalizePlayerRef = (token) => {
  const s = String(token || "").trim();
  if (!s) return "";
  // keep canonical formatting for id refs
  const pid = normalizePlayerIdStrict(s);
  if (pid) return `id:${pid}`;
  return s;
};

const getPlayerIdFromToken = (token) => normalizePlayerIdStrict(token);

const getDisplayNameFromToken = (token) => {
  const pid = getPlayerIdFromToken(token);
  if (pid) return getPlayerNameById(pid) || "Unknown player";
  return String(token || "").trim();
};


// Find a roster player by token (prefers id match, falls back to name match)
const findRosterPlayerByToken = (teamObj, token) => {
  const roster = Array.isArray(teamObj?.roster) ? teamObj.roster : [];
  const pid = getPlayerIdFromToken(token);

  if (pid) {
    const hit = roster.find((p) => normalizePlayerIdStrict(p?.playerId) === pid);
    if (hit) return hit;
  }

  const key = normalizeKey(token);
  if (!key) return null;

  return roster.find((p) => normalizeKey(p?.name) === key) || null;
};

// Remove a roster player by token (id match if possible, else name)
const removeRosterPlayerByToken = (teamObj, token) => {
  const roster = Array.isArray(teamObj?.roster) ? teamObj.roster : [];
  const pid = getPlayerIdFromToken(token);

  if (pid) {
    return roster.filter((p) => normalizePlayerIdStrict(p?.playerId) !== pid);
  }

  const key = normalizeKey(token);
  if (!key) return roster;

  return roster.filter((p) => normalizeKey(p?.name) !== key);
};

// rosterHasPlayer, but token-aware (supports id:#### or name)
const rosterHasPlayerToken = (teamObj, token) => {
  return Boolean(findRosterPlayerByToken(teamObj, token));
};

// --- Auction handlers ---


// Manager places a free-agent bid
const handlePlaceBid = ({ playerId, playerName, position, amount }) => {
  if (!currentUser || currentUser.role !== "manager") {
    window.alert("Only logged-in managers can place bids.");
    return;
  }

  // TEMP DEBUG (remove after verification)
  if (import.meta.env.DEV) {
    console.log("[BID] handlePlaceBid received:", {
      playerId,
      playerIdType: typeof playerId,
      playerName,
      position,
      amount,
    });
  }

  const biddingTeamName = currentUser.teamName;

  // ✅ Strict: normalize to numeric NHL id, or reject
  const pid = normalizePlayerIdStrict(playerId);

  if (!pid) {
    window.alert("Player ID required (invalid selection). Try selecting the player again.");
    return;
  }

  let errorToShow = null;

  const ok = commitLeagueUpdate("bid:place", (prev) => {
    const prevTeams = Array.isArray(prev?.teams) ? prev.teams : [];
    const prevFreeAgents = Array.isArray(prev?.freeAgents) ? prev.freeAgents : [];
    const prevLog = Array.isArray(prev?.leagueLog) ? prev.leagueLog : [];

    const result = placeFreeAgentBid({
      teams: prevTeams,
      freeAgents: prevFreeAgents,
      biddingTeamName,
      playerId: String(pid), // ✅ ALWAYS numeric string now
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

    return patch;
  });

  if (ok) {
    playSound("/sounds/VGplacebid-crop.wav", { volume: 0.5 });
  }

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
      {/* TopBar shows on ALL pages */}
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

      <Routes>
        {/* HOME */}
        <Route
          path="/"
          element={
            <>
              {dailyQuote && (
                <div
                  style={{
                    marginTop: "10px",
                    marginBottom: "12px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #1e293b",
                    background: "#020617",
                    color: "#cbd5e1",
                    fontStyle: "italic",
                    textAlign: "center",
                  }}
                >
                  “{dailyQuote.text}”
                  <div
                    style={{
                      marginTop: "6px",
                      fontStyle: "normal",
                      fontSize: "0.85rem",
                      color: "#94a3b8",
                    }}
                  >
                    — {dailyQuote.author}
                  </div>
                </div>
              )}


              {/* FULL WIDTH: Commissioner Panel */}
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
                  onCleanupDeleteLogs={handleCommissionerCleanupDeleteLogs}
                  playerApi={playerApi}
                />
              </div>

              {/* MAIN LAYOUT */}
<div className="mainGrid">
  {/* LEFT column */}
  <div className="left">
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
      playerApi={playerApi}
      statsByPlayerId={statsByPlayerId}
      statsReady={statsReady}
    />

    {/* ✅ MOBILE ONLY: Team Tools goes UNDER roster */}
    <div className="mobileOnly" style={{ marginTop: 12 }}>
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
        onRemoveTradeBlockEntry={handleRemoveTradeBlockEntry}
        playerApi={playerApi}
      />
    </div>
  </div>

  {/* RIGHT column (desktop only) */}
  <div className="right desktopOnly">
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
      onRemoveTradeBlockEntry={handleRemoveTradeBlockEntry}
      playerApi={playerApi}
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
  playerApi={playerApi}
/>

            </>
          }
        />

  {/* FREE AGENTS */}
<Route
  path="/free-agents"
  element={
    <FreeAgentsPage
      currentUser={currentUser}
      teams={teams}
      capLimit={CAP_LIMIT}
      maxRosterSize={MAX_ROSTER_SIZE}
      minForwards={MIN_FORWARDS}
      minDefensemen={MIN_DEFENSEMEN}
      freeAgents={freeAgents}
      onPlaceBid={handlePlaceBid}
      playerApi={playerApi}
      statsByPlayerId={statsByPlayerId}
      statsReady={statsReady}
    />
  }
/>


      </Routes>
    </div>
  </div>
);

}

export default App;
