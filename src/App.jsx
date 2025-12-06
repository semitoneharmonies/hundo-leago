import React, { useState, useEffect } from "react";
import "./App.css";

const CAP_LIMIT = 100;
const MAX_ROSTER_SIZE = 15;
const MIN_FORWARDS = 8;
const MIN_DEFENSEMEN = 4;
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
const STORAGE_KEY = "hundo-leago-state-v1";
const API_URL = "https://hundo-leago-backend.onrender.com/api/league";
const SNAPSHOTS_API_URL = "https://hundo-leago-backend.onrender.com/api/snapshots";



// Very simple "login" setup – front-end only
const managers = [
  { teamName: "Pacino Amigo", role: "manager", password: "pacino123" },
  { teamName: "Bottle O Draino", role: "manager", password: "draino123" },
  { teamName: "Imano Lizzo", role: "manager", password: "lizzo123" },
  { teamName: "El Camino", role: "manager", password: "camino123" },
  { teamName: "DeNiro Amigo", role: "manager", password: "deniro123" },
  { teamName: "Champino", role: "manager", password: "champ123" },
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
  },
];

// ---- Helpers for weekly deadlines ----

// Next Sunday at 4:00 PM PT (using browser local time as PT)
function getNextSundayDeadline(from = new Date()) {
  const d = new Date(from);
  const day = d.getDay(); // 0 = Sunday
  const daysUntilSunday = (7 - day) % 7;
  const candidate = new Date(d);
  candidate.setDate(candidate.getDate() + daysUntilSunday);
  candidate.setHours(16, 0, 0, 0); // 4:00 PM

  if (candidate <= d) {
    candidate.setDate(candidate.getDate() + 7);
  }

  return candidate;
}

// Cutoff for starting new auctions = Thursday 11:59 PM before that Sunday
function getNewAuctionCutoff(nextSundayDeadline) {
  const cutoff = new Date(nextSundayDeadline);
  cutoff.setDate(cutoff.getDate() - 3); // Thursday
  cutoff.setHours(23, 59, 59, 999);
  return cutoff;
}

export default function App() {
    console.log("[DEBUG] App rendered");

  const [teams, setTeams] = useState(initialTeams);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [freeAgents, setFreeAgents] = useState([]);
  const [bidPlayer, setBidPlayer] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [bidPosition, setBidPosition] = useState("F");
  const [sortMode, setSortMode] = useState("none");
  const [dragFromIndex, setDragFromIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [loginTeam, setLoginTeam] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // League-wide history of activity
  const [leagueLog, setLeagueLog] = useState([]);

  // For quick bids in "Active Auctions"
  const [auctionBidAmounts, setAuctionBidAmounts] = useState({});

  // Commissioner bid-view toggle
  const [showCommissionerBids, setShowCommissionerBids] = useState(false);

  // Commissioner tool states
  const [commTeamForAdd, setCommTeamForAdd] = useState("");
  const [commPlayerNameForAdd, setCommPlayerNameForAdd] =
    useState("");
  const [commPlayerSalaryForAdd, setCommPlayerSalaryForAdd] =
    useState("");
  const [commPlayerPositionForAdd, setCommPlayerPositionForAdd] =
    useState("F");

  const [commEditTeam, setCommEditTeam] = useState("");
  const [commEditPlayerName, setCommEditPlayerName] = useState("");
  const [commEditNewSalary, setCommEditNewSalary] = useState("");
  const [commEditNewPosition, setCommEditNewPosition] = useState("");

  const [commPenaltyTeam, setCommPenaltyTeam] = useState("");
  const [commPenaltyPlayerName, setCommPenaltyPlayerName] =
    useState("");
  const [commPenaltyAmount, setCommPenaltyAmount] = useState("");
  const [commPenaltyTeamRemove, setCommPenaltyTeamRemove] =
    useState("");
  const [commPenaltyPlayerRemove, setCommPenaltyPlayerRemove] =
    useState("");
    const [snapshots, setSnapshots] = useState([]);
const [snapshotsLoading, setSnapshotsLoading] = useState(false);
const [snapshotsError, setSnapshotsError] = useState("");
const [selectedSnapshotId, setSelectedSnapshotId] = useState("");


  // Weekly processing & countdown
  const [nextAuctionDeadline, setNextAuctionDeadline] = useState(() =>
    getNextSundayDeadline()
  );
  const [timeRemainingMs, setTimeRemainingMs] = useState(null);

  // Trading
  // tradeDraft may contain:
  // { fromTeam, toTeam, requestedPlayers, offeredPlayers, penaltyFrom, penaltyTo }
  const [tradeDraft, setTradeDraft] = useState(null);
  const [tradeProposals, setTradeProposals] = useState([]);

  // History filter + illegal roster flags + auction details
  const [historyFilter, setHistoryFilter] = useState("all"); // "all" | "trades"
  const [illegalTeams, setIllegalTeams] = useState([]);
  const [auctionDetailsPlayer, setAuctionDetailsPlayer] = useState(null);
const [hasLoaded, setHasLoaded] = useState(false);

// ---- Load league from backend (with fallback + seeding) ----
async function loadLeagueFromBackend() {
  let loadedFromServer = false;

  try {
    console.log("[LOAD] Fetching league from backend:", API_URL);
    const res = await fetch(API_URL);

    if (res.ok) {
      const data = await res.json();
      console.log("[LOAD] Backend responded with:", data);

      let stateToUse = data;

      // 🧊 If backend is "empty" (first time deploy), seed it with defaults
      const isEmpty =
        !data.teams || !Array.isArray(data.teams) || data.teams.length === 0;

      if (isEmpty) {
        console.log(
          "[LOAD] Backend has no teams yet. Seeding with initialTeams."
        );
        const seeded = {
          teams: initialTeams,
          freeAgents: [],
          leagueLog: [],
          tradeProposals: [],
          nextAuctionDeadline: getNextSundayDeadline(),
        };

        stateToUse = seeded;

        // Try to POST this default state back to backend so everyone shares it
        try {
          await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...seeded,
              nextAuctionDeadline: seeded.nextAuctionDeadline.toISOString(),
            }),
          });
          console.log("[LOAD] Seeded backend with default league state.");
        } catch (err) {
          console.warn("[LOAD] Failed to seed backend with defaults", err);
        }
      }

      // Apply state from backend (or seeded defaults)
      setTeams(stateToUse.teams || []);
      setFreeAgents(stateToUse.freeAgents || []);
      setLeagueLog(stateToUse.leagueLog || []);
      setTradeProposals(stateToUse.tradeProposals || []);

      if (stateToUse.nextAuctionDeadline) {
        setNextAuctionDeadline(new Date(stateToUse.nextAuctionDeadline));
      } else {
        const deadline = getNextSundayDeadline();
        setNextAuctionDeadline(deadline);
      }

      // Cache locally as backup
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            teams: stateToUse.teams || [],
            freeAgents: stateToUse.freeAgents || [],
            leagueLog: stateToUse.leagueLog || [],
            tradeProposals: stateToUse.tradeProposals || [],
            nextAuctionDeadline: (
              stateToUse.nextAuctionDeadline
                ? new Date(stateToUse.nextAuctionDeadline)
                : getNextSundayDeadline()
            ).toISOString(),
          })
        );
      } catch (err) {
        console.error("[LOAD] Failed to cache league state locally", err);
      }

      loadedFromServer = true;
    } else {
      console.warn(
        "[LOAD] Backend responded with non-OK status:",
        res.status,
        res.statusText
      );
    }
  } catch (err) {
    console.warn(
      "[LOAD] Failed to reach backend, will fall back to localStorage/defaults",
      err
    );
  }

  // 🔁 Fallback: localStorage, then hardcoded defaults
  if (!loadedFromServer) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        console.log("[LOAD] Loaded state from localStorage:", data);

        setTeams(data.teams && Array.isArray(data.teams) ? data.teams : initialTeams);
        setFreeAgents(data.freeAgents || []);
        setLeagueLog(data.leagueLog || []);
        setTradeProposals(data.tradeProposals || []);
        if (data.nextAuctionDeadline) {
          setNextAuctionDeadline(new Date(data.nextAuctionDeadline));
        } else {
          setNextAuctionDeadline(getNextSundayDeadline());
        }
      } else {
        console.log(
          "[LOAD] No localStorage backup found. Using frontend defaults."
        );
        setTeams(initialTeams);
        setFreeAgents([]);
        setLeagueLog([]);
        setTradeProposals([]);
        setNextAuctionDeadline(getNextSundayDeadline());
      }
    } catch (err) {
      console.error(
        "[LOAD] Failed to load from localStorage. Using pure defaults.",
        err
      );
      setTeams(initialTeams);
      setFreeAgents([]);
      setLeagueLog([]);
      setTradeProposals([]);
      setNextAuctionDeadline(getNextSundayDeadline());
    }
  }

  setHasLoaded(true);
  console.log("[LOAD] Initial load complete, hasLoaded = true");
}

  // ---- Load saved league from localStorage (if any) ----
  // ---- Load saved league from backend (with localStorage fallback) ----
// Load league data from backend on startup
useEffect(() => {
  loadLeagueFromBackend();
}, []);





  // ---- Persist league state to localStorage ----
 // ---- Persist league state to backend (and localStorage) ----
// ---- Persist league state to backend (and localStorage) ----
// ---- Persist league state to backend (and localStorage) ----
useEffect(() => {
  console.log("[DEBUG] save effect triggered", {
    hasLoaded,
    teamsCount: teams.length,
    freeAgentsCount: freeAgents.length,
    logCount: leagueLog.length,
    tradesCount: tradeProposals.length,
    hasDeadline: !!nextAuctionDeadline,
  });

  // ⛔️ Do not save until initial load is finished
  if (!hasLoaded) {
    console.log("[PERSIST] Skipping save because initial load is not finished yet.");
    return;
  }

  const save = async () => {
    if (!nextAuctionDeadline) {
      console.warn("[PERSIST] nextAuctionDeadline is null, skipping save");
      return;
    }

    const data = {
      teams,
      freeAgents,
      leagueLog,
      tradeProposals,
      nextAuctionDeadline: nextAuctionDeadline.toISOString(),
    };

    console.log("[PERSIST] Saving league state to backend...", data);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        console.error(
          "[PERSIST] Backend responded with non-OK status:",
          res.status,
          res.statusText
        );
      } else {
        console.log("[PERSIST] Save successful.");
      }
    } catch (err) {
      console.error("Failed to save league state to backend", err);
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error("Failed to save league state locally", err);
    }
  };

  save();
}, [
  hasLoaded,              // 🔥 add this dependency
  teams,
  freeAgents,
  leagueLog,
  tradeProposals,
  nextAuctionDeadline,
]);



  useEffect(() => {
    const update = () => {
      const now = new Date();
      let deadline = nextAuctionDeadline;

      if (now >= deadline) {
        deadline = getNextSundayDeadline(now);
        setNextAuctionDeadline(deadline);
      }

      setTimeRemainingMs(deadline - now);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [nextAuctionDeadline]);

  // Keep track of which teams currently have illegal rosters (for flags)
  useEffect(() => {
    const computeIllegalTeams = (teamsArr) => {
      const result = [];
      teamsArr.forEach((t) => {
        const cap = totalCap(t);
        const size = t.roster.length;
        const pos = countPositions(t);
        if (
          cap > CAP_LIMIT ||
          size > MAX_ROSTER_SIZE ||
          pos.F < MIN_FORWARDS ||
          pos.D < MIN_DEFENSEMEN
        ) {
          result.push(t.name);
        }
      });
      return result;
    };

    setIllegalTeams(computeIllegalTeams(teams));
  }, [teams]);
  // Auto-expire pending trades after 7 days
  useEffect(() => {
    const now = Date.now();
    const expired = tradeProposals.filter(
      (tr) =>
        tr.status === "pending" &&
        tr.expiresAt &&
        now > tr.expiresAt
    );
    if (expired.length === 0) return;

    // Mark expired trades as cancelled + expired
    setTradeProposals((prev) =>
      prev.map((tr) => {
        if (
          tr.status === "pending" &&
          tr.expiresAt &&
          now > tr.expiresAt
        ) {
          return { ...tr, status: "cancelled", expired: true };
        }
        return tr;
      })
    );

    // Log expiration events
    const logs = expired.map((tr) => ({
      type: "tradeExpired",
      id: now + Math.random(),
      fromTeam: tr.fromTeam,
      toTeam: tr.toTeam,
      requestedPlayers: [...tr.requestedPlayers],
      offeredPlayers: [...tr.offeredPlayers],
      timestamp: now,
    }));

    setLeagueLog((prev) => [...logs, ...prev]);
  }, [tradeProposals]);

  useEffect(() => {
  if (currentUser && currentUser.role === "commissioner") {
    fetchSnapshots();
  }
}, [currentUser]);

  // Buyout penalty calculation
  const calculateBuyout = (salary) => {
    if (salary === 1) return 0;
    return Math.ceil(salary * 0.25);
  };

  // Total cap of a team = roster salaries + buyout penalties
  const totalCap = (team) => {
  if (!team) return 0;

  const rosterCap = team.roster.reduce((sum, p) => sum + p.salary, 0);
  const buyoutCap = (team.buyouts || []).reduce(
    (sum, b) => sum + b.penalty,
    0
  );
  const retainedCap = (team.retainedSalaries || []).reduce(
    (sum, r) => sum + (r.amount || 0),
    0
  );

  return rosterCap + buyoutCap + retainedCap;
};


   // Total buyout penalty (for trading, and summary)
  const totalBuyoutPenalty = (team) => {
    if (!team) return 0;
    return (team.buyouts || []).reduce((sum, b) => sum + b.penalty, 0);
  };
  
// How many retained-salary *players* this team currently has
// We store retained salary as buyout entries with `retained: true`
const countRetentionSpots = (team) => {
  if (!team) return 0;

  const buyouts = team.buyouts || [];

  const players = new Set(
    buyouts
      .filter((b) => b.retained && b.penalty && b.penalty > 0)
      .map((b) => b.player)
  );

  return players.size;
};


// Find pending trades that involve this player for this team
const findPendingTradesWithPlayer = (teamName, playerName) => {
  if (!playerName) return [];
  return tradeProposals.filter((tr) => {
    if (tr.status !== "pending") return false;

    // Player being OFFERED by this team
    if (
      tr.fromTeam === teamName &&
      tr.offeredPlayers.includes(playerName)
    ) {
      return true;
    }

    // Player being REQUESTED from this team
    if (
      tr.toTeam === teamName &&
      tr.requestedPlayers.includes(playerName)
    ) {
      return true;
    }

    return false;
  });
};

  // Position counts helper
  const countPositions = (team) => {
    if (!team) return { F: 0, D: 0 };
    return team.roster.reduce(
      (acc, p) => {
        const pos = p.position || "F";
        if (pos === "D") acc.D += 1;
        else acc.F += 1;
        return acc;
      },
      { F: 0, D: 0 }
    );
  };

  // 🔒 New helper: is this player already on a roster?
const isPlayerOnAnyRoster = (playerName) => {
  if (!playerName) return false;
  const lower = playerName.toLowerCase();

  return teams.some((t) =>
    t.roster.some((p) => (p.name || "").toLowerCase() === lower)
  );
};


  // Permission helper: who can manage a given team
  const canManageTeam = (teamName) =>
    currentUser &&
    (currentUser.role === "commissioner" || currentUser.teamName === teamName);

  // Cap info for the currently logged-in manager (main inputs)
  const getCurrentUserCapInfo = () => {
    if (!currentUser || currentUser.role !== "manager") return null;
    const team = teams.find((t) => t.name === currentUser.teamName);
    if (!team) return null;

    const currentCap = totalCap(team);
    const projectedCap =
      bidAmount !== "" ? currentCap + Number(bidAmount) : null;

    return { currentCap, projectedCap };
  };

  const capInfo = getCurrentUserCapInfo();

  // Unique players that currently have unresolved auctions
  const activeAuctions = Array.from(
    new Set(
      freeAgents
        .filter((fa) => !fa.resolved)
        .map((fa) => fa.player)
    )
  );

  const newAuctionCutoff = getNewAuctionCutoff(nextAuctionDeadline);

  // For "Active Auctions" quick input
  const handleAuctionBidChange = (player, value) => {
    setAuctionBidAmounts((prev) => ({
      ...prev,
      [player]: value,
    }));
  };

  // Handle free agent bid from main inputs (starting a new auction)
    // Handle free agent bid from main inputs (starting a new auction)
  const submitBid = () => {
    if (!currentUser || currentUser.role !== "manager") {
      alert("You must be logged in as your team to place a bid.");
      return;
    }

    const now = new Date();
    if (now > newAuctionCutoff) {
      alert(
        "New free agent auctions are closed for this week's run.\n\n" +
          "You can still place bids on existing auctions until Sunday at 4:00 PM,\n" +
          "but new players can only be put up for auction for the *next* week."
      );
      return;
    }

    if (!bidPlayer || !bidAmount) return;

    const trimmedName = bidPlayer.trim();

    // 🔒 New rule: players currently on any roster cannot be auctioned
    if (isPlayerOnAnyRoster(trimmedName)) {
      alert(
        `${trimmedName} is currently on a team roster and cannot be put up for free agent auction.`
      );
      return;
    }

    const teamName = currentUser.teamName;
    const team = teams.find((t) => t.name === teamName);
    if (!team) return;

    const amountNum = Number(bidAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid positive bid amount.");
      return;
    }

    const totalAfterBid = totalCap(team) + amountNum;
    if (totalAfterBid > CAP_LIMIT) {
      const overBy = totalAfterBid - CAP_LIMIT;
      alert(
        `Note: if you win this bid, ${teamName} will be OVER the cap by $${overBy}. ` +
          `You'll need to buy out players to get back under $${CAP_LIMIT}.`
      );
    }


    setFreeAgents((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        player: bidPlayer,
        team: teamName,
        amount: Number(bidAmount),
        position: bidPosition,
        assigned: false,
        resolved: false,
      },
    ]);

    setBidPlayer("");
    setBidAmount("");
    setBidPosition("F");
  };

  // Handle quick bid from Active Auctions box
    const submitAuctionBid = (player) => {
    if (!currentUser || currentUser.role !== "manager") {
      alert("You must be logged in as a team manager to place a bid.");
      return;
    }

    // Optional safety: don't allow new bids on a player who is now on a roster
    if (isPlayerOnAnyRoster(player)) {
      alert(
        `${player} is currently on a team roster. This auction should be cancelled by the commissioner.`
      );
      return;
    }


    const amountStr = auctionBidAmounts[player];
    if (!amountStr) {
      alert("Please enter your bid amount first.");
      return;
    }

    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid bid amount.");
      return;
    }

    const teamName = currentUser.teamName;
    const team = teams.find((t) => t.name === teamName);
    if (!team) return;

    const totalAfterBid = totalCap(team) + amount;
    if (totalAfterBid > CAP_LIMIT) {
      const overBy = totalAfterBid - CAP_LIMIT;
      alert(
        `Note: if you win this bid, ${teamName} will be OVER the cap by $${overBy}. ` +
          `You'll need to buy out players to get back under $${CAP_LIMIT}.`
      );
    }

    const baseEntry =
      freeAgents.find((f) => f.player === player && !f.resolved) ||
      freeAgents.find((f) => f.player === player);
    const position = baseEntry?.position || "F";

    setFreeAgents((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        player,
        team: teamName,
        amount,
        position,
        assigned: false,
        resolved: false,
      },
    ]);

    setAuctionBidAmounts((prev) => ({
      ...prev,
      [player]: "",
    }));
  };

  // Resolve bids (commissioner only)
  const resolveBids = () => {
    if (!currentUser || currentUser.role !== "commissioner") {
      alert("Only the commissioner can resolve bids.");
      return;
    }

    if (freeAgents.length === 0) return;

    const newLogs = [];

    let updatedTeams = teams.map((t) => ({
      ...t,
      roster: [...t.roster],
    }));

    const updatedFreeAgents = [...freeAgents];

    const bidsByPlayer = freeAgents.reduce((acc, bid, index) => {
      if (bid.resolved) return acc;
      if (!acc[bid.player]) acc[bid.player] = [];
      acc[bid.player].push({ ...bid, index });
      return acc;
    }, {});

    Object.keys(bidsByPlayer).forEach((playerName) => {
      const bids = bidsByPlayer[playerName];
      if (bids.length === 0) return;

      const highest = Math.max(...bids.map((b) => b.amount));
      const topBidders = bids.filter((b) => b.amount === highest);

      if (topBidders.length === 1) {
        const winnerBid = topBidders[0];
        const winnerTeam = winnerBid.team;
        const winningAmount = winnerBid.amount;
        const position = winnerBid.position || "F";

        updatedTeams = updatedTeams.map((t) => {
          if (t.name !== winnerTeam) return t;
          const lockUntil = Date.now() + TWO_WEEKS_MS;
          return {
            ...t,
            roster: [
              ...t.roster,
              {
                name: playerName,
                salary: winningAmount,
                position,
                buyoutLockedUntil: lockUntil,
              },
            ],
          };
        });

        bids.forEach((b) => {
          updatedFreeAgents[b.index] = {
            ...updatedFreeAgents[b.index],
            resolved: true,
            assigned: b.team === winnerTeam,
          };
        });

        newLogs.push({
          type: "claim",
          team: winnerTeam,
          player: playerName,
          amount: winningAmount,
          position,
          id: Date.now() + Math.random(),
          timestamp: Date.now(),
        });
      } else {
        bids.forEach((b) => {
          updatedFreeAgents[b.index] = {
            ...updatedFreeAgents[b.index],
            resolved: true,
            assigned: false,
          };
        });
      }
    });

    const capWarnings = [];
    const rosterSizeWarnings = [];
    const positionWarnings = [];

    updatedTeams.forEach((t) => {
      const cap = totalCap(t);
      const size = t.roster.length;
      const posCounts = countPositions(t);

      if (cap > CAP_LIMIT) {
        const overBy = cap - CAP_LIMIT;
        capWarnings.push({ team: t.name, cap, overBy });
        newLogs.push({
          type: "capWarning",
          team: t.name,
          overBy,
          capAfter: cap,
          id: Date.now() + Math.random(),
          timestamp: Date.now(),
        });
      }

      if (size > MAX_ROSTER_SIZE) {
        const overBy = size - MAX_ROSTER_SIZE;
        rosterSizeWarnings.push({ team: t.name, size, overBy });
        newLogs.push({
          type: "rosterSizeWarning",
          team: t.name,
          overBy,
          sizeAfter: size,
          id: Date.now() + Math.random(),
          timestamp: Date.now(),
        });
      }

      const missingF = Math.max(0, MIN_FORWARDS - posCounts.F);
      const missingD = Math.max(0, MIN_DEFENSEMEN - posCounts.D);
      if (missingF > 0 || missingD > 0) {
        positionWarnings.push({
          team: t.name,
          forwards: posCounts.F,
          defensemen: posCounts.D,
          missingF,
          missingD,
        });
        newLogs.push({
          type: "positionWarning",
          team: t.name,
          forwards: posCounts.F,
          defensemen: posCounts.D,
          missingF,
          missingD,
          id: Date.now() + Math.random(),
          timestamp: Date.now(),
        });
      }
    });

    setTeams(updatedTeams);
    setFreeAgents(updatedFreeAgents);

    if (newLogs.length > 0) {
      setLeagueLog((prev) => [...newLogs, ...prev]);
    }

    if (
      capWarnings.length > 0 ||
      rosterSizeWarnings.length > 0 ||
      positionWarnings.length > 0
    ) {
      let message = "";

      if (capWarnings.length > 0) {
        message +=
          "Some teams are OVER the salary cap after resolving bids:\n\n" +
          capWarnings
            .map(
              (w) =>
                `${w.team}: $${w.cap} total cap (over by $${w.overBy})`
            )
            .join("\n") +
          "\n\nThey must buy out players to become cap compliant.\n\n";
      }

      if (rosterSizeWarnings.length > 0) {
        message +=
          "Some teams are OVER the roster size limit after resolving bids:\n\n" +
          rosterSizeWarnings
            .map(
              (w) =>
                `${w.team}: ${w.size} players (over by ${w.overBy})`
            )
            .join("\n") +
          "\n\nThey must buy out players to get back to 15.\n\n";
      }

      if (positionWarnings.length > 0) {
        message +=
          "Some teams do not meet positional minimums after resolving bids:\n\n" +
          positionWarnings
            .map((w) => {
              const parts = [];
              if (w.missingF > 0) {
                parts.push(
                  `${w.forwards} F (short by ${w.missingF}, min ${MIN_FORWARDS})`
                );
              }
              if (w.missingD > 0) {
                parts.push(
                  `${w.defensemen} D (short by ${w.missingD}, min ${MIN_DEFENSEMEN})`
                );
              }
              return `${w.team}: ${parts.join(" & ")}`;
            })
            .join("\n");
      }

      alert(message);
    }
  };

  // Handle buyout
  // Handle buyout
const handleBuyout = (teamName, playerName) => {
  let createdLogEntry = null;
  let tradesToCancelIds = [];

  const updatedTeams = teams.map((t) => {
    if (t.name !== teamName) return t;

    const player = t.roster.find((p) => p.name === playerName);
    if (!player) return t;

    // 🔒 Check for pending trades involving this player
    const pendingTrades = findPendingTradesWithPlayer(teamName, playerName);
    if (pendingTrades.length > 0) {
      const okToCancel = window.confirm(
        `${playerName} is currently included in ${pendingTrades.length} pending trade(s).\n\n` +
          "If you proceed with this buyout, those trades will be automatically cancelled.\n\n" +
          "Do you want to continue and cancel those trades?"
      );
      if (!okToCancel) return t;

      tradesToCancelIds = pendingTrades.map((tr) => tr.id);
    }

    if (
      player.buyoutLockedUntil &&
      player.buyoutLockedUntil > Date.now()
    ) {
      const unlockDate = new Date(player.buyoutLockedUntil);
      alert(
        `${playerName} cannot be bought out until ` +
          `${unlockDate.toLocaleDateString()} at ${unlockDate.toLocaleTimeString()}.`
      );
      return t;
    }

    const posCounts = countPositions(t);
    const pos = player.position || "F";
    const newCounts =
      pos === "D"
        ? { ...posCounts, D: posCounts.D - 1 }
        : { ...posCounts, F: posCounts.F - 1 };

    if (newCounts.F < MIN_FORWARDS || newCounts.D < MIN_DEFENSEMEN) {
      const reasons = [];
      if (newCounts.F < MIN_FORWARDS) {
        reasons.push(
          `you would have only ${newCounts.F} forwards (min ${MIN_FORWARDS})`
        );
      }
      if (newCounts.D < MIN_DEFENSEMEN) {
        reasons.push(
          `you would have only ${newCounts.D} defensemen (min ${MIN_DEFENSEMEN})`
        );
      }
      alert(
        `You cannot buy out ${playerName} because ${reasons.join(
          " and "
        )}.`
      );
      return t;
    }

    const penalty = calculateBuyout(player.salary);

    const currentTotal = totalCap(t);
    const newTotal = currentTotal - player.salary + penalty;

    const confirmMsg =
      penalty > 0
        ? `Buy out ${playerName} for a cap penalty of $${penalty}.\n\n` +
          `Total cap would go from $${currentTotal} to $${newTotal}.\n\nProceed?`
        : `Buy out ${playerName} (no cap penalty).\n\n` +
          `Total cap would go from $${currentTotal} to $${newTotal}.\n\nProceed?`;

    const ok = window.confirm(confirmMsg);
    if (!ok) return t;

    const newRoster = t.roster.filter((p) => p.name !== playerName);
    const existingBuyouts = t.buyouts || [];
    const newBuyouts =
      penalty > 0
        ? [...existingBuyouts, { player: playerName, penalty }]
        : existingBuyouts;

    createdLogEntry = {
      type: "buyout",
      team: teamName,
      player: playerName,
      penalty,
      beforeCap: currentTotal,
      afterCap: newTotal,
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
    };

    return {
      ...t,
      roster: newRoster,
      buyouts: newBuyouts,
    };
  });

  if (!createdLogEntry) return;

  // Apply team changes
  setTeams(updatedTeams);

  // Build logs (buyout + any auto-cancelled trades)
  const extraTradeLogs =
    tradesToCancelIds.length > 0
      ? tradesToCancelIds.map((tradeId) => ({
          type: "tradeAutoCancelled",
          tradeId,
          reason: "playerMovedOrBoughtOut",
          id: Date.now() + Math.random(),
          timestamp: Date.now(),
        }))
      : [];

  // Mark affected trades as cancelled
  if (tradesToCancelIds.length > 0) {
    setTradeProposals((prev) =>
      prev.map((tr) =>
        tradesToCancelIds.includes(tr.id)
          ? { ...tr, status: "cancelled", autoCancelled: true }
          : tr
      )
    );
  }

  setLeagueLog((prev) => [
    ...extraTradeLogs,
    createdLogEntry,
    ...prev,
  ]);
};


  // ---- Commissioner tools ----

  const commissionerCancelAuction = (playerName) => {
    if (!currentUser || currentUser.role !== "commissioner") return;

    const hasActive = freeAgents.some(
      (fa) => fa.player === playerName && !fa.resolved
    );
    if (!hasActive) return;

    if (
      !window.confirm(
        `Cancel all active bids for ${playerName}? This will remove the auction and all bids.`
      )
    ) {
      return;
    }

    setFreeAgents((prev) =>
      prev.filter(
        (fa) => !(fa.player === playerName && !fa.resolved)
      )
    );

    setLeagueLog((prev) => [
      {
        type: "auctionCancelled",
        player: playerName,
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
      },
      ...prev,
    ]);
  };

  const commissionerRemoveBid = (bidId) => {
    if (!currentUser || currentUser.role !== "commissioner") return;
    setFreeAgents((prev) => prev.filter((fa) => fa.id !== bidId));
  };

  const commissionerRemovePlayer = (teamName, playerName) => {
  if (!currentUser || currentUser.role !== "commissioner") return;

  // 🔒 Check for pending trades involving this player
  const pendingTrades = findPendingTradesWithPlayer(teamName, playerName);
  let tradesToCancelIds = [];

  if (pendingTrades.length > 0) {
    const okToCancel = window.confirm(
      `${playerName} is currently included in ${pendingTrades.length} pending trade(s).\n\n` +
        "If you remove this player, those trades will be automatically cancelled.\n\n" +
        "Do you want to continue and cancel those trades?"
    );
    if (!okToCancel) return;

    tradesToCancelIds = pendingTrades.map((tr) => tr.id);
  }

  if (
    !window.confirm(
      `Remove ${playerName} from ${teamName}'s roster? No cap penalty will be applied.`
    )
  ) {
    return;
  }

  const newTeams = teams.map((t) => {
    if (t.name !== teamName) return t;
    const exists = t.roster.some((p) => p.name === playerName);
    if (!exists) return t;
    return {
      ...t,
      roster: t.roster.filter((p) => p.name !== playerName),
    };
  });

  setTeams(newTeams);

  // Update trades if needed
  if (tradesToCancelIds.length > 0) {
    setTradeProposals((prev) =>
      prev.map((tr) =>
        tradesToCancelIds.includes(tr.id)
          ? { ...tr, status: "cancelled", autoCancelled: true }
          : tr
      )
    );

    const tradeLogs = tradesToCancelIds.map((tradeId) => ({
      type: "tradeAutoCancelled",
      tradeId,
      reason: "playerMovedOrBoughtOut",
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
    }));

    setLeagueLog((prev) => [
      ...tradeLogs,
      {
        type: "commRemovePlayer",
        team: teamName,
        player: playerName,
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
      },
      ...prev,
    ]);
  } else {
    setLeagueLog((prev) => [
      {
        type: "commRemovePlayer",
        team: teamName,
        player: playerName,
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
      },
      ...prev,
    ]);
  }
};

// ---- Snapshots (commissioner) ----
const fetchSnapshots = async () => {
  setSnapshotsLoading(true);
  setSnapshotsError("");
  try {
    const res = await fetch(SNAPSHOTS_API_URL);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    setSnapshots(data.snapshots || []);
  } catch (err) {
    console.error("[SNAPSHOTS] Failed to load snapshots", err);
    setSnapshotsError("Failed to load snapshots from server.");
  } finally {
    setSnapshotsLoading(false);
  }
};

const handleRestoreSnapshot = async () => {
  if (!selectedSnapshotId) {
    alert("Select a snapshot to restore first.");
    return;
  }

  const ok = window.confirm(
    "This will overwrite the current league state with the selected snapshot.\n\n" +
      "All current rosters, bids, and logs will be replaced. Continue?"
  );
  if (!ok) return;

  try {
    const res = await fetch(`${SNAPSHOTS_API_URL}/restore`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: selectedSnapshotId }),
    });

    if (!res.ok) {
      console.error(
        "[SNAPSHOTS] Restore failed with status:",
        res.status,
        res.statusText
      );
      alert("Failed to restore snapshot. Check console for details.");
      return;
    }

    alert("Snapshot restored. The page will now reload.");
    window.location.reload();
  } catch (err) {
    console.error("[SNAPSHOTS] Error restoring snapshot", err);
    alert("Error restoring snapshot. Check console for details.");
  }
};

  const commissionerAddPlayer = () => {
    if (!currentUser || currentUser.role !== "commissioner") return;

    if (!commTeamForAdd || !commPlayerNameForAdd || !commPlayerSalaryForAdd) {
      alert("Please select a team, and enter a player name and salary.");
      return;
    }

    const salary = Number(commPlayerSalaryForAdd);
    if (isNaN(salary) || salary <= 0) {
      alert("Please enter a valid positive salary.");
      return;
    }

    const position = commPlayerPositionForAdd === "D" ? "D" : "F";

    const newTeams = teams.map((t) => {
      if (t.name !== commTeamForAdd) return t;
      return {
        ...t,
        roster: [
          ...t.roster,
          { name: commPlayerNameForAdd, salary, position },
        ],
      };
    });

    setTeams(newTeams);
    setLeagueLog((prev) => [
      {
        type: "commAddPlayer",
        team: commTeamForAdd,
        player: commPlayerNameForAdd,
        amount: salary,
        position,
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
      },
      ...prev,
    ]);

    setCommPlayerNameForAdd("");
    setCommPlayerSalaryForAdd("");
    setCommPlayerPositionForAdd("F");
  };

  const commissionerEditPlayer = () => {
    if (!currentUser || currentUser.role !== "commissioner") return;

    if (!commEditTeam || !commEditPlayerName) {
      alert("Select a team and enter the player's name to edit.");
      return;
    }

    const hasNewSalary = commEditNewSalary !== "";
    const hasNewPosition = commEditNewPosition !== "";

    if (!hasNewSalary && !hasNewPosition) {
      alert("Enter at least a new salary or a new position.");
      return;
    }

    let salaryValue = null;
    if (hasNewSalary) {
      salaryValue = Number(commEditNewSalary);
      if (isNaN(salaryValue) || salaryValue <= 0) {
        alert("Please enter a valid positive salary.");
        return;
      }
    }

    const newTeams = teams.map((t) => {
      if (t.name !== commEditTeam) return t;

      const idx = t.roster.findIndex(
        (p) => p.name === commEditPlayerName
      );
      if (idx === -1) return t;

      const updatedPlayer = { ...t.roster[idx] };
      if (hasNewSalary) updatedPlayer.salary = salaryValue;
      if (hasNewPosition) updatedPlayer.position = commEditNewPosition;

      const newRoster = [...t.roster];
      newRoster[idx] = updatedPlayer;

      return { ...t, roster: newRoster };
    });

    setTeams(newTeams);
    setLeagueLog((prev) => [
      {
        type: "commEditPlayer",
        team: commEditTeam,
        player: commEditPlayerName,
        newSalary: hasNewSalary ? salaryValue : null,
        newPosition: hasNewPosition ? commEditNewPosition : null,
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
      },
      ...prev,
    ]);

    setCommEditPlayerName("");
    setCommEditNewSalary("");
    setCommEditNewPosition("");
  };

  const commissionerAddPenalty = () => {
    if (!currentUser || currentUser.role !== "commissioner") return;

    if (!commPenaltyTeam || !commPenaltyPlayerName || !commPenaltyAmount) {
      alert("Select a team and enter player name and penalty amount.");
      return;
    }

    const amount = Number(commPenaltyAmount);
    if (isNaN(amount) || amount < 0) {
      alert("Please enter a valid non-negative penalty amount.");
      return;
    }

    const newTeams = teams.map((t) => {
      if (t.name !== commPenaltyTeam) return t;
      const existingBuyouts = t.buyouts || [];
      return {
        ...t,
        buyouts: [
          ...existingBuyouts,
          { player: commPenaltyPlayerName, penalty: amount },
        ],
      };
    });

    setTeams(newTeams);
    setLeagueLog((prev) => [
      {
        type: "commAddPenalty",
        team: commPenaltyTeam,
        player: commPenaltyPlayerName,
        amount,
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
      },
      ...prev,
    ]);

    setCommPenaltyPlayerName("");
    setCommPenaltyAmount("");
  };

  const commissionerRemovePenalty = () => {
    if (!currentUser || currentUser.role !== "commissioner") return;

    if (!commPenaltyTeamRemove || !commPenaltyPlayerRemove) {
      alert(
        "Select a team and enter the player whose penalty you want to remove."
      );
      return;
    }

    const newTeams = teams.map((t) => {
      if (t.name !== commPenaltyTeamRemove) return t;
      const existing = t.buyouts || [];
      const filtered = existing.filter(
        (b) => b.player !== commPenaltyPlayerRemove
      );
      return { ...t, buyouts: filtered };
    });

    setTeams(newTeams);
    setLeagueLog((prev) => [
      {
        type: "commRemovePenalty",
        team: commPenaltyTeamRemove,
        player: commPenaltyPlayerRemove,
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
      },
      ...prev,
    ]);

    setCommPenaltyPlayerRemove("");
  };
const handleManagerProfileImageChange = (e) => {
  if (!currentUser || currentUser.role !== "manager") return;

  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const imageUrl = URL.createObjectURL(file);

  // Set profilePic on the current manager's team
  setTeams((prevTeams) =>
    prevTeams.map((t) =>
      t.name === currentUser.teamName ? { ...t, profilePic: imageUrl } : t
    )
  );

  // Optional: clear the input so selecting the same file again re-triggers onChange
  e.target.value = "";
};

    // ---- Trading helpers ----
  const isPlayerInPendingTrade = (teamName, playerName) => {
    const lowerName = (playerName || "").toLowerCase();
    return tradeProposals.some((tr) => {
      if (tr.status !== "pending") return false;

      const fromSide =
        tr.fromTeam === teamName &&
        tr.offeredPlayers.some((p) => p.toLowerCase() === lowerName);

      const toSide =
        tr.toTeam === teamName &&
        tr.requestedPlayers.some((p) => p.toLowerCase() === lowerName);

      return fromSide || toSide;
    });
  };

  const toggleRequestedPlayer = (teamName, playerName) => {
    if (!tradeDraft || tradeDraft.toTeam !== teamName) return;
    setTradeDraft((prev) => {
      if (!prev) return prev;
      const exists = prev.requestedPlayers.includes(playerName);
      return {
        ...prev,
        requestedPlayers: exists
          ? prev.requestedPlayers.filter((p) => p !== playerName)
          : [...prev.requestedPlayers, playerName],
      };
    });
  };

  const toggleOfferedPlayer = (teamName, playerName) => {
    if (!tradeDraft || tradeDraft.fromTeam !== teamName) return;
    setTradeDraft((prev) => {
      if (!prev) return prev;
      const exists = prev.offeredPlayers.includes(playerName);
      return {
        ...prev,
        offeredPlayers: exists
          ? prev.offeredPlayers.filter((p) => p !== playerName)
          : [...prev.offeredPlayers, playerName],
      };
    });
  };

  const submitTradeProposal = () => {
  if (!currentUser || currentUser.role !== "manager") {
    alert("Only team managers can propose trades.");
    return;
  }
  if (!tradeDraft) return;

  const {
    fromTeam,
    toTeam,
    requestedPlayers,
    offeredPlayers,
    penaltyFrom,
    penaltyTo,
    // 🚨 We now read the retention maps from the draft:
    retentionFrom = {},
    retentionTo = {},
  } = tradeDraft;

  if (!requestedPlayers.length || !offeredPlayers.length) {
    alert(
      "Select at least one player you want to receive and at least one you are offering."
    );
    return;
  }

  const fromTeamObj = teams.find((t) => t.name === fromTeam);
  const toTeamObj = teams.find((t) => t.name === toTeam);

  if (!fromTeamObj || !toTeamObj) {
    alert("One of the teams in this trade no longer exists.");
    return;
  }

  const maxPenaltyFrom = totalBuyoutPenalty(fromTeamObj);
  const maxPenaltyTo = totalBuyoutPenalty(toTeamObj);

  let penaltyFromAmount = 0;
  let penaltyToAmount = 0;

  // Validate penalty you SEND (fromTeam -> toTeam)
  if (penaltyFrom !== undefined && penaltyFrom !== "") {
    const numericFrom = Number(penaltyFrom);
    if (isNaN(numericFrom) || numericFrom < 0) {
      alert(
        "Please enter a valid non-negative buyout penalty to include from your team, or leave it blank."
      );
      return;
    }
    if (numericFrom > maxPenaltyFrom) {
      alert(
        `You can only include up to $${maxPenaltyFrom} of your current buyout penalties in this trade.`
      );
      return;
    }
    penaltyFromAmount = numericFrom;
  }

  // Validate penalty you REQUEST (toTeam -> fromTeam)
  if (penaltyTo !== undefined && penaltyTo !== "") {
    const numericTo = Number(penaltyTo);
    if (isNaN(numericTo) || numericTo < 0) {
      alert(
        "Please enter a valid non-negative buyout penalty you are requesting from the other team, or leave it blank."
      );
      return;
    }
    if (numericTo > maxPenaltyTo) {
      alert(
        `${toTeam} currently only has $${maxPenaltyTo} in buyout penalties.`
      );
      return;
    }
    penaltyToAmount = numericTo;
  }

  // --- Salary retention validation (both directions) ---

  const validatedRetentionFrom = {};
  const validatedRetentionTo = {};

  // 1) Retention on players YOU are sending out (fromTeam -> toTeam)
  for (const [playerName, raw] of Object.entries(retentionFrom || {})) {
    if (raw === "" || raw == null) continue;

    const amount = Number(raw);
    if (isNaN(amount) || amount < 0) {
      alert(
        `Invalid retention amount for ${playerName}. Please enter a non-negative number.`
      );
      return;
    }

    if (!offeredPlayers.includes(playerName)) {
      alert(
        `You can only retain salary on players you are trading away. ${playerName} is not in your offered players.`
      );
      return;
    }

    const fromPlayerObj = fromTeamObj.roster.find(
      (p) => p.name === playerName
    );
    if (!fromPlayerObj) {
      alert(
        `Could not find ${playerName} on your roster for retention calculation.`
      );
      return;
    }

    const maxRetain = Math.floor(fromPlayerObj.salary * 0.5);
    if (amount > maxRetain) {
      alert(
        `You can retain at most 50% of ${playerName}'s salary ($${maxRetain}).`
      );
      return;
    }

    if (amount > 0) {
      validatedRetentionFrom[playerName] = amount;
    }
  }

  // 2) Retention you are REQUESTING from the other team (toTeam keeps some cap)
  for (const [playerName, raw] of Object.entries(retentionTo || {})) {
    if (raw === "" || raw == null) continue;

    const amount = Number(raw);
    if (isNaN(amount) || amount < 0) {
      alert(
        `Invalid requested retention amount for ${playerName}. Please enter a non-negative number.`
      );
      return;
    }

    if (!requestedPlayers.includes(playerName)) {
      alert(
        `You can only request retention on players you are receiving. ${playerName} is not in your requested players.`
      );
      return;
    }

    const toPlayerObj = toTeamObj.roster.find(
      (p) => p.name === playerName
    );
    if (!toPlayerObj) {
      alert(
        `Could not find ${playerName} on the other roster for retention calculation.`
      );
      return;
    }

    const maxRetain = Math.floor(toPlayerObj.salary * 0.5);
    if (amount > maxRetain) {
      alert(
        `${toTeam} can retain at most 50% of ${playerName}'s salary ($${maxRetain}).`
      );
      return;
    }

    if (amount > 0) {
      validatedRetentionTo[playerName] = amount;
    }
  }

  // Enforce max 3 retained-salary players for each team
  const existingRetentionSpotsFrom = countRetentionSpots(fromTeamObj);
  const newRetentionPlayersFrom = new Set(
    Object.keys(validatedRetentionFrom)
  );
  const totalRetentionSpotsFrom =
    existingRetentionSpotsFrom + newRetentionPlayersFrom.size;

  if (totalRetentionSpotsFrom > 3) {
    alert(
      `${fromTeam} would exceed the maximum of 3 retained-salary players (` +
        `currently ${existingRetentionSpotsFrom}, adding ${newRetentionPlayersFrom.size}).`
    );
    return;
  }

  const existingRetentionSpotsTo = countRetentionSpots(toTeamObj);
  const newRetentionPlayersTo = new Set(
    Object.keys(validatedRetentionTo)
  );
  const totalRetentionSpotsTo =
    existingRetentionSpotsTo + newRetentionPlayersTo.size;

  if (totalRetentionSpotsTo > 3) {
    alert(
      `${toTeam} would exceed the maximum of 3 retained-salary players (` +
        `currently ${existingRetentionSpotsTo}, adding ${newRetentionPlayersTo.size}).`
    );
    return;
  }

  // Prevent using players who are already in another pending trade
  const lowerOffered = offeredPlayers.map((name) => name.toLowerCase());
  const lowerRequested = requestedPlayers.map((name) =>
    name.toLowerCase()
  );

  const conflictingTrade = tradeProposals.find((tr) => {
    if (tr.status !== "pending") return false;

    const offeredConflictFrom =
      tr.fromTeam === fromTeam &&
      tr.offeredPlayers.some((p) =>
        lowerOffered.includes(p.toLowerCase())
      );

    const requestedConflictFrom =
      tr.toTeam === fromTeam &&
      tr.requestedPlayers.some((p) =>
        lowerOffered.includes(p.toLowerCase())
      );

    const offeredConflictTo =
      tr.fromTeam === toTeam &&
      tr.offeredPlayers.some((p) =>
        lowerRequested.includes(p.toLowerCase())
      );

    const requestedConflictTo =
      tr.toTeam === toTeam &&
      tr.requestedPlayers.some((p) =>
        lowerRequested.includes(p.toLowerCase())
      );

    return (
      offeredConflictFrom ||
      requestedConflictFrom ||
      offeredConflictTo ||
      requestedConflictTo
    );
  });

  if (conflictingTrade) {
    alert(
      "One or more of the players in this trade are already part of another pending trade.\n\n" +
        "Resolve or cancel those trades before creating a new one involving the same players."
    );
    return;
  }

  const now = Date.now();
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

  const proposal = {
    id: Date.now() + Math.random(),
    fromTeam,
    toTeam,
    requestedPlayers: [...requestedPlayers],
    offeredPlayers: [...offeredPlayers],
    penaltyFrom: penaltyFromAmount,
    penaltyTo: penaltyToAmount,

    // ✅ Store validated retention maps on the proposal
    retentionFrom: validatedRetentionFrom, // { [playerName]: number }
    retentionTo: validatedRetentionTo,     // { [playerName]: number }

    status: "pending",
    createdAt: now,
    expiresAt,
  };

  setTradeProposals((prev) => [proposal, ...prev]);
  setLeagueLog((prev) => [
  {
    type: "tradeProposed",
    id: Date.now() + Math.random(),
    fromTeam,
    toTeam,
    requestedPlayers: [...requestedPlayers],
    offeredPlayers: [...offeredPlayers],
    penaltyFrom: penaltyFromAmount,
    penaltyTo: penaltyToAmount,
    // 👇 include retention in the log for future reference
    retentionFrom: validatedRetentionFrom,
    retentionTo: validatedRetentionTo,
    timestamp: Date.now(),
  },
  ...prev,
]);


  setTradeDraft(null);
};


  const handleRejectTrade = (tradeId) => {
    const proposal = tradeProposals.find((t) => t.id === tradeId);
    if (!proposal) return;

    const canAct =
      currentUser &&
      (currentUser.role === "commissioner" ||
        (currentUser.role === "manager" &&
          currentUser.teamName === proposal.toTeam));

    if (!canAct) {
      alert("Only the receiving team or commissioner can reject this trade.");
      return;
    }

    setTradeProposals((prev) =>
      prev.map((t) =>
        t.id === tradeId ? { ...t, status: "rejected" } : t
      )
    );
    setLeagueLog((prev) => [
      {
        type: "tradeRejected",
        id: Date.now() + Math.random(),
        fromTeam: proposal.fromTeam,
        toTeam: proposal.toTeam,
        requestedPlayers: [...proposal.requestedPlayers],
        offeredPlayers: [...proposal.offeredPlayers],
        penaltyFrom: proposal.penaltyFrom || 0,
        penaltyTo: proposal.penaltyTo || 0,
        timestamp: Date.now(),
      },
      ...prev,
    ]);
  };

  const handleCancelTrade = (tradeId) => {
    const proposal = tradeProposals.find((t) => t.id === tradeId);
    if (!proposal) return;

    const canAct =
      currentUser &&
      currentUser.role === "manager" &&
      currentUser.teamName === proposal.fromTeam;

    if (!canAct) {
      alert("Only the proposing team can cancel this trade.");
      return;
    }

    if (!window.confirm("Cancel this pending trade?")) return;

    setTradeProposals((prev) =>
      prev.map((t) =>
        t.id === tradeId ? { ...t, status: "cancelled" } : t
      )
    );
    setLeagueLog((prev) => [
      {
        type: "tradeCancelled",
        id: Date.now() + Math.random(),
        fromTeam: proposal.fromTeam,
        toTeam: proposal.toTeam,
        requestedPlayers: [...proposal.requestedPlayers],
        offeredPlayers: [...proposal.offeredPlayers],
        penaltyFrom: proposal.penaltyFrom || 0,
        penaltyTo: proposal.penaltyTo || 0,
        timestamp: Date.now(),
      },
      ...prev,
    ]);
  };

  // Helper to move buyout penalty from one team to another
  const transferBuyoutPenalty = (fromTeamObj, toTeamObj, amount) => {
    if (!fromTeamObj || !toTeamObj || amount <= 0) {
      return {
        from: fromTeamObj,
        to: toTeamObj,
        transferred: 0,
      };
    }

    let remaining = amount;
    const fromBuyouts = (fromTeamObj.buyouts || []).map((b) => ({ ...b }));

    for (let i = 0; i < fromBuyouts.length && remaining > 0; i++) {
      const p = fromBuyouts[i].penalty;
      if (p <= remaining) {
        remaining -= p;
        fromBuyouts[i].penalty = 0;
      } else {
        fromBuyouts[i].penalty = p - remaining;
        remaining = 0;
      }
    }

    const actualTransferred = amount - remaining;
    const cleanedFrom = fromBuyouts.filter((b) => b.penalty > 0);

    const toBuyouts = [...(toTeamObj.buyouts || [])];
    if (actualTransferred > 0) {
      toBuyouts.push({
        player: `Traded penalty from ${fromTeamObj.name}`,
        penalty: actualTransferred,
      });
    }

    return {
      from: { ...fromTeamObj, buyouts: cleanedFrom },
      to: { ...toTeamObj, buyouts: toBuyouts },
      transferred: actualTransferred,
    };
  };

 const handleAcceptTrade = (tradeId) => {
  const proposal = tradeProposals.find((t) => t.id === tradeId);
  if (!proposal) return;

  const fromName = proposal.fromTeam;
  const toName = proposal.toTeam;

  const canAct =
    currentUser &&
    (currentUser.role === "commissioner" ||
      (currentUser.role === "manager" &&
        currentUser.teamName === toName));

  if (!canAct) {
    alert("Only the receiving team or commissioner can accept this trade.");
    return;
  }

  // Don't allow accepting expired trades
  if (proposal.expiresAt && Date.now() > proposal.expiresAt) {
    alert("This trade has expired and can no longer be accepted.");
    return;
  }

  const fromTeam = teams.find((t) => t.name === fromName);
  const toTeam = teams.find((t) => t.name === toName);
  if (!fromTeam || !toTeam) {
    alert("One of the teams in this trade no longer exists.");
    return;
  }

  const offeredPlayers = proposal.offeredPlayers;
  const requestedPlayers = proposal.requestedPlayers;

  const fromRoster = [...fromTeam.roster];
  const toRoster = [...toTeam.roster];

  const offeredObjs = fromRoster.filter((p) =>
    offeredPlayers.includes(p.name)
  );
  const requestedObjs = toRoster.filter((p) =>
    requestedPlayers.includes(p.name)
  );

  if (
    offeredObjs.length !== offeredPlayers.length ||
    requestedObjs.length !== requestedPlayers.length
  ) {
    alert(
      "One or more players in this trade are no longer on the expected rosters. Trade cannot be completed."
    );
    return;
  }

  // ---- Salary retention: adjust offered/requested players & add dead cap ----
  const retentionFromMap =
    proposal.retentionFrom || proposal.retention || {}; // backward compatible for older proposals
  const retentionToMap = proposal.retentionTo || {};

  const retainedEntriesFrom = [];
  const retainedEntriesTo = [];

  // fromTeam retains salary on players it sends out
  const adjustedOfferedObjs = offeredObjs.map((player) => {
    const rawVal = retentionFromMap[player.name];
    if (rawVal == null || rawVal === "") return player;

    const amount = Number(rawVal);
    if (!amount || amount <= 0) return player;

    const maxAllowed = Math.floor(player.salary * 0.5);
    const applied = Math.min(amount, maxAllowed);

    if (applied > 0) {
      retainedEntriesFrom.push({
        player: `${player.name} (retained in trade)`,
        penalty: applied,
        retained: true,
      });

      return {
        ...player,
        salary: Math.max(0, player.salary - applied),
      };
    }

    return player;
  });

  // toTeam retains salary on players it sends out (requestedPlayers)
  const adjustedRequestedObjs = requestedObjs.map((player) => {
    const rawVal = retentionToMap[player.name];
    if (rawVal == null || rawVal === "") return player;

    const amount = Number(rawVal);
    if (!amount || amount <= 0) return player;

    const maxAllowed = Math.floor(player.salary * 0.5);
    const applied = Math.min(amount, maxAllowed);

    if (applied > 0) {
      retainedEntriesTo.push({
        player: `${player.name} (retained in trade)`,
        penalty: applied,
        retained: true,
      });

      return {
        ...player,
        salary: Math.max(0, player.salary - applied),
      };
    }

    return player;
  });

  // ---- Build new rosters ----
  const newFromRoster = fromRoster.filter(
    (p) => !offeredPlayers.includes(p.name)
  );
  const newToRoster = toRoster.filter(
    (p) => !requestedPlayers.includes(p.name)
  );

  newFromRoster.push(...adjustedRequestedObjs);
  newToRoster.push(...adjustedOfferedObjs);

  let newFromTeam = {
    ...fromTeam,
    roster: newFromRoster,
    buyouts: [...(fromTeam.buyouts || []), ...retainedEntriesFrom],
  };
  let newToTeam = {
    ...toTeam,
    roster: newToRoster,
    buyouts: [...(toTeam.buyouts || []), ...retainedEntriesTo],
  };

  // ---- Buyout penalty transfers ----
  const penaltyFrom = proposal.penaltyFrom || 0;
  if (penaltyFrom > 0) {
    const transferResult = transferBuyoutPenalty(
      newFromTeam,
      newToTeam,
      penaltyFrom
    );
    newFromTeam = transferResult.from;
    newToTeam = transferResult.to;

    if (transferResult.transferred < penaltyFrom) {
      alert(
        `Note: only $${transferResult.transferred} of the intended $${penaltyFrom} buyout penalty could be transferred from ${fromName} to ${toName}, because ${fromName} no longer has that much penalty.`
      );
    }
  }

  const penaltyTo = proposal.penaltyTo || 0;
  if (penaltyTo > 0) {
    const transferBackResult = transferBuyoutPenalty(
      newToTeam,
      newFromTeam,
      penaltyTo
    );
    newToTeam = transferBackResult.from;
    newFromTeam = transferBackResult.to;

    if (transferBackResult.transferred < penaltyTo) {
      alert(
        `Note: only $${transferBackResult.transferred} of the intended $${penaltyTo} buyout penalty could be transferred from ${toName} to ${fromName}, because ${toName} no longer has that much penalty.`
      );
    }
  }

  // ---- Post-trade legality checks ----
  const issues = [];

  const fromCap = totalCap(newFromTeam);
  if (fromCap > CAP_LIMIT) {
    issues.push(
      `${fromName} would be over the cap by $${fromCap - CAP_LIMIT}.`
    );
  }
  const toCap = totalCap(newToTeam);
  if (toCap > CAP_LIMIT) {
    issues.push(
      `${toName} would be over the cap by $${toCap - CAP_LIMIT}.`
    );
  }

  const fromSize = newFromTeam.roster.length;
  if (fromSize > MAX_ROSTER_SIZE) {
    issues.push(
      `${fromName} would have ${fromSize} players (limit ${MAX_ROSTER_SIZE}).`
    );
  }
  const toSize = newToTeam.roster.length;
  if (toSize > MAX_ROSTER_SIZE) {
    issues.push(
      `${toName} would have ${toSize} players (limit ${MAX_ROSTER_SIZE}).`
    );
  }

  const fromPos = countPositions(newFromTeam);
  if (fromPos.F < MIN_FORWARDS || fromPos.D < MIN_DEFENSEMEN) {
    const parts = [];
    if (fromPos.F < MIN_FORWARDS)
      parts.push(`${fromPos.F} F (min ${MIN_FORWARDS}) for ${fromName}`);
    if (fromPos.D < MIN_DEFENSEMEN)
      parts.push(`${fromPos.D} D (min ${MIN_DEFENSEMEN}) for ${fromName}`);
    issues.push(`Positional minimum issue: ${parts.join(", ")}.`);
  }

  const toPos = countPositions(newToTeam);
  if (toPos.F < MIN_FORWARDS || toPos.D < MIN_DEFENSEMEN) {
    const parts = [];
    if (toPos.F < MIN_FORWARDS)
      parts.push(`${toPos.F} F (min ${MIN_FORWARDS}) for ${toName}`);
    if (toPos.D < MIN_DEFENSEMEN)
      parts.push(`${toPos.D} D (min ${MIN_DEFENSEMEN}) for ${toName}`);
    issues.push(`Positional minimum issue: ${parts.join(", ")}.`);
  }

  if (issues.length > 0) {
    const ok = window.confirm(
      "This trade will result in one or both teams having an illegal roster:\n\n" +
        issues.join("\n") +
        "\n\nYou can still accept the trade, but both teams must fix their rosters afterward. Proceed?"
    );
    if (!ok) return;
  }

  // ---- Commit roster changes ----
  setTeams((prev) =>
    prev.map((t) => {
      if (t.name === fromName) return newFromTeam;
      if (t.name === toName) return newToTeam;
      return t;
    })
  );

  // ---- Mark this trade accepted & auto-cancel other conflicting trades ----
  setTradeProposals((prev) => {
    const movedPlayersSet = new Set([
      ...offeredPlayers,
      ...requestedPlayers,
    ]);

    return prev.map((t) => {
      if (t.id === tradeId) {
        return { ...t, status: "accepted" };
      }

      // Only care about other pending trades
      if (t.status !== "pending") return t;

      // Only care about trades involving either of the two teams
      const involvesFrom =
        t.fromTeam === fromName || t.toTeam === fromName;
      const involvesTo =
        t.fromTeam === toName || t.toTeam === toName;

      if (!involvesFrom && !involvesTo) return t;

      // Do they share at least one player?
      const otherPlayers = new Set([
        ...t.offeredPlayers,
        ...t.requestedPlayers,
      ]);

      const sharesPlayer = [...movedPlayersSet].some((p) =>
        otherPlayers.has(p)
      );

      if (!sharesPlayer) return t;

      // Auto-cancel this other pending trade
      return {
        ...t,
        status: "cancelled",
        cancelledDueToOtherTrade: true,
      };
    });
  });

  // ---- Log the accepted trade ----
  setLeagueLog((prev) => [
    {
      type: "tradeAccepted",
      id: Date.now() + Math.random(),
      fromTeam: fromName,
      toTeam: toName,
      requestedPlayers: [...requestedPlayers],
      offeredPlayers: [...offeredPlayers],
      penaltyFrom,
      penaltyTo,
      retentionFrom: retentionFromMap,
      retentionTo: retentionToMap,
      timestamp: Date.now(),
    },
    ...prev,
  ]);
};





  // Reset everything to initial state
  const resetLeague = () => {
    const freshTeams = JSON.parse(JSON.stringify(initialTeams));
    setTeams(freshTeams);
    setFreeAgents([]);
    setSelectedTeam(null);
    setSortMode("none");
    setDragFromIndex(null);
    setDragOverIndex(null);
    setLeagueLog([]);
    setTradeDraft(null);
    setTradeProposals([]);
    setNextAuctionDeadline(getNextSundayDeadline());
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error("Failed to clear saved league state", err);
    }
  };

  // Export/import league state as JSON (commissioner)
  const handleExportLeague = () => {
    const data = {
      teams,
      freeAgents,
      leagueLog,
      tradeProposals,
      nextAuctionDeadline: nextAuctionDeadline.toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hundo-leago-league.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportLeague = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const data = JSON.parse(text);

        if (!data.teams || !Array.isArray(data.teams)) {
          alert("Invalid file: missing teams array.");
          return;
        }

        setTeams(data.teams);
        setFreeAgents(data.freeAgents || []);
        setLeagueLog(data.leagueLog || []);
        setTradeProposals(data.tradeProposals || []);
        if (data.nextAuctionDeadline) {
          setNextAuctionDeadline(new Date(data.nextAuctionDeadline));
        }
        setSelectedTeam(null);
        setSortMode("none");
        setTradeDraft(null);
        setShowCommissionerBids(false);
        setAuctionDetailsPlayer(null);
        alert("League state imported successfully.");
      } catch (err) {
        console.error(err);
        alert("Failed to import league JSON.");
      }
    };
    reader.readAsText(file);

    // allow re-importing the same file later
    event.target.value = "";
  };

  // Login / logout
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError("");

    const found = managers.find((m) => m.teamName === loginTeam);
    if (!found) {
      setLoginError("Unknown team / user.");
      return;
    }

    if (loginPassword !== found.password) {
      setLoginError("Incorrect password.");
      return;
    }

    setCurrentUser({ teamName: found.teamName, role: found.role });
    setLoginPassword("");
    setLoginError("");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginTeam("");
    setLoginPassword("");
    setLoginError("");
    setShowCommissionerBids(false);
    setTradeDraft(null);
  };

  // Countdown display text
  let countdownText = "calculating...";
  if (timeRemainingMs != null) {
    const totalSeconds = Math.max(0, Math.floor(timeRemainingMs / 1000));
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    countdownText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  // History filter: derive filtered log
  const filteredLeagueLog = leagueLog.filter((ev) => {
    if (historyFilter === "all") return true;
    // trades-only
    return (
      ev.type === "tradeProposed" ||
      ev.type === "tradeAccepted" ||
      ev.type === "tradeRejected" ||
      ev.type === "tradeCancelled"
    );
  });

  // 👉 JSX
return (
  <div className="page">
    <div className="container">
      <h1 style={{ textAlign: "center", color: "#ff4d4f" }}>Hundo Leago</h1>

      {/* Login panel */}
      <div
        style={{
          marginBottom: "20px",
          padding: "12px 16px",
          borderRadius: "10px",
          background: "#020617",
          border: "1px solid #334155",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {currentUser ? (
          <>
            <div>
              Logged in as{" "}
              <strong>
                {currentUser.teamName} ({currentUser.role})
              </strong>
            </div>
            <button onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <form
            onSubmit={handleLogin}
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span>Log in as:</span>
            <select
              value={loginTeam}
              onChange={(e) => setLoginTeam(e.target.value)}
              style={{
                padding: "6px 8px",
                borderRadius: "6px",
                border: "none",
              }}
            >
              <option value="">Select team / commissioner</option>
              {managers.map((m) => (
                <option key={m.teamName} value={m.teamName}>
                  {m.teamName} ({m.role})
                </option>
              ))}
            </select>
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />
            <button type="submit">Log in</button>
            {loginError && (
              <span style={{ color: "#f97373", marginLeft: "8px" }}>
                {loginError}
              </span>
            )}
          </form>
        )}
      </div>

      {/* Commissioner-only reset / export / import */}
      {currentUser && currentUser.role === "commissioner" && (
        <div
          style={{
            marginBottom: "16px",
            textAlign: "right",
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <button onClick={resetLeague}>Reset league to original rosters</button>
          <button onClick={handleExportLeague}>Export league JSON</button>
          <label
            style={{
              fontSize: "0.85rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Import league JSON:
            <input
              type="file"
              accept="application/json"
              onChange={handleImportLeague}
              style={{ fontSize: "0.8rem" }}
            />
          </label>
        </div>
      )}

      {/* Main columns */}
      <div className="columns">
        {/* Left: Teams list + summary */}
        <div className="left">
          <h2>Teams</h2>
          <ul>
            {teams.map((team) => {
              const isIllegal = illegalTeams.includes(team.name);
              return (
                <li key={team.name}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedTeam(
                        selectedTeam === team.name ? null : team.name
                      );
                    }}
                  >
                    {team.name}
                    {isIllegal && (
                      <span
                        style={{
                          marginLeft: "6px",
                          color: "#f97373",
                          fontSize: "0.85rem",
                        }}
                      >
                        ⚠
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Simple team summary panel */}
          {selectedTeam &&
            (() => {
              const team = teams.find((t) => t.name === selectedTeam);
              if (!team) return null;
              const cap = totalCap(team);
              const size = team.roster.length;
              const pos = countPositions(team);
              const penalties = totalBuyoutPenalty(team);
              const isIllegal = illegalTeams.includes(team.name);

              return (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: "#020617",
                    border: "1px solid #334155",
                    fontSize: "0.9rem",
                  }}
                >
                  <h3
                    style={{
                      marginTop: 0,
                      marginBottom: "8px",
                      fontSize: "1rem",
                    }}
                  >
                    Team Summary
                  </h3>
                  <p style={{ margin: "2px 0" }}>
                    <strong>{team.name}</strong>
                  </p>
                  <p style={{ margin: "2px 0" }}>
                    Cap: ${cap} / ${CAP_LIMIT}{" "}
                    {cap > CAP_LIMIT && (
                      <span style={{ color: "#f97373" }}>
                        {" "}
                        (over by ${cap - CAP_LIMIT})
                      </span>
                    )}
                  </p>
                  <p style={{ margin: "2px 0" }}>
                    Roster: {size}/{MAX_ROSTER_SIZE}
                  </p>
                  <p style={{ margin: "2px 0" }}>
                    F: {pos.F} (min {MIN_FORWARDS}) • D: {pos.D} (min{" "}
                    {MIN_DEFENSEMEN})
                  </p>
                  <p style={{ margin: "2px 0" }}>
                    Buyout penalties: ${penalties}
                  </p>
                  <p style={{ margin: "4px 0", fontWeight: "bold" }}>
                    Status:{" "}
                    <span
                      style={{
                        color: isIllegal ? "#f97373" : "#4ade80",
                      }}
                    >
                      {isIllegal ? "ILLEGAL" : "LEGAL"}
                    </span>
                  </p>
                </div>
              );
            })()}
        </div>

        {/* Right: Free Agent Bidding + commissioner tools */}
        <div className="right">
          <h2>Free Agent Bidding</h2>

          {/* Weekly timer + rules info */}
          <div
            style={{
              marginBottom: "12px",
              padding: "8px 10px",
              borderRadius: "8px",
              background: "#020617",
              border: "1px solid #334155",
              fontSize: "0.9rem",
            }}
          >
            <div>
              <strong>Next processing:</strong> Sunday 4:00 PM PT
            </div>
            <div>
              <strong>Time remaining:</strong> {countdownText}
            </div>
            <div style={{ marginTop: "4px", color: "#94a3b8" }}>
              New auctions must be started before Thursday 11:59 PM PT. Bids on
              existing auctions are allowed up until the Sunday deadline.
            </div>
          </div>

          {/* Manager-only main bidding controls */}
          {currentUser && currentUser.role === "manager" ? (
            <>
              <input
                type="text"
                placeholder="Player Name"
                value={bidPlayer}
                onChange={(e) => setBidPlayer(e.target.value)}
              />
              <select
                value={bidPosition}
                onChange={(e) => setBidPosition(e.target.value)}
                style={{
                  padding: "8px",
                  margin: "5px 5px 5px 0",
                }}
              >
                <option value="F">Forward (F)</option>
                <option value="D">Defenseman (D)</option>
              </select>
              <input
                type="number"
                placeholder="Bid Amount"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
              />
              <button onClick={submitBid}>Submit Bid</button>

              {capInfo && (
                <p style={{ marginTop: "6px", color: "#cbd5f5" }}>
                  Current cap: ${capInfo.currentCap}
                  {capInfo.projectedCap !== null && (
                    <>
                      {" • Cap if you win this bid: "}
                      <span
                        style={{
                          fontWeight: "bold",
                          color:
                            capInfo.projectedCap > CAP_LIMIT
                              ? "#f97373"
                              : "#cbd5f5",
                        }}
                      >
                        ${capInfo.projectedCap}
                      </span>
                      {capInfo.projectedCap > CAP_LIMIT &&
                        ` (over by $${capInfo.projectedCap - CAP_LIMIT})`}
                    </>
                  )}
                </p>
              )}
            </>
          ) : (
            <p style={{ color: "#94a3b8" }}>
              Log in as a team manager to place bids.
            </p>
          )}

          {/* Active Auctions quick-bid section */}
          {activeAuctions.length > 0 && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                borderRadius: "10px",
                background: "#020617",
                border: "1px solid #334155",
              }}
            >
              <h3 style={{ marginTop: 0 }}>Active Auctions</h3>
              {activeAuctions.map((player) => {
                const bidsForPlayer = freeAgents.filter(
                  (fa) => fa.player === player
                );
                const isDetailsOpen = auctionDetailsPlayer === player;

                return (
                  <div
                    key={player}
                    style={{
                      marginBottom: "8px",
                      paddingBottom: "8px",
                      borderBottom: "1px solid #1f2937",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontWeight: "bold" }}>{player}</span>
                      {currentUser && currentUser.role === "manager" ? (
                        <>
                          <input
                            type="number"
                            placeholder="Your bid"
                            value={auctionBidAmounts[player] || ""}
                            onChange={(e) =>
                              handleAuctionBidChange(player, e.target.value)
                            }
                            style={{ width: "100px" }}
                          />
                          <button onClick={() => submitAuctionBid(player)}>
                            Place bid
                          </button>
                        </>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>
                          Log in as a manager to bid.
                        </span>
                      )}

                      {currentUser && currentUser.role === "commissioner" && (
                        <>
                          <button
                            onClick={() => commissionerCancelAuction(player)}
                            style={{
                              marginLeft: "auto",
                              backgroundColor: "#b91c1c",
                            }}
                          >
                            Cancel auction
                          </button>
                          <button
                            onClick={() =>
                              setAuctionDetailsPlayer((prev) =>
                                prev === player ? null : player
                              )
                            }
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.8rem",
                            }}
                          >
                            {isDetailsOpen ? "Hide details" : "Details"}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Auction details – commissioner + revealed bids only */}
                    {isDetailsOpen &&
                      currentUser &&
                      currentUser.role === "commissioner" &&
                      showCommissionerBids && (
                        <div
                          style={{
                            marginTop: "6px",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            background: "#020617",
                            border: "1px solid #4b5563",
                            fontSize: "0.85rem",
                          }}
                        >
                          {bidsForPlayer.length === 0 ? (
                            <p
                              style={{
                                margin: 0,
                                color: "#94a3b8",
                              }}
                            >
                              No bids recorded.
                            </p>
                          ) : (
                            <>
                              <strong>Bids:</strong>
                              <ul
                                style={{
                                  listStyle: "none",
                                  paddingLeft: 0,
                                  margin: "4px 0 0 0",
                                }}
                              >
                                {bidsForPlayer.map((fa) => (
                                  <li key={fa.id}>
                                    {fa.team}: ${fa.amount} (
                                    {fa.resolved
                                      ? fa.assigned
                                        ? "won"
                                        : "lost"
                                      : "pending"}
                                    )
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Resolve bids info (non-commissioners) */}
          {(!currentUser || currentUser.role !== "commissioner") && (
            <p
              style={{
                color: "#94a3b8",
                marginTop: "12px",
              }}
            >
              Only the commissioner can resolve bids. Bids are processed
              manually according to the Sunday 4:00 PM PT schedule.
            </p>
          )}

          {/* Commissioner tools panel */}
          {currentUser && currentUser.role === "commissioner" && (
            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                borderRadius: "12px",
                background: "#020617",
                border: "1px solid #4b5563",
                fontSize: "0.9rem",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "4px" }}>
                Commissioner Tools
              </h3>
              <p
                style={{
                  margin: "0 0 14px 0",
                  fontSize: "0.8rem",
                  color: "#94a3b8",
                }}
              >
                Full control over rosters, buyout penalties, auctions, and
                weekly backups. Changes here affect the entire league.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "14px",
                }}
              >
                {/* Roster management */}
                <div
                  style={{
                    borderRadius: "10px",
                    border: "1px solid #1f2937",
                    padding: "10px 12px",
                    background: "#020617",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#9ca3af",
                      marginBottom: "4px",
                    }}
                  >
                    Rosters
                  </div>
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "0.75rem",
                      color: "#64748b",
                    }}
                  >
                    Add or edit players on any team without applying buyout
                    penalties.
                  </p>

                  {/* Add player to roster */}
                  <div
                    style={{
                      marginBottom: "10px",
                      paddingBottom: "8px",
                      borderBottom: "1px solid #0f172a",
                    }}
                  >
                    <strong style={{ fontSize: "0.85rem" }}>Add player</strong>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        marginTop: "6px",
                      }}
                    >
                      <select
                        value={commTeamForAdd}
                        onChange={(e) => setCommTeamForAdd(e.target.value)}
                      >
                        <option value="">Select team</option>
                        {teams.map((t) => (
                          <option key={t.name} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Player name"
                        value={commPlayerNameForAdd}
                        onChange={(e) =>
                          setCommPlayerNameForAdd(e.target.value)
                        }
                      />
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                        }}
                      >
                        <select
                          value={commPlayerPositionForAdd}
                          onChange={(e) =>
                            setCommPlayerPositionForAdd(e.target.value)
                          }
                          style={{ minWidth: "80px" }}
                        >
                          <option value="F">F</option>
                          <option value="D">D</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Salary"
                          value={commPlayerSalaryForAdd}
                          onChange={(e) =>
                            setCommPlayerSalaryForAdd(e.target.value)
                          }
                          style={{ width: "100%" }}
                        />
                      </div>
                      <button
                        onClick={commissionerAddPlayer}
                        style={{
                          alignSelf: "flex-start",
                          padding: "4px 10px",
                          fontSize: "0.8rem",
                        }}
                      >
                        Add player
                      </button>
                    </div>
                  </div>

                  {/* Edit existing player */}
                  <div>
                    <strong style={{ fontSize: "0.85rem" }}>Edit player</strong>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        marginTop: "6px",
                      }}
                    >
                      <select
                        value={commEditTeam}
                        onChange={(e) => setCommEditTeam(e.target.value)}
                      >
                        <option value="">Select team</option>
                        {teams.map((t) => (
                          <option key={t.name} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Player name"
                        value={commEditPlayerName}
                        onChange={(e) =>
                          setCommEditPlayerName(e.target.value)
                        }
                      />
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                        }}
                      >
                        <input
                          type="number"
                          placeholder="New salary (optional)"
                          value={commEditNewSalary}
                          onChange={(e) =>
                            setCommEditNewSalary(e.target.value)
                          }
                          style={{ flex: 1 }}
                        />
                        <select
                          value={commEditNewPosition}
                          onChange={(e) =>
                            setCommEditNewPosition(e.target.value)
                          }
                          style={{ width: "120px" }}
                        >
                          <option value="">Pos (no change)</option>
                          <option value="F">F</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                      <button
                        onClick={commissionerEditPlayer}
                        style={{
                          alignSelf: "flex-start",
                          padding: "4px 10px",
                          fontSize: "0.8rem",
                        }}
                      >
                        Save changes
                      </button>
                    </div>
                  </div>
                </div>

                {/* Buyout penalties */}
                <div
                  style={{
                    borderRadius: "10px",
                    border: "1px solid #1f2937",
                    padding: "10px 12px",
                    background: "#020617",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#9ca3af",
                      marginBottom: "4px",
                    }}
                  >
                    Buyout penalties
                  </div>
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "0.75rem",
                      color: "#64748b",
                    }}
                  >
                    Manually correct cap penalties for special cases or
                    retroactive moves.
                  </p>

                  {/* Add penalty */}
                  <div
                    style={{
                      marginBottom: "10px",
                      paddingBottom: "8px",
                      borderBottom: "1px solid #0f172a",
                    }}
                  >
                    <strong style={{ fontSize: "0.85rem" }}>
                      Add manual penalty
                    </strong>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        marginTop: "6px",
                      }}
                    >
                      <select
                        value={commPenaltyTeam}
                        onChange={(e) => setCommPenaltyTeam(e.target.value)}
                      >
                        <option value="">Team</option>
                        {teams.map((t) => (
                          <option key={t.name} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Player name"
                        value={commPenaltyPlayerName}
                        onChange={(e) =>
                          setCommPenaltyPlayerName(e.target.value)
                        }
                      />
                      <input
                        type="number"
                        placeholder="Penalty amount"
                        value={commPenaltyAmount}
                        onChange={(e) =>
                          setCommPenaltyAmount(e.target.value)
                        }
                      />
                      <button
                        onClick={commissionerAddPenalty}
                        style={{
                          alignSelf: "flex-start",
                          padding: "4px 10px",
                          fontSize: "0.8rem",
                        }}
                      >
                        Add penalty
                      </button>
                    </div>
                  </div>

                  {/* Remove penalty */}
                  <div>
                    <strong style={{ fontSize: "0.85rem" }}>
                      Remove penalty
                    </strong>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        marginTop: "6px",
                      }}
                    >
                      <select
                        value={commPenaltyTeamRemove}
                        onChange={(e) =>
                          setCommPenaltyTeamRemove(e.target.value)
                        }
                      >
                        <option value="">Team</option>
                        {teams.map((t) => (
                          <option key={t.name} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Player name"
                        value={commPenaltyPlayerRemove}
                        onChange={(e) =>
                          setCommPenaltyPlayerRemove(e.target.value)
                        }
                      />
                      <button
                        onClick={commissionerRemovePenalty}
                        style={{
                          alignSelf: "flex-start",
                          padding: "4px 10px",
                          fontSize: "0.8rem",
                        }}
                      >
                        Remove penalty
                      </button>
                    </div>
                  </div>
                </div>

                {/* Auctions / bids */}
                <div
                  style={{
                    borderRadius: "10px",
                    border: "1px solid #1f2937",
                    padding: "10px 12px",
                    background: "#020617",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#9ca3af",
                      marginBottom: "4px",
                    }}
                  >
                    Auctions & bids
                  </div>
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "0.75rem",
                      color: "#64748b",
                    }}
                  >
                    Reveal bid amounts, clean up bad bids, or force-run this
                    week&apos;s auctions.
                  </p>

                  {/* Reveal bids toggle */}
                  <div
                    style={{
                      marginTop: "6px",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      background: "#020617",
                      border: "1px solid #4b5563",
                      fontSize: "0.85rem",
                    }}
                  >
                    <label style={{ cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={showCommissionerBids}
                        onChange={(e) =>
                          setShowCommissionerBids(e.target.checked)
                        }
                        style={{ marginRight: "6px" }}
                      />
                      <strong>Reveal bid amounts</strong>{" "}
                      <span style={{ color: "#f97373" }}>
                        (for investigations only)
                      </span>
                    </label>
                  </div>

                  {/* Resolve bids button */}
                  <div style={{ marginTop: "8px" }}>
                    <button
                      onClick={resolveBids}
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.8rem",
                        marginBottom: "4px",
                      }}
                    >
                      Resolve bids now
                    </button>
                    <p
                      style={{
                        margin: "0",
                        color: "#64748b",
                        fontSize: "0.75rem",
                      }}
                    >
                      Normally processed at Sunday 4:00 PM PT. This lets you run
                      it immediately.
                    </p>
                  </div>

                  {/* Live bids – commissioner cleanup */}
                  {freeAgents.some((fa) => !fa.resolved) && (
                    <div
                      style={{
                        marginTop: "10px",
                        paddingTop: "8px",
                        borderTop: "1px solid #0f172a",
                        fontSize: "0.8rem",
                      }}
                    >
                      <strong>Active bid entries</strong>
                      <p
                        style={{
                          margin: "4px 0 6px 0",
                          color: "#94a3b8",
                          fontSize: "0.75rem",
                        }}
                      >
                        Remove bad or duplicate bids without cancelling the
                        whole auction.
                      </p>

                      <div
                        style={{
                          maxHeight: "160px",
                          overflowY: "auto",
                          paddingRight: "4px",
                        }}
                      >
                        {freeAgents
                          .filter((fa) => !fa.resolved)
                          .map((fa) => (
                            <div
                              key={fa.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "6px",
                                alignItems: "center",
                                padding: "4px 0",
                                borderBottom: "1px solid #0f172a",
                              }}
                            >
                              <span>
                                <strong>{fa.player}</strong> — {fa.team} bid $
                                {fa.amount}
                              </span>
                              <button
                                onClick={() =>
                                  commissionerRemoveBid(fa.id)
                                }
                                style={{
                                  padding: "2px 8px",
                                  fontSize: "0.75rem",
                                  backgroundColor: "#b91c1c",
                                  color: "#f9fafb",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Remove bid
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Snapshots */}
                <div
                  style={{
                    borderRadius: "10px",
                    border: "1px solid #1f2937",
                    padding: "10px 12px",
                    background: "#020617",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#9ca3af",
                      marginBottom: "4px",
                    }}
                  >
                    Snapshots (weekly backups)
                  </div>
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "0.75rem",
                      color: "#64748b",
                    }}
                  >
                    Restore a full league backup from a previous weekly run.
                    This overwrites current rosters, bids, and logs.
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      alignItems: "center",
                      marginTop: "6px",
                    }}
                  >
                    <select
                      value={selectedSnapshotId}
                      onChange={(e) =>
                        setSelectedSnapshotId(e.target.value)
                      }
                      style={{ minWidth: "260px" }}
                    >
                      <option value="">Select snapshot…</option>
                      {snapshots.map((s) => {
                        const label = new Date(
                          s.createdAt
                        ).toLocaleString();
                        return (
                          <option key={s.id} value={s.id}>
                            {label} ({s.id})
                          </option>
                        );
                      })}
                    </select>

                    <button
                      onClick={fetchSnapshots}
                      disabled={snapshotsLoading}
                      style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                    >
                      {snapshotsLoading ? "Refreshing…" : "Refresh list"}
                    </button>

                    <button
                      onClick={handleRestoreSnapshot}
                      disabled={!selectedSnapshotId}
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.8rem",
                        backgroundColor: selectedSnapshotId
                          ? "#b91c1c"
                          : "#4b5563",
                        color: "#f9fafb",
                        border: "none",
                        borderRadius: "4px",
                        cursor: selectedSnapshotId ? "pointer" : "default",
                      }}
                    >
                      Restore snapshot
                    </button>
                  </div>

                  {snapshotsError && (
                    <p
                      style={{
                        color: "#f97373",
                        marginTop: "4px",
                        fontSize: "0.8rem",
                      }}
                    >
                      {snapshotsError}
                    </p>
                  )}

                  {snapshots.length === 0 &&
                    !snapshotsLoading &&
                    !snapshotsError && (
                      <p
                        style={{
                          color: "#64748b",
                          marginTop: "4px",
                          fontSize: "0.8rem",
                        }}
                      >
                        No snapshots found yet. They will appear after weekly
                        runs.
                      </p>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

            {/* Trade draft summary (for the team proposing) */}
      {tradeDraft &&
        currentUser &&
        currentUser.role === "manager" &&
        currentUser.teamName === tradeDraft.fromTeam &&
        (() => {
          const fromTeamObj = teams.find(
            (t) => t.name === tradeDraft.fromTeam
          );
          const toTeamObj = teams.find(
            (t) => t.name === tradeDraft.toTeam
          );
          const maxPenaltyFrom = totalBuyoutPenalty(fromTeamObj);
          const maxPenaltyTo = totalBuyoutPenalty(toTeamObj);
          const currentFromVal =
            tradeDraft.penaltyFrom === undefined
              ? ""
              : tradeDraft.penaltyFrom;
          const currentToVal =
            tradeDraft.penaltyTo === undefined ? "" : tradeDraft.penaltyTo;

          // --- Trade impact preview (simulated) ---
          let fromPreview = null;
          let toPreview = null;
          let tradeIssues = [];

          if (
            fromTeamObj &&
            toTeamObj &&
            (tradeDraft.offeredPlayers.length > 0 ||
              tradeDraft.requestedPlayers.length > 0)
          ) {
            try {
              // Clone base teams
              let previewFrom = {
                ...fromTeamObj,
                roster: [...fromTeamObj.roster],
                buyouts: [...(fromTeamObj.buyouts || [])],
              };
              let previewTo = {
                ...toTeamObj,
                roster: [...toTeamObj.roster],
                buyouts: [...(toTeamObj.buyouts || [])],
              };

              const offeredNames = tradeDraft.offeredPlayers;
              const requestedNames = tradeDraft.requestedPlayers;

              const offeredObjs = previewFrom.roster.filter((p) =>
                offeredNames.includes(p.name)
              );
              const requestedObjs = previewTo.roster.filter((p) =>
                requestedNames.includes(p.name)
              );

              // Apply salary retention from fromTeam
              const retentionMap = tradeDraft.retentionFrom || {};
              const retainedEntries = [];
              const adjustedOffered = offeredObjs.map((player) => {
                const raw = retentionMap[player.name];
                if (raw == null || raw === "") return player;

                const amt = Number(raw);
                if (!amt || amt <= 0) return player;

                const maxAllowed = Math.floor(player.salary * 0.5);
                const applied = Math.min(amt, maxAllowed);
                if (applied <= 0) return player;

                retainedEntries.push({
                  player: `${player.name} (retained in trade)`,
                  penalty: applied,
                  retained: true,
                });

                return {
                  ...player,
                  salary: Math.max(0, player.salary - applied),
                };
              });

              previewFrom.buyouts = [
                ...(previewFrom.buyouts || []),
                ...retainedEntries,
              ];

              // Move players
              previewFrom.roster = previewFrom.roster.filter(
                (p) => !offeredNames.includes(p.name)
              );
              previewTo.roster = previewTo.roster.filter(
                (p) => !requestedNames.includes(p.name)
              );

              previewFrom.roster.push(...requestedObjs);
              previewTo.roster.push(...adjustedOffered);

              // Apply buyout penalty transfers (same logic as accept handler)
              const penaltyFromDraft =
                tradeDraft.penaltyFrom === "" ||
                tradeDraft.penaltyFrom == null
                  ? 0
                  : Number(tradeDraft.penaltyFrom);
              const penaltyToDraft =
                tradeDraft.penaltyTo === "" ||
                tradeDraft.penaltyTo == null
                  ? 0
                  : Number(tradeDraft.penaltyTo);

              let simFrom = previewFrom;
              let simTo = previewTo;

              if (penaltyFromDraft > 0) {
                const res = transferBuyoutPenalty(
                  simFrom,
                  simTo,
                  penaltyFromDraft
                );
                simFrom = res.from;
                simTo = res.to;
              }

              if (penaltyToDraft > 0) {
                const res = transferBuyoutPenalty(
                  simTo,
                  simFrom,
                  penaltyToDraft
                );
                simTo = res.from;
                simFrom = res.to;
              }

              // Build preview metrics
              const buildPreview = (beforeTeam, afterTeam) => {
                const capBefore = totalCap(beforeTeam);
                const capAfter = totalCap(afterTeam);
                const sizeBefore = beforeTeam.roster.length;
                const sizeAfter = afterTeam.roster.length;
                const posBefore = countPositions(beforeTeam);
                const posAfter = countPositions(afterTeam);
                const penaltiesBefore = totalBuyoutPenalty(beforeTeam);
                const penaltiesAfter = totalBuyoutPenalty(afterTeam);
                const retentionBefore = countRetentionSpots(beforeTeam);
                const retentionAfter = countRetentionSpots(afterTeam);

                return {
                  capBefore,
                  capAfter,
                  capDiff: capAfter - capBefore,
                  sizeBefore,
                  sizeAfter,
                  posBefore,
                  posAfter,
                  penaltiesBefore,
                  penaltiesAfter,
                  retentionBefore,
                  retentionAfter,
                };
              };

              fromPreview = buildPreview(fromTeamObj, simFrom);
              toPreview = buildPreview(toTeamObj, simTo);

              // Build roster issues (same rules as real accept)
              const issues = [];

              if (fromPreview.capAfter > CAP_LIMIT) {
                issues.push(
                  `${tradeDraft.fromTeam} would be over the cap by $${
                    fromPreview.capAfter - CAP_LIMIT
                  }.`
                );
              }
              if (toPreview.capAfter > CAP_LIMIT) {
                issues.push(
                  `${tradeDraft.toTeam} would be over the cap by $${
                    toPreview.capAfter - CAP_LIMIT
                  }.`
                );
              }

              if (fromPreview.sizeAfter > MAX_ROSTER_SIZE) {
                issues.push(
                  `${tradeDraft.fromTeam} would have ${fromPreview.sizeAfter} players (limit ${MAX_ROSTER_SIZE}).`
                );
              }
              if (toPreview.sizeAfter > MAX_ROSTER_SIZE) {
                issues.push(
                  `${tradeDraft.toTeam} would have ${toPreview.sizeAfter} players (limit ${MAX_ROSTER_SIZE}).`
                );
              }

              if (
                fromPreview.posAfter.F < MIN_FORWARDS ||
                fromPreview.posAfter.D < MIN_DEFENSEMEN
              ) {
                const parts = [];
                if (fromPreview.posAfter.F < MIN_FORWARDS)
                  parts.push(
                    `${fromPreview.posAfter.F} F (min ${MIN_FORWARDS}) for ${tradeDraft.fromTeam}`
                  );
                if (fromPreview.posAfter.D < MIN_DEFENSEMEN)
                  parts.push(
                    `${fromPreview.posAfter.D} D (min ${MIN_DEFENSEMEN}) for ${tradeDraft.fromTeam}`
                  );
                issues.push(
                  `Positional minimum issue: ${parts.join(", ")}.`
                );
              }

              if (
                toPreview.posAfter.F < MIN_FORWARDS ||
                toPreview.posAfter.D < MIN_DEFENSEMEN
              ) {
                const parts = [];
                if (toPreview.posAfter.F < MIN_FORWARDS)
                  parts.push(
                    `${toPreview.posAfter.F} F (min ${MIN_FORWARDS}) for ${tradeDraft.toTeam}`
                  );
                if (toPreview.posAfter.D < MIN_DEFENSEMEN)
                  parts.push(
                    `${toPreview.posAfter.D} D (min ${MIN_DEFENSEMEN}) for ${tradeDraft.toTeam}`
                  );
                issues.push(
                  `Positional minimum issue: ${parts.join(", ")}.`
                );
              }

              tradeIssues = issues;
            } catch (err) {
              console.error("[Trade Preview] Failed to build preview", err);
            }
          }

          return (
            <div
              style={{
                marginTop: "20px",
                padding: "10px 12px",
                borderRadius: "10px",
                background: "#020617",
                border: "1px solid #4b5563",
                fontSize: "0.9rem",
              }}
            >
              <h3 style={{ marginTop: 0 }}>Draft Trade Proposal</h3>
              <p>
                From <strong>{tradeDraft.fromTeam}</strong> to{" "}
                <strong>{tradeDraft.toTeam}</strong>
              </p>
              <p>
                <strong>Requesting:</strong>{" "}
                {tradeDraft.requestedPlayers.length > 0
                  ? tradeDraft.requestedPlayers.join(", ")
                  : "(none selected yet)"}
              </p>
              <p>
                <strong>Offering:</strong>{" "}
                {tradeDraft.offeredPlayers.length > 0
                  ? tradeDraft.offeredPlayers.join(", ")
                  : "(none selected yet)"}
              </p>

              {/* Salary retention (optional) */}
              {(tradeDraft.offeredPlayers.length > 0 ||
                tradeDraft.requestedPlayers.length > 0) && (
                <div
                  style={{
                    marginTop: "8px",
                    paddingTop: "8px",
                    borderTop: "1px solid #1f2937",
                  }}
                >
                  <strong>Salary retention (optional):</strong>
                  <p
                    style={{
                      margin: "4px 0 6px 0",
                      fontSize: "0.8rem",
                      color: "#94a3b8",
                    }}
                  >
                    You can retain up to 50% of a player&apos;s salary (whole
                    dollars). Each team can have at most 3 retained-salary
                    players in total.
                  </p>

                  {/* Retention on players YOU are sending out */}
                  {tradeDraft.offeredPlayers.length > 0 && (
                    <div style={{ marginBottom: "6px" }}>
                      <p
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: "0.8rem",
                          color: "#e5e7eb",
                        }}
                      >
                        Salary you retain on players you send to{" "}
                        {tradeDraft.toTeam}:
                      </p>
                      {tradeDraft.offeredPlayers.map((playerName) => {
                        const fromPlayer = fromTeamObj.roster.find(
                          (p) => p.name === playerName
                        );
                        const salary = fromPlayer ? fromPlayer.salary : null;
                        const maxRetain =
                          salary != null ? Math.floor(salary * 0.5) : 0;

                        const currentVal =
                          tradeDraft.retentionFrom?.[playerName] ?? "";

                        return (
                          <div
                            key={"from-" + playerName}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              marginBottom: "4px",
                              fontSize: "0.85rem",
                            }}
                          >
                            <span>
                              {playerName}
                              {salary != null && ` (salary $${salary})`}
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="We retain $…"
                              value={currentVal}
                              onChange={(e) => {
                                const value = e.target.value;
                                setTradeDraft((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        retentionFrom: {
                                          ...(prev.retentionFrom || {}),
                                          [playerName]: value,
                                        },
                                      }
                                    : prev
                                );
                              }}
                              style={{ width: "120px" }}
                            />
                            {salary != null && (
                              <span
                                style={{
                                  color: "#64748b",
                                  fontSize: "0.75rem",
                                }}
                              >
                                Max: ${maxRetain}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Retention you are REQUESTING from the other team on players you receive */}
                  {tradeDraft.requestedPlayers.length > 0 && (
                    <div>
                      <p
                        style={{
                          margin: "4px 0",
                          fontSize: "0.8rem",
                          color: "#e5e7eb",
                        }}
                      >
                        Salary you want {tradeDraft.toTeam} to retain on
                        players you receive:
                      </p>
                      {tradeDraft.requestedPlayers.map((playerName) => {
                        const toPlayer = toTeamObj.roster.find(
                          (p) => p.name === playerName
                        );
                        const salary = toPlayer ? toPlayer.salary : null;
                        const maxRetain =
                          salary != null ? Math.floor(salary * 0.5) : 0;

                        const currentVal =
                          tradeDraft.retentionTo?.[playerName] ?? "";

                        return (
                          <div
                            key={"to-" + playerName}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              marginBottom: "4px",
                              fontSize: "0.85rem",
                            }}
                          >
                            <span>
                              {playerName}
                              {salary != null && ` (salary $${salary})`}
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="They retain $…"
                              value={currentVal}
                              onChange={(e) => {
                                const value = e.target.value;
                                setTradeDraft((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        retentionTo: {
                                          ...(prev.retentionTo || {}),
                                          [playerName]: value,
                                        },
                                      }
                                    : prev
                                );
                              }}
                              style={{ width: "120px" }}
                            />
                            {salary != null && (
                              <span
                                style={{
                                  color: "#64748b",
                                  fontSize: "0.75rem",
                                }}
                              >
                                Max: ${maxRetain}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div
                style={{
                  marginTop: "8px",
                  paddingTop: "8px",
                  borderTop: "1px solid #1f2937",
                }}
              >
                <strong>Buyout penalties (optional):</strong>

                {/* Penalty from proposing team to other team */}
                <div
                  style={{
                    marginTop: "6px",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#94a3b8" }}>
                    Your current buyout penalties: ${maxPenaltyFrom}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Penalty you send"
                    value={currentFromVal}
                    onChange={(e) => {
                      const value = e.target.value;
                      setTradeDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              penaltyFrom: value,
                            }
                          : prev
                      );
                    }}
                    style={{ width: "140px" }}
                  />
                  <span style={{ color: "#64748b" }}>
                    Max you can include: ${maxPenaltyFrom}
                  </span>
                </div>

                {/* Penalty from other team to proposing team */}
                <div
                  style={{
                    marginTop: "6px",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#94a3b8" }}>
                    {tradeDraft.toTeam}&apos;s buyout penalties: $
                    {maxPenaltyTo}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Penalty you request"
                    value={currentToVal}
                    onChange={(e) => {
                      const value = e.target.value;
                      setTradeDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              penaltyTo: value,
                            }
                          : prev
                      );
                    }}
                    style={{ width: "140px" }}
                  />
                  <span style={{ color: "#64748b" }}>
                    Max you can request: ${maxPenaltyTo}
                  </span>
                </div>
              </div>

              {/* Trade impact preview (CapFriendly-style) */}
              {fromPreview && toPreview && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: "#020617",
                    border: "1px solid #4b5563",
                    fontSize: "0.85rem",
                  }}
                >
                  <h4 style={{ margin: "0 0 6px 0" }}>
                    Trade impact preview
                  </h4>
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      color: "#94a3b8",
                    }}
                  >
                    This shows how each team&apos;s cap, roster size,
                    positions, buyout penalties and retention spots would
                    look if this trade is accepted.
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "10px",
                    }}
                  >
                    {/* From team preview */}
                    <div
                      style={{
                        borderRadius: "8px",
                        border: "1px solid #1f2937",
                        padding: "8px 10px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.8rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "#9ca3af",
                          marginBottom: "4px",
                        }}
                      >
                        {tradeDraft.fromTeam}
                      </div>
                      <div>
                        Cap: ${fromPreview.capBefore} ➝ $
                        {fromPreview.capAfter}
                      </div>
                      <div>
                        Roster: {fromPreview.sizeBefore} ➝{" "}
                        {fromPreview.sizeAfter}
                      </div>
                      <div>
                        F: {fromPreview.posBefore.F} ➝{" "}
                        {fromPreview.posAfter.F} • D:{" "}
                        {fromPreview.posBefore.D} ➝{" "}
                        {fromPreview.posAfter.D}
                      </div>
                      <div>
                        Buyout penalties: $
                        {fromPreview.penaltiesBefore} ➝ $
                        {fromPreview.penaltiesAfter}
                      </div>
                      <div>
                        Retention spots:{" "}
                        {fromPreview.retentionBefore}/3 ➝{" "}
                        {fromPreview.retentionAfter}/3
                      </div>
                    </div>

                    {/* To team preview */}
                    <div
                      style={{
                        borderRadius: "8px",
                        border: "1px solid #1f2937",
                        padding: "8px 10px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.8rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "#9ca3af",
                          marginBottom: "4px",
                        }}
                      >
                        {tradeDraft.toTeam}
                      </div>
                      <div>
                        Cap: ${toPreview.capBefore} ➝ $
                        {toPreview.capAfter}
                      </div>
                      <div>
                        Roster: {toPreview.sizeBefore} ➝{" "}
                        {toPreview.sizeAfter}
                      </div>
                      <div>
                        F: {toPreview.posBefore.F} ➝{" "}
                        {toPreview.posAfter.F} • D:{" "}
                        {toPreview.posBefore.D} ➝{" "}
                        {toPreview.posAfter.D}
                      </div>
                      <div>
                        Buyout penalties: $
                        {toPreview.penaltiesBefore} ➝ $
                        {toPreview.penaltiesAfter}
                      </div>
                      <div>
                        Retention spots:{" "}
                        {toPreview.retentionBefore}/3 ➝{" "}
                        {toPreview.retentionAfter}/3
                      </div>
                    </div>
                  </div>

                  {tradeIssues.length > 0 && (
                    <div
                      style={{
                        marginTop: "8px",
                        color: "#f97373",
                      }}
                    >
                      <strong>Roster warnings:</strong>
                      <ul
                        style={{
                          margin: "4px 0 0 16px",
                          padding: 0,
                        }}
                      >
                        {tradeIssues.map((msg, idx) => (
                          <li key={idx}>{msg}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <button onClick={submitTradeProposal}>
                Submit trade to {tradeDraft.toTeam}
              </button>
              <button
                style={{
                  marginLeft: "8px",
                  backgroundColor: "#6b7280",
                }}
                onClick={() => setTradeDraft(null)}
              >
                Cancel trade
              </button>
            </div>
          );
        })()}


      {/* League-wide activity history */}
      <div style={{ marginTop: "24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          <h2 style={{ margin: 0 }}>League Activity History</h2>
          <select
            value={historyFilter}
            onChange={(e) => setHistoryFilter(e.target.value)}
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid #334155",
              fontSize: "0.85rem",
              background: "#020617",
              color: "#e5e7eb",
            }}
          >
            <option value="all">All events</option>
            <option value="trades">Trades only</option>
          </select>
        </div>
        {filteredLeagueLog.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>
            {historyFilter === "trades"
              ? "No trade activity yet."
              : "No activity yet."}
          </p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              paddingLeft: 0,
            }}
          >
            {filteredLeagueLog.map((ev, idx) => {
              // Skip roster illegality warnings in this view (even in "all")
              if (
                ev.type === "capWarning" ||
                ev.type === "rosterSizeWarning" ||
                ev.type === "positionWarning"
              ) {
                return null;
              }

              const penaltyParts = [];
              if (ev.penaltyFrom && ev.penaltyFrom > 0) {
                penaltyParts.push(
                  `$${ev.penaltyFrom} buyout penalty from ${ev.fromTeam} to ${ev.toTeam}`
                );
              }
              if (ev.penaltyTo && ev.penaltyTo > 0) {
                penaltyParts.push(
                  `$${ev.penaltyTo} buyout penalty from ${ev.toTeam} to ${ev.fromTeam}`
                );
              }
              const penaltyText =
                penaltyParts.length > 0
                  ? " plus " + penaltyParts.join(" and ")
                  : "";

              const ts = ev.timestamp || ev.createdAt;
              const tsLabel = ts ? new Date(ts).toLocaleString() : null;

              return (
                <li
                  key={ev.id ?? idx}
                  style={{
                    background: "#020617",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    marginBottom: "6px",
                    border: "1px solid #1f2937",
                  }}
                >
                  {ev.type === "buyout" ? (
                    <>
                      <strong>{ev.team}</strong> bought out{" "}
                      <strong>{ev.player}</strong>.
                    </>
                  ) : ev.type === "auctionCancelled" ? (
                    <>
                      ⚠️ Auction for <strong>{ev.player}</strong> was cancelled
                      by the commissioner.
                    </>
                  ) : ev.type === "commRemovePlayer" ? (
                    <>
                      🛠️ Commissioner removed{" "}
                      <strong>{ev.player}</strong> from{" "}
                      <strong>{ev.team}</strong>&apos;s roster (no cap
                      penalty).
                    </>
                  ) : ev.type === "commAddPlayer" ? (
                    <>
                      🛠️ Commissioner added <strong>{ev.player}</strong>{" "}
                      {ev.position && `(${ev.position})`} to{" "}
                      <strong>{ev.team}</strong> at ${ev.amount}.
                    </>
                  ) : ev.type === "commEditPlayer" ? (
                    <>
                      🛠️ Commissioner edited <strong>{ev.player}</strong> on{" "}
                      <strong>{ev.team}</strong>
                      {ev.newSalary != null && (
                        <> — new salary ${ev.newSalary}</>
                      )}
                      {ev.newPosition && <> — new position {ev.newPosition}</>}.
                    </>
                  ) : ev.type === "commAddPenalty" ? (
                    <>
                      🛠️ Commissioner set a manual buyout penalty for{" "}
                      <strong>{ev.player}</strong> on{" "}
                      <strong>{ev.team}</strong> (${ev.amount}).
                    </>
                  ) : ev.type === "commRemovePenalty" ? (
                    <>
                      🛠️ Commissioner removed buyout penalties for{" "}
                      <strong>{ev.player}</strong> on{" "}
                      <strong>{ev.team}</strong>.
                    </>
                  ) : ev.type === "tradeProposed" ? (
                    <>
                      🔁 <strong>{ev.fromTeam}</strong> proposed a trade to{" "}
                      <strong>{ev.toTeam}</strong>: sends{" "}
                      {ev.offeredPlayers.join(", ")} for{" "}
                      {ev.requestedPlayers.join(", ")}
                      {penaltyText}.
                    </>
                  ) : ev.type === "tradeAccepted" ? (
                    <>
                      ✅ Trade completed between{" "}
                      <strong>{ev.fromTeam}</strong> and{" "}
                      <strong>{ev.toTeam}</strong>:{" "}
                      <strong>{ev.fromTeam}</strong> sends{" "}
                      {ev.offeredPlayers.join(", ")} and receives{" "}
                      {ev.requestedPlayers.join(", ")}
                      {penaltyText}.
                    </>
                  ) : ev.type === "tradeRejected" ? (
                    <>
                      ❌ <strong>{ev.toTeam}</strong> rejected a trade from{" "}
                      <strong>{ev.fromTeam}</strong>.
                    </>
                  ) : ev.type === "tradeCancelled" ? (
                    <>
                      🛑{" "}
                      {ev.autoCancelled ? (
                        <>
                          A trade between <strong>{ev.fromTeam}</strong> and{" "}
                          <strong>{ev.toTeam}</strong> was automatically
                          cancelled
                          {ev.reason === "playerRemoved" &&
                            " because a player in the trade was removed or bought out"}
                          .
                        </>
                      ) : (
                        <>
                          <strong>{ev.fromTeam}</strong> cancelled a trade offer
                          to <strong>{ev.toTeam}</strong>.
                        </>
                      )}
                    </>
                  ) : ev.type === "tradeExpired" ? (
                    <>
                      ⏱️ Trade between <strong>{ev.fromTeam}</strong> and{" "}
                      <strong>{ev.toTeam}</strong> expired after 7 days with no
                      changes.
                    </>
                  ) : (
                    // Default: claim / signing
                    <>
                      <strong>{ev.team}</strong> signed{" "}
                      <strong>{ev.player}</strong> as a free agent for $
                      {ev.amount}
                      {ev.position && ` (${ev.position})`}
                    </>
                  )}

                  {tsLabel && (
                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "0.75rem",
                        color: "#64748b",
                      }}
                    >
                      {tsLabel}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Selected team roster */}
      {selectedTeam &&
        (() => {
          const team = teams.find((t) => t.name === selectedTeam);
          if (!team) return null;

          const toggleSort = () =>
            setSortMode((m) =>
              m === "none" ? "asc" : m === "asc" ? "desc" : "none"
            );

          const getDisplayedRoster = () => {
            const copy = [...team.roster];

            if (sortMode === "asc") {
              return copy.sort((a, b) => a.salary - b.salary);
            }
            if (sortMode === "desc") {
              return copy.sort((a, b) => b.salary - a.salary);
            }

            const forwards = copy.filter(
              (p) => (p.position || "F") === "F"
            );
            const defensemen = copy.filter(
              (p) => (p.position || "F") === "D"
            );

            forwards.sort((a, b) => b.salary - a.salary);
            defensemen.sort((a, b) => b.salary - a.salary);

            return [...forwards, ...defensemen];
          };

          const commitReorder = (actualFromIndex, actualToIndex) => {
            if (actualFromIndex == null || actualToIndex == null) return;
            setTeams((prevTeams) =>
              prevTeams.map((t) => {
                if (t.name !== team.name) return t;
                const newRoster = [...t.roster];
                const [moved] = newRoster.splice(actualFromIndex, 1);
                newRoster.splice(actualToIndex, 0, moved);
                return { ...t, roster: newRoster };
              })
            );
          };

          const handleDragStart = (e, displayIndex) => {
            setDragFromIndex(displayIndex);
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", String(displayIndex));
          };

          const handleDragOver = (e, displayIndex) => {
            e.preventDefault();
            setDragOverIndex(displayIndex);
            e.dataTransfer.dropEffect = "move";
          };

          const handleDragLeave = () => {
            setDragOverIndex(null);
          };

          const handleDrop = (e, displayIndex) => {
            e.preventDefault();
            const fromDisplay = Number(
              e.dataTransfer.getData("text/plain")
            );
            const toDisplay = displayIndex;
            setDragOverIndex(null);
            setDragFromIndex(null);

            if (sortMode === "none") {
              commitReorder(fromDisplay, toDisplay);
              return;
            }

            const displayed = getDisplayedRoster();
            const fromPlayerName = displayed[fromDisplay]?.name;
            const toPlayerName = displayed[toDisplay]?.name;
            if (!fromPlayerName || !toPlayerName) return;
            const actualFrom = team.roster.findIndex(
              (p) => p.name === fromPlayerName
            );
            const actualTo = team.roster.findIndex(
              (p) => p.name === toPlayerName
            );
            if (actualFrom >= 0 && actualTo >= 0)
              commitReorder(actualFrom, actualTo);
          };

          const applySortToRoster = () => {
            if (sortMode === "none") return;
            const displayed = getDisplayedRoster();
            setTeams((prev) =>
              prev.map((t) =>
                t.name === team.name ? { ...t, roster: displayed } : t
              )
            );
            setSortMode("none");
          };

          const displayedRoster = getDisplayedRoster();
          const teamCap = totalCap(team);
          const rosterSize = team.roster.length;
          const posCounts = countPositions(team);
const retentionSpotsUsed = countRetentionSpots(team);

          const incomingTrades =
            currentUser &&
            (currentUser.role === "commissioner" ||
              currentUser.teamName === team.name)
              ? tradeProposals.filter(
                  (tr) =>
                    tr.toTeam === team.name && tr.status === "pending"
                )
              : [];

          const outgoingTrades =
            currentUser &&
            currentUser.role === "manager" &&
            currentUser.teamName === team.name
              ? tradeProposals.filter(
                  (tr) => tr.fromTeam === team.name
                )
              : [];

          const isTradeInitiator =
            currentUser &&
            currentUser.role === "manager" &&
            tradeDraft &&
            tradeDraft.fromTeam === currentUser.teamName;

          const canStartTrade =
            currentUser &&
            currentUser.role === "manager" &&
            currentUser.teamName !== team.name;

          const isTradeWithThisTeam =
            tradeDraft &&
            tradeDraft.toTeam === team.name &&
            tradeDraft.fromTeam === currentUser?.teamName;

          return (
            <div style={{ marginTop: "20px" }}>
              {/* Header with profile picture + team name */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "10px",
                }}
              >
                {team.profilePic && (
                  <img
                    src={team.profilePic}
                    alt={`${team.name} manager`}
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #334155",
                    }}
                  />
                )}
                <div>
                  <h2 style={{ margin: 0 }}>{team.name} Roster</h2>

                  {currentUser &&
                    currentUser.role === "manager" &&
                    currentUser.teamName === team.name && (
                      <label
                        style={{
                          marginTop: "4px",
                          display: "inline-block",
                          fontSize: "0.8rem",
                          color: "#93c5fd",
                          cursor: "pointer",
                        }}
                      >
                        {team.profilePic
                          ? "Change profile picture"
                          : "Upload profile picture"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleManagerProfileImageChange}
                          style={{ display: "none" }}
                        />
                      </label>
                    )}
                </div>
              </div>

              {/* Trade buttons for this team */}
              {currentUser && currentUser.role === "manager" && (
                <div
                  style={{
                    marginBottom: "10px",
                  }}
                >
                  {canStartTrade && !tradeDraft && (
                    <button
                      onClick={() =>
                        setTradeDraft({
  fromTeam: currentUser.teamName,
  toTeam: team.name,
  requestedPlayers: [],
  offeredPlayers: [],
  penaltyFrom: "",
  penaltyTo: "",
  // Retention we (fromTeam) are offering on players we send out
  retentionFrom: {}, // { [playerName]: stringAmount }
  // Retention we are asking the other team to keep on players we receive
  retentionTo: {},   // { [playerName]: stringAmount }
})

                      }
                    >
                      Request trade with {team.name}
                    </button>
                  )}

                  {canStartTrade && tradeDraft && isTradeWithThisTeam && (
                    <button
                      onClick={() => setTradeDraft(null)}
                      style={{
                        backgroundColor: "#6b7280",
                        marginLeft: "8px",
                      }}
                    >
                      Cancel trade with {team.name}
                    </button>
                  )}

                  {canStartTrade && tradeDraft && !isTradeWithThisTeam && (
                    <p
                      style={{
                        color: "#94a3b8",
                        marginTop: "6px",
                      }}
                    >
                      You are currently drafting a trade with{" "}
                      <strong>{tradeDraft.toTeam}</strong>. Finish or cancel
                      that trade before starting another.
                    </p>
                  )}
                </div>
              )}

              <p>Total Cap: ${teamCap}</p>
              <p>Remaining Cap: ${CAP_LIMIT - teamCap}</p>
              <p>
                Roster Size: {rosterSize}/{MAX_ROSTER_SIZE}
              </p>
              <p>
                Forwards (F): {posCounts.F} (min {MIN_FORWARDS}) • Defensemen
                (D): {posCounts.D} (min {MIN_DEFENSEMEN})
              </p>
<p>
  Retention spots used: {retentionSpotsUsed}/3
</p>

              {(teamCap > CAP_LIMIT ||
                rosterSize > MAX_ROSTER_SIZE ||
                posCounts.F < MIN_FORWARDS ||
                posCounts.D < MIN_DEFENSEMEN) && (
                <div
                  style={{
                    color: "#f97373",
                    fontWeight: "bold",
                    marginTop: "4px",
                  }}
                >
                  {teamCap > CAP_LIMIT && (
                    <p
                      style={{
                        margin: 0,
                      }}
                    >
                      ILLEGAL: Over cap by ${teamCap - CAP_LIMIT}
                    </p>
                  )}
                  {rosterSize > MAX_ROSTER_SIZE && (
                    <p
                      style={{
                        margin: 0,
                      }}
                    >
                      ILLEGAL: Too many players by{" "}
                      {rosterSize - MAX_ROSTER_SIZE}
                    </p>
                  )}
                  {posCounts.F < MIN_FORWARDS && (
                    <p
                      style={{
                        margin: 0,
                      }}
                    >
                      ILLEGAL: Only {posCounts.F} forwards (min{" "}
                      {MIN_FORWARDS})
                    </p>
                  )}
                  {posCounts.D < MIN_DEFENSEMEN && (
                    <p
                      style={{
                        margin: 0,
                      }}
                    >
                      ILLEGAL: Only {posCounts.D} defensemen (min{" "}
                      {MIN_DEFENSEMEN})
                    </p>
                  )}
                </div>
              )}

              {/* Incoming trade proposals (for this team) */}
                  {incomingTrades.map((tr) => {
      const expiryLabel = tr.expiresAt
        ? new Date(tr.expiresAt).toLocaleString()
        : null;

      // 👇 figure out retention on each side for display
      const retentionFromEntries = Object.entries(tr.retentionFrom || {}).filter(
        ([, val]) => Number(val) > 0
      );
      const retentionToEntries = Object.entries(tr.retentionTo || {}).filter(
        ([, val]) => Number(val) > 0
      );

      return (
        <div
          key={tr.id}
          style={{
            marginBottom: "8px",
            paddingBottom: "8px",
            borderBottom: "1px solid #1f2937",
          }}
        >
          <p style={{ margin: 0 }}>
            From <strong>{tr.fromTeam}</strong>:
          </p>

          <p style={{ margin: "2px 0" }}>
            They offer: {tr.offeredPlayers.join(", ")}
          </p>

          <p style={{ margin: "2px 0" }}>
            They want: {tr.requestedPlayers.join(", ")}
          </p>

          {tr.penaltyFrom > 0 && (
            <p style={{ margin: "2px 0", color: "#f97373" }}>
              Includes transfer of ${tr.penaltyFrom} in buyout
              penalty from {tr.fromTeam} to {tr.toTeam}.
            </p>
          )}

          {tr.penaltyTo > 0 && (
            <p style={{ margin: "2px 0", color: "#f97373" }}>
              They are requesting ${tr.penaltyTo} in buyout
              penalty from {tr.toTeam} to {tr.fromTeam}.
            </p>
          )}

          {/* 👇 NEW: salary retention details */}
          {retentionFromEntries.length > 0 && (
            <p
              style={{
                margin: "2px 0",
                color: "#e5e7eb",
                fontSize: "0.85rem",
              }}
            >
              Salary retained by {tr.fromTeam}:{" "}
              {retentionFromEntries.map(([name, amt], idx) => (
                <span key={name}>
                  {idx > 0 && ", "}
                  {name} (${amt})
                </span>
              ))}
            </p>
          )}

          {retentionToEntries.length > 0 && (
            <p
              style={{
                margin: "2px 0",
                color: "#e5e7eb",
                fontSize: "0.85rem",
              }}
            >
              Salary they are asking {tr.toTeam} to retain:{" "}
              {retentionToEntries.map(([name, amt], idx) => (
                <span key={name}>
                  {idx > 0 && ", "}
                  {name} (${amt})
                </span>
              ))}
            </p>
          )}

          {expiryLabel && (
            <p
              style={{
                margin: "2px 0",
                color: "#94a3b8",
                fontSize: "0.8rem",
              }}
            >
              Expires on: {expiryLabel}
            </p>
          )}

          <button
            onClick={() => handleAcceptTrade(tr.id)}
            style={{ marginRight: "6px" }}
          >
            Accept trade
          </button>
          <button
            onClick={() => handleRejectTrade(tr.id)}
            style={{ backgroundColor: "#b91c1c" }}
          >
            Reject trade
          </button>
        </div>
      );
    })}


                  {outgoingTrades.map((tr) => {
      const penaltyParts = [];
      if (tr.penaltyFrom > 0) {
        penaltyParts.push(
          `sends $${tr.penaltyFrom} penalty to ${tr.toTeam}`
        );
      }
      if (tr.penaltyTo > 0) {
        penaltyParts.push(
          `receives $${tr.penaltyTo} penalty from ${tr.toTeam}`
        );
      }

      // 👇 NEW: retention summary text
      const retentionParts = [];

      if (tr.retentionFrom && Object.keys(tr.retentionFrom).length > 0) {
        const items = Object.entries(tr.retentionFrom).map(
          ([name, amt]) => `${name} ($${amt})`
        );
        retentionParts.push(`we retain salary on ${items.join(", ")}`);
      }

      if (tr.retentionTo && Object.keys(tr.retentionTo).length > 0) {
        const items = Object.entries(tr.retentionTo).map(
          ([name, amt]) => `${name} ($${amt})`
        );
        retentionParts.push(
          `${tr.toTeam} retains salary on ${items.join(", ")}`
        );
      }

      const detailStrings = [];
      if (penaltyParts.length) {
        detailStrings.push(penaltyParts.join(" and "));
      }
      if (retentionParts.length) {
        detailStrings.push(retentionParts.join(" and "));
      }

      const detailsSummary = detailStrings.length
        ? " (also " + detailStrings.join("; ") + ")"
        : "";

      const expiryLabel = tr.expiresAt
        ? new Date(tr.expiresAt).toLocaleString()
        : null;

      return (
        <div
          key={tr.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "4px",
            flexWrap: "wrap",
          }}
        >
          <span>
            To <strong>{tr.toTeam}</strong>: send{" "}
            {tr.offeredPlayers.join(", ")} for{" "}
            {tr.requestedPlayers.join(", ")} —{" "}
            <strong>{tr.status}</strong>
            {detailsSummary}
          </span>

          {expiryLabel && (
            <span
              style={{
                fontSize: "0.8rem",
                color: "#94a3b8",
              }}
            >
              (expires on {expiryLabel})
            </span>
          )}

          {currentUser &&
            currentUser.role === "manager" &&
            currentUser.teamName === tr.fromTeam &&
            tr.status === "pending" && (
              <button
                onClick={() => handleCancelTrade(tr.id)}
                style={{
                  padding: "2px 6px",
                  fontSize: "0.75rem",
                }}
              >
                Cancel
              </button>
            )}
        </div>
      );
    })}


              {/* Controls */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "12px",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={toggleSort}
                  style={{ padding: "6px 10px" }}
                >
                  Sort by salary:{" "}
                  {sortMode === "none"
                    ? "none"
                    : sortMode === "asc"
                    ? "▲ low→high"
                    : "▼ high→low"}
                </button>

                <button
                  onClick={applySortToRoster}
                  style={{ padding: "6px 10px" }}
                >
                  Apply displayed order to roster
                </button>

                <div
                  style={{
                    marginLeft: "auto",
                    color: "#94a3b8",
                  }}
                >
                  Drag & drop to reorder (persisted)
                </div>
              </div>

              {/* Column headers */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 0.6fr 0.8fr 1.4fr",
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                  padding: "0 4px 6px 4px",
                }}
              >
                <span>Player</span>
                <span style={{ textAlign: "center" }}>Pos</span>
                <span style={{ textAlign: "center" }}>Salary</span>
                <span style={{ textAlign: "right" }}>Actions</span>
              </div>

              {/* Roster vertical list */}
              <div>
                {displayedRoster.map((p, displayIndex) => {
                  const now = Date.now();

                  const fullPlayer =
                    team.roster.find(
                      (pl) =>
                        pl.name === p.name && pl.salary === p.salary
                    ) || p;

                  const lockUntil = fullPlayer.buyoutLockedUntil || null;
                  const isLocked = lockUntil && lockUntil > now;

                  let buyoutLabel = `Buyout ($${calculateBuyout(
                    p.salary
                  )})`;
                  if (isLocked) {
                    const msLeft = lockUntil - now;
                    const daysLeft = Math.max(
                      1,
                      Math.ceil(
                        msLeft / (24 * 60 * 60 * 1000)
                      )
                    );
                    buyoutLabel = `Buyout locked (${daysLeft}d)`;
                  }

                  const canClickBuyout =
                    canManageTeam(team.name) && !isLocked;

                  const isRequestedForTrade =
                    isTradeInitiator &&
                    tradeDraft &&
                    tradeDraft.toTeam === team.name &&
                    tradeDraft.requestedPlayers.includes(p.name);

                  const isOfferedForTrade =
                    isTradeInitiator &&
                    tradeDraft &&
                    tradeDraft.fromTeam === team.name &&
                    tradeDraft.offeredPlayers.includes(p.name);

                  return (
                    <div
                      key={p.name}
                      className={`roster-row ${
                        dragOverIndex === displayIndex
                          ? "drag-over"
                          : ""
                      }`}
                      draggable={true}
                      onDragStart={(e) =>
                        handleDragStart(e, displayIndex)
                      }
                      onDragOver={(e) =>
                        handleDragOver(e, displayIndex)
                      }
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, displayIndex)}
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "2fr 0.6fr 0.8fr 1.4fr",
                        alignItems: "center",
                        background: "#0f172a",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        marginBottom: "10px",
                        border: "1px solid #334155",
                        cursor: "grab",
                      }}
                    >
                      <div style={{ fontWeight: "bold" }}>{p.name}</div>
                      <div style={{ textAlign: "center" }}>
                        {fullPlayer.position || "F"}
                      </div>
                      <div style={{ textAlign: "center" }}>
                        ${p.salary}
                      </div>
                      <div
                        style={{
                          textAlign: "right",
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        {canManageTeam(team.name) && (
                          <button
                            onClick={() =>
                              canClickBuyout &&
                              handleBuyout(team.name, p.name)
                            }
                            disabled={!canClickBuyout}
                            style={
                              !canClickBuyout
                                ? {
                                    opacity: 0.5,
                                    cursor: "not-allowed",
                                  }
                                : undefined
                            }
                          >
                            {buyoutLabel}
                          </button>
                        )}

                        {/* Trade selection buttons */}
                        {currentUser &&
                          currentUser.role === "manager" &&
                          tradeDraft &&
                          tradeDraft.fromTeam ===
                            currentUser.teamName && (
                            <>
                              {tradeDraft.toTeam === team.name && (
                                <button
                                  onClick={() =>
                                    toggleRequestedPlayer(
                                      team.name,
                                      p.name
                                    )
                                  }
                                  style={
                                    isRequestedForTrade
                                      ? {
                                          backgroundColor:
                                            "#16a34a",
                                        }
                                      : {}
                                  }
                                >
                                  {isRequestedForTrade
                                    ? "Requested"
                                    : "Request"}
                                </button>
                              )}
                              {tradeDraft.fromTeam ===
                                team.name && (
                                <button
                                  onClick={() =>
                                    toggleOfferedPlayer(
                                      team.name,
                                      p.name
                                    )
                                  }
                                  style={
                                    isOfferedForTrade
                                      ? {
                                          backgroundColor:
                                            "#f97316",
                                        }
                                      : {}
                                  }
                                >
                                  {isOfferedForTrade
                                    ? "Offering"
                                    : "Offer"}
                                </button>
                              )}
                            </>
                          )}

                        {currentUser &&
                          currentUser.role === "commissioner" && (
                            <button
                              onClick={() =>
                                commissionerRemovePlayer(
                                  team.name,
                                  p.name
                                )
                              }
                              style={{
                                padding: "4px 8px",
                                fontSize: "0.8rem",
                                backgroundColor: "#6b7280",
                              }}
                            >
                              Remove (Commish)
                            </button>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <h3 style={{ marginTop: "20px" }}>Buyouts</h3>
              <div>
                {(team.buyouts || []).length === 0 && (
                  <p style={{ color: "#94a3b8" }}>
                    No buyout penalties.
                  </p>
                )}

                {(team.buyouts || []).map((b) => (
                  <div
                    key={`${team.name}-${b.player}-${b.penalty}-${Math.random()}`}
                    style={{
                      background: "#1e293b",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      color: "#f87171",
                      marginBottom: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{b.player}</span>
                    <span>Penalty: ${b.penalty}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
    </div>
  </div>
);
}

