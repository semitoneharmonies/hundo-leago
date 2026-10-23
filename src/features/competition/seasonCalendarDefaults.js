// User-approved defaults for new, unconfigured 2026–27 seasons only.
export function seasonCalendarDefaults(season) {
  if (season?.nhlSeasonKey !== "20262027" || ![
    "regularSeasonStartsAtMs", "regularSeasonEndsAtMs",
    "fantasyPlayoffsStartAtMs", "fantasyPlayoffsEndAtMs",
  ].every((field) => season[field] === null)) return null;
  return {
    nhlRegularSeasonStartsAtMs: "2026-09-29T00:00",
    nhlRegularSeasonEndsAtMs: "2027-04-11T00:00",
    fantasyPlayoffsStartAtMs: "2027-03-15T00:00",
    fantasyPlayoffsEndAtMs: "2027-04-11T00:00",
    firstWeekStartsAtMs: "2026-09-29T00:00",
  };
}
