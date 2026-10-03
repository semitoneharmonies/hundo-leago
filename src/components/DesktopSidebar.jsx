import { LeagueHelpPanel } from "../features/leagues/LeagueHelpPanel.jsx";
import { commissionerSections, commissionerSectionPath } from "../features/commissioner/commissionerSections.js";
import { createElement, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, BookOpen, ChevronDown, ChevronLeft, ChevronRight, Users, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { routePaths } from "../app/routePaths.js";
import { leagueSeasonsQuery, leagueTeamsQuery } from "../features/leagues/leagueQueries.js";
import { writeLeaguePreference } from "../features/leagues/leaguePreference.js";
import { currentMatchupWeekQuery, matchupWeekQuery, matchupWeeksQuery } from "../features/competition/competitionQueries.js";
import { leagueAuthorityLabel } from "../shared/leagueAuthority.js";
import { teamColourClass, teamColourStyle } from "../shared/teamIdentity.js";
import { TeamMark } from "./HundoUi.jsx";
import LeagueRulesDropdown from "./LeagueRulesDropdown.jsx";
import { LeagueAnnouncements } from "../features/leagues/LeagueAnnouncements.jsx";
import { useNavigationMotion } from "./navigationMotion.js";

function QueryState({ query, children, empty }) {
  if (query.isPending) return <p className="hl-sidebar-state" role="status">Loading…</p>;
  if (query.isError) return <div className="hl-sidebar-state" role="alert">Could not load this list. <button type="button" onClick={() => query.refetch()}>Retry</button></div>;
  return children || <p className="hl-sidebar-state">{empty}</p>;
}

function TeamIdentity({ team, httpClient, yours = false }) {
  return <>
    <TeamMark team={team} logoUrl={team.logoReference ? httpClient.resourceUrl(team.logoReference) : null} />
    <span className="hl-sidebar-team__name">{yours && <small>Your Team</small>}<strong>{team.name}</strong></span>
  </>;
}

function SidebarRules({ onClose, leagueId, httpClient }) {
  const panel = useRef(null);
  useEffect(() => { panel.current?.querySelector("button")?.focus(); }, []);
  return <div ref={panel} className="hl-sidebar-rules" role="dialog" aria-label="League rules" onKeyDown={(event) => {
    if (event.key === "Escape") { event.stopPropagation(); onClose(); }
  }}><LeagueRulesDropdown leagueId={leagueId} httpClient={httpClient} onClose={onClose} /></div>;
}

function SidebarFlyout({ id, label, onClose, children }) {
  const closeButton = useRef(null);
  useEffect(() => { closeButton.current?.focus(); }, []);
  return <div id={id} className="hl-sidebar-flyout" role="dialog" aria-label={label}>
    <header className="hl-sidebar-flyout__heading">
      <h2>{label}</h2>
      <button ref={closeButton} type="button" aria-label={`Close ${label}`} onClick={onClose}><X aria-hidden="true" /></button>
    </header>
    <div className="hl-sidebar-flyout__content" tabIndex={0}>{children}</div>
  </div>;
}

function TeamMenu({ league, session, onSelect }) {
  const location = useLocation();
  const motion = useNavigationMotion();
  const teams = useQuery(leagueTeamsQuery(session.httpClient, league.id));
  const ordered = [...(teams.data || [])].sort((a, b) =>
    Number(b.currentManager?.userId === session.user.id) - Number(a.currentManager?.userId === session.user.id) || a.name.localeCompare(b.name)
  );
  return <QueryState query={teams} empty="No teams have been created.">
    {ordered.length > 0 && <ul className="hl-sidebar-cards">
      {ordered.map((team) => {
        const to = routePaths.teamRoster(league.id, team.id);
        const yours = team.currentManager?.userId === session.user.id;
        return <li key={team.id}><Link to={to}
          className={teamColourClass("hl-sidebar-team")}
          style={teamColourStyle(team)} aria-label={`${yours ? "Your Team: " : ""}${team.name}`}
          aria-current={location.pathname === to ? "page" : undefined}
          onClick={(event) => {
            motion?.select(event, to, `team:${league.id}:${team.id}`);
            if (event.defaultPrevented) onSelect();
          }}>
          <TeamIdentity team={team} httpClient={session.httpClient} yours={yours} />
        </Link></li>;
      })}
    </ul>}
  </QueryState>;
}

function MatchupMenu({ league, session, onSelect }) {
  const location = useLocation();
  const motion = useNavigationMotion();
  const inMatchups = location.pathname === routePaths.leagueMatchups(league.id);
  const params = new URLSearchParams(inMatchups ? location.search : "");
  const [selection, setSelection] = useState({ season: params.get("season"), week: params.get("week") });
  const seasons = useQuery(leagueSeasonsQuery(session.httpClient, league.id));
  const seasonId = seasons.data?.find(({ id }) => id === selection.season)?.id
    || seasons.data?.find(({ id }) => id === league.currentSeason?.id)?.id || seasons.data?.[0]?.id;
  const current = useQuery({ ...currentMatchupWeekQuery(session.httpClient, league.id, seasonId), enabled: Boolean(seasonId) });
  const weeks = useQuery({ ...matchupWeeksQuery(session.httpClient, league.id, seasonId), enabled: Boolean(seasonId) });
  const orderedWeeks = [...(weeks.data?.weeks || [])].sort((a, b) => a.sequence - b.sequence);
  const weekId = orderedWeeks.find(({ id }) => id === selection.week)?.id
    || orderedWeeks.find(({ id }) => id === current.data?.week?.id)?.id || orderedWeeks[0]?.id;
  const selected = useQuery({ ...matchupWeekQuery(session.httpClient, league.id, seasonId, weekId), enabled: Boolean(seasonId && weekId) });
  const teams = useQuery(leagueTeamsQuery(session.httpClient, league.id));
  const query = [seasons, weeks, current].find((item) => item.isError || item.isPending) || selected;
  const week = selected.data;
  const weekIndex = orderedWeeks.findIndex(({ id }) => id === weekId);
  const changeWeek = (offset) => setSelection({ season: seasonId, week: orderedWeeks[weekIndex + offset].id });
  const teamIdentity = (team) => teams.data?.find(({ id }) => id === team.id) || team;
  if (seasons.isSuccess && !seasonId) return <p className="hl-sidebar-state">No seasons yet.</p>;
  return <>
    {seasonId && <label className="hl-sidebar-season">Season
      <select value={seasonId} onChange={(event) => setSelection({ season: event.target.value, week: null })}>
        {seasons.data.map((season) => <option key={season.id} value={season.id}>{season.label}</option>)}
      </select>
    </label>}
    {weeks.isSuccess && orderedWeeks.length === 0 ? <p className="hl-sidebar-state">No matchup schedule has been generated yet.</p> : <QueryState query={query} empty="No matchup week.">
      {week && <>
        <p className="hl-sidebar-week">Week {week.sequence}</p>
        <ul className="hl-sidebar-cards">
          {week.matchups.map((matchup) => {
            const to = `${routePaths.leagueMatchups(league.id)}?${new URLSearchParams({ season: seasonId, week: week.id, matchup: matchup.id })}`;
            return <li key={matchup.id}><Link to={to} className="hl-sidebar-matchup"
              aria-label={`${matchup.homeTeam.name} vs ${matchup.awayTeam.name}`}
              aria-current={inMatchups && params.get("matchup") === matchup.id ? "page" : undefined}
              onClick={(event) => {
                motion?.select(event, to, `matchup:${league.id}:${matchup.id}`);
                if (event.defaultPrevented) onSelect();
              }}>
              {[matchup.homeTeam, matchup.awayTeam].map((team, index) => <div key={team.id} className={teamColourClass("hl-sidebar-team")} style={teamColourStyle(teamIdentity(team))}>
                <TeamIdentity team={teamIdentity(team)} httpClient={session.httpClient} />
                <span className="hl-visually-hidden">{index === 0 ? "Home" : "Away"}</span>
              </div>)}
              <span className="hl-sidebar-matchup__vs" aria-hidden="true">vs</span>
            </Link></li>;
          })}
        </ul>
        {week.matchups.length === 0 && <p className="hl-sidebar-state">No pairings this week.</p>}
        {week.byes.map((bye) => <p className="hl-sidebar-state" key={bye.id}>{bye.team.name} has a bye.</p>)}
      </>}
    </QueryState>}
    {orderedWeeks.length > 0 && <nav className="hl-sidebar-week-navigation" aria-label="Matchup weeks">
      <button type="button" aria-label="Previous week" disabled={weekIndex <= 0 || selected.isFetching} onClick={() => changeWeek(-1)}><ChevronLeft aria-hidden="true" /></button>
      <span role="status">Week {orderedWeeks[weekIndex]?.sequence}</span>
      <button type="button" aria-label="Next week" disabled={weekIndex < 0 || weekIndex >= orderedWeeks.length - 1 || selected.isFetching} onClick={() => changeWeek(1)}><ChevronRight aria-hidden="true" /></button>
    </nav>}
  </>;
}

export function DesktopSidebar({ league, leaguesQuery, links, descriptions, session, unreadCount, isActive, footer }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedSubmenu, setSubmenu] = useState(null);
  const submenu = league && location.hash === "#league-help" ? "Help" : selectedSubmenu;
  const [rulesOpen, setRulesOpen] = useState(false);
  const rulesButton = useRef(null);
  const submenuButtons = useRef({});
  const clearHelpLink = () => { if (location.hash === "#league-help") navigate(location.pathname + location.search, { replace: true }); };
  const toggle = (name) => { clearHelpLink(); setRulesOpen(false); setSubmenu((current) => current === name ? null : name); };
  const closeSubmenu = () => { clearHelpLink(); submenuButtons.current[submenu]?.focus(); setSubmenu(null); };
  function disclosure(label, icon, description, children, flyout = false) {
    const open = submenu === label;
    const id = `desktop-submenu-${label.toLowerCase().replaceAll(" ", "-")}`;
    return <div key={label} className="hl-sidebar-group">
      <button ref={(element) => { submenuButtons.current[label] = element; }} type="button"
        className={`hl-sidebar-link${open ? " is-open" : ""}`} aria-expanded={open} aria-controls={id} aria-haspopup={flyout ? "dialog" : undefined}
        onClick={(event) => { event.currentTarget.focus(); toggle(label); }}>
        {createElement(icon, { "aria-hidden": true })}<span><strong>{label}</strong>{description && <small>{description}</small>}</span>
        {flyout ? <ChevronRight aria-hidden="true" /> : <ChevronDown className={open ? "is-rotated" : ""} aria-hidden="true" />}
      </button>
      {open && (flyout
        ? <SidebarFlyout id={id} label={label} onClose={closeSubmenu}>{children}</SidebarFlyout>
        : <div id={id} className="hl-sidebar-submenu">{children}</div>)}
    </div>;
  }
  return <aside className="hl-desktop-sidebar" aria-label="League sidebar" onKeyDown={(event) => {
    if (event.key === "Escape" && submenu) {
      closeSubmenu();
    }
  }}>
    <div className="hl-sidebar-heading"><strong>{league?.name || "Your leagues"}</strong></div>
    <nav className="hl-sidebar-navigation" aria-label="Main navigation">
      {disclosure("Switch league", Users, null,
        <><QueryState query={leaguesQuery} empty="No active league memberships.">
          {leaguesQuery.data?.length > 0 && <ul className="hl-sidebar-leagues">{leaguesQuery.data.map((item) => <li key={item.id}>
            <Link to={routePaths.league(item.id)} aria-current={league?.id === item.id ? "true" : undefined} onClick={() => { writeLeaguePreference(item.id); setSubmenu(null); }}>
              <strong>{item.name}</strong><small>{leagueAuthorityLabel(item.membership)}</small>
            </Link></li>)}</ul>}
        </QueryState><Link className="hl-sidebar-all" to={routePaths.leagues}>League access and invitations</Link></>)}
      {links.filter(([label]) => label !== "Roster operations").map(([label, to, Icon, prefixActive, description]) => {
        if (label === "Commissioner tools") return disclosure(label, Icon, null, <><Link className="hl-sidebar-all" to={to} onClick={closeSubmenu}>All tools</Link>{commissionerSections.map(([key, title]) => <Link className="hl-sidebar-link" key={key} to={commissionerSectionPath(league.id, key)} onClick={closeSubmenu}>{title}</Link>)}</>, true);
        if (label === "Teams") return disclosure(label, Icon, null, <TeamMenu league={league} session={session} onSelect={closeSubmenu} />, true);
        if (label === "Matchups") return disclosure(label, Icon, null, <MatchupMenu key={`${league.id}:${location.search}`} league={league} session={session} onSelect={closeSubmenu} />, true);
        return <Link key={label} to={to} className="hl-sidebar-link" aria-label={label}
          aria-current={isActive(label, to, prefixActive) ? "page" : undefined} title={description || descriptions[label]}
          onClick={() => { setSubmenu(null); setRulesOpen(false); }}>
          {createElement(Icon, { "aria-hidden": true })}<span><strong>{label}</strong>{label === "Drafts" && description !== "Free Agent and Entry Drafts" && <small>{description}</small>}</span>
        </Link>;
      })}
      <Link className="hl-sidebar-link" to={routePaths.notifications} aria-current={location.pathname === routePaths.notifications ? "page" : undefined} onClick={() => { setSubmenu(null); setRulesOpen(false); }}>
        <Bell aria-hidden="true" /><span><strong>Notifications</strong></span>{unreadCount > 0 && <span className="hl-sidebar-count">{unreadCount}</span>}
      </Link>
      <button ref={rulesButton} type="button" className="hl-sidebar-link" aria-expanded={rulesOpen} onClick={() => { setSubmenu(null); setRulesOpen(!rulesOpen); }}>
        <BookOpen aria-hidden="true" /><span><strong>League Rules</strong></span>
      </button>
      {league && disclosure("Help", BookOpen, null, <LeagueHelpPanel key={league.id} leagueId={league.id} menuMode />, true)}
    </nav>
    {league && <LeagueAnnouncements key={league.id} league={league} session={session} />}
    {footer}
    {rulesOpen && <SidebarRules leagueId={league?.id} httpClient={session.httpClient} onClose={() => { setRulesOpen(false); rulesButton.current?.focus(); }} />}
  </aside>;
}
