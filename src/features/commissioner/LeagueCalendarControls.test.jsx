import {fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {describe,it,expect,vi} from 'vitest';
import {SessionContext} from '../session/sessionContext.js';
import {LeagueCalendarControls} from './LeagueCalendarControls.jsx';
import {calendarWorkspaceFixture} from '../../../e2e/fixtures/calendar-workspace-data.js';
function setup({data=calendarWorkspaceFixture(),failFirst=false,malformed=false}={}){
 let attempts=0;const request=vi.fn(async(url,options={})=>{
  let result=data;
  if(url.endsWith('/preview'))result={leagueId:data.leagueId,proposed:options.body,previewHash:'b'.repeat(64),warnings:malformed?null:[{code:'schedule',message:'Check the shorter matchup week.'}]};
  if(url.endsWith('/apply')){attempts++;if(failFirst&&attempts===1)throw Error('Connection interrupted');result={leagueId:data.leagueId,id:'change',accepted:true,replayed:attempts>1};}
  options.validateData?.(result);return {data:result};
 });
 render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}><SessionContext.Provider value={{status:'authenticated',httpClient:{request}}}><LeagueCalendarControls leagueId={calendarWorkspaceFixture().leagueId}/></SessionContext.Provider></QueryClientProvider>);
 return {user:userEvent.setup(),request,data};
}
async function changeTrade(user){
 await user.click(await screen.findByRole('button',{name:'Trade deadline',exact:true}));
 fireEvent.change(screen.getByLabelText('Date',{exact:true}),{target:{value:'2027-02-13'}});
 await user.click(screen.getByRole('button',{name:'Add to changes'}));
}
describe('calendar workspace',()=>{
 it('shows all months, break labels and FAD dates without writes',async()=>{
  const {request}=setup();await screen.findByText('Edit your season');
  expect(screen.getByRole('region',{name:'July 2026'})).toBeVisible();expect(screen.getByRole('region',{name:'June 2027'})).toBeVisible();
  expect(screen.getByRole('button',{name:/December 23, 2026;.*Christmas break/})).toBeVisible();
  expect(screen.getByRole('button',{name:/September 30, 2026;.*Candidate Card/})).toBeVisible();
  expect(request.mock.calls.some(([,o])=>o.method==='POST')).toBe(false);
 });
 it('opens a selector for a day with both a week end and auction close',async()=>{
  const {user}=setup();await user.click(await screen.findByRole('button',{name:/October 11, 2026;/}));
  const picker=screen.getByRole('dialog',{name:'Choose an event'});
  expect(within(picker).getByRole('button',{name:/Week 1 ends/})).toBeVisible();
  expect(within(picker).getByRole('button',{name:/Weekly auctions close/})).toBeVisible();
  await user.keyboard('{Escape}');expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 });
 it('stages a new week start and adjusts the previous end, without sending a write',async()=>{
  const {user,request}=setup();await user.click(await screen.findByRole('button',{name:/October 12, 2026;/}));
  await user.click(within(screen.getByRole('dialog')).getByRole('button',{name:/Week 2 starts/}));
  fireEvent.change(screen.getByLabelText('Date',{exact:true}),{target:{value:'2026-10-11'}});
  fireEvent.change(screen.getByLabelText('Start time'),{target:{value:'09:30'}});
  await user.click(screen.getByRole('button',{name:'Add to changes'}));
  const table=screen.getByRole('region',{name:'Unsaved calendar changes'});expect(table).toHaveTextContent('Week 1 ends');expect(table).toHaveTextContent('Week 2 starts');
  expect(request.mock.calls.some(([,o])=>o.method==='POST')).toBe(false);
 });
 it('keeps trade and FAD edits together until Save, then warns before confirming',async()=>{
  const {user,request}=setup();await changeTrade(user);
  await user.click(screen.getByRole('button',{name:'Free Agent Draft',exact:true}));
  await user.click(within(screen.getByRole('dialog')).getByRole('button',{name:/FAD · Candidate Card deadline/}));
  fireEvent.change(screen.getByLabelText('Date',{exact:true}),{target:{value:'2026-10-01'}});
  await user.click(screen.getByRole('button',{name:'Add to changes'}));
  expect(request.mock.calls.some(([,o])=>o.method==='POST')).toBe(false);
  await user.type(screen.getByLabelText('Reason for changes'),'Managers agreed to new dates');
  await user.click(screen.getByRole('button',{name:'Save changes',exact:true}));
  expect(await screen.findByRole('region',{name:'Review schedule warnings'})).toHaveTextContent('shorter matchup');
  const body=request.mock.calls.find(([url])=>url.endsWith('/preview'))[1].body;
  expect(body.operations.map(o=>o.kind)).toEqual(['trade','fad']);expect(request.mock.calls.some(([url])=>url.endsWith('/apply'))).toBe(false);
 });
 it('undo and discard return to saved dates without a server request',async()=>{
  const {user,request}=setup();await changeTrade(user);await user.click(screen.getByRole('button',{name:'Undo',exact:true}));expect(screen.getByText('No unsaved changes')).toBeVisible();
  await changeTrade(user);await user.click(screen.getByRole('button',{name:'Discard changes'}));expect(screen.getByText('No unsaved changes')).toBeVisible();
  expect(request.mock.calls.some(([,o])=>o.method==='POST')).toBe(false);
 });
 it('retries an uncertain save with the same confirmation key',async()=>{
  const {user,request}=setup({failFirst:true});await changeTrade(user);await user.type(screen.getByLabelText('Reason for changes'),'Reschedule trade deadline');
  await user.click(screen.getByRole('button',{name:'Save changes',exact:true}));await user.click(await screen.findByRole('button',{name:'Confirm and save all changes'}));
  await waitFor(()=>expect(screen.getByRole('button',{name:'Confirm and save all changes'})).toBeEnabled());await user.click(screen.getByRole('button',{name:'Confirm and save all changes'}));
  expect(await screen.findByRole('status')).toHaveTextContent('All calendar changes saved');
  const writes=request.mock.calls.filter(([url])=>url.endsWith('/apply'));expect(writes).toHaveLength(2);expect(writes[0][1].idempotencyKey).toBe(writes[1][1].idempotencyKey);
 });
 it('rejects another league and malformed warnings',async()=>{
  const data=calendarWorkspaceFixture();data.leagueId='different';setup({data});
  expect(await screen.findByRole('alert')).toHaveTextContent('calendar could not be loaded');
 });
 it('does not allow confirmation when preview warnings are malformed',async()=>{
  const {user}=setup({malformed:true});await changeTrade(user);await user.type(screen.getByLabelText('Reason for changes'),'Test preview contract');await user.click(screen.getByRole('button',{name:'Save changes',exact:true}));
  expect(await screen.findByRole('alert')).toBeVisible();expect(screen.queryByRole('button',{name:'Confirm and save all changes'})).not.toBeInTheDocument();
 });
});
