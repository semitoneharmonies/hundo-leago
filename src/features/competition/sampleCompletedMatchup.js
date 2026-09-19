import { EXPANDED_SCORING_VERSION, SCORING_CATEGORIES, scoringWeight } from "../../shared/scoringCategories.js";

// Synthetic, read-only presentation data. Never submitted to the league API.
const names = [
  "Alex Mercer", "Jordan Campbell", "Noah Sullivan", "Ethan Tremblay",
  "Liam Anderson", "Owen MacKenzie", "Lucas Bennett", "Mason Fitzgerald",
  "Oliver Dubois", "Logan Richardson", "Jack Thompson", "Aiden Beaumont",
  "Caleb Harrison", "Isaac Montgomery", "Henry Wallace", "Leo Desjardins",
  "Finn O'Connor", "Theo MacDonald", "Samuel Edwards", "Benjamin Clarke",
  "Daniel Morrison", "Nathan Prescott", "Ryan Henderson", "Adam Bouchard",
  "James Patterson", "Cole Whitmore", "Dylan Cameron", "Luke Alexander",
  "Tyler Reynolds", "Evan Sinclair", "Connor Mitchell", "Nolan Marchand",
  "Gabriel Laurent", "Elliot Davidson", "Maxwell Spencer", "William Brooks",
];

function sampleTeam(side, offset) {
  const players = names.slice(offset, offset + 18).map((fullName, index) => {
    const positionGroup = index < 12 ? "F" : "D";
    const n = index + offset;
    const counts = index === 0
      ? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 2]
      : [n % 3, n % 2, n % 7 === 0 ? 1 : 0, n % 4 === 0 && n % 3 ? 1 : 0,
        n % 4, n % 3, 4 + n % 12, 2 + n % 11, 1 + n % 8, n % 4,
        n % 6, n % 3, n % 4];
    const scoringStats = Object.fromEntries(SCORING_CATEGORIES.map(({ key }, i) => [key, counts[i]]));
    const goalDelta = scoringStats.evenStrengthGoals + scoringStats.powerPlayGoals + scoringStats.shortHandedGoals;
    const assistDelta = scoringStats.primaryAssists + scoringStats.secondaryAssists;
    return {
      playerId: `sample-${side}-${index + 1}`, fullName, positionGroup,
      slotNumber: index < 12 ? index + 1 : index - 11,
      gamesPlayedDelta: 2 + n % 3, goalDelta, assistDelta, pointDelta: goalDelta + assistDelta,
      scoringRuleVersion: EXPANDED_SCORING_VERSION, scoringStats, dataStatus: "available",
      scoreHundredths: SCORING_CATEGORIES.reduce((total, category) => total + scoringStats[category.key] * scoringWeight(category, positionGroup), 0),
    };
  });
  return {
    legal: true, scoringRuleVersion: EXPANDED_SCORING_VERSION, players,
    scoreHundredths: players.reduce((total, player) => total + player.scoreHundredths, 0),
  };
}

export const sampleCompletedMatchup = {
  id: "sample-completed-week", status: "completed",
  homeTeam: { id: "sample-home", name: "North Stars" },
  awayTeam: { id: "sample-away", name: "Harbour Wolves" },
  scoring: { mode: "final", home: sampleTeam("home", 0), away: sampleTeam("away", 18) },
};
