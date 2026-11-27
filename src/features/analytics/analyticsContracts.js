import { ResponseContractError } from "../../shared/api/responseContracts.js";

export const ANALYTICS_PRODUCTS = Object.freeze({
  leago: "Hundo Leago",
  daily: "Hundo Daily",
  shared: "Shared pages",
});

export const ANALYTICS_CATEGORIES = Object.freeze({
  leago: Object.freeze({ dashboard: "Dashboard", rosters: "Rosters", players: "Players", matchups: "Matchups", standings: "Standings", auctions: "Auctions", trades: "Trades", drafts: "Drafts", activity: "League activity", commissioner: "Commissioner tools", teams: "Teams" }),
  daily: Object.freeze({ lobby: "Lobby", room: "Rooms", history: "History", profile: "Profile", notifications: "Notifications", create: "Create room", practice: "Practice" }),
  shared: Object.freeze({ home: "Home", account: "Account settings", notifications: "Notifications", install: "Install", games: "Mini games", leagues: "League selection" }),
});

function check(condition, message) {
  if (!condition) throw new ResponseContractError(message);
}
function record(value, keys) {
  check(value !== null && typeof value === "object" && !Array.isArray(value), "Invalid analytics record.");
  check(Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)), "Unexpected analytics fields.");
}
function date(value) {
  check(typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value, "Invalid analytics date.");
}
function count(value) {
  check(Number.isSafeInteger(value) && value >= 0, "Invalid analytics total.");
}
function totals(value, extraKeys = []) {
  record(value, [...extraKeys, "pageViews", "activeSeconds"]);
  count(value.pageViews);
  count(value.activeSeconds);
}
export function validateAdminAnalytics(data, expectedDays) {
  record(data, ["code", "timeZone", "period", "measurement", "totals", "previousTotals", "products", "pages", "daily", "accounts", "metrics", "timeBlocks", "peakUsage", "operations", "releases"]);
  check(data.code === "ADMIN_ANALYTICS_FOUND", "Invalid analytics response.");
  check(data.timeZone === "Etc/GMT+8", "Invalid analytics time zone.");
  record(data.period, ["days", "startDate", "endDate", "previousStartDate", "previousEndDate"]);
  check([7, 28, 90].includes(data.period.days) && (expectedDays === undefined || data.period.days === expectedDays), "Unexpected analytics period.");
  for (const field of ["startDate", "endDate", "previousStartDate", "previousEndDate"]) date(data.period[field]);
  const dayMs = 86_400_000;
  check(Date.parse(data.period.endDate) - Date.parse(data.period.startDate) === (data.period.days - 1) * dayMs &&
    Date.parse(data.period.startDate) - Date.parse(data.period.previousStartDate) === data.period.days * dayMs &&
    Date.parse(data.period.startDate) - Date.parse(data.period.previousEndDate) === dayMs, "Inconsistent analytics period.");
  record(data.measurement, ["startedOn", "coverage", "retentionDays", "expandedStartedOn", "expandedCoverage"]);
  check(["not_started", "partial", "full"].includes(data.measurement.coverage), "Invalid analytics coverage.");
  check(data.measurement.retentionDays === 365, "Invalid analytics retention.");
  if (data.measurement.startedOn !== null) date(data.measurement.startedOn);
  check((data.measurement.startedOn === null) === (data.measurement.coverage === "not_started"), "Inconsistent analytics coverage.");
  totals(data.totals);
  totals(data.previousTotals);
  check(Array.isArray(data.products) && data.products.length === 3, "Invalid analytics products.");
  const products = new Set();
  for (const item of data.products) {
    totals(item, ["product"]);
    check(Object.hasOwn(ANALYTICS_PRODUCTS, item.product) && !products.has(item.product), "Invalid analytics product.");
    products.add(item.product);
  }
  check(Array.isArray(data.pages) && data.pages.length <= 24, "Invalid analytics sections.");
  const sections = new Set();
  for (const item of data.pages) {
    totals(item, ["product", "category"]);
    check(Object.hasOwn(ANALYTICS_CATEGORIES, item.product) && Object.hasOwn(ANALYTICS_CATEGORIES[item.product], item.category), "Invalid analytics section.");
    const section = item.product + ":" + item.category;
    check(!sections.has(section), "Duplicate analytics section.");
    sections.add(section);
  }
  check(Array.isArray(data.daily) && data.daily.length === data.period.days, "Invalid daily analytics.");
  data.daily.forEach((item, index) => {
    totals(item, ["date"]);
    date(item.date);
    check(Date.parse(item.date) === Date.parse(data.period.startDate) + index * dayMs, "Incomplete daily analytics.");
  });
  for (const field of ["pageViews", "activeSeconds"]) {
    for (const rows of [data.products, data.pages, data.daily]) {
      check(rows.reduce((sum, item) => sum + item[field], 0) === data.totals[field], "Inconsistent analytics totals.");
    }
  }
  record(data.accounts, ["total", "createdInPeriod"]);
  count(data.accounts.total);
  count(data.accounts.createdInPeriod);
  check(data.accounts.createdInPeriod <= data.accounts.total, "Inconsistent account totals.");
  validateExpandedAnalytics(data);
  return true;
}
export const ANALYTICS_METRIC_NAMES = Object.freeze([
  "install.reported", "launch.installed", "launch.browser", "layout.small", "layout.large",
  "feature.players_filter", "feature.favourites", "feature.roster_schedule", "feature.daily_chat_open", "feature.daily_chat_send",
  ...["lcp", "inp", "cls"].flatMap((name) => ["good", "needs_improvement", "poor"].map((rating) => "vital." + name + "." + rating)),
  ...["join", "bid", "trade", "page_load"].flatMap((name) => ["success", "failure"].map((outcome) => "action." + name + "." + outcome)),
  ...["created", "started", "completed", "cancelled", "seats_at_start", "capacity_at_start"].flatMap((name) => ["practice", "scheduled"].map((mode) => "room." + name + "." + mode)),
]);

function nullableCount(value) { if (value !== null) count(value); }
function timestamp(value) {
  if (value !== null) check(Number.isSafeInteger(value) && value >= 0 && value <= 8_640_000_000_000_000, "Invalid update timestamp.");
}
function status(value) { check(["available", "unavailable", "not_measured"].includes(value), "Invalid analytics source status."); }
function list(value, limit) { check(Array.isArray(value) && value.length <= limit, "Invalid aggregate list."); }
function gameplayTotals(value, extraKeys = []) {
  record(value, [...extraKeys, "completedTrades", "resolvedAuctions", "rosterChanges", "dailyDrafts"]);
  for (const key of ["completedTrades", "resolvedAuctions", "rosterChanges"]) count(value[key]);
  nullableCount(value.dailyDrafts);
}
function validateExpandedAnalytics(data) {
  const measurement = data.measurement;
  check(["not_started", "partial", "full"].includes(measurement.expandedCoverage), "Invalid additional measurement coverage.");
  if (measurement.expandedStartedOn !== null) date(measurement.expandedStartedOn);
  check((measurement.expandedStartedOn === null) === (measurement.expandedCoverage === "not_started"), "Inconsistent additional measurement coverage.");
  list(data.metrics, ANALYTICS_METRIC_NAMES.length);
  check(data.metrics.length === ANALYTICS_METRIC_NAMES.length, "Incomplete aggregate metrics.");
  const seen = new Set();
  for (const row of data.metrics) {
    record(row, ["metric", "count", "previousCount"]);
    check(ANALYTICS_METRIC_NAMES.includes(row.metric) && !seen.has(row.metric), "Unexpected aggregate metric.");
    count(row.count); count(row.previousCount); seen.add(row.metric);
  }
  record(data.peakUsage, ["status", "minimumMeasuredDays", "minimumPageViews", "suppressionThreshold"]);
  check(["not_measured", "insufficient_data", "available"].includes(data.peakUsage.status), "Invalid timing status.");
  check(data.peakUsage.minimumMeasuredDays === 14 && data.peakUsage.minimumPageViews === 20 && data.peakUsage.suppressionThreshold === 5, "Invalid timing privacy thresholds.");
  list(data.timeBlocks, 28);
  check(data.timeBlocks.length === 28, "Incomplete timing buckets.");
  const cells = new Set();
  for (const row of data.timeBlocks) {
    record(row, ["weekday", "block", "pageViews", "activeSeconds", "suppressed"]);
    check(Number.isInteger(row.weekday) && row.weekday >= 0 && row.weekday <= 6 && ["00-05", "06-11", "12-17", "18-23"].includes(row.block), "Invalid timing bucket.");
    check(typeof row.suppressed === "boolean", "Invalid timing suppression.");
    const key = row.weekday + ":" + row.block;
    check(!cells.has(key), "Duplicate timing bucket."); cells.add(key);
    nullableCount(row.pageViews); nullableCount(row.activeSeconds);
    if (data.peakUsage.status !== "available" || row.suppressed) {
      check(row.pageViews === null && row.activeSeconds === null, "Unpublished timing details must be withheld.");
    } else {
      check(row.pageViews !== null && row.activeSeconds !== null && (row.pageViews === 0 || row.pageViews >= 5), "Invalid published timing totals.");
    }
  }
  record(data.operations, ["dailyRooms", "gameplay", "freshness", "calendar"]);
  const rooms = data.operations.dailyRooms;
  record(rooms, ["status", "cohort", "modes", "historicalStartFillAvailable"]); status(rooms.status);
  check(rooms.cohort === "play_date" && rooms.historicalStartFillAvailable === false, "Invalid room cohort.");
  list(rooms.modes, 2);
  check(rooms.modes.length === (rooms.status === "available" ? 2 : 0), "Invalid room mode coverage.");
  const modes = new Set();
  for (const room of rooms.modes) {
    record(room, ["mode", "rooms", "completed", "cancelled", "pendingScoring", "filledSeats", "capacitySeats", "fullRooms"]);
    check(["practice", "scheduled"].includes(room.mode) && !modes.has(room.mode), "Invalid room mode."); modes.add(room.mode);
    for (const key of ["rooms", "completed", "cancelled", "pendingScoring", "filledSeats", "capacitySeats", "fullRooms"]) count(room[key]);
    check(room.completed + room.cancelled <= room.rooms && room.fullRooms <= room.rooms && room.pendingScoring <= room.rooms && room.filledSeats <= room.capacitySeats, "Inconsistent room counts.");
  }
  const gameplay = data.operations.gameplay;
  record(gameplay, ["status", "totals", "weekly"]); status(gameplay.status); list(gameplay.weekly, 15);
  if (gameplay.status !== "available") check(gameplay.totals === null && gameplay.weekly.length === 0, "Unavailable gameplay must not contain fabricated totals.");
  else {
    gameplayTotals(gameplay.totals);
    const weeks = new Set();
    for (const row of gameplay.weekly) {
      gameplayTotals(row, ["weekStartDate"]); date(row.weekStartDate);
      check(new Date(row.weekStartDate).getUTCDay() === 1 && !weeks.has(row.weekStartDate), "Invalid gameplay week.");
      weeks.add(row.weekStartDate);
    }
    for (const field of ["completedTrades", "resolvedAuctions", "rosterChanges", "dailyDrafts"]) {
      if (gameplay.totals[field] === null) check(gameplay.weekly.every((row) => row[field] === null), "Inconsistent unavailable gameplay totals.");
      else check(gameplay.weekly.every((row) => row[field] !== null) && gameplay.weekly.reduce((sum, row) => sum + row[field], 0) === gameplay.totals[field], "Inconsistent gameplay totals.");
    }
  }
  const freshness = data.operations.freshness;
  record(freshness, ["status", "statistics", "injuries", "jobs", "dailyScoringPending", "matchupsAwaitingData"]); status(freshness.status);
  if (freshness.status !== "available") {
    check(["statistics", "injuries", "jobs", "dailyScoringPending", "matchupsAwaitingData"].every((key) => freshness[key] === null), "Unavailable freshness must be explicit.");
  } else {
    for (const key of ["statistics", "injuries"]) {
      record(freshness[key], ["lastSuccessAtMs", "failedInPeriod"]);
      timestamp(freshness[key].lastSuccessAtMs); count(freshness[key].failedInPeriod);
    }
    record(freshness.jobs, ["failedCount", "pendingCount", "runningCount"]);
    for (const key of ["failedCount", "pendingCount", "runningCount"]) count(freshness.jobs[key]);
    nullableCount(freshness.dailyScoringPending); nullableCount(freshness.matchupsAwaitingData);
  }
  const calendar = data.operations.calendar;
  record(calendar, ["status", "nhlCoverage", "days"]); status(calendar.status);
  check(calendar.nhlCoverage === "recorded_only", "Invalid NHL evidence coverage."); list(calendar.days, data.period.days);
  check(calendar.status === "available" || calendar.days.length === 0, "Unavailable calendar must not contain fabricated days.");
  const dates = new Set();
  for (const row of calendar.days) {
    record(row, ["date", "recordedNhlGames", "matchupDeadlines", "auctionDeadlines", "tradeDeadlines", "dailyDrafts"]); date(row.date);
    check(row.date >= data.period.startDate && row.date <= data.period.endDate && !dates.has(row.date), "Invalid calendar date."); dates.add(row.date);
    nullableCount(row.recordedNhlGames); nullableCount(row.dailyDrafts);
    for (const key of ["matchupDeadlines", "auctionDeadlines", "tradeDeadlines"]) count(row[key]);
  }
  list(data.releases, 365);
  const builds = new Set();
  for (const row of data.releases) {
    record(row, ["date", "buildId"]); date(row.date);
    check(row.date >= data.period.startDate && row.date <= data.period.endDate && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(row.buildId) && !builds.has(row.buildId), "Invalid build observation."); builds.add(row.buildId);
  }
}
export function analyticsMetric(data, name) { return data.metrics.find((row) => row.metric === name)?.count || 0; }
