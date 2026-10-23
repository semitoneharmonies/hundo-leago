import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {describe,it,expect,vi} from 'vitest';
import {SessionContext} from '../session/sessionContext.js';
import {LeaguePauseControls} from './LeaguePauseControls.jsx';
const leagueId='11111111-1111-4111-8111-111111111111';
function setup({initiallyPaused=false,busyJobs=0,wrongScope=false,failFirst=false}={}){
 let paused=initiallyPaused,attempts=0;
 const request=vi.fn(async(url,options)=>{
  let data={leagueId,paused,canResume:true,busyJobs,scope:'League competition',jobs:[],reason:null};
  if(url.endsWith('/preview'))data={leagueId,proposed:options.body,restoredStatus:paused?'active':null,overdue:true,
   impacts:{pendingJobs:4,dueJobs:2,openAuctions:3,dueAuctions:1,pendingProposals:2,expiredProposals:1},previewHash:'a'.repeat(64)};
  if(url.endsWith('/apply')){attempts++;if(failFirst&&attempts===1)throw Error('Interrupted');paused=options.body.action==='pause';data={leagueId,id:'receipt',accepted:true,replayed:attempts>1};}
  if(wrongScope)data={...data,leagueId:'other'};options.validateData(data);return {data};
 });
 render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}><SessionContext.Provider value={{status:'authenticated',httpClient:{request}}}>
  <LeaguePauseControls leagueId={leagueId}/></SessionContext.Provider></QueryClientProvider>);
 return {user:userEvent.setup(),request};
}
async function preview(user,resume=false){await user.click(screen.getByText('Pause or resume league competition'));await user.type(await screen.findByLabelText('Reason for '+(resume?'resuming':'pausing')),'Review the schedule');await user.click(screen.getByRole('button',{name:resume?'Review resume':'Review pause'}));}
describe('League pause controls',()=>{
 it('loads on demand and requires explicit acknowledgement before a pause',async()=>{
  const {user,request}=setup();expect(request).not.toHaveBeenCalled();await preview(user);
  const confirm=await screen.findByRole('button',{name:'Confirm league pause'});expect(confirm).toBeDisabled();expect(request.mock.calls.some(([url])=>url.endsWith('/apply'))).toBe(false);
  await user.click(screen.getByRole('checkbox'));await user.click(confirm);expect(await screen.findByRole('status')).toHaveTextContent('League paused.');
 });
 it('shows overdue processing and unchanged deadlines before resume',async()=>{
  const {user}=setup({initiallyPaused:true});await preview(user,true);expect(await screen.findByText(/Due operations may run immediately/)).toBeInTheDocument();
  expect(screen.getByText(/3 open auctions; 1 already due/)).toBeInTheDocument();await user.click(screen.getByRole('checkbox'));await user.click(screen.getByRole('button',{name:'Confirm league resume'}));
  expect(await screen.findByRole('status')).toHaveTextContent('League resumed.');
 });
 it('cannot pause while operations are in progress',async()=>{
  const {user}=setup({busyJobs:1});await user.click(screen.getByText('Pause or resume league competition'));await screen.findByText(/1 operations are still in progress/);
  expect(screen.queryByRole('button',{name:'Review pause'})).not.toBeInTheDocument();
 });
 it('preserves the preview and retry key after an interrupted confirmation',async()=>{
  const {user,request}=setup({failFirst:true});await preview(user);await screen.findByRole('button',{name:'Confirm league pause'});await user.click(screen.getByRole('checkbox'));
  await user.click(screen.getByRole('button',{name:'Confirm league pause'}));await screen.findByRole('alert');await user.click(screen.getByRole('button',{name:'Confirm league pause'}));await screen.findByRole('status');
  const calls=request.mock.calls.filter(([url])=>url.endsWith('/apply'));expect(calls).toHaveLength(2);expect(calls[0][1].body).toEqual(calls[1][1].body);expect(calls[0][1].idempotencyKey).toBe(calls[1][1].idempotencyKey);
 });
 it('fails closed on another league and invalidates preview when the reason changes',async()=>{
  const {user}=setup({wrongScope:true});await user.click(screen.getByText('Pause or resume league competition'));await screen.findByRole('alert');expect(screen.queryByRole('button',{name:'Review pause'})).not.toBeInTheDocument();
 });
});
