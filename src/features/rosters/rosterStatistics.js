export function fantasyPointsPerGame(statistics) {
  if (!statistics) return null;
  if (statistics.gamesPlayed === 0) return 0;
  return statistics.fantasyPointsHundredths / 100 / statistics.gamesPlayed;
}
