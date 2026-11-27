import { analyticsAllowed, analyticsCategory, createAggregateSender } from './aggregateCollector.js';

import { AGGREGATE_METRICS } from './aggregateMetricNames.js';
const allowedMetrics = new Set(AGGREGATE_METRICS);
let sink = null;
export function reportAggregateMetric(metric) {
  // Callers supply a fixed name only. Never accept event data, input values or identifiers.
  if (allowedMetrics.has(metric)) {
    try { sink?.(metric); } catch { /* Measurement must never interrupt a feature. */ }
  }
}
export function installAggregateMetricSink(next) {
  sink = next;
  return () => { if (sink === next) sink = null; };
}
export function aggregateRequestKind(path, method = 'GET') {
  if (typeof path !== 'string') return null;
  const clean = path.split('?')[0];
  if (method === 'POST' && /^\/api\/v1\/daily\/rooms\/[^/]+\/join$/.test(clean)) return 'join';
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) &&
    (/^\/api\/v1\/daily\/rooms\/[^/]+\/bids$/.test(clean) || /^\/api\/v1\/leagues\/[^/]+\/auctions\/[^/]+\/bids(?:\/[^/]+)?$/.test(clean))) return 'bid';
  if (method === 'POST' && /^\/api\/v1\/leagues\/[^/]+\/trades(?:\/[^/]+\/(?:accept|acknowledge|approve|decline|reject|cancel|counter|withdraw|execute|reverse|correction-required))?$/.test(clean)) return 'trade';
  if (method === 'GET' && clean.startsWith('/api/v1/') && analyticsCategory(clean.slice(7))) return 'page_load';
  return null;
}
export function startAggregateBrowserMetrics({ apiOrigin, windowTarget = window, documentTarget = document,
  navigatorObject = navigator, send = createAggregateSender(apiOrigin), onReady = () => {} }) {
  let opened = false;
  let installed = false;
  let stopped = false;
  const eligible = () => !stopped && analyticsAllowed(navigatorObject) && Boolean(analyticsCategory(windowTarget.location.pathname));
  const emit = metric => { if (eligible()) send({ metric, value: 1 }); };
  const detach = installAggregateMetricSink(emit);
  const opening = () => {
    if (opened || !eligible() || documentTarget.visibilityState !== 'visible') return;
    opened = true;
    const appMode = navigatorObject.standalone === true || ['standalone', 'minimal-ui']
      .some(mode => windowTarget.matchMedia?.(`(display-mode: ${mode})`)?.matches);
    emit(`launch.${appMode ? 'installed' : 'browser'}`);
    emit(`layout.${windowTarget.matchMedia?.('(max-width: 767px)')?.matches ? 'small' : 'large'}`);
    onReady(emit);
  };
  const onInstall = () => {
    if (!installed && eligible()) { installed = true; emit('install.reported'); }
  };
  const timer = windowTarget.setTimeout(opening, 0);
  documentTarget.addEventListener('visibilitychange', opening);
  windowTarget.addEventListener('appinstalled', onInstall);
  return {
    opening,
    stop() {
      stopped = true;
      detach();
      windowTarget.clearTimeout(timer);
      documentTarget.removeEventListener('visibilitychange', opening);
      windowTarget.removeEventListener('appinstalled', onInstall);
    },
  };
}
