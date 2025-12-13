// src/components/LeagueRulesDropdown.jsx
import React from "react";

function LeagueRulesDropdown({ onClose }) {
  return (
    <div style={wrap}>
      <div style={headerRow}>
        <div style={title}>League Rules & How To</div>
        <button onClick={onClose} style={closeBtn} aria-label="Close League Rules">
          ✕
        </button>
      </div>

      {/* QUICK REFERENCE */}
      <div style={quickRefBox}>
        <div style={sectionTitle}>Quick Reference</div>
        <div style={quickGrid}>
          <RuleLine label="Cap Limit" value="$100" />
          <RuleLine label="Max Roster Size" value="15" />
          <RuleLine label="Minimum Positions" value="8F / 4D" />
          <RuleLine label="Trade Expiry" value="7 days after proposal" />
          <RuleLine label="Auction Rollover" value="Sunday @ 4:00 PM" />
          <RuleLine label="New Auctions Close" value="Thursday @ 11:59 PM" />
          <RuleLine label="Buyout Penalty" value="25% of salary (rounded up)" />
          <RuleLine label="Auction Buyout Lock" value="14 days after signing (follows player if traded)" />
        </div>
      </div>

      {/* FULL SECTIONS */}
      <div style={content}>
        <Section title="Rosters & Salary Cap">
          <p style={p}>
            Each team must stay under the league cap limit and maintain a legal active roster.
          </p>
          <ul style={ul}>
            <li style={li}>Cap Limit: <strong>$100</strong></li>
            <li style={li}>Max active roster size: <strong>15</strong></li>
            <li style={li}>Minimum positions: <strong>8 Forwards</strong> and <strong>4 Defense</strong></li>
          </ul>
        </Section>

        <Section title="Buyouts">
          <p style={p}>
            Buyouts remove a player from your roster and add a buyout penalty to your team.
          </p>
          <ul style={ul}>
            <li style={li}>Buyout penalty is <strong>25%</strong> of the player’s salary (rounded up).</li>
            <li style={li}>Players signed via free-agent auction have a <strong>14-day buyout lock</strong> (the lock follows the player if traded).</li>
          </ul>
        </Section>

        <Section title="Trades">
          <p style={p}>
            Trades are proposed between two teams and must be accepted to take effect.
          </p>
          <ul style={ul}>
            <li style={li}>Trade proposals expire <strong>1 week</strong> after they’re created.</li>
            <li style={li}>Trades can include retained salary and/or buyout penalty transfers (when enabled in the trade builder).</li>
          </ul>
        </Section>

        <Section title="Free Agent Auctions">
          <p style={p}>
            Free agents are signed through weekly auctions.
          </p>
          <ul style={ul}>
            <li style={li}>Auction rollover: <strong>Sunday at 4:00 PM</strong></li>
            <li style={li}>New auctions close: <strong>Thursday at 11:59 PM</strong></li>
          </ul>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function RuleLine({ label, value }) {
  return (
    <div style={ruleLine}>
      <span style={ruleLabel}>{label}</span>
      <span style={ruleValue}>{value}</span>
    </div>
  );
}

/* styles */
const wrap = {
  position: "absolute",
  top: "100%",
  left: 0,
  marginTop: 8,
  width: 520,
  maxWidth: "90vw",

    maxHeight: "calc(100vh - 140px)",
  overflowY: "auto",
  
  background: "#020617",
  border: "1px solid #1f2937",
  borderRadius: 10,
  padding: 12,
  color: "#e5e7eb",
  zIndex: 9999,
  boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  marginBottom: 8,
};

const title = { fontSize: "0.95rem", fontWeight: 700 };

const closeBtn = {
  padding: "4px 8px",
  fontSize: "0.85rem",
  backgroundColor: "#111827",
  color: "#e5e7eb",
  border: "1px solid #1f2937",
  borderRadius: 6,
  cursor: "pointer",
};

const quickRefBox = {
  border: "1px solid #1f2937",
  borderRadius: 10,
  padding: 10,
  background: "#0b1220",
};

const quickGrid = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 6,
  marginTop: 8,
};

const ruleLine = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  fontSize: "0.85rem",
};

const ruleLabel = { color: "#9ca3af" };
const ruleValue = { color: "#e5e7eb", fontWeight: 600 };

const content = { marginTop: 10 };

const sectionTitle = {
  fontSize: "0.85rem",
  fontWeight: 800,
  color: "#e5e7eb",
};

const p = { margin: "8px 0", color: "#cbd5e1", fontSize: "0.85rem", lineHeight: 1.35 };
const ul = { margin: "6px 0 0 18px", color: "#cbd5e1", fontSize: "0.85rem", lineHeight: 1.35 };
const li = { marginBottom: 6 };

export default LeagueRulesDropdown;
