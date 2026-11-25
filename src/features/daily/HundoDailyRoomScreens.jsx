import { Fragment, useEffect, useId, useRef, useState } from "react";
import { DailySlateGames } from "./DailySlateGames.jsx";
import { ChevronDown, Minus, Plus, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { routePaths } from "../../app/routePaths.js";
import { SCORING_CATEGORIES } from "../../shared/scoringCategories.js";
import { DailyScoreRoster, ScoreRosterTable, StatsCollection } from "./DailyScoreRoster.jsx";
import { salaryText, scoreText, statText } from "./dailyScorePresentation.js";
import { dailyNow, formatDay, formatTime, phaseLabels } from "./dailyApi.js";
import { dailyStartTimes, DAILY_AUCTION_MS } from "./dailyStartTimes.js";
import { DailyCreateConfirmation } from "./DailyCreateConfirmation.jsx";
import { DailyUserStripes } from "./DailyUserStripes.jsx";
import { DailyLiveScoring } from './DailyLiveScoring.jsx';
import "./HundoDailyRoomScreens.css";

const dayStatus = {
  no_games: "No NHL games are scheduled for this day.",
  locked: "No future auction start times remain for this game day.",
  unavailable: "The NHL schedule for this day is temporarily unavailable.",
};

function gameDayLabel(slate) {
  const prefix = { today: "Today", tomorrow: "Tomorrow", next: "Next game day" }[slate.day];
  const day = formatDay(slate.date + "T12:00:00Z");
  return prefix ? prefix + " · " + day : day;
}

const auctionTimeLabel = value => formatDay(value) + " · " + formatTime(value);
const slateDayFormat = new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
const slateDayLabel = date => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date + "T12:00:00Z"))
  ? slateDayFormat.format(new Date(date + "T12:00:00Z")) : "Game day unavailable";

export function RoomCard({ room, slate, viewer, pending, onJoin }) {
  const canJoin = !room.joined && room.memberCount < room.capacity && ["waiting", "auction"].includes(room.phase);
  const owner = room.commissionerName || room.members?.find(member => member.id === room.commissionerId)?.name ||
    (viewer?.id === room.commissionerId ? viewer.displayName : null);
  const otherDay = !slate || room.date !== slate.date || formatDay(room.auctionStartsAt) !== formatDay(room.firstGameAt);
  return <li className="hds-room-card">
    <div className="hds-room-name"><h3>{room.name}</h3>
      {room.joined && <small className="hds-your-room">Your room</small>}
      <small className="hds-cap-choice" data-enabled={room.capBonusRatePercent > 0}
        title={room.capBonusRatePercent > 0 ? "0.25% extra positive team FP per $1 unspent" : "Team score uses hockey FP only"}>
        Cap bonus {room.capBonusRatePercent > 0 ? "on · 0.25%/$1 saved" : "off"}</small>
      {room.winners?.length ? <small>Winner{room.winners.length > 1 ? "s" : ""} · {room.winners.map(w => w.name).join(" & ")}</small>
        : (room.mode === "practice" || room.phase !== "waiting") && <small>{[room.mode === "practice" && "Practice room", phaseLabels[room.phase]].filter(Boolean).join(" · ")}</small>}
    </div>
    <div className="hds-room-cell"><span>Commish</span><strong>{owner || "—"}</strong></div>
    <div className="hds-room-cell hds-seats" aria-label={room.memberCount + " of " + room.capacity + " managers"}><span>Managers</span><strong>{room.memberCount}/{room.capacity}</strong></div>
    <div className="hds-room-cell"><span>Auction{otherDay && " · " + formatDay(room.auctionStartsAt)}</span>
      <strong><time dateTime={room.auctionStartsAt}>{formatTime(room.auctionStartsAt)}</time></strong></div>
    <div className="hds-row-actions">
      {canJoin && <button type="button" className="hds-button" disabled={pending} aria-label={"Join " + room.name} onClick={() => onJoin(room.id)}>Join room</button>}
      <Link className={"hds-button" + (room.joined ? " hds-button-solid" : "")} to={routePaths.dailyRoom(room.id)}>
        {!room.joined && room.phase === "auction" ? "Watch auction" : "View room"}</Link>
      {!canJoin && !room.joined && <small className="hds-room-availability">{room.memberCount >= room.capacity && ["waiting", "auction"].includes(room.phase) ? "Full" : "Joining closed"}</small>}
    </div>
  </li>;
}

export function DailyLobbyScreen({ rooms = [], slate, viewer, pending = false, onJoin }) {
  const byDate = new Map();
  for (const room of rooms) {
    const date = room.date || "";
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(room);
  }
  const groups = [...byDate].sort(([a], [b]) => (a || "9999").localeCompare(b || "9999"));
  return <section className="hds-lobby hds-skin" aria-label="Daily rooms">
    <header className="hds-titleband"><p>Choose a room to play or watch.</p><h1>Rooms</h1></header>
    {groups.map(([date, list]) => <section key={date} className="hds-room-group" aria-label={slateDayLabel(date) + " games"}>
      <h2>{slateDayLabel(date)} <small>games</small></h2>
      <ul className="hds-room-cards">{list.map(room => <RoomCard key={room.id} room={room} slate={slate} viewer={viewer} pending={pending} onJoin={onJoin}/>)}</ul>
    </section>)}
    {!rooms.length && <p className="hds-empty">No rooms are open yet. Open a room to get started.</p>}
  </section>;
}

export function DailyCreateScreen({ options = [], initialDate, today, practice = false, practiceSlate, viewer, pending, onCreate, onCancel }) {
  const fieldId = useId();
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("8");
  const [date, setDate] = useState(initialDate || "");
  const [startsAt, setStartsAt] = useState("");
  const [allowSpectatorChat, setAllowSpectatorChat] = useState(false);
  const [capSavingsBonus, setCapSavingsBonus] = useState(true);
  const [confirmation, setConfirmation] = useState(null);
  const [now, setNow] = useState(dailyNow);
  const intent = useRef(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(dailyNow()), 1000);
    return () => clearInterval(timer);
  }, []);
  const count = Number(capacity);
  const validCapacity = Number.isSafeInteger(count) && count >= 1;
  const slate = practice ? practiceSlate : options.find(item => item.date === date);
  const available = slate?.date === date && slate?.status === (practice ? "available" : "open");
  const startOptions = dailyStartTimes(slate, now);
  const selectedStart = startOptions.includes(startsAt) ? startsAt : "";
  const endsAt = selectedStart ? new Date(Date.parse(selectedStart) + DAILY_AUCTION_MS).toISOString() : null;
  const valid = available && name.trim() && validCapacity && (practice || selectedStart);
  const schedule = !available ? (dayStatus[slate?.status] || "Select an available game day.")
    : practice ? "Bidding starts immediately and lasts 30 minutes. Points include plays from the full day’s games."
    : selectedStart ? "Auction opens " + auctionTimeLabel(selectedStart) + " · Rosters lock " + auctionTimeLabel(endsAt)
      : startOptions.length ? "Choose any future quarter-hour, including before game day. Auctions last 30 minutes and must finish before the first puck drop."
        : "No future auction start times remain for this game day. Choose another day.";
  function create() {
    if (!valid || pending || (!practice && Date.parse(selectedStart) <= dailyNow())) { setConfirmation(null); return; }
    const body = { name: name.trim(), capacity: count, slateDate: date, allowSpectatorChat, capSavingsBonus,
      ...(practice ? { mode: "practice" } : {auctionStartsAt:selectedStart}) };
    const signature = JSON.stringify(body);
    if (intent.current?.signature !== signature) intent.current = { signature, key: crypto.randomUUID() };
    onCreate(body, intent.current.key);
    setConfirmation(null);
  }
  function submit(event) {
    event.preventDefault();
    if (!valid || pending) return;
    if (!practice && (slate.day === "tomorrow" || date > today)) setConfirmation({date,startsAt:selectedStart,tomorrow:slate.day === "tomorrow"});
    else create();
  }
  return <section className="hds-create-screen hds-skin">
    <header className="hds-titleband"><h1>{practice ? "Practice with today’s games" : "Open a room"}</h1></header>
    <div className="hds-create-columns">
      <form className="hds-form hds-pane" onSubmit={submit}>
        <div className="hds-form-row"><label htmlFor={fieldId + "-name"}>Room name</label>
          <input id={fieldId + "-name"} autoFocus required maxLength={60} value={name} disabled={pending} onChange={e => setName(e.target.value)}/></div>
        <div className="hds-form-row hds-capacity"><label htmlFor={fieldId + "-seats"}>Maximum managers</label>
          <div className="hds-stepper"><button type="button" aria-label="Decrease maximum managers" disabled={pending || count <= 1} onClick={() => setCapacity(String(Math.max(1, (Number.isFinite(count) ? Math.floor(count) : 2) - 1)))}><Minus aria-hidden="true"/></button>
            <input type="number" id={fieldId + "-seats"} required min="1" step="1" value={capacity} disabled={pending} onChange={e => setCapacity(e.target.value)}/>
            <button type="button" aria-label="Increase maximum managers" disabled={pending || count >= Number.MAX_SAFE_INTEGER} onClick={() => setCapacity(String(Math.max(1, (Number.isFinite(count) ? Math.floor(count) : 0) + 1)))}><Plus aria-hidden="true"/></button></div>
        </div>
        <div className="hds-form-row"><label htmlFor={fieldId + "-day"}>Game day</label>
          {practice ? <output id={fieldId + "-day"}>{slate?.date ? gameDayLabel(slate) : "Unavailable"}</output> :
          <select id={fieldId + "-day"} value={slate ? date : ""} disabled={pending} aria-describedby={fieldId + "-schedule"} onChange={e => { setDate(e.target.value); setStartsAt(""); }}>
            {!slate && <option value="">Choose a game day</option>}
            {options.map(item => <option key={item.date} value={item.date}>{gameDayLabel(item)}</option>)}</select>}
        </div>
        {!practice && <div className="hds-form-row"><label htmlFor={fieldId + "-start"}>Auction start time</label>
          <select id={fieldId + "-start"} required value={selectedStart} disabled={pending || !available || !startOptions.length}
            aria-describedby={fieldId + "-schedule"} onChange={event => setStartsAt(event.target.value)}>
            <option value="">Choose a start time</option>
            {startOptions.map(time => <option key={time} value={time}>{auctionTimeLabel(time)}</option>)}
          </select><small>15-minute intervals · 30-minute auction</small>
        </div>}
        <div className="hds-form-row hds-chat-choice">
          <label htmlFor={fieldId + "-cap-bonus"}><input type="checkbox" id={fieldId + "-cap-bonus"}
            checked={capSavingsBonus} disabled={pending} aria-describedby={fieldId + "-cap-help"}
            onChange={event => setCapSavingsBonus(event.target.checked)}/>Use cap savings bonus</label>
          <small id={fieldId + "-cap-help"}>Add 0.25% to positive team FP for every $1 unspent. Turn off for hockey FP only. Fixed once the room is created.</small>
        </div>
        <div className="hds-form-row hds-chat-choice">
          <label htmlFor={fieldId + "-spectator-chat"}><input type="checkbox" id={fieldId + "-spectator-chat"}
            checked={allowSpectatorChat} disabled={pending} aria-describedby={fieldId + "-chat-help"}
            onChange={event => setAllowSpectatorChat(event.target.checked)}/>Allow spectators in chat</label>
          <small id={fieldId + "-chat-help"}>Let signed-in spectators read and post in this room’s chat. Otherwise, chat stays members-only.</small>
        </div>
        <div className="hds-form-actions"><button type="submit" className="hds-button hds-button-solid" disabled={pending || !valid}>{practice ? "Start practice room" : "Create room"}</button>
          <button type="button" className="hds-cancel" disabled={pending} onClick={onCancel}>Cancel</button></div>
      </form>
      <aside className="hds-preview hds-pane" aria-label="Room preview">
        <h2>Room preview</h2><h3>{name.trim() || "Your room"}</h3>
        <div className="hds-preview-meta"><p><b>Commish</b> {viewer?.displayName || "You"}</p><p><b>Managers</b> <strong>1/{validCapacity ? count : "—"}</strong></p></div>
        <p className="hds-preview-note"><strong>Chat</strong> · {allowSpectatorChat ? "Members and spectators" : "Members only"}</p>
        {available && <dl className="hds-preview-times"><div><dt>Auction opens</dt><dd>{practice ? "Immediately" : selectedStart ? auctionTimeLabel(selectedStart) : "Choose a time"}</dd></div>
          <div><dt>Rosters lock</dt><dd>{practice ? "In 30 minutes" : endsAt ? auctionTimeLabel(endsAt) : "30 minutes after opening"}</dd></div>
          {!practice && <div><dt>First puck drop</dt><dd>{auctionTimeLabel(slate.firstGameAt)}</dd></div>}</dl>}
        <p id={fieldId + "-schedule"} className="hds-preview-note">{schedule}</p>
        <p className="hds-preview-note"><strong>Cap savings bonus · {capSavingsBonus ? "On" : "Off"}</strong> · {capSavingsBonus
          ? "Every $1 unspent adds 0.25% to positive team FP. A $60 roster gets a 10% boost."
          : "Team score uses hockey FP only. Unspent cap adds no bonus."}</p>
        {available && !practice && selectedStart && <p className="hds-preview-note">{Date.parse(selectedStart) - 600_000 > now
          ? "Reminder at " + auctionTimeLabel(Date.parse(selectedStart) - 600_000) : "Starts within 10 minutes — participants receive a reminder as they join."}</p>}
      </aside>
    </div>
    {confirmation && <DailyCreateConfirmation {...confirmation} onCancel={() => setConfirmation(null)} onConfirm={create}/>}
  </section>;
}

function standingsMargin(members, viewerId, finished, winners) {
  const leader = members[0];
  const mine = members.find(member => member.id === viewerId);
  if (!Number.isFinite(leader?.points)) return null;
  if (finished) {
    if (winners.length > 1) return "Tied for first";
    if (winners.length === 1 && Number.isFinite(members[1]?.points)) return "Won by " + (winners[0].points - members[1].points).toFixed(2) + " FP";
  } else if (Number.isFinite(mine?.points) && mine.points < leader.points) {
    const ahead = members[1]?.points === leader.points ? "the leaders" : leader.name;
    return (leader.points - mine.points).toFixed(2) + " FP behind " + ahead;
  }
  return null;
}

export function DailyScoreboard({ room, viewer }) {
  const [expanded, setExpanded] = useState([]);
  const prefix = useId();
  const members = [...room.members].sort((a,b) => (b.points ?? -Infinity) - (a.points ?? -Infinity));
  const mine = members.find(member => member.id === viewer?.id);
  const finished = room.phase === "finished";
  const provisional = !finished && room.live?.provisionalGameCount > 0;
  const winners = room.winners || [];
  const capBonus = room.capBonusRatePercent > 0;
  const margin = standingsMargin(members, viewer?.id, finished, winners);
  if (room.phase === "void") return <div className="hds-skin"><p className="hds-empty" role="status">This slate was cancelled. No winner was awarded.</p>
    <DailySlateGames games={room.games}/>
    <DailyScoreRoster member={mine}/></div>;
  const rankByPoints = new Map();
  for (const [index, member] of members.entries()) {
    if (!rankByPoints.has(member.points)) rankByPoints.set(member.points, index + 1);
  }
  return <div className={"hds-skin hds-results" + (finished ? " hds-final" : "")}>
    {finished && winners.length > 0 && <div className="hds-winner" role="status"><Trophy aria-hidden="true"/><span>{winners.length === 1 ? "Room winner" : "Joint winners"}</span>
      <strong>{winners.map(w => w.name).join(" & ")}</strong><b className="hds-fp">{scoreText(winners[0].points)} FP</b></div>}
    {!finished && <header className="hds-standings-title"><h2>Room standings</h2><DailySlateGames games={room.games}/><div><strong>Scoring in progress</strong><span>{provisional ? 'Scores include live NHL stats.' : 'Scores update as official game stats arrive.'}</span></div></header>}
    {finished && <DailySlateGames games={room.games}/>}
    {!finished && <DailyLiveScoring live={room.live}/>}
    <div className="hds-scorebook"><section className="hds-rankings hds-pane" aria-label={finished ? "Final standings" : "Room standings"}>
      {finished && <h2>Final standings</h2>}
      <p className="hds-score-note">Expand a manager to see their players. {provisional ? 'Provisional stats may change when final stats arrive; a dash means details aren’t available yet.' : 'Partial stats include only collected games; a dash means details aren’t available yet.'}</p>
      {capBonus && <p className="hds-score-note hds-cap-rule">Total FP includes a {room.capBonusRatePercent}% bonus per $1 unspent, applied to positive hockey FP.</p>}
      <div className="hds-stats-legend" role="group" aria-label="Stats collection legend">
        <span><i className="hds-stats-status" data-status="collected" aria-hidden="true"/>Collected</span>
        <span><i className="hds-stats-status" data-status="pending" aria-hidden="true"/>Pending</span>
        {provisional && <span><i className="hds-stats-status" data-status="provisional" aria-hidden="true"/>Provisional</span>}
      </div>
      <p className="hds-scroll-hint">Swipe to see all stats.</p>
      <div className="hds-table-scroll" role="region" aria-label="Standings and player stats" tabIndex={0}>
      <table className="hds-standings-table" aria-label="Manager rankings"><thead><tr><th scope="col">Rank</th><th scope="col" className="hds-status-column" title="Official stats collection">Stats</th><th scope="col">Manager</th>
        {SCORING_CATEGORIES.map(({ key, abbreviation, label }) => <th key={key} scope="col" title={label}>{abbreviation}</th>)}
        <th scope="col" className="hds-salary-column" title="Total signed salary">Salary</th><th scope="col" title="Fantasy points">Total FP</th></tr></thead>
        <tbody>{members.map((member, index) => {
          const open = expanded.includes(member.id);
          const rosterId = prefix + "-roster-" + index;
          return <Fragment key={member.id}><tr data-accent={finished ? winners.some(w => w.id === member.id) : viewer?.id === member.id}>
            <td>{Number.isFinite(member.points) ? rankByPoints.get(member.points) : "—"}</td><td className="hds-status-column"><StatsCollection row={member}/></td><th scope="row" className="hd-user-stripe-cell"><DailyUserStripes appearance={member.dailyAppearance}/><button type="button" className="hds-score-name" aria-expanded={open} aria-controls={rosterId}
              onClick={() => setExpanded(current => current.includes(member.id) ? current.filter(id => id !== member.id) : [...current, member.id])}>
              <ChevronDown aria-hidden="true"/>{member.name}{member.id === viewer?.id && " (you)"}</button></th>
            {SCORING_CATEGORIES.map(({ key }) => <td key={key}>{statText(member, key)}</td>)}
            <td className="hds-salary-total">{salaryText(member.spent)}</td>
            <td className="hds-fp">{scoreText(member.points)}
              {capBonus && <small className="hds-cap-breakdown" aria-label={`Score breakdown for ${member.name}`}>
                <span>{scoreText(member.hockeyPoints)} hockey</span>
                <span>+{scoreText(member.capBonusPoints)} cap</span>
                <span>({member.capBonusPercent}%)</span>
              </small>}
            </td>
          </tr><tr className="hds-expanded-roster" id={rosterId} hidden={!open}><td colSpan={SCORING_CATEGORIES.length + 5}>
            {open && <div><h3>Roster for {member.name}</h3><ScoreRosterTable member={member} detailed capBonusRatePercent={room.capBonusRatePercent}/></div>}
          </td></tr></Fragment>;
        })}</tbody></table></div>
      {margin && <p className="hds-margin">{margin}</p>}
    </section><DailyScoreRoster member={mine} capBonusRatePercent={room.capBonusRatePercent}/></div>
  </div>;
}
