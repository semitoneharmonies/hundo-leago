import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const source = readFileSync(resolve('public/sw.js'), 'utf8');
function serviceWorker() {
  const handlers = new Map();
  const showNotification = vi.fn(async () => {});
  const openWindow = vi.fn(async () => {});
  runInNewContext(source, { URL, self: {
    addEventListener: (name, handler) => handlers.set(name, handler),
    registration: { showNotification }, clients: { openWindow },
    location: { origin: 'https://hundoleago.com' },
  } });
  return { handlers, showNotification, openWindow };
}

describe('production push destinations', () => {
  it.each([
    ['/notifications', '/notifications'],
    ['/leagues/league-a/auctions', '/leagues/league-a/auctions'],
    ['/daily/rooms/77777777-7777-4777-8777-777777777777', '/daily/rooms/77777777-7777-4777-8777-777777777777'],
    ['https://example.test/daily/rooms/room-a', '/notifications'],
    ['//example.test/daily/rooms/room-a', '/notifications'],
    ['/daily/rooms/../account', '/notifications'],
    ['/daily/rooms/room-a?redirect=https://example.test', '/notifications'],
  ])('keeps the bounded push route %s', async (url, expected) => {
    const worker = serviceWorker();
    let completion;
    worker.handlers.get('push')({ data: { json: () => ({ title:'Hundo update', url }) }, waitUntil: promise => { completion=promise; } });
    await completion;
    expect(worker.showNotification.mock.calls[0][1].data.url).toBe(expected);
  });
  it('opens a Daily notification in the current origin and rejects external click targets', async () => {
    const worker = serviceWorker();
    const close = vi.fn();
    let completion;
    worker.handlers.get('notificationclick')({ notification: { close, data: { url:'/daily/rooms/room-a' } }, waitUntil: promise => {completion=promise;} });
    await completion;
    expect(worker.openWindow).toHaveBeenCalledWith('https://hundoleago.com/daily/rooms/room-a');
    worker.handlers.get('notificationclick')({ notification: { close, data: { url:'https://example.test/' } }, waitUntil: vi.fn() });
    expect(worker.openWindow).toHaveBeenCalledTimes(1);
  });
});
