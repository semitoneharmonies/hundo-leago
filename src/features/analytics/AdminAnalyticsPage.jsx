import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Clock3, Download, Eye, Users, UserPlus } from "lucide-react";

import { routePaths } from "../../app/routePaths.js";
import { EmptyBlock, ErrorBlock, LoadingBlock, PageHeading, Surface, TableScroll } from "../../components/HundoUi.jsx";
import { useSession } from "../session/sessionContext.js";
import { ANALYTICS_PRODUCTS, analyticsMetric } from "./analyticsContracts.js";
import { adminAnalyticsQuery } from "./analyticsQueries.js";
import { AccountDirectory } from "./AccountDirectory.jsx";
import { AnalyticsPageRankings } from "./AnalyticsPageRankings.jsx";
import { ChartViewToggle, TrafficProductChart } from "./AnalyticsChartViews.jsx";
import { availableUsageStart, calendarPeriod, currentAnalyticsDate, mondayOf, normalizeAnalyticsSelection } from "./analyticsPeriods.js";
import styles from "./AdminAnalyticsPage.module.css";
import { ActionHealth, ExpandedCoverage, FeatureUsage, Freshness, Gameplay, HockeyContext, InstallationUsage, PeakUsage, WebVitals } from "./AnalyticsExpandedPanels.jsx";

const integer = new Intl.NumberFormat("en-CA");
const decimal = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 1 });
function shortDate(value) {
  return new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value + "T12:00:00Z"));
}
function usableStart(data, expanded = false) {
  const start = availableUsageStart(data, expanded);
  return !start || start > data.period.endDate || data.measurement[expanded ? "expandedCoverage" : "coverage"] === "not_started" ? null : start;
}
function fullDate(value) {
  return new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value + "T12:00:00Z"));
}
function calendarKind(data) { return ["week", "month"].includes(data.period.kind) ? data.period.kind : null; }
function includesToday(data) { return !calendarKind(data) || data.period.endDate === data.period.today; }
function periodLabel(data) {
  const kind = calendarKind(data);
  if (kind === "month") {
    const month = new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(data.period.startDate + "T12:00:00Z"));
    return month + (includesToday(data) ? " · Month to date through " + fullDate(data.period.endDate) : "");
  }
  if (kind === "week") return "Week of " + fullDate(data.period.startDate) + " – " + fullDate(data.period.calendarEndDate) + (includesToday(data) ? " · Week to date through " + fullDate(data.period.endDate) : "");
  return fullDate(data.period.startDate) + " – " + fullDate(data.period.endDate);
}
function selectedInput(mode, days, week, month, today) {
  try {
    if (mode === "days") return normalizeAnalyticsSelection(days);
    const value = mode === "week" ? week : month;
    if (!value || (mode === "week" ? value > today : value > today.slice(0, 7))) return null;
    const normalized = normalizeAnalyticsSelection({ kind: mode, value: mode === "week" ? mondayOf(value) : value });
    calendarPeriod(mode, normalized.value, today);
    return normalized;
  } catch { return null; }
}
function Coverage({ data }) {
  const start = usableStart(data);
  const measured = data.measurement.startedOn;
  if (!start) return <Surface className={styles.coverage}>
    <EmptyBlock title={!measured ? "Activity measurement has not started" : measured > data.period.endDate ? "Activity was not measured in this period" : "Activity is outside retained history"}>
      {!measured ? "Account totals are available. Page views and active time will appear after the first eligible page is used; earlier activity cannot be reconstructed." :
        measured > data.period.endDate ? `Collection began on ${measured}, after this period. Earlier activity cannot be reconstructed; account registration totals are still available.` :
          `Activity history is retained for ${data.measurement.retentionDays} days. Available history begins on ${data.measurement.retainedFrom}; account registration totals are still available.`}
    </EmptyBlock>
  </Surface>;
  if (data.measurement.coverage === "partial" || start > data.period.startDate) return <p className={styles.coverage} role="status">Partial measurement: usage totals begin on {start}. {start === measured ? "The first day is partial; earlier days in this range were not measured." : "Earlier days in this range are outside retained activity history."}</p>;
  return null;
}

function minutes(seconds) { return decimal.format(seconds / 60); }
function percentage(value, total) { return total ? decimal.format(value * 100 / total) + "%" : "—"; }

function Metric({ icon, label, value, detail }) {
  const Icon = icon;
  return <div className={styles.metric}>
    <div className={styles.metricLabel}><span>{label}</span><Icon aria-hidden="true" /></div>
    <strong>{value}</strong><span className={styles.metricDetail}>{detail}</span>
  </div>;
}

function comparison(data) {
  const kind = calendarKind(data);
  if (kind && includesToday(data)) return `Comparison available after this calendar ${kind} is complete and both periods are fully measured.`;
  const start = data.measurement.startedOn;
  const available = data.measurement.availableFrom || start;
  if (!start || start >= data.period.previousStartDate || available > data.period.previousStartDate ||
    (data.measurement.retainedFrom && data.measurement.retainedFrom > data.period.previousStartDate) || data.measurement.coverage !== "full") {
    return kind ? "Comparison unavailable: both calendar periods must be fully measured and retained." : "Comparison available after a full earlier period is measured.";
  }
  const before = data.previousTotals.pageViews;
  if (!before) return data.totals.pageViews ? "Earlier period had no recorded page views." : "No recorded page views in either period.";
  const change = (data.totals.pageViews - before) / before * 100;
  return `${change > 0 ? "+" : ""}${decimal.format(change)}% vs. the previous ${kind ? "calendar " + kind : data.period.days + " days"}${kind === "month" ? "; total page views, with different month lengths." : kind ? "; total page views." : "; today is partial."}`;
}

function DailyTrend({ data }) {
  const [split, setSplit] = useState(false);
  const separated = split && data.pageDetail;
  const start = usableStart(data);
  const measured = row => start !== null && row.date >= start;
  const label = row => !measured(row) ? data.measurement.retainedFrom && row.date < data.measurement.retainedFrom && row.date >= data.measurement.startedOn ? "Not retained" : "Not measured" : row.date === data.measurement.startedOn ? "Partial first day" : null;
  const maximum = Math.max(1, ...data.daily.filter(measured).map(row => row.pageViews));
  return <Surface className={styles.panel} aria-labelledby="analytics-trend">
    <div className={styles.panelHeading}><div><p className={styles.eyebrow}>TRAFFIC OVER TIME</p><h2 id="analytics-trend">Daily page views</h2></div><span className={styles.badge}>{includesToday(data) ? "Today is partial" : "Historical period"}</span></div>
    {data.pageDetail && <ChartViewToggle label="Traffic chart view" split={split} onChange={setSplit} />}
    {separated ? <TrafficProductChart rows={data.pageDetail.dailyProducts} measured={measured} /> : <div className={styles.chart} role="img" aria-label={`Daily page views from ${data.period.startDate} to ${data.period.endDate}. Exact daily values are available in the table below.`}>
      {data.daily.map(row => <div className={styles.barColumn} key={row.date} title={`${row.date}: ${!measured(row) ? label(row).toLowerCase() : integer.format(row.pageViews) + " page views" + (label(row) ? " (" + label(row).toLowerCase() + ")" : "")}`}>
        <span className={styles.bar} style={{ height: `${measured(row) ? row.pageViews / maximum * 100 : 0}%`, minHeight: measured(row) && row.pageViews ? "3px" : "0" }} />
      </div>)}
    </div>}
    <div className={styles.chartAxis}><span>{shortDate(data.period.startDate)}</span><span>{shortDate(data.period.endDate)}</span></div>
    <p className={styles.note}>{comparison(data)}</p>
    <details className={styles.dailyDetails}>
      <summary>View daily totals</summary>
      <TableScroll label="Daily analytics totals"><table className={styles.table}><thead><tr><th scope="col">Date · UTC−8</th><th scope="col">Page views</th><th scope="col">Active minutes (est.)</th>{separated && ["Leago views","Daily views","Shared views"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
        <tbody>{data.daily.map(row => <tr key={row.date}><th scope="row">{row.date}{label(row) && <small> {label(row)}</small>}</th><td>{measured(row) ? integer.format(row.pageViews) : "—"}</td><td>{measured(row) ? minutes(row.activeSeconds) : "—"}</td>{separated && ["leago","daily","shared"].map(product => <td key={product}>{measured(row) ? integer.format(data.pageDetail.dailyProducts.find(day => day.date === row.date).products.find(item => item.product === product).pageViews) : "—"}</td>)}</tr>)}</tbody>
      </table></TableScroll>
    </details>
  </Surface>;
}

function ProductSplit({ data }) {
  return <Surface className={styles.panel} aria-labelledby="analytics-products">
    <div className={styles.panelHeading}><div><p className={styles.eyebrow}>WHERE THE SITE IS USED</p><h2 id="analytics-products">Leago & Daily</h2></div></div>
    <div className={styles.productList}>{data.products.map((row) => <div className={styles.product} data-product={row.product} key={row.product}>
      <div className={styles.productTitle}><h3>{ANALYTICS_PRODUCTS[row.product]}</h3><strong>{percentage(row.pageViews, data.totals.pageViews)}</strong></div>
      <div className={styles.shareTrack} aria-hidden="true"><span style={{ width: `${data.totals.pageViews ? row.pageViews * 100 / data.totals.pageViews : 0}%` }} /></div>
      <div className={styles.productStats}><span><b>{integer.format(row.pageViews)}</b> page views</span><span><b>{minutes(row.activeSeconds)}</b> active min <small>({percentage(row.activeSeconds, data.totals.activeSeconds)} of time)</small></span></div>
    </div>)}</div>
    <p className={styles.note}>Shared pages include account settings, league selection, and mini games.</p>
  </Surface>;
}

function AnalyticsResults({ data, section, onSectionChange, asOfMs }) {
  const unmeasured = usableStart(data) === null;
  const sections = [["overview", "Overview"], ["gameplay", "Gameplay"], ["experience", "Experience"], ["context", "Timing & context"]];
  return <>
    <div className={styles.periodMeta}><span>{periodLabel(data)} · daily totals in UTC−8</span><span className={styles.badge}>Aggregate activity</span></div>
    <nav className={styles.sectionNav} aria-label="Analytics sections">{sections.map(([key, label]) => <button type="button" key={key} aria-pressed={section === key} onClick={() => onSectionChange(key)}>{label}</button>)}</nav>
    <div className={styles.sectionBody} role="region" aria-label={sections.find(([key]) => key === section)[1] + " analytics"}>
    {section === "overview" && <>
      <Coverage data={data} />
      <div className={styles.metrics}>
        <Metric icon={Eye} label="Page views" value={unmeasured ? "—" : integer.format(data.totals.pageViews)} detail="Page openings, not unique people or visits" />
        <Metric icon={Clock3} label="Active minutes · estimated" value={unmeasured ? "—" : minutes(data.totals.activeSeconds)} detail="Visible, recently used pages across the site" />
        <Metric icon={Clock3} label="Minutes per page view" value={!unmeasured && data.totals.pageViews ? decimal.format(data.totals.activeSeconds / 60 / data.totals.pageViews) : "—"} detail="Aggregate active time divided by page views" />
        <Metric icon={Users} label="Registered accounts" value={integer.format(data.accounts.total)} detail="All account statuses; separate from usage" />
        <Metric icon={UserPlus} label="New accounts" value={integer.format(data.accounts.createdInPeriod)} detail={calendarKind(data) ? `Created in the selected calendar ${calendarKind(data)}${includesToday(data) ? " to date" : ""}` : `Created in the selected ${data.period.days}-day period`} />
        <Metric icon={Download} label="Reported installations" value={usableStart(data, true) === null ? "—" : integer.format(analyticsMetric(data, "install.reported"))} detail="Browser install reports, not unique installs" />
      </div>
      <AccountDirectory />
      {!unmeasured && <>
        <div className={styles.mainGrid}><DailyTrend data={data} /><ProductSplit data={data} /></div>

      </>}
      <AnalyticsPageRankings data={data} />
      <div className={styles.sectionGap}><ExpandedCoverage data={data} /><FeatureUsage data={data} /></div>
    </>}
    {section === "gameplay" && <Gameplay data={data} />}
    {section === "experience" && <div className={styles.panelStack}><ExpandedCoverage data={data} /><InstallationUsage data={data} /><div className={styles.mainGrid}><ActionHealth data={data} /><WebVitals data={data} /></div><Freshness data={data} asOfMs={asOfMs} /></div>}
    {section === "context" && <div className={styles.panelStack}><ExpandedCoverage data={data} /><PeakUsage data={data} /><HockeyContext data={data} /></div>}
    </div>
    <p className={styles.methodNote}>These totals describe site usage, with no individual activity profiles. Active time pauses on hidden or idle pages; multiple tabs, blocked requests, and interrupted connections can affect the estimates. Admin pages are excluded. Daily totals form a rolling {data.measurement.retentionDays}-day history; older totals are removed as new activity arrives.</p>
  </>;
}
export function AdminAnalyticsPage() {
  const session = useSession();
  const [days, setDays] = useState(28);
  const [mode, setMode] = useState("days");
  const [week, setWeek] = useState(() => currentAnalyticsDate());
  const [month, setMonth] = useState(() => currentAnalyticsDate().slice(0, 7));
  const today = currentAnalyticsDate();
  const selection = selectedInput(mode, days, week, month, today);
  const [section, setSection] = useState("overview");
  const query = useQuery({ ...adminAnalyticsQuery(session.httpClient, selection || 28, { detail: true }), enabled: session.status === "authenticated" && selection !== null });
  const denied = query.error?.status === 403 || query.error?.code === "PLATFORM_ADMINISTRATOR_REQUIRED";
  return <main className={`hl-page ${styles.page}`} aria-labelledby="analytics-title">
    <PageHeading eyebrow="ADMIN" title="Site analytics" id="analytics-title" description="A clear view of how Hundo Leago and Hundo Daily are used." />
    {session.status === "unknown" ? session.bootstrapError ? <ErrorBlock error={session.bootstrapError} fallback="Your session could not be verified." /> : <LoadingBlock>Checking secure session…</LoadingBlock> :
      session.status !== "authenticated" ? <Surface><EmptyBlock title="Sign in to continue"><Link to={routePaths.home}>Sign in with your administrator account</Link></EmptyBlock></Surface> :
      denied ? <Surface><EmptyBlock title="Administrator access required">Site analytics is available only to platform administrators.</EmptyBlock></Surface> :
      <>
        <div className={styles.toolbar}>
          <div className={styles.filterControls}>
            <div className={styles.periodModes} role="group" aria-label="Analytics period type">{[["days", "Recent days"], ["week", "Calendar week"], ["month", "Calendar month"]].map(([value, label]) => <button type="button" key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>{label}</button>)}</div>
            {mode === "days" ? <div className={styles.range} role="group" aria-label="Analytics date range">{[7, 28, 90].map(value => <button type="button" key={value} aria-pressed={days === value} onClick={() => setDays(value)}>Last {value} days</button>)}</div> :
              <div className={styles.calendarInput}>
                <label htmlFor="analytics-calendar-selection">{mode === "week" ? "Week containing" : "Month"}</label>
                <input id="analytics-calendar-selection" type={mode === "week" ? "date" : "month"} value={mode === "week" ? week : month} max={mode === "week" ? today : today.slice(0, 7)}
                  aria-describedby="analytics-calendar-help" onChange={event => mode === "week" ? setWeek(event.target.value) : setMonth(event.target.value)} />
                <small id="analytics-calendar-help">{mode === "week" ? "Monday–Sunday · UTC−8" : "Full calendar month · UTC−8"}</small>
              </div>}
          </div>
          <button type="button" className={styles.refresh} onClick={() => query.refetch()} disabled={!selection || query.isFetching}>{query.isFetching ? "Loading…" : "Refresh totals"}</button>
        </div>
        {!selection ? <Surface><EmptyBlock title="Choose a valid calendar period">Select a date no later than today to load its calendar {mode}.</EmptyBlock></Surface> : query.isPending ? <Surface><LoadingBlock>Loading aggregate analytics…</LoadingBlock></Surface> :
          query.isError ? <Surface><ErrorBlock error={query.error} fallback="Analytics could not be loaded." impact="Usage totals are unavailable, rather than zero." recovery="Try Refresh totals in a moment." /></Surface> :
          <AnalyticsResults data={query.data} asOfMs={query.dataUpdatedAt} section={section} onSectionChange={setSection} />}
      </>}
  </main>;
}