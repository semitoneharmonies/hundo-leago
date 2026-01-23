import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getNextSundayDeadline,
  getNewAuctionCutoff,

  computeBidUiStateForAuction,
} from "../leagueUtils";

// Match your roster styling vibe
const BORDER = "#1f2937";
const TEXT = "#e5e7eb";
const MUTED = "#9ca3af";
const PANEL_BG = "#020617";

const INPUT_STYLE = {
    appearance: "none",
  color: TEXT,
  borderRadius: 8,
  padding: "8px 10px",
};

const SELECT_STYLE = {
  ...INPUT_STYLE,
  cursor: "pointer",
};
// Position pill colors (same spirit as roster panel)
const POS_COLORS = {
  F: { solid: "#22c55e", tint: "rgba(34,197,94,0.22)" },  // green
  D: { solid: "#a855f7", tint: "rgba(168,85,247,0.22)" }, // purple
  G: { solid: "#38bdf8", tint: "rgba(56,189,248,0.22)" }, // light blue
};


const normalizePosGroup = (posRaw) => {
  const p = String(posRaw || "").toUpperCase().trim();
  if (!p) return "F";
  if (p.includes("D")) return "D";
  if (p.includes("G")) return "G";
  // treat C/LW/RW/etc as forwards
  return "F";
};

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

const calcAge = (birthDate) => {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return clamp(age, 0, 60);
};

// Your observed scoring:
// FP = A + 1.25*G
const calcFantasyPoints = ({ goals = 0, assists = 0 }) => {
  const g = Number(goals) || 0;
  const a = Number(assists) || 0;
  return a + 1.25 * g;
};

const sorters = {
  name: (a, b) => String(a.fullName).localeCompare(String(b.fullName)),
  team: (a, b) => String(a.teamAbbrev).localeCompare(String(b.teamAbbrev)),
  age: (a, b) => (a.age ?? 999) - (b.age ?? 999),
posGroup: (a, b) => String(a.posGroup || "").localeCompare(String(b.posGroup || "")),
  gp: (a, b) => (a.gamesPlayed ?? 0) - (b.gamesPlayed ?? 0),
  g: (a, b) => (a.goals ?? 0) - (b.goals ?? 0),
  a: (a, b) => (a.assists ?? 0) - (b.assists ?? 0),
  p: (a, b) => (a.points ?? 0) - (b.points ?? 0),
  fp: (a, b) => (a.fp ?? 0) - (b.fp ?? 0),
  fpg: (a, b) => (a.fpg ?? 0) - (b.fpg ?? 0),
};

const normName = (raw) => {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
};

  const normId = (raw) => {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const stripped = s.toLowerCase().startsWith("id:") ? s.slice(3).trim() : s;
  const n = Number(stripped);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.trunc(n);
};

export default function FreeAgentsPage({
  currentUser,
  teams,
  capLimit,
  maxRosterSize,
  minForwards,
  minDefensemen,
  freeAgents,
  onPlaceBid,
  playerApi,
  statsByPlayerId,
  statsReady,
}) {
  const [posFilter, setPosFilter] = useState("ALL"); // ALL | F | D | G
  const [visibleCount, setVisibleCount] = useState(50);

  // default sort: FP desc
  const [sortKey, setSortKey] = useState("fp");
  const [sortDir, setSortDir] = useState("desc"); // asc|desc
const [auctionPrefill, setAuctionPrefill] = useState(null); // { playerId, fullName, posGroup }
// --------------------
// Auction panel state
// --------------------
const [bidAmount, setBidAmount] = useState("");

const [playerSearchQuery, setPlayerSearchQuery] = useState("");
const [playerSearchResults, setPlayerSearchResults] = useState([]);
const [playerSearchOpen, setPlayerSearchOpen] = useState(false);
const [playerSearchLoading, setPlayerSearchLoading] = useState(false);

const [selectedAuctionPlayer, setSelectedAuctionPlayer] = useState(null); 
// { id, fullName, position, teamAbbrev }

const [liveBidInputs, setLiveBidInputs] = useState({});

// countdown clock
const [nowMs, setNowMs] = useState(Date.now());
useEffect(() => {
  const id = setInterval(() => setNowMs(Date.now()), 1000);
  return () => clearInterval(id);
}, []);

const [isMobile, setIsMobile] = useState(() => {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= 820;
});

useEffect(() => {
  const onResize = () => setIsMobile(window.innerWidth <= 820);
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}, []);

const normalizeNhlId = (raw) => {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const stripped = s.toLowerCase().startsWith("id:") ? s.slice(3).trim() : s;
  const n = Number(stripped);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.trunc(n);
};

const normalizeSearchPlayer = (p) => {
  if (!p) return null;
  const pid =
    normalizeNhlId(p.id) ??
    normalizeNhlId(p.playerId) ??
    normalizeNhlId(p.nhlId) ??
    normalizeNhlId(p.nhlPlayerId);

  if (!pid) return null;

  const fullName = String(p.fullName || p.name || p.playerName || "").trim();
  const position = String(p.position || p.pos || p.primaryPosition || "").trim();
  const teamAbbrev = String(p.teamAbbrev || p.team || p.teamCode || "").trim();

  return { id: pid, fullName, position, teamAbbrev };
};

const looksLikeOnlyAnId = (val) => {
  const s = String(val || "").trim().toLowerCase();
  if (!s) return false;
  if (s.startsWith("id:")) return true;
  return /^[0-9]+$/.test(s);
};

const lookupPlayerById = (id) => {
  const pid = normalizeNhlId(id);
  if (!pid) return null;

  const byId = playerApi?.byId;
  if (!byId) return null;

  if (typeof byId.get === "function") {
    return byId.get(pid) || byId.get(String(pid)) || null;
  }
  return byId[pid] || byId[String(pid)] || null;
};

const getAuctionDisplayName = (auction) => {
  const pid =
    normalizeNhlId(auction?.playerId) ||
    normalizeNhlId(auction?.auctionKey) ||
    normalizeNhlId(auction?.key) ||
    null;

  if (pid) {
    const p = lookupPlayerById(pid);
    const nm = String(p?.fullName || p?.name || "").trim();
    if (nm) return nm;
  }

  const bidsArr = Array.isArray(auction?.bids) ? auction.bids : [];
  const candidate = bidsArr
    .map((b) => b?.playerName || b?.player)
    .map((x) => String(x || "").trim())
    .find((x) => x && !looksLikeOnlyAnId(x));

  if (candidate) return candidate;

  return "Unknown player";
};

const getBidDisplayName = (bid) => {
  const pid =
    normalizeNhlId(bid?.playerId) ||
    normalizeNhlId(bid?.auctionKey) ||
    normalizeNhlId(bid?.player) ||
    null;

  if (pid) {
    const p = lookupPlayerById(pid);
    const nm = String(p?.fullName || p?.name || "").trim();
    if (nm) return nm;
  }

  const candidate = [bid?.playerName, bid?.player]
    .map((x) => String(x || "").trim())
    .find((x) => x && !looksLikeOnlyAnId(x));

  return candidate || "Unknown player";
};

// Debounced player search (same as TeamToolsPanel)
useEffect(() => {
  const q = String(playerSearchQuery || "").trim();

  if (!q) {
    setPlayerSearchResults([]);
    setPlayerSearchLoading(false);
    setPlayerSearchOpen(false);
    return;
  }

  if (!playerApi || typeof playerApi.searchPlayers !== "function") return;

  setPlayerSearchLoading(true);

  const t = setTimeout(async () => {
    try {
      const results = await playerApi.searchPlayers(q, 12);
      setPlayerSearchResults(Array.isArray(results) ? results : []);
      setPlayerSearchOpen(true);
    } catch (e) {
      setPlayerSearchResults([]);
    } finally {
      setPlayerSearchLoading(false);
    }
  }, 250);

  return () => clearTimeout(t);
}, [playerSearchQuery, playerApi]);

// ✅ Prefill the auction search when clicking the $ button in the list
useEffect(() => {
  if (!auctionPrefill) return;

  const pid = normalizeNhlId(auctionPrefill.playerId);
  if (!pid) return;

  const p = lookupPlayerById(pid);
  const fullName = String(p?.fullName || p?.name || auctionPrefill.fullName || "").trim();
  const position = String(p?.position || auctionPrefill.posGroup || "F").trim();
  const teamAbbrev = String(p?.teamAbbrev || "").trim();

  setSelectedAuctionPlayer({
    id: pid,
    fullName: fullName || "Unknown",
    position,
    teamAbbrev,
  });

  setPlayerSearchQuery(fullName || "");
  setPlayerSearchOpen(false);

 
}, [auctionPrefill]); // intentionally only on prefill change

  const myTeam = useMemo(() => {
  if (!currentUser || currentUser.role !== "manager") return null;
  return (Array.isArray(teams) ? teams : []).find((t) => t.name === currentUser.teamName) || null;
}, [currentUser, teams]);

const myRoster = Array.isArray(myTeam?.roster) ? myTeam.roster : [];

const myCounts = useMemo(() => {
  let F = 0, D = 0;
  for (const p of myRoster) {
    const g = normalizePosGroup(p?.position);
    if (g === "D") D += 1;
    else if (g === "G") F += 1; // if you treat G separately, change this
    else F += 1;
  }
  const capUsed = myRoster.reduce((sum, p) => sum + (Number(p?.salary) || 0), 0);
  return { F, D, rosterSize: myRoster.length, capUsed };
}, [myRoster]);

const capSpace = Math.max(0, (Number(capLimit) || 0) - (myCounts.capUsed || 0));



const rosteredIds = useMemo(() => {
  const s = new Set();
  const addArr = (arr) => {
    for (const p of (Array.isArray(arr) ? arr : [])) {
      // try multiple fields that might contain an id
      const pid =
        normId(p?.playerId) ??
        normId(p?.id) ??
        normId(p?.auctionKey) ??
        normId(p?.playerKey) ??
        normId(p?.key);
      if (pid) s.add(pid);
    }
  };

  for (const t of (Array.isArray(teams) ? teams : [])) {
    addArr(t?.roster);
    addArr(t?.ir);
    addArr(t?.buyouts);
    addArr(t?.retained);
    addArr(t?.retentions);
  }
  return s;
}, [teams]);

const rosteredNames = useMemo(() => {
  const s = new Set();
  const addArr = (arr) => {
    for (const p of (Array.isArray(arr) ? arr : [])) {
      const nm =
        p?.fullName ??
        p?.name ??
        p?.player ??
        p?.playerName ??
        p?.displayName;
      const key = normName(nm);
      if (key) s.add(key);
    }
  };

  for (const t of (Array.isArray(teams) ? teams : [])) {
    addArr(t?.roster);
    addArr(t?.ir);
    addArr(t?.buyouts);
    addArr(t?.retained);
    addArr(t?.retentions);
  }
  return s;
}, [teams]);



  const rows = useMemo(() => {
    // We build the list from stats (so it’s fast + relevant),
    // then attach player info from playerApi.
    const by = statsByPlayerId && typeof statsByPlayerId === "object" ? statsByPlayerId : {};
    const ids = Object.keys(by)
      .map((k) => Number(k))
      .filter((n) => Number.isFinite(n) && n > 0);

    const out = [];
    for (const pid of ids) {
      if (rosteredIds.has(pid)) continue; // free agents = not rostered

      const s = by[String(pid)] || by[pid] || {};
      const goals = Number(s.goals ?? 0) || 0;
      const assists = Number(s.assists ?? 0) || 0;
      const gamesPlayed = Number(s.gamesPlayed ?? 0) || 0;

      const fp = calcFantasyPoints({ goals, assists });
      const fpg = gamesPlayed > 0 ? fp / gamesPlayed : 0;

      const pObj =
        (typeof playerApi?.getPlayerById === "function" && playerApi.getPlayerById(pid)) ||
        (playerApi?.byId instanceof Map ? playerApi.byId.get(pid) : null) ||
        null;

      const fullName = String(pObj?.fullName || pObj?.name || "Unknown").trim();
      // Some older rosters still store name-only players (no ids).
// If the name matches anything rostered, treat them as NOT a free agent.
if (rosteredNames.has(normName(fullName))) continue;

      const teamAbbrev = String(pObj?.teamAbbrev || "").trim() || "—";
      const posGroup = normalizePosGroup(pObj?.position);

      const age = calcAge(pObj?.birthDate);

      out.push({
        playerId: pid,
        fullName,
        teamAbbrev,
        posGroup,
        age,

        gamesPlayed,
        goals,
        assists,
        points: goals + assists,
        fp,
        fpg,
      });
    }

    // filter by position
    const filtered =
      posFilter === "ALL"
        ? out
        : out.filter((r) => r.posGroup === posFilter);

    // sort
    const cmp = sorters[sortKey] || sorters.fp;
    const sorted = [...filtered].sort((a, b) => {
      const base = cmp(a, b);
      // numeric sorters above are ascending by default; we flip with sortDir
      const dir = sortDir === "asc" ? 1 : -1;
      return base * dir;
    });

    // default ties: name asc
    for (let i = 0; i < sorted.length - 1; i++) {
      // no heavy tie-break logic; keep it simple
    }

    return sorted;
}, [statsByPlayerId, playerApi, rosteredIds, rosteredNames, posFilter, sortKey, sortDir]);

  const visibleRows = rows.slice(0, visibleCount);
  const remaining = Math.max(0, rows.length - visibleCount);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc"); // default desc for stats columns
      if (key === "name" || key === "team" || key === "age") setSortDir("asc");
    }
    setVisibleCount(50); // when you re-sort, snap back to top 50
  };

  const SortHeader = ({ label, k, align = "left", width, showArrow = true }) => {
  const active = sortKey === k;
  const arrow = showArrow && active ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  return (
    <div
      onClick={() => toggleSort(k)}
      title="Click to sort"
      style={{
        cursor: "pointer",
        userSelect: "none",

        color: active ? TEXT : MUTED,
        fontWeight: active ? 900 : 800,
        fontSize: "0.78rem",
        textTransform: "uppercase",
        letterSpacing: "0.06em",

        display: "flex",
        justifyContent: align === "right" ? "flex-end" : "flex-start",
        width: width || "auto",
        whiteSpace: "nowrap",

        // ✅ Active sort highlight (no width shift)
        boxShadow: active ? "inset 0 -2px 0 #0ea5e9" : "inset 0 -2px 0 transparent",
        paddingBottom: 2, // tiny breathing room above underline
      }}
    >
      {label}
      {arrow}
    </div>
  );
};


  // -----------------------------
// Auction derived values (STEP 3)
// Put this RIGHT ABOVE: return (
// -----------------------------
const isManager = currentUser?.role === "manager";
const myTeamName = isManager ? currentUser.teamName : null;

const bids = Array.isArray(freeAgents) ? freeAgents : [];
const activeBids = bids.filter((b) => !b?.resolved);
const myBids = isManager
  ? bids.filter((b) => b.team === myTeamName && !b?.resolved)
  : [];

// Deadline math
const nextSunday = getNextSundayDeadline(new Date(nowMs));
const auctionCutoff = getNewAuctionCutoff(nextSunday);
const timeRemainingMs = Math.max(0, nextSunday.getTime() - nowMs);

// Group active bids by auctionKey ("id:123")
const activeAuctionsByPlayer = (() => {
  const byKey = new Map();

  for (const b of activeBids) {
    const rawKey = String(b?.auctionKey || "").trim();
    if (!rawKey) continue;

    const key = rawKey.toLowerCase(); // "id:123"
    const pid = normalizeNhlId(rawKey) ?? normalizeNhlId(b?.playerId);

    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        auctionKey: key,
        playerId: pid,
        position: b.position || "F",
        bids: [],
      });
    }
    byKey.get(key).bids.push(b);
  }

  return Array.from(byKey.values());
})();

const canStartAuction =
  Number.isFinite(Number(selectedAuctionPlayer?.id)) &&
  Number(selectedAuctionPlayer?.id) > 0 &&
  String(selectedAuctionPlayer?.fullName || "").trim().length > 0 &&
  Number(bidAmount) > 0;

const handleLiveBidInputChange = (playerKey, value) => {
  setLiveBidInputs((prev) => ({ ...prev, [playerKey]: value }));
};

const handleLiveBidSubmit = (auction) => {
  const playerKey = auction.key;
  const rawAmount = String(liveBidInputs[playerKey] || "").trim();

  if (!rawAmount) {
    window.alert("Enter a bid amount for this player.");
    return;
  }

  if (nowMs > nextSunday.getTime()) {
    window.alert("Auction window is closed. Bids after the Sunday 4:00 PM deadline do not count.");
    return;
  }

  if (typeof onPlaceBid !== "function") {
    window.alert("Auction error: onPlaceBid is not wired (not a function).");
    return;
  }

  const pid =
    normalizeNhlId(auction?.playerId) ||
    normalizeNhlId(auction?.auctionKey) ||
    normalizeNhlId(auction?.key) ||
    null;

  if (!pid) {
    window.alert("Auction error: missing playerId for this auction.");
    return;
  }

  const p = lookupPlayerById(pid);
  const displayName = String(p?.fullName || p?.name || "").trim();

  onPlaceBid({
    playerId: String(pid),
    playerName: displayName,
    position: auction.position,
    amount: rawAmount,
  });

  setLiveBidInputs((prev) => ({ ...prev, [playerKey]: "" }));
};

  // ----------------------------------------
  // Split columns so we can swap order on mobile
  // ----------------------------------------
  const LeftColumn = (
    <div>
      <div style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
      
        <div style={{ color: MUTED, fontSize: "0.9rem", whiteSpace: "nowrap" }}>
          Filter:
        </div>
        <select
          value={posFilter}
          onChange={(e) => {
            setPosFilter(e.target.value);
            setVisibleCount(50);
          }}
          style={{
            background: "#0b1220",
            color: TEXT,
            border: "1px solid #334155",
            borderRadius: 8,
            padding: "6px 10px",
            cursor: "pointer",
          }}
        >
          <option value="ALL">All Positions</option>
          <option value="F">Forwards</option>
          <option value="D">Defense</option>
          <option value="G">Goalies</option>
        </select>
      </div>

      {/* Header row */}
{isMobile ? (
  // MOBILE: only show headers that match the bottom stats line grid
  <div
  style={{
    marginTop: 6,
    padding: "0 10px 6px",
    border: "none",
    background: "transparent",
    display: "grid",
    gridTemplateColumns: "46px 1fr", // pill | content
    gap: 8,
    alignItems: "start", // match rows
  }}
>
  {/* LEFT spacer to align with the pos pill column */}
  <div style={{ paddingTop: 2 }} />

  {/* right column headers */}
 <div
  style={{
    display: "grid",
    gridTemplateColumns: "28px 22px 22px 18px 18px 18px 8px 30px 40px",
    gap: 5, // slightly tighter (Team↔Age closer)
    alignItems: "baseline",
    color: MUTED,
    fontWeight: 800,
    fontSize: "0.68rem",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    whiteSpace: "nowrap",
  }}
>
  <SortHeader label="Team" k="team" align="left" width="34px" showArrow={false}/>
  <SortHeader label="Age" k="age" align="right" width="22px" showArrow={false}/>

  {/* add a little "group gap" before stats */}
  <div style={{ paddingLeft: 6 }}>
    <SortHeader label="GP" k="gp" align="right" width="22px" showArrow={false}/>
  </div>

  <SortHeader label="G" k="g" align="right" width="18px" showArrow={false}/>
  <SortHeader label="A" k="a" align="right" width="18px" showArrow={false}/>
  <SortHeader label="P" k="p" align="right" width="18px" showArrow={false}/>

<div
  style={{
    textAlign: "center",
    color: "#334155", // darker, subtler than the old line
    fontSize: "0.9rem",
    lineHeight: 1,
  }}
>
  •
</div>

<SortHeader label="FP" k="fp" align="right" width="30px"showArrow={false} />

  <SortHeader label="FPG" k="fpg" align="right" width="34px" showArrow={false}/>
</div>
</div>

) : (
  // DESKTOP: keep your existing full header grid
  <div
    style={{
      marginTop: 6,
      padding: "0 10px 6px",
      border: "none",
      background: "transparent",
      display: "grid",
      gridTemplateColumns:
        "60px 260px 70px 60px 80px 80px 80px 80px 90px 90px 44px",
      gap: 10,
      alignItems: "center",
    }}
  >
    <SortHeader label="Pos" k="posGroup" />
    <SortHeader label="Name" k="name" />
    <SortHeader label="Team" k="team" />
    <SortHeader label="Age" k="age" align="right" />
    <SortHeader label="GP" k="gp" align="right" />
    <SortHeader label="G" k="g" align="right" />
    <SortHeader label="A" k="a" align="right" />
    <SortHeader label="P" k="p" align="right" />
    <SortHeader label="FP" k="fp" align="right" />
    <SortHeader label="FP/G" k="fpg" align="right" />
    <div
      style={{
        color: MUTED,
        fontWeight: 800,
        fontSize: "0.78rem",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        textAlign: "right",
      }}
    >
      Bid
    </div>
  </div>
)}

      {/* Rows */}
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        {visibleRows.map((r) => {
          const pc = POS_COLORS[r.posGroup] || POS_COLORS.F;

          return (
            <div
              key={r.playerId}
              style={{
                position: "relative",
                border: `1px solid ${BORDER}`,
                borderRadius: 10,
                background: "#07162b",
                padding: "10px 10px",
                overflow: "hidden",
              }}
            >
              {/* Yellow FA gradient strip (RIGHT side) */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(270deg, rgba(250,204,21,0.22) 0%, rgba(250,204,21,0.10) 18%, rgba(2,6,23,0) 55%)",
                  pointerEvents: "none",
                }}
              />

              <div style={{ position: "relative" }}>
  {isMobile ? (
    // -------------------------
    // MOBILE ROW (new layout)
    // -------------------------
    <div
  style={{
    display: "grid",
    gridTemplateColumns: "46px 1fr", // pill | content (button now lives in top row)
    gap: 8,
    alignItems: "start",
  }}
>
  {/* Left column: centered pos pill */}
  <div style={{ display: "flex", justifyContent: "center", paddingTop: 2 }}>
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 26,
        height: 26,
        borderRadius: 999,
        border: `1px solid ${pc.solid}`,
        background: pc.tint,
        color: TEXT,
        fontWeight: 900,
        fontSize: "0.82rem",
      }}
    >
      {r.posGroup}
    </span>
  </div>

  {/* Right: two sub-rows */}
  <div style={{ minWidth: 0 }}>
    {/* Top sub-row: name + small bid button */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        minWidth: 0,
        marginBottom: 6,
      }}
    >
      <div
        style={{
          color: TEXT,
          fontWeight: 900,
          fontSize: "1.00rem",
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          minWidth: 0,
          flex: 1,
        }}
        title={r.fullName}
      >
        {r.fullName}
      </div>

      <button
        onClick={() => {
          setAuctionPrefill({
            playerId: r.playerId,
            fullName: r.fullName,
            posGroup: r.posGroup,
          });
        }}
        title="Start auction for this player"
        style={{
          width: 28,
          height: 28,
          borderRadius: 9,
          border: "1px solid #334155",
          background: "#0b1220",
          color: "#fde68a",
          cursor: "pointer",
          fontWeight: 900,
          flex: "0 0 auto",
        }}
      >
        $
      </button>
    </div>

    {/* Bottom sub-row: tighter stats (no wrapping) */}
   <div
  style={{
    display: "grid",
    gridTemplateColumns: "28px 22px 22px 18px 18px 18px 8px 30px 40px",
    gap: 6,
    alignItems: "baseline",
    color: MUTED,
    fontSize: "0.72rem",
    fontWeight: 700,
    whiteSpace: "nowrap",
  }}
>
  <div style={{ textAlign: "left" }}>{r.teamAbbrev}</div>
  <div style={{ textAlign: "right" }}>{r.age ?? "—"}</div>
  <div style={{ textAlign: "right" }}>{r.gamesPlayed}</div>
  <div style={{ textAlign: "right" }}>{r.goals}</div>
  <div style={{ textAlign: "right" }}>{r.assists}</div>
  <div style={{ textAlign: "right" }}>{r.points}</div>

  {/* dot column */}
  <div style={{ textAlign: "center", opacity: 0.65 }}>•</div>

  <div style={{ textAlign: "right" }}>
    {r.fp.toFixed(1).replace(/\.0$/, "")}
  </div>

  <div
    style={{
      textAlign: "right",
      fontWeight: 900,
      color: r.fpg >= 1.2 ? "#86efac" : r.fpg >= 0.9 ? MUTED : "#fca5a5",
    }}
  >
    {r.fpg.toFixed(2)}
  </div>
</div>


  </div>
</div>

  ) : (
    // -------------------------
    // DESKTOP ROW (unchanged)
    // -------------------------
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "60px 260px 70px 60px 80px 80px 80px 80px 90px 90px 44px",
        gap: 10,
        alignItems: "center",
      }}
    >
      {/* Pos pill */}
      <div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 999,
            border: `1px solid ${pc.solid}`,
            background: pc.tint,
            color: TEXT,
            fontWeight: 900,
            fontSize: "0.85rem",
          }}
        >
          {r.posGroup}
        </span>
      </div>

      {/* Name */}
      <div
        style={{
          color: TEXT,
          fontWeight: 800,
          fontSize: "1.02rem",
          letterSpacing: "0.1px",
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={r.fullName}
      >
        {r.fullName}
      </div>

      {/* Team */}
      <div style={{ color: TEXT, fontWeight: 800, fontSize: "0.92rem" }}>
        {r.teamAbbrev}
      </div>

      {/* Age */}
      <div style={{ color: MUTED, textAlign: "right", fontWeight: 700 }}>
        {r.age ?? "—"}
      </div>

      {/* GP/G/A/P */}
      <div style={{ color: TEXT, textAlign: "right", fontWeight: 800 }}>
        {r.gamesPlayed}
      </div>
      <div style={{ color: TEXT, textAlign: "right", fontWeight: 800 }}>
        {r.goals}
      </div>
      <div style={{ color: TEXT, textAlign: "right", fontWeight: 800 }}>
        {r.assists}
      </div>
      <div style={{ color: TEXT, textAlign: "right", fontWeight: 800 }}>
        {r.points}
      </div>

      {/* FP */}
      <div style={{ color: TEXT, textAlign: "right", fontWeight: 900 }}>
        {r.fp.toFixed(2).replace(/\.00$/, "")}
      </div>

      {/* FP/G */}
      <div
        style={{
          textAlign: "right",
          fontWeight: 900,
          color: r.fpg >= 1.2 ? "#86efac" : r.fpg >= 0.9 ? "#e5e7eb" : "#fca5a5",
        }}
      >
        {r.fpg.toFixed(2)}
      </div>

      {/* Start auction button */}
      <button
        onClick={() => {
          setAuctionPrefill({
            playerId: r.playerId,
            fullName: r.fullName,
            posGroup: r.posGroup,
          });
        }}
        title="Start auction for this player"
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          border: "1px solid #334155",
          background: "#0b1220",
          color: "#fde68a",
          cursor: "pointer",
          fontWeight: 900,
          justifySelf: "end",
        }}
      >
        $
      </button>
    </div>
  )}
</div>

            </div>
          );
        })}

        {statsReady && rows.length === 0 && (
          <div style={{ color: MUTED, padding: "10px 2px" }}>
            No free agents found (or stats not loaded yet).
          </div>
        )}
      </div>

      {/* Load more */}
      {statsReady && remaining > 0 && (
        <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => setVisibleCount((c) => c + 50)}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #334155",
              background: "#0b1220",
              color: TEXT,
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            Show next 50 ({remaining} remaining)
          </button>
        </div>
      )}
    </div>
  );

  const RightColumn = (
    
  <div>
    {/* Quick reference */}
    <div style={{
  border: "1px solid #1e293b",
  borderRadius: 12,
  background: "#07162b",
  marginBottom: 12,
  display: "grid",
  gridTemplateColumns: isMobile ? "72px 1fr" : "88px 1fr",
  overflow: "hidden",
  width: "100%",
  minWidth: 0,
}}
>{/* LEFT: avatar */}
<div
  style={{
    background: "transparent",
    padding: 0,
    display: "flex",
    alignItems: "stretch",
    justifyContent: "stretch",
  }}
>
  {myTeam?.profilePic ? (
    <img
      src={myTeam.profilePic}
      alt=""
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        objectFit: "cover",
        borderRadius: "999px",
        border: "2px solid #334155",
      }}
    />
  ) : (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "999px",
        border: "2px solid #334155",
        background: "transparent",
      }}
    />
  )}
</div>



      {/* RIGHT: Team info */}
      <div
        style={{
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div
          style={{
            color: TEXT,
            fontWeight: 900,
            fontSize: "1.05rem",
            lineHeight: 1.1,
          }}
        >
          {myTeam ? myTeam.name : "Your Team"}
        </div>

        <div
          style={{
            color: MUTED,
            fontSize: "0.95rem",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div>
            <strong style={{ color: TEXT }}>{myCounts.rosterSize}</strong> / {maxRosterSize} rostered · F:{" "}
            <strong style={{ color: TEXT }}>{myCounts.F}</strong> · D:{" "}
            <strong style={{ color: TEXT }}>{myCounts.D}</strong>
          </div>

          <div>
            Cap Used: <strong style={{ color: TEXT }}>${myCounts.capUsed}</strong> · Cap Space:{" "}
            <strong style={{ color: TEXT }}>${capSpace}</strong>
          </div>
        </div>
      </div>
    </div>

    {/* Auction panel */}
    <div
      style={{
        border: "1px solid #1e293b",
        borderRadius: 12,
        background: "#07162b",
        padding: "12px 12px",
      }}
    >
      <div style={{ color: TEXT, fontWeight: 900, marginBottom: 10 }}>
        Start Auction
      </div>


      {/* Start auction */}
      {isManager ? (
        <div
          style={{
            padding: "10px",
            borderRadius: 10,
            border: "1px solid #1f2937",
            background: "#020617",
            marginBottom: 10,
          }}
        >
          <div
  style={{
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "nowrap",
  }}
>
  <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
    <input
      type="text"
      placeholder="Search player"
      value={playerSearchQuery}
      onChange={(e) => {
        const v = e.target.value;
        setPlayerSearchQuery(v);
        setPlayerSearchOpen(true);

        if (
          selectedAuctionPlayer &&
          v.trim() !== String(selectedAuctionPlayer.fullName || "").trim()
        ) {
          setSelectedAuctionPlayer(null);
        }
      }}
      onFocus={() => {
        if (playerSearchResults.length > 0) setPlayerSearchOpen(true);
      }}
      onBlur={() => setTimeout(() => setPlayerSearchOpen(false), 150)}
      style={{ width: "100%", minWidth: 0 }}
    />

    {playerSearchOpen && (playerSearchLoading || playerSearchResults.length > 0) && (
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          marginTop: 4,
          background: "#020617",
          border: "1px solid #1f2937",
          borderRadius: 8,
          zIndex: 50,
          maxHeight: 260,
          overflowY: "auto",
        }}
      >
        {playerSearchLoading && (
          <div style={{ padding: 10, fontSize: "0.85rem", color: MUTED }}>
            Searching…
          </div>
        )}

        {!playerSearchLoading &&
          playerSearchResults.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={(evt) => evt.preventDefault()}
              onClick={() => {
                const norm = normalizeSearchPlayer(p);
                if (!norm?.id) {
                  window.alert("That player result is missing a valid NHL playerId.");
                  return;
                }

                setSelectedAuctionPlayer(norm);
                setPlayerSearchQuery(norm.fullName);
                setPlayerSearchOpen(false);
              }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 10px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: TEXT,
              }}
            >
              <div style={{ fontWeight: 800 }}>
                {p.fullName}
                <span style={{ fontWeight: 500, color: MUTED }}>
                  {" "}
                  · {p.position || "?"} · {p.teamAbbrev || "?"}
                </span>
              </div>
            </button>
          ))}
      </div>
    )}
  </div>

  <input
    type="number"
    min="1"
    placeholder="$"
    value={bidAmount}
    onChange={(e) => setBidAmount(e.target.value)}
    style={{ width: 72, flex: "0 0 auto" }}
  />

  <button
    disabled={!canStartAuction}
    onClick={() => {
      if (!canStartAuction) return;

      if (!selectedAuctionPlayer?.id) {
        window.alert("Pick a player from the dropdown list.");
        return;
      }

      const auctionKey = `id:${String(selectedAuctionPlayer.id).trim()}`.toLowerCase();
      const isExistingAuction = activeAuctionsByPlayer.some((a) => a.key === auctionKey);

      if (!isExistingAuction && nowMs > auctionCutoff.getTime()) {
        window.alert("Too late to start a new auction for this week.");
        return;
      }

      onPlaceBid({
        playerId: String(selectedAuctionPlayer.id),
        playerName: selectedAuctionPlayer.fullName,
        position: normalizePosGroup(selectedAuctionPlayer?.position) || "F",
        amount: bidAmount,
      });

      setBidAmount("");
      setPlayerSearchQuery("");
      setSelectedAuctionPlayer(null);
      setPlayerSearchResults([]);
      setPlayerSearchOpen(false);
    }}
    style={{
      flex: "0 0 auto",
      padding: "8px 10px",
      borderRadius: 10,
      border: "none",
      fontWeight: 900,
      cursor: canStartAuction ? "pointer" : "not-allowed",
      background: canStartAuction ? "#16a34a" : "#4b5563",
      color: "#e5e7eb",
      opacity: canStartAuction ? 1 : 0.85,
      whiteSpace: "nowrap",
    }}
  >
    Bid
  </button>
</div>

        </div>
      ) : (
        <div style={{ color: MUTED, fontSize: "0.9rem" }}>
          Log in as a manager to place free-agent bids.
        </div>
      )}
     

      {/* Live auctions */}
      <div style={{ marginTop: 10 }}>
        <div style={{ fontWeight: 900, color: TEXT, marginBottom: 6 }}>Live auctions</div>

        {activeAuctionsByPlayer.length === 0 ? (
          <div style={{ color: MUTED, fontSize: "0.9rem" }}>No live auctions at the moment.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {activeAuctionsByPlayer.map((auction) => {
              const playerKey = auction.key;
              const inputValue = liveBidInputs[playerKey] || "";

              const ui = computeBidUiStateForAuction({
                auctionBids: auction.bids,
                myTeamName,
                nowMs,
                inputValue,
              });

              const bidCount = auction.bids.length;

              return (
                <div
                  key={playerKey}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid #1f2937",
                    background: "#020617",
                  }}
                >
                  <div style={{ fontWeight: 900, color: TEXT }}>
                    {getAuctionDisplayName(auction)}
                    <span style={{ color: MUTED, fontWeight: 700 }}> · {auction.position}</span>
                  </div>
                  <div style={{ color: MUTED, fontSize: "0.85rem", marginTop: 2 }}>
                    {bidCount === 1 ? "1 bid" : `${bidCount} bids`}
                  </div>

                  {isManager && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          type="number"
                          min={ui.minRequired}
                          placeholder={`Bid $ (min ${ui.minRequired})`}
                          value={inputValue}
                          onChange={(e) => handleLiveBidInputChange(playerKey, e.target.value)}
                          style={{ width: 140 }}
                        />
                        <button
                          onClick={() => {
                            if (ui.disabled) return;
                            handleLiveBidSubmit(auction);
                          }}
                          disabled={ui.disabled}
                          title={ui.reason || ""}
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "none",
                            fontWeight: 900,
                            cursor: ui.disabled ? "not-allowed" : "pointer",
                            background: ui.disabled ? "#4b5563" : "#0ea5e9",
                            color: "#e5e7eb",
                            opacity: ui.disabled ? 0.8 : 1,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Place bid
                        </button>
                      </div>

                      <div style={{ marginTop: 4, fontSize: "0.78rem", color: MUTED }}>
                        {ui.reason ? ui.reason : `Edits used: ${ui.editsUsed}/${ui.maxEdits}`}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Your active bids */}
      {isManager && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 900, color: TEXT, marginBottom: 6 }}>Your active bids</div>
          {myBids.length === 0 ? (
            <div style={{ color: MUTED, fontSize: "0.9rem" }}>You have no bids yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {myBids.map((b) => (
                <div
                  key={b.id}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #1f2937",
                    background: "#020617",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div style={{ color: TEXT, fontWeight: 900 }}>
                    {getBidDisplayName(b)}
                    <span style={{ color: MUTED, fontWeight: 800 }}> · ${b.amount}</span>
                  </div>
                  <div style={{ color: MUTED, fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                    {new Date(b.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {auctionPrefill && (
        <div style={{ marginTop: 10, color: MUTED, fontSize: "0.9rem" }}>
          Prefill: <strong style={{ color: TEXT }}>{auctionPrefill.fullName}</strong>
        </div>
      )}
    </div>
  </div>
);

  return (
  <div
    style={{
      background: PANEL_BG,
      border: `1px solid #1e293b`,
      borderRadius: 8,
      padding: "14px 16px",
      marginTop: 12,
      width: "100%",
maxWidth: "100%",
boxSizing: "border-box",
minWidth: 0,

    }}
  >
    {/* Top row */}
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <Link
        to="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "6px 10px",
          borderRadius: "8px",
          border: "1px solid #334155",
          background: "#0b1220",
          color: "#e5e7eb",
          textDecoration: "none",
          whiteSpace: "nowrap",
          fontSize: "0.9rem",
          fontWeight: 800,
        }}
      >
        ← Back
      </Link>

      <div
        style={{
          fontSize: "1.1rem",
          fontWeight: 900,
          color: TEXT,
          letterSpacing: "0.2px",
        }}
      >
        Free Agents
      </div>

      <div style={{ color: MUTED, fontSize: "0.9rem" }}>
        {statsReady ? (
          <>
            Showing{" "}
            <strong style={{ color: TEXT }}>
              {Math.min(visibleCount, rows.length)}
            </strong>{" "}
            of <strong style={{ color: TEXT }}>{rows.length}</strong> available
            players
          </>
        ) : (
          "Loading stats…"
        )}
      </div>

    </div>

   {/* Two-column layout */}
<div
  style={{
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
    gap: isMobile ? 10 : 16,
    alignItems: "start",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
  }}
>
  {isMobile ? (
  <>
    <div style={{ minWidth: 0 }}>{RightColumn}</div>
    <div style={{ minWidth: 0 }}>{LeftColumn}</div>
  </>
) : (
  <>
    <div style={{ minWidth: 0 }}>{LeftColumn}</div>
    <div style={{ minWidth: 0 }}>{RightColumn}</div>
  </>
)}

</div>
    </div>
  );
}
