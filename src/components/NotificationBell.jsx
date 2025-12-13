import React, { useEffect, useRef, useState } from "react";

function BellIcon({ muted = false }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      style={{ opacity: muted ? 0.45 : 1 }}
    >
      <path
        d="M12 22a2.2 2.2 0 0 0 2.2-2.2H9.8A2.2 2.2 0 0 0 12 22Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function NotificationBell({
  items = [],
  unreadCount = 0,
  onMarkAllRead,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const muted = unreadCount === 0;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={muted ? "No new notifications" : "View notifications"}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: 10,
          border: "1px solid #1f2937",
          background: "#0b1220",
          color: muted ? "#94a3b8" : "#e5e7eb",
          cursor: "pointer",
        }}
      >
        <BellIcon muted={muted} />

        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              minWidth: 18,
              height: 18,
              padding: "0 5px",
              borderRadius: 999,
              background: "#ef4444",
              color: "#fff",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: "18px",
              border: "1px solid #0b1220",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 42,
            width: 340,
            background: "#020617",
            border: "1px solid #1f2937",
            borderRadius: 12,
            padding: 10,
            zIndex: 999,
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <strong style={{ color: "#e5e7eb" }}>Notifications</strong>

            <button
              onClick={() => {
                if (onMarkAllRead) onMarkAllRead();
              }}
              style={{
                fontSize: 12,
                padding: "4px 8px",
                borderRadius: 8,
                border: "1px solid #334155",
                background: "#0b1220",
                color: "#e5e7eb",
                cursor: "pointer",
              }}
            >
              Mark all read
            </button>
          </div>

          {items.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>No notifications.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: 8,
                    borderRadius: 10,
                    border: "1px solid #1f2937",
                    background: n.unread ? "#0b1220" : "#020617",
                  }}
                >
                  <div style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 600 }}>
                    {n.title}
                  </div>
                  {n.body && (
                    <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
                      {n.body}
                    </div>
                  )}
                  <div style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>
                    {new Date(n.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
