import { ResponseContractError } from "./api/responseContracts.js";

export const EXPANDED_SCORING_VERSION = "expanded-2026-v1";
export const SCORING_CATEGORIES = Object.freeze([
  ["evenStrengthGoals", "EVG", "Even-strength goals", 300],
  ["powerPlayGoals", "PPG", "Power-play goals", 275],
  ["shortHandedGoals", "SHG", "Shorthanded goals", 325],
  ["gameWinningGoals", "GWG", "Game-winning goal bonus", 100],
  ["primaryAssists", "A1", "Primary assists", 225],
  ["secondaryAssists", "A2", "Secondary assists", 175],
  ["shotsOnGoal", "SOG", "Shots on goal", 20],
  ["hits", "HIT", "Hits", 20],
  ["blockedShots", "BLK", "Blocked shots", 20],
  ["takeaways", "TK", "Takeaways", 20],
  ["giveaways", "GV", "Giveaways", -10],
  ["penaltiesDrawn", "PD", "Penalties drawn", 20],
  ["penaltiesTaken", "PT", "Penalties taken", -20],
].map(([key, abbreviation, label, hundredths]) => Object.freeze({ key, abbreviation, label, hundredths })));

export function scoringWeight(category, position, weights) {
  if (weights) return weights[position][category.key];
  return category.hundredths + (position === "D" && ["hits", "blockedShots"].includes(category.key) ? 15 : 0);
}

export function scoringDescription(key, weights) {
  const category = SCORING_CATEGORIES.find(item => item.key === key);
  if (!category) return undefined;
  if (weights) return `${category.label}: ${(weights.F[key] / 100).toFixed(2)} FP for forwards, ${(weights.D[key] / 100).toFixed(2)} FP for defence`;
  const forward = (category.hundredths / 100).toFixed(2);
  return `${category.label}: ${forward} FP${["hits", "blockedShots"].includes(key) ? " for forwards, 0.35 FP for defence" : " each"}`;
}

export function validateExpandedScoring(value, position, scoreField = "fantasyPointsHundredths") {
  if (!value || (value.scoringRuleVersion === undefined && value.scoringStats === undefined)) return false;
  const stats = value.scoringStats;
  const custom = /^league-scoring-[a-f0-9-]{36}$/.test(value.scoringRuleVersion || '');
  if (custom) validateScoringWeights(value.scoringWeights);
  if ((!custom && (value.scoringRuleVersion !== EXPANDED_SCORING_VERSION || value.scoringWeights !== undefined)) || !stats || typeof stats !== "object" ||
      Array.isArray(stats) || Object.keys(stats).length !== SCORING_CATEGORIES.length ||
      SCORING_CATEGORIES.some(({ key }) => !Number.isSafeInteger(stats[key]) || stats[key] < 0)) {
    throw new ResponseContractError("The scoring breakdown is incomplete.");
  }
  if (["F", "D"].includes(position)) {
    const expected = SCORING_CATEGORIES.reduce((sum, category) => sum + stats[category.key] * scoringWeight(category, position, value.scoringWeights), 0);
    if (!Number.isSafeInteger(expected) || value[scoreField] !== expected) {
      throw new ResponseContractError("The scoring breakdown does not match the fantasy points.");
    }
  }
  return true;
}

export function validateScoringWeights(value) {
  if (!value || Array.isArray(value) || Object.keys(value).sort().join() !== 'D,F' || ['F','D'].some(position =>
    !value[position] || Array.isArray(value[position]) || Object.keys(value[position]).length !== SCORING_CATEGORIES.length ||
    SCORING_CATEGORIES.some(({key}) => !Number.isSafeInteger(value[position][key]) || Math.abs(value[position][key]) > 100000))) {
    throw new ResponseContractError('The league scoring weights are incomplete.');
  }
  return true;
}
