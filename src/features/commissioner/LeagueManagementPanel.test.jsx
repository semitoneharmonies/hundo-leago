import {render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {SessionContext} from '../session/sessionContext.js';
import {LeagueManagementPanel} from './LeagueManagementPanel.jsx';
const leagueId='11111111-1111-4111-8111-111111111111',teamId='22222222-2222-4222-8222-222222222222';
const readiness={leagueId,checkedAtMs:100,season:null,drafts:[],teams:[{id:teamId,name:'North Stars',status:'setup',managerName:null,cardStatus:'empty',
 roster:{legal:false,requiredNow:false,reasonCodes:['ACTIVE_FORWARD_SLOTS_INCOMPLETE'],counts:{},cap:{}}}],calendarIssues:['SEASON_DATES_UNSET'],missingPicks:[{draftId:'draft',teamId,teamName:'North Stars',round:4}],operations:[],
 summary:{teams:1,missingManagers:1,unfinishedCards:1,illegalRosters:0,missingPicks:1,calendarIssues:1,operations:0}};
const change={id:'private_review:record',recordId:'record',kind:'private_review',at:100,summary:'Selected auction bid explicitly reviewed',reason:'Review requested by manager',actorName:'Commissioner Taylor',targetId:'auction',before:null,after:null};
const exported={leagueId,format:'hundo-league-export-v1',generatedAtMs:100,scope:'current-season',league:{id:leagueId},season:null,teams:[],rosters:[],picks:[],results:[],excluded:['Private bids'],notice:'Reference export'};
function setup({wrongScope=false,badExport=false}={}) {
 const request=vi.fn(async(url,options)=>{
  if(options.method&&options.method!=='GET')throw Error('Report attempted a write');
  let data=url.includes('/readiness')?readiness:url.includes('/history')?{leagueId,changes:[change],page:{hasMore:false,nextCursor:null}}:exported;
  if(wrongScope)data={...data,leagueId:teamId};if(badExport&&url.endsWith('/export'))data={...data,privateBids:[999]};
  options.validateData(data);return{data};
 });
 render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter>
  <SessionContext.Provider value={{status:'authenticated',httpClient:{request}}}><LeagueManagementPanel leagueId={leagueId}/></SessionContext.Provider>
 </MemoryRouter></QueryClientProvider>);
 return{request,user:userEvent.setup()};
}
afterEach(()=>vi.restoreAllMocks());
describe('Commissioner management reports',()=>{
 it('loads only on opening and distinguishes preparation from competition roster failures',async()=>{
  const {user,request}=setup();expect(request).not.toHaveBeenCalled();await user.click(screen.getByText('League readiness, change history and export'));
  expect(await screen.findByText('1 teams without an active manager')).toBeInTheDocument();
  expect(screen.getByText(/Roster preparation before competition/)).toBeInTheDocument();
  expect(screen.getByRole('link',{name:'Review roster'})).toHaveAttribute('href',`/leagues/${leagueId}/commissioner/rosters`);
  expect(request).toHaveBeenCalledTimes(1);expect(request.mock.calls[0][0]).toMatch(/management\/readiness$/);
 });
 it('searches history without fetching private review details',async()=>{
  const {user,request}=setup();await user.click(screen.getByText('League readiness, change history and export'));
  await user.click(screen.getByRole('button',{name:'Change history'}));
  expect(await screen.findByText('Selected auction bid explicitly reviewed')).toBeInTheDocument();
  await user.type(screen.getByLabelText('Search changes'),'Taylor');await user.click(screen.getByRole('button',{name:'Search history'}));
  await waitFor(()=>expect(request.mock.calls.some(([url])=>url.includes('q=Taylor'))).toBe(true));
  expect(request.mock.calls.every(([url])=>url.includes('/management/'))).toBe(true);
  expect(screen.queryByText('999')).not.toBeInTheDocument();
 });
 it('downloads only after an explicit click and never calls a write endpoint',async()=>{
  const original=URL.createObjectURL,originalRevoke=URL.revokeObjectURL;URL.createObjectURL=vi.fn(()=> 'blob:fixture');URL.revokeObjectURL=vi.fn();
  const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
  try {
   const {user,request}=setup();await user.click(screen.getByText('League readiness, change history and export'));
   await user.click(screen.getByRole('button',{name:'Export league data'}));expect(request.mock.calls.some(([url])=>url.endsWith('/export'))).toBe(false);
   await user.click(screen.getByRole('button',{name:'Download league export'}));
   expect(await screen.findByRole('status')).toHaveTextContent('League export downloaded.');expect(click).toHaveBeenCalledOnce();
   expect(request.mock.calls.every(([,options])=>options.method===undefined)).toBe(true);
   await waitFor(()=>expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture'),{timeout:2000});
  } finally {URL.createObjectURL=original;URL.revokeObjectURL=originalRevoke;}
 });
 it('fails closed on cross-league state and unexpected export fields',async()=>{
  const {user}=setup({wrongScope:true});await user.click(screen.getByText('League readiness, change history and export'));
  expect(await screen.findByRole('alert')).toHaveTextContent('The readiness check could not be completed.');
  expect(screen.queryByText('North Stars')).not.toBeInTheDocument();
 });
 it('rejects an export that contains a private extra field',async()=>{
  const {user}=setup({badExport:true});await user.click(screen.getByText('League readiness, change history and export'));
  await user.click(screen.getByRole('button',{name:'Export league data'}));await user.click(screen.getByRole('button',{name:'Download league export'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('The export could not be downloaded.');
 });
});
