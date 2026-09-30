import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { SessionContext } from '../session/sessionContext.js';
import { AuctionTimingControls } from './AuctionTimingControls.jsx';
const leagueId='11111111-1111-4111-8111-111111111111',auctionId='22222222-2222-4222-8222-222222222222';
const status={leagueId,auctionId,timeZone:'America/Vancouver',closesAtMs:Date.parse('2026-10-02T19:00:00Z'),
  serverNowMs:Date.parse('2026-09-29T19:00:00Z'),playoffsAtMs:null,seasonEndsAtMs:null,canEdit:true,blockedReason:null,history:[]};
function setup({data=status,failFirst=false,malformed=false}={}){
  let attempts=0;
  const request=vi.fn(async(url,options={})=>{
    let result=data;
    if(url.endsWith('/preview'))result={...data,proposed:options.body,previewHash:'a'.repeat(64),shortened:true};
    if(malformed&&url.endsWith('/preview'))result.proposed={...options.body,closesAtMs:'bad'};
    if(url.endsWith('/apply')){attempts++;if(failFirst&&attempts===1)throw Error('Connection interrupted');result={leagueId,auctionId,id:'change',accepted:true,replayed:attempts>1};}
    options.validateData?.(result);return{data:result};
  });
  render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}>
    <SessionContext.Provider value={{status:'authenticated',httpClient:{request}}}><AuctionTimingControls leagueId={leagueId} auctionId={auctionId}/></SessionContext.Provider>
  </QueryClientProvider>);
  return{request,user:userEvent.setup()};
}
async function review(user){
  await user.click(screen.getByRole('button',{name:'Manage closing time'}));
  await user.click(await screen.findByRole('button',{name:'Edit closing time'}));
  fireEvent.change(screen.getByLabelText('New closing time (America/Vancouver)'),{target:{value:'2026-10-01T12:00'}});
  await user.type(screen.getByLabelText('Reason for changing the closing time'),'Use the agreed closing time');
  await user.click(screen.getByRole('button',{name:'Review closing time'}));
}
it('loads timing only when opened and previews shortening in league time without loading bids',async()=>{
  const {user,request}=setup();expect(request).not.toHaveBeenCalled();await review(user);
  expect(await screen.findByText(/Managers will have less time/)).toBeInTheDocument();
  expect(request.mock.calls.find(([url])=>url.endsWith('/preview'))[1].body.closesAtMs).toBe(Date.parse('2026-10-01T19:00:00Z'));
  await user.click(screen.getByRole('button',{name:'Keep current closing time'}));
  expect(request.mock.calls.every(([url])=>url.endsWith('/timing')||url.endsWith('/timing/preview'))).toBe(true);
});
it('withdraws edited previews and retries an uncertain save with the same confirmation key',async()=>{
  const {user,request}=setup({failFirst:true});await review(user);
  await screen.findByRole('region',{name:'Auction closing time preview'});
  fireEvent.change(screen.getByLabelText('New closing time (America/Vancouver)'),{target:{value:'2026-10-01T13:00'}});
  expect(screen.queryByRole('button',{name:'Confirm closing time'})).not.toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Review closing time'}));
  await user.click(await screen.findByRole('button',{name:'Confirm closing time'}));
  await waitFor(()=>expect(screen.getByRole('button',{name:'Confirm closing time'})).toBeEnabled());
  await user.click(screen.getByRole('button',{name:'Confirm closing time'}));
  expect(await screen.findByRole('status')).toHaveTextContent('Auction closing time updated.');
  const writes=request.mock.calls.filter(([url])=>url.endsWith('/apply'));
  expect(writes).toHaveLength(2);expect(writes[0][1].idempotencyKey).toBe(writes[1][1].idempotencyKey);expect(writes[0][1].body).toEqual(writes[1][1].body);
});
it.each([{leagueId:'wrong'},{auctionId:'wrong'}])('rejects mismatched scope %j',async(scope)=>{
  const {user}=setup({data:{...status,...scope}});await user.click(screen.getByRole('button',{name:'Manage closing time'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Auction timing controls are unavailable.');
  expect(screen.queryByRole('button',{name:'Edit closing time'})).not.toBeInTheDocument();
});
it('rejects malformed preview clocks',async()=>{
  const {user}=setup({malformed:true});await review(user);
  expect(await screen.findByRole('alert')).toHaveTextContent('This closing-time change could not be previewed.');
  expect(screen.queryByRole('button',{name:'Confirm closing time'})).not.toBeInTheDocument();
});
it('shows protected history for a closed auction without permitting an edit',async()=>{
  const {user}=setup({data:{...status,canEdit:false,blockedReason:'This auction has closed.',history:[{id:'change',previousClosesAtMs:status.closesAtMs-3600000,
    closesAtMs:status.closesAtMs,createdAtMs:status.serverNowMs,actorName:'Alex',reason:'League agreed'}]}});
  await user.click(screen.getByRole('button',{name:'Manage closing time'}));
  expect(await screen.findByText('This auction has closed.')).toBeInTheDocument();expect(screen.getByText(/Alex:/)).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'Edit closing time'})).not.toBeInTheDocument();
});
