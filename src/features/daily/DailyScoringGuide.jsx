import { useRef } from 'react';
import { BarChart3 } from 'lucide-react';
import { SCORING_CATEGORIES, scoringWeight } from '../../shared/scoringCategories.js';
import './DailyHelp.css';
import './DailyScoringGuide.css';

const points = value => `${value < 0 ? '−' : '+'}${(Math.abs(value) / 100).toFixed(2)}`;

export function DailyScoringGuide() {
  const dialog = useRef(null);
  return <>
    <button type="button" className="hd-action" aria-haspopup="dialog" onClick={() => dialog.current.showModal()}>
      <BarChart3 size={15} aria-hidden="true"/>Scoring breakdown
    </button>
    <dialog ref={dialog} className="hd-help hd-scoring-guide" aria-labelledby="hd-scoring-title">
      <div className="hd-help-heading">
        <h2 id="hd-scoring-title">Scoring breakdown</h2>
        <button type="button" className="hd-action" autoFocus onClick={() => dialog.current.close()}>Close</button>
      </div>
      <p className="hd-scoring-tagline">Every shift can count.</p>
      <p className="hd-scoring-intro">Goals get the headlines. Hits, blocks and the little plays can win your room. Here’s what each recorded stat earns in fantasy points (FP).</p>
      <table className="hd-scoring-table">
        <caption>Fantasy points per stat</caption>
        <thead><tr><th scope="col">Stat</th><th scope="col"><abbr title="Forwards">F</abbr></th><th scope="col"><abbr title="Defencemen">D</abbr></th></tr></thead>
        <tbody>{SCORING_CATEGORIES.map(category => {
          const f = scoringWeight(category, 'F'), d = scoringWeight(category, 'D');
          return <tr key={category.key} className={f < 0 ? 'is-deduction' : undefined}>
            <th scope="row"><span className="hd-scoring-code" aria-hidden="true">{category.abbreviation}</span><span>{category.label}</span></th>
            <td>{points(f)}</td><td className={d !== f ? 'is-defence-boost' : undefined}>{points(d)}</td>
          </tr>;
        })}</tbody>
      </table>
      <div className="hd-scoring-notes">
        <p><strong>Defence earns extra.</strong> Hits and blocks are +0.35 each for D and +0.20 for F. Flex players keep the scoring for their actual position.</p>
        <p><strong>A winner gets a bonus.</strong> A goal earns its even-strength, power-play or shorthanded value. A game-winning goal adds another +1.00 FP.</p>
        <p><strong>Assists, explained.</strong> The primary assist is the last pass before the goal; the secondary assist is the pass before that. Negative values deduct points from your total.</p>
      </div>
    </dialog>
  </>;
}
