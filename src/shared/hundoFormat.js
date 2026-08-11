export function money(cents) {
  if (!Number.isSafeInteger(cents)) return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function fantasyPoints(hundredths) {
  if (!Number.isSafeInteger(hundredths)) return "—";
  return (hundredths / 100).toFixed(2);
}

export function dateRange(startMs, endMs) {
  if (!Number.isSafeInteger(startMs) || !Number.isSafeInteger(endMs)) {
    return "Dates unavailable";
  }
  const formatter = new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    timeZone: "America/Vancouver",
  });
  return `${formatter.format(startMs)} – ${formatter.format(endMs)}`;
}

export function relativeTime(targetMs, now = Date.now()) {
  if (!Number.isSafeInteger(targetMs)) return "Time unavailable";
  const difference = targetMs - now;
  const absolute = Math.abs(difference);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (absolute >= 86_400_000) {
    return formatter.format(Math.round(difference / 86_400_000), "day");
  }
  if (absolute >= 3_600_000) {
    return formatter.format(Math.round(difference / 3_600_000), "hour");
  }
  return formatter.format(Math.round(difference / 60_000), "minute");
}

export function leagueDateTime(value, timeZone) {
  if (
    !Number.isSafeInteger(value) ||
    typeof timeZone !== "string" ||
    timeZone.trim() !== timeZone ||
    timeZone === ""
  ) {
    return "Time unavailable";
  }
  try {
    const formatted = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone,
      timeZoneName: "short",
    }).format(new Date(value));
    return `${formatted} (${timeZone})`;
  } catch {
    return "Time unavailable";
  }
}
