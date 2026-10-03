import {describe,it,expect} from 'vitest';
import {calendarWorkspaceFixture} from '../../../e2e/fixtures/calendar-workspace-data.js';
import {calendarTimestamp} from '../../shared/leagueCalendar.js';
import {makeCalendarDraft,moveMatchupStart,moveMatchupBoundary,calendarOperations,editableCalendarEvents,stageCalendarEdit,workspaceEvents,calendarEventChoices} from './calendarWorkspaceModel.js';
const at=s=>calendarTimestamp(s,'America/Vancouver');
describe('calendar draft boundaries',()=>{
 it('groups a shared end and start into one choice, while keeping separate boundaries distinct',()=>{
  const original=calendarWorkspaceFixture(),draft=makeCalendarDraft(original),items=editableCalendarEvents(original,draft).filter(e=>e.type==='week'&&e.edge!=='lock');
  const choices=calendarEventChoices(items,draft,original);expect(choices).toHaveLength(4);
  expect(choices.filter(e=>e.label.includes('Week 1 ends / Week 2 starts'))).toHaveLength(1);
  draft.weeks[0].endsAtMs-=86400000;
  expect(calendarEventChoices(items,draft,original)).toHaveLength(5);
 });
 it('creates a Christmas gap, preserves it on later edits, and rejoins only when requested',()=>{
  const original=calendarWorkspaceFixture();original.weeks=original.weeks.map((w,i)=>({...w,startsAtMs:at('2026-12-'+(14+i*7)+'T00:00'),baselineAtMs:at('2026-12-'+(14+i*7)+'T00:00'),locksAtMs:at('2026-12-'+(14+i*7)+'T12:00'),endsAtMs:at(i===2?'2027-01-04T00:00':'2026-12-'+(21+i*7)+'T00:00'),rollsOverAtMs:at(i===2?'2027-01-04T00:00':'2026-12-'+(21+i*7)+'T00:00')}));
  const draft=makeCalendarDraft(original),event={type:'week',recordId:draft.weeks[1].id,edge:'end'};
  const separated=stageCalendarEdit(draft,original,event,at('2026-12-23T00:00'),undefined,{moveTogether:false,otherAtMs:at('2026-12-26T00:00')});
  expect(separated.weeks[1].endsAtMs).toBe(at('2026-12-23T00:00'));expect(separated.weeks[2].startsAtMs).toBe(at('2026-12-26T00:00'));expect(separated.weeks[2].locksAtMs).toBe(at('2026-12-26T12:00'));
  const gap=workspaceEvents(original,separated).find(e=>e.kind==='league-break');expect(gap.firstDay).toBe('2026-12-23');expect(gap.lastDay).toBe('2026-12-25');
  const later=moveMatchupBoundary(separated,original,draft.weeks[2].id,'start',at('2026-12-27T00:00'));
  expect(later.weeks[1]).toEqual(separated.weeks[1]);
  const rejoined=moveMatchupBoundary(later,original,draft.weeks[2].id,'start',at('2026-12-27T00:00'),{moveTogether:true});
  expect(rejoined.weeks[1].endsAtMs).toBe(rejoined.weeks[2].startsAtMs);expect(workspaceEvents(original,rejoined).some(e=>e.kind==='league-break')).toBe(false);
  expect(()=>moveMatchupBoundary(separated,original,draft.weeks[2].id,'start',at('2026-12-22T00:00'))).toThrow(/overlap/);
  expect(draft).toEqual(makeCalendarDraft(original));
 });
 it('validates both separate dates together and never edits an unchanged processed neighbour',()=>{
  const original=calendarWorkspaceFixture(),draft=makeCalendarDraft(original);
  const next=moveMatchupBoundary(draft,original,draft.weeks[1].id,'end',at('2026-10-21T00:00'),{moveTogether:false,otherAtMs:at('2026-10-22T00:00')});
  expect(next.weeks[2].startsAtMs).toBe(at('2026-10-22T00:00'));expect(next.weeks[1].endsAtMs).toBe(at('2026-10-21T00:00'));
  original.weekStatus[0].status='final';
  const separate=moveMatchupBoundary(draft,original,draft.weeks[1].id,'start',at('2026-10-13T00:00'),{moveTogether:false});
  expect(separate.weeks[0]).toEqual(draft.weeks[0]);
 });
 it('puts the playoff end on its inclusive last day while preserving the saved midnight boundary',()=>{
  const original=calendarWorkspaceFixture(),draft=makeCalendarDraft(original);
  draft.calendar.fantasyPlayoffsEndAtMs=at('2027-04-12T00:00');
  const end=editableCalendarEvents(original,draft).find(e=>e.field==='fantasyPlayoffsEndAtMs');
  expect(end.firstDay).toBe('2027-04-11');expect(end.lastDay).toBe('2027-04-11');expect(end.edge).toBe('end');expect(end.atMs).toBe(at('2027-04-12T00:00'));
  expect(workspaceEvents(original,draft).find(e=>e.kind==='playoffs'&&e.sequence===3).lastDay).toBe('2027-04-11');
 });
 it('dragging a cutoff changes only the gap, keeping the weekly closing clock',()=>{
  const original=calendarWorkspaceFixture(),draft=makeCalendarDraft(original),event=workspaceEvents(original,draft).find(e=>e.type==='schedule-cutoff');
  const next=stageCalendarEdit(draft,original,event,event.closeAtMs-120*60000);
  expect(next.schedule).toEqual({...draft.schedule,creationCutoffMinutes:120});
  expect(()=>stageCalendarEdit(draft,original,event,event.closeAtMs+60000)).toThrow(/cutoff/);
 });
 it('moves the previous end and start/lock/baseline together without changing saved input',()=>{
  const original=calendarWorkspaceFixture(),draft=makeCalendarDraft(original),before=structuredClone(draft);
  const next=moveMatchupBoundary(draft,original,draft.weeks[1].id,'start',at('2026-10-11T09:30'));
  expect(draft).toEqual(before);expect(next.weeks[0].endsAtMs).toBe(at('2026-10-11T09:30'));expect(next.weeks[0].rollsOverAtMs).toBe(next.weeks[1].startsAtMs);
  expect(next.weeks[1].baselineAtMs).toBe(next.weeks[1].startsAtMs);expect(next.weeks[1].locksAtMs).toBe(at('2026-10-11T21:30'));
 });
 it('keeps a lock at the start attached when changing only the start time, earlier or later',()=>{
  const week={startsAtMs:at('2026-10-12T12:00'),locksAtMs:at('2026-10-12T12:00')};
  for(const time of ['09:30','15:00']){const start=at('2026-10-12T'+time);expect(moveMatchupStart(week,start,'America/Vancouver').locksAtMs).toBe(start);}
 });
 it('preserves a custom local lock gap over the autumn clock change',()=>{
  const week={startsAtMs:at('2026-10-31T00:00'),locksAtMs:at('2026-10-31T12:00')};
  expect(moveMatchupStart(week,at('2026-11-02T09:30'),'America/Vancouver').locksAtMs).toBe(at('2026-11-02T21:30'));
 });
 it('rejects an automatic lock at a nonexistent spring clock time instead of silently changing it',()=>{
  const week={startsAtMs:at('2027-03-07T00:00'),locksAtMs:at('2027-03-07T02:30')};
  expect(()=>moveMatchupStart(week,at('2027-03-14T00:00'),'America/Vancouver')).toThrow(/daylight-saving/);
 });
 it('moves the following start when dragging an end, preserving local lock time',()=>{
  const original=calendarWorkspaceFixture(),draft=makeCalendarDraft(original);
  const next=moveMatchupBoundary(draft,original,draft.weeks[1].id,'end',at('2026-10-20T00:00'));
  expect(next.weeks[2].startsAtMs).toBe(next.weeks[1].endsAtMs);expect(next.weeks[2].locksAtMs).toBe(at('2026-10-20T12:00'));
 });
 it('rejects a completed neighbour, invalid short weeks and elapsed boundaries',()=>{
  const original=calendarWorkspaceFixture(),draft=makeCalendarDraft(original);original.weekStatus[0].status='final';
  expect(()=>moveMatchupBoundary(draft,original,draft.weeks[1].id,'start',at('2026-10-11T00:00'))).toThrow(/completed/);
  original.weekStatus[0].status='scheduled';
  expect(()=>moveMatchupBoundary(draft,original,draft.weeks[1].id,'start',at('2026-10-04T00:00'))).toThrow(/without room/);
 });
 it('keeps several edit categories in one payload and restores to no operations',()=>{
  const original=calendarWorkspaceFixture();let draft=makeCalendarDraft(original);
  draft=stageCalendarEdit(draft,original,{type:'trade'},at('2027-02-13T16:00'));
  draft=stageCalendarEdit(draft,original,{type:'schedule'},at('2026-10-10T15:00'),90);
  draft=stageCalendarEdit(draft,original,{type:'fad',recordId:draft.drafts[0].id,index:-1},at('2026-10-01T16:00'));
  expect(calendarOperations(original,draft).map(o=>o.kind)).toEqual(['trade','schedule','fad']);
  expect(calendarOperations(original,makeCalendarDraft(original))).toEqual([]);
  expect(workspaceEvents(original,draft).some(e=>e.recurring&&e.firstDay==='2026-10-10')).toBe(true);
 });
 it('shows shared-day boundaries, FAD deadlines, verified breaks and protected history',()=>{
  const original=calendarWorkspaceFixture(),draft=makeCalendarDraft(original),events=workspaceEvents(original,draft);
  expect(events.filter(e=>e.firstDay==='2026-10-11').map(e=>e.label)).toContain('Week 1 ends');
  expect(events.filter(e=>e.firstDay==='2026-10-11').map(e=>e.label)).toContain('Weekly auctions close');
  expect(events.some(e=>e.kind==='break'&&e.label==='Christmas break')).toBe(true);
  expect(editableCalendarEvents(original,draft).some(e=>e.type==='fad'&&e.index===-1)).toBe(true);
 });
});
