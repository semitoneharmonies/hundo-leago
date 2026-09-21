import { SCORING_CATEGORIES, scoringDescription } from "../shared/scoringCategories.js";

export function ScoringStatGuide() {
  return (
    <details className="hl-scoring-stat-guide">
      <summary>Scoring stat key</summary>
      <dl>{SCORING_CATEGORIES.map(({ key, abbreviation }) => (
        <div key={key}><dt>{abbreviation}</dt><dd>{scoringDescription(key)}</dd></div>
      ))}</dl>
      <p>GP = games played. FP = fantasy points. FPG = fantasy points per game. A dash means the stat is unavailable.</p>
    </details>
  );
}
