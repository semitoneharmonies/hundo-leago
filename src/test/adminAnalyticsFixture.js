import { ANALYTICS_METRIC_NAMES } from "../features/analytics/analyticsContracts.js";

export function adminAnalyticsFixture({ days = 28, coverage = "full", startedOn = "2026-08-01", expandedCoverage = coverage, expandedStartedOn = startedOn, sourcesUnavailable = false } = {}) {
  const end = Date.parse("2026-11-27T00:00:00Z");
  const date = (offset) => new Date(end + offset * 86_400_000).toISOString().slice(0, 10);
  const daily = Array.from({ length: days }, (_, index) => ({
    date: date(index - days + 1),
    pageViews: coverage === "not_started" || date(index - days + 1) < startedOn ? 0 : (index % 5 + 1) * 10,
    activeSeconds: coverage === "not_started" || date(index - days + 1) < startedOn ? 0 : (index % 5 + 1) * 300,
  }));
  const totals = daily.reduce((sum, row) => ({ pageViews: sum.pageViews + row.pageViews, activeSeconds: sum.activeSeconds + row.activeSeconds }), { pageViews: 0, activeSeconds: 0 });
  const products = [
    { product: "leago", pageViews: totals.pageViews * 0.6, activeSeconds: totals.activeSeconds * 0.6 },
    { product: "daily", pageViews: totals.pageViews * 0.3, activeSeconds: totals.activeSeconds * 0.3 },
    { product: "shared", pageViews: totals.pageViews * 0.1, activeSeconds: totals.activeSeconds * 0.1 },
  ];
  const values = {
    "install.reported": 6, "launch.installed": 84, "launch.browser": 116,
    "layout.small": 138, "layout.large": 62,
    "feature.players_filter": 92, "feature.favourites": 35, "feature.roster_schedule": 48, "feature.daily_chat_open": 53, "feature.daily_chat_send": 21,
    "vital.lcp.good": 72, "vital.lcp.needs_improvement": 18, "vital.lcp.poor": 10,
    "vital.inp.good": 65, "vital.inp.needs_improvement": 9, "vital.inp.poor": 6,
    "vital.cls.good": 86, "vital.cls.needs_improvement": 10, "vital.cls.poor": 4,
    "action.join.success": 31, "action.join.failure": 4, "action.bid.success": 146, "action.bid.failure": 9,
    "action.trade.success": 12, "action.trade.failure": 2, "action.page_load.success": 960, "action.page_load.failure": 12,
    "room.created.practice": 18, "room.started.practice": 16, "room.completed.practice": 15, "room.cancelled.practice": 1, "room.seats_at_start.practice": 96, "room.capacity_at_start.practice": 128,
    "room.created.scheduled": 12, "room.started.scheduled": 10, "room.completed.scheduled": 8, "room.cancelled.scheduled": 1, "room.seats_at_start.scheduled": 64, "room.capacity_at_start.scheduled": 80,
  };
  const metrics = ANALYTICS_METRIC_NAMES.map((metric) => ({ metric, count: expandedCoverage === "not_started" ? 0 : values[metric], previousCount: expandedCoverage === "full" ? Math.floor(values[metric] * 0.7) : 0 }));
  const timingStatus = expandedCoverage === "not_started" ? "not_measured" : days < 14 || expandedStartedOn > date(-13) ? "insufficient_data" : "available";
  const blocks = ["00-05", "06-11", "12-17", "18-23"];
  const timeBlocks = Array.from({ length: 28 }, (_, index) => ({
    weekday: Math.floor(index / 4), block: blocks[index % 4], pageViews: timingStatus === "available" ? 0 : null,
    activeSeconds: timingStatus === "available" ? 0 : null, suppressed: false,
  }));
  if (timingStatus === "available") {
    daily.forEach((row, index) => {
      const weekday = new Date(row.date).getUTCDay();
      const cell = timeBlocks.find((item) => item.weekday === weekday && item.block === blocks[index % 4]);
      cell.pageViews += row.pageViews; cell.activeSeconds += row.activeSeconds;
    });
    const cell = timeBlocks.find((item) => item.pageViews > 0);
    cell.pageViews = null; cell.activeSeconds = null; cell.suppressed = true;
  }
  const weeklyMap = new Map();
  const calendarDays = daily.map((row, index) => {
    const day = new Date(row.date).getUTCDay();
    const weekStartDate = new Date(Date.parse(row.date) - ((day + 6) % 7) * 86_400_000).toISOString().slice(0, 10);
    if (!weeklyMap.has(weekStartDate)) weeklyMap.set(weekStartDate, { weekStartDate, completedTrades: 0, resolvedAuctions: 0, rosterChanges: 0, dailyDrafts: 0 });
    const week = weeklyMap.get(weekStartDate);
    week.completedTrades += index % 9 === 0 ? 1 : 0;
    week.resolvedAuctions += index % 7 === 0 ? 3 : 0;
    week.rosterChanges += index % 3;
    week.dailyDrafts += index % 2;
    return { date: row.date, recordedNhlGames: index % 5 === 0 ? null : index % 10, matchupDeadlines: day === 1 ? 2 : 0, auctionDeadlines: day === 0 ? 2 : 0, tradeDeadlines: 0, dailyDrafts: index % 2 };
  });
  const weekly = [...weeklyMap.values()];
  const gameplayTotals = weekly.reduce((sum, row) => ({ completedTrades: sum.completedTrades + row.completedTrades, resolvedAuctions: sum.resolvedAuctions + row.resolvedAuctions, rosterChanges: sum.rosterChanges + row.rosterChanges, dailyDrafts: sum.dailyDrafts + row.dailyDrafts }), { completedTrades: 0, resolvedAuctions: 0, rosterChanges: 0, dailyDrafts: 0 });
  const operations = {
    dailyRooms: { status: "available", cohort: "play_date", modes: [
      { mode: "scheduled", rooms: 12, completed: 8, cancelled: 1, pendingScoring: 2, filledSeats: 72, capacitySeats: 96, fullRooms: 5 },
      { mode: "practice", rooms: 18, completed: 15, cancelled: 1, pendingScoring: 0, filledSeats: 114, capacitySeats: 144, fullRooms: 9 },
    ], historicalStartFillAvailable: false },
    gameplay: { status: "available", totals: gameplayTotals, weekly },
    freshness: { status: "available", statistics: { lastSuccessAtMs: end + 12 * 3_600_000, failedInPeriod: 1 }, injuries: { lastSuccessAtMs: end + 9 * 3_600_000, failedInPeriod: 0 }, jobs: { failedCount: 1, pendingCount: 2, runningCount: 1 }, dailyScoringPending: 2, matchupsAwaitingData: 0 },
    calendar: { status: "available", nhlCoverage: "recorded_only", days: calendarDays },
  };
  if (sourcesUnavailable) {
    operations.dailyRooms = { status: "unavailable", cohort: "play_date", modes: [], historicalStartFillAvailable: false };
    operations.gameplay = { status: "unavailable", totals: null, weekly: [] };
    operations.freshness = { status: "unavailable", statistics: null, injuries: null, jobs: null, dailyScoringPending: null, matchupsAwaitingData: null };
    operations.calendar = { status: "unavailable", nhlCoverage: "recorded_only", days: [] };
  }
  return {
    code: "ADMIN_ANALYTICS_FOUND", timeZone: "Etc/GMT+8",
    period: { days, startDate: date(-days + 1), endDate: date(0), previousStartDate: date(-days * 2 + 1), previousEndDate: date(-days) },
    measurement: { startedOn: coverage === "not_started" ? null : startedOn, coverage, retentionDays: 365, expandedStartedOn: expandedCoverage === "not_started" ? null : expandedStartedOn, expandedCoverage },
    totals, previousTotals: coverage === "full" ? { pageViews: 400, activeSeconds: 6000 } : { pageViews: 0, activeSeconds: 0 },
    products,
    pages: coverage === "not_started" ? [] : products.map((row, index) => ({ ...row, category: ["rosters", "room", "home"][index] })),
    daily, accounts: { total: 46, createdInPeriod: 5 }, metrics, timeBlocks,
    peakUsage: { status: timingStatus, minimumMeasuredDays: 14, minimumPageViews: 20, suppressionThreshold: 5 },
    operations, releases: expandedCoverage === "not_started" ? [] : [{ date: date(-2), buildId: "hundo-analytics-example-build" }],
  };
}