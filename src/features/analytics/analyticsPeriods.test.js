import { describe, expect, it, vi } from "vitest";
import { adminAnalyticsFixture, makeCalendarAnalytics } from "../../test/adminAnalyticsFixture.js";
import { validateAdminAnalytics } from "./analyticsContracts.js";
import { adminAnalyticsQuery } from "./analyticsQueries.js";
import { availableUsageStart, calendarCoverage, calendarPeriod, currentAnalyticsDate, mondayOf, normalizeAnalyticsSelection, shiftAnalyticsDate } from "./analyticsPeriods.js";

describe("Calendar analytics dates", () => {
  it("uses fixed UTC minus eight across the date boundary", () => {
    expect(currentAnalyticsDate(Date.parse("2026-11-27T07:59:59Z"))).toBe("2026-11-26");
    expect(currentAnalyticsDate(Date.parse("2026-11-27T08:00:00Z"))).toBe("2026-11-27");
    expect(mondayOf("2027-01-01")).toBe("2026-12-28");
    expect(mondayOf("2026-11-23")).toBe("2026-11-23");
  });
  it.each([
    ["2026-10", "2026-11-27", 31, "2026-09-01", "2026-09-30", "2026-10-31"],
    ["2024-02", "2024-03-10", 29, "2024-01-01", "2024-01-31", "2024-02-29"],
    ["2025-02", "2025-03-10", 28, "2025-01-01", "2025-01-31", "2025-02-28"],
    ["2026-01", "2026-11-27", 31, "2025-12-01", "2025-12-31", "2026-01-31"],
    ["2026-11", "2026-11-27", 27, "2026-10-01", "2026-10-31", "2026-11-27"],
  ])("resolves month %s with a complete prior month", (value, today, days, previousStartDate, previousEndDate, endDate) => {
    expect(calendarPeriod("month", value, today)).toMatchObject({ days, previousStartDate, previousEndDate, endDate, value, kind: "month" });
  });
  it("handles cross-year and current partial weeks", () => {
    expect(calendarPeriod("week", "2025-12-29", "2026-11-27")).toMatchObject({ days: 7, endDate: "2026-01-04", previousStartDate: "2025-12-22", previousEndDate: "2025-12-28" });
    expect(calendarPeriod("week", "2026-11-23", "2026-11-27")).toMatchObject({ days: 5, endDate: "2026-11-27", calendarEndDate: "2026-11-29" });
  });
  it.each([
    { kind: "month", value: "2026-13" }, { kind: "month", value: "2026-1" },
    { kind: "month", value: "1969-12" }, { kind: "week", value: "2026-11-24" },
    { kind: "week", value: "2026-02-30" }, { kind: "days", days: 31 },
    { kind: "month", value: "2026-10", email: "private@example.test" }, null,
  ])("rejects invalid selectors %j", (selection) => expect(() => normalizeAnalyticsSelection(selection)).toThrow(TypeError));
  it("rejects future periods and invalid dates", () => {
    expect(() => calendarPeriod("month", "2026-12", "2026-11-27")).toThrow();
    expect(() => calendarPeriod("week", "2026-11-30", "2026-11-27")).toThrow();
    expect(() => mondayOf("2026-02-30")).toThrow();
    expect(() => shiftAnalyticsDate("invalid", 1)).toThrow();
  });
  it("distinguishes no measurement, partial first day, and expired history", () => {
    const period = calendarPeriod("month", "2026-10", "2026-11-27");
    expect(calendarCoverage("2026-11-27", "2025-11-28", period)).toEqual({ availableFrom: "2026-11-27", coverage: "not_started" });
    expect(calendarCoverage("2026-10-01", "2025-11-28", period).coverage).toBe("partial");
    expect(calendarCoverage("2026-09-30", "2025-11-28", period).coverage).toBe("full");
    const expired = makeCalendarAnalytics("month", "2025-10", "2026-11-27", { startedOn: "2025-01-01" });
    expect(expired.measurement).toMatchObject({ retainedFrom: "2025-11-28", availableFrom: "2025-11-28", coverage: "not_started" });
    expect(availableUsageStart(expired)).toBe("2025-11-28");
    expect(availableUsageStart(adminAnalyticsFixture())).toBe("2026-08-01");
  });
});

describe("Calendar analytics contracts and requests", () => {
  it.each([["month", "2026-10"], ["month", "2026-11"], ["week", "2026-11-23"], ["month", "2025-10"]])("accepts %s %s without inventing historical usage", (kind, value) => {
    const data = makeCalendarAnalytics(kind, value);
    expect(validateAdminAnalytics(data, { kind, value })).toBe(true);
    if (data.measurement.coverage === "not_started") {
      expect(data.totals.pageViews).toBe(0);
      expect(data.accounts.createdInPeriod).toBeGreaterThan(0);
      expect(data.operations.gameplay.status).toBe("available");
    }
  });
  it.each([7, 28, 90])("preserves strict legacy %i-day shapes and query keys", (days) => {
    const data = adminAnalyticsFixture({ days });
    expect(validateAdminAnalytics(data, days)).toBe(true);
    expect(validateAdminAnalytics(data, { kind: "days", days })).toBe(true);
    expect(adminAnalyticsQuery({}, days).queryKey).toEqual(["admin", "analytics", days]);
    data.period.kind = "days";
    expect(() => validateAdminAnalytics(data, days)).toThrow();
  });
  it("accepts independently available expanded metrics and null starts", () => {
    const data = makeCalendarAnalytics("month", "2026-10", "2026-11-27", { startedOn: "2026-08-01", expandedStartedOn: null });
    expect(validateAdminAnalytics(data)).toBe(true);
    expect(availableUsageStart(data, true)).toBeNull();
  });
  it.each([
    (d) => { d.period.previousStartDate = "2026-09-02"; },
    (d) => { d.period.days = 28; },
    (d) => { d.measurement.retainedFrom = "2025-10-02"; },
    (d) => { d.measurement.availableFrom = "2026-10-01"; },
    (d) => { d.measurement.coverage = "full"; },
    (d) => { d.measurement.startedOn = "2026-11-28"; },
    (d) => { d.measurement.expandedAvailableFrom = "2026-10-01"; },
    (d) => { d.daily[0].pageViews = 1; },
    (d) => { d.metrics[0].count = 1; },
    (d) => { d.accounts.email = "private@example.test"; },
  ])("rejects inconsistent or unexpected calendar fields %#", (mutate) => {
    const data = makeCalendarAnalytics("month", "2026-10");
    mutate(data);
    expect(() => validateAdminAnalytics(data)).toThrow();
  });
  it("validates the requested calendar identity, not just its day count", () => {
    const data = makeCalendarAnalytics("month", "2026-10");
    expect(() => validateAdminAnalytics(data, { kind: "month", value: "2026-08" })).toThrow();
    expect(() => validateAdminAnalytics(data, 28)).toThrow();
    expect(() => validateAdminAnalytics(adminAnalyticsFixture(), { kind: "month", value: "2026-10" })).toThrow();
  });
  it.each([["month", "2026-10"], ["week", "2026-11-23"]])("requests authenticated %s reports with cancellable distinct cache keys", async (kind, value) => {
    const data = makeCalendarAnalytics(kind, value);
    const request = vi.fn(async (_path, options) => { options.validateData(data); return { data }; });
    const query = adminAnalyticsQuery({ request }, { kind, value });
    const signal = new AbortController().signal;
    await expect(query.queryFn({ signal })).resolves.toBe(data);
    expect(query.queryKey).toEqual(["admin", "analytics", kind, value]);
    expect(request).toHaveBeenCalledWith(`/api/v1/admin/analytics?${kind}=${value}`, expect.objectContaining({ authenticated: true, signal }));
    expect(query.meta.private).toBe(true);
    expect(query.retry).toBe(false);
  });
});
