import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { SessionContext } from '../session/sessionContext.js';
import { WeekOneShiftControls } from './WeekOneShiftControls.jsx';
const leagueId='11111111-1111-4111-8111-111111111111', seasonId='season',week={weekId:'week',version:1,startsAtMs:Date.parse('2026-10-19T07:00:00Z')};
function setup({ malformed=false }={}) {
  let writes=0;
  const request=vi.fn(async(url,options)=>{
    let data;
    if(options.body.action==='preview_shift_week_one') data={code:'MATCHUP_WEEK_ONE_SHIFT_PREVIEWED',leagueId,seasonId,weekId:week.weekId,
      expectedWeekVersion:1,previousFirstWeekStartsAtMs:week.startsAtMs,firstWeekStartsAtMs:options.body.firstWeekStartsAtMs,
      shiftedWeekCount:1,lastWeekEndsAtMs:week.startsAtMs,previewHash:malformed?'bad':'a'.repeat(64),
      weeks:[{sequence:1,startsAtMs:options.body.firstWeekStartsAtMs,endsAtMs:week.startsAtMs}]};
    else { writes++;if(writes===1)throw Error('Connection interrupted');data={seasonId,weekId:week.weekId,weekVersion:2,firstWeekStartsAtMs:options.body.firstWeekStartsAtMs}; }
    options.validateData(data);return {data};
  });
  render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}>
    <SessionContext.Provider value={{status:'authenticated',httpClient:{request}}}>
      <WeekOneShiftControls leagueId={leagueId} seasonId={seasonId} week={week} timeZone="America/Vancouver" />
    </SessionContext.Provider>
  </QueryClientProvider>);
  return {request,user:userEvent.setup()};
}
async function review(user){
  await user.click(screen.getByText('Move Week 1 before Candidate Cards open'));
  fireEvent.change(screen.getByLabelText('New Week 1 start (America/Vancouver)'),{target:{value:'2026-10-12T00:00'}});
  await user.click(screen.getByRole('button',{name:'Review Week 1 shift'}));
}
it('reviews without writes, requires typed confirmation and retries the identical versioned command',async()=>{
  const {request,user}=setup();await review(user);await screen.findByRole('region',{name:'Week 1 shift preview'});
  expect(request.mock.calls[0][1].body.firstWeekStartsAtMs).toBe(Date.parse('2026-10-12T07:00:00Z'));
  expect(screen.getByRole('button',{name:'Confirm Week 1 shift'})).toBeDisabled();
  await user.type(screen.getByLabelText('Type CHANGE WEEK 1 START to confirm'),'CHANGE WEEK 1 START');
  await user.click(screen.getByRole('button',{name:'Confirm Week 1 shift'}));
  await waitFor(()=>expect(screen.getByRole('button',{name:'Confirm Week 1 shift'})).toBeEnabled());
  await user.click(screen.getByRole('button',{name:'Confirm Week 1 shift'}));
  expect(await screen.findByRole('status')).toHaveTextContent('were updated');
  const writes=request.mock.calls.filter(([,o])=>o.body.action==='shift_week_one').map(([,o])=>o);
  expect(writes).toHaveLength(2);expect(writes[0].body).toEqual(writes[1].body);
  expect(writes[0].idempotencyKey).toBe(writes[1].idempotencyKey);expect(writes[0].version).toBe(1);
});
it('rejects malformed previews',async()=>{
  const {user}=setup({malformed:true});await review(user);
  await screen.findByRole('alert');expect(screen.queryByRole('button',{name:'Confirm Week 1 shift'})).not.toBeInTheDocument();
});
