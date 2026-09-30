import { SCORING_CATEGORIES, scoringDescription } from "../shared/scoringCategories.js";

export function ScoringStatGuide({weights} = {}) {
  return (
    <details className="hl-scoring-stat-guide">
      <summary>Scoring stat key</summary>
      <dl>{SCORING_CATEGORIES.map(({ key, abbreviation }) => (
        <div key={key}><dt>{abbreviation}</dt><dd>{scoringDescription(key, weights)}</dd></div>
      ))}</dl>
      <p>{weights && "Fantasy points use this league’s displayed scoring values. "}GP = games played. FP = fantasy points. FPG = fantasy points per game. A dash means the stat is unavailable.</p>
    </details>
  );
}
