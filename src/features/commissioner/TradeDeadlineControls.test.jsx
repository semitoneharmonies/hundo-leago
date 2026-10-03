import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { SessionContext } from '../session/sessionContext.js';
import { TradeDeadlineControls } from './TradeDeadlineControls.jsx';
const leagueId='11111111-1111-4111-8111-111111111111';
const status={leagueId,seasonId:'season',timeZone:'America/Vancouver',tradeDeadlineAtMs:Date.parse('2026-09-28T19:00:00Z'),
  serverNowMs:Date.parse('2026-09-29T19:00:00Z'),canEdit:true,blockedReason:null,history:[]};
function setup({data=status,failFirst=false,malformed=false}={}){
  let attempts=0;
  const request=vi.fn(async(url,options={})=>{
    let result=data;
    if(url.endsWith('/preview'))result={...data,proposed:options.body,previewHash:'a'.repeat(64),impact:{shortened:0,extended:0,unchanged:0,expiredRetained:2,reopensDeadline:true}};
    if(malformed&&url.endsWith('/preview'))result.impact.extended=-1;
    if(url.endsWith('/apply')){attempts++;if(failFirst&&attempts===1)throw Error('Connection interrupted');result={leagueId,id:'change',accepted:true,replayed:attempts>1};}
    options.validateData?.(result);return{data:result};
  });
  render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}>
    <SessionContext.Provider value={{status:'authenticated',httpClient:{request}}}><TradeDeadlineControls leagueId={leagueId}/></SessionContext.Provider>
  </QueryClientProvider>);
  return{request,user:userEvent.setup()};
}
async function review(user){
  await user.click(await screen.findByRole('button',{name:'Edit trade deadline'}));
  fireEvent.change(screen.getByLabelText('New trade deadline (America/Vancouver)'),{target:{value:'2026-10-01T12:00'}});
  await user.type(screen.getByLabelText('Reason for changing the trade deadline'),'Extend the trading window');
  await user.click(screen.getByRole('button',{name:'Review trade deadline'}));
}
describe('Trade deadline controls',()=>{
  it('uses the league time zone and previews reopening without private trade requests or writes',async()=>{
    const {user,request}=setup();await review(user);
    expect(await screen.findByText(/The old deadline has passed/)).toBeInTheDocument();
    expect(screen.getByText(/2 proposals awaiting expiry/)).toBeInTheDocument();
    expect(request.mock.calls.find(([url])=>url.endsWith('/preview'))[1].body.tradeDeadlineAtMs).toBe(Date.parse('2026-10-01T19:00:00Z'));
    await user.click(screen.getByRole('button',{name:'Keep current trade deadline'}));
    expect(request.mock.calls.every(([url])=>url.endsWith('/trade-deadline')||url.endsWith('/trade-deadline/preview'))).toBe(true);
  });
  it('discards an edited preview and retries an uncertain save with the same idempotency key',async()=>{
    const {user,request}=setup({failFirst:true});await review(user);
    await screen.findByRole('region',{name:'Trade deadline preview'});
    fireEvent.change(screen.getByLabelText('New trade deadline (America/Vancouver)'),{target:{value:'2026-10-02T12:00'}});
    expect(screen.queryByRole('button',{name:'Confirm trade deadline'})).not.toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'Review trade deadline'}));
    await user.click(await screen.findByRole('button',{name:'Confirm trade deadline'}));
    await waitFor(()=>expect(screen.getByRole('button',{name:'Confirm trade deadline'})).toBeEnabled());
    await user.click(screen.getByRole('button',{name:'Confirm trade deadline'}));
    expect(await screen.findByRole('status')).toHaveTextContent('Trade deadline updated.');
    const writes=request.mock.calls.filter(([url])=>url.endsWith('/apply'));
    expect(writes).toHaveLength(2);expect(writes[0][1].idempotencyKey).toBe(writes[1][1].idempotencyKey);expect(writes[0][1].body).toEqual(writes[1][1].body);
  });
  it('rejects mismatched league responses',async()=>{
    setup({data:{...status,leagueId:'different'}});expect(await screen.findByRole('alert')).toHaveTextContent('Trade deadline controls are unavailable.');
    expect(screen.queryByRole('button',{name:'Edit trade deadline'})).not.toBeInTheDocument();
  });
  it('rejects malformed impact counts',async()=>{
    const {user}=setup({malformed:true});await review(user);
    expect(await screen.findByRole('alert')).toHaveTextContent('This deadline change could not be previewed.');
    expect(screen.queryByRole('button',{name:'Confirm trade deadline'})).not.toBeInTheDocument();
  });
  it('shows the block and readable audit history without an edit button',async()=>{
    setup({data:{...status,canEdit:false,blockedReason:'The league is frozen.',history:[{id:'change',previousDeadlineAtMs:null,tradeDeadlineAtMs:status.tradeDeadlineAtMs,createdAtMs:status.serverNowMs,actorName:'Alex',reason:'League agreed'}]}});
    expect(await screen.findByText('The league is frozen.')).toBeInTheDocument();
    expect(screen.getByText(/Alex: Not set/)).toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'Edit trade deadline'})).not.toBeInTheDocument();
  });
});
