import {useMemo, useState} from 'react';
import {calendarDay, calendarMonths, seasonStartYear} from './seasonCalendarModel.js';
import styles from './SeasonYearCalendar.module.css';

const kinds = {matchup:'Matchups', playoffs:'Playoffs', trade:'Trade deadline', draft:'Draft dates', auction:'Auctions', season:'Season dates'};
const dayFormatter=new Intl.DateTimeFormat('en', {dateStyle:'long', timeZone:'UTC'});
const dayLabel = day => dayFormatter.format(new Date(day + 'T12:00:00Z'));

export function SeasonYearCalendar({calendar, events, timeZone, nowMs, selectedDay, selectedRange, onSelectDay, disabled=false, toolbar, children}) {
  const [view, setView] = useState('season');
  const initialYear = seasonStartYear(calendar, nowMs, timeZone);
  const [yearOffset, setYearOffset] = useState(0);
  const year = initialYear + yearOffset;
  const months = useMemo(() => calendarMonths(year, view === 'season' ? 6 : 0), [year, view]);
  const today = calendarDay(nowMs, timeZone);
  const itemsByDay = useMemo(() => {
    const result = new Map();
    for (const month of months) for (const day of month.days) result.set(day, events.filter(event => event.firstDay <= day && event.lastDay >= day));
    return result;
  }, [months, events]);
  const selectedEvents = itemsByDay.get(selectedDay) || [];
  return <section className={styles.calendar} aria-label="Interactive season calendar">
    <header className={styles.header}>
      <div><h3>{view === 'season' ? `July ${year} – June ${year + 1}` : year}</h3><span>All 12 months · {timeZone}</span></div>
      <div className={styles.navigation}>
        <button type="button" aria-label="Previous year" onClick={() => setYearOffset(v => v - 1)} disabled={disabled}>‹</button>
        <label>View<select value={view} disabled={disabled} onChange={e => setView(e.target.value)}><option value="season">Hockey season</option><option value="year">Calendar year</option></select></label>
        <button type="button" aria-label="Next year" onClick={() => setYearOffset(v => v + 1)} disabled={disabled}>›</button>
        {yearOffset !== 0 && <button type="button" onClick={() => setYearOffset(0)} disabled={disabled}>Current season</button>}
      </div>
    </header>
    <div className={styles.legend}>{Object.entries(kinds).map(([kind,label]) => <span key={kind}><i className={styles[kind]}/>{label}</span>)}</div>
    {toolbar && <div className={styles.toolbar}>{toolbar}</div>}
    <div className={styles.months}>
      {months.map(month => <section className={styles.month} key={month.key} aria-label={month.label}>
        <h4>{month.label}</h4>
        <div className={styles.weekdays} aria-hidden="true">{['M','T','W','T','F','S','S'].map((label,i) => <span key={i}>{label}</span>)}</div>
        <div className={styles.days}>
          {Array.from({length:month.blanks},(_,i) => <span key={'blank'+i}/>)}
          {month.days.map(day => {
            const items = itemsByDay.get(day), week = items.find(e => e.kind === 'matchup');
            const playoffs = items.some(e => e.kind === 'playoffs'), markers = items.filter(e => !['matchup','playoffs'].includes(e.kind));
            const inSelection = selectedRange?.firstDay && day >= selectedRange.firstDay && day <= (selectedRange.lastDay || selectedRange.firstDay);
            const labels = items.map(e => e.label);
            return <button type="button" key={day} disabled={disabled} data-day={day} data-week={week?.sequence} data-selected-range={inSelection || undefined}
              className={[styles.day, week ? styles[week.sequence % 2 ? 'weekOdd' : 'weekEven'] : '', playoffs ? styles.playoffDay : '', day === selectedDay ? styles.selected : '', inSelection ? styles.range : '', day === today ? styles.today : ''].filter(Boolean).join(' ')}
              aria-label={dayLabel(day) + (labels.length ? '; ' + labels.join('; ') : '')} aria-pressed={day === selectedDay}
              title={[dayLabel(day),...labels].join('\n')} onClick={() => onSelectDay(day,items)}>
              <span>{Number(day.slice(8))}</span>
              {week && (day === week.firstDay || new Date(day+'T12:00:00Z').getUTCDay() === 1 || day.endsWith('-01')) && <small>W{week.sequence}</small>}
              {markers.length > 0 && <span className={styles.markers} aria-hidden="true">{[...new Set(markers.map(e => e.kind))].slice(0,3).map(kind => <i key={kind} className={styles[kind]}/>)}</span>}
            </button>;
          })}
        </div>
      </section>)}
    </div>
    {selectedDay && <div className={styles.selection} aria-live="polite"><strong>{dayLabel(selectedDay)}</strong><span>{selectedEvents.length ? selectedEvents.map(event => event.label).join(' · ') : 'No league event scheduled'}</span></div>}
    {children}
  </section>;
}
