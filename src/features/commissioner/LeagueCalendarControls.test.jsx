import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {describe,it,expect,vi} from 'vitest';
import {SessionContext} from '../session/sessionContext.js';
import {LeagueCalendarControls} from './LeagueCalendarControls.jsx';
const at=Date.parse,leagueId='11111111-1111-4111-8111-111111111111';
const status={leagueId,seasonId:'season',timeZone:'America/Vancouver',serverNowMs:at('2026-09-29T19:00:00Z'),
 calendar:{regularSeasonStartsAtMs:at('2026-10-06T07:00:00Z'),regularSeasonEndsAtMs:at('2027-04-12T07:00:00Z'),
 fantasyPlayoffsStartAtMs:at('2027-03-15T07:00:00Z'),fantasyPlayoffsEndAtMs:at('2027-04-12T07:00:00Z')},
 weeks:[{id:'week',startsAtMs:at('2026-10-19T07:00:00Z'),baselineAtMs:at('2026-10-19T07:00:01.123Z'),
 locksAtMs:at('2026-10-19T19:00:00Z'),endsAtMs:at('2026-10-26T07:00:00Z'),rollsOverAtMs:at('2026-10-26T07:00:00Z')}],
 weekStatus:[{id:'week',sequence:2,status:'scheduled'}],history:[]};
function setup({data=status,failFirst=false,malformed=false}={}){
 let attempts=0;const request=vi.fn(async(url,options={})=>{
  let result=data;
  if(url.endsWith('/calendar/trade-deadline'))result={leagueId,timeZone:data.timeZone,tradeDeadlineAtMs:at('2027-02-15T00:00:00Z'),serverNowMs:data.serverNowMs,canEdit:true,blockedReason:null,history:[]};
  if(url.endsWith('/preview'))result={...data,proposed:options.body,previewHash:'a'.repeat(64),seasonFields:[],pendingJobs:1,reopensAuctions:false,closesAuctions:false,
   changes:[{id:'week',sequence:2,fields:['locksAtMs'],before:data.weeks[0],after:options.body.weeks[0]}]};
  if(malformed&&url.endsWith('/preview'))result.pendingJobs=-1;
  if(url.endsWith('/apply')){attempts++;if(failFirst&&attempts===1)throw Error('Connection interrupted');result={leagueId,id:'change',accepted:true,replayed:attempts>1};}
  options.validateData?.(result);return {data:result};
 });
 render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}>
  <SessionContext.Provider value={{status:'authenticated',httpClient:{request}}}><LeagueCalendarControls leagueId={leagueId}/></SessionContext.Provider>
 </QueryClientProvider>);return {request,user:userEvent.setup()};
}
async function review(user){
 await user.click(await screen.findByRole('button',{name:'Edit league calendar'}));
 fireEvent.change(screen.getByLabelText('Roster lock — week 2'),{target:{value:'2026-10-19T13:00'}});
 await user.type(screen.getByLabelText('Reason for calendar changes'),'Managers need another hour');
 await user.click(screen.getByRole('button',{name:'Review calendar changes'}));
}
describe('League calendar controls',()=>{
 it('shows all twelve months and prepares inclusive matchup dates without writing',async()=>{
  const {request,user}=setup();await screen.findByRole('button',{name:'Edit league calendar'});
  expect(screen.getByRole('region',{name:'July 2026'})).toBeVisible();expect(screen.getByRole('region',{name:'June 2027'})).toBeVisible();
  await user.selectOptions(screen.getByLabelText('Calendar action'),'week:week');
  await user.click(screen.getByRole('button',{name:/^November 1, 2026/}));
  expect(screen.getByText('Now click the last day of this matchup.')).toBeVisible();
  await user.click(screen.getByRole('button',{name:/^November 7, 2026/}));
  expect(screen.getByLabelText('First matchup day')).toHaveValue('2026-11-01');expect(screen.getByLabelText('Last matchup day')).toHaveValue('2026-11-07');
  expect(screen.getByLabelText('Roster lock time')).toHaveValue('12:00');
  expect(request.mock.calls.some(([,o])=>o.method==='POST')).toBe(false);
  fireEvent.change(screen.getByLabelText('Reason for calendar changes'),{target:{value:'Adjust matchup dates'}});
  await user.click(screen.getByRole('button',{name:'Review calendar changes'}));
  await screen.findByRole('region',{name:'Calendar change preview'});
  const body=request.mock.calls.find(([url])=>url.endsWith('/preview'))[1].body;
  expect(body.weeks[0]).toMatchObject({startsAtMs:at('2026-11-01T07:00:00Z'),baselineAtMs:at('2026-11-01T07:00:00Z'),locksAtMs:at('2026-11-01T20:00:00Z'),endsAtMs:at('2026-11-08T08:00:00Z'),rollsOverAtMs:at('2026-11-08T08:00:00Z')});
  expect(request.mock.calls.some(([url])=>url.endsWith('/apply'))).toBe(false);
 });
 it('edits a trade deadline from the same calendar while preserving its local time',async()=>{
  const {request,user}=setup();await screen.findByRole('button',{name:'Edit league calendar'});
  await user.selectOptions(screen.getByLabelText('Calendar action'),'trade');await screen.findByRole('button',{name:'Edit trade deadline'});
  await user.click(screen.getByRole('button',{name:/^February 16, 2027/}));
  expect(screen.getByLabelText('New trade deadline (America/Vancouver)')).toHaveValue('2027-02-16T16:00');
  expect(screen.getByLabelText('Calendar action')).toBeDisabled();
  expect(request.mock.calls.some(([,o])=>o.method==='POST')).toBe(false);
 });
 it('highlights draft deadlines without including card contents',async()=>{
  setup({data:{...status,events:[{id:'target',kind:'draft',label:'Candidate Card target',atMs:at('2026-10-05T23:00:00Z'),fadId:'draft',field:'deadline'}]}});
  expect(await screen.findByRole('button',{name:/October 5, 2026; Candidate Card target/})).toBeVisible();
 });
 it('explains draft-bound calendar protection before allowing an edit',async()=>{
  setup({data:{...status,blockedReason:'Use draft timing until the draft completes.'}});
  expect(await screen.findByRole('button',{name:'Edit league calendar'})).toBeDisabled();
  expect(screen.getByText('Use draft timing until the draft completes.')).toBeVisible();
 });
 it('previews league-local dates and exact unchanged instants without changing data',async()=>{
  const {user,request}=setup();await review(user);
  expect(await screen.findByRole('region',{name:'Calendar change preview'})).toHaveTextContent('1 pending operations');
  const body=request.mock.calls.find(([url])=>url.endsWith('/preview'))[1].body;
  expect(body.weeks[0].locksAtMs).toBe(at('2026-10-19T20:00:00Z'));
  expect(body.weeks[0].baselineAtMs).toBe(status.weeks[0].baselineAtMs);
  await user.click(screen.getByRole('button',{name:'Keep current calendar'}));
  expect(request.mock.calls.some(([url])=>url.endsWith('/apply'))).toBe(false);
 });
 it('discards edited previews and safely retries an uncertain confirmation',async()=>{
  const {user,request}=setup({failFirst:true});await review(user);await screen.findByRole('region',{name:'Calendar change preview'});
  fireEvent.change(screen.getByLabelText('Playoffs end'),{target:{value:'2027-04-11T00:00'}});
  expect(screen.queryByRole('button',{name:'Confirm calendar changes'})).not.toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Review calendar changes'}));
  await user.click(await screen.findByRole('button',{name:'Confirm calendar changes'}));
  await waitFor(()=>expect(screen.getByRole('button',{name:'Confirm calendar changes'})).toBeEnabled());
  await user.click(screen.getByRole('button',{name:'Confirm calendar changes'}));
  expect(await screen.findByRole('status')).toHaveTextContent('Calendar updated.');
  const writes=request.mock.calls.filter(([url])=>url.endsWith('/apply'));
  expect(writes).toHaveLength(2);expect(writes[0][1].idempotencyKey).toBe(writes[1][1].idempotencyKey);
  expect(writes[0][1].body).toEqual(writes[1][1].body);
 });
 it('rejects a response for another league',async()=>{
  setup({data:{...status,leagueId:'wrong'}});expect(await screen.findByRole('alert')).toHaveTextContent('League dates could not be loaded.');
  expect(screen.queryByRole('button',{name:'Edit league calendar'})).not.toBeInTheDocument();
 });
 it('refuses malformed impact data',async()=>{
  const {user}=setup({malformed:true});await review(user);expect(await screen.findByRole('alert')).toHaveTextContent('These dates could not be previewed.');
  expect(screen.queryByRole('button',{name:'Confirm calendar changes'})).not.toBeInTheDocument();
 });
});
