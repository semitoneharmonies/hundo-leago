import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {describe,it,expect,vi} from 'vitest';
import {SessionContext} from '../session/sessionContext.js';
import {LeaguePickRepairControls} from './LeaguePickRepairControls.jsx';
const leagueId='11111111-1111-4111-8111-111111111111';
const draft={id:'draft',seasonLabel:'2026–27',teams:[{id:'north',name:'North Stars'},{id:'south',name:'South Stars'}],
  missing:[{teamId:'north',teamName:'North Stars',round:4,position:2,ownerTeamId:'north'}],blockedReason:null};
function setup({blocked=false,wrongScope=false,failFirst=false}={}) {
  let attempts=0,applied=false;
  const request=vi.fn(async(url,options)=>{
    let data={leagueId,drafts:[{...draft,missing:applied?[]:draft.missing,blockedReason:blocked?'The order is unknown. Record the draft lottery order first.':null}]};
    if(url.endsWith('/preview'))data={leagueId,proposed:options.body,additions:[{...draft.missing[0],ownerTeamId:options.body.owners[0].ownerTeamId,ownerName:'South Stars'}],preservedCount:15,previewHash:'a'.repeat(64)};
    if(url.endsWith('/apply')){attempts++;if(failFirst&&attempts===1)throw Error('Network interrupted');applied=true;data={leagueId,id:'receipt',accepted:true,replayed:attempts>1};}
    if(wrongScope)data={...data,leagueId:'other'};options.validateData(data);return {data};
  });
  render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}><SessionContext.Provider value={{status:'authenticated',httpClient:{request}}}>
    <LeaguePickRepairControls leagueId={leagueId}/></SessionContext.Provider></QueryClientProvider>);
  return {request,user:userEvent.setup()};
}
async function openEditor(user){await user.click(screen.getByText('Repair missing draft picks'));await user.click(await screen.findByRole('button',{name:'Review 2026–27 picks'}));}
describe('Missing-pick repair controls',()=>{
  it('loads only on request and requires previewing the chosen owner before applying',async()=>{
    const {user,request}=setup();expect(request).not.toHaveBeenCalled();await openEditor(user);
    await user.selectOptions(screen.getByLabelText('Owner of North Stars round 4 pick'),'south');await user.type(screen.getByLabelText('Reason for pick repair'),'Restore agreed pick');
    await user.click(screen.getByRole('button',{name:'Preview pick repair'}));expect(await screen.findByText(/owned by South Stars/)).toBeInTheDocument();
    expect(request.mock.calls.some(([url])=>url.endsWith('/apply'))).toBe(false);await user.click(screen.getByRole('button',{name:'Confirm missing-pick repair'}));
    expect(await screen.findByRole('status')).toHaveTextContent('Missing picks added.');
    const call=request.mock.calls.find(([url])=>url.endsWith('/apply'))[1];expect(call.body).toMatchObject({confirmed:true,owners:[{teamId:'north',round:4,ownerTeamId:'south'}]});expect(call.idempotencyKey).toBeTruthy();
  });
  it('clears the preview when owner or reason changes',async()=>{
    const {user}=setup();await openEditor(user);await user.type(screen.getByLabelText('Reason for pick repair'),'Restore pick');await user.click(screen.getByRole('button',{name:'Preview pick repair'}));
    await screen.findByRole('button',{name:'Confirm missing-pick repair'});await user.type(screen.getByLabelText('Reason for pick repair'),' after review');expect(screen.queryByRole('button',{name:'Confirm missing-pick repair'})).not.toBeInTheDocument();
  });
  it('reuses the confirmation key when retrying an interrupted response',async()=>{
    const {user,request}=setup({failFirst:true});await openEditor(user);await user.type(screen.getByLabelText('Reason for pick repair'),'Restore pick');await user.click(screen.getByRole('button',{name:'Preview pick repair'}));
    await user.click(await screen.findByRole('button',{name:'Confirm missing-pick repair'}));await screen.findByRole('alert');await user.click(screen.getByRole('button',{name:'Confirm missing-pick repair'}));
    await screen.findByRole('status');const calls=request.mock.calls.filter(([url])=>url.endsWith('/apply'));expect(calls).toHaveLength(2);
    expect(calls[0][1].idempotencyKey).toBe(calls[1][1].idempotencyKey);expect(calls[0][1].body).toEqual(calls[1][1].body);
  });
  it('explains an unknown order without offering an unsafe repair',async()=>{
    const {user,request}=setup({blocked:true});await user.click(screen.getByText('Repair missing draft picks'));await screen.findByText(/The order is unknown/);
    expect(screen.queryByRole('button',{name:/Review .* picks/})).not.toBeInTheDocument();expect(request).toHaveBeenCalledOnce();
  });
  it('rejects cross-league reports',async()=>{
    const {user}=setup({wrongScope:true});await user.click(screen.getByText('Repair missing draft picks'));await waitFor(()=>expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.queryByText('2026–27')).not.toBeInTheDocument();
  });
});
