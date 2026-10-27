import { createElement, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, BookOpen, ChevronDown, ChevronLeft, ChevronRight, Download, UserRound, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { routePaths } from "../app/routePaths.js";
import { commissionerSections, commissionerSectionPath } from "../features/commissioner/commissionerSections.js";
import { LeagueHelpPanel } from "../features/leagues/LeagueHelpPanel.jsx";
import { writeLeaguePreference } from "../features/leagues/leaguePreference.js";
import { useInstalledApp } from "../features/install/useInstalledApp.js";
import { hasCommissionerAuthority, leagueAuthorityLabel } from "../shared/leagueAuthority.js";
import { TeamMenu, MatchupMenu } from "./DesktopSidebar.jsx";
import LeagueRulesDropdown from "./LeagueRulesDropdown.jsx";
import { TipJarNavLabel } from "./TipJarNavLabel.jsx";

const focusableSelector = 'a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), summary, [tabindex="0"]';

export function MobileNavigation({ league, leaguesQuery, links, session, unreadCount, isActive, initialSubmenu, onClose, onNavigate, triggerRef, footer }) {
  const location = useLocation();
  const installed = useInstalledApp();
  const [submenu, setSubmenu] = useState(initialSubmenu);
  const overlayRef = useRef(null);
  const closeRef = useRef(null);
  const submenuCloseRef = useRef(null);
  const buttons = useRef({});
  const authenticated = session.status === "authenticated";

  // A body-level portal avoids the sticky header's backdrop-filter containing
  // fixed children. Lock background interaction while preserving the scroll
  // position; closing the drawer never overwrites a destination's banner scroll.
  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    const trigger = triggerRef.current;
    const background = [...document.body.children].filter((element) => element !== overlay);
    const previousInert = background.map((element) => [element, element.inert]);
    for (const element of background) element.inert = true;
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      for (const [element, inert] of previousInert) element.inert = inert;
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [triggerRef]);

  useLayoutEffect(() => {
    if (submenu) submenuCloseRef.current?.focus({ preventScroll: true });
  }, [submenu]);

  function closeSubmenu() {
    buttons.current[submenu]?.focus({ preventScroll: true });
    setSubmenu(null);
  }

  function disclosure(label, Icon) {
    return <button key={label} ref={(element) => { buttons.current[label] = element; }} type="button"
      className="hl-mobile-nav__link" aria-expanded={submenu === label}
      aria-controls={submenu === label ? "mobile-navigation-submenu" : undefined}
      onClick={() => submenu === label ? closeSubmenu() : setSubmenu(label)}>
      {createElement(Icon, { "aria-hidden": true })}<span>{label}</span><ChevronRight aria-hidden="true" />
    </button>;
  }

  function navLink(label, to, Icon, active, description) {
    return <Link key={label} to={to} className="hl-mobile-nav__link" aria-label={label === "Tip Jar" ? "Play Tip Jar" : label}
      aria-current={active ? "page" : undefined} onClick={onNavigate}>
      {createElement(Icon, { "aria-hidden": true })}<span>{label === "Tip Jar" ? <TipJarNavLabel /> : label}{description && <small>{description}</small>}</span>
    </Link>;
  }

  return createPortal(<div ref={overlayRef} className={`hl-mobile-nav${submenu ? " hl-mobile-nav--expanded" : ""}`}
    id="main-navigation-menu" role="dialog" aria-modal="true" aria-label="Mobile navigation"
    onKeyDown={(event) => {
      if (event.key === "Escape") {
        event.preventDefault(); event.stopPropagation();
        if (submenu) closeSubmenu(); else onClose();
      }
      if (event.key === "Tab") {
        const targets = [...overlayRef.current.querySelectorAll(focusableSelector)].filter((element) => {
          if (element.tabIndex < 0 || element.closest('[hidden]')) return false;
          for (let node = element; node && node !== overlayRef.current; node = node.parentElement) {
            const style = getComputedStyle(node);
            if (style.display === "none" || style.visibility === "hidden") return false;
            if (node.tagName === "DETAILS" && !node.open && !node.querySelector("summary")?.contains(element)) return false;
          }
          return true;
        });
        const first = targets[0]; const last = targets.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}>
    <button className="hl-mobile-nav__backdrop" type="button" aria-label="Dismiss navigation" tabIndex={-1} onClick={onClose} />
    <div className="hl-mobile-nav__drawer">
      <nav className="hl-mobile-nav__main" aria-label="Main navigation">
        <header className="hl-mobile-nav__heading">
          {authenticated ? <button ref={(element) => { buttons.current["Your leagues"] = element; }} type="button"
            className="hl-mobile-nav__league-title" aria-expanded={submenu === "Your leagues"}
            aria-controls={submenu === "Your leagues" ? "mobile-navigation-submenu" : undefined}
            onClick={() => submenu === "Your leagues" ? closeSubmenu() : setSubmenu("Your leagues")}>
            <strong>{league?.name || "Your leagues"}</strong><ChevronDown aria-hidden="true" />
          </button> : <strong>Hundo Leago</strong>}
          <button ref={closeRef} type="button" aria-label="Close menu" onClick={onClose}><X aria-hidden="true" /></button>
        </header>
        <div className="hl-mobile-nav__links">
          {authenticated && <>
            {links.filter(([label]) => label !== "Roster operations").map(([label, to, Icon, prefixActive, description]) => {
              if (["Teams", "Matchups", "Commissioner tools"].includes(label)) return disclosure(label, Icon);
              return navLink(label, to, Icon, isActive(label, to, prefixActive), label === "Drafts" && description !== "Free Agent and Entry Drafts" ? description : null);
            })}
            {navLink("Notifications", routePaths.notifications, Bell, location.pathname === routePaths.notifications, unreadCount ? `${unreadCount} unread` : null)}
          </>}
          {!installed && navLink("Install Hundo Leago", routePaths.install, Download, location.pathname === routePaths.install)}
          {!authenticated && navLink("Account access", routePaths.home, UserRound, location.pathname === routePaths.home)}
          {disclosure("League Rules", BookOpen)}
          {authenticated && league && disclosure("Help", BookOpen)}
        </div>
        {footer}
      </nav>
      {submenu && <section key={submenu} id="mobile-navigation-submenu" className="hl-mobile-nav__submenu" aria-label={submenu}>
        <header className="hl-mobile-nav__heading">
          <button ref={submenuCloseRef} type="button" aria-label={`Close ${submenu === "Help" ? "help" : submenu}`} onClick={closeSubmenu}><ChevronLeft aria-hidden="true" /></button>
          <h2>{submenu}</h2>
        </header>
        <div className="hl-mobile-nav__submenu-content">
          {submenu === "Teams" && authenticated && league && <TeamMenu league={league} session={session} onSelect={onNavigate} />}
          {submenu === "Matchups" && authenticated && league && <MatchupMenu league={league} session={session} onSelect={onNavigate} />}
          {submenu === "League Rules" && <LeagueRulesDropdown leagueId={league?.id} httpClient={session.httpClient} onClose={closeSubmenu} />}
          {submenu === "Help" && authenticated && league && <LeagueHelpPanel leagueId={league.id} menuMode />}
          {submenu === "Commissioner tools" && league && hasCommissionerAuthority(league.membership) && <>
            <Link className="hl-mobile-nav__text-link" to={routePaths.leagueCommissioner(league.id)} onClick={onNavigate}>All tools</Link>
            {commissionerSections.map(([key, label]) => <Link className="hl-mobile-nav__text-link" key={key} to={commissionerSectionPath(league.id, key)} onClick={onNavigate}>{label}</Link>)}
          </>}
          {submenu === "Your leagues" && authenticated && <>
            {leaguesQuery.isPending && <p role="status">Loading leagues…</p>}
            {leaguesQuery.isError && <p role="alert">Could not load leagues. <button type="button" onClick={() => leaguesQuery.refetch()}>Retry</button></p>}
            {!leaguesQuery.isPending && !leaguesQuery.isError && leaguesQuery.data?.length === 0 && <p>No active league memberships.</p>}
            {leaguesQuery.data?.map((item) => <Link key={item.id} className="hl-mobile-nav__text-link" to={routePaths.league(item.id)}
              aria-current={item.id === league?.id ? "true" : undefined} onClick={() => { writeLeaguePreference(item.id); onNavigate(); }}>
              <strong>{item.name}</strong><small>{leagueAuthorityLabel(item.membership)}</small>
            </Link>)}
            <Link className="hl-mobile-nav__text-link" to={routePaths.leagues} onClick={onNavigate}>League access and invitations</Link>
          </>}
        </div>
      </section>}
    </div>
  </div>, document.body);
}
