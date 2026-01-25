// src/pages/MatchupsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
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

function formatPT(ms) {
  if (!Number.isFinite(ms)) return "—";
  // show PT explicitly so we don't get lost in UTC again
  return new Date(ms).toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }) + " PT";
}

export default function MatchupsPage({
  currentUser,
  teams,
  playerApi,
  statsByPlayerId,
  statsReady,
  apiBaseUrl,
}) {
  const nav = useNavigate();

  const apiBaseUrlSafe = String(apiBaseUrl || "")
    .trim()
    .replace(/\/+$/, "");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [currentWeekId, setCurrentWeekId] = useState(null);
  const [week, setWeek] = useState(null);

  useEffect(() => {
    let alive = true;

    const apiOk =
      apiBaseUrlSafe &&
      apiBaseUrlSafe !== "undefined" &&
      apiBaseUrlSafe !== "null";

    async function run() {
      try {
        setLoading(true);
        setErr("");

        const r = await fetch(`${apiBaseUrlSafe}/api/matchups/current`);
        const j = await r.json();

        if (!alive) return;

        if (!r.ok || !j?.week) {
          setWeek(null);
          setCurrentWeekId(j?.currentWeekId || null);
          setErr(j?.error || "Matchups not ready yet (no week returned).");
          setLoading(false);
          return;
        }

        setCurrentWeekId(j.currentWeekId || j.week?.weekId || null);
        setWeek(j.week);
        setLoading(false);
      } catch (e) {
        if (!alive) return;
        setErr(String(e?.message || e));
        setWeek(null);
        setLoading(false);
      }
    }

    if (apiOk) run();
    else {
      setLoading(false);
      setErr("Missing apiBaseUrl (App is not passing backend URL).");
    }

    return () => {
      alive = false;
    };
  }, [apiBaseUrlSafe]);


  // ---------------------------
  // existing stats helpers
  // ---------------------------
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
    let gp = 0,
      g = 0,
      a = 0,
      pts = 0,
      fp = 0;
    for (const p of players) {
      const st = getPlayerStats(p);
      if (!st) continue;
      gp += Number(st.gamesPlayed || 0);
      g += Number(st.goals || 0);
      a += Number(st.assists || 0);
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

  const teamsByName = useMemo(() => {
    const m = new Map();
    teamsArr.forEach((t) => {
      if (t?.name) m.set(t.name, t);
    });
    return m;
  }, [teamsArr]);

  // backend week pairs
  const pairs = Array.isArray(week?.pairs) ? week.pairs : [];

  // default selected matchup = first in the week
  const [selectedPairIndex, setSelectedPairIndex] = useState(0);
  const safePairIndex = clamp(
    selectedPairIndex,
    0,
    Math.max(0, (pairs?.length || 1) - 1)
  );
  const selectedPair = pairs?.[safePairIndex] || null;

  // reset selected pair if week changes
  useEffect(() => {
    setSelectedPairIndex(0);
  }, [currentWeekId]);

  const getDisplayName = (p) => {
    const pid = Number(p?.playerId);
    if (Number.isFinite(pid) && playerApi?.getPlayerNameById) {
      return playerApi.getPlayerNameById(pid) || p?.name || "Unknown player";
    }
    return p?.name || "Unknown player";
  };

  const leftTeam = selectedPair ? teamsByName.get(selectedPair[0]) : null;
  const rightTeam = selectedPair ? teamsByName.get(selectedPair[1]) : null;

  const leftPlayers = useMemo(
    () => getRosterPlayersNoIR(leftTeam),
    [leftTeam]
  );
  const rightPlayers = useMemo(
    () => getRosterPlayersNoIR(rightTeam),
    [rightTeam]
  );

  const rowCount = Math.max(leftPlayers.length, rightPlayers.length, 1);

  const leftTotals = useMemo(() => teamTotals(leftPlayers), [leftPlayers]);
  const rightTotals = useMemo(() => teamTotals(rightPlayers), [rightPlayers]);

  const renderTeamChip = (team) => {
    const name = team?.name || "—";
    const pic = team?.profilePic || null;
    const players = getRosterPlayersNoIR(team);
    const totals = teamTotals(players);

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
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
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%" }} />
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          <div className="muTeamName" style={{ color: TEXT, fontWeight: 800, lineHeight: 1.05 }}>
            {name}
          </div>

          <div className="muTeamFp" style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>
            {statsReady ? `${totals.fp.toFixed(1)} FP` : "— FP"}
          </div>
        </div>

        <div style={{ marginLeft: "auto", color: MUTED, fontSize: 12, flex: "0 0 auto" }} />
      </div>
    );
  };

  const rowBg = (pos, side) => {
    const p = normPos(pos);
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
    return side === "left"
      ? "linear-gradient(90deg, rgba(59,130,246,0.18), rgba(59,130,246,0.04))"
      : "linear-gradient(270deg, rgba(59,130,246,0.18), rgba(59,130,246,0.04))";
  };

  const renderPlayerRow = (p, side) => {
    if (!p) {
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
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
          <div style={{ color: TEXT, fontWeight: 700, fontSize: 13, minWidth: 0 }}>
            <span style={{ opacity: 0.9, marginRight: 8 }}>{name}</span>
          </div>

          <div style={{ marginLeft: "auto", color: TEXT, fontWeight: 900, fontSize: 13 }}>
            {statsReady && st ? fp.toFixed(1) : "—"}
            <span style={{ color: MUTED, fontWeight: 800, fontSize: 11, marginLeft: 6 }}>FP</span>
          </div>
        </div>

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

        @media (max-width: 920px) {
          .muTitle { font-size: 38px; }
          .muGrid { grid-template-columns: 1fr; }
          .muEdge { margin-left: -18px; margin-right: -18px; }
        }

        @media (max-width: 520px) {
          .muTitle { font-size: 34px; }
          .muTeamName { font-size: 12px; }
          .muTeamFp { font-size: 11px; }
        }
      `}</style>

      {/* Top header */}
      <div className="muHeaderRow">
        <div>
          <h1 className="muTitle">Matchups</h1>
          <div className="muSub">
            {loading
              ? "Loading current week…"
              : week
              ? `Current: ${week.weekId || currentWeekId || "—"}`
              : "Matchups not ready yet."}
          </div>
        </div>

        <div className="muTopActions">
          <button className="muBtn" onClick={() => nav("/")}>
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Timing row (backend truth) */}
      <div style={{ ...panelStyle, padding: 12, marginBottom: 12 }}>
        <div style={{ fontWeight: 900, color: TEXT, marginBottom: 8 }}>Week timing (PT)</div>

        {loading ? (
          <div style={{ color: MUTED, fontSize: 13 }}>Loading…</div>
        ) : week ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
            <div>
              <div style={{ color: MUTED, fontSize: 11, fontWeight: 800 }}>Start</div>
              <div style={{ color: TEXT, fontSize: 12, fontWeight: 900 }}>{formatPT(week.weekStartAtMs)}</div>
            </div>
            <div>
              <div style={{ color: MUTED, fontSize: 11, fontWeight: 800 }}>Baseline</div>
              <div style={{ color: TEXT, fontSize: 12, fontWeight: 900 }}>{formatPT(week.baselineAtMs)}</div>
            </div>
            <div>
              <div style={{ color: MUTED, fontSize: 11, fontWeight: 800 }}>Lock</div>
              <div style={{ color: TEXT, fontSize: 12, fontWeight: 900 }}>{formatPT(week.lockAtMs)}</div>
            </div>
            <div>
              <div style={{ color: MUTED, fontSize: 11, fontWeight: 800 }}>End</div>
              <div style={{ color: TEXT, fontSize: 12, fontWeight: 900 }}>{formatPT(week.weekEndAtMs)}</div>
            </div>
            <div>
              <div style={{ color: MUTED, fontSize: 11, fontWeight: 800 }}>Rollover</div>
              <div style={{ color: TEXT, fontSize: 12, fontWeight: 900 }}>{formatPT(week.rolloverAtMs)}</div>
            </div>
          </div>
        ) : (
          <div style={{ color: MUTED, fontSize: 13 }}>
            {err ? `Error: ${err}` : "No current week returned from backend."}
          </div>
        )}
      </div>

      {/* Main layout */}
      <div className={`muGrid ${"muEdge"}`}>
        {/* LEFT: Week overview */}
        <div style={{ ...panelStyle, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <div style={{ fontWeight: 900, color: TEXT }}>Week Overview</div>
            <div style={{ color: MUTED, fontSize: 12 }}>{week?.weekId || currentWeekId || ""}</div>
          </div>

          {!isReady ? (
            <div style={{ color: MUTED, fontSize: 13, padding: 10 }}>Waiting for league teams…</div>
          ) : loading ? (
            <div style={{ color: MUTED, fontSize: 13, padding: 10 }}>Loading current week…</div>
          ) : !week ? (
            <div style={{ color: MUTED, fontSize: 13, padding: 10 }}>
              {err ? `Error: ${err}` : "Matchups not ready yet."}
            </div>
          ) : pairs.length === 0 ? (
            <div style={{ color: MUTED, fontSize: 13, padding: 10 }}>No pairs for this week.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pairs.map((pair, idx) => {
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
                        {statsReady ? `${aTotals.fp.toFixed(1)} FP` : "— FP"} <span style={{ opacity: 0.8 }}>vs</span>{" "}
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
            Week + pairs come from backend now. This page is read-only.
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

            <div style={{ color: MUTED, fontSize: 12, fontWeight: 800 }} />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(280px, 1fr) 1px minmax(280px, 1fr)",
              gap: 0,
              border: `1px solid rgba(148,163,184,0.12)`,
              borderRadius: 14,
              overflow: "hidden",
              background: "rgba(2,6,23,0.45)",
            }}
          >
            <div style={{ padding: 10 }}>{renderTeamChip(leftTeam)}</div>
            <div style={{ background: "rgba(148,163,184,0.18)" }} />
            <div style={{ padding: 10 }}>{renderTeamChip(rightTeam)}</div>
          </div>

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
    gridTemplateColumns: "minmax(280px, 1fr) 1px minmax(280px, 1fr)",
    gap: 0,
  }}
>
  {/* LEFT column */}
  <div>
    {Array.from({ length: rowCount }).map((_, i) => {
      const p = leftPlayers[i] || null;
      const pid = p?.playerId ? String(p.playerId) : "";
      const nm = p?.name ? String(p.name) : "";
      const key = `L-${pid || nm || "empty"}-${i}`;
      return <React.Fragment key={key}>{renderPlayerRow(p, "left")}</React.Fragment>;
    })}
  </div>

  {/* divider */}
  <div style={{ background: "rgba(148,163,184,0.18)" }} />

  {/* RIGHT column */}
  <div>
    {Array.from({ length: rowCount }).map((_, i) => {
      const p = rightPlayers[i] || null;
      const pid = p?.playerId ? String(p.playerId) : "";
      const nm = p?.name ? String(p.name) : "";
      const key = `R-${pid || nm || "empty"}-${i}`;
      return <React.Fragment key={key}>{renderPlayerRow(p, "right")}</React.Fragment>;
    })}
  </div>
</div>


            <div
              style={{
                display: "grid",
gridTemplateColumns: "minmax(280px, 1fr) 1px minmax(280px, 1fr)",
                background: "rgba(2,6,23,0.55)",
                borderTop: `1px solid rgba(148,163,184,0.12)`,
              }}
            >
              <div style={{ padding: "10px 10px", color: MUTED, fontSize: 12, fontWeight: 800 }}>
                Weekly totals:{" "}
                {statsReady
                  ? `${leftTotals.gp} GP • ${leftTotals.g} G • ${leftTotals.a} A • ${leftTotals.pts} P • ${leftTotals.fp.toFixed(1)} FP`
                  : "— GP • — G • — A • — P • — FP"}
              </div>

              <div style={{ background: "rgba(148,163,184,0.18)" }} />

              <div style={{ padding: "10px 10px", color: MUTED, fontSize: 12, fontWeight: 800 }}>
                Weekly totals:{" "}
                {statsReady
                  ? `${rightTotals.gp} GP • ${rightTotals.g} G • ${rightTotals.a} A • ${rightTotals.pts} P • ${rightTotals.fp.toFixed(1)} FP`
                  : "— GP • — G • — A • — P • — FP"}
              </div>
            </div>
          </div>

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
