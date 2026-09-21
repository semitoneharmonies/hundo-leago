import { describe, it, expect } from "vitest";
import { seasonCalendarDefaults } from "./seasonCalendarDefaults.js";
const empty = { nhlSeasonKey: "20262027", regularSeasonStartsAtMs: null, regularSeasonEndsAtMs: null, fantasyPlayoffsStartAtMs: null, fantasyPlayoffsEndAtMs: null };
describe("Approved season calendar defaults", () => {
  it("includes opening night and the final game date with an exclusive end", () => {
    expect(seasonCalendarDefaults(empty)).toEqual({ nhlRegularSeasonStartsAtMs: "2026-09-29T00:00", nhlRegularSeasonEndsAtMs: "2027-04-11T00:00", fantasyPlayoffsStartAtMs: "2027-03-15T00:00", fantasyPlayoffsEndAtMs: "2027-04-11T00:00", firstWeekStartsAtMs: "2026-09-29T00:00" });
  });
  it("preserves partial or complete saved calendars and never guesses another season", () => {
    for (const field of ["regularSeasonStartsAtMs", "regularSeasonEndsAtMs", "fantasyPlayoffsStartAtMs", "fantasyPlayoffsEndAtMs"]) expect(seasonCalendarDefaults({ ...empty, [field]: 123 })).toBeNull();
    expect(seasonCalendarDefaults({ ...empty, nhlSeasonKey: "20272028" })).toBeNull();
    expect(seasonCalendarDefaults(undefined)).toBeNull();
  });
});
