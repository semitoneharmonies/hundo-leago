// server.cjs
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

const DATA_FILE = path.join(__dirname, "league-state.json");
const SNAPSHOT_DIR = path.join(__dirname, "snapshots");

// These should match the frontend where relevant
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

// ---- Helpers for deadlines ----

// Next Sunday at 4:00 PM local time (server's timezone)
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

// ---- Disk I/O helpers ----

function ensureSnapshotDir() {
  try {
    if (!fs.existsSync(SNAPSHOT_DIR)) {
      fs.mkdirSync(SNAPSHOT_DIR);
      console.log("[SNAPSHOT] Created snapshots directory:", SNAPSHOT_DIR);
    }
  } catch (err) {
    console.error("[SNAPSHOT] Failed to ensure snapshots directory:", err);
  }
}

function loadState() {
  if (!fs.existsSync(DATA_FILE)) {
    console.log("[STATE] No league-state.json yet, starting from empty state.");
    return {
      teams: null,
      freeAgents: [],
      leagueLog: [],
      tradeProposals: [],
      nextAuctionDeadline: null,
    };
  }

  try {
    const text = fs.readFileSync(DATA_FILE, "utf8");
    const state = JSON.parse(text);

    if (!state.freeAgents) state.freeAgents = [];
    if (!state.leagueLog) state.leagueLog = [];
    if (!state.tradeProposals) state.tradeProposals = [];

    return state;
  } catch (err) {
    console.error("[STATE] Failed to read league-state.json:", err);
    return {
      teams: null,
      freeAgents: [],
      leagueLog: [],
      tradeProposals: [],
      nextAuctionDeadline: null,
    };
  }
}

function saveState(state) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (err) {
    console.error("[STATE] Failed to write league-state.json:", err);
  }
}

// ---- Snapshot helper ----

function createSnapshot(state) {
  try {
    ensureSnapshotDir();
    const now = new Date();
    const stamp = now.toISOString().replace(/:/g, "-");
    const filename = `snapshot-${stamp}.json`;
    const fullPath = path.join(SNAPSHOT_DIR, filename);

    fs.writeFileSync(fullPath, JSON.stringify(state, null, 2), "utf8");
    console.log("[SNAPSHOT] Saved snapshot:", filename);
  } catch (err) {
    console.error("[SNAPSHOT] Failed to create snapshot:", err);
  }
}

// ---- Auction resolution helper (backend version of resolveBids) ----

function resolveAuctions(state) {
  const now = Date.now();

  const teams = (state.teams || []).map((t) => ({
    ...t,
    roster: Array.isArray(t.roster) ? [...t.roster] : [],
    buyouts: Array.isArray(t.buyouts) ? [...t.buyouts] : [],
  }));

  const freeAgents = Array.isArray(state.freeAgents)
    ? [...state.freeAgents]
    : [];

  const leagueLog = Array.isArray(state.leagueLog)
    ? [...state.leagueLog]
    : [];

  const bidsByPlayer = {};

  freeAgents.forEach((bid, index) => {
    if (bid.resolved) return;
    const playerName = bid.player;
    if (!playerName) return;

    if (!bidsByPlayer[playerName]) bidsByPlayer[playerName] = [];
    bidsByPlayer[playerName].push({ ...bid, index });
  });

  Object.keys(bidsByPlayer).forEach((playerName) => {
    const bids = bidsByPlayer[playerName];
    if (bids.length === 0) return;

    const highest = Math.max(...bids.map((b) => b.amount || 0));
    const topBidders = bids.filter((b) => b.amount === highest);

    if (topBidders.length === 1) {
      const winnerBid = topBidders[0];
      const winnerTeamName = winnerBid.team;
      const winningAmount = winnerBid.amount;
      const position = winnerBid.position || "F";

      // Add player to winner's roster
      for (let i = 0; i < teams.length; i++) {
        const t = teams[i];
        if (t.name === winnerTeamName) {
          const newPlayer = {
            name: playerName,
            salary: winningAmount,
            position,
            buyoutLockedUntil: now + TWO_WEEKS_MS,
          };
          teams[i] = {
            ...t,
            roster: [...t.roster, newPlayer],
          };
          break;
        }
      }

      // Mark all bids on this player as resolved; only winner assigned
      bids.forEach((b) => {
        const idx = b.index;
        freeAgents[idx] = {
          ...freeAgents[idx],
          resolved: true,
          assigned: b.team === winnerTeamName,
        };
      });

      leagueLog.unshift({
        type: "claim",
        team: winnerTeamName,
        player: playerName,
        amount: winningAmount,
        position,
        id: now + Math.random(),
        timestamp: now,
      });
    } else {
      // Tie: mark all as resolved, nobody assigned
      bids.forEach((b) => {
        const idx = b.index;
        freeAgents[idx] = {
          ...freeAgents[idx],
          resolved: true,
          assigned: false,
        };
      });
    }
  });

  return {
    ...state,
    teams,
    freeAgents,
    leagueLog,
  };
}

// ---- Initialization / rollover helpers ----

function ensureInitialized(state) {
  const result = { ...state };

  if (!result.freeAgents) result.freeAgents = [];
  if (!result.leagueLog) result.leagueLog = [];
  if (!result.tradeProposals) result.tradeProposals = [];

  if (!result.nextAuctionDeadline) {
    const next = getNextSundayDeadline();
    result.nextAuctionDeadline = next.toISOString();
    console.log(
      "[INIT] nextAuctionDeadline not set, initializing to",
      result.nextAuctionDeadline
    );
  }

  return result;
}

/**
 * If current time is past nextAuctionDeadline:
 *  - resolve auctions
 *  - create snapshot (after resolution)
 *  - advance deadline to next Sunday 4PM
 */
function autoRolloverIfNeeded(state) {
  if (!state || !state.nextAuctionDeadline) return state;

  const now = new Date();
  const deadline = new Date(state.nextAuctionDeadline);

  if (now <= deadline) {
    return state;
  }

  console.log(
    "[ROLLOVER] Now is past nextAuctionDeadline. Resolving auctions and creating snapshot..."
  );
  console.log("[ROLLOVER] Previous deadline was:", deadline.toISOString());

  // 1) Resolve auctions
  const resolvedState = resolveAuctions(state);

  // 2) Create snapshot AFTER resolution
  createSnapshot(resolvedState);

  // 3) Advance deadline to next Sunday 4PM
  const nextDeadline = getNextSundayDeadline(now);
  resolvedState.nextAuctionDeadline = nextDeadline.toISOString();
  console.log(
    "[ROLLOVER] New nextAuctionDeadline set to:",
    resolvedState.nextAuctionDeadline
  );

  return resolvedState;
}

// ---- Express setup ----

app.use(cors());
app.use(express.json());

// GET current league state (with auto-rollover if needed)
app.get("/api/league", (req, res) => {
  let state = loadState();
  state = ensureInitialized(state);
  state = autoRolloverIfNeeded(state);
  saveState(state);
  res.json(state);
});

// Save full league state (with auto-rollover if needed)
app.post("/api/league", (req, res) => {
  let state = req.body;

  if (!state || typeof state !== "object") {
    return res.status(400).json({ error: "Invalid state payload" });
  }

  state = ensureInitialized(state);
  state = autoRolloverIfNeeded(state);
  saveState(state);

  res.json({ ok: true });
});

// ---- Snapshots API ----

// List available snapshots
app.get("/api/snapshots", (req, res) => {
  ensureSnapshotDir();

  let files = [];
  try {
    files = fs.readdirSync(SNAPSHOT_DIR).filter((f) =>
      f.startsWith("snapshot-")
    );
  } catch (err) {
    console.error("[SNAPSHOT] Failed to read snapshot dir:", err);
    return res.json({ snapshots: [] });
  }

  const snapshots = files
    .map((filename) => {
      const fullPath = path.join(SNAPSHOT_DIR, filename);
      let stats;
      try {
        stats = fs.statSync(fullPath);
      } catch (err) {
        return null;
      }

      return {
        id: filename,
        filename,
        createdAt: stats.mtime.toISOString(),
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)); // newest first

  res.json({ snapshots });
});

// Restore a given snapshot
app.post("/api/snapshots/restore", (req, res) => {
  const { id } = req.body || {};
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing snapshot id" });
  }

  ensureSnapshotDir();

  const snapshotPath = path.join(SNAPSHOT_DIR, id);

  // basic safety check
  if (!snapshotPath.startsWith(SNAPSHOT_DIR)) {
    return res.status(400).json({ error: "Invalid snapshot path" });
  }

  if (!fs.existsSync(snapshotPath)) {
    return res.status(404).json({ error: "Snapshot file not found" });
  }

  try {
    const text = fs.readFileSync(snapshotPath, "utf8");
    let snapshotState = JSON.parse(text);

    snapshotState = ensureInitialized(snapshotState);

    // Reset the deadline so league continues from "now"
    const now = new Date();
    const nextDeadline = getNextSundayDeadline(now);
    snapshotState.nextAuctionDeadline = nextDeadline.toISOString();

    // Add a log entry that commissioner restored a snapshot
    const logEntry = {
      type: "snapshotRestore",
      id: now.getTime() + Math.random(),
      timestamp: now.getTime(),
      snapshotId: id,
    };

    if (!Array.isArray(snapshotState.leagueLog)) {
      snapshotState.leagueLog = [];
    }
    snapshotState.leagueLog.unshift(logEntry);

    saveState(snapshotState);

    console.log("[SNAPSHOT] Restored snapshot:", id);
    res.json({ ok: true });
  } catch (err) {
    console.error("[SNAPSHOT] Failed to restore snapshot:", err);
    res.status(500).json({ error: "Failed to restore snapshot" });
  }
});

// Optional health-check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Hundo Leago backend running at http://localhost:${PORT}`);
});
