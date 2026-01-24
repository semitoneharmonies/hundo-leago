// src/components/TopBar.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import LeagueRulesDropdown from "./LeagueRulesDropdown";

function TopBar({
  currentUser,
  loginTeamName,
  loginPassword,
  loginError,
  selectedTeamName,
  teams,
  managers,
  setLoginTeamName,
  setLoginPassword,
  handleLogin,
  handleLogout,
  setSelectedTeamName,
  notifications,
  unreadCount,
  onMarkAllNotificationsRead,
  freezeBanner,

}) {



  const [notifOpen, setNotifOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  const bellRef = useRef(null);
  const rulesRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      const target = e.target;

      const clickedBell = bellRef.current && bellRef.current.contains(target);
      const clickedRules = rulesRef.current && rulesRef.current.contains(target);

      if (!clickedBell) setNotifOpen(false);
      if (!clickedRules) setRulesOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div
      style={{
        position: "static",
        top: 0,
        zIndex: 50,
        background: "#07162b",
        borderBottom: "1px solid #1f2937",
        padding: "6px 10px",
        marginBottom: "16px",
      }}
    >
<div className={`topBar ${currentUser ? "" : "loggedOut"}`}>
  {/* LEFT cluster: Brand + Nav */}
  <div className="topbarLeft">
    <div className="topbarBrand">HUNDO LEAGO</div>

    {currentUser && (
      <div className="topbarNav">
        <div ref={rulesRef} style={{ position: "relative", zIndex: 5000 }}>
          <button
            onClick={() => {
              setRulesOpen((prev) => !prev);
              setNotifOpen(false);
            }}
            title="League Rules"
            className="topbarBtn"
            style={{
              border: "1px solid #334155",
              background: "#0b1220",
              color: "#e5e7eb",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            League Rules
          </button>

          {rulesOpen && <LeagueRulesDropdown onClose={() => setRulesOpen(false)} />}
        </div>

        <Link
          to="/free-agents"
          title="Free Agents"
          className="topbarBtn"
          style={{
            display: "inline-flex",
            alignItems: "center",
            border: "1px solid #334155",
            background: "#0b1220",
            color: "#e5e7eb",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Free Agents
        </Link>
   <Link
  to="/matchups"
  title="Matchups"
  className="topbarBtn"
  style={{
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid #334155",
    background: "#0b1220",
    color: "#e5e7eb",
    textDecoration: "none",
    whiteSpace: "nowrap",
  }}
>
  Matchups
</Link>


      </div>
    )}
  </div>

  {/* RIGHT cluster: (login form) OR (user + logout) */}
<div className={`topbarRight ${currentUser ? "" : "loggedOut"}`}>
  {!currentUser ? (
    <form
      className="topbarAuth stacked"
      onSubmit={(e) => {
        e.preventDefault();
        handleLogin();
      }}
    >


       <select
  value={loginTeamName}
  onChange={(e) => setLoginTeamName(e.target.value)}
>

          <option value="">Select team / Commissioner</option>
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

        <button type="submit">Login</button>
      </form>
    ) : (
      <>
        <div className="topbarUser">
          <span
            style={{
              color: "#9ca3af",
              borderRadius: 999,
              border: "1px solid #374151",
              background: "#020617",
              whiteSpace: "nowrap",
            }}
          >
            {currentUser.role === "commissioner" ? "Commissioner" : currentUser.teamName}
          </span>

          <div ref={bellRef} style={{ position: "relative" }}>
            <button
              onClick={() => {
                const next = !notifOpen;
                setNotifOpen(next);
                setRulesOpen(false);

                if (next && unreadCount > 0 && typeof onMarkAllNotificationsRead === "function") {
                  onMarkAllNotificationsRead();
                }
              }}
              title="Notifications"
              style={{
                position: "relative",
                borderRadius: 10,
                border: "1px solid #334155",
                background: "#0b1220",
                color: unreadCount > 0 ? "#e5e7eb" : "#64748b",
                cursor: "pointer",
              }}
            >
              🔔
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    background: "#ef4444",
                    color: "#fff",
                    borderRadius: 999,
                    padding: "2px 6px",
                    fontSize: "0.75rem",
                    border: "1px solid #0b1220",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {/* dropdown stays the same as your existing code */}
            {notifOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "110%",
                  width: 320,
                  background: "#020617",
                  border: "1px solid #1e293b",
                  borderRadius: 10,
                  padding: 10,
                  zIndex: 6000,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                }}
              >
                {/* paste your existing notifications dropdown contents here */}
              </div>
            )}
          </div>
        </div>

        <button className="topbarLogout" onClick={handleLogout}>
          Logout
        </button>
      </>
    )}
  </div>
</div>


            {freezeBanner && (
        <div
          style={{
            marginTop: "8px",
            padding: "10px 12px",
            borderRadius: "10px",
            border: "1px solid #7f1d1d",
            background: "#2a0f12",
            color: "#fecaca",
            fontWeight: 700,
          }}
        >
          {freezeBanner}
        </div>
      )}
    </div>
  );
}

export default TopBar;
