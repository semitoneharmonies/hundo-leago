// src/components/TopBar.jsx
import React from "react";

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
}) {
  const selectedTeam =
    teams.find((t) => t.name === selectedTeamName) || null;

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#020617",
        borderBottom: "1px solid #1f2937",
        padding: "8px 12px",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        {/* Left: App title */}
        <div
          style={{
            fontSize: "1.75rem",
            fontWeight: 900,
            letterSpacing: "0.5px",
            color: "#f97316",
            textShadow: "0 0 8px rgba(249,115,22,0.4)",
            fontFamily: "'Oswald', sans-serif",
          }}
        >
          HUNDO LEAGO
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
            flexShrink: 0,
          }}
        >
          {/* Team logo bubble */}
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
            {teams.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Login / Logout */}
        <div style={{ minWidth: "260px" }}>
          {!currentUser ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              style={{
                display: "flex",
                flexWrap: "wrap",
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
              }}
            >
              {/* Small role chip, no big "logged in as" sentence */}
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
    </div>
  );
}

export default TopBar;
