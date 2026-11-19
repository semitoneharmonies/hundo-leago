import { SCORING_CATEGORIES } from "../../shared/scoringCategories.js";
import { salaryText, scoreText, statText } from "./dailyScorePresentation.js";
import { hasProvisionalStats } from './dailyLiveScoring.js';

const slotNames = ["F1", "F2", "F3", "D1", "D2", "Flex 1", "Flex 2"];
const collectionStates = {
  pending: "Stats pending",
  partial: "Stats pending: partially collected",
  collected: "Stats collected",
  unavailable: "Stats pending: details unavailable",
};

export function StatsCollection({ row }) {
  const status = Object.hasOwn(collectionStates, row?.statsStatus) ? row.statsStatus : "unavailable";
  const provisional = hasProvisionalStats(row);
  const label = (provisional ? 'Provisional stats · ' : '') + collectionStates[status];
  const games = Number.isInteger(row?.gamesCollected) && Number.isInteger(row?.gamesExpected)
    ? ` (${row.gamesCollected} of ${row.gamesExpected} games)` : "";
  return <span className="hds-stats-status" data-status={provisional ? 'provisional' : status === "collected" ? "collected" : "pending"} role="img" aria-label={label + games} title={label + games}/>;
}

function rosterSlots(roster = []) {
  const slots = Array(7).fill(null);
  // Keep the same natural-then-flex assignment and signed order as the auction board.
  for (const player of roster) {
    const group = player.position === "D" ? "D" : "F";
    const index = slots.findIndex((occupant, i) => !occupant && (i >= 5 || slotNames[i][0] === group));
    if (index >= 0) slots[index] = player;
  }
  return slots;
}

export function ScoreRosterTable({ member, detailed = false }) {
  return <table className={"hds-roster-table" + (detailed ? " hds-roster-table-detailed" : "")}>
    <caption className="hds-visually-hidden">{detailed ? "Roster for " + member.name : "Your roster slots"}</caption>
    <thead><tr><th scope="col">Slot</th><th scope="col">Player</th>
      {detailed && SCORING_CATEGORIES.map(({ key, abbreviation, label }) => <th key={key} scope="col" title={label}>{abbreviation}</th>)}
      <th scope="col" title="Official stats collection">Stats</th><th scope="col">Salary</th><th scope="col" title="Fantasy points">FP</th>
    </tr></thead>
    <tbody>{rosterSlots(member.roster).map((player, index) => <tr key={slotNames[index]}>
      <th scope="row">{slotNames[index]}</th>
      <td className="hds-roster-player">{player ? <><strong>{player.name}</strong><small>{player.team} · {player.position === "D" ? "D" : "F"}</small></> : <span className="hds-empty-slot">Empty slot</span>}</td>
      {detailed && SCORING_CATEGORIES.map(({ key }) => <td key={key}>{player ? statText(player, key) : "—"}</td>)}
      <td>{player ? <StatsCollection row={player}/> : "—"}</td>
      <td>{salaryText(player?.price)}</td>
      <td className="hds-fp">{player ? scoreText(player.points) : "—"}</td>
    </tr>)}</tbody>
    <tfoot><tr><th scope="row" colSpan={detailed ? SCORING_CATEGORIES.length + 3 : 3}>Team total</th>
      <td className="hds-salary-total">{salaryText(member.spent)}</td>
      <td className={detailed ? "hds-fp" : "hds-team-total"}>{scoreText(member.points)} {detailed ? "FP" : <small>FP</small>}</td></tr></tfoot>
  </table>;
}

export function DailyScoreRoster({ member }) {
  return <section className="hds-own-roster hds-pane" aria-label="Your roster">
    <h2>Your roster</h2>
    {member ? <div className="hds-table-scroll" role="region" aria-label="Your roster details" tabIndex={0}><ScoreRosterTable member={member}/></div>
      : <p className="hds-empty">You aren’t a participant in this room, so you don’t have a roster here. Expand a manager in the standings to view their players.</p>}
  </section>;
}
