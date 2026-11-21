import { dailyNow } from "./dailyApi.js";

const permanentPacificFrom = Date.parse("2026-03-08T10:00:00Z");
const calendar = zone => new Intl.DateTimeFormat("en-CA", {timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit"});
const historicCalendar = calendar("America/Vancouver");
const pacificCalendar = calendar("Etc/GMT+7");

// Room dates use the same Pacific game-day calendar as Daily's schedule.
export function dailyGameDate(now = dailyNow()) {
  const parts = (now >= permanentPacificFrom ? pacificCalendar : historicCalendar).formatToParts(new Date(now));
  const value = type => parts.find(part => part.type === type).value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function isDailyHistoryRoom(room, today = dailyGameDate()) {
  return room.phase === "finished" && /^\d{4}-\d{2}-\d{2}$/.test(room.date) && room.date < today;
}
