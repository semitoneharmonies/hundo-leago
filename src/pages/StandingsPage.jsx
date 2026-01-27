import React, { useEffect, useMemo, useState } from "react";

/* ================================
   API wiring
   ================================ */
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000/api/league")
  .trim()
  .replace(/\/+$/, "");

const API_BASE_URL = API_URL
  .replace(/\/api\/league\/?$/, "")
  .replace(/\/+$/, "");

/* ================================
   Theme + sizing (match Free Agents vibe)
   ================================ */
const TABLE_BG = "#020617";
const HEADER_BG = "#0b1224"; // noticeably different from table bg
const BORDER = "#1f2937";
const BORDER_GLOW = "rgba(56,189,248,0.18)";
const TEXT = "#e5e7eb";
const MUTED = "#9ca3af";
const ROW_HOVER = "rgba(56,189,248,0.08)";

const MEDAL_GOLD =
  "linear-gradient(90deg, rgba(255,193,7,0.28) 0%, rgba(2,6,23,0.0) 70%)";

const MEDAL_SILVER =
  "linear-gradient(90deg, rgba(203,213,225,0.25) 0%, rgba(2,6,23,0.0) 70%)";

const MEDAL_BRONZE =
  "linear-gradient(90deg, rgba(251,146,60,0.25) 0%, rgba(2,6,23,0.0) 70%)";



// ~25% bigger
const SCALE = 1.25;

/* ================================
   Styles (all sized from SCALE)
   ================================ */
const thBase = {
  padding: `${Math.round(8 * SCALE)}px ${Math.round(6 * SCALE)}px`,
  fontSize: Math.round(11 * SCALE),
  fontWeight: 800,
  color: TEXT,
  borderBottom: `1px solid ${BORDER}`,
  whiteSpace: "nowrap",
  cursor: "pointer",
  letterSpacing: 0.2,
};

const thLeft = {
  ...thBase,
  textAlign: "left",
  cursor: "default",
};

const th = {
  ...thBase,
  textAlign: "right",
};

const tdBase = {
  padding: `${Math.round(7 * SCALE)}px ${Math.round(6 * SCALE)}px`,
  fontSize: Math.round(12 * SCALE),
  borderTop: `1px solid ${BORDER}`,
  whiteSpace: "nowrap",
  fontWeight: 600,
};

const td = {
  ...tdBase,
  textAlign: "right",
  width: Math.round(28 * SCALE), // numeric cols stay tight
};

const tdBold = {
  ...td,
  fontWeight: 800,
};

const tdTeam = {
  ...tdBase,
  textAlign: "left",
  fontWeight: 900,
  fontSize: Math.round(14 * SCALE),
  display: "flex",
  alignItems: "center",
  gap: Math.round(10 * SCALE),
  maxWidth: Math.round(200 * SCALE),
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export default function StandingsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // default sort: PTS desc → % desc
  const [sort, setSort] = useState({ key: "PTS", dir: "desc" });

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/matchups/standings`)
      .then((r) => r.json())
      .then(setData)
      .catch((e) => {
        console.error(e);
        setError("Failed to load standings");
      });
  }, []);

  const rows = useMemo(() => {
    if (!data?.standings) return [];

    return data.standings
      .map((row) => {
        const GP = row.GP;
        const PTS = row.W * 2 + row.T;
        const pct = GP === 0 ? 0 : PTS / (GP * 2);
        return { ...row, PTS, pct };
      })
      .sort((a, b) => {
        const dir = sort.dir === "asc" ? 1 : -1;

        if (a[sort.key] !== b[sort.key]) {
          return (a[sort.key] > b[sort.key] ? 1 : -1) * dir;
        }
        if (a.pct !== b.pct) {
          return (a.pct > b.pct ? 1 : -1) * dir;
        }
        return a.teamName.localeCompare(b.teamName);
      });
  }, [data, sort]);

  function toggleSort(key) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "desc" ? "asc" : "desc" }
        : { key, dir: "desc" }
    );
  }

  function label(text, key) {
    if (sort.key !== key) return text;
    return `${text} ${sort.dir === "desc" ? "▼" : "▲"}`;
  }

  return (
    <div style={{ padding: 16, color: TEXT, fontFamily: "inherit" }}>
      <h2 style={{ marginBottom: 6, fontWeight: 900, fontSize: 22 }}>
        Standings
      </h2>

      {error && <div style={{ color: "#ef4444" }}>{error}</div>}
      {!data && !error && <div>Loading…</div>}

      {data && (
        <>
          {data.weeksCounted === 0 && (
            <div style={{ color: MUTED, marginBottom: 10, fontSize: 14 }}>
              No games played yet.
            </div>
          )}

          {/* Table-only horizontal scroll, table centered */}
          <div
  style={{
    overflowX: "auto",
    paddingLeft: 12,
    paddingRight: 12,
  }}
>
              <table
                style={{
                  borderCollapse: "collapse",
                  background: TABLE_BG,
                  border: `1px solid ${BORDER}`,
                  boxShadow: `0 0 0 1px ${BORDER}, 0 0 18px ${BORDER_GLOW}`,
                  borderRadius: 10,
                  color: TEXT,
                  width: "auto",
                }}
              >
                <thead style={{ background: HEADER_BG }}>
                  <tr>
                    <th style={{ ...thLeft, maxWidth: Math.round(200 * SCALE) }}>
                      Team
                    </th>
                    <th style={th} onClick={() => toggleSort("W")}>
                      {label("W", "W")}
                    </th>
                    <th style={th} onClick={() => toggleSort("L")}>
                      {label("L", "L")}
                    </th>
                    <th style={th} onClick={() => toggleSort("T")}>
                      {label("T", "T")}
                    </th>
                    <th style={th} onClick={() => toggleSort("PTS")}>
                      {label("PTS", "PTS")}
                    </th>
                    <th style={th} onClick={() => toggleSort("pct")}>
                      {label("%", "pct")}
                    </th>
                    <th style={th} onClick={() => toggleSort("PF")}>
                      {label("FPF", "PF")}
                    </th>
                    <th style={th} onClick={() => toggleSort("PA")}>
                      {label("FPA", "PA")}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row) => (
                    <tr
  key={row.teamName}
  style={{
    background:
      rows.length >= 3
        ? row === rows[0]
          ? MEDAL_GOLD
          : row === rows[1]
          ? MEDAL_SILVER
          : row === rows[2]
          ? MEDAL_BRONZE
          : "transparent"
        : "transparent",
  }}
  onMouseEnter={(e) => (e.currentTarget.style.background = ROW_HOVER)}
  onMouseLeave={(e) => {
    const isTop =
      rows.length >= 3 &&
      (row === rows[0] || row === rows[1] || row === rows[2]);

    e.currentTarget.style.background = isTop
      ? row === rows[0]
        ? MEDAL_GOLD
        : row === rows[1]
        ? MEDAL_SILVER
        : MEDAL_BRONZE
      : "transparent";
  }}
>

                      <td style={tdTeam} title={row.teamName}>
                        <img
                          src={`/teams/${row.teamName}.png`}
                          alt=""
                          style={{
                            width: Math.round(20 * SCALE),
                            height: Math.round(20 * SCALE),
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: `1px solid ${BORDER}`,
                            flex: "0 0 auto",
                          }}
                        />
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.teamName}
                        </span>
                      </td>

                      <td style={td}>{row.W}</td>
                      <td style={td}>{row.L}</td>
                      <td style={td}>{row.T}</td>
                      <td style={tdBold}>{row.PTS}</td>
                      <td style={td}>
                        {row.GP === 0 ? "—" : (row.pct * 100).toFixed(1)}
                      </td>
                      <td style={td}>{row.PF}</td>
                      <td style={td}>{row.PA}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          
        </>
      )}
    </div>
  );
}
