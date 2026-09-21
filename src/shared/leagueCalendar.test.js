import { describe, expect, it } from "vitest";
import { calendarInputValue, calendarTimestamp } from "./leagueCalendar.js";

describe("league calendar input", () => {
  it("uses the league timezone across daylight saving changes", () => {
    expect(calendarTimestamp("2026-10-05T00:00", "America/Vancouver")).toBe(Date.parse("2026-10-05T07:00:00Z"));
    expect(calendarTimestamp("2027-01-04T00:00", "America/Vancouver")).toBe(Date.parse("2027-01-04T08:00:00Z"));
    expect(calendarInputValue(Date.parse("2027-01-04T08:00:00Z"), "America/Vancouver")).toBe("2027-01-04T00:00");
  });
  it("rejects missing dates and nonexistent daylight-saving times", () => {
    expect(calendarTimestamp("", "America/Vancouver")).toBeNull();
    expect(calendarTimestamp("2027-03-14T02:30", "America/Vancouver")).toBeNull();
  });
});
