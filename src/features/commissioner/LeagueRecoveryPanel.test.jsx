import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {describe,it,expect,vi} from 'vitest';
import {SessionContext} from '../session/sessionContext.js';
import {LeagueRecoveryPanel} from './LeagueRecoveryPanel.jsx';
const leagueId='11111111-1111-4111-8111-111111111111',seasonId='22222222-2222-4222-8222-222222222222';
function setup({wrongScope=false,failFirst=false}={}){
 let attempts=0;const request=vi.fn(async(url,options)=>{
  let data={leagueId,seasonId,operationCount:2,tradeCount:0,operations:[{id:'job',kind:'matchup:lock',status:'failed',attempts:2,nextAttemptAtMs:null}],drafts:[{id:'33333333-3333-4333-8333-333333333333',status:'rapid_active'}],weeks:[],trades:[]};
  if(options.body?.confirmed===false)data={code:'MATCHUP_STANDINGS_REBUILD_PREVIEWED',preview:{expectedVersion:1,currentSnapshotId:null,projection:{leagueId,seasonId,rows:[{teamId:'team',teamDisplayName:'Ice Owls',rank:1,wins:2,losses:0,ties:1,standingsPoints:5}]}}};
  if(options.body?.confirmed===true){attempts++;if(failFirst&&attempts===1)throw Error('Interrupted');data={code:'MATCHUP_STANDINGS_REBUILT',result:{replayed:attempts>1}};}
  if(wrongScope)data={...data,leagueId:'other'};options.validateData?.(data);return {data};
 });
 render(<MemoryRouter><QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}><SessionContext.Provider value={{status:'authenticated',httpClient:{request}}}><LeagueRecoveryPanel leagueId={leagueId} seasonId={seasonId}/></SessionContext.Provider></QueryClientProvider></MemoryRouter>);
 return {user:userEvent.setup(),request};
}
async function open(user){await user.click(screen.getByText('Recovery and supported retries'));await screen.findByText('Operations needing attention');}
describe('Recovery hub',()=>{
 it('does not write or fetch hidden records when listing linked recovery actions',async()=>{const {user,request}=setup();expect(request).not.toHaveBeenCalled();await open(user);expect(screen.getByRole('link',{name:'Review rapid active draft'})).toHaveAttribute('href',expect.stringContaining('?fadId='));expect(request).toHaveBeenCalledTimes(1);expect(request.mock.calls[0][1].method).toBeUndefined();expect(screen.getByText(/Running or expired leases are never cleared/)).toBeInTheDocument();});
 it('requires preview and reason, then reuses the confirmation on a failed request',async()=>{const {user,request}=setup({failFirst:true});await open(user);await user.click(screen.getByText('Rebuild eligible derived standings'));await user.click(screen.getByRole('button',{name:'Preview standings rebuild'}));await screen.findByText('Ice Owls');expect(screen.getByRole('button',{name:'Confirm standings rebuild'})).toBeDisabled();await user.type(screen.getByLabelText('Rebuild reason'),'Repair the derived snapshot');await user.click(screen.getByRole('button',{name:'Confirm standings rebuild'}));await screen.findByRole('alert');await user.click(screen.getByRole('button',{name:'Confirm standings rebuild'}));expect(await screen.findByRole('status')).toHaveTextContent('Derived standings rebuilt');const writes=request.mock.calls.filter(([,o])=>o.body?.confirmed);expect(writes).toHaveLength(2);expect(writes[0][1].body).toEqual(writes[1][1].body);expect(writes[0][1].idempotencyKey).toBe(writes[1][1].idempotencyKey);});
 it('rejects another league in recovery status',async()=>{const {user}=setup({wrongScope:true});await user.click(screen.getByText('Recovery and supported retries'));await screen.findByRole('alert');expect(screen.queryByText('Operations needing attention')).not.toBeInTheDocument();});
});
