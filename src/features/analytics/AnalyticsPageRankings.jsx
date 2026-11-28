import { BarChart3 } from "lucide-react";
import { Surface, TableScroll } from "../../components/HundoUi.jsx";
import { ANALYTICS_PRODUCTS } from "./analyticsContracts.js";
import { ANALYTICS_EXCLUDED_PAGES, ANALYTICS_PAGE_CATALOG } from "./analyticsPageCatalog.js";
import { availableUsageStart } from "./analyticsPeriods.js";
import styles from "./AdminAnalyticsPage.module.css";
const number = new Intl.NumberFormat("en-CA");
const decimal = new Intl.NumberFormat("en-CA", {maximumFractionDigits:1});
export function AnalyticsPageRankings({ data }) {
  const detail = data.pageDetail;
  const primary = availableUsageStart(data);
  const primaryMeasured = primary !== null && primary <= data.period.endDate && data.measurement.coverage !== "not_started";
  const rows = ANALYTICS_PAGE_CATALOG.map(entry => {
    const values = (detail?.rows || data.pages).find(row => row.product === entry.product && row.category === entry.category);
    const measured = primaryMeasured && (entry.kind !== "refined" || detail?.coverage === "full" || detail?.coverage === "partial");
    return { ...entry, pageViews:values?.pageViews || 0, activeSeconds:values?.activeSeconds || 0, measured };
  }).filter(row => row.kind !== "legacy" || row.pageViews > 0 || row.activeSeconds > 0)
    .sort((a,b) => Number(b.measured) - Number(a.measured) || b.pageViews - a.pageViews || b.activeSeconds - a.activeSeconds || a.label.localeCompare(b.label));
  return <Surface className={styles.panel} aria-labelledby="analytics-sections">
    <div className={styles.panelHeading}><div><p className={styles.eyebrow}>ALL SITE PAGES</p><h2 id="analytics-sections">What gets viewed</h2></div><BarChart3 aria-hidden="true" /></div>
    <p className={styles.note}>Page types ranked by views. Each mini game has its own row; different leagues, players and rooms share their page type.</p>
    <div className={styles.pageRankingScroll}><TableScroll label="Usage by site section"><table className={styles.table}>
      <thead><tr><th scope="col">Page</th><th scope="col">Page views</th><th scope="col">Share of views</th><th scope="col">Active minutes (est.)</th><th scope="col">Minutes / page view</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.product+":"+row.category} data-page-type={row.category}>
        <th scope="row">{row.label}<small>{ANALYTICS_PRODUCTS[row.product]}{!row.measured ? " · Not measured" : ""}</small></th>
        <td>{row.measured ? number.format(row.pageViews) : "—"}</td>
        <td>{row.measured && data.totals.pageViews ? decimal.format(row.pageViews / data.totals.pageViews * 100) + "%" : "—"}</td>
        <td>{row.measured ? decimal.format(row.activeSeconds / 60) : "—"}</td>
        <td>{row.measured && row.pageViews ? decimal.format(row.activeSeconds / 60 / row.pageViews) : "—"}</td>
      </tr>)}</tbody>
    </table></TableScroll></div>
    <p className={styles.note}>{!detail?.startedOn ? "Separate page and mini-game counts begin after the first report using the new page categories." : detail.coverage === "not_started" ? "Separate page and mini-game counts are unavailable for this period." : "Separate page and mini-game counts are available from " + detail.availableFrom + "; the first collection day is partial."} Older combined totals stay in their labelled rows and are not reassigned.</p>
    <details className={styles.dailyDetails}><summary>Pages excluded from usage collection</summary><p className={styles.note}>{ANALYTICS_EXCLUDED_PAGES.join(" · ")}. These pages are not reported as zero views. No page addresses, account identities or search terms are collected.</p></details>
  </Surface>;
}
