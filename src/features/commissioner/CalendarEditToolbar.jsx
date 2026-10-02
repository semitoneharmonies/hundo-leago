import styles from './SeasonYearCalendar.module.css';

const categoryOf=target=>target.startsWith('week:')?'weeks':target==='auctions'||target.startsWith('draft:')?'auctions':target.includes('fantasyPlayoffs')?'playoffs':target.startsWith('season:')?'season':target;
export function CalendarEditToolbar({target,onChange,weekStatus,seasonDateLabels,draftEvents,blocked,busy,editing,external,range,onOpenEditor}) {
 const firstWeek=weekStatus.find(w=>!['final','cancelled'].includes(w.status));
 const categories=[['browse','View dates','browse'],['weeks','Matchup weeks',firstWeek?'week:'+firstWeek.id:null],['auctions','Auction dates','auctions'],['trade','Trade deadline','trade'],['playoffs','Playoffs','season:fantasyPlayoffsStartAtMs'],['season','Season dates','season:regularSeasonStartsAtMs']];
 const category=categoryOf(target), locked=busy||(external&&editing);
 return <>
  <div className={styles.editTabs} role="group" aria-label="What would you like to edit?">
   {categories.map(([key,label,value])=><button key={key} type="button" aria-pressed={category===key}
    disabled={locked||!value||(blocked&&['weeks','playoffs','season'].includes(key))||(editing&&!external&&['auctions','trade'].includes(key))}
    onClick={()=>onChange(value)}>{label}</button>)}
  </div>
  <label>Editing<select aria-label="Calendar action" value={target} disabled={locked} onChange={e=>onChange(e.target.value)}>
   <option value="browse">View dates</option>
   <optgroup label="Matchups">{weekStatus.map(w=><option key={w.id} value={'week:'+w.id} disabled={blocked||['final','cancelled'].includes(w.status)}>Week {w.sequence}{['final','cancelled'].includes(w.status)?' (protected)':''}</option>)}</optgroup>
   <optgroup label="Season and playoffs">{Object.entries(seasonDateLabels).map(([key,label])=><option key={key} value={'season:'+key} disabled={blocked}>{label}</option>)}</optgroup>
   <option value="trade" disabled={editing&&!external}>Trade deadline</option>
   <option value="auctions" disabled={editing&&!external}>Weekly auction closing day and cutoff</option>
   {draftEvents.length>0&&<optgroup label="Free Agent Draft">{draftEvents.map(e=><option key={e.id} value={'draft:'+e.id} disabled={editing&&!external}>{e.label}</option>)}</optgroup>}
  </select></label>
  <p>{category==='weeks' ? range?.firstDay&&!range.lastDay ? 'Now click the last day of this matchup.' : 'Choose a week, then click its first and last days. Dates and save controls open next.' : target==='auctions' ? 'Choose a weekday for all new weekly auctions, then set its time and cutoff. Existing auctions have a separate edit link below.' : target==='browse' ? 'Choose a tool above, or click a day to see its events.' : 'Click the new date. Adjust the time, review, then confirm.'}</p>
  {target!=='browse'&&<button type="button" disabled={busy} onClick={onOpenEditor}>Dates &amp; save ↓</button>}
 </>;
}
