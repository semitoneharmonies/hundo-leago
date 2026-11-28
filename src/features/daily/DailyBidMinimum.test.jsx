import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuctionBoard } from './DailyAuctionBoard.jsx';
import { DailyHelp } from './DailyHelp.jsx';
import { dailyNow } from './dailyApi.js';
import { nominationMinimum, playerMinimum } from './dailyBidMinimum.js';

vi.mock('./dailyApi.js', async importOriginal => ({ ...(await importOriginal()), dailyNow: vi.fn() }));
const start = Date.parse('2026-11-28T20:00:00Z');
const iso = seconds => new Date(start + seconds * 1000).toISOString();
const poolPlayer = { id: 'pool', name: 'Pool Skater', position: 'F', team: 'VAN', opponent: 'SEA' };
const openPlayer = { id: 'open', name: 'Open Skater', position: 'F', team: 'VAN', opponent: 'SEA', endsAt: iso(170), minimumBid: 1, ownBid: null, bidCount: 1 };
const roomFixture = overrides => ({
  id: 'room', phase: 'auction', joined: true, auctionStartsAt: iso(0), auctionEndsAt: iso(1800),
  biddingVersion: 'minute-floor-v1', nominationMinimum: 1, nominationMinimumIncreasesAt: iso(60),
  availablePlayers: [poolPlayer], auctions: [openPlayer], rules: { minBid: 1 },
  members: [{ id: 'me', name: 'Me', remainingCap: 100, availableCap: 100, reserved: 0, roster: [] }],
  bidLimits: { F: { maxAmount: 94 }, D: { maxAmount: 94 } }, ...overrides,
});
const props = command => ({ session: { user: { id: 'me' } }, command });
const commandFixture = () => ({ reset: vi.fn(), mutate: vi.fn(), isPending: false, error: null });

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
beforeEach(() => dailyNow.mockReturnValue(start + 59_000));
afterEach(() => vi.useRealTimers());

describe('rising Daily bidding minimum', () => {
  it('uses the server boundary at 1:00 while freezing older player auctions', () => {
    const room = roomFixture();
    expect(nominationMinimum(room, start + 59_999)).toBe(1);
    expect(nominationMinimum(room, start + 60_000)).toBe(2);
    expect(nominationMinimum(room, start + 120_000)).toBe(3);
    expect(playerMinimum(room, openPlayer, start + 160_000)).toBe(1);
    expect(nominationMinimum(room, start + 1_900_000)).toBe(30);
    expect(nominationMinimum({ ...room, phase: 'waiting' }, start + 60_000)).toBe(1);
  });

  it('preserves the $1 fallback for old room and auction responses', () => {
    const room = roomFixture({ biddingVersion: undefined, nominationMinimum: undefined, nominationMinimumIncreasesAt: undefined });
    expect(nominationMinimum(room, start + 900_000)).toBe(1);
    expect(playerMinimum(room, { ...openPlayer, minimumBid: undefined }, start + 900_000)).toBe(1);
  });

  it('updates an open blank bid dialog across a minute without filling or submitting it', () => {
    vi.useFakeTimers();
    const command = commandFixture();
    render(<AuctionBoard room={roomFixture()} {...props(command)}/>);
    fireEvent.click(screen.getByRole('button', { name: 'Bid on Pool Skater' }));
    const input = screen.getByRole('spinbutton', { name: 'Sealed bid for Pool Skater' });
    expect(input).toHaveValue(null);
    expect(input).toHaveAttribute('min', '1');
    dailyNow.mockReturnValue(start + 60_000);
    act(() => vi.advanceTimersByTime(500));
    expect(input).toHaveAttribute('min', '2');
    expect(input).toHaveValue(null);
    expect(screen.getByRole('button', { name: 'Place bid' })).toBeDisabled();
    expect(command.mutate).not.toHaveBeenCalled();
  });

  it('retains a typed bid when the clock raises the minimum and requires explicit correction', () => {
    vi.useFakeTimers();
    const command = commandFixture();
    render(<AuctionBoard room={roomFixture()} {...props(command)}/>);
    fireEvent.click(screen.getByRole('button', { name: 'Bid on Pool Skater' }));
    const input = screen.getByRole('spinbutton', { name: 'Sealed bid for Pool Skater' });
    fireEvent.change(input, { target: { value: '1' } });
    expect(screen.getByRole('button', { name: 'Place bid' })).toBeEnabled();
    dailyNow.mockReturnValue(start + 60_000);
    act(() => vi.advanceTimersByTime(500));
    expect(input).toHaveValue(1);
    expect(screen.getByRole('button', { name: 'Place bid' })).toBeDisabled();
    fireEvent.submit(input.closest('form'));
    expect(command.mutate).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Place bid' }));
    expect(command.mutate).toHaveBeenCalledWith({ action: 'bids', body: { playerId: 'pool', amount: 2 } }, expect.any(Object));
  });

  it('retains a rejected amount after the server reports a newer minimum', () => {
    const command = commandFixture();
    const room = roomFixture();
    const view = render(<AuctionBoard room={room} {...props(command)}/>);
    fireEvent.click(screen.getByRole('button', { name: 'Bid on Pool Skater' }));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Place bid' }));
    view.rerender(<AuctionBoard room={{ ...room, nominationMinimum: 2, nominationMinimumIncreasesAt: iso(120) }}
      {...props({ ...command, error: { code: 'DAILY_BID_MINIMUM', message: 'The minimum for a new player is $2.' } })}/>);
    expect(screen.getByRole('spinbutton')).toHaveValue(1);
    expect(screen.getByRole('spinbutton')).toHaveAttribute('min', '2');
    expect(screen.getByRole('alert')).toHaveTextContent('minimum for a new player is $2');
    expect(screen.getByRole('button', { name: 'Place bid' })).toBeDisabled();
    expect(command.mutate).toHaveBeenCalledTimes(1);
  });

  it('allows a cheaper existing auction when cap is below the new nomination minimum', () => {
    dailyNow.mockReturnValue(start + 150_000);
    const command = commandFixture();
    render(<AuctionBoard room={roomFixture({ bidLimits: { F: { maxAmount: 2 }, D: { maxAmount: 2 } } })} {...props(command)}/>);
    expect(screen.getByRole('button', { name: 'Bid on Pool Skater' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Bid on Open Skater' })).toBeEnabled();
    expect(screen.getByLabelText('New player minimum $3')).toHaveTextContent('Min $3');
    fireEvent.click(screen.getByRole('button', { name: 'Bid on Open Skater' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('spinbutton')).toHaveAttribute('min', '1');
    expect(dialog).toHaveTextContent('minimum is fixed');
    fireEvent.change(within(dialog).getByRole('spinbutton'), { target: { value: '2' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Place bid' }));
    expect(command.mutate).toHaveBeenCalledWith({ action: 'bids', body: { playerId: 'open', amount: 2 } }, expect.any(Object));
  });

  it('adopts a frozen player floor if another manager opens the selected player before submission', () => {
    dailyNow.mockReturnValue(start + 150_000);
    const command = commandFixture();
    const room = roomFixture();
    const view = render(<AuctionBoard room={room} {...props(command)}/>);
    fireEvent.click(screen.getByRole('button', { name: 'Bid on Pool Skater' }));
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '3' } });
    view.rerender(<AuctionBoard room={{ ...room, availablePlayers: [], auctions: [...room.auctions, {
      ...poolPlayer, minimumBid: 2, endsAt: iso(220), bidCount: 1, ownBid: null,
    }] }} {...props(command)}/>);
    expect(screen.getByRole('spinbutton')).toHaveValue(3);
    expect(screen.getByRole('spinbutton')).toHaveAttribute('min', '2');
    expect(screen.getByRole('dialog')).toHaveTextContent('minimum is fixed');
    expect(command.mutate).not.toHaveBeenCalled();
  });

  it('stops existing player bids at expiry and room bids at the room deadline', () => {
    vi.useFakeTimers();
    const command = commandFixture();
    render(<AuctionBoard room={roomFixture()} {...props(command)}/>);
    fireEvent.click(screen.getByRole('button', { name: 'Bid on Open Skater' }));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '2' } });
    dailyNow.mockReturnValue(start + 170_000);
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole('button', { name: 'Place bid' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('This auction has ended');
    dailyNow.mockReturnValue(start + 1_800_000);
    act(() => vi.advanceTimersByTime(500));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bid on Pool Skater' })).toBeDisabled();
    expect(command.mutate).not.toHaveBeenCalled();
  });

  it('explains the frozen floor and unchanged future-slot reserve in help', () => {
    render(<DailyHelp/>);
    fireEvent.click(screen.getByRole('button', { name: 'What is Hundo Daily?' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByText('How the auction works'));
    expect(dialog).toHaveTextContent('someone can still bid $2 on him in the third minute');
    expect(dialog).toHaveTextContent('Daily reserves only $1 for each other empty spot');
    expect(dialog).toHaveTextContent('Existing rooms keep their original bidding rules');
  });
});
