export function calendarInputValue(timestamp, timeZone) {
  if (!Number.isSafeInteger(timestamp)) return "";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(timestamp).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function calendarTimestamp(value, timeZone) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const target = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(target)) return null;
  let result = target;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    result += target - Date.parse(`${calendarInputValue(result, timeZone)}:00Z`);
  }
  return calendarInputValue(result, timeZone) === value ? result : null;
}
