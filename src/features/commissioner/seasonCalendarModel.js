import {calendarInputValue, calendarTimestamp} from '../../shared/leagueCalendar.js';

export const calendarDay = (time, zone) => calendarInputValue(time, zone).slice(0, 10);
export function offsetDay(day, count) {
  const value = new Date(day + 'T12:00:00Z');
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}
export function seasonStartYear(calendar, nowMs, zone) {
  const day = calendarDay(calendar?.regularSeasonStartsAtMs ?? nowMs, zone);
  return Number(day.slice(0, 4)) - (Number(day.slice(5, 7)) < 7 ? 1 : 0);
}
export function calendarMonths(year, firstMonth = 6) {
  return Array.from({length: 12}, (_, index) => {
    const first = new Date(Date.UTC(year, firstMonth + index, 1, 12));
    const yearNumber = first.getUTCFullYear(), monthNumber = first.getUTCMonth();
    const count = new Date(Date.UTC(yearNumber, monthNumber + 1, 0, 12)).getUTCDate();
    const prefix = yearNumber + '-' + String(monthNumber + 1).padStart(2, '0');
    return {key: prefix, label: new Intl.DateTimeFormat('en', {month:'long', year:'numeric', timeZone:'UTC'}).format(first),
      blanks: (first.getUTCDay() + 6) % 7,
      days: Array.from({length: count}, (_, day) => prefix + '-' + String(day + 1).padStart(2, '0'))};
  });
}
export function matchupCalendarEvents(weeks, statuses, zone) {
  return weeks.filter(w => Number.isSafeInteger(w.startsAtMs) && Number.isSafeInteger(w.endsAtMs) && w.endsAtMs > w.startsAtMs).map(w => {
    const status = statuses.find(row => row.id === w.id);
    return {id: w.id, kind:'matchup', label:'Week ' + (status?.sequence ?? '?'), sequence:status?.sequence ?? 0,
      firstDay:calendarDay(w.startsAtMs, zone), lastDay:calendarDay(w.endsAtMs - 1, zone), atMs:w.startsAtMs, endAtMs:w.endsAtMs};
  });
}
// Presentation of the approved 1-week / 1-week / Final format. The saved end
// remains authoritative when the commissioner has adjusted the playoff window.
export function playoffCalendarEvents(calendar,zone) {
  const start=calendar?.fantasyPlayoffsStartAtMs,end=calendar?.fantasyPlayoffsEndAtMs;
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||end<=start)return [];
  const local=calendarInputValue(start,zone),day=local.slice(0,10),time=local.slice(11);
  const boundaries=[start,...[7,14].map(days=>calendarTimestamp(offsetDay(day,days)+'T'+time,zone)),end];
  return ['Round 1','Round 2','Final'].flatMap((name,i)=>{
    const from=boundaries[i],to=Math.min(boundaries[i+1],end);
    return Number.isSafeInteger(from)&&Number.isSafeInteger(to)&&from<to?[{id:'playoff-round-'+(i+1),kind:'playoffs',label:'Playoffs · '+name,sequence:i+1,firstDay:calendarDay(from,zone),lastDay:calendarDay(to-1,zone),atMs:from,endAtMs:to}]:[];
  });
}
export function leagueCalendarEvents(calendar, weeks, statuses, savedEvents, zone) {
  const events = matchupCalendarEvents(weeks, statuses, zone);
  const labels = {regularSeasonStartsAtMs:'NHL season starts', regularSeasonEndsAtMs:'NHL season ends', fantasyPlayoffsStartAtMs:'Playoffs start', fantasyPlayoffsEndAtMs:'Playoffs end'};
  for (const [key,label] of Object.entries(labels)) if (Number.isSafeInteger(calendar?.[key])) {
    const day = calendarDay(calendar[key],zone);
    events.push({id:key,kind:'season',label,firstDay:day,lastDay:day,atMs:calendar[key]});
  }
  events.push(...playoffCalendarEvents(calendar,zone));
  for (const week of weeks) if (Number.isSafeInteger(week.locksAtMs)) {
    const day=calendarDay(week.locksAtMs,zone), sequence=statuses.find(w=>w.id===week.id)?.sequence;
    events.push({id:'lock:'+week.id,kind:'season',label:'Week '+sequence+' roster lock',firstDay:day,lastDay:day,atMs:week.locksAtMs});
  }
  for (const event of savedEvents) {
    const day=calendarDay(event.atMs,zone);
    events.push({...event,firstDay:day,lastDay:day});
  }
  return events.map(event=>Number.isSafeInteger(event.atMs)&&!['matchup','playoffs'].includes(event.kind)
    ? {...event,label:event.label+' · '+new Intl.DateTimeFormat('en',{timeZone:zone,hour:'numeric',minute:'2-digit'}).format(event.atMs)} : event);
}
// Preserve league-local wall-clock times over DST. Calendar end selections are
// inclusive days; saved boundaries remain exclusive midnight instants.
export function changeMatchupRange(weeks, statuses, id, firstDay, lastDay, zone) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(firstDay) || !/^\d{4}-\d{2}-\d{2}$/.test(lastDay) || lastDay < firstDay) return null;
  if ([firstDay,lastDay].some(day=>calendarTimestamp(day+'T12:00',zone)===null)) return null;
  const current = weeks.find(w => w.id === id);
  if (!current) return null;
  const startTime = current.startsAtMs.slice(11) || '00:00';
  const lockTime = current.locksAtMs.slice(11) || startTime;
  const start = firstDay + 'T' + startTime, end = offsetDay(lastDay, 1) + 'T00:00';
  const lockDayOffset = Math.round((Date.parse(current.locksAtMs.slice(0,10)+'T12:00:00Z')-Date.parse(current.startsAtMs.slice(0,10)+'T12:00:00Z'))/86400000);
  const lock = offsetDay(firstDay,lockDayOffset) + 'T' + lockTime;
  if ([start, end, lock].some(value => calendarTimestamp(value, zone) === null)) return null;
  if (lock < start || lock >= end) return null;
  const sequence = statuses.find(w => w.id === id)?.sequence;
  const previousId = statuses.find(w => w.sequence === sequence - 1)?.id;
  const previous = weeks.find(w => w.id === previousId);
  // Existing scoring requires baseline >= week start. Adjacent weeks share the
  // previous end. For a gap, baseline starts at the new week, excluding the gap.
  const baseline = previous?.endsAtMs === start ? previous.endsAtMs : start;
  return weeks.map(w => w.id === id ? {...w, startsAtMs:start, baselineAtMs:baseline, locksAtMs:lock, endsAtMs:end, rollsOverAtMs:end} : w);
}
