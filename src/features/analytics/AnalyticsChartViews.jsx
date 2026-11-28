import { useState } from "react";
import styles from "./AdminAnalyticsPage.module.css";
const number = new Intl.NumberFormat("en-CA");
const text = value => value === null ? "Unavailable" : number.format(value);
const series = [["completedTrades", "Trades"], ["resolvedAuctions", "Auctions"], ["rosterChanges", "Roster changes"], ["dailyDrafts", "Daily draft windows"]];
export function ChartViewToggle({ label, split, onChange }) {
  return <div className={styles.chartViewToggle} role="group" aria-label={label}>
    <button type="button" aria-pressed={!split} onClick={() => onChange(false)}>Combined</button>
    <button type="button" aria-pressed={split} onClick={() => onChange(true)}>Leago / Daily</button>
  </div>;
}
export function WeeklyGameplayChart({ rows }) {
  const [split, setSplit] = useState(false);
  if (!rows.length) return null;
  const total = row => series.reduce((sum, [key]) => sum + (row[key] || 0), 0);
  const leago = row => row.completedTrades + row.resolvedAuctions + row.rosterChanges;
  const maximum = Math.max(1, ...rows.map(row => split ? Math.max(leago(row), row.dailyDrafts || 0) : total(row)));
  return <div className={styles.weeklyVisual}>
    <ChartViewToggle label="Weekly gameplay chart view" split={split} onChange={setSplit} />
    <div className={styles.weeklyLegend}>{(split ? [["leago", "Hundo Leago"], ["daily", "Hundo Daily"]] : series).map(([key, label]) => <span key={key}><i data-series={key} aria-hidden="true" />{label}</span>)}</div>
    <div className={styles.weeklyChart} role="img" aria-label={split ? "Weekly gameplay totals shown separately for Hundo Leago and Hundo Daily. Exact values are in the tables below." : "Weekly activity totals stacked by trades, auctions, roster changes and Daily draft windows. Exact values are in the table below."}>
      {rows.map(row => split ? <div className={styles.productBarGroup} key={row.weekStartDate}>
        {[["leago", leago(row), "Hundo Leago"], ["daily", row.dailyDrafts, "Hundo Daily"]].map(([key, value, label]) => <div className={styles.productBarColumn} key={key} title={row.weekStartDate + ": " + label + " " + text(value)}>
          <span className={styles.productBarTotal}>{value === null ? "—" : number.format(value)}</span><span className={styles.productBar} data-series={key} style={{height: value === null ? "0%" : value / maximum * 100 + "%"}} />
        </div>)}
      </div> : <div className={styles.weeklyColumn} key={row.weekStartDate} title={row.weekStartDate + ": " + series.map(([key, label]) => text(row[key]) + " " + label.toLowerCase()).join(", ")}>
        <span className={styles.weeklyTotal}>{number.format(total(row))}</span>
        <div className={styles.weeklyStack} style={{ height: total(row) / maximum * 100 + "%" }}>{series.map(([key]) => <span data-series={key} key={key} style={{ height: total(row) ? (row[key] || 0) / total(row) * 100 + "%" : "0" }} />)}</div>
      </div>)}
    </div>
    <div className={styles.chartAxis}><span>Week of {rows[0].weekStartDate}</span><span>Week of {rows.at(-1).weekStartDate}</span></div>
    <p className={styles.note}>{split ? "Leago combines trades, auctions and roster changes; Daily counts draft windows ended. These are different activity types, not players or visits." : "Stack heights combine the available activity types."} Unavailable Daily counts are omitted from the bars and remain marked in the table.</p>
    {split && <table className={styles.productTotalsTable} aria-label="Weekly gameplay by product"><thead><tr><th scope="col">Week</th><th scope="col">Hundo Leago</th><th scope="col">Hundo Daily</th></tr></thead><tbody>{rows.map(row => <tr key={row.weekStartDate}><th scope="row">{row.weekStartDate}</th><td>{number.format(leago(row))}</td><td>{text(row.dailyDrafts)}</td></tr>)}</tbody></table>}
  </div>;
}

export function TrafficProductChart({ rows, measured }) {
  const maximum = Math.max(1, ...rows.flatMap(row => measured(row) ? row.products.map(product => product.pageViews) : []));
  return <><div className={styles.trafficLegend}>{[["leago","Hundo Leago"],["daily","Hundo Daily"],["shared","Shared pages"]].map(([key,label]) => <span key={key}><i data-series={key} aria-hidden="true" />{label}</span>)}</div>
    <div className={styles.trafficSplit} role="img" aria-label="Daily page views split between Hundo Leago, Hundo Daily and shared pages. Exact values are in the daily totals table.">
      {rows.map(row => <div className={styles.productBarGroup} key={row.date} title={row.date + ": " + (measured(row) ? row.products.map(product => product.product + " " + number.format(product.pageViews)).join(", ") : "Not measured")}>
        {row.products.map(product => <div className={styles.productBarColumn} key={product.product}><span className={styles.productBar} data-series={product.product} style={{height:(measured(row) ? product.pageViews / maximum * 100 : 0) + "%"}} /></div>)}
      </div>)}
    </div><p className={styles.note}>Leago and Daily use the same scale. Shared pages, including the mini games, are shown separately.</p></>;
}
