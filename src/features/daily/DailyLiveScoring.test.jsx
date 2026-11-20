import { render, screen, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DailyScoreboard } from './HundoDailyRoomScreens.jsx';
import { DailyLiveScoring } from './DailyLiveScoring.jsx';
import { StatsCollection } from './DailyScoreRoster.jsx';
import { dailyRead } from './dailyApi.js';
import { statText } from './dailyScorePresentation.js';
import { SCORING_CATEGORIES } from '../../shared/scoringCategories.js';

const live = { status: 'fresh', provisionalGameCount: 1, updatedAtMs: Date.parse('2026-11-19T03:30:00Z') };
const stats = Object.fromEntries(SCORING_CATEGORIES.map(({ key }, index) => [key, index]));
const member = { id: 'grae', name: 'Grae', points: 1, spent: 8, statsStatus: 'pending', scoringStats: stats, live: { provisional: true, officialPoints: 0 },
  roster: [{ id: 'player', name: 'Live Skater', team: 'BOS', position: 'F', price: 8, points: 1, statsStatus: 'pending', gamesCollected: 0, gamesExpected: 1, scoringStats: stats, live: { provisional: true, officialPoints: 0 } }],
};
afterEach(cleanup);

describe('Daily provisional scores', () => {
  it('shows every supplied category for explicitly provisional rows without calling them collected', () => {
    for (const { key } of SCORING_CATEGORIES) expect(statText(member, key)).toBe(stats[key]);
    render(<StatsCollection row={member.roster[0]}/>);
    const marker = screen.getByRole('img', { name: 'Provisional stats · Stats pending (0 of 1 games)' });
    expect(marker).toHaveAttribute('data-status', 'provisional');
  });
  it('does not invent stats for ordinary pending rows', () => {
    for (const { key } of SCORING_CATEGORIES) expect(statText({ ...member, live: undefined }, key)).toBe('—');
    expect(statText({ ...member, scoringStats: null }, 'shotsOnGoal')).toBe('—');
  });
  it('shows provisional totals then official replacement without awarding an early winner', () => {
    const room = { phase: 'locked', members: [member], live, winners: [] };
    const view = render(<MemoryRouter><DailyScoreboard room={room} viewer={{ id: 'grae' }}/></MemoryRouter>);
    expect(screen.getByRole('status')).toHaveTextContent('Provisional scores');
    expect(screen.getByRole('status').querySelector('time')).toHaveAttribute('dateTime', '2026-11-19T03:30:00.000Z');
    expect(within(screen.getByRole('table', { name: 'Manager rankings' })).getByText('1.00')).toBeVisible();
    expect(screen.queryByText('Room winner')).not.toBeInTheDocument();
    const official = { ...member, points: 0.8, statsStatus: 'collected', live: undefined, roster: member.roster.map(player => ({ ...player, points: 0.8, live: undefined, statsStatus: 'collected', gamesCollected: 1 })) };
    view.rerender(<MemoryRouter><DailyScoreboard room={{ ...room, live: undefined, members: [official] }} viewer={{ id: 'grae' }}/></MemoryRouter>);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(within(screen.getByRole('table', { name: 'Manager rankings' })).getByText('0.80')).toBeVisible();
    expect(screen.queryByRole('img', { name: /^Provisional stats/ })).not.toBeInTheDocument();
  });
  it('marks stale live values and missing-feed fallback clearly', () => {
    const view = render(<DailyLiveScoring live={{ ...live, status: 'stale' }}/>);
    expect(screen.getByRole('status')).toHaveTextContent('Live updates delayed');
    expect(screen.getByRole('status')).toHaveTextContent('Final stats may adjust these scores.');
    view.rerender(<DailyLiveScoring live={{ status: 'unavailable', updatedAtMs: null, provisionalGameCount: 0 }}/>);
    expect(screen.getByRole('status')).toHaveTextContent('Showing completed-game scores.');
    expect(screen.getByRole('status').querySelector('time')).toBeNull();
  });
  it('never marks a finished room provisional even if old metadata is supplied', () => {
    render(<MemoryRouter><DailyScoreboard room={{ phase: 'finished', members: [{ ...member, live: undefined }], live, winners: [{ id: 'grae', name: 'Grae', points: 1 }] }} viewer={{ id: 'grae' }}/></MemoryRouter>);
    expect(screen.getByRole('status')).toHaveTextContent('Room winner');
    expect(screen.queryByText('Provisional scores')).not.toBeInTheDocument();
  });
  it('rejects malformed live metadata before displaying a room response', async () => {
    const request = vi.fn(async () => ({ data: { room: { live: { ...live, updatedAtMs: Number.MAX_SAFE_INTEGER } } }, meta: { serverNowMs: 1 } }));
    const query = dailyRead({ user: { id: 'grae' }, httpClient: { request } }, '/rooms/test');
    await expect(query.queryFn({})).rejects.toThrow('The live scoring status is unavailable.');
    expect(request.mock.calls[0][0]).toBe('/api/v1/daily/rooms/test');
    expect(request.mock.calls[0][1].method).toBeUndefined();
  });
});
