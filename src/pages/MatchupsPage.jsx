// src/pages/MatchupsPage.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";


// Match your existing vibe
const BORDER = "#1f2937";
const TEXT = "#e5e7eb";
const MUTED = "#9ca3af";
const PANEL_BG = "rgba(2,6,23,0.72)";

// ---------- helpers ----------
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const normPos = (p) => {
  const s = String(p || "").trim().toUpperCase();
  if (s.startsWith("F")) return "F";
  if (s.startsWith("D")) return "D";
  if (s.startsWith("G")) return "G";
  return "F";
};

const getRosterPlayersNoIR = (team) => {
  const roster = Array.isArray(team?.roster) ? team.roster : [];
  return roster.filter((p) => !p?.onIR); // ✅ exclude IR players
};



// Round-robin schedule for even # of teams (circle method)
function buildRoundRobinWeeks(teamNames) {
  const names = [...teamNames].filter(Boolean);
  if (names.length < 2) return [];

  // if odd, add bye (not your case)
  if (names.length % 2 === 1) names.push("BYE");

  const n = names.length;
  const rounds = n - 1;
  const half = n / 2;

  // circle
  let arr = [...names];
  const weeks = [];

  for (let r = 0; r < rounds; r++) {
    const pairs = [];
    for (let i = 0; i < half; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a !== "BYE" && b !== "BYE") pairs.push([a, b]);
    }
    weeks.push({
      id: r + 1,
      label: `Week ${r + 1}`,
      pairs,
    });

    // rotate (keep first fixed)
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop());
    arr = [fixed, ...rest];
  }

  return weeks;
}

export default function MatchupsPage({
  currentUser,
  teams,
  playerApi,
  statsByPlayerId,
  statsReady,
}) {
  const nav = useNavigate();

  const getPlayerStats = (p) => {
  const pid = Number(p?.playerId);
  if (!Number.isFinite(pid)) return null;
  return statsByPlayerId?.[pid] || null;
};

const calcFP = (st) => {
  if (!st) return 0;
  const g = Number(st.goals || 0);
  const a = Number(st.assists || 0);
  return g * 1.25 + a;
};

const teamTotals = (players) => {
  let gp = 0, g = 0, a = 0, pts = 0, fp = 0;
  for (const p of players) {
    const st = getPlayerStats(p);
    if (!st) continue;
    gp += Number(st.gamesPlayed || 0);
    g  += Number(st.goals || 0);
    a  += Number(st.assists || 0);
    pts += Number(st.points || 0);
    fp += calcFP(st);
  }
  return { gp, g, a, pts, fp };
};

const teamsArr = useMemo(() => {
  if (Array.isArray(teams)) return teams;
  if (teams && typeof teams === "object") return Object.values(teams);
  return [];
}, [teams]);

  console.log("[MATCHUPS] currentUser =", currentUser);
  console.log("[MATCHUPS] teams.length =", Array.isArray(teams) ? teams.length : teams);


 const teamNames = useMemo(
  () => teamsArr.map((t) => t?.name).filter(Boolean),
  [teamsArr]
);


  const weeks = useMemo(() => buildRoundRobinWeeks(teamNames), [teamNames]);

  const [weekIndex, setWeekIndex] = useState(0);
  const safeWeekIndex = clamp(weekIndex, 0, Math.max(0, weeks.length - 1));
  const week = weeks[safeWeekIndex] || null;

  // default selected matchup = first in the week
  const [selectedPairIndex, setSelectedPairIndex] = useState(0);
  const safePairIndex = clamp(selectedPairIndex, 0, Math.max(0, (week?.pairs?.length || 1) - 1));
  const selectedPair = week?.pairs?.[safePairIndex] || null;

  const getDisplayName = (p) => {
  const pid = Number(p?.playerId);
  if (Number.isFinite(pid) && playerApi?.getPlayerNameById) {
    return playerApi.getPlayerNameById(pid) || p?.name || "Unknown player";
  }
  return p?.name || "Unknown player";
};

  const teamsByName = useMemo(() => {
  const m = new Map();
  teamsArr.forEach((t) => {
    if (t?.name) m.set(t.name, t);
  });
  return m;
}, [teamsArr]);


  const leftTeam = selectedPair ? teamsByName.get(selectedPair[0]) : null;
  const rightTeam = selectedPair ? teamsByName.get(selectedPair[1]) : null;

  const leftPlayers = useMemo(() => getRosterPlayersNoIR(leftTeam), [leftTeam]);
  const rightPlayers = useMemo(() => getRosterPlayersNoIR(rightTeam), [rightTeam]);

  // Make lists the same length so divider looks centered and rows line up nicer
  const rowCount = Math.max(leftPlayers.length, rightPlayers.length, 1);
  const leftTotals = useMemo(
  () => teamTotals(leftPlayers),
  [leftPlayers]
);

const rightTotals = useMemo(
  () => teamTotals(rightPlayers),
  [rightPlayers]
);


  const renderTeamChip = (team, side /* "left"|"right" */) => {
    const name = team?.name || "—";
    const pic = team?.profilePic || null;
const players = getRosterPlayersNoIR(team);
const totals = teamTotals(players);

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            border: `1px solid ${BORDER}`,
            overflow: "hidden",
            background: "#0b1220",
            flex: "0 0 auto",
          }}
          title={name}
        >
          {pic ? (
            <img
              src={pic}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%" }} />
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          {/* ✅ On mobile we’ll shrink font a bit and allow full name */}
          <div className="muTeamName" style={{ color: TEXT, fontWeight: 800, lineHeight: 1.05 }}>
            {name}
          </div>

          {/* ✅ stats blank placeholder */}
          <div className="muTeamFp" style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>
  {statsReady ? `${totals.fp.toFixed(1)} FP` : "— FP"}
</div>


          
        </div>

        {/* keep spacing balanced */}
        <div style={{ marginLeft: "auto", color: MUTED, fontSize: 12, flex: "0 0 auto" }}>
          {/* blank */}
        </div>
      </div>
    );
  };

  const rowBg = (pos, side) => {
    const p = normPos(pos);
    // mirrored gradients left vs right
    if (p === "F") {
      return side === "left"
        ? "linear-gradient(90deg, rgba(34,197,94,0.20), rgba(34,197,94,0.04))"
        : "linear-gradient(270deg, rgba(34,197,94,0.20), rgba(34,197,94,0.04))";
    }
    if (p === "D") {
      return side === "left"
        ? "linear-gradient(90deg, rgba(168,85,247,0.22), rgba(168,85,247,0.05))"
        : "linear-gradient(270deg, rgba(168,85,247,0.22), rgba(168,85,247,0.05))";
    }
    // G or unknown
    return side === "left"
      ? "linear-gradient(90deg, rgba(59,130,246,0.18), rgba(59,130,246,0.04))"
      : "linear-gradient(270deg, rgba(59,130,246,0.18), rgba(59,130,246,0.04))";
  };

  const renderPlayerRow = (p, side) => {
    if (!p) {
      // empty spacer row so both sides stay same height (keeps divider centered)
      return (
        <div
          style={{
            padding: "10px 10px",
            borderBottom: `1px solid rgba(148,163,184,0.10)`,
            minHeight: 48,
          }}
        />
      );
    }

const name = String(getDisplayName(p)).trim() || "Unknown player";
    const pos = normPos(p?.position);
const st = getPlayerStats(p);
const fp = calcFP(st);

    return (
      <div
        style={{
          padding: "10px 10px",
          borderBottom: `1px solid rgba(148,163,184,0.10)`,
          background: rowBg(pos, side),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            minWidth: 0,
          }}
        >
          <div style={{ color: TEXT, fontWeight: 700, fontSize: 13, minWidth: 0 }}>
            <span style={{ opacity: 0.9, marginRight: 8 }}>{name}</span>
          </div>

        

<div style={{ marginLeft: "auto", color: TEXT, fontWeight: 900, fontSize: 13 }}>
  {statsReady && st ? fp.toFixed(1) : "—"}
  <span style={{ color: MUTED, fontWeight: 800, fontSize: 11, marginLeft: 6 }}>FP</span>
</div>

        </div>

        {/* ✅ stats blank placeholders */}
        <div
          style={{
            marginTop: 4,
            color: MUTED,
            fontSize: 11,
            letterSpacing: 0.1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {statsReady && st
  ? `${st.gamesPlayed ?? 0} GP • ${st.goals ?? 0} G • ${st.assists ?? 0} A • ${st.points ?? 0} P`
  : "— GP • — G • — A • — P"}

        </div>
      </div>
    );
  };

  const panelStyle = {
    border: `1px solid ${BORDER}`,
    borderRadius: 16,
    background: PANEL_BG,
    boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
  };

const isReady = teamsArr.length > 0;

  return (
    <div style={{ padding: "8px 2px 24px" }}>
      {/* local styles for responsiveness */}
      <style>{`
        .muHeaderRow {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }
        .muTitle { font-size: 44px; font-weight: 900; margin: 0; color: ${TEXT}; letter-spacing: 0.2px; }
        .muSub { margin-top: 6px; color: ${MUTED}; font-size: 13px; }
        .muTopActions { display: flex; gap: 10px; align-items: center; }

        .muBtn {
          border: 1px solid #334155;
          background: #0b1220;
          color: ${TEXT};
          padding: 8px 10px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 800;
          font-size: 13px;
        }
        .muBtn:disabled { opacity: 0.45; cursor: not-allowed; }

        .muGrid {
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 14px;
          align-items: start;
        }

        /* mobile: go edge-to-edge (fits screen) */
        @media (max-width: 920px) {
          .muTitle { font-size: 38px; }
          .muGrid { grid-template-columns: 1fr; }
          .muEdge { margin-left: -18px; margin-right: -18px; } /* matches your page padding */
        }

        /* tight phones */
        @media (max-width: 520px) {
          .muTitle { font-size: 34px; }
          .muTeamName { font-size: 12px; }
          .muTeamFp { font-size: 11px; }
        }
      `}</style>

      {/* Top header */}
      <div className="muHeaderRow">
        <div>
          <h1 className="muTitle">Matchups ...coming soooon...</h1>
          
        </div>

        <div className="muTopActions">
          <button className="muBtn" onClick={() => nav("/")}>
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Week controls */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <button
          className="muBtn"
          onClick={() => {
            setWeekIndex((w) => Math.max(0, w - 1));
            setSelectedPairIndex(0);
          }}
          disabled={!week || safeWeekIndex === 0}
          title="View previous week"
        >
          ← Prev week
        </button>

        <button
          className="muBtn"
          onClick={() => {
            setWeekIndex((w) => Math.min((weeks?.length || 1) - 1, w + 1));
            setSelectedPairIndex(0);
          }}
          disabled={!week || safeWeekIndex >= (weeks.length - 1)}
          title="View next week"
        >
          Next week →
        </button>

        <div style={{ marginLeft: "auto", color: MUTED, fontSize: 13 }}>
          {week ? (
            <span style={{ border: `1px solid ${BORDER}`, padding: "8px 10px", borderRadius: 999, background: "rgba(2,6,23,0.5)" }}>
              Viewing: {week.label}
            </span>
          ) : (
            <span />
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className={`muGrid ${"muEdge"}`}>
        {/* LEFT: Week overview */}
        <div style={{ ...panelStyle, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <div style={{ fontWeight: 900, color: TEXT }}>Week Overview</div>
            <div style={{ color: MUTED, fontSize: 12 }}>{week ? week.label : ""}</div>
          </div>

          {!isReady ? (
            <div style={{ color: MUTED, fontSize: 13, padding: 10 }}>
              Waiting for league teams…
            </div>
          ) : !week ? (
            <div style={{ color: MUTED, fontSize: 13, padding: 10 }}>
              Not enough teams to generate matchups.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {week.pairs.map((pair, idx) => {
                const a = teamsByName.get(pair[0]);
                const b = teamsByName.get(pair[1]);
                const aTotals = teamTotals(getRosterPlayersNoIR(a));
  const bTotals = teamTotals(getRosterPlayersNoIR(b));

                const selected = idx === safePairIndex;

                return (
                  <button
                    key={`${pair[0]}-${pair[1]}-${idx}`}
                    onClick={() => setSelectedPairIndex(idx)}
                    style={{
                      textAlign: "left",
                      padding: 10,
                      borderRadius: 14,
                      border: selected ? "1px solid rgba(147,197,253,0.55)" : `1px solid ${BORDER}`,
                      background: selected ? "rgba(30,64,175,0.18)" : "rgba(2,6,23,0.45)",
                      cursor: "pointer",
                      color: TEXT,
                    }}
                    
                  >
                    {/* ✅ clearer: Team A FP vs FP Team B */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 999,
                            overflow: "hidden",
                            border: `1px solid ${BORDER}`,
                            background: "#0b1220",
                            flex: "0 0 auto",
                          }}
                        >
                          {a?.profilePic ? (
                            <img src={a.profilePic} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : null}
                        </div>
                        <div style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 900 }}>
                          {pair[0]}
                        </div>
                      </div>

                      <div style={{ color: MUTED, fontWeight: 900, fontSize: 12, whiteSpace: "nowrap" }}>
  {statsReady ? `${aTotals.fp.toFixed(1)} FP` : "— FP"}{" "}
  <span style={{ opacity: 0.8 }}>vs</span>{" "}
  {statsReady ? `${bTotals.fp.toFixed(1)} FP` : "— FP"}
</div>


                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, minWidth: 0 }}>
                        <div style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 900 }}>
                          {pair[1]}
                        </div>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 999,
                            overflow: "hidden",
                            border: `1px solid ${BORDER}`,
                            background: "#0b1220",
                            flex: "0 0 auto",
                          }}
                        >
                          {b?.profilePic ? (
                            <img src={b.profilePic} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : null}
                        </div>
                      </div>
                    </div>

                   
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 10, color: MUTED, fontSize: 11 }}>
            Stats are coming next — for now this page shows real rosters (no IR) with “—” placeholders.
          </div>
        </div>

        {/* RIGHT: combined breakdown panel with vertical divider */}
        <div style={{ ...panelStyle, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
            <div style={{ color: TEXT, fontWeight: 900, fontSize: 16, minWidth: 0 }}>
              {selectedPair ? (
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                  {selectedPair[0]} vs {selectedPair[1]}
                </span>
              ) : (
                "Matchup"
              )}
              
            </div>

            <div style={{ color: MUTED, fontSize: 12, fontWeight: 800 }}>
              {/* placeholder */}
            </div>
          </div>

          {/* Teams header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1px 1fr",
              gap: 0,
              border: `1px solid rgba(148,163,184,0.12)`,
              borderRadius: 14,
              overflow: "hidden",
              background: "rgba(2,6,23,0.45)",
            }}
          >
            <div style={{ padding: 10 }}>{renderTeamChip(leftTeam, "left")}</div>

            {/* ✅ centered divider: grid middle column is the divider */}
            <div style={{ background: "rgba(148,163,184,0.18)" }} />

            <div style={{ padding: 10 }}>{renderTeamChip(rightTeam, "right")}</div>
          </div>

          {/* Players grid */}
          <div
            style={{
              marginTop: 10,
              border: `1px solid rgba(148,163,184,0.12)`,
              borderRadius: 14,
              overflow: "hidden",
              background: "rgba(2,6,23,0.45)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1px 1fr",
                gap: 0,
              }}
            >
              <div>
                {Array.from({ length: rowCount }).map((_, i) =>
                  renderPlayerRow(leftPlayers[i] || null, "left")
                )}
              </div>

              {/* ✅ this stays perfectly centered because it is the middle grid column */}
              <div style={{ background: "rgba(148,163,184,0.18)" }} />

              <div>
                {Array.from({ length: rowCount }).map((_, i) =>
                  renderPlayerRow(rightPlayers[i] || null, "right")
                )}
              </div>
            </div>

            {/* Weekly totals footer */}
<div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 1px 1fr",
    background: "rgba(2,6,23,0.55)",
    borderTop: `1px solid rgba(148,163,184,0.12)`,
  }}
>
  {/* LEFT */}
  <div style={{ padding: "10px 10px", color: MUTED, fontSize: 12, fontWeight: 800 }}>
    Weekly totals:{" "}
    {statsReady
      ? `${leftTotals.gp} GP • ${leftTotals.g} G • ${leftTotals.a} A • ${leftTotals.pts} P • ${leftTotals.fp.toFixed(1)} FP`
      : "— GP • — G • — A • — P • — FP"}
  </div>

  {/* CENTER DIVIDER (this was missing) */}
  <div style={{ background: "rgba(148,163,184,0.18)" }} />

  {/* RIGHT */}
  <div style={{ padding: "10px 10px", color: MUTED, fontSize: 12, fontWeight: 800 }}>
    Weekly totals:{" "}
    {statsReady
      ? `${rightTotals.gp} GP • ${rightTotals.g} G • ${rightTotals.a} A • ${rightTotals.pts} P • ${rightTotals.fp.toFixed(1)} FP`
      : "— GP • — G • — A • — P • — FP"}
  </div>
</div>
</div>
          {/* Guardrails */}
          {!currentUser ? (
            <div style={{ marginTop: 10, color: MUTED, fontSize: 12 }}>
              Log in as a manager to view matchups (read-only for now).
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
