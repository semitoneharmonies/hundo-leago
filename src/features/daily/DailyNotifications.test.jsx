import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DailyNotifications, DailyPushSettings } from './DailyNotifications.jsx';
import { dailyNotificationCopy } from './dailyNotificationCopy.js';
import { appRegistration, isInstalled } from '../install/installClient.js';

const api = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn() }));
vi.mock('./dailyApi.js', () => ({
  dailyKey: (userId, path) => ['daily', userId, path],
  dailyRead: (session, path) => ({ queryKey: ['daily', session.user.id, path], queryFn: () => api.read(path) }),
  dailyWrite: api.write,
  roomPath: id => '/rooms/' + id,
}));
vi.mock('../install/installClient.js', () => ({ appRegistration: vi.fn(), isInstalled: vi.fn() }));

let session, preferences, inbox, subscription, registration, permission;
const clients = [];
function mount(withInbox = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}><MemoryRouter>{withInbox ? <DailyNotifications session={session}/> : <DailyPushSettings session={session}/>}</MemoryRouter></QueryClientProvider>);
}
beforeEach(() => {
  vi.clearAllMocks();
  preferences = { enabled: true, reminder: true, start: true, idle: true, end: true, win: true };
  inbox = { notifications: [], unreadCount: 0 };
  api.read.mockImplementation(async path => path === '/notification-settings' ? { preferences: { ...preferences } } : inbox);
  api.write.mockImplementation(async (_session, path, body) => {
    if (path === '/notification-settings') { preferences = { ...body.preferences }; return { preferences }; }
    inbox = { ...inbox, unreadCount: 0, notifications: inbox.notifications.map(item => ({ ...item, readAtMs: 1 })) };
    return { updated: true };
  });
  permission = vi.fn().mockResolvedValue('granted');
  vi.stubGlobal('Notification', { requestPermission: permission });
  vi.stubGlobal('PushManager', class {});
  subscription = {
    endpoint: 'https://fcm.googleapis.com/daily-test', options: { applicationServerKey: new Uint8Array([4]) },
    toJSON: () => ({ endpoint: 'https://fcm.googleapis.com/daily-test', keys: { auth: 'test', p256dh: 'test' } }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  };
  registration = { pushManager: { getSubscription: vi.fn().mockResolvedValue(null), subscribe: vi.fn().mockResolvedValue(subscription) } };
  vi.stubGlobal('navigator', { ...navigator, userAgent: 'Android', serviceWorker: { ready: Promise.resolve(registration) } });
  appRegistration.mockResolvedValue(registration); isInstalled.mockReturnValue(true);
  session = { user: { id: 'daily-user' }, httpClient: { request: vi.fn(async path => ({ data: path.endsWith('/settings')
    ? { available: true, publicKey: 'BA', preferences: { trade_received: false } } : { enabled: true } })) } };
});
afterEach(() => { cleanup(); for (const client of clients.splice(0)) client.clear(); vi.unstubAllGlobals(); });

it('writes only Daily preferences and disabling Daily preserves the shared device subscription', async () => {
  registration.pushManager.getSubscription.mockResolvedValue(subscription);
  mount();
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Daily push alerts on' }));
  await screen.findByText('Daily preferences saved.');
  expect(api.write).toHaveBeenCalledWith(session, '/notification-settings', { preferences: { ...preferences, enabled: false } });
  expect(screen.getByRole('checkbox', { name: 'Daily push alerts on' })).not.toBeChecked();
  expect(screen.getByRole('checkbox', { name: '10 minutes before' })).toBeChecked();
  expect(appRegistration).not.toHaveBeenCalled();
  expect(subscription.unsubscribe).not.toHaveBeenCalled();
  expect(session.httpClient.request.mock.calls).toEqual([['/api/v1/push/settings', expect.objectContaining({ authenticated: true })]]);
  expect(permission).not.toHaveBeenCalled();
});

it('requests permission only after a tap and registers the device without editing Leago preferences', async () => {
  mount();
  const enable = await screen.findByRole('button', { name: 'Enable on this device' });
  expect(permission).not.toHaveBeenCalled();
  fireEvent.click(enable);
  expect(permission).toHaveBeenCalledTimes(1);
  await screen.findByText('This device is ready for push alerts.');
  expect(registration.pushManager.subscribe).toHaveBeenCalledWith({ userVisibleOnly: true, applicationServerKey: new Uint8Array([4]) });
  expect(session.httpClient.request).toHaveBeenCalledWith('/api/v1/push/subscriptions', expect.objectContaining({ method: 'POST', body: { subscription: subscription.toJSON() } }));
  expect(session.httpClient.request.mock.calls.some(([path, options]) => path === '/api/v1/push/settings' && options.method === 'POST')).toBe(false);
  expect(api.write).not.toHaveBeenCalled();
});

it('denied device permission does not subscribe or claim success', async () => {
  permission.mockResolvedValue('denied'); mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Enable on this device' }));
  await screen.findByText('Allow notifications in your browser or phone settings, then try again.');
  expect(appRegistration).not.toHaveBeenCalled();
  expect(registration.pushManager.subscribe).not.toHaveBeenCalled();
  expect(session.httpClient.request.mock.calls.some(([path]) => path.endsWith('/subscriptions'))).toBe(false);
});

it('failed saves retain the prior preferences and explain that they remain active', async () => {
  api.write.mockRejectedValue(Error('offline')); mount();
  const option = await screen.findByRole('checkbox', { name: 'Auction starts' });
  fireEvent.click(option);
  await screen.findByText('Could not save preferences. Your previous settings are still active.');
  expect(option).toBeChecked();
  expect(preferences.start).toBe(true);
  expect(api.write).toHaveBeenCalledWith(session, '/notification-settings', { preferences: { ...preferences, start: false } });
});

it('uses a Daily-only inbox, Daily room links, and Daily read endpoints', async () => {
  inbox = { unreadCount: 1, notifications: [{ id: 'notice-one', type: 'daily_auction_started', readAtMs: null,
    createdAtMs: Date.UTC(2026, 10, 23, 23), messageData: { roomId: 'room-one', roomName: 'Pacific Ice' } }] };
  mount(true);
  const link = await screen.findByRole('link', { name: 'Pacific Ice · Bidding is open.' });
  expect(link).toHaveAttribute('href', '/daily/rooms/room-one');
  expect(api.read).toHaveBeenCalledWith('/notifications');
  fireEvent.click(screen.getByRole('button', { name: 'Mark update for Pacific Ice read' }));
  await waitFor(() => expect(api.write).toHaveBeenCalledWith(session, '/notifications/read', { ids: ['notice-one'] }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Mark all read' })).toBeDisabled());
});

it('marks all Daily updates read without calling the global mark-all endpoint', async () => {
  inbox = { unreadCount: 2, notifications: [] }; mount(true);
  const button = await screen.findByRole('button', { name: 'Mark all read' });
  await waitFor(() => expect(button).toBeEnabled()); fireEvent.click(button);
  await waitFor(() => expect(api.write).toHaveBeenCalledWith(session, '/notifications/read', { all: true }));
  expect(session.httpClient.request.mock.calls.some(([path]) => path.includes('/notifications/read'))).toBe(false);
});

it('distinguishes the five Daily reminder and result messages', () => {
  const messageData = { roomName: 'Pacific Ice', points: 24.5, tied: false };
  expect(dailyNotificationCopy({ type: 'daily_auction_reminder', messageData })).toContain('starts in 10 minutes');
  expect(dailyNotificationCopy({ type: 'daily_auction_started', messageData })).toContain('Bidding is open');
  expect(dailyNotificationCopy({ type: 'daily_auction_idle', messageData })).toContain('15 minutes left. You haven’t signed a player yet');
  expect(dailyNotificationCopy({ type: 'daily_auction_ended', messageData })).toContain('Your roster is locked');
  expect(dailyNotificationCopy({ type: 'daily_room_won', messageData })).toContain('You won with 24.50 FP! Final scores are in');
});
