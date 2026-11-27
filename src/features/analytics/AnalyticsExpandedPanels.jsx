import { BarChart3, Download, Monitor, Smartphone } from "lucide-react";
import { EmptyBlock, Surface, TableScroll } from "../../components/HundoUi.jsx";
import styles from "./AdminAnalyticsPage.module.css";

const number = new Intl.NumberFormat("en-CA");
const decimal = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 1 });
import { analyticsMetric } from "./analyticsContracts.js";
const percent = (count, total) => total ? decimal.format(count * 100 / total) + "%" : "—";
const minuteText = (seconds) => decimal.format(seconds / 60);
const countText = (value) => value === null ? "Unavailable" : number.format(value);
export function ExpandedCoverage({ data }) {
  if (data.measurement.expandedCoverage === "not_started") return <p className={styles.coverage}>These additional measurements have not started yet. Earlier activity is not reconstructed.</p>;
  if (data.measurement.expandedCoverage === "partial") return <p className={styles.coverage}>Additional measurements begin on {data.measurement.expandedStartedOn}. That first day is partial; earlier dates were not measured.</p>;
  return null;
}

export function FeatureUsage({ data }) {
  const names = [
    ["feature.players_filter", "Players filters", "Filter changes and search submissions"],
    ["feature.favourites", "Favourites", "Favourite changes"],
    ["feature.roster_schedule", "Roster schedule", "Schedule opens"],
    ["feature.daily_chat_open", "Daily chat", "Chat opens"],
    ["feature.daily_chat_send", "Daily messages", "Successful sends"],
  ];
  const rows = names.map(([key, label, description]) => ({ key, label, description, count: analyticsMetric(data, key) })).sort((a, b) => b.count - a.count);
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const unmeasured = data.measurement.expandedCoverage === "not_started";
  return <Surface className={styles.panel} aria-labelledby="analytics-features">
    <div className={styles.panelHeading}><div><p className={styles.eyebrow}>FEATURE ADOPTION</p><h2 id="analytics-features">Recorded feature actions</h2></div><BarChart3 aria-hidden="true" /></div>
    {unmeasured ? <EmptyBlock title="Feature measurement has not started">Counts will appear as these features are used.</EmptyBlock> :
      <div className={styles.featureList}>{rows.map((row) => <div key={row.key}>
        <div className={styles.featureHeading}><span><strong>{row.label}</strong><small>{row.description}</small></span><b>{number.format(row.count)}</b></div>
        <div className={styles.shareTrack} aria-hidden="true"><span style={{ width: percent(row.count, total) === "—" ? "0%" : percent(row.count, total) }} /></div>
      </div>)}</div>}
    <p className={styles.note}>Counts are actions, not people. No search terms, player selections, or message content are collected.</p>
  </Surface>;
}

export function InstallationUsage({ data }) {
  const unmeasured = data.measurement.expandedCoverage === "not_started";
  const installed = analyticsMetric(data, "launch.installed");
  const browser = analyticsMetric(data, "launch.browser");
  const small = analyticsMetric(data, "layout.small");
  const large = analyticsMetric(data, "layout.large");
  const value = (metric) => unmeasured ? "—" : number.format(analyticsMetric(data, metric));
  return <Surface className={styles.panel} aria-labelledby="analytics-installations">
    <div className={styles.panelHeading}><div><p className={styles.eyebrow}>APP & BROWSER</p><h2 id="analytics-installations">Installations and openings</h2></div><Download aria-hidden="true" /></div>
    <div className={styles.installStats}>
      <div><span>Reported installations</span><strong>{value("install.reported")}</strong><small>Install events reported by supporting browsers</small></div>
      <div><span>Installed-app openings</span><strong>{value("launch.installed")}</strong><small>{percent(installed, installed + browser)} of recorded openings</small></div>
      <div><span>Browser openings</span><strong>{value("launch.browser")}</strong><small>{percent(browser, installed + browser)} of recorded openings</small></div>
    </div>
    <p className={styles.note}>These are event counts, not unique installs or devices. Openings include reloads. Some iPhone and iPad installations do not report an install event.</p>
    <h3 className={styles.subheading}>Launch layout</h3>
    <div className={styles.layoutGrid}>
      <div><Smartphone aria-hidden="true" /><span>Small layout<small>767 CSS pixels or narrower</small></span><strong>{unmeasured ? "—" : number.format(small)}</strong></div>
      <div><Monitor aria-hidden="true" /><span>Large layout<small>Wider than 767 CSS pixels</small></span><strong>{unmeasured ? "—" : number.format(large)}</strong></div>
    </div>
    <p className={styles.note}>One broad layout report per recorded opening. This describes the viewport, not a device model.</p>
  </Surface>;
}

export function ActionHealth({ data }) {
  const unmeasured = data.measurement.expandedCoverage === "not_started";
  const rows = [
    ["join", "Room joins"], ["bid", "Bid actions"], ["trade", "Trade actions"], ["page_load", "Page-data requests"],
  ].map(([name, label]) => ({ name, label, success: analyticsMetric(data, "action." + name + ".success"), failure: analyticsMetric(data, "action." + name + ".failure") }));
  return <Surface className={styles.panel} aria-labelledby="analytics-actions">
    <div className={styles.panelHeading}><div><p className={styles.eyebrow}>WORKFLOW HEALTH</p><h2 id="analytics-actions">Action outcomes</h2></div></div>
    {unmeasured ? <EmptyBlock title="Outcome measurement has not started">Successful and failed requests will be counted by broad action type.</EmptyBlock> :
      <TableScroll label="Aggregate action outcomes"><table className={styles.table}><thead><tr><th scope="col">Action</th><th scope="col">Success</th><th scope="col">Failure</th><th scope="col">Success rate</th></tr></thead><tbody>{rows.map((row) => <tr key={row.name}><th scope="row">{row.label}</th><td>{number.format(row.success)}</td><td>{number.format(row.failure)}</td><td>{percent(row.success, row.success + row.failure)}</td></tr>)}</tbody></table></TableScroll>}
    <p className={styles.note}>Page-data requests include refreshes. Failures can include rejected inputs and connection errors; these rates are not an uptime measurement.</p>
  </Surface>;
}

export function WebVitals({ data }) {
  const metrics = [
    ["lcp", "LCP", "Largest Contentful Paint", "Loading"],
    ["inp", "INP", "Interaction to Next Paint", "Responsiveness"],
    ["cls", "CLS", "Cumulative Layout Shift", "Visual stability"],
  ];
  return <Surface className={styles.panel} aria-labelledby="analytics-vitals">
    <div className={styles.panelHeading}><div><p className={styles.eyebrow}>BROWSER EXPERIENCE</p><h2 id="analytics-vitals">Browser performance samples</h2></div></div>
    <div className={styles.vitals}>{metrics.map(([key, label, name, meaning]) => {
      const good = analyticsMetric(data, "vital." + key + ".good");
      const improve = analyticsMetric(data, "vital." + key + ".needs_improvement");
      const poor = analyticsMetric(data, "vital." + key + ".poor");
      const total = good + improve + poor;
      return <section key={key} aria-label={name} className={styles.vital}>
        <div className={styles.vitalHeading}><span><strong>{label}</strong> {meaning}</span><span>{number.format(total)} samples</span></div>
        {!total ? <p className={styles.note}>No supported browser samples yet.</p> : <>
          <div className={styles.vitalBar} aria-hidden="true"><span data-rating="good" style={{ width: percent(good, total) }} /><span data-rating="improve" style={{ width: percent(improve, total) }} /><span data-rating="poor" style={{ width: percent(poor, total) }} /></div>
          <div className={styles.vitalLegend}><span>Good <b>{percent(good, total)}</b></span><span>Needs improvement <b>{percent(improve, total)}</b></span><span>Poor <b>{percent(poor, total)}</b></span></div>
        </>}
      </section>;
    })}</div>
    <p className={styles.note}>Core Web Vitals use the first reported rating per document, not per route. Only rating buckets are retained. Browser support and interaction affect coverage; these are not percentile scores.</p>
  </Surface>;
}

export function PeakUsage({ data }) {
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const blocks = ["00-05", "06-11", "12-17", "18-23"];
  const labels = ["Midnight–6am", "6am–noon", "Noon–6pm", "6pm–midnight"];
  const peak = data.peakUsage;
  const available = peak.status === "available";
  const max = Math.max(1, ...data.timeBlocks.map((cell) => cell.pageViews || 0));
  return <Surface className={styles.panel} aria-labelledby="analytics-peak">
    <div className={styles.panelHeading}><div><p className={styles.eyebrow}>WHEN HUNDO IS USED</p><h2 id="analytics-peak">Weekday & time of day</h2></div><span className={styles.badge}>UTC−8</span></div>
    {!available ? <EmptyBlock title={peak.status === "not_measured" ? "Timing measurement has not started" : "More activity is needed"}>
      This view opens after at least {peak.minimumMeasuredDays} measured days and {peak.minimumPageViews} page views in the selected period.
    </EmptyBlock> : <TableScroll label="Page views by weekday and six-hour block"><table className={styles.heatmap}><thead><tr><th scope="col">Day</th>{labels.map((label) => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>
      {[1, 2, 3, 4, 5, 6, 0].map((weekday) => <tr key={weekday}><th scope="row">{weekdays[weekday]}</th>{blocks.map((block) => {
        const cell = data.timeBlocks.find((item) => item.weekday === weekday && item.block === block);
        return <td key={block} title={cell.suppressed ? "Small activity total withheld" : minuteText(cell.activeSeconds) + " estimated active minutes"}><span style={{ backgroundColor: cell.suppressed ? "#243148" : `rgba(50, 137, 245, ${0.12 + (cell.pageViews || 0) / max * 0.55})` }}>{cell.suppressed ? "<" + peak.suppressionThreshold : number.format(cell.pageViews)}</span></td>;
      })}</tr>)}
    </tbody></table></TableScroll>}
    <p className={styles.note}>Totals combine matching weekdays across the selected period. Small nonzero cells below {peak.suppressionThreshold} page views are withheld, including their active time.</p>
  </Surface>;
}

function Unavailable({ status, subject }) {
  return <EmptyBlock title={status === "unavailable" ? subject + " is unavailable" : subject + " has not started"}>This section is not shown as zero. Other analytics remain available.</EmptyBlock>;
}
function WeeklyGameplayChart({ rows }) {
  if (!rows.length) return null;
  const series = [["completedTrades", "Trades"], ["resolvedAuctions", "Auctions"], ["rosterChanges", "Roster changes"], ["dailyDrafts", "Daily draft windows"]];
  const total = (row) => series.reduce((sum, [key]) => sum + (row[key] || 0), 0);
  const maximum = Math.max(1, ...rows.map(total));
  return <div className={styles.weeklyVisual}>
    <div className={styles.weeklyLegend}>{series.map(([key, label]) => <span key={key}><i data-series={key} aria-hidden="true" />{label}</span>)}</div>
    <div className={styles.weeklyChart} role="img" aria-label="Weekly activity totals stacked by trades, auctions, roster changes and Daily draft windows. Exact values are in the table below.">
      {rows.map((row) => <div className={styles.weeklyColumn} key={row.weekStartDate} title={row.weekStartDate + ": " + series.map(([key, label]) => countText(row[key]) + " " + label.toLowerCase()).join(", ")}>
        <span className={styles.weeklyTotal}>{number.format(total(row))}</span>
        <div className={styles.weeklyStack} style={{ height: total(row) / maximum * 100 + "%" }}>
          {series.map(([key]) => <span data-series={key} key={key} style={{ height: total(row) ? (row[key] || 0) / total(row) * 100 + "%" : "0" }} />)}
        </div>
      </div>)}
    </div>
    <div className={styles.chartAxis}><span>Week of {rows[0].weekStartDate}</span><span>Week of {rows.at(-1).weekStartDate}</span></div>
    <p className={styles.note}>Stack heights combine the available activity types. Unavailable Daily counts are omitted from the bars and remain marked in the table.</p>
  </div>;
}

export function Gameplay({ data }) {
  const rooms = data.operations.dailyRooms;
  const gameplay = data.operations.gameplay;
  const unmeasured = data.measurement.expandedCoverage === "not_started";
  const modeLabel = (mode) => mode === "practice" ? "Practice" : "Scheduled";
  return <div className={styles.panelStack}>
    <ExpandedCoverage data={data} />
    <Surface className={styles.panel} aria-labelledby="analytics-rooms">
      <div className={styles.panelHeading}><div><p className={styles.eyebrow}>HUNDO DAILY</p><h2 id="analytics-rooms">Room fill & completion</h2></div></div>
      {rooms.status !== "available" ? <Unavailable status={rooms.status} subject="Room information" /> :
        <div className={styles.roomGrid}>{rooms.modes.map((room) => <section className={styles.roomCard} key={room.mode}>
          <h3>{modeLabel(room.mode)} rooms</h3>
          <strong className={styles.roomCount}>{number.format(room.rooms)}<small>rooms in the play-date period</small></strong>
          <div className={styles.roomRow}><span>Occupied seats</span><b>{number.format(room.filledSeats)} / {number.format(room.capacitySeats)}</b></div>
          <div className={styles.shareTrack} aria-hidden="true"><span style={{ width: percent(room.filledSeats, room.capacitySeats) === "—" ? "0%" : percent(room.filledSeats, room.capacitySeats) }} /></div>
          <div className={styles.roomRow}><span>Current seat fill</span><b>{percent(room.filledSeats, room.capacitySeats)}</b></div>
          <div className={styles.roomRow}><span>Full rooms</span><b>{number.format(room.fullRooms)}</b></div>
          <div className={styles.roomRow}><span>Completed / total</span><b>{number.format(room.completed)} / {number.format(room.rooms)} <small>({percent(room.completed, room.rooms)})</small></b></div>
          <div className={styles.roomRow}><span>Cancelled</span><b>{number.format(room.cancelled)}</b></div>
          <div className={styles.roomRow}><span>Scoring pending</span><b>{number.format(room.pendingScoring)}</b></div>
        </section>)}</div>}
      <p className={styles.note}>This is a current snapshot of rooms whose play dates fall in the selected period. Seat occupancy can include practice participants. Historical seat fill at draft start is not inferred from this snapshot.</p>
    </Surface>
    <Surface className={styles.panel} aria-labelledby="analytics-room-events">
      <div className={styles.panelHeading}><div><p className={styles.eyebrow}>OBSERVED ROOM ACTIVITY</p><h2 id="analytics-room-events">Room lifecycle totals</h2></div></div>
      {unmeasured ? <EmptyBlock title="Room event measurement has not started">New room events will be counted from the measurement start date.</EmptyBlock> :
        <TableScroll label="Room lifecycle events"><table className={styles.table}><thead><tr><th scope="col">Mode</th><th scope="col">Created</th><th scope="col">Started</th><th scope="col">Completed</th><th scope="col">Cancelled</th><th scope="col">Seat fill at start</th></tr></thead><tbody>{["scheduled", "practice"].map((mode) => <tr key={mode}><th scope="row">{modeLabel(mode)}</th>{["created", "started", "completed", "cancelled"].map((event) => <td key={event}>{number.format(analyticsMetric(data, "room." + event + "." + mode))}</td>)}<td>{percent(analyticsMetric(data, "room.seats_at_start." + mode), analyticsMetric(data, "room.capacity_at_start." + mode))}</td></tr>)}</tbody></table></TableScroll>}
      <p className={styles.note}>Events are counted on the day they happen. They can refer to different room cohorts, so created and completed totals do not form a conversion rate.</p>
    </Surface>
    <Surface className={styles.panel} aria-labelledby="analytics-gameplay">
      <div className={styles.panelHeading}><div><p className={styles.eyebrow}>PLAY ACROSS HUNDO</p><h2 id="analytics-gameplay">Weekly gameplay totals</h2></div></div>
      {gameplay.status !== "available" ? <Unavailable status={gameplay.status} subject="Gameplay information" /> : <>
        <div className={styles.summaryStats}>{[["completedTrades", "Completed trades"], ["resolvedAuctions", "Resolved auctions"], ["rosterChanges", "Roster changes"], ["dailyDrafts", "Daily draft windows ended"]].map(([key, label]) => <div key={key}><span>{label}</span><strong>{countText(gameplay.totals[key])}</strong></div>)}</div>
        <WeeklyGameplayChart rows={gameplay.weekly} />
        <TableScroll label="Weekly aggregate gameplay"><table className={styles.table}><thead><tr><th scope="col">Week beginning</th><th scope="col">Trades</th><th scope="col">Auctions</th><th scope="col">Roster changes</th><th scope="col">Daily draft windows ended</th></tr></thead><tbody>{gameplay.weekly.map((row) => <tr key={row.weekStartDate}><th scope="row">{row.weekStartDate}</th>{["completedTrades", "resolvedAuctions", "rosterChanges", "dailyDrafts"].map((key) => <td key={key}>{countText(row[key])}</td>)}</tr>)}</tbody></table></TableScroll>
      </>}
      <p className={styles.note}>Weeks begin Monday in UTC−8. The first and last weeks can cover only part of the selected period. Daily draft windows ended counts eligible noncancelled windows with draft activity; it does not mean scoring is complete.</p>
    </Surface>
  </div>;
}

function timestamp(value) {
  if (value === null) return "No successful update recorded";
  return new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Etc/GMT+8" }).format(new Date(value)) + " UTC−8";
}
function updateAge(value, asOfMs) {
  if (value === null) return "Age unavailable";
  if (!Number.isFinite(asOfMs) || asOfMs <= 0) return "Age unavailable";
  const elapsed = asOfMs - value;
  if (elapsed < 0) return "Timestamp is ahead of this refresh";
  if (elapsed < 60_000) return "Less than a minute ago";
  const [divisor, unit] = elapsed < 3_600_000 ? [60_000, "minute"] : elapsed < 86_400_000 ? [3_600_000, "hour"] : [86_400_000, "day"];
  const count = Math.max(1, Math.round(elapsed / divisor));
  return "About " + count + " " + unit + (count === 1 ? "" : "s") + " ago";
}
export function Freshness({ data, asOfMs }) {
  const freshness = data.operations.freshness;
  return <Surface className={styles.panel} aria-labelledby="analytics-freshness">
    <div className={styles.panelHeading}><div><p className={styles.eyebrow}>DATA HEALTH</p><h2 id="analytics-freshness">Statistics & injury freshness</h2></div><span className={styles.badge}>Current snapshot</span></div>
    {freshness.status !== "available" ? <Unavailable status={freshness.status} subject="Update information" /> : <>
      <div className={styles.freshnessGrid}>{[["statistics", "Statistics"], ["injuries", "Injuries"]].map(([key, label]) => <section key={key}>
        <h3>{label}</h3><span className={styles.smallLabel}>Latest successful update</span><strong>{timestamp(freshness[key].lastSuccessAtMs)}</strong><span className={styles.updateAge}>{updateAge(freshness[key].lastSuccessAtMs, asOfMs)}</span><p>{number.format(freshness[key].failedInPeriod)} failed updates in this period</p>
      </section>)}</div>
      <h3 className={styles.subheading}>Current processing backlog</h3>
      <div className={styles.summaryStats}>{[["Failed jobs", freshness.jobs.failedCount], ["Pending jobs", freshness.jobs.pendingCount], ["Running jobs", freshness.jobs.runningCount], ["Daily scoring pending", freshness.dailyScoringPending], ["Matchups awaiting data", freshness.matchupsAwaitingData]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{countText(value)}</strong></div>)}</div>
    </>}
    <p className={styles.note}>Update ages are rounded as of this refresh: {timestamp(asOfMs || null)}. Refresh totals to recalculate them.</p>
    <p className={styles.note}>This view reads recorded update results. Refreshing analytics does not run a statistics job or refresh injury data.</p>
  </Surface>;
}

export function HockeyContext({ data }) {
  const calendar = data.operations.calendar;
  return <div className={styles.panelStack}>
    <Surface className={styles.panel} aria-labelledby="analytics-hockey">
      <div className={styles.panelHeading}><div><p className={styles.eyebrow}>HOCKEY & DEADLINES</p><h2 id="analytics-hockey">Calendar context</h2></div></div>
      {calendar.status !== "available" ? <Unavailable status={calendar.status} subject="Calendar information" /> :
        <TableScroll label="Aggregate hockey and deadline context"><table className={styles.table}><thead><tr><th scope="col">Date</th><th scope="col">Recorded NHL games</th><th scope="col">Matchup deadlines</th><th scope="col">Auction deadlines</th><th scope="col">Trade deadlines</th><th scope="col">Daily drafts</th></tr></thead><tbody>{calendar.days.map((row) => <tr key={row.date}><th scope="row">{row.date}</th><td>{row.recordedNhlGames === null ? "Unknown" : number.format(row.recordedNhlGames)}</td>{["matchupDeadlines", "auctionDeadlines", "tradeDeadlines", "dailyDrafts"].map((key) => <td key={key}>{countText(row[key])}</td>)}</tr>)}</tbody></table></TableScroll>}
      <p className={styles.note}>NHL counts use recorded schedule evidence and may be incomplete. Unknown is not zero games. Deadlines are totals across leagues; no league, room, or participant is identified.</p>
    </Surface>
    <Surface className={styles.panel} aria-labelledby="analytics-releases">
      <div className={styles.panelHeading}><div><p className={styles.eyebrow}>RELEASE CONTEXT</p><h2 id="analytics-releases">Server builds first observed</h2></div></div>
      {!data.releases.length ? <EmptyBlock title="No build observations in this period">A build is recorded when it first receives an eligible analytics report.</EmptyBlock> :
        <ul className={styles.releaseList}>{data.releases.map((release) => <li key={release.date + ":" + release.buildId}><time dateTime={release.date}>{release.date}</time><code>{release.buildId}</code></li>)}</ul>}
      <p className={styles.note}>These dates mark the first analytics report received by a server build, not its deployment time. Frontend-only releases are not included. A nearby traffic change does not establish that a release caused it.</p>
    </Surface>
  </div>;
}