import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  ClipboardList,
  Gavel,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Shield,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { routePaths } from "../app/routePaths.js";
import { readLeaguePreference } from "../features/leagues/leaguePreference.js";
import { visibleLeaguesQuery } from "../features/leagues/leagueQueries.js";
import { notificationsQuery } from "../features/notifications/notificationQueries.js";
import { useSession } from "../features/session/sessionContext.js";
import {
  hasCommissionerAuthority,
  leagueAuthorityLabel,
} from "../shared/leagueAuthority.js";
import LeagueRulesDropdown from "./LeagueRulesDropdown";

function leagueIdFromPathname(pathname) {
  const match = /^\/leagues\/([^/]+)/.exec(pathname);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

function pageLabel(pathname) {
  if (pathname === "/") return "Account access";
  if (pathname === routePaths.leagues) return "Your leagues";
  if (pathname === routePaths.notifications) return "Notifications";
  if (pathname === routePaths.account) return "Account settings";
  if (/\/players\/[^/]+$/.test(pathname)) return "Player detail";
  if (/\/trades\/[^/]+$/.test(pathname)) return "Trade detail";
  if (/\/teams\/[^/]+\/roster$/.test(pathname)) return "Team roster";
  if (/\/players$/.test(pathname)) return "Players";
  if (/\/auctions$/.test(pathname)) return "Auctions";
  if (/\/trades$/.test(pathname)) return "Trades";
  if (/\/matchups$/.test(pathname)) return "Matchups";
  if (/\/standings$/.test(pathname)) return "Standings";
  if (/\/activity$/.test(pathname)) return "League activity";
  if (/\/commissioner\/rosters$/.test(pathname)) return "Roster operations";
  if (/\/commissioner$/.test(pathname)) return "Commissioner tools";
  if (/\/teams$/.test(pathname)) return "Teams";
  if (/^\/leagues\/[^/]+$/.test(pathname)) return "Dashboard";
  return "Hundo Leago";
}

const descriptions = Object.freeze({
  Dashboard: "League and team overview",
  Teams: "Rosters, contracts and cap",
  Players: "Search and compare players",
  Auctions: "Sealed free-agent bidding",
  Trades: "Proposals and history",
  Matchups: "Head-to-head scoring",
  Standings: "Official league table",
  "League activity": "Transactions and moves",
  "Commissioner tools": "Authorized administration",
  "Roster operations": "Roster, contract and staging tools",
});

function MenuLink({ icon, label, description, to, active, onSelect }) {
  return (
    <Link
      className={`hl-menu-link${active ? " is-active" : ""}`}
      to={to}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      onClick={onSelect}
    >
      {React.createElement(icon, {
        className: "hl-menu-link__icon",
        "aria-hidden": true,
      })}
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
    </Link>
  );
}

function TopBar({ freezeBanner }) {
  const session = useSession();
  const location = useLocation();
  const [rulesOpen, setRulesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutWarning, setSignOutWarning] = useState("");
  const menuRef = useRef(null);
  const accountRef = useRef(null);
  const menuButtonRef = useRef(null);
  const accountButtonRef = useRef(null);

  const leaguesQuery = useQuery({
    ...visibleLeaguesQuery(session.httpClient),
    enabled: session.status === "authenticated",
  });
  const notificationQuery = useQuery({
    ...notificationsQuery(session.httpClient),
    enabled: session.status === "authenticated",
  });
  const leagues = leaguesQuery.data || [];
  const routeLeagueId = leagueIdFromPathname(location.pathname);
  const preferredLeagueId = routeLeagueId || readLeaguePreference();
  const currentLeague =
    leagues.find(({ id }) => id === preferredLeagueId) ||
    (leagues.length === 1 ? leagues[0] : null);
  const leagueId = currentLeague?.id || null;
  const currentPageLabel = pageLabel(location.pathname);
  const unreadCount =
    notificationQuery.data?.notifications?.filter(
      (notification) => notification.readAtMs === null
    ).length || 0;

  const logoTarget =
    session.status === "authenticated"
      ? leagueId
        ? routePaths.league(leagueId)
        : routePaths.leagues
      : routePaths.home;

  const leagueLinks = useMemo(() => {
    if (!leagueId) return [];
    const links = [
      ["Dashboard", routePaths.league(leagueId), LayoutDashboard],
      ["Teams", routePaths.leagueTeams(leagueId), Users],
      ["Players", routePaths.leaguePlayers(leagueId), Search],
      ["Auctions", routePaths.leagueAuctions(leagueId), Gavel],
      ["Trades", routePaths.leagueTrades(leagueId), ArrowLeftRight],
      ["Matchups", routePaths.leagueMatchups(leagueId), Trophy],
      ["Standings", routePaths.leagueStandings(leagueId), BarChart3],
      ["League activity", routePaths.leagueActivity(leagueId), Activity],
    ];
    if (hasCommissionerAuthority(currentLeague?.membership)) {
      links.push([
        "Commissioner tools",
        routePaths.leagueCommissioner(leagueId),
        Shield,
      ]);
      links.push([
        "Roster operations",
        routePaths.leagueCommissionerRoster(leagueId),
        ClipboardList,
      ]);
    }
    return links;
  }, [currentLeague?.membership, leagueId]);

  function closeMenus() {
    setMenuOpen(false);
    setRulesOpen(false);
    setAccountOpen(false);
  }

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutWarning("");
    try {
      await session.signOut();
      closeMenus();
    } catch {
      setSignOutWarning("Server sign-out could not be confirmed.");
    } finally {
      setSigningOut(false);
    }
  }

  useEffect(() => {
    const onDocClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
        setRulesOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const onEscape = (event) => {
      if (event.key !== "Escape") return;
      if (rulesOpen) {
        event.preventDefault();
        setRulesOpen(false);
        menuButtonRef.current?.focus();
      } else if (menuOpen) {
        event.preventDefault();
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      } else if (accountOpen) {
        event.preventDefault();
        setAccountOpen(false);
        accountButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [accountOpen, menuOpen, rulesOpen]);

  useEffect(() => {
    closeMenus();
  }, [location.pathname]);

  return (
    <>
      <header className="hl-app-header">
        <div className="hl-app-header__bar">
          <div className="hl-app-header__navigation" ref={menuRef}>
            <button
              ref={menuButtonRef}
              type="button"
              className="hl-icon-button hl-menu-trigger"
              aria-label="Menu"
              aria-expanded={menuOpen}
              aria-controls="main-navigation-menu"
              onClick={() => {
                setMenuOpen((open) => !open);
                setRulesOpen(false);
                setAccountOpen(false);
              }}
            >
              <Menu aria-hidden="true" />
              <span>Menu</span>
              <ChevronDown
                className={menuOpen ? "is-rotated" : ""}
                aria-hidden="true"
              />
            </button>

            {menuOpen && (
              <nav
                id="main-navigation-menu"
                className="hl-main-menu"
                aria-label="Main navigation"
              >
                <div className="hl-main-menu__heading">
                  <span>Navigation</span>
                  <strong>{currentLeague?.name || "Hundo Leago"}</strong>
                </div>
                <div className="hl-main-menu__links">
                  {session.status === "authenticated" && (
                    <>
                      <MenuLink
                        icon={Users}
                        label={leagues.length > 1 ? "Switch league" : "Your league"}
                        description="Choose an active membership"
                        to={routePaths.leagues}
                        active={location.pathname === routePaths.leagues}
                        onSelect={closeMenus}
                      />
                      {leagueLinks.map(([label, to, Icon]) => (
                        <MenuLink
                          key={label}
                          icon={Icon}
                          label={label}
                          description={descriptions[label]}
                          to={to}
                          active={location.pathname === to}
                          onSelect={closeMenus}
                        />
                      ))}
                      <MenuLink
                        icon={Bell}
                        label="Notifications"
                        description={
                          unreadCount
                            ? `${unreadCount} unread`
                            : "Account updates and actions"
                        }
                        to={routePaths.notifications}
                        active={location.pathname === routePaths.notifications}
                        onSelect={closeMenus}
                      />
                    </>
                  )}
                  {session.status !== "authenticated" && (
                    <MenuLink
                      icon={UserRound}
                      label="Account access"
                      description="Sign in or create an account"
                      to={routePaths.home}
                      active={location.pathname === routePaths.home}
                      onSelect={closeMenus}
                    />
                  )}
                </div>
                <div className="hl-main-menu__footer">
                  <button
                    type="button"
                    className="hl-menu-link hl-menu-link--button"
                    aria-expanded={rulesOpen}
                    onClick={() => setRulesOpen((open) => !open)}
                  >
                    <BookOpen className="hl-menu-link__icon" aria-hidden="true" />
                    <span>
                      <strong>League Rules</strong>
                      <small>Approved rules and guidance</small>
                    </span>
                    <ChevronDown
                      className={rulesOpen ? "is-rotated" : ""}
                      aria-hidden="true"
                    />
                  </button>
                  {rulesOpen && (
                    <div className="hl-rules-menu">
                      <LeagueRulesDropdown onClose={() => setRulesOpen(false)} />
                    </div>
                  )}
                </div>
              </nav>
            )}
          </div>

          <Link
            className="hl-brand"
            to={logoTarget}
            aria-label="Hundo Leago"
            title={leagueId ? `${currentLeague.name} dashboard` : "Hundo Leago"}
          >
            <span className="hl-brand__mark" aria-hidden="true">
              HL
            </span>
            <span className="hl-brand__name">
              Hundo<span>·</span>Leago
            </span>
          </Link>

          <div className="hl-app-header__context" aria-label="Current location">
            {currentLeague && <span>{currentLeague.name}</span>}
            <strong>{currentPageLabel}</strong>
          </div>

          <div className="hl-app-header__account" ref={accountRef}>
            {session.status === "authenticated" && (
              <Link
                className="hl-notification-link"
                to={routePaths.notifications}
                aria-label={
                  unreadCount
                    ? `Notifications, ${unreadCount} unread`
                    : "Notifications"
                }
              >
                <Bell aria-hidden="true" />
                {unreadCount > 0 && (
                  <span aria-hidden="true">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {session.status === "authenticated" ? (
              <>
                <button
                  ref={accountButtonRef}
                  type="button"
                  className="hl-account-trigger"
                  aria-label="Account menu"
                  aria-expanded={accountOpen}
                  onClick={() => {
                    setAccountOpen((open) => !open);
                    setMenuOpen(false);
                    setRulesOpen(false);
                  }}
                >
                  <span className="hl-account-trigger__avatar" aria-hidden="true">
                    {session.user.displayName.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="hl-account-trigger__identity">
                    <strong>{session.user.displayName}</strong>
                    <small>{currentLeague?.name || "Choose a league"}</small>
                  </span>
                  <ChevronDown
                    className={accountOpen ? "is-rotated" : ""}
                    aria-hidden="true"
                  />
                </button>
                {accountOpen && (
                  <div className="hl-account-menu">
                    <div className="hl-account-menu__identity">
                      <span className="hl-account-trigger__avatar" aria-hidden="true">
                        {session.user.displayName.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <strong>{session.user.displayName}</strong>
                        <small>
                          {currentLeague
                            ? `${currentLeague.name} · ${leagueAuthorityLabel(currentLeague.membership)}`
                            : "No league selected"}
                        </small>
                      </div>
                    </div>
                    <Link to={routePaths.leagues} onClick={closeMenus}>
                      {leagues.length > 1 ? "Switch league" : "Your league"}
                    </Link>
                    <Link to={routePaths.notifications} onClick={closeMenus}>
                      Notifications
                    </Link>
                    <Link to={routePaths.account} onClick={closeMenus}>
                      Account and team settings
                    </Link>
                    <button
                      type="button"
                      className="hl-account-menu__signout"
                      disabled={signingOut}
                      onClick={handleSignOut}
                    >
                      <LogOut aria-hidden="true" />
                      {signingOut ? "Signing out…" : "Sign out"}
                    </button>
                    {signOutWarning && (
                      <p role="alert" className="hl-account-menu__warning">
                        {signOutWarning}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : session.status === "unknown" ? (
              <span className="hl-session-status" role="status">
                Checking session…
              </span>
            ) : (
              <Link className="hl-signin-link" to="/#account-access">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
      {freezeBanner && (
        <div className="hl-freeze-banner" role="status">
          <Shield aria-hidden="true" />
          <span>{freezeBanner}</span>
        </div>
      )}
    </>
  );
}

export default TopBar;
