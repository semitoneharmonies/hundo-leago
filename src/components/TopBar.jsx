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
  const selectedTeam = useMemo(() => {
  const safeTeams = Array.isArray(teams) ? teams : [];
  return safeTeams.find((t) => t.name === selectedTeamName) || null;
}, [teams, selectedTeamName]);


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
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#07162b",
        borderBottom: "1px solid #1f2937",
        padding: "8px 12px",
        marginBottom: "16px",
      }}
    >
      <div
  className="topBar"
  style={{
    display: "flex",
    flexWrap: "nowrap",           // ✅ do not wrap
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
overflow: "hidden",
           // ✅ prevents accidental overflow from breaking layout
  }}
>

        {/* Left: Title + League Rules + Free Agents */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "nowrap",
    minWidth: 0,
    flexShrink: 0,
  }}
>
  <div
    style={{
      fontSize: "1.75rem",
      fontWeight: 900,
      letterSpacing: "0.5px",
      color: "#f97316",
      textShadow: "0 0 8px rgba(249,115,22,0.4)",
      fontFamily: "'Oswald', sans-serif",
      whiteSpace: "nowrap",
    }}
  >
    HUNDO LEAGO
  </div>

  {/* League Rules button + dropdown */}
  {currentUser && (
    <div ref={rulesRef} style={{ position: "relative" }}>
      <button
        onClick={() => {
          setRulesOpen((prev) => !prev);
          setNotifOpen(false);
        }}
        title="League Rules"
        style={{
          padding: "6px 10px",
          borderRadius: "8px",
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
  )}

  {/* Free Agents link */}
  {currentUser && (
    <Link
      to="/free-agents"
      title="Free Agents"
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
      }}
    >
      Free Agents
    </Link>
  )}
</div>


        {/* Middle: Selected team logo + View Team selector */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#0f172a",
            padding: "6px 12px",
            borderRadius: "8px",
            border: "1px solid #1e293b",
            flex: "0 0 auto",

          }}
        >
          {selectedTeam?.profilePic ? (
            <img
              src={selectedTeam.profilePic}
              alt={`${selectedTeam.name} logo`}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #4b5563",
              }}
            />
          ) : (
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "#111827",
                border: "2px solid #4b5563",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9ca3af",
                fontSize: "0.7rem",
              }}
            >
              {selectedTeam ? selectedTeam.name.charAt(0) : "?"}
            </div>
          )}

          <span
            style={{
              color: "#e5e7eb",
              fontSize: "0.95rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            View Team
          </span>

          <select
  value={selectedTeamName}
  onChange={(e) => setSelectedTeamName(e.target.value)}
  style={{
    background: "#1e293b",
    color: "#f8fafc",
    border: "1px solid #334155",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "0.9rem",
    fontWeight: 500,
    cursor: "pointer",
    minWidth: "150px",
  }}
>
  <option value="" disabled>
    Select a team…
  </option>

  {(Array.isArray(teams) ? teams : []).map((t) => (
    <option key={t.name} value={t.name}>
      {t.name}
    </option>
  ))}
</select>

        </div>

        {/* Right: Login / Logout + Notifications */}
<div style={{ flexShrink: 0 }}>
          {!currentUser ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              style={{
                display: "flex",
                flexWrap: "nowrap",
                gap: "6px",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <select
                value={loginTeamName}
                onChange={(e) => setLoginTeamName(e.target.value)}
                style={{ minWidth: "160px" }}
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
                style={{ minWidth: "120px" }}
              />

              <button type="submit">Login</button>
            </form>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              {/* Role chip */}
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#9ca3af",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  border: "1px solid #374151",
                  background: "#020617",
                  whiteSpace: "nowrap",
                }}
              >
                {currentUser.role === "commissioner"
                  ? "Commissioner"
                  : currentUser.teamName}
              </span>

              {/* Notifications bell + dropdown */}
              <div ref={bellRef} style={{ position: "relative" }}>
                <button
                  onClick={() => {
                    const next = !notifOpen;
                    setNotifOpen(next);
                    setRulesOpen(false);

                    if (
                      next &&
                      unreadCount > 0 &&
                      typeof onMarkAllNotificationsRead === "function"
                    ) {
                      onMarkAllNotificationsRead();
                    }
                  }}
                  title="Notifications"
                  style={{
                    position: "relative",
                    padding: "6px 10px",
                    borderRadius: "8px",
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
                        top: "-6px",
                        right: "-6px",
                        background: "#ef4444",
                        color: "#fff",
                        borderRadius: "999px",
                        padding: "2px 6px",
                        fontSize: "0.75rem",
                        border: "1px solid #0b1220",
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "110%",
                      width: "320px",
                      background: "#020617",
                      border: "1px solid #1e293b",
                      borderRadius: "10px",
                      padding: "10px",
                      zIndex: 60,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <strong style={{ color: "#e5e7eb" }}>Notifications</strong>
                      <button
                        onClick={() => setNotifOpen(false)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          fontSize: "0.9rem",
                        }}
                        title="Close"
                      >
                        ✕
                      </button>
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        maxHeight: "280px",
                        overflowY: "auto",
                      }}
                    >
                      {(notifications || []).length === 0 ? (
                        <div
                          style={{
                            color: "#94a3b8",
                            fontSize: "0.9rem",
                            padding: "8px 2px",
                          }}
                        >
                          No new notifications.
                        </div>
                      ) : (
                        (notifications || []).slice(0, 20).map((n) => (
                          <div
                            key={n.id}
                            style={{
                              border: "1px solid #1f2937",
                              borderRadius: "8px",
                              padding: "8px",
                              marginTop: "8px",
                              background: n.unread ? "#0b1220" : "#020617",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 10,
                              }}
                            >
                              <div
                                style={{
                                  color: "#e5e7eb",
                                  fontWeight: 600,
                                  fontSize: "0.9rem",
                                }}
                              >
                                {n.title}
                              </div>
                              {n.unread && (
                                <span
                                  style={{ color: "#fca5a5", fontSize: "0.75rem" }}
                                >
                                  NEW
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                color: "#94a3b8",
                                fontSize: "0.85rem",
                                marginTop: 4,
                              }}
                            >
                              {n.body}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {(notifications || []).length > 0 && (
                      <button
                        onClick={() => {
                          if (typeof onMarkAllNotificationsRead === "function") {
                            onMarkAllNotificationsRead();
                          }
                        }}
                        style={{
                          marginTop: "10px",
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: "1px solid #334155",
                          background: "#0b1220",
                          color: "#e5e7eb",
                          cursor: "pointer",
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button onClick={handleLogout}>Logout</button>
            </div>
          )}

          {loginError && !currentUser && (
            <p
              style={{
                color: "#f97373",
                marginTop: "4px",
                fontSize: "0.8rem",
                textAlign: "right",
              }}
            >
              {loginError}
            </p>
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
