import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { SessionContext } from '../session/sessionContext.js';
import { FadAuctionCutoffControls } from './FadAuctionCutoffControls.jsx';
const leagueId='11111111-1111-4111-8111-111111111111',fadId='22222222-2222-4222-8222-222222222222';
const status={leagueId,fadId,gapMinutes:60,serverNowMs:100,canEdit:true,blockedReason:null,
  rounds:[{sequence:1,opensAtMs:1,closesAtMs:7200000,cutoffAtMs:3600000,protected:false}]};
function setup({data=status,failFirst=false,malformed=false}={}){
  let attempts=0;
  const request=vi.fn(async(url,options={})=>{
    let result=data;
    if(url.endsWith('/preview'))result={...data,proposed:options.body,previewHash:'c'.repeat(64),
      changes:[{sequence:1,opensAtMs:1,closesAtMs:7200000,beforeCutoffAtMs:3600000,afterCutoffAtMs:5400000,reopensNow:true,closesNow:false,noNominationWindow:false}],
      retained:[{sequence:2,cutoffAtMs:8000000,reason:'Existing auction or queued nomination'}]};
    if(malformed&&url.endsWith('/preview'))result.changes[0].afterCutoffAtMs='invalid';
    if(url.endsWith('/apply')){attempts++;if(failFirst&&attempts===1)throw Error('Connection interrupted');result={leagueId,fadId,id:'receipt',accepted:true,replayed:attempts>1};}
    options.validateData?.(result);return{data:result};
  });
  render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}>
    <SessionContext.Provider value={{status:'authenticated',httpClient:{request}}}><FadAuctionCutoffControls leagueId={leagueId} fadId={fadId}/></SessionContext.Provider>
  </QueryClientProvider>);
  return{request,user:userEvent.setup()};
}
async function review(user){
  await user.click(await screen.findByRole('button',{name:'Edit cutoff gap'}));
  fireEvent.change(screen.getByLabelText('Minutes before auction closing'),{target:{value:'30'}});
  await user.type(screen.getByLabelText('Reason for changing the cutoff'),'More nomination time');
  await user.click(screen.getByRole('button',{name:'Review cutoff changes'}));
}
describe('FAD auction cutoff controls',()=>{
  it('shows immediate impact and retained cutoffs without hidden requests or writes',async()=>{
    const {request,user}=setup();await review(user);
    expect(await screen.findByText('New nominations reopen immediately.')).toBeInTheDocument();
    expect(screen.getByText(/Existing auction or queued nomination/)).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'Keep current cutoffs'}));
    expect(request.mock.calls.every(([url])=>url.endsWith('/auction-cutoff')||url.endsWith('/auction-cutoff/preview'))).toBe(true);
  });
  it('invalidates edited previews and uses the same confirmation key after an uncertain response',async()=>{
    const {request,user}=setup({failFirst:true});await review(user);
    await screen.findByRole('region',{name:'Auction cutoff preview'});
    fireEvent.change(screen.getByLabelText('Minutes before auction closing'),{target:{value:'0'}});
    expect(screen.queryByRole('button',{name:'Confirm cutoff changes'})).not.toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'Review cutoff changes'}));
    await user.click(await screen.findByRole('button',{name:'Confirm cutoff changes'}));
    await waitFor(()=>expect(screen.getByRole('button',{name:'Confirm cutoff changes'})).toBeEnabled());
    await user.click(screen.getByRole('button',{name:'Confirm cutoff changes'}));
    expect(await screen.findByRole('status')).toHaveTextContent('Auction cutoff gap updated.');
    const sends=request.mock.calls.filter(([url])=>url.endsWith('/apply'));
    expect(sends).toHaveLength(2);expect(sends[0][1].idempotencyKey).toBe(sends[1][1].idempotencyKey);expect(sends[0][1].body).toEqual(sends[1][1].body);
  });
  it('rejects cross-league data',async()=>{
    setup({data:{...status,leagueId:fadId}});expect(await screen.findByRole('alert')).toHaveTextContent('Auction cutoff controls are unavailable.');
    expect(screen.queryByRole('button',{name:'Edit cutoff gap'})).not.toBeInTheDocument();
  });
  it('refuses malformed previews',async()=>{
    const {user}=setup({malformed:true});await review(user);
    expect(await screen.findByRole('alert')).toHaveTextContent('These cutoff changes could not be previewed.');
    expect(screen.queryByRole('button',{name:'Confirm cutoff changes'})).not.toBeInTheDocument();
  });
  it('shows the processing block without an edit button',async()=>{
    setup({data:{...status,canEdit:false,blockedReason:'Wait for processing to finish.'}});
    expect(await screen.findByText('Wait for processing to finish.')).toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'Edit cutoff gap'})).not.toBeInTheDocument();
  });
});
