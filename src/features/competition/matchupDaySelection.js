// Dates are calendar labels from the backend, not instants in the browser timezone.
export function validMatchupDate(date) {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    && Number.isFinite(Date.parse(`${date}T12:00:00Z`))
    && new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date;
}

export function matchupDateLabel(date, options = { weekday: 'long', month: 'short', day: 'numeric' }) {
  return new Intl.DateTimeFormat('en-CA', { ...options, timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}

export function selectMatchupDay(days, selectedDate, today) {
  return days.find(day => day.date === selectedDate)
    || days.find(day => day.date === today)
    || days.filter(day => day.date < today).at(-1)
    || days[0];
}

export function matchupDayRows(days) {
  const rows = [];
  for (const day of days) {
    const weekday = (new Date(`${day.date}T12:00:00Z`).getUTCDay() + 6) % 7;
    if (!rows.length || weekday === 0) rows.push(Array(7).fill(null));
    rows.at(-1)[weekday] = day;
  }
  return rows;
}
