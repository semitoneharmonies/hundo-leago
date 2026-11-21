import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DailyPlayerName } from './DailyPlayerName.jsx';
import { AuctionBoard } from './DailyAuctionBoard.jsx';
import { ScoreRosterTable } from './DailyScoreRoster.jsx';

const injury = { status:'injured', source:'admin', observedAtMs:1000, needsReview:false, stale:false,
  details:{ timeline:'Week to Week', designation:'IR', reason:'Lower Body' } };
const player = { id:'8478402', name:'Injured Skater', team:'EDM', opponent:'VAN', position:'F', injury,
  seasonStatistics:{ gamesPlayed:18, goals:8, assists:14, fantasyPointsHundredths:5575 } };

describe('Daily player details', () => {
  it('uses current injury status for red names and exposes season stats and recovery details on focus', async () => {
    const user = userEvent.setup();
    const view = render(<DailyPlayerName player={player}/>);
    const trigger = screen.getByRole('button', { name:'Injured Skater — injured' });
    expect(trigger).toHaveClass('hl-injured-player-name');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    await user.tab();
    const tip = screen.getByRole('tooltip');
    expect(trigger).toHaveAttribute('aria-describedby', tip.id);
    for (const text of ['Season stats','18','8','14','55.75','Timeline: Week to Week','Status: IR','Reason: Lower Body']) {
      expect(within(tip).getByText(text)).toBeVisible();
    }
    view.rerender(<DailyPlayerName player={{...player, injury:{...injury,status:'healthy'}}}/>);
    expect(screen.getByRole('button', { name:player.name })).not.toHaveClass('hl-injured-player-name');
    expect(within(tip).queryByText(/Timeline:/)).not.toBeInTheDocument();
    expect(within(tip).getByText('Healthy')).toBeVisible();
  });

  it('keeps the tooltip available while moving the pointer from the name to its details', async () => {
    const user = userEvent.setup();
    render(<DailyPlayerName player={player}/>);
    const trigger = screen.getByRole('button');
    await user.hover(trigger);
    const tip = await screen.findByRole('tooltip');
    await user.hover(tip);
    expect(tip).toBeVisible();
    await user.unhover(tip);
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
  });

  it('supports tapping, outside dismissal and unavailable data without pretending missing stats are zero', async () => {
    const user = userEvent.setup();
    render(<><DailyPlayerName player={{...player,injury:undefined,seasonStatistics:null}}/><button>Elsewhere</button></>);
    await user.click(screen.getByRole('button', { name:player.name }));
    const tip = screen.getByRole('tooltip');
    expect(within(tip).getByText('Season statistics unavailable.')).toBeVisible();
    expect(within(tip).getByText('Injury status unconfirmed')).toBeVisible();
    expect(within(tip).getAllByText('—')).toHaveLength(4);
    await user.click(screen.getByRole('button', { name:'Elsewhere' }));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('keeps details inside an open bid dialog, preserves input on hover and consumes Escape without submitting', async () => {
    const user = userEvent.setup();
    const submit = vi.fn(event => event.preventDefault());
    render(<dialog open aria-label="Bid"><form onSubmit={submit}>
      <input aria-label="Amount" defaultValue="12"/><DailyPlayerName player={player}/>
    </form></dialog>);
    const amount = screen.getByRole('textbox', { name:'Amount' });
    await user.click(amount);
    await user.hover(screen.getByRole('button'));
    await screen.findByRole('tooltip');
    expect(screen.getByRole('dialog')).toContainElement(screen.getByRole('tooltip'));
    expect(amount).toHaveFocus();
    await user.click(screen.getByRole('button'));
    const escape = new KeyboardEvent('keydown', { key:'Escape', bubbles:true, cancelable:true });
    fireEvent(document, escape);
    expect(escape.defaultPrevented).toBe(true);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('open');
    expect(amount).toHaveValue('12');
    expect(submit).not.toHaveBeenCalled();
  });

  it('exposes stale or incomplete injury reports honestly', async () => {
    const user = userEvent.setup();
    render(<DailyPlayerName player={{...player,injury:{...injury,details:undefined,needsReview:true,stale:true}}}/>);
    await user.tab();
    const tip = screen.getByRole('tooltip');
    expect(within(tip).getByText('Recovery timeline not provided.')).toBeVisible();
    expect(within(tip).getByText('Awaiting injury review.')).toBeVisible();
    expect(within(tip).getByText('Last injury report is outdated.')).toBeVisible();
  });

  it('connects pool, auction and roster names without opening a bid from a player-name click', async () => {
    const user = userEvent.setup();
    const command = {isPending:false,reset:vi.fn(),mutate:vi.fn()};
    const room = { id:'room', phase:'auction', joined:true, availablePlayers:[player],
      auctions:[{...player,id:'2',name:'Auction Skater',endsAt:new Date(Date.now()+600000).toISOString(),bidCount:1}],
      members:[{id:'me',name:'Me',remainingCap:80,availableCap:80,reserved:0,roster:[{...player,id:'3',name:'Roster Skater',price:20}]}],
      rules:{minBid:1},bidLimits:{F:{maxAmount:70},D:{maxAmount:70}} };
    render(<AuctionBoard room={room} session={{user:{id:'me'}}} command={command}/>);
    for (const name of ['Injured Skater','Auction Skater','Roster Skater']) {
      expect(screen.getByRole('button',{name:name+' — injured'})).toHaveClass('hl-injured-player-name');
    }
    await user.click(screen.getByRole('button',{name:'Auction Skater — injured'}));
    expect(screen.getByRole('tooltip')).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(command.reset).not.toHaveBeenCalled();
    expect(command.mutate).not.toHaveBeenCalled();
  });

  it('includes injured names in both compact and expanded score rosters', () => {
    const member = {id:'me',name:'Me',spent:20,points:1,roster:[{...player,price:20,points:1}]};
    const view = render(<ScoreRosterTable member={member}/>);
    expect(screen.getByRole('button',{name:'Injured Skater — injured'})).toHaveClass('hl-injured-player-name');
    view.rerender(<ScoreRosterTable member={member} detailed/>);
    expect(screen.getByRole('button',{name:'Injured Skater — injured'})).toHaveClass('hl-injured-player-name');
  });
});
