import { StrictMode } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DailyAuctionOpeningBanner } from './DailyAuctionOpeningBanner.jsx';

let observers;
let visibility;
let sequence = 0;
const fixture = overrides => ({ id: 'opening-' + ++sequence, phase: 'auction', joined: true,
  auctionStartsAt: '2026-11-28T20:00:00Z', biddingVersion: 'minute-floor-v1',
  capBonusRatePercent: 0.25, rules: { minBid: 1 }, ...overrides });
const props = room => ({ room, viewerId: 'viewer' });
function intersect(visible = true, observer = observers.at(-1)) {
  act(() => observer.callback([{ target: observer.element, isIntersecting: visible, intersectionRatio: visible ? 1 : 0 }]));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-28T20:00:00Z'));
  sessionStorage.clear();
  observers = [];
  visibility = 'visible';
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback) { this.callback = callback; this.disconnect = vi.fn(); observers.push(this); }
    observe(element) { this.element = element; }
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Daily auction-opening banner', () => {
  it('shows for eight seconds, preserves the reserved slot, and returns the original cap note', () => {
    const room = fixture();
    const { container } = render(<DailyAuctionOpeningBanner {...props(room)}/>);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    intersect();
    const banner = screen.getByRole('status');
    expect(banner).toHaveTextContent('Auction open');
    expect(banner).toHaveTextContent('Opening bids start at $1 and rise $1 each minute. Players already up for auction keep their original minimum.');
    expect(banner).toHaveTextContent('Every $1 of unused cap boosts your team’s positive FP by 0.25%.');
    expect(banner).toHaveAttribute('aria-live', 'polite');
    expect(container.querySelector('.hd-opening-fallback')).toHaveAttribute('aria-hidden', 'true');
    act(() => vi.advanceTimersByTime(7_999));
    expect(screen.getByRole('status')).toBe(banner);
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(container.querySelector('.hd-opening-banner')).toBe(banner);
    expect(banner).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.hd-opening-fallback')).not.toHaveAttribute('aria-hidden');
    expect(container.querySelector('.hd-opening-fallback')).toHaveTextContent('Cap bonus: 0.25%');
  });

  it('does not restart the deadline on room polls or observer callbacks', () => {
    const room = fixture();
    const view = render(<DailyAuctionOpeningBanner {...props(room)}/>);
    intersect();
    act(() => vi.advanceTimersByTime(4_000));
    view.rerender(<DailyAuctionOpeningBanner {...props({ ...room, memberCount: 5 })}/>);
    intersect();
    expect(observers).toHaveLength(1);
    act(() => vi.advanceTimersByTime(4_000));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    view.rerender(<DailyAuctionOpeningBanner {...props({ ...room, memberCount: 6 })}/>);
    intersect();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('resumes only the remaining window on remount and does not replay after expiry', () => {
    const room = fixture();
    let view = render(<DailyAuctionOpeningBanner {...props(room)}/>);
    intersect();
    act(() => vi.advanceTimersByTime(3_000));
    view.unmount();
    view = render(<DailyAuctionOpeningBanner {...props(room)}/>);
    intersect();
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(5_000));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    view.unmount();
    render(<DailyAuctionOpeningBanner {...props(room)}/>);
    intersect();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('honors a deadline restored from session storage after a refresh', () => {
    const room = fixture();
    const key = 'hundo-daily-opening:' + encodeURIComponent(JSON.stringify(['viewer', room.id, room.auctionStartsAt]));
    sessionStorage.setItem(key, String(Date.now() + 2_000));
    render(<DailyAuctionOpeningBanner {...props(room)}/>);
    intersect();
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(2_000));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('waits for a visible tab and visible room before starting the full eight seconds', () => {
    const room = fixture();
    visibility = 'hidden';
    render(<DailyAuctionOpeningBanner {...props(room)}/>);
    intersect(false);
    act(() => vi.advanceTimersByTime(30_000));
    expect(sessionStorage.length).toBe(0);
    intersect(true);
    act(() => vi.advanceTimersByTime(30_000));
    expect(sessionStorage.length).toBe(0);
    act(() => { visibility = 'visible'; document.dispatchEvent(new Event('visibilitychange')); });
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(7_999));
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('starts once on waiting-to-auction transition and is unavailable after lock', () => {
    const scheduled = vi.spyOn(globalThis, 'setTimeout');
    const cleared = vi.spyOn(globalThis, 'clearTimeout');
    const room = fixture({ phase: 'waiting' });
    const view = render(<DailyAuctionOpeningBanner {...props(room)}/>);
    expect(observers).toHaveLength(0);
    expect(screen.queryByText('Auction open')).not.toBeInTheDocument();
    view.rerender(<DailyAuctionOpeningBanner {...props({ ...room, phase: 'auction' })}/>);
    intersect();
    expect(screen.getByRole('status')).toBeInTheDocument();
    const timeout = scheduled.mock.results[scheduled.mock.calls.findLastIndex(call => call[1] === 8_000)].value;
    view.rerender(<DailyAuctionOpeningBanner {...props({ ...room, phase: 'locked' })}/>);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(observers[0].disconnect).toHaveBeenCalled();
    expect(cleared).toHaveBeenCalledWith(timeout);
  });

  it('uses the actual classic minimum and cap setting, including spectators and practice rooms', () => {
    render(<DailyAuctionOpeningBanner {...props(fixture({ joined: false, mode: 'practice', biddingVersion: 'classic', capBonusRatePercent: 0 }))}/>);
    intersect();
    const banner = screen.getByRole('status');
    expect(banner).toHaveTextContent('Minimum bid $1');
    expect(banner).toHaveTextContent('Cap bonus off');
    expect(banner).not.toHaveTextContent('rise $1 each minute');
    expect(banner).not.toHaveTextContent('0.25%');
  });

  it('never announces an expired auction and clips the window at the known room deadline', () => {
    const expired = fixture({ auctionEndsAt: new Date(Date.now() - 1).toISOString() });
    const view = render(<DailyAuctionOpeningBanner {...props(expired)}/>);
    expect(observers).toHaveLength(0);
    expect(screen.queryByText('Auction open')).not.toBeInTheDocument();
    view.rerender(<DailyAuctionOpeningBanner {...props(fixture({ auctionEndsAt: new Date(Date.now() + 5_000).toISOString() }))}/>);
    intersect();
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(5_000));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('keeps separate windows for each viewer, room and auction start', () => {
    const room = fixture({ capBonusRatePercent: 0.5 });
    const view = render(<DailyAuctionOpeningBanner {...props(room)}/>);
    intersect();
    expect(screen.getByRole('status')).toHaveTextContent('positive FP by 0.5%.');
    act(() => vi.advanceTimersByTime(8_000));
    view.rerender(<DailyAuctionOpeningBanner room={room} viewerId="different-viewer"/>);
    intersect();
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(8_000));
    view.rerender(<DailyAuctionOpeningBanner room={{ ...room, id: 'another-' + room.id }} viewerId="different-viewer"/>);
    intersect();
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(8_000));
    view.rerender(<DailyAuctionOpeningBanner room={{ ...room, auctionStartsAt: '2026-11-28T21:00:00Z' }} viewerId="different-viewer"/>);
    intersect();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('survives StrictMode setup cleanup and falls back to memory if storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage blocked'); });
    const room = fixture();
    const view = render(<StrictMode><DailyAuctionOpeningBanner {...props(room)}/></StrictMode>);
    expect(observers).toHaveLength(2);
    expect(observers[0].disconnect).toHaveBeenCalled();
    intersect();
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(8_000));
    view.unmount();
    render(<DailyAuctionOpeningBanner {...props(room)}/>);
    intersect();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('leaves focus and controls untouched and cleans up on unmount', () => {
    const scheduled = vi.spyOn(globalThis, 'setTimeout');
    const cleared = vi.spyOn(globalThis, 'clearTimeout');
    const view = render(<><button>Bid on a player</button><DailyAuctionOpeningBanner {...props(fixture())}/></>);
    const bid = screen.getByRole('button');
    bid.focus();
    intersect();
    const timeout = scheduled.mock.results[scheduled.mock.calls.findLastIndex(call => call[1] === 8_000)].value;
    expect(document.activeElement).toBe(bid);
    expect(within(screen.getByRole('status')).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).not.toHaveAttribute('tabindex');
    view.unmount();
    expect(observers[0].disconnect).toHaveBeenCalled();
    expect(cleared).toHaveBeenCalledWith(timeout);
  });
});
