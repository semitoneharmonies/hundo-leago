import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {describe,it,expect,vi} from 'vitest';
import {SessionContext} from '../session/sessionContext.js';
import {LeagueHelpPanel} from './LeagueHelpPanel.jsx';
const leagueId='11111111-1111-4111-8111-111111111111',teamId='22222222-2222-4222-8222-222222222222',id='33333333-3333-4333-8333-333333333333';
const initial={id,teamId,teamName:'Ice Owls',requesterName:'Morgan',kind:'general',targetId:null,targetLabel:'General league help',subject:'Roster question',message:'Please check my roster assignment.',status:'open',version:1};
function setup({manage=false,wrongScope=false,failFirst=false}={}){
 let attempts=0,record={...initial};const events=[];
 const request=vi.fn(async(url,options)=>{
  let data={leagueId,canManage:manage,teams:[{id:teamId,name:'Ice Owls'}],requests:[record],cardHelp:[],nextCursor:null};
  if(url.endsWith('/'+id))data={leagueId,canManage:manage,isRequester:!manage,request:record,events};
  if(url.includes('/targets?'))data={leagueId,teamId,kind:'auction',targets:[{id:'44444444-4444-4444-8444-444444444444',label:'Casey Skater',status:'open'}]};
  if(options.method==='POST'){attempts++;if(failFirst&&attempts===1)throw Error('Connection interrupted');
   if(url.endsWith('/events')){events.push({id:'55555555-5555-4555-8555-555555555555',action:options.body.action,message:options.body.message,actorName:'Commissioner'});record={...record,version:record.version+1,status:options.body.action==='resolve'?'resolved':'open'};}
   data={leagueId,id,accepted:true,replayed:false};}
  if(wrongScope)data={...data,leagueId:'other'};options.validateData(data);return {data};
 });
 render(<MemoryRouter><QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}><SessionContext.Provider value={{status:'authenticated',httpClient:{request}}}><LeagueHelpPanel leagueId={leagueId}/></SessionContext.Provider></QueryClientProvider></MemoryRouter>);
 return {user:userEvent.setup(),request};
}
describe('Private league help',()=>{
 it('loads only when opened and does not load any private record details',async()=>{const {user,request}=setup();expect(request).not.toHaveBeenCalled();await user.click(screen.getByText('Help',{exact:true}));await user.click(await screen.findByRole('button',{name:'Roster question'}));expect(await screen.findByText('Please check my roster assignment.')).toBeInTheDocument();expect(request.mock.calls.every(([url,options])=>url.includes('/help')&&!options.method)).toBe(true);expect(screen.queryByRole('option',{name:'Resolve request'})).not.toBeInTheDocument();});
 it('allows commissioner resolution and displays the retained conversation',async()=>{const {user,request}=setup({manage:true});await user.click(screen.getByText('Help',{exact:true}));await user.click(await screen.findByRole('button',{name:'Roster question'}));await user.selectOptions(await screen.findByLabelText('Request action'),'resolve');await user.type(screen.getByLabelText('Reply or resolution note'),'Assignment corrected');await user.click(screen.getByRole('button',{name:'Save reply or action'}));await screen.findByRole('status');expect(await screen.findByText('Assignment corrected')).toBeInTheDocument();expect(screen.getByRole('button',{name:'Reopen request'})).toBeInTheDocument();const write=request.mock.calls.find(([,o])=>o.method==='POST');expect(write[1].body).toEqual({action:'resolve',message:'Assignment corrected',expectedVersion:1});});
 it('submits an owned record without reading its bid contents and reuses an interrupted retry key',async()=>{const {user,request}=setup({failFirst:true});await user.click(screen.getByText('Help',{exact:true}));await user.click(await screen.findByText('Ask the commissioner for help'));await user.selectOptions(screen.getByLabelText('Your team'),teamId);await user.selectOptions(screen.getByLabelText('Help category'),'auction');await screen.findByRole('option',{name:'Casey Skater · open'});await user.selectOptions(screen.getByLabelText('Affected record'),'44444444-4444-4444-8444-444444444444');await user.type(screen.getByLabelText('Subject'),'Accidental auction');await user.type(screen.getByLabelText('What needs attention?'),'Please cancel this auction.');await user.click(screen.getByRole('button',{name:'Send private help request'}));await screen.findByRole('alert');await user.click(screen.getByRole('button',{name:'Send private help request'}));await screen.findByRole('status');const writes=request.mock.calls.filter(([,o])=>o.method==='POST');expect(writes).toHaveLength(2);expect(writes[0][1].body).toEqual(writes[1][1].body);expect(writes[0][1].idempotencyKey).toBe(writes[1][1].idempotencyKey);expect(request.mock.calls.every(([url])=>url.includes('/help'))).toBe(true);});
 it('fails closed when the response belongs to another league',async()=>{const {user}=setup({wrongScope:true});await user.click(screen.getByText('Help',{exact:true}));await screen.findByRole('alert');expect(screen.queryByText('Roster question')).not.toBeInTheDocument();expect(screen.queryByText('Ask the commissioner for help')).not.toBeInTheDocument();});
});
