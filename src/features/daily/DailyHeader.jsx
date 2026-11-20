import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { routePaths } from "../../app/routePaths.js";
import QuoteTicker from "../../components/QuoteTicker.jsx";
import { HundoBrand } from "../../components/HundoBrand.jsx";
import { notificationsQuery } from "../notifications/notificationQueries.js";
import { useSession } from "../session/sessionContext.js";

export function DailyHeader() {
  const session = useSession();
  const { pathname } = useLocation();
  const [accountOpen, setAccountOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutWarning, setSignOutWarning] = useState("");
  const accountRef = useRef(null);
  const accountButtonRef = useRef(null);
  const authenticated = session.status === "authenticated";
  const notifications = useQuery({
    ...notificationsQuery(session.httpClient, null, "unread"),
    enabled: authenticated,
  });
  const unreadCount = notifications.data?.notifications.filter(item => item.readAtMs === null).length || 0;
  const unreadLabel = `${unreadCount}${notifications.data?.page.nextCursor ? "+" : ""}`;
  const leagoTarget = authenticated ? routePaths.leagues : routePaths.home;

  useEffect(() => {
    function dismiss(event) {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
    }
    function onEscape(event) {
      if (event.key !== "Escape" || !accountOpen) return;
      event.preventDefault();
      setAccountOpen(false);
      accountButtonRef.current?.focus();
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", onEscape);
    };
  }, [accountOpen]);

  async function signOut() {
    setSigningOut(true);
    setSignOutWarning("");
    try {
      await session.signOut();
    } catch {
      setSignOutWarning("Server sign-out could not be confirmed. You have been signed out on this device.");
    } finally {
      setAccountOpen(false);
      setSigningOut(false);
    }
  }

  return <header className="hl-app-header hd-app-header">
    <div className="hl-app-header__bar">
      <HundoBrand mode="daily" homeTarget={routePaths.daily} switchTarget={leagoTarget} />
      <div className="hl-app-header__context"><QuoteTicker /></div>
      <div className="hl-app-header__account" ref={accountRef}
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setAccountOpen(false); }}>
        {authenticated ? <>
          <Link className="hl-notification-link" to={routePaths.notifications}
            aria-label={unreadCount ? `Notifications, ${unreadLabel} unread` : "Notifications"}>
            <Bell aria-hidden="true" />
            {unreadCount > 0 && <span aria-hidden="true">{unreadLabel}</span>}
          </Link>
          <button ref={accountButtonRef} className="hl-account-trigger" type="button"
            aria-label="Account menu" aria-expanded={accountOpen} aria-controls="daily-account-menu"
            onClick={() => setAccountOpen(open => !open)}>
            <span className="hl-account-trigger__avatar" aria-hidden="true">{session.user.displayName.slice(0, 2).toUpperCase()}</span>
            <span className="hl-account-trigger__identity">
              <strong>{session.user.displayName}</strong><small>Hundo Daily</small>
            </span>
            <ChevronDown className={accountOpen ? "is-rotated" : ""} aria-hidden="true" />
          </button>
          {accountOpen && <div id="daily-account-menu" className="hl-account-menu">
            <div className="hl-account-menu__identity">
              <span className="hl-account-trigger__avatar" aria-hidden="true">{session.user.displayName.slice(0, 2).toUpperCase()}</span>
              <div><strong>{session.user.displayName}</strong><small>Hundo Daily</small></div>
            </div>
            <Link to={routePaths.account}>Account and team settings</Link>
            <Link to={routePaths.dailyProfile} onClick={() => setAccountOpen(false)}>Daily stripes</Link>
            <button type="button" className="hl-account-menu__signout" disabled={signingOut} onClick={signOut}>
              <LogOut aria-hidden="true" />{signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>}
        </> : session.status === "unknown"
          ? <span className="hl-session-status" role="status">Checking session…</span>
          : <Link className="hl-signin-link" to="/#account-access" state={{ dailyReturnTo: pathname }}>Sign in</Link>}
      </div>
    </div>
    {signOutWarning && <p role="alert" className="hl-account-menu__warning">{signOutWarning}</p>}
  </header>;
}
