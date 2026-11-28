const DAY_MS = 86_400_000;
export function currentAnalyticsDate(now = Date.now()) {
  return new Date(now - 8 * 3_600_000).toISOString().slice(0, 10);
}
function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    value >= "1970-01-01" && Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;
}
export function shiftAnalyticsDate(value, days) {
  if (!validDate(value) || !Number.isInteger(days)) throw new TypeError("Choose a valid analytics date.");
  return new Date(Date.parse(value) + days * DAY_MS).toISOString().slice(0, 10);
}
export function mondayOf(value) {
  if (!validDate(value)) throw new TypeError("Choose a valid analytics date.");
  return shiftAnalyticsDate(value, -((new Date(value).getUTCDay() + 6) % 7));
}
export function normalizeAnalyticsSelection(selection = 28) {
  if (typeof selection === "number") selection = { kind: "days", days: selection };
  if (!selection || typeof selection !== "object" || Array.isArray(selection) || Object.keys(selection).length !== 2) {
    throw new TypeError("Choose a supported analytics period.");
  }
  if (selection.kind === "days" && [7, 28, 90].includes(selection.days)) return { kind: "days", days: selection.days };
  if (selection.kind === "week" && validDate(selection.value) && mondayOf(selection.value) === selection.value) {
    return { kind: "week", value: selection.value };
  }
  if (selection.kind === "month" && typeof selection.value === "string" && /^\d{4}-\d{2}$/.test(selection.value) && validDate(selection.value + "-01")) {
    return { kind: "month", value: selection.value };
  }
  throw new TypeError("Choose a supported analytics period.");
}
export function calendarPeriod(kind, value, today = currentAnalyticsDate()) {
  const selection = normalizeAnalyticsSelection({ kind, value });
  if (selection.kind === "days" || !validDate(today)) throw new TypeError("Choose a valid calendar period.");
  const startDate = kind === "week" ? value : value + "-01";
  if (startDate > today) throw new TypeError("Choose a calendar period that has started.");
  const calendarEndDate = kind === "week" ? shiftAnalyticsDate(startDate, 6) :
    new Date(Date.UTC(Number(value.slice(0, 4)), Number(value.slice(5, 7)), 0)).toISOString().slice(0, 10);
  const endDate = calendarEndDate < today ? calendarEndDate : today;
  const previousEndDate = shiftAnalyticsDate(startDate, -1);
  const previousStartDate = kind === "week" ? shiftAnalyticsDate(startDate, -7) : previousEndDate.slice(0, 7) + "-01";
  return { days: (Date.parse(endDate) - Date.parse(startDate)) / DAY_MS + 1, startDate, endDate,
    previousStartDate, previousEndDate, kind, value, calendarEndDate, today };
}
export function availableUsageStart(data, expanded = false) {
  const measurement = data.measurement;
  const availableKey = expanded ? "expandedAvailableFrom" : "availableFrom";
  return Object.hasOwn(measurement, availableKey) ? measurement[availableKey] :
    measurement[expanded ? "expandedStartedOn" : "startedOn"];
}
export function calendarCoverage(startedOn, retainedFrom, period) {
  const availableFrom = startedOn === null ? null : (startedOn > retainedFrom ? startedOn : retainedFrom);
  const coverage = availableFrom === null || availableFrom > period.endDate ? "not_started" :
    period.startDate < availableFrom || startedOn === period.startDate ? "partial" : "full";
  return { availableFrom, coverage };
}
