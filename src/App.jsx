// src/App.jsx
import React, { useState } from "react";
import "./App.css";

import TeamRosterPanel from "./components/TeamRosterPanel";
import LeagueHistoryPanel from "./components/LeagueHistoryPanel";
import TeamToolsPanel from "./components/TeamToolsPanel";
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
} from "./leagueUtils";

// League rules
const CAP_LIMIT = 100;
const MAX_ROSTER_SIZE = 15;
const MIN_FORWARDS = 8;
const MIN_DEFENSEMEN = 4;

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


function App() {
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

  // Optional: log bid removal
  if (removedBid) {
    const now = Date.now();
    setLeagueLog((prev) => [
      {
        type: "faBidRemoved",
        id: now + Math.random(),
        team: removedBid.team,
        player: removedBid.player,
        amount: removedBid.amount,
        timestamp: now,
      },
      ...prev,
    ]);
  }
};



  // --- Login / logout ---

  const handleLogin = () => {
    const trimmedTeam = loginTeamName.trim();
    const user = managers.find(
      (m) =>
        m.teamName === trimmedTeam && m.password === loginPassword
    );
    if (!user) {
      setLoginError("Invalid team or password.");
      return;
    }

    setCurrentUser({
      role: user.role,
      teamName: user.role === "manager" ? user.teamName : null,
    });
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
      />

      {/* main 2-column layout and history stay as they are now */}
      {/* e.g. your <div style={{ background... }}> with TeamRosterPanel + TeamToolsPanel, and LeagueHistoryPanel below */}



        {/* MAIN LAYOUT: 2 columns (left wide roster + trade builder, right tools) */}
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
            {/* LEFT: Roster + internal trade builder summary */}
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

            {/* RIGHT: Team tools + pending trades */}
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
  onAddTradeBlockEntry={handleAddTradeBlockEntry}
    // Auctions
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
        />
      </div>
    </div>
  );
}

export default App;
