import { describe, expect, it } from "vitest";
import { dailyGameDate, isDailyHistoryRoom } from "./dailyHistory.js";

describe("Daily history", () => {
  it("uses Daily's Pacific midnight even on devices with older timezone rules", () => {
    expect(dailyGameDate(Date.parse("2026-11-18T06:59:59Z"))).toBe("2026-11-17");
    expect(dailyGameDate(Date.parse("2026-11-18T07:00:00Z"))).toBe("2026-11-18");
  });
  it("archives only finished rooms from earlier game days", () => {
    const yesterday = {date:"2026-11-17",phase:"finished"};
    expect(isDailyHistoryRoom(yesterday,"2026-11-18")).toBe(true);
    for (const phase of ["waiting","auction","locked","void"]) expect(isDailyHistoryRoom({...yesterday,phase},"2026-11-18")).toBe(false);
    expect(isDailyHistoryRoom({...yesterday,date:"2026-11-18"},"2026-11-18")).toBe(false);
    expect(isDailyHistoryRoom({...yesterday,date:"2026-11-19"},"2026-11-18")).toBe(false);
  });
  it("handles year boundaries without hiding undated rooms", () => {
    expect(isDailyHistoryRoom({date:"2026-12-31",phase:"finished"},"2027-01-01")).toBe(true);
    expect(isDailyHistoryRoom({phase:"finished"},"2027-01-01")).toBe(false);
  });
});
