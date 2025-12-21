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

// Initial data for teams and rosters, with positions
const initialTeams = [
  {
    name: "Pacino Amigo",
    roster: [
      { name: "Kucherov", salary: 16, position: "F" },
      { name: "Thomson", salary: 6, position: "F" },
      { name: "Rantanen", salary: 8, position: "F" },
      { name: "Reinhart", salary: 8, position: "F" },
      { name: "Necas", salary: 3, position: "F" },
      { name: "Hagel", salary: 2, position: "F" },
      { name: "B Tkachuk", salary: 6, position: "F" },
      { name: "Stutzle", salary: 3, position: "F" },
      { name: "Q Hughes", salary: 15, position: "D" },
      { name: "Morrissey", salary: 3, position: "D" },
      { name: "Dahlin", salary: 9, position: "D" },
      { name: "Hutson", salary: 7, position: "D" },
      { name: "Boldy", salary: 6, position: "F" },
      { name: "J Robsertson", salary: 4, position: "F" },
      { name: "DeBrincat", salary: 4, position: "F" },
    ],
    buyouts: [],
    retainedSalaries: [],
    profilePic: null,
  },
  {
    name: "El Camino",
    roster: [
      { name: "Pastrnak", salary: 10, position: "F" },
      { name: "Suzuki", salary: 8, position: "F" },
      { name: "Guenther", salary: 5, position: "F" },
      { name: "Jarvis", salary: 8, position: "F" },
      { name: "Johnston", salary: 5, position: "F" },
      { name: "Snuggerud", salary: 1, position: "F" },
      { name: "Aho", salary: 6, position: "F" },
      { name: "Cozens", salary: 2, position: "F" },
      { name: "LaComb", salary: 8, position: "D" },
      { name: "Sergachev", salary: 8, position: "D" },
      { name: "Werenski", salary: 15, position: "D" },
      { name: "Hedman", salary: 5, position: "D" },
      { name: "Hintz", salary: 4, position: "F" },
      { name: "Byfield", salary: 3, position: "F" },
      { name: "Tippett", salary: 1, position: "F" },
    ],
    buyouts: [],
    retainedSalaries: [],
    profilePic: null,
  },
  {
    name: "DeNiro Amigo",
    roster: [
      { name: "Crosby", salary: 7, position: "F" },
      { name: "Pettersson", salary: 11, position: "F" },
      { name: "Panarin", salary: 11, position: "F" },
      { name: "Ovechkin", salary: 7, position: "F" },
      { name: "Celebrini", salary: 8, position: "F" },
      { name: "Bedard", salary: 8, position: "F" },
      { name: "Larkin", salary: 3, position: "F" },
      { name: "Dadonov", salary: 7, position: "F" },
      { name: "Hronek", salary: 5, position: "D" },
      { name: "Theodore", salary: 6, position: "D" },
      { name: "Josi", salary: 7, position: "D" },
      { name: "Dobson", salary: 7, position: "D" },
      { name: "DeBrusk", salary: 4, position: "F" },
      { name: "Boeser", salary: 4, position: "F" },
      { name: "Lekkerimaki", salary: 5, position: "F" },
    ],
    buyouts: [],
    retainedSalaries: [],
    profilePic: null,
  },
  {
    name: "Champino",
    roster: [
      { name: "McDavid", salary: 16, position: "F" },
      { name: "McKinnon", salary: 14, position: "F" },
      { name: "Nylander", salary: 7, position: "F" },
      { name: "Hyman", salary: 5, position: "F" },
      { name: "Point", salary: 13, position: "F" },
      { name: "Matthews", salary: 17, position: "F" },
      { name: "Brown", salary: 1, position: "F" },
      { name: "Monahan", salary: 2, position: "F" },
      { name: "Parekh", salary: 4, position: "D" },
      { name: "Heiskanen", salary: 10, position: "D" },
      { name: "McAvoy", salary: 6, position: "D" },
      { name: "Weegar", salary: 1, position: "D" },
      { name: "Hamilton", salary: 2, position: "D" },
      { name: "Lehkonen", salary: 1, position: "F" },
      { name: "Stankoven", salary: 1, position: "F" },
    ],
    buyouts: [],
    retainedSalaries: [],
    profilePic: null,
  },
  {
    name: "Bottle O Draino",
    roster: [
      { name: "Draisaitl", salary: 19, position: "F" },
      { name: "Eichel", salary: 10, position: "F" },
      { name: "Keller", salary: 10, position: "F" },
      { name: "Caulfield", salary: 1, position: "F" },
      { name: "Raymond", salary: 2, position: "F" },
      { name: "Konecny", salary: 1, position: "F" },
      { name: "J Miller", salary: 2, position: "F" },
      { name: "Kempe", salary: 6, position: "F" },
      { name: "Makar", salary: 20, position: "D" },
      { name: "Sanderson", salary: 9, position: "D" },
      { name: "E Karlsson", salary: 1, position: "D" },
      { name: "Gostisbehere", salary: 1, position: "D" },
      { name: "J Hughes", salary: 9, position: "F" },
      { name: "Connor", salary: 1, position: "F" },
      { name: "Schiefele", salary: 1, position: "F" },
    ],
    buyouts: [],
    retainedSalaries: [],
    profilePic: null,
  },
  {
    name: "Imano Lizzo",
    roster: [
      { name: "Marner", salary: 10, position: "F" },
      { name: "P Kane", salary: 2, position: "F" },
      { name: "Demidov", salary: 6, position: "F" },
      { name: "L Carlsson", salary: 6, position: "F" },
      { name: "Bratt", salary: 6, position: "F" },
      { name: "Thomas", salary: 6, position: "F" },
      { name: "Knies", salary: 4, position: "F" },
      { name: "Kaprizov", salary: 14, position: "F" },
      { name: "Fox", salary: 9, position: "D" },
      { name: "Bouchard", salary: 9, position: "D" },
      { name: "Schaefer", salary: 6, position: "D" },
      { name: "Chychrun", salary: 3, position: "D" },
      { name: "Forsberg", salary: 7, position: "F" },
      { name: "Tavares", salary: 2, position: "F" },
      { name: "Michkov", salary: 6, position: "F" },
    ],
    buyouts: [],
    retainedSalaries: [],
    profilePic: null,
  },
];

// Helper: default sort = forwards first (by salary desc), then defense (by salary desc)
function sortRosterDefault(roster = []) {
  const forwards = roster.filter((p) => p.position !== "D");
  const defense = roster.filter((p) => p.position === "D");

  forwards.sort((a, b) => (b.salary || 0) - (a.salary || 0));
  defense.sort((a, b) => (b.salary || 0) - (a.salary || 0));

  return [...forwards, ...defense];
}

const sortedInitialTeams = initialTeams.map((team) => ({
  ...team,
  roster: sortRosterDefault(team.roster || []),
}));
function getDefaultLeagueState() {
  return {
    teams: sortedInitialTeams,
    tradeProposals: [],
    freeAgents: [],
    leagueLog: [],
    tradeBlock: [],
settings: { frozen: false, managerLoginHistory: [] },
  };
}


function App() {

    // --- Phase 0 safety: prevent accidental "empty save" wipes ---
  const leagueStateLooksValid = (state) => {
    if (!state) return false;

    const teamsOk = Array.isArray(state.teams) && state.teams.length > 0;
    if (!teamsOk) return false;

    // "Seeded" check: at least one team has at least one roster player
    const hasAnyRosteredPlayer = state.teams.some(
      (t) => Array.isArray(t.roster) && t.roster.length > 0
    );
    if (!hasAnyRosteredPlayer) return false;

    return true;
  };

  const [leagueSettings, setLeagueSettings] = useState({ frozen: false });

  // --- Core league state ---
const [teams, setTeams] = useState(sortedInitialTeams);

  // Who is logged in?
  const [currentUser, setCurrentUser] = useState(null);

  // Selected team in the dropdown
  const [selectedTeamName, setSelectedTeamName] = useState(
    initialTeams[0]?.name || ""
  );

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


  useEffect(() => {
  const socket = socketIOClient(SOCKET_URL, {
  transports: ["websocket"],
});


  socket.on("connect", () => {
    console.log("[WS] connected:", socket.id);
  });

  socket.on("league:updated", () => {
    console.log("[WS] league updated → reloading");
    fetch(API_URL)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.teams)) setTeams(data.teams);
        if (Array.isArray(data.tradeProposals)) setTradeProposals(data.tradeProposals);
        if (Array.isArray(data.freeAgents)) setFreeAgents(data.freeAgents);
if (Array.isArray(data.leagueLog)) {
  setLeagueLog(data.leagueLog.filter((e) => e?.type !== "faBidRemoved"));
}
        if (Array.isArray(data.tradeBlock)) setTradeBlock(data.tradeBlock);
if (data?.settings) {
  setLeagueSettings({
    frozen: false,
    managerLoginHistory: [],
    ...data.settings,
  });
}

      })
      .catch((err) => console.error("[WS] reload failed:", err));
  });

  socket.on("disconnect", () => {
    console.log("[WS] disconnected");
  });

  return () => socket.disconnect();
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

      if (Array.isArray(data.teams)) setTeams(data.teams);
      if (Array.isArray(data.tradeProposals)) setTradeProposals(data.tradeProposals);
      if (Array.isArray(data.freeAgents)) setFreeAgents(data.freeAgents);
if (Array.isArray(data.leagueLog)) {
  const cleaned = data.leagueLog.filter((e) => e?.type !== "faBidRemoved");
  setLeagueLog(cleaned);
}
      if (Array.isArray(data.tradeBlock)) setTradeBlock(data.tradeBlock);
      if (data?.settings) setLeagueSettings(data.settings);


      // IMPORTANT: initialize lastSavedJson so autosave doesn't immediately fire
      lastSavedJsonRef.current = JSON.stringify({
        teams: Array.isArray(data.teams) ? data.teams : [],
        tradeProposals: Array.isArray(data.tradeProposals) ? data.tradeProposals : [],
        freeAgents: Array.isArray(data.freeAgents) ? data.freeAgents : [],
leagueLog: Array.isArray(data.leagueLog)
  ? data.leagueLog.filter((e) => e?.type !== "faBidRemoved")
  : [],
        tradeBlock: Array.isArray(data.tradeBlock) ? data.tradeBlock : [],
        settings: data?.settings || { frozen: false },

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
const saveLeagueToBackend = async (nextState) => {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextState),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    console.error("[SAVE] Failed to save league to backend:", err);
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

  // IMPORTANT: set this BEFORE the POST so the socket reload doesn't trigger another save
  lastSavedJsonRef.current = json;

  await saveLeagueToBackend(stateToSave);
}, 800);


  return () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  };
}, [hasLoaded, teams, tradeProposals, freeAgents, leagueLog, tradeBlock, leagueSettings, DISABLE_AUTOSAVE]);

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
      ? isTeamIllegal(myTeam, {
          capLimit: CAP_LIMIT,
          maxRosterSize: MAX_ROSTER_SIZE,
          minForwards: MIN_FORWARDS,
          minDefensemen: MIN_DEFENSEMEN,
        })
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
    teams.find((t) => t.name === selectedTeamName) || null;

  const canManageTeam = (teamName) => {
    if (!currentUser) return false;
    if (currentUser.role === "commissioner") return true;
    if (currentUser.role === "manager") {
      return currentUser.teamName === teamName;
    }
    return false;
  };

  // Update roster order for a team (used by drag & drop in TeamRosterPanel)
  const handleUpdateTeamRoster = (teamName, newRoster) => {
    setTeams((prev) =>
      prev.map((t) =>
        t.name === teamName ? { ...t, roster: newRoster } : t
      )
    );
  };

  // Buyout handler: remove player from roster, add penalty entry, log it
  const handleBuyout = (teamName, playerName) => {
    // 1) Figure out the penalty BEFORE changing state
    const team = teams.find((t) => t.name === teamName);
    let penalty = 0;

    if (team) {
      const player = (team.roster || []).find(
        (p) => p.name === playerName
      );
      if (player) {
        penalty = calculateBuyout(player.salary);
      }
    }

    // 2) Update the teams state (remove player from roster)
    setTeams((prev) =>
      prev.map((team) => {
        if (team.name !== teamName) return team;

        const newRoster = (team.roster || []).filter(
          (p) => p.name !== playerName
        );

        const buyouts = [
          ...(team.buyouts || []),
          {
            player: playerName,
            penalty,
          },
        ];

        return {
          ...team,
          roster: newRoster,
          buyouts,
        };
      })
    );

    // 3) Add a league log entry
    const now = Date.now();
    setLeagueLog((prev) => [
      {
        type: "buyout",
        id: now + Math.random(),
        team: teamName,
        player: playerName,
        penalty,
        timestamp: now,
      },
      ...prev,
    ]);
  };

  // Commissioner removes a player altogether (no penalty)
  const handleCommissionerRemovePlayer = (teamName, playerName) => {
    let newLogEntry = null;

    setTeams((prev) =>
      prev.map((team) => {
        if (team.name !== teamName) return team;

        const newRoster = (team.roster || []).filter(
          (p) => p.name !== playerName
        );

        newLogEntry = {
  id: Date.now() + Math.random(),
  type: "commRemovePlayer",
  team: team.name,
  player: playerName,
  timestamp: Date.now(),
};


        return {
          ...team,
          roster: newRoster,
        };
      })
    );

    if (newLogEntry) {
      setLeagueLog((prev) => [newLogEntry, ...prev]);
    }
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

  // optional safety confirm (recommended)
  const ok = window.confirm("Delete this activity log entry? This cannot be undone.");
  if (!ok) return;

  setLeagueLog((prev) => removeOneLogEntry(prev, entry));
};

  // Manager profile picture upload
  const handleManagerProfileImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser || currentUser.role !== "manager") return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;

      setTeams((prev) =>
        prev.map((team) =>
          team.name === currentUser.teamName
            ? { ...team, profilePic: dataUrl }
            : team
        )
      );
    };
    reader.readAsDataURL(file);
  };

   // --- Trade submission from draft (from TeamRosterPanel / TeamToolsPanel) ---
  const handleSubmitTradeDraft = (draft) => {
    if (!draft) return;

    const fromTeamObj = teams.find((t) => t.name === draft.fromTeam);
    const toTeamObj = teams.find((t) => t.name === draft.toTeam);

    const validation = validateTradeDraft({
      tradeDraft: draft,
      fromTeamObj,
      toTeamObj,
      existingProposals: tradeProposals,
      maxRetentionSpots: 3,
    });

    if (!validation.ok) {
      if (validation.errorMessage) {
        window.alert(validation.errorMessage);
      }
      return;
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
      existingTrades: tradeProposals,
    });

    setTradeProposals((prev) => [newTrade, ...prev]);

    // Build per-player details for logging (based on current rosters)
    const offeredDetails = (newTrade.offeredPlayers || []).map((name) => {
      const p =
        (fromTeamObj?.roster || []).find((pl) => pl.name === name) || null;
      const baseSalary = p ? Number(p.salary) || 0 : 0;
      const retainedAmount =
        Number(newTrade.retentionFrom?.[name] || 0) || 0;
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
      const retainedAmount =
        Number(newTrade.retentionTo?.[name] || 0) || 0;
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

    // Log it in league history as a proposed trade
    setLeagueLog((prev) => [
      {
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
      },
      ...prev,
    ]);

    // Clear draft
    setTradeDraft(null);
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
  const trimmedPlayer = (player || "").trim();
  if (!trimmedPlayer || !team) return;

  const trimmedNeeds = (needs || "").trim();

  setTradeBlock((prev) => {
    // Remove any existing entry for this team + player to avoid duplicates
    const filtered = prev.filter(
      (e) =>
        !(
          e.team === team &&
          e.player.toLowerCase() === trimmedPlayer.toLowerCase()
        )
    );

    return [
      {
        id: Date.now() + Math.random(),
        team,
        player: trimmedPlayer,
        needs: trimmedNeeds,
      },
      ...filtered,
    ];
  });
};


  const handleRemoveTradeBlockEntry = (entryId) => {
    setTradeBlock((prev) => prev.filter((e) => e.id !== entryId));
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

  const result = placeFreeAgentBid({
    teams,
    freeAgents,
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
    if (result.errorMessage) {
      window.alert(result.errorMessage);
    }
    return;
  }

  setFreeAgents(result.nextFreeAgents);
  if (result.logEntry) {
    setLeagueLog((prev) => [result.logEntry, ...prev]);
  }

  if (result.warningMessage) {
    window.alert(result.warningMessage);
  }
};
// Commissioner resolves all active auctions
const handleResolveAuctions = () => {
  if (!currentUser || currentUser.role !== "commissioner") {
    window.alert("Only the commissioner can resolve auctions.");
    return;
  }

  const result = resolveAuctions({
    teams,
    freeAgents,
    capLimit: CAP_LIMIT,
    maxRosterSize: MAX_ROSTER_SIZE,
    minForwards: MIN_FORWARDS,
    minDefensemen: MIN_DEFENSEMEN,
  });

  // Update teams and freeAgents
  setTeams(result.nextTeams);
  setFreeAgents(result.nextFreeAgents);

  // Log successful signings
  if (result.newLogs && result.newLogs.length > 0) {
    setLeagueLog((prev) => [...result.newLogs, ...prev]);
  }

  if (result.newLogs && result.newLogs.length > 0) {
    window.alert("Auctions resolved. Check League Activity for signings.");
  } else {
    window.alert("No active auctions to resolve.");
  }
};
// Commissioner can remove a specific bid (e.g. typo)
const handleCommissionerRemoveBid = (bidId) => {
  if (!currentUser || currentUser.role !== "commissioner") {
    window.alert("Only the commissioner can remove bids.");
    return;
  }

  const { nextFreeAgents, removedBid } = removeAuctionBidById(
    freeAgents,
    bidId
  );

  setFreeAgents(nextFreeAgents);

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
  
 // Record manager login (keep only last 10)
if (nextUser.role === "manager" && typeof setLeagueSettings === "function") {
  const now = Date.now();
  const entry = {
    id: now + Math.random(),
    type: "managerLogin",
    teamName: nextUser.teamName,
    timestamp: now,
  };

  setLeagueSettings((prev) => {
    const base = prev || { frozen: false, managerLoginHistory: [] };
    const history = Array.isArray(base.managerLoginHistory)
      ? base.managerLoginHistory
      : [];

    // Optional: avoid immediate duplicates (same team logging in twice instantly)
    const deduped = history.filter(
      (e) => !(e?.teamName === entry.teamName && e?.timestamp === entry.timestamp)
    );

    return { ...base, managerLoginHistory: [entry, ...deduped].slice(0, 10) };
  });
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
      />
      

      {/* FULL WIDTH: Commissioner Panel (NOT inside the grid) */}
      <div style={{ marginTop: "12px", marginBottom: "12px" }}>
        <CommissionerPanel
          currentUser={currentUser}
          apiUrl={API_URL}
          teams={teams}
          setTeams={setTeams}
          tradeProposals={tradeProposals}
          setTradeProposals={setTradeProposals}
          freeAgents={freeAgents}
          setFreeAgents={setFreeAgents}
          leagueLog={leagueLog}
          setLeagueLog={setLeagueLog}
          tradeBlock={tradeBlock}
          setTradeBlock={setTradeBlock}
          onResolveAuctions={handleResolveAuctions}
          onCommissionerRemoveBid={handleCommissionerRemoveBid}
          getDefaultLeagueState={getDefaultLeagueState}
          leagueSettings={leagueSettings}
          setLeagueSettings={setLeagueSettings}
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
