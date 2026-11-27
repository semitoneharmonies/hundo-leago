import { afterEach, expect, it, vi } from 'vitest';
import { createHttpClient } from '../../shared/api/httpClient.js';
import { installAggregateMetricSink } from './aggregateMetrics.js';

afterEach(() => installAggregateMetricSink(null));
it('counts actual parsed outcomes, excludes cancellation/admin reads, and never reports credentials or payload', async () => {
  const report = vi.fn(); installAggregateMetricSink(report);
  const fetchImpl = vi.fn();
  const client = createHttpClient({ apiOrigin: 'https://example.test', fetchImpl, getCsrfToken: () => 'secret-token' });
  fetchImpl.mockResolvedValueOnce(new Response(JSON.stringify({ data: { ok: true }, meta: { requestId: 'private-request' } }), { status: 200 }));
  await client.request('/api/v1/daily/rooms/private-room/join', { method: 'POST', body: { userId: 'private-user' }, authenticated: true });
  fetchImpl.mockRejectedValueOnce(new Error('private-diagnostic'));
  await expect(client.request('/api/v1/daily/rooms/private-room/bids', { method: 'POST', body: { playerId: 'private-player', bid: 99 } })).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  fetchImpl.mockResolvedValueOnce(new Response('invalid-json', { status: 200 }));
  await expect(client.request('/api/v1/leagues/private/players?query=secret')).rejects.toMatchObject({ code: 'APPLICATION_DATA_INVALID' });
  fetchImpl.mockRejectedValueOnce(new DOMException('aborted', 'AbortError'));
  await expect(client.request('/api/v1/daily')).rejects.toMatchObject({ code: 'REQUEST_ABORTED' });
  fetchImpl.mockResolvedValueOnce(new Response(JSON.stringify({ data: {}, meta: { requestId: 'admin' } }), { status: 200 }));
  await client.request('/api/v1/admin/analytics');
  expect(report.mock.calls).toEqual([['action.join.success'], ['action.bid.failure'], ['action.page_load.failure']]);
});
