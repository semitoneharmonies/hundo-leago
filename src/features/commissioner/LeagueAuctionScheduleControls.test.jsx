import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {describe,it,expect,vi} from 'vitest';
import {SessionContext} from '../session/sessionContext.js';
import {LeagueAuctionScheduleControls} from './LeagueAuctionScheduleControls.jsx';
const leagueId='11111111-1111-4111-8111-111111111111',at=Date.parse;
const status={leagueId,timeZone:'America/Vancouver',serverNowMs:at('2026-09-29T19:00:00Z'),revision:0,openAuctionCount:2,schedule:null,legacyDaily:false,history:[],
 window:{opensAtMs:at('2026-09-28T07:00:00Z'),newAuctionCutoffAtMs:at('2026-10-02T07:00:00Z'),bidClosesAtMs:at('2026-10-04T23:00:00Z'),scheduledResolutionAtMs:at('2026-10-04T23:00:00Z'),nextOpensAtMs:at('2026-10-05T07:00:00Z'),canStart:true}};
function setup({data=status,failFirst=false,malformed=false,props={}}={}){
 let attempts=0;const request=vi.fn(async(url,options={})=>{
  let result=data;
  if(url.endsWith('/preview'))result={...data,proposed:options.body,previewHash:'b'.repeat(64),newWindow:data.window,opensNow:true,closesNow:false};
  if(malformed&&url.endsWith('/preview'))result.openAuctionCount=-1;
  if(url.endsWith('/apply')){attempts++;if(failFirst&&attempts===1)throw Error('Connection interrupted');result={leagueId,id:'change',accepted:true,replayed:attempts>1};}
  options.validateData?.(result);return {data:result};
 });
 render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}>
  <SessionContext.Provider value={{status:'authenticated',httpClient:{request}}}><LeagueAuctionScheduleControls leagueId={leagueId} {...props}/></SessionContext.Provider>
 </QueryClientProvider>);return {request,user:userEvent.setup()};
}
async function review(user){
 await user.click(await screen.findByRole('button',{name:'Edit auction schedule'}));
 await user.selectOptions(screen.getByLabelText('Closing day'),'5');
 fireEvent.change(screen.getByLabelText('Closing time (America/Vancouver)'),{target:{value:'18:45'}});
 fireEvent.change(screen.getByLabelText('Minutes before closing to stop new auctions'),{target:{value:'90'}});
 await user.type(screen.getByLabelText('Reason for auction schedule change'),'Managers chose Saturday evenings');
 await user.click(screen.getByRole('button',{name:'Review auction schedule'}));
}
describe('Recurring auction schedule controls',()=>{
 it('chooses the weekly closing day from a calendar without saving automatically',async()=>{
  const {user,request}=setup({props:{renderCalendar:({onSelectDay,disabled})=><button disabled={disabled} onClick={()=>onSelectDay('2026-10-03')}>Choose Saturday</button>}});
  await waitFor(()=>expect(screen.getByRole('button',{name:'Choose Saturday'})).toBeEnabled());await user.click(screen.getByRole('button',{name:'Choose Saturday'}));
  expect(screen.getByLabelText('Closing day')).toHaveValue('5');expect(screen.getByLabelText('Minutes before closing to stop new auctions')).toHaveValue(3840);
  expect(request.mock.calls.some(([,o])=>o.method==='POST')).toBe(false);
 });

 it('previews day, time and gap with preserved accepted auctions and immediate-window effects',async()=>{
  const {user,request}=setup();await review(user);
  const panel=await screen.findByRole('region',{name:'Auction schedule preview'});
  expect(panel).toHaveTextContent('Saturday at 18:45, with a 90-minute start cutoff');
  expect(panel).toHaveTextContent('2 existing auctions keep their saved times and bids');
  expect(panel).toHaveTextContent('reopens the weekly start window');
  expect(request.mock.calls.find(([url])=>url.endsWith('/preview'))[1].body).toEqual({closeWeekday:5,closeMinuteOfDay:1125,creationCutoffMinutes:90,reason:'Managers chose Saturday evenings'});
  await user.click(screen.getByRole('button',{name:'Keep current auction schedule'}));
  expect(request.mock.calls.some(([url])=>url.endsWith('/apply'))).toBe(false);
 });
 it('clears an edited preview and retries the exact confirmation after an uncertain save',async()=>{
  const {user,request}=setup({failFirst:true});await review(user);await screen.findByRole('region',{name:'Auction schedule preview'});
  fireEvent.change(screen.getByLabelText('Minutes before closing to stop new auctions'),{target:{value:'0'}});
  expect(screen.queryByRole('button',{name:'Confirm auction schedule'})).not.toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Review auction schedule'}));
  await user.click(await screen.findByRole('button',{name:'Confirm auction schedule'}));
  await waitFor(()=>expect(screen.getByRole('button',{name:'Confirm auction schedule'})).toBeEnabled());
  await user.click(screen.getByRole('button',{name:'Confirm auction schedule'}));
  expect(await screen.findByRole('status')).toHaveTextContent('Auction schedule updated.');
  const writes=request.mock.calls.filter(([url])=>url.endsWith('/apply'));
  expect(writes).toHaveLength(2);expect(writes[0][1].idempotencyKey).toBe(writes[1][1].idempotencyKey);
  expect(writes[0][1].body).toEqual(writes[1][1].body);
 });
 it('rejects cross-league responses',async()=>{
  setup({data:{...status,leagueId:'other'}});expect(await screen.findByRole('alert')).toHaveTextContent('Auction schedule controls are unavailable.');
  expect(screen.queryByRole('button',{name:'Edit auction schedule'})).not.toBeInTheDocument();
 });
 it('rejects malformed previews',async()=>{
  const {user}=setup({malformed:true});await review(user);expect(await screen.findByRole('alert')).toHaveTextContent('The auction schedule could not be previewed.');
  expect(screen.queryByRole('button',{name:'Confirm auction schedule'})).not.toBeInTheDocument();
 });
});

