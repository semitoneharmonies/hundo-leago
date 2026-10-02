import {describe,it,expect} from 'vitest';
import {calendarMonths,changeMatchupRange,leagueCalendarEvents,seasonStartYear,playoffCalendarEvents} from './seasonCalendarModel.js';
import {calendarTimestamp} from '../../shared/leagueCalendar.js';
const zone='America/Vancouver';
const weeks=[{id:'previous',startsAtMs:'2026-10-25T00:00',endsAtMs:'2026-11-01T00:00'},
 {id:'week',startsAtMs:'2026-10-19T00:00',baselineAtMs:'2026-10-19T00:00',locksAtMs:'2026-10-19T12:00',endsAtMs:'2026-10-26T00:00',rollsOverAtMs:'2026-10-26T00:00'}];
const statuses=[{id:'previous',sequence:1},{id:'week',sequence:2}];
describe('year calendar date handling',()=>{
 it('separates playoff rounds into one week, one week and the Final across DST',()=>{
  const events=playoffCalendarEvents({fantasyPlayoffsStartAtMs:calendarTimestamp('2027-03-08T00:00',zone),fantasyPlayoffsEndAtMs:calendarTimestamp('2027-04-05T00:00',zone)},zone);
  expect(events.map(e=>[e.sequence,e.firstDay,e.lastDay])).toEqual([[1,'2027-03-08','2027-03-14'],[2,'2027-03-15','2027-03-21'],[3,'2027-03-22','2027-04-04']]);
  expect(events[0].endAtMs-events[0].atMs).toBe(167*3600000);
 });
 it('includes twelve months across a hockey season and leap day',()=>{
  const months=calendarMonths(2027);expect(months).toHaveLength(12);expect(months[0].key).toBe('2027-07');expect(months[11].key).toBe('2028-06');
  expect(months.find(m=>m.key==='2028-02').days).toContain('2028-02-29');expect(calendarMonths(2027,0)[11].key).toBe('2027-12');
  expect(seasonStartYear({regularSeasonStartsAtMs:Date.parse('2027-01-10T12:00:00Z')},0,zone)).toBe(2026);
 });
 it('keeps local lock time across daylight saving and includes the selected last day',()=>{
  const result=changeMatchupRange(weeks,statuses,'week','2026-11-01','2026-11-07',zone);
  expect(result[0]).toBe(weeks[0]);expect(result[1]).toEqual({...weeks[1],startsAtMs:'2026-11-01T00:00',baselineAtMs:weeks[0].endsAtMs,locksAtMs:'2026-11-01T12:00',endsAtMs:'2026-11-08T00:00',rollsOverAtMs:'2026-11-08T00:00'});
  expect(calendarTimestamp(result[1].endsAtMs,zone)-calendarTimestamp(result[1].startsAtMs,zone)).toBe(169*3600000);
  expect(weeks[1].startsAtMs).toBe('2026-10-19T00:00');
 });
 it('rejects backwards, invalid and nonexistent DST times',()=>{
  expect(changeMatchupRange(weeks,statuses,'week','2026-11-07','2026-11-01',zone)).toBeNull();
  expect(changeMatchupRange(weeks,statuses,'week','2026-02-30','2026-03-01',zone)).toBeNull();
  expect(changeMatchupRange(weeks,statuses,'week','','2026-11-01',zone)).toBeNull();
  expect(changeMatchupRange([{...weeks[1],locksAtMs:'2026-10-19T02:30'}],statuses,'week','2027-03-14','2027-03-20',zone)).toBeNull();
 });
 it('retains a roster lock that intentionally occurs after the opening day',()=>{
  const result=changeMatchupRange([{...weeks[1],locksAtMs:'2026-10-20T12:00'}],statuses,'week','2026-11-01','2026-11-07',zone);
  expect(result[0].locksAtMs).toBe('2026-11-02T12:00');
 });
 it('does not highlight the following week or expose any private data in event labels',()=>{
  const week=Object.fromEntries(Object.entries(weeks[1]).map(([k,v])=>[k,k==='id'?v:calendarTimestamp(v,zone)]));
  const events=leagueCalendarEvents({},[week],statuses,[{id:'trade',label:'Trade deadline',kind:'trade',atMs:calendarTimestamp('2026-10-23T16:00',zone)}],zone);
  expect(events.find(e=>e.kind==='matchup')).toMatchObject({firstDay:'2026-10-19',lastDay:'2026-10-25'});
  expect(events.find(e=>e.kind==='trade')).toMatchObject({firstDay:'2026-10-23',lastDay:'2026-10-23',label:'Trade deadline · 4:00 PM'});
 });
});
