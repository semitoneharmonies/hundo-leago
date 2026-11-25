import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it } from 'vitest';
import { DailyScoreboard } from './HundoDailyRoomScreens.jsx';
import { DailyHelp } from './DailyHelp.jsx';
import { DailyScoringGuide } from './DailyScoringGuide.jsx';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});

function manager(id, name, spent, hockeyPoints, capBonusPoints, capBonusPercent) {
  return { id, name, spent, hockeyPoints, capBonusPoints, capBonusPercent, points: hockeyPoints + capBonusPoints,
    statsStatus: 'collected', roster: [{ id: id + '-player', name: name + ' Skater', team: 'VAN', position: 'F',
      price: spent, points: hockeyPoints, statsStatus: 'collected' }] };
}
const full = manager('full', 'Full cap', 100, 40, 0, 0);
const value = manager('value', 'Value team', 60, 38, 3.8, 10);

describe('Daily cap bonus presentation', () => {
  it('ranks by server total and explains the bonus without changing player FP or salary', () => {
    const room = { phase: 'finished', capBonusRatePercent: 0.25, members: [full, value], winners: [{ id: value.id, name: value.name, points: 41.8 }] };
    render(<MemoryRouter><DailyScoreboard room={room} viewer={{ id: 'value' }}/></MemoryRouter>);
    const standings = screen.getByRole('table', { name: 'Manager rankings' });
    const first = standings.querySelector('tbody > tr');
    expect(first).toHaveTextContent('Value team');
    expect(first).toHaveTextContent('$60');
    expect(within(first).getByText('41.80')).toBeVisible();
    expect(within(first).getByLabelText('Score breakdown for Value team')).toHaveTextContent('38.00 hockey+3.80 cap(10%)');
    expect(screen.getByRole('status')).toHaveTextContent('Room winnerValue team41.80 FP');
    const roster = screen.getByRole('table', { name: 'Your roster slots' });
    expect(within(roster).getByRole('row', { name: /F1 Value team Skater/ })).toHaveTextContent('38.00');
    expect(within(roster).getByRole('row', { name: 'Hockey FP 38.00' })).toBeVisible();
    expect(within(roster).getByRole('row', { name: 'Cap bonus (10%) +3.80' })).toBeVisible();
    expect(within(roster).getByRole('row', { name: 'Team total $60 41.80 FP' })).toBeVisible();
    fireEvent.click(within(first).getByRole('button', { name: 'Value team (you)' }));
    const expanded = screen.getByRole('table', { name: 'Roster for Value team' });
    expect(within(expanded).getByRole('row', { name: /F1 Value team Skater/ })).toHaveTextContent('38.00');
    expect(within(expanded).getByRole('row', { name: 'Cap bonus (10%) +3.80' })).toBeVisible();
  });

  it.each([undefined, 0])('keeps legacy scores and roster footers unchanged for rate %s', capBonusRatePercent => {
    const room = { phase: 'locked', capBonusRatePercent, members: [full], winners: [] };
    render(<MemoryRouter><DailyScoreboard room={room} viewer={{ id: 'full' }}/></MemoryRouter>);
    expect(screen.queryByLabelText(/Score breakdown for/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Cap bonus/)).not.toBeInTheDocument();
    const roster = screen.getByRole('table', { name: 'Your roster slots' });
    expect(roster.querySelectorAll('tfoot tr')).toHaveLength(1);
    expect(within(roster).getByRole('row', { name: 'Team total $100 40.00 FP' })).toBeVisible();
  });

  it('updates provisional hockey and bonus components together without inventing a winner', () => {
    const room = { phase: 'locked', capBonusRatePercent: 0.25, members: [value], winners: [] };
    const view = render(<MemoryRouter><DailyScoreboard room={room} viewer={{ id: 'value' }}/></MemoryRouter>);
    const next = { ...value, hockeyPoints: 39, capBonusPoints: 3.9, points: 42.9 };
    view.rerender(<MemoryRouter><DailyScoreboard room={{ ...room, members: [next] }} viewer={{ id: 'value' }}/></MemoryRouter>);
    expect(screen.getByLabelText('Score breakdown for Value team')).toHaveTextContent('39.00 hockey+3.90 cap(10%)');
    expect(screen.queryByText('Room winner')).not.toBeInTheDocument();
  });

  it('explains per-dollar savings, the team-level example and protection for existing rooms in both guides', () => {
    render(<><DailyHelp/><DailyScoringGuide/></>);
    fireEvent.click(screen.getByRole('button', { name: 'What is Hundo Daily?' }));
    const help = screen.getByRole('dialog', { name: 'What is Hundo Daily?' });
    expect(help).toHaveTextContent('every $1 left unspent boosts your team’s positive fantasy points by 0.25%');
    expect(help).toHaveTextContent('Spend $60 and save $40 for a 10% boost');
    expect(help).toHaveTextContent('Existing rooms keep the scoring rules they were created with');
    fireEvent.click(screen.getByRole('button', { name: 'Scoring breakdown' }));
    const guide = screen.getByRole('dialog', { name: 'Scoring breakdown' });
    expect(guide).toHaveTextContent('0.25%');
    expect(guide).toHaveTextContent('30 hockey FP + 3 bonus FP = 33 total FP');
    expect(guide).toHaveTextContent('Individual player FP stays unchanged');
    expect(guide).toHaveTextContent('Existing rooms retain their original scoring rules');
  });
});
