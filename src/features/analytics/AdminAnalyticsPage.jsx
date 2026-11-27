import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BarChart3, Clock3, Download, Eye, Users, UserPlus } from "lucide-react";

import { routePaths } from "../../app/routePaths.js";
import { EmptyBlock, ErrorBlock, LoadingBlock, PageHeading, Surface, TableScroll } from "../../components/HundoUi.jsx";
import { useSession } from "../session/sessionContext.js";
import { ANALYTICS_CATEGORIES, ANALYTICS_PRODUCTS, analyticsMetric } from "./analyticsContracts.js";
import { adminAnalyticsQuery } from "./analyticsQueries.js";
import styles from "./AdminAnalyticsPage.module.css";
import { ActionHealth, ExpandedCoverage, FeatureUsage, Freshness, Gameplay, HockeyContext, InstallationUsage, PeakUsage, WebVitals } from "./AnalyticsExpandedPanels.jsx";

const integer = new Intl.NumberFormat("en-CA");
const decimal = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 1 });
function shortDate(value) {
  return new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value + "T12:00:00Z"));
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
  if (!data.measurement.startedOn || data.measurement.startedOn >= data.period.previousStartDate) return "Comparison available after a full earlier period is measured.";
  const before = data.previousTotals.pageViews;
  if (!before) return data.totals.pageViews ? "Earlier period had no recorded page views." : "No recorded page views in either period.";
  const change = (data.totals.pageViews - before) / before * 100;
  return `${change > 0 ? "+" : ""}${decimal.format(change)}% vs. the previous ${data.period.days} days; today is partial.`;
}

function DailyTrend({ data }) {
  const maximum = Math.max(1, ...data.daily.map((row) => row.pageViews));
  return <Surface className={styles.panel} aria-labelledby="analytics-trend">
    <div className={styles.panelHeading}><div><p className={styles.eyebrow}>TRAFFIC OVER TIME</p><h2 id="analytics-trend">Daily page views</h2></div><span className={styles.badge}>Today is partial</span></div>
    <div className={styles.chart} role="img" aria-label={`Daily page views from ${data.period.startDate} to ${data.period.endDate}. Exact daily values are available in the table below.`}>
      {data.daily.map((row) => <div className={styles.barColumn} key={row.date} title={`${row.date}: ${row.date < data.measurement.startedOn ? "not measured" : integer.format(row.pageViews) + " page views" + (row.date === data.measurement.startedOn ? " (partial first day)" : "")}`}>
        <span className={styles.bar} style={{ height: `${row.pageViews / maximum * 100}%`, minHeight: row.pageViews ? "3px" : "0" }} />
      </div>)}
    </div>
    <div className={styles.chartAxis}><span>{shortDate(data.period.startDate)}</span><span>{shortDate(data.period.endDate)}</span></div>
    <p className={styles.note}>{comparison(data)}</p>
    <details className={styles.dailyDetails}>
      <summary>View daily totals</summary>
      <TableScroll label="Daily analytics totals"><table className={styles.table}><thead><tr><th scope="col">Date · UTC−8</th><th scope="col">Page views</th><th scope="col">Active minutes (est.)</th></tr></thead>
        <tbody>{data.daily.map((row) => <tr key={row.date}><th scope="row">{row.date}{row.date < data.measurement.startedOn ? <small>Not measured</small> : row.date === data.measurement.startedOn ? <small>Partial first day</small> : null}</th><td>{row.date < data.measurement.startedOn ? "—" : integer.format(row.pageViews)}</td><td>{row.date < data.measurement.startedOn ? "—" : minutes(row.activeSeconds)}</td></tr>)}</tbody>
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
  const unmeasured = data.measurement.coverage === "not_started";
  const pages = [...data.pages].sort((a, b) => b.pageViews - a.pageViews || b.activeSeconds - a.activeSeconds);
  const sections = [["overview", "Overview"], ["gameplay", "Gameplay"], ["experience", "Experience"], ["context", "Timing & context"]];
  return <>
    <div className={styles.periodMeta}><span>{shortDate(data.period.startDate)} – {shortDate(data.period.endDate)} · daily totals in UTC−8</span><span className={styles.badge}>Aggregate only</span></div>
    <nav className={styles.sectionNav} aria-label="Analytics sections">{sections.map(([key, label]) => <button type="button" key={key} aria-pressed={section === key} onClick={() => onSectionChange(key)}>{label}</button>)}</nav>
    <div className={styles.sectionBody} role="region" aria-label={sections.find(([key]) => key === section)[1] + " analytics"}>
    {section === "overview" && <>
      {unmeasured ? <Surface className={styles.coverage}><EmptyBlock title="Activity measurement has not started">Account totals are available. Page views and active time will appear after the first eligible page is used; earlier activity cannot be reconstructed.</EmptyBlock></Surface> :
        data.measurement.coverage === "partial" ? <p className={styles.coverage} role="status">Partial measurement: usage totals begin on {data.measurement.startedOn}. The first day is partial; earlier days in this range were not measured.</p> : null}
      <div className={styles.metrics}>
        <Metric icon={Eye} label="Page views" value={unmeasured ? "—" : integer.format(data.totals.pageViews)} detail="Page openings, not unique people or visits" />
        <Metric icon={Clock3} label="Active minutes · estimated" value={unmeasured ? "—" : minutes(data.totals.activeSeconds)} detail="Visible, recently used pages across the site" />
        <Metric icon={Clock3} label="Minutes per page view" value={data.totals.pageViews ? decimal.format(data.totals.activeSeconds / 60 / data.totals.pageViews) : "—"} detail="Aggregate active time divided by page views" />
        <Metric icon={Users} label="Registered accounts" value={integer.format(data.accounts.total)} detail="All account statuses; separate from usage" />
        <Metric icon={UserPlus} label="New accounts" value={integer.format(data.accounts.createdInPeriod)} detail={`Created in the selected ${data.period.days}-day period`} />
        <Metric icon={Download} label="Reported installations" value={data.measurement.expandedCoverage === "not_started" ? "—" : integer.format(analyticsMetric(data, "install.reported"))} detail="Browser install reports, not unique installs" />
      </div>
      {!unmeasured && <>
        <div className={styles.mainGrid}><DailyTrend data={data} /><ProductSplit data={data} /></div>
        <Surface className={styles.panel} aria-labelledby="analytics-sections">
          <div className={styles.panelHeading}><div><p className={styles.eyebrow}>POPULAR SECTIONS</p><h2 id="analytics-sections">What gets opened</h2></div><BarChart3 aria-hidden="true" /></div>
          {!pages.length ? <EmptyBlock title="No activity recorded in this period">Choose a different date range to see earlier measured activity.</EmptyBlock> :
            <TableScroll label="Usage by site section"><table className={styles.table}>
              <thead><tr><th scope="col">Section</th><th scope="col">Page views</th><th scope="col">Share of views</th><th scope="col">Active minutes (est.)</th><th scope="col">Minutes / page view</th></tr></thead>
              <tbody>{pages.map((row) => <tr key={row.product + ":" + row.category}><th scope="row">{ANALYTICS_CATEGORIES[row.product][row.category]}<small>{ANALYTICS_PRODUCTS[row.product]}</small></th><td>{integer.format(row.pageViews)}</td><td>{percentage(row.pageViews, data.totals.pageViews)}</td><td>{minutes(row.activeSeconds)}</td><td>{row.pageViews ? decimal.format(row.activeSeconds / 60 / row.pageViews) : "—"}</td></tr>)}</tbody>
            </table></TableScroll>}
        </Surface>
      </>}
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
  const [section, setSection] = useState("overview");
  const query = useQuery({ ...adminAnalyticsQuery(session.httpClient, days), enabled: session.status === "authenticated" });
  const denied = query.error?.status === 403 || query.error?.code === "PLATFORM_ADMINISTRATOR_REQUIRED";
  return <main className={`hl-page ${styles.page}`} aria-labelledby="analytics-title">
    <PageHeading eyebrow="ADMIN" title="Site analytics" id="analytics-title" description="A clear view of how Hundo Leago and Hundo Daily are used." />
    {session.status === "unknown" ? session.bootstrapError ? <ErrorBlock error={session.bootstrapError} fallback="Your session could not be verified." /> : <LoadingBlock>Checking secure session…</LoadingBlock> :
      session.status !== "authenticated" ? <Surface><EmptyBlock title="Sign in to continue"><Link to={routePaths.home}>Sign in with your administrator account</Link></EmptyBlock></Surface> :
      denied ? <Surface><EmptyBlock title="Administrator access required">Site analytics is available only to platform administrators.</EmptyBlock></Surface> :
      <>
        <div className={styles.toolbar}>
          <div className={styles.range} role="group" aria-label="Analytics date range">{[7, 28, 90].map((value) => <button type="button" key={value} aria-pressed={days === value} onClick={() => setDays(value)}>Last {value} days</button>)}</div>
          <button type="button" className={styles.refresh} onClick={() => query.refetch()} disabled={query.isFetching}>{query.isFetching ? "Loading…" : "Refresh totals"}</button>
        </div>
        {query.isPending ? <Surface><LoadingBlock>Loading aggregate analytics…</LoadingBlock></Surface> :
          query.isError ? <Surface><ErrorBlock error={query.error} fallback="Analytics could not be loaded." impact="Usage totals are unavailable, rather than zero." recovery="Try Refresh totals in a moment." /></Surface> :
          <AnalyticsResults data={query.data} asOfMs={query.dataUpdatedAt} section={section} onSectionChange={setSection} />}
      </>}
  </main>;
}