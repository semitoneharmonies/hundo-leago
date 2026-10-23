import {useEffect, useMemo, useRef, useState} from 'react';
import {calendarDay, calendarMonths, seasonStartYear} from './seasonCalendarModel.js';
import styles from './SeasonYearCalendar.module.css';

const kinds = {weekOdd:'Matchup week', weekEven:'Next week', playoff1:'Round 1',playoff2:'Round 2',playoff3:'Final',trade:'Trade deadline', draft:'FAD / draft dates', auction:'Auction closes', 'auction-cutoff':'New-auction cutoff',break:'NHL break','league-break':'Matchup break'};
const dayFormatter=new Intl.DateTimeFormat('en', {dateStyle:'long', timeZone:'UTC'});
const dayLabel = day => dayFormatter.format(new Date(day + 'T12:00:00Z'));

export function SeasonYearCalendar({calendar, events, timeZone, nowMs, selectedDay, selectedRange, onSelectDay, onMoveEvent, spacious=false, disabled=false, toolbar, children, movingEvent, onCancelMove}) {
  const gesture=useRef(null),ignoreClick=useRef(false),scrollRef=useRef(null),frameRef=useRef(null),[dragDay,setDragDay]=useState(null);
  const [layout,setLayout]=useState(spacious?'connected':'months');
  const connected=layout==='connected';
  useEffect(()=>{
    if(!connected)return;
    const header=document.querySelector('.hl-app-header'),scroller=scrollRef.current,frame=frameRef.current;
    const measure=()=>{
      frame.style.setProperty('--calendar-header-top',(header?.getBoundingClientRect().height||0)+'px');
      frame.style.setProperty('--calendar-scrollbar-width',Math.max(0,scroller.offsetWidth-scroller.clientWidth-2)+'px');
    };
    measure();
    if(typeof ResizeObserver==='undefined')return;
    const observer=new ResizeObserver(measure);observer.observe(scroller);if(header)observer.observe(header);
    return()=>observer.disconnect();
  },[connected]);
  function down(event,day,items){
    if(!onMoveEvent||disabled||event.button!==0||!items.some(i=>i.type&&!i.blockedReason))return;
    if(event.pointerType==='touch'&&!event.target.closest('[data-drag-handle]'))return;
    gesture.current={day,items,x:event.clientX,y:event.clientY,moved:false};
  }
  function move(event){
    const g=gesture.current;if(!g)return;
    if(Math.hypot(event.clientX-g.x,event.clientY-g.y)>7){g.moved=true;event.currentTarget.setPointerCapture?.(event.pointerId);}
    if(!g.moved)return;
    const day=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-day]')?.dataset.day;
    setDragDay(day||null);
    const scroller=connected?scrollRef.current:null,rect=scroller?.getBoundingClientRect();
    if(event.clientY>Math.min(rect?.bottom??window.innerHeight,window.innerHeight)-16)(scroller||window).scrollBy(0,18);
    else if(event.clientY<Math.max(rect?.top??0,0)+16)(scroller||window).scrollBy(0,-18);
  }
  function up(event){
    const g=gesture.current;gesture.current=null;setDragDay(null);
    if(!g?.moved)return;
    ignoreClick.current=true;
    const day=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-day]')?.dataset.day;
    if(day&&day!==g.day)onMoveEvent(g.day,day,g.items,{x:event.clientX,y:event.clientY});
  }
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
  function jumpTo(day){
    const scroller=scrollRef.current,cell=scroller?.querySelector('[data-day="'+day+'"]');
    if(cell)scroller.scrollTop+=cell.getBoundingClientRect().top-scroller.getBoundingClientRect().top-40;
  }
  useEffect(()=>{
    if(!connected)return;
    const target=events.find(e=>e.kind==='matchup')?.firstDay||calendarDay(calendar?.regularSeasonStartsAtMs??nowMs,timeZone);
    jumpTo(target);
    // Keep the current scroll position during edits; only navigation or picking a destination jumps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[connected,year,view]);
  useEffect(()=>{if(connected&&movingEvent)jumpTo(movingEvent.firstDay);},[connected,movingEvent]);
  return <section className={[styles.calendar,spacious?styles.spacious:''].join(' ')} aria-label="Interactive season calendar">
    <header className={styles.header}>
      <div><h3>{view === 'season' ? `July ${year} – June ${year + 1}` : year}</h3><span>All 12 months · {timeZone}</span></div>
      <div className={styles.navigation}>
        <button type="button" aria-label="Previous year" onClick={() => setYearOffset(v => v - 1)} disabled={disabled}>‹</button>
        <label>View<select value={view} disabled={disabled} onChange={e => setView(e.target.value)}><option value="season">Hockey season</option><option value="year">Calendar year</option></select></label>
        {spacious&&<label>Layout<select aria-label="Layout" value={layout} disabled={disabled} onChange={e=>setLayout(e.target.value)}><option value="connected">Continuous calendar</option><option value="months">Month overview</option></select></label>}
        <button type="button" aria-label="Next year" onClick={() => setYearOffset(v => v + 1)} disabled={disabled}>›</button>
        {yearOffset !== 0 && <button type="button" onClick={() => setYearOffset(0)} disabled={disabled}>Current season</button>}
      </div>
    </header>
    <div className={styles.legend}>{Object.entries(kinds).map(([kind,label]) => <span key={kind}><i className={styles[kind]}/>{label}</span>)}</div>
    {toolbar && <div className={styles.toolbar}>{toolbar}</div>}
    {movingEvent&&<div className={styles.movePrompt} role="status"><strong>Moving {movingEvent.label.toLowerCase()}. Click its new day below.</strong><button type="button" onClick={onCancelMove}>Cancel move</button></div>}
    {connected&&<nav className={styles.monthJumps} aria-label="Jump to month">{months.map(m=><button key={m.key} type="button" disabled={disabled} onClick={()=>jumpTo(m.days[0])}>{m.label.slice(0,3)} <small>{m.key.slice(0,4)}</small></button>)}</nav>}
    {selectedDay && <div className={styles.selection} aria-live="polite"><strong>{dayLabel(selectedDay)}</strong><span>{selectedEvents.length ? selectedEvents.map(event => event.label).join(' · ') : 'No league event scheduled'}</span></div>}
    <div ref={frameRef} className={connected?styles.connectedFrame:undefined}>
    {connected&&<div className={styles.connectedWeekdays} data-calendar-weekdays aria-hidden="true">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><span key={d}>{d}</span>)}</div>}
    <div ref={scrollRef} className={connected?styles.connectedScroll:undefined} data-calendar-scroll={connected||undefined}>
    <div className={connected?styles.connected:styles.months} data-calendar-layout={layout}>
      {connected&&Array.from({length:months[0].blanks},(_,i)=><span key={'leading'+i}/>)}
      {months.map(month => <section className={styles.month} key={month.key} aria-label={month.label}>
        <h4>{month.label}</h4>
        {!connected&&<div className={styles.weekdays} aria-hidden="true">{['M','T','W','T','F','S','S'].map((label,i) => <span key={i}>{label}</span>)}</div>}
        <div className={styles.days}>
          {!connected&&Array.from({length:month.blanks},(_,i) => <span key={'blank'+i}/>)}
          {month.days.map(day => {
            const items = itemsByDay.get(day), week = items.filter(e => e.kind === 'matchup').sort((a,b)=>b.atMs-a.atMs)[0];
            const playoffs = items.filter(e => e.kind === 'playoffs').sort((a,b)=>b.atMs-a.atMs)[0], markers = items.filter(e => !['matchup','playoffs'].includes(e.kind)),off=items.find(e=>['break','league-break'].includes(e.kind));
            const boundary=items.find(e=>e.type==='week'&&e.edge==='start')||items.find(e=>e.type==='fad')||items.find(e=>e.type==='auction')||items.find(e=>e.type==='schedule')||items.find(e=>e.kind==='trade');
            const inSelection = selectedRange?.firstDay && day >= selectedRange.firstDay && day <= (selectedRange.lastDay || selectedRange.firstDay);
            const labels = items.map(e => e.label);
            const captions=items.filter(e=>e.kind==='break'||((e.type||e.blockedReason)&&e.edge!=='lock'));
            return <button type="button" key={day} disabled={disabled} data-day={day} data-week={week?.sequence} data-playoff-round={playoffs?.sequence} data-auction-close={items.some(e=>e.kind==='auction')||undefined} data-auction-cutoff={items.some(e=>e.kind==='auction-cutoff')||undefined} data-selected-range={inSelection || undefined}
              className={[styles.day, week ? styles[week.sequence % 2 ? 'weekOdd' : 'weekEven'] : '', playoffs ? styles['playoff'+playoffs.sequence] : '',off?styles.offDay:'',day===dragDay?styles.dropTarget:'', day === selectedDay ? styles.selected : '', inSelection ? styles.range : '', day === today ? styles.today : ''].filter(Boolean).join(' ')}
              aria-label={dayLabel(day) + (labels.length ? '; ' + labels.join('; ') : '')} aria-pressed={day === selectedDay}
              title={[dayLabel(day),...labels].join('\n')}
              onPointerDown={e=>down(e,day,items)} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{gesture.current=null;setDragDay(null);}}
              onClick={e=>{if(ignoreClick.current){ignoreClick.current=false;return;}const rect=e.currentTarget.getBoundingClientRect();onSelectDay(day,items,{x:e.clientX||rect.left+10,y:e.clientY||rect.top+10});}}>
              <span className={connected?styles.dateNumber:undefined}>{connected&&<span>{month.label.slice(0,3)} </span>}{Number(day.slice(8))}</span>
              {week && (day === week.firstDay || new Date(day+'T12:00:00Z').getUTCDay() === 1 || day.endsWith('-01')) && <small>W{week.sequence}</small>}
              {playoffs && (day===playoffs.firstDay||new Date(day+'T12:00:00Z').getUTCDay()===1||day.endsWith('-01')) && <small>{playoffs.sequence===3?'F':'R'+playoffs.sequence}</small>}
              {connected?<span className={styles.eventLabels}>{captions.slice(0,2).map(e=><span key={e.id} data-event-label={e.id}>{e.label}</span>)}{captions.length>2&&<em>+{captions.length-2} more</em>}</span>:<>
                {spacious&&boundary&&<span className={styles.eventCaption}>{boundary.type==='week'?'Start':boundary.type==='fad'?'FAD':boundary.type==='trade'?'Trade':'Auction'}</span>}
                {spacious&&off&&<span className={styles.breakCaption}>{off.label}</span>}
                {markers.length>0&&<span className={styles.markers} aria-hidden="true">{[...new Set(markers.map(e=>e.kind))].slice(0,3).map(kind=><i key={kind} className={styles[kind]}/>)}</span>}
              </>}
              {spacious&&items.some(e=>e.type&&!e.blockedReason)&&<span data-drag-handle className={styles.dragHandle} aria-hidden="true">⠿</span>}
            </button>;
          })}
        </div>
        {spacious&&!connected&&<div className={styles.monthFooter}>{events.filter(e=>e.kind==='matchup'&&e.firstDay<=month.days.at(-1)&&e.lastDay>month.days.at(-1)).map(e=><span key={e.id}>{e.label} continues →</span>)}</div>}
      </section>)}
    </div>
    </div>
    </div>
    {children}
  </section>;
}
