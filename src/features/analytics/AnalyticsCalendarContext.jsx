import { EmptyBlock, TableScroll } from "../../components/HundoUi.jsx";
import { mondayOf } from "./analyticsPeriods.js";
import styles from "./AnalyticsCalendarContext.module.css";
const number = new Intl.NumberFormat("en-CA");
const label = value => new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value + "T12:00:00Z"));
const weekday = value => new Intl.DateTimeFormat("en-CA", { weekday: "short", timeZone: "UTC" }).format(new Date(value + "T12:00:00Z"));
const deadlineTypes = [["matchupDeadlines", "Matchups"], ["auctionDeadlines", "Auctions"], ["tradeDeadlines", "Trades"]];
function Evidence({ rows, field }) {
  const known = rows.filter(row => row[field] !== null);
  if (!known.length) return <span className={styles.unknown}>Unknown</span>;
  const value = known.reduce((sum, row) => sum + row[field], 0);
  const unknown = rows.length - known.length;
  return <><strong>{number.format(value)}</strong>{unknown > 0 && <small>{unknown} {unknown === 1 ? "day" : "days"} unknown</small>}</>;
}
export function AnalyticsCalendarContext({ calendar }) {
  const weeks = new Map();
  for (const row of calendar.days) {
    const key = mondayOf(row.date);
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key).push(row);
  }
  if (!weeks.size) return <EmptyBlock title="No calendar records in this period">Choose another period to see available hockey and deadline context.</EmptyBlock>;
  return <div className={styles.weeks} aria-label="Aggregate hockey and deadline context">
    {[...weeks].map(([start, rows]) => {
      const events = rows.flatMap(row => deadlineTypes.filter(([key]) => row[key] > 0).map(([key, type]) => ({ date: row.date, type, count: row[key], key })));
      return <section className={styles.week} key={start} aria-label={"Calendar week of " + start}>
        <div className={styles.heading}><h3>{label(rows[0].date)}{rows.length > 1 ? " – " + label(rows.at(-1).date) : ""}</h3><span>{rows[0].date.slice(0, 4)}{rows[0].date.slice(0,4) !== rows.at(-1).date.slice(0,4) ? " / " + rows.at(-1).date.slice(0,4) : ""}{rows.length < 7 ? " · Partial week" : ""}</span></div>
        <div className={styles.metrics}><div><span>Recorded NHL games</span><Evidence rows={rows} field="recordedNhlGames" /></div><div><span>Daily draft windows ended</span><Evidence rows={rows} field="dailyDrafts" /></div></div>
        <div className={styles.deadlines}><h4>Deadlines</h4>{events.length ? <ul>{events.map(event => <li key={event.date + event.key}><span className={styles.deadlineType}>{event.type}</span><time dateTime={event.date}>{weekday(event.date)}, {label(event.date)}</time><b>{number.format(event.count)}</b></li>)}</ul> : <p>No deadlines recorded this week.</p>}</div>
        <details className={styles.details}><summary>Daily hockey &amp; draft details</summary><TableScroll label={"Daily hockey and drafts for week of " + start}><table><thead><tr><th scope="col">Day · UTC−8</th><th scope="col">NHL games</th><th scope="col">Daily drafts</th></tr></thead><tbody>{rows.map(row => <tr key={row.date}><th scope="row"><time dateTime={row.date}>{weekday(row.date)}, {label(row.date)}</time></th><td>{row.recordedNhlGames === null ? "Unknown" : number.format(row.recordedNhlGames)}</td><td>{row.dailyDrafts === null ? "Unknown" : number.format(row.dailyDrafts)}</td></tr>)}</tbody></table></TableScroll></details>
      </section>;
    })}
  </div>;
}
