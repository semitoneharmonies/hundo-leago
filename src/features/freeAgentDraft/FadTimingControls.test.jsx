import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { SessionContext } from '../session/sessionContext.js';
import { FadTimingControls } from './FadTimingControls.jsx';
const leagueId='11111111-1111-4111-8111-111111111111',fadId='22222222-2222-4222-8222-222222222222';
const status={leagueId,fadId,deadlineAtMs:Date.parse('2026-10-01T16:00:00Z'),weekOneAtMs:Date.parse('2026-10-08T16:00:00Z'),
  serverNowMs:Date.parse('2026-09-29T16:00:00Z'),held:true,canReschedule:true,blockedReason:null,reminderAlreadySent:true,
  rolloverTimesAtMs:[Date.parse('2026-10-03T16:00:00Z'),Date.parse('2026-10-04T16:00:00Z')]};
status.canEditDeadline=true;status.canEditActiveAuctions=false;
status.roundDates=[1,2].map(sequence=>({sequence,canEdit:true,blockedReason:null}));
function setup({data=status,failFirst=false,props={}}={}) {
  let attempts=0;
  const request=vi.fn(async(url,options={})=>{
    let result=data;
    if(url.endsWith('/preview'))result={...data,proposed:options.body,affectedAuctions:data.canEditActiveAuctions?2:0,previewHash:'c'.repeat(64)};
    if(url.endsWith('/apply')) {attempts++;if(failFirst&&attempts===1)throw Error('Connection interrupted');result={leagueId,fadId,id:'receipt',accepted:true,replayed:attempts>1};}
    options.validateData?.(result);return{data:result};
  });
  render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}>
    <SessionContext.Provider value={{status:'authenticated',httpClient:{request}}}><FadTimingControls leagueId={leagueId} fadId={fadId} {...props}/></SessionContext.Provider>
  </QueryClientProvider>);
  return{request,user:userEvent.setup()};
}
async function review(user) {
  await user.click(await screen.findByRole('button',{name:'Edit target and round dates'}));
  fireEvent.change(screen.getByLabelText('Candidate Card target'),{target:{value:'2026-10-02T10:00:00'}});
  await user.type(screen.getByLabelText('Reason for changing dates'),'Give managers another day');
  await user.click(screen.getByRole('button',{name:'Review date changes'}));
  await screen.findByRole('region',{name:'Draft timing preview'});
}
describe('FAD timing controls',()=>{
 it('uses the league time zone for calendar-selected dates and keeps untouched instants exact',async()=>{
  const data={...status,deadlineAtMs:status.deadlineAtMs+123,rolloverTimesAtMs:status.rolloverTimesAtMs.map(t=>t+456)};
  const {request,user}=setup({data,props:{timeZone:'America/Vancouver',calendarField:'1',renderCalendar:({onSelectDay,disabled})=><button disabled={disabled} onClick={()=>onSelectDay('2026-10-05')}>Select calendar day</button>}});
  await waitFor(()=>expect(screen.getByRole('button',{name:'Select calendar day'})).toBeEnabled());await user.click(screen.getByRole('button',{name:'Select calendar day'}));
  expect(screen.getByLabelText('Round 2 closes')).toHaveValue('2026-10-05T09:00');
  expect(request.mock.calls.some(([,o])=>o.method==='POST')).toBe(false);
  fireEvent.change(screen.getByLabelText('Reason for changing dates'),{target:{value:'Move the second round'}});
  await user.click(screen.getByRole('button',{name:'Review date changes'}));await screen.findByRole('region',{name:'Draft timing preview'});
  const body=request.mock.calls.find(([url])=>url.endsWith('/preview'))[1].body;
  expect(body.deadlineAtMs).toBe(data.deadlineAtMs);expect(body.rolloverTimesAtMs[0]).toBe(data.rolloverTimesAtMs[0]);expect(body.rolloverTimesAtMs[1]).toBe(Date.parse('2026-10-05T16:00:00Z'));
 });
 it('disables date selection for protected draft targets',async()=>{
  setup({data:{...status,canEditDeadline:false},props:{renderCalendar:({disabled})=><button disabled={disabled}>Select calendar day</button>}});
  await screen.findByText(/Candidate Card target:/);expect(screen.getByRole('button',{name:'Select calendar day'})).toBeDisabled();
 });
  it('reviews the number of affected active auctions without requesting bid contents',async()=>{
    const {user,request}=setup({data:{...status,held:false,canEditDeadline:false,canEditActiveAuctions:true}});
    await user.click(await screen.findByRole('button',{name:'Edit round dates'}));
    expect(screen.getByLabelText(/Round 1 closes/)).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Round 1 closes'),{target:{value:'2026-10-03T20:00:00'}});
    await user.type(screen.getByLabelText('Reason for changing dates'),'Give managers more time to bid');
    await user.click(screen.getByRole('button',{name:'Review date changes'}));
    expect(await screen.findByText(/2 open auctions will use the new closing times/)).toHaveTextContent('Bids and original acceptance records are preserved.');
    expect(request.mock.calls.every(([url])=>url.endsWith('/timing')||url.endsWith('/timing/preview'))).toBe(true);
    await user.click(screen.getByRole('button',{name:'Confirm date changes'}));
    expect(await screen.findByRole('status')).toHaveTextContent('Rounds and affected auctions will follow the new dates.');
  });
  it('keeps the deadline and protected rounds disabled during rapid auctions',async()=>{
    const {user,request}=setup({data:{...status,held:false,canEditDeadline:false,
      roundDates:[{sequence:1,canEdit:false,blockedReason:'This round has already opened.'},status.roundDates[1]]}});
    await user.click(await screen.findByRole('button',{name:'Edit future round dates'}));
    expect(screen.getByLabelText('Candidate Card target')).toBeDisabled();
    expect(screen.getByLabelText(/Round 1 closes/)).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Round 2 closes'),{target:{value:'2026-10-04T20:00:00'}});
    await user.type(screen.getByLabelText('Reason for changing dates'),'Move the final unused round');
    await user.click(screen.getByRole('button',{name:'Review date changes'}));
    expect(await screen.findByText(/Cards remain locked/)).toBeInTheDocument();
    expect(screen.queryByText(/Any hold or earlier processing authorization/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'Confirm date changes'}));
    expect(await screen.findByRole('status')).toHaveTextContent('Rounds and affected auctions will follow the new dates.');
    const proposed=request.mock.calls.find(([url])=>url.endsWith('/preview'))[1].body;
    expect(proposed.deadlineAtMs).toBe(status.deadlineAtMs);
    expect(proposed.rolloverTimesAtMs[0]).toBe(status.rolloverTimesAtMs[0]);
  });
  it('reads dates without hidden-card or bid requests and can discard a preview without writes',async()=>{
    const {request,user}=setup();
    await review(user);
    expect(screen.getByText(/earlier automatic reminder stays in history/)).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'Keep current dates'}));
    expect(request.mock.calls.every(([url])=>url.endsWith('/timing')||url.endsWith('/timing/preview'))).toBe(true);
  });
  it('discards reviewed dates after editing and retries uncertain confirmation with the same key',async()=>{
    const {request,user}=setup({failFirst:true});await review(user);
    fireEvent.change(screen.getByLabelText('Round 1 closes'),{target:{value:'2026-10-03T20:00:00'}});
    expect(screen.queryByRole('button',{name:'Confirm date changes'})).not.toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'Review date changes'}));
    await user.click(await screen.findByRole('button',{name:'Confirm date changes'}));
    await waitFor(()=>expect(screen.getByRole('button',{name:'Confirm date changes'})).toBeEnabled());
    await user.click(screen.getByRole('button',{name:'Confirm date changes'}));
    expect(await screen.findByRole('status')).toHaveTextContent('Draft schedule updated.');
    const sends=request.mock.calls.filter(([url])=>url.endsWith('/apply'));
    expect(sends).toHaveLength(2);expect(sends[0][1].body).toEqual(sends[1][1].body);expect(sends[0][1].idempotencyKey).toBe(sends[1][1].idempotencyKey);
  });
  it('rejects cross-league data and blocks editing when processing has started',async()=>{
    setup({data:{...status,leagueId:fadId}});
    expect(await screen.findByRole('alert')).toHaveTextContent('The draft schedule is unavailable.');
    expect(screen.queryByRole('button',{name:'Edit target and round dates'})).not.toBeInTheDocument();
  });
  it('shows the reason timing cannot change after cards are locked',async()=>{
    setup({data:{...status,canReschedule:false,blockedReason:'Cards are already locked.'}});
    expect(await screen.findByText('Cards are already locked.')).toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'Edit target and round dates'})).not.toBeInTheDocument();
  });
});
