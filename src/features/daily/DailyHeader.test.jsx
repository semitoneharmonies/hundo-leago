import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { SessionContext } from '../session/sessionContext.js';
import { DailyHeader } from './DailyHeader.jsx';

vi.mock('../../components/QuoteTicker.jsx', () => ({ default: () => null }));
vi.mock('../../components/HundoBrand.jsx', () => ({ HundoBrand: () => null }));
it('uses only Daily unread counts and keeps the bell inside Daily', async () => {
  const request = vi.fn(async () => ({ data: { notifications: [], unreadCount: 3 }, meta: { serverNowMs: Date.now() } }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(<QueryClientProvider client={client}><MemoryRouter><SessionContext.Provider value={{ status: 'authenticated', user: { id: 'viewer', displayName: 'Grae' }, httpClient: { request } }}><DailyHeader/></SessionContext.Provider></MemoryRouter></QueryClientProvider>);
  expect(await screen.findByRole('link', { name: 'Daily notifications, 3 unread' })).toHaveAttribute('href', '/daily/notifications');
  expect(request).toHaveBeenCalledWith('/api/v1/daily/notifications', expect.objectContaining({ authenticated: true }));
  expect(request.mock.calls.every(([path]) => path.startsWith('/api/v1/daily/'))).toBe(true);
  view.unmount(); client.clear();
});
