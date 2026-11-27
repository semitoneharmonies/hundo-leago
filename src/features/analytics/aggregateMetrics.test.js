import { afterEach, describe, expect, it, vi } from 'vitest';
import { aggregateRequestKind, installAggregateMetricSink, reportAggregateMetric, startAggregateBrowserMetrics } from './aggregateMetrics.js';
import { createAggregateSender } from './aggregateCollector.js';
import { startAggregatePerformance } from './aggregatePerformance.js';

function browser({ path = '/daily', hidden = false, app = false, small = true, privacy = {} } = {}) {
  vi.useFakeTimers();
  const win = new EventTarget();
  const doc = new EventTarget();
  Object.assign(win, { location: { pathname: path }, setTimeout, clearTimeout,
    matchMedia: query => ({ matches: query.includes('max-width') ? small : app && query.includes('standalone') }) });
  doc.visibilityState = hidden ? 'hidden' : 'visible';
  const send = vi.fn(), ready = vi.fn();
  const observer = startAggregateBrowserMetrics({ apiOrigin: 'https://example.test', windowTarget: win,
    documentTarget: doc, navigatorObject: privacy, send, onReady: ready });
  return { win, doc, send, ready, ...observer };
}
afterEach(() => { installAggregateMetricSink(null); vi.useRealTimers(); });

describe('aggregate browser counters', () => {
  it('counts visible document openings once, including installed mode, without persistent state', () => {
    const view = browser({ app: true, hidden: true });
    vi.runAllTimers();
    expect(view.send).not.toHaveBeenCalled();
    view.doc.visibilityState = 'visible';
    view.doc.dispatchEvent(new Event('visibilitychange'));
    view.opening();
    view.win.location.pathname = '/daily/rooms/private';
    view.opening();
    expect(view.send.mock.calls.map(([body]) => body)).toEqual([
      { metric: 'launch.installed', value: 1 }, { metric: 'layout.small', value: 1 },
    ]);
    expect(view.ready).toHaveBeenCalledTimes(1);
    view.stop();
  });
  it('records browser-reported installation once, never an install prompt or a unique-person count', () => {
    const view = browser();
    view.win.dispatchEvent(new Event('beforeinstallprompt'));
    expect(view.send).not.toHaveBeenCalled();
    view.win.dispatchEvent(new Event('appinstalled'));
    view.win.dispatchEvent(new Event('appinstalled'));
    expect(view.send).toHaveBeenCalledExactlyOnceWith({ metric: 'install.reported', value: 1 });
    view.stop();
    view.win.dispatchEvent(new Event('appinstalled'));
    expect(view.send).toHaveBeenCalledTimes(1);
  });
  it('honours privacy signals dynamically and excludes admin/token routes', () => {
    const privacy = { globalPrivacyControl: true };
    const view = browser({ privacy });
    vi.runAllTimers(); view.win.dispatchEvent(new Event('appinstalled'));
    reportAggregateMetric('feature.daily_chat_open');
    expect(view.send).not.toHaveBeenCalled();
    privacy.globalPrivacyControl = false;
    view.win.location.pathname = '/admin/analytics';
    view.opening(); reportAggregateMetric('feature.favourites');
    expect(view.send).not.toHaveBeenCalled();
    view.win.location.pathname = '/daily';
    reportAggregateMetric('feature.daily_chat_open');
    expect(view.send).toHaveBeenCalledExactlyOnceWith({ metric: 'feature.daily_chat_open', value: 1 });
    view.stop();
  });
  it('allows only fixed metric names and strips arbitrary data from transport', () => {
    const fetchImpl = vi.fn().mockResolvedValue({ status: 204 });
    const send = createAggregateSender('https://example.test', fetchImpl);
    send({ metric: 'private-room-id', value: 1 });
    send({ metric: 'feature.favourites', value: 2 });
    expect(fetchImpl).not.toHaveBeenCalled();
    send({ metric: 'feature.favourites', value: 1, userId: 'secret', url: '/secret', text: 'secret' });
    const options = fetchImpl.mock.calls[0][1];
    expect(JSON.parse(options.body)).toEqual({ metric: 'feature.favourites', value: 1 });
    expect(options).toMatchObject({ credentials: 'omit', referrerPolicy: 'no-referrer' });
    const sink = vi.fn(); installAggregateMetricSink(sink);
    reportAggregateMetric('private-room-id'); reportAggregateMetric('feature.favourites');
    expect(sink).toHaveBeenCalledExactlyOnceWith('feature.favourites');
  });
  it('cancels the development replay before counting an opening', () => {
    const view = browser(); view.stop(); vi.runAllTimers();
    expect(view.send).not.toHaveBeenCalled();
  });
});

describe('bounded request outcome categories', () => {
  it('maps supported paths locally, with no auth/admin/chat/query contents emitted', () => {
    expect(aggregateRequestKind('/api/v1/daily/rooms/secret/join','POST')).toBe('join');
    expect(aggregateRequestKind('/api/v1/daily/rooms/secret/bids','POST')).toBe('bid');
    expect(aggregateRequestKind('/api/v1/leagues/private/auctions/a/bids/mine','PUT')).toBe('bid');
    expect(aggregateRequestKind('/api/v1/leagues/private/trades/t/accept','POST')).toBe('trade');
    expect(aggregateRequestKind('/api/v1/leagues/private/players?search=secret')).toBe('page_load');
    for (const path of ['/api/v1/admin/analytics','/api/v1/session','/api/v1/daily/rooms/private/chat','/api/v1/analytics/aggregate']) {
      expect(aggregateRequestKind(path)).toBeNull();
    }
  });
});

describe('performance bucket boundary', () => {
  it('emits only the first valid rating for each metric, discarding identifiers and raw performance data', () => {
    const callbacks = {}, report = vi.fn();
    startAggregatePerformance(report, Object.fromEntries(['onLCP','onINP','onCLS'].map(name => [name, fn => { callbacks[name] = fn; }])));
    callbacks.onLCP({ rating: 'invalid', id: 'secret' });
    callbacks.onLCP({ rating: 'good', value: 1350, id: 'secret', entries: [{ url: '/private' }] });
    callbacks.onLCP({ rating: 'poor', value: 9000 });
    callbacks.onINP({ rating: 'needs-improvement', value: 300 });
    callbacks.onCLS({ rating: 'poor', value: 0.5 });
    expect(report.mock.calls).toEqual([['vital.lcp.good'], ['vital.inp.needs_improvement'], ['vital.cls.poor']]);
  });
  it('does not invent measurements on unsupported browsers', () => {
    const report = vi.fn();
    expect(() => startAggregatePerformance(report, { onLCP: () => { throw new Error('unsupported'); } })).not.toThrow();
    expect(report).not.toHaveBeenCalled();
  });
});
