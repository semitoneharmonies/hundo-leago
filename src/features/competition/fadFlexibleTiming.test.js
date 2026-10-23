import { describe, expect, it } from "vitest";
import { suggestedRollovers, draftTimingIssue } from "./fadScheduleTiming.js";

const DAY = 86400000;
const deadline = Date.parse("2026-09-13T19:00:00Z");
describe("commissioner rollover suggestions", () => {
  it("uses fourteen daily rounds for fourteen days", () => {
    expect(suggestedRollovers(deadline, deadline + 14 * DAY)).toEqual(Array.from({ length: 14 }, (_, i) => deadline + (i + 1) * DAY));
  });
  it("fits the chosen total into two days with multiple final-day times", () => {
    const times = suggestedRollovers(deadline, deadline + 2 * DAY, 5);
    expect(times).toEqual([1, 1.25, 1.5, 1.75, 2].map((days) => deadline + days * DAY));
    expect(draftTimingIssue(deadline, times, deadline + 2 * DAY, deadline - DAY)).toBeNull();
  });
  it("accepts manually chosen short rounds, and rejects reversed or late times", () => {
    const times = [deadline + 30 * 60000, deadline + 90 * 60000];
    expect(draftTimingIssue(deadline, times, deadline + DAY, deadline - 1)).toBeNull();
    expect(draftTimingIssue(deadline, [...times].reverse(), deadline + DAY, deadline - 1)).toMatch(/Round 2 must end after/);
    expect(draftTimingIssue(deadline, times, times[0], deadline - 1)).toMatch(/Round 2 must end by/);
  });
});
