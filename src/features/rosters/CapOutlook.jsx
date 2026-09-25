import { ArrowDown, ArrowUp } from "lucide-react";
import { PositionTag, TableScroll } from "../../components/HundoUi.jsx";
import { teamColourStyle } from "../../shared/teamIdentity.js";
import styles from "./CapOutlook.module.css";

const GROUPS = [
  ["Forwards", "Forwards", "forwardCents"],
  ["Defence", "Defence", "defenceCents"],
  ["Retained salary", "Retained salary", "retainedSalaryCents"],
  ["Buyouts", "Buyouts", "buyoutPenaltyCents"],
  ["Bench", "Bench · cap-exempt", "benchCents"],
  ["Injured Reserve", "Injured reserve · cap-exempt", "injuredReserveCents"],
  ["Prospect", "Prospects · cap-exempt", "prospectCents"],
];

function money(cents) {
  if (cents === null) return "—";
  return `${cents < 0 ? "−" : ""}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

export function CapOutlook({ workspace, pending, onAction }) {
  const { capOutlook, players, canManage } = workspace;
  if (!capOutlook) {
    return <section className="hl-surface"><h2>Cap outlook</h2><p>Season-by-season cap information is not available yet.</p></section>;
  }
  const { seasons, rows } = capOutlook;
  const playerById = new Map(players.map((player) => [player.ownershipId, player]));
  function totalRow(label, field, className = styles.subtotal) {
    return (
      <tr className={className}>
        <th scope="row">{label}</th>
        {seasons.map((season) => <td key={season.key}>
          {season.complete ? money(season[field]) : "Unavailable"}
          {field === "spaceCents" && season.complete && season.spaceCents < 0 && <small className={styles.overCap}>Over cap</small>}
        </td>)}
      </tr>
    );
  }
  function group([category, title, field]) {
    const entries = rows.filter((row) => row.category === category);
    return <tbody key={category}>
      <tr className={styles.group}><th scope="rowgroup" colSpan={4}><span>{title}</span></th></tr>
      {entries.length === 0 ? <tr><td colSpan={4} className={styles.empty}>None</td></tr> : entries.map((row) => {
        const player = playerById.get(row.ownershipId);
        const moveType = player?.rosterCategory === "Active" ? "bench" : "active";
        const movable = canManage && ["Active", "Bench"].includes(player?.rosterCategory);
        return <tr key={row.id} className={styles.dataRow}>
          <th scope="row">
            <div className={styles.player}>
              <div>
                <span className={styles.name}>{player && <PositionTag position={player.normalizedPosition} />}{row.name}</span>
                {player && !player.contract && <small>Unsigned</small>}
                {player?.contract?.retainedAavCents > 0 && <small>After salary retained by another team</small>}
              </div>
              {movable && <button type="button" className={styles.move} disabled={pending}
                onClick={() => onAction(moveType, player)}
                aria-label={`Move ${row.name} to ${moveType === "bench" ? "bench" : "active"}`}>
                {moveType === "bench" ? <ArrowDown aria-hidden="true" /> : <ArrowUp aria-hidden="true" />}
                {moveType === "bench" ? "Bench" : "Activate"}
              </button>}
            </div>
          </th>
          {seasons.map((season, index) => <td key={season.key} className={row.amountsCents[index] === null ? styles.expired : undefined}>{money(row.amountsCents[index])}</td>)}
        </tr>;
      })}
      {totalRow(`${category === "Prospect" ? "Prospects" : category} total`, field)}
    </tbody>;
  }
  return (
    <section className={`hl-surface ${styles.outlook}`} style={teamColourStyle(workspace.team)} aria-labelledby="cap-outlook-title">
      <header className={styles.header}>
        <div className={styles.heading}><span className={styles.teamStripe} aria-hidden="true" /><div><p className={styles.teamName}>{workspace.team.name}</p><h2 id="cap-outlook-title">Cap outlook</h2></div></div>
        <span className={styles.badge}>3 seasons</span>
      </header>
      <p className={styles.note} id="cap-outlook-assumptions">Saved commitments with today’s roster assignments and cap limit. Future seasons exclude new signings and roster changes.</p>
      {!seasons.every((season) => season.complete) && <p role="alert">Some cap information is incomplete. Available cap totals are hidden until it can be verified.</p>}
      <TableScroll label="Cap outlook by season" className={styles.scroll}>
        <table className={styles.table} aria-describedby="cap-outlook-assumptions">
          <thead><tr><th scope="col">Player / commitment</th>{seasons.map((season) => <th scope="col" key={season.key}>{season.label}<small>{season.offset === 0 ? "Current season" : season.offset === 1 ? "Next season" : "In two seasons"}</small></th>)}</tr></thead>
          {GROUPS.slice(0, 4).map(group)}
          <tbody className={styles.summary}>
            {totalRow("Total cap used", "usageCents")}
            {totalRow("Salary cap", "limitCents")}
            {totalRow("Cap space", "spaceCents", styles.capSpace)}
          </tbody>
          {GROUPS.slice(4).map(group)}
        </table>
      </TableScroll>
      <p className={styles.note}>Bench, injured reserve, and prospects are shown for planning and do not count against the cap. Player amounts are after retained salary. A dash means no saved commitment for that season.</p>
    </section>
  );
}
