import { StrictMode, useRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useDailyChatMotion } from './useDailyChatMotion.js';

let observers, media, mediaListeners, hidden;
function Harness({ open = false }) {
  const launcher = useRef(null);
  useDailyChatMotion(launcher, open);
  return <button ref={launcher} aria-expanded={open}><span>Chat</span><span>3</span></button>;
}
function visibility(visible = true, ratio = visible ? 1 : 0) {
  const observer = observers.at(-1);
  act(() => observer.callback([{ target: observer.target, isIntersecting: visible, intersectionRatio: ratio }]));
}
function advance(ms) { act(() => vi.advanceTimersByTime(ms)); }
function reduced(value) {
  media.matches = value;
  act(() => mediaListeners.forEach(listener => listener({ matches: value })));
}
function pageHidden(value) {
  hidden = value;
  fireEvent(document, new Event('visibilitychange'));
}
beforeEach(() => {
  vi.useFakeTimers();
  observers = [];
  mediaListeners = new Set();
  hidden = false;
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
  media = { matches: false,
    addEventListener: vi.fn((event, listener) => mediaListeners.add(listener)),
    removeEventListener: vi.fn((event, listener) => mediaListeners.delete(listener)) };
  vi.stubGlobal('matchMedia', vi.fn(() => media));
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback) { this.callback = callback; this.disconnect = vi.fn(); observers.push(this); }
    observe(target) { this.target = target; }
  });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it('rotates all five effects with 1.1-second bursts, eight seconds between starts, and no initial burst', () => {
  const view = render(<Harness/>);
  const button = screen.getByRole('button');
  advance(20000); // An unobserved/offscreen launcher does not animate.
  expect(button).not.toHaveAttribute('data-chat-motion');
  visibility();
  advance(7999);
  expect(button).not.toHaveAttribute('data-chat-motion');
  advance(1);
  for (const effect of ['wiggle', 'shimmer', 'balloon', 'spin', 'pulse', 'wiggle']) {
    expect(button).toHaveAttribute('data-chat-motion', effect);
    advance(1099);
    expect(button).toHaveAttribute('data-chat-motion', effect);
    advance(1);
    expect(button).not.toHaveAttribute('data-chat-motion');
    advance(6899);
    expect(button).not.toHaveAttribute('data-chat-motion');
    advance(1);
  }
  view.unmount();
});

it.each([
  ['hover', button => fireEvent.mouseEnter(button), button => fireEvent.mouseLeave(button)],
  ['focus', button => fireEvent.focus(button), button => fireEvent.blur(button)],
  ['hidden page', () => pageHidden(true), () => pageHidden(false)],
  ['reduced motion', () => reduced(true), () => reduced(false)],
  ['offscreen', () => visibility(false), () => visibility()],
  ['less than ten percent visible', () => visibility(true, 0.05), () => visibility()],
])('stops a running burst for %s and waits a fresh full interval on resumption', (_name, block, resume) => {
  const view = render(<Harness/>);
  const button = screen.getByRole('button');
  visibility();
  advance(8000);
  expect(button).toHaveAttribute('data-chat-motion', 'wiggle');
  block(button);
  expect(button).not.toHaveAttribute('data-chat-motion');
  advance(20000);
  expect(button).not.toHaveAttribute('data-chat-motion');
  resume(button);
  advance(7999);
  expect(button).not.toHaveAttribute('data-chat-motion');
  advance(1);
  expect(button).toHaveAttribute('data-chat-motion', 'shimmer');
  view.unmount();
});

it('does not resume until every pause condition is cleared', () => {
  const view = render(<Harness/>);
  const button = screen.getByRole('button');
  visibility();
  fireEvent.mouseEnter(button);
  reduced(true);
  fireEvent.mouseLeave(button);
  advance(16000);
  expect(button).not.toHaveAttribute('data-chat-motion');
  reduced(false);
  advance(7999);
  expect(button).not.toHaveAttribute('data-chat-motion');
  advance(1);
  expect(button).toHaveAttribute('data-chat-motion', 'wiggle');
  view.unmount();
});

it('cancels for open chat and waits until returned focus leaves the launcher after closing', () => {
  const view = render(<Harness/>);
  const button = screen.getByRole('button');
  visibility();
  advance(8000);
  view.rerender(<Harness open/>);
  expect(button).not.toHaveAttribute('data-chat-motion');
  expect(observers[0].disconnect).toHaveBeenCalledOnce();
  advance(16000);
  expect(button).not.toHaveAttribute('data-chat-motion');
  act(() => button.focus());
  view.rerender(<Harness/>);
  visibility();
  advance(16000);
  expect(button).not.toHaveAttribute('data-chat-motion');
  act(() => button.blur());
  advance(7999);
  expect(button).not.toHaveAttribute('data-chat-motion');
  advance(1);
  expect(button).toHaveAttribute('data-chat-motion', 'shimmer');
  view.unmount();
});

it('starts still for an existing reduced-motion preference, then starts after a fresh interval', () => {
  media.matches = true;
  const view = render(<Harness/>);
  const button = screen.getByRole('button');
  visibility();
  advance(40000);
  expect(button).not.toHaveAttribute('data-chat-motion');
  reduced(false);
  advance(8000);
  expect(button).toHaveAttribute('data-chat-motion', 'wiggle');
  view.unmount();
});

it('cleans up both timers, media listeners, visibility listeners and observers on unmount', () => {
  const remove = vi.spyOn(document, 'removeEventListener');
  const view = render(<Harness/>);
  const button = screen.getByRole('button');
  visibility();
  advance(8000);
  expect(vi.getTimerCount()).toBe(2);
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
  expect(button).not.toHaveAttribute('data-chat-motion');
  expect(mediaListeners.size).toBe(0);
  expect(observers[0].disconnect).toHaveBeenCalledOnce();
  expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
});

it('does not duplicate schedules during StrictMode effect replay', () => {
  const view = render(<StrictMode><Harness/></StrictMode>);
  expect(observers[0].disconnect).toHaveBeenCalledOnce();
  visibility();
  expect(vi.getTimerCount()).toBe(1);
  advance(8000);
  expect(screen.getByRole('button')).toHaveAttribute('data-chat-motion', 'wiggle');
  expect(vi.getTimerCount()).toBe(2);
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it('leaves the launcher still when visibility observation is unavailable', () => {
  vi.stubGlobal('IntersectionObserver', undefined);
  const view = render(<Harness/>);
  advance(40000);
  expect(screen.getByRole('button')).not.toHaveAttribute('data-chat-motion');
  expect(vi.getTimerCount()).toBe(0);
  view.unmount();
});

it('supports older media-query listeners and removes them', () => {
  media = { matches: false, addListener: vi.fn(listener => mediaListeners.add(listener)),
    removeListener: vi.fn(listener => mediaListeners.delete(listener)) };
  const view = render(<Harness/>);
  visibility();
  advance(8000);
  reduced(true);
  expect(screen.getByRole('button')).not.toHaveAttribute('data-chat-motion');
  view.unmount();
  expect(media.removeListener).toHaveBeenCalledOnce();
  expect(mediaListeners.size).toBe(0);
});
