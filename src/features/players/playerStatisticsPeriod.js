export const SEASON_STATISTICS_PERIOD = Object.freeze({ statsPeriod: "season" });

function dateLabel(value) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}T12:00:00Z`));
}

export function statisticsPeriodLabel(period) {
  if (period.statsPeriod === "dateRange") return `${dateLabel(period.startDate)} – ${dateLabel(period.endDate)}`;
  if (period.statsPeriod === "lastGames") return `Last ${period.lastGames} ${period.lastGames === 1 ? "game" : "games"} per player`;
  return "Season to date";
}
