import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {describe,it,expect,vi} from 'vitest';
import {SessionContext} from '../session/sessionContext.js';
import {LeagueScoringControls} from './LeagueScoringControls.jsx';
import {LeagueScoringReference} from '../../components/LeagueScoringReference.jsx';
import {SCORING_CATEGORIES,scoringWeight,validateExpandedScoring} from '../../shared/scoringCategories.js';
const leagueId='11111111-1111-4111-8111-111111111111',seasonId='22222222-2222-4222-8222-222222222222',weekId='33333333-3333-4333-8333-333333333333',ruleId='44444444-4444-4444-8444-444444444444';
const defaults=Object.fromEntries(['F','D'].map(p=>[p,Object.fromEntries(SCORING_CATEGORIES.map(c=>[c.key,scoringWeight(c,p)]))]));
const state={leagueId,seasonId,current:{version:'expanded-2026-v1',weights:defaults},defaults,currentWeekSequence:1,serverNowMs:100,
 weeks:[{id:weekId,sequence:2,status:'scheduled',startsAtMs:200,endsAtMs:300,editable:true}],rules:[]};
function setup({data=state,failFirst=false,malformed=false,reference=false}={}) {
 let attempts=0;const request=vi.fn(async(url,options={})=>{
   let result=data;
   if(url.endsWith('/preview'))result={...data,proposed:options.body,changes:[{key:'hits',label:'Hits',position:'F',before:20,after:5}],endsBeforeWeek:null,
     comparisonWeekSequence:2,impacts:[],previewHash:'b'.repeat(64)};
   if(malformed&&url.endsWith('/preview'))result={...result,impacts:[{available:true}]};
   if(url.endsWith('/apply')) {attempts++;if(failFirst&&attempts===1)throw Error('Connection interrupted');result={leagueId,id:ruleId,accepted:true,replayed:attempts>1};}
   options.validateData?.(result);return{data:result};
 });
 render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}>
   <SessionContext.Provider value={{status:'authenticated',httpClient:{request}}}>{reference?<LeagueScoringReference leagueId={leagueId} httpClient={{request}}/>:<LeagueScoringControls leagueId={leagueId}/>}</SessionContext.Provider>
 </QueryClientProvider>);
 return{request,user:userEvent.setup()};
}
async function review(user){
 await user.click(await screen.findByRole('button',{name:'Edit scoring values'}));
 fireEvent.change(screen.getByLabelText('Hits forward'),{target:{value:'0.05'}});
 await user.type(screen.getByLabelText('Reason for scoring change'),'Reduce hits after league vote');
 await user.click(screen.getByRole('button',{name:'Review scoring change'}));
}
describe('League scoring controls',()=>{
 it('sends exact hundredths and an effective week, with preview and cancel before writes',async()=>{
   const {user,request}=setup();await review(user);
   expect(await screen.findByRole('region',{name:'Scoring change preview'})).toHaveTextContent('Hits (F): 0.20 → 0.05 FP');
   const body=request.mock.calls.find(([url])=>url.endsWith('/preview'))[1].body;
   expect(body.effectiveWeekSequence).toBe(2);expect(body.weights.F.hits).toBe(5);expect(body.weights.D.hits).toBe(35);
   await user.click(screen.getByRole('button',{name:'Keep current scoring values'}));
   expect(request.mock.calls.some(([url])=>url.endsWith('/apply'))).toBe(false);
 });
 it('invalidates edited previews and retries the same reviewed command after an uncertain save',async()=>{
   const {user,request}=setup({failFirst:true});await review(user);await screen.findByRole('button',{name:'Confirm scoring values'});
   fireEvent.change(screen.getByLabelText('Hits defence'),{target:{value:'0.10'}});
   expect(screen.queryByRole('button',{name:'Confirm scoring values'})).not.toBeInTheDocument();
   await user.click(screen.getByRole('button',{name:'Review scoring change'}));
   await user.click(await screen.findByRole('button',{name:'Confirm scoring values'}));
   await waitFor(()=>expect(screen.getByRole('button',{name:'Confirm scoring values'})).toBeEnabled());
   await user.click(screen.getByRole('button',{name:'Confirm scoring values'}));
   expect(await screen.findByRole('status')).toHaveTextContent('Scoring values saved.');
   const writes=request.mock.calls.filter(([url])=>url.endsWith('/apply'));
   expect(writes).toHaveLength(2);expect(writes[0][1].idempotencyKey).toBe(writes[1][1].idempotencyKey);expect(writes[0][1].body).toEqual(writes[1][1].body);
 });
 it('rejects cross-league state and incomplete impact previews',async()=>{
   const {user}=setup({malformed:true});await review(user);
   expect(await screen.findByRole('alert')).toHaveTextContent('The scoring change could not be previewed.');
   expect(screen.queryByRole('button',{name:'Confirm scoring values'})).not.toBeInTheDocument();
 });
 it('does not expose an editor for a response belonging to another league',async()=>{
   setup({data:{...state,leagueId:seasonId}});expect(await screen.findByRole('alert')).toBeInTheDocument();
   expect(screen.queryByRole('button',{name:'Edit scoring values'})).not.toBeInTheDocument();
 });
 it('shows the member the selected week values without admin history reasons',async()=>{
   const weights=structuredClone(defaults);weights.F.hits=5;
   const {user,request}=setup({reference:true,data:{...state,rules:[{id:ruleId,revision:1,effectiveWeekSequence:2,weights,createdAtMs:50}]}});
   await user.selectOptions(await screen.findByLabelText('Scoring for matchup week'),'2');
   expect(screen.getByText('0.05')).toBeInTheDocument();expect(request.mock.calls).toHaveLength(1);
   expect(request.mock.calls[0][0]).toMatch(/\/scoring\/rules$/);
 });
 it('requires complete custom weights and validates the displayed fantasy total',()=>{
   const stats=Object.fromEntries(SCORING_CATEGORIES.map(c=>[c.key,c.key==='hits'?4:0]));
   const weights=structuredClone(defaults);weights.F.hits=5;
   const value={scoringRuleVersion:'league-scoring-'+ruleId,scoringWeights:weights,scoringStats:stats,fantasyPointsHundredths:20};
   expect(validateExpandedScoring(value,'F')).toBe(true);
   expect(()=>validateExpandedScoring({...value,fantasyPointsHundredths:80},'F')).toThrow(/does not match/);
   expect(()=>validateExpandedScoring({...value,scoringWeights:undefined},'F')).toThrow(/incomplete/);
 });
});
