// src/components/TopBar.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import LeagueRulesDropdown from "./LeagueRulesDropdown";

// Put your logo here:
import topbarLogo from "../assets/titleimage2.png";

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
  const [menuOpen, setMenuOpen] = useState(false);

  const bellRef = useRef(null);
  const rulesRef = useRef(null);
  const menuRef = useRef(null);
  const TOPBAR_HEIGHT = 80;  // ✅ keep bar the same height
const LOGO_HEIGHT = 100;   // ✅ you can change this freely
const LOGO_TOP = -15;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      const target = e.target;

      const clickedBell = bellRef.current && bellRef.current.contains(target);
      const clickedRules = rulesRef.current && rulesRef.current.contains(target);
      const clickedMenu = menuRef.current && menuRef.current.contains(target);

      if (!clickedBell) setNotifOpen(false);
      if (!clickedRules) setRulesOpen(false);
      if (!clickedMenu) setMenuOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const btnStyle = {
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid #334155",
    background: "#0b1220",
    color: "#e5e7eb",
    textDecoration: "none",
    whiteSpace: "nowrap",
    cursor: "pointer",
  };

  const dropdownStyle = {
    position: "absolute",
    left: 0,
    top: "110%",
    minWidth: 220,
    background: "#020617",
    border: "1px solid #1e293b",
    borderRadius: 10,
    padding: 8,
    zIndex: 6000,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  };

  const dropdownLinkStyle = {
    display: "block",
    padding: "10px 10px",
    borderRadius: 8,
    color: "#e5e7eb",
    textDecoration: "none",
  };

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
    overflow: "visible",
  }}
>
     <div
  className={`topBar ${currentUser ? "" : "loggedOut"}`}
  style={{
    height: TOPBAR_HEIGHT,
    overflow: "visible",
  }}
>

        {/* LEFT cluster: Menu dropdown (only when logged in) */}
        <div className="topbarLeft topbarMenuSlot" style={{ minWidth: 120 }}>
          {currentUser && (
            <div className="topbarNav">
              <div ref={menuRef} style={{ position: "relative", zIndex: 5000 }}>
                <button
                  onClick={() => {
                    setMenuOpen((p) => !p);
                    setNotifOpen(false);
                    setRulesOpen(false);
                  }}
                  title="Menu"
                  className="topbarBtn"
                  style={btnStyle}
                >
                  ☰ Menu
                </button>

                {menuOpen && (
                  <div style={dropdownStyle}>
                    {/* League Rules uses your existing dropdown component */}
                    <div ref={rulesRef} style={{ position: "relative" }}>
                      <button
                        onClick={() => {
                          setRulesOpen((p) => !p);
                          setNotifOpen(false);
                        }}
                        style={{
                          ...dropdownLinkStyle,
                          width: "100%",
                          textAlign: "left",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#0b1220")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        League Rules →
                      </button>

                      {rulesOpen && (
                        <div style={{ position: "relative" }}>
                          <LeagueRulesDropdown
                            onClose={() => setRulesOpen(false)}
                          />
                        </div>
                      )}
                    </div>

                    <Link
                      to="/free-agents"
                      style={dropdownLinkStyle}
                      onClick={() => setMenuOpen(false)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#0b1220")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      Players
                    </Link>

                    <Link
                      to="/matchups"
                      style={dropdownLinkStyle}
                      onClick={() => setMenuOpen(false)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#0b1220")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      Matchups
                    </Link>

                    <Link
                      to="/standings"
                      style={dropdownLinkStyle}
                      onClick={() => setMenuOpen(false)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#0b1220")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      Standings
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      {/* CENTER: Floating logo link to home (does not affect bar height) */}
{/* CENTER: Floating logo link to home (does not affect bar height) */}
<div
  className="topbarCenter"
  style={{
    flex: 1,
    position: "relative",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
    pointerEvents: "none",
  }}
>
  <Link
    className="topbarLogoLink"
    to="/"
    title="Home"
    style={{
      position: "absolute",
      left: "50%",
      top: LOGO_TOP,
      transform: "translateX(-50%)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      textDecoration: "none",
      zIndex: 9999,
      pointerEvents: "auto",
    }}
  >
    <img
      src={topbarLogo}
      alt="Hundo Leago"
      className="topbarLogo"
      style={{
        height: LOGO_HEIGHT,
        width: "auto",
        maxWidth: "70vw",
        objectFit: "contain",
        display: "block",
        filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.45))",
      }}
    />
  </Link>
</div>



        {/* RIGHT cluster: (login form) OR (user + notif + logout) */}
        <div className={`topbarRight ${currentUser ? "" : "loggedOut"}`}>
          {!currentUser ? (
            <form
              className="topbarAuth stacked"
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              <select value={loginTeamName} onChange={(e) => setLoginTeamName(e.target.value)}>
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

              {/* If you show loginError somewhere else already, ignore this */}
              {loginError ? (
                <div style={{ color: "#fca5a5", fontSize: "0.85rem", marginTop: 6 }}>
                  {loginError}
                </div>
              ) : null}
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
                    padding: "6px 10px",
                    display: "inline-flex",
                    alignItems: "center",
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
                      setMenuOpen(false);

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
                      padding: "6px 10px",
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

                  {notifOpen && (
  <div
    style={{
      position: "absolute",
      right: 0,
      top: "110%",
      width: 320,
      maxWidth: "85vw",
      background: "#020617",
      border: "1px solid #1e293b",
      borderRadius: 10,
      padding: 10,
      zIndex: 6000,
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ color: "#e5e7eb", fontWeight: 900 }}>Notifications</div>
      <div style={{ color: "#64748b", fontSize: "0.82rem" }}>
        {Array.isArray(notifications) ? notifications.length : 0}
      </div>
    </div>

    <div style={{ height: 1, background: "#1e293b", margin: "10px 0" }} />

    {!Array.isArray(notifications) || notifications.length === 0 ? (
      <div style={{ color: "#9ca3af", fontSize: "0.9rem" }}>No notifications.</div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
        {notifications
          .slice() // don’t mutate props
          .reverse() // newest last -> newest first (remove if yours is already newest first)
          .slice(0, 30) // cap for UI
          .map((n, idx) => {
            const title = String(n?.title || n?.type || "Update");
            const msg = String(n?.message || n?.text || n?.detail || "");
            const ts =
              n?.createdAt || n?.timestamp
                ? new Date(n.createdAt || n.timestamp).toLocaleString()
                : "";

            return (
              <div
                key={n?.id ?? `${title}-${idx}`}
                style={{
                  border: "1px solid #1f2937",
                  background: "#0b1220",
                  borderRadius: 10,
                  padding: "10px 10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ color: "#e5e7eb", fontWeight: 900, fontSize: "0.92rem" }}>
                    {title}
                  </div>
                  {ts ? (
                    <div style={{ color: "#64748b", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                      {ts}
                    </div>
                  ) : null}
                </div>

                {msg ? (
                  <div style={{ color: "#9ca3af", fontSize: "0.85rem", marginTop: 6, lineHeight: 1.25 }}>
                    {msg}
                  </div>
                ) : null}
              </div>
            );
          })}
      </div>
    )}
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
