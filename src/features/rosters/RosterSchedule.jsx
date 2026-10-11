import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Home, Plane } from "lucide-react";
import { ErrorBlock, PositionTag } from "../../components/HundoUi.jsx";
import { matchupWeeksQuery } from "../competition/competitionQueries.js";
import { rosterScheduleQuery } from "./rosterScheduleQueries.js";
import styles from "./RosterSchedule.module.css";

const CATEGORIES = [["Active", "Active roster"], ["Bench", "Bench"], ["Injured Reserve", "Injured reserve"], ["Prospect", "Prospects"]];
const NHL_TEAMS = new Set("ANA ARI BOS BUF CAR CBJ CGY CHI COL DAL DET EDM FLA LAK MIN MTL NJD NSH NYI NYR OTT PHI PIT SEA SJS STL TBL TOR UTA VAN VGK WPG WSH".split(" "));
const format = (ms, timeZone, options) => new Intl.DateTimeFormat("en-CA", { timeZone, ...options }).format(ms);
const dateLabel = (ms, zone) => format(ms, zone, { month: "short", day: "numeric" });
const normalizeTeam = (value) => ({ LA: "LAK", NJ: "NJD", SJ: "SJS", TB: "TBL", MON: "MTL", WSH: "WSH" }[value] || value);

function GameCard({ game, team, timeZone }) {
  const home = game.homeTeam === team;
  const opponent = home ? game.awayTeam : game.homeTeam;
  const status = game.status === "postponed" ? "Postponed" : game.status === "cancelled" ? "Cancelled" : game.timeTbd ? "Time TBD" : format(game.startsAtMs, timeZone, { hour: "numeric", minute: "2-digit" });
  return <li className={styles.game}>
    <span className={styles.day}>{format(game.startsAtMs, timeZone, { weekday: "short", day: "numeric", month: "short" })}</span>
    <span className={styles.opponent}>
      {home ? <Home aria-label="Home game" /> : <Plane aria-label="Away game" />}
      <span className={styles.teamBadge} aria-hidden="true">{opponent}</span>
      <strong>{home ? "vs" : "@"} {opponent}</strong>
    </span>
    <span className={styles.time}>{status}{game.status === "final" ? " · Final" : game.status === "live" ? " · In progress" : ""}</span>
  </li>;
}

export function RosterSchedule({ workspace, httpClient, nowMs }) {
  const [openedAtMs] = useState(Date.now);
  const currentTime = nowMs ?? openedAtMs;
  const [selectedWeekId, setSelectedWeekId] = useState(null);
  const weeksQuery = useQuery(matchupWeeksQuery(httpClient, workspace.league.id, workspace.season.id));
  const weeks = (weeksQuery.data?.weeks || []).filter((week) => week.status !== "cancelled").sort((a, b) => a.sequence - b.sequence);
  const defaultWeek = weeks.find((week) => week.startsAtMs <= currentTime && currentTime < week.endsAtMs)
    || weeks.find((week) => week.startsAtMs > currentTime) || weeks.at(-1);
  const week = weeks.find((item) => item.id === selectedWeekId) || defaultWeek;
  const selectedIndex = weeks.findIndex((item) => item.id === week?.id);
  const schedule = useQuery(rosterScheduleQuery(httpClient, workspace.league.id, workspace.season.id, week?.id));
  const timeZone = schedule.data?.timeZone || workspace.league.timezone || "America/Vancouver";
  const gamesByTeam = new Map();
  for (const game of schedule.data?.games || []) {
    for (const team of [game.homeTeam, game.awayTeam]) {
      if (!gamesByTeam.has(team)) gamesByTeam.set(team, []);
      gamesByTeam.get(team).push(game);
    }
  }
  for (const games of gamesByTeam.values()) games.sort((a, b) => a.startsAtMs - b.startsAtMs);

  if (weeksQuery.isError) return <ErrorBlock error={weeksQuery.error} fallback="Matchup weeks could not be loaded." action={<button type="button" onClick={() => weeksQuery.refetch()}>Try again</button>} />;
  if (weeksQuery.isPending) return <p role="status">Loading matchup weeks…</p>;
  if (!week) return <p className={styles.empty}>The league’s matchup weeks haven’t been scheduled yet.</p>;

  return <section className={styles.schedule} aria-label="Roster schedule">
    <div className={styles.toolbar}>
      <h2>Schedule</h2>
      <div className={styles.navigation}>
        <div className={styles.weekPicker}>
          <button type="button" aria-label="Previous matchup week" disabled={selectedIndex <= 0} onClick={() => setSelectedWeekId(weeks[selectedIndex - 1].id)}><ChevronLeft /></button>
          <label><span className={styles.srOnly}>Matchup week</span><select value={week.id} onChange={(event) => setSelectedWeekId(event.target.value)}>
            {weeks.map((item) => <option key={item.id} value={item.id}>Week {item.sequence} · {dateLabel(item.startsAtMs, timeZone)}–{dateLabel(item.endsAtMs - 1, timeZone)}</option>)}
          </select></label>
          <button type="button" aria-label="Next matchup week" disabled={selectedIndex >= weeks.length - 1} onClick={() => setSelectedWeekId(weeks[selectedIndex + 1].id)}><ChevronRight /></button>
        </div>
        <span className={styles.zone}>Times in {timeZone === "America/Vancouver" || timeZone === "America/Los_Angeles" ? "Pacific" : timeZone.replaceAll("_", " ")}</span>
      </div>
    </div>
    {schedule.isError ? <ErrorBlock error={schedule.error} fallback="The NHL schedule is unavailable." recovery="Try again shortly." action={<button type="button" onClick={() => schedule.refetch()}>Try again</button>} />
      : schedule.isPending ? <p role="status">Loading NHL schedule…</p>
        : <>
          {CATEGORIES.map(([key, title]) => {
            const players = workspace.players.filter((player) => player.rosterCategory === key);
            return <section key={key} className={`${styles.category} ${key === "Bench" ? styles.bench : ""}`} aria-label={`${title} schedule`}>
              <header className={styles.categoryHeading}><h3>{title}</h3><span>{players.length} {players.length === 1 ? "player" : "players"}</span></header>
              {players.length === 0 ? <p className={styles.empty}>No players in this section.</p> : players.map((player) => {
                const team = normalizeTeam(player.nhlTeamAbbreviation || player.provider?.nhlTeamAbbreviation || "");
                const knownTeam = NHL_TEAMS.has(team);
                const games = knownTeam ? gamesByTeam.get(team) || [] : [];
                const count = games.filter((game) => !["postponed", "cancelled"].includes(game.status)).length;
                return <article className={styles.player} key={player.ownershipId || player.playerId} aria-label={`${player.name} schedule`}>
                  <div className={styles.identity}>
                    <PositionTag position={player.normalizedPosition} category={player.rosterCategory} />
                    <div><strong className={styles.name}>{player.name}</strong><span className={styles.playerMeta}>{team || "No NHL team"}</span></div>
                  </div>
                  {games.length ? <ul className={styles.games} aria-label={`${player.name} games`} tabIndex={0}>{games.map((game) => <GameCard key={game.id} game={game} team={team} timeZone={timeZone} />)}</ul>
                    : <p className={styles.noGames}>{knownTeam ? "No NHL games this week" : "NHL schedule unavailable for this player"}</p>}
                  <div className={styles.count} aria-label={knownTeam ? `${count} ${count === 1 ? "game" : "games"} this week` : "Game count unavailable"}><strong>{knownTeam ? count : "—"}</strong><span>{count === 1 ? "game" : "games"}</span></div>
                </article>;
              })}
            </section>;
          })}
          <p className={styles.updated}>Schedule checked {format(schedule.data.fetchedAtMs, timeZone, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}. Postponed and cancelled games aren’t included in totals.</p>
        </>}
  </section>;
}
