import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import { dailyKey, dailyRead, dailyWrite, roomPath } from './dailyApi.js';
import { appRegistration, isInstalled } from '../install/installClient.js';
import './DailyNotifications.css';
import { dailyAlertOptions, dailyNotificationCopy } from './dailyNotificationCopy.js';
const pushRequest = async (session, path, options = {}) => (await session.httpClient.request(`/api/v1/push${path}`, {
  authenticated: true, dataKind: 'object', ...options,
})).data;
const applicationKey = value => Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), char => char.charCodeAt(0));

export function DailyPushSettings({ session }) {
  const cache = useQueryClient();
  const settings = useQuery(dailyRead(session, '/notification-settings'));
  const device = useQuery({ queryKey: ['push-settings', session.user.id],
    queryFn: () => pushRequest(session, '/settings'), meta: { private: true }, retry: false });
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [deviceEnabled, setDeviceEnabled] = useState(false);
  const supported = 'PushManager' in window && 'Notification' in window && 'serviceWorker' in navigator;
  const apple = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const save = useMutation({ mutationFn: preferences => dailyWrite(session, '/notification-settings', { preferences }),
    onSuccess: data => { cache.setQueryData(dailyKey(session.user.id, '/notification-settings'), data); setMessage('Daily preferences saved.'); } });
  async function enableDevice() {
    setBusy(true); setMessage('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setMessage('Allow notifications in your browser or phone settings, then try again.'); return; }
      const registration = await appRegistration();
      await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      const expected = applicationKey(device.data.publicKey);
      if (subscription) {
        const current = new Uint8Array(subscription.options.applicationServerKey || []);
        if (current.length !== expected.length || current.some((value, index) => value !== expected[index])) {
          // A key rotation affects the shared browser subscription, not saved alert preferences.
          await subscription.unsubscribe(); subscription = null;
        }
      }
      subscription ||= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: expected });
      await pushRequest(session, '/subscriptions', { method: 'POST', body: { subscription: subscription.toJSON() } });
      setDeviceEnabled(true); setMessage('This device is ready for push alerts.');
    } catch { setMessage('Could not enable this device. Please try again.'); }
    finally { setBusy(false); }
  }
  function toggle(key, checked) {
    setMessage(''); save.mutate({ ...settings.data.preferences, [key]: checked });
  }
  return <section className="hd-notification-settings" aria-labelledby="daily-push-heading">
    <h2 id="daily-push-heading"><Bell size={18} aria-hidden="true"/>Daily push alerts</h2>
    <p>Choose when your rooms call you back. Your Daily inbox keeps every update.</p>
    {settings.isPending && <p role="status">Loading preferences…</p>}
    {settings.isError && <p role="alert">Could not load Daily preferences. <button className="hd-action" onClick={() => settings.refetch()}>Retry</button></p>}
    {settings.data && <fieldset disabled={save.isPending || busy}>
      <legend className="sr-only">Daily push preferences</legend>
      <label className="hd-push-master"><input type="checkbox" checked={settings.data.preferences.enabled} onChange={event => toggle('enabled', event.target.checked)}/>Daily push alerts on</label>
      {dailyAlertOptions.map(([key, label]) => <label key={key}><input type="checkbox" checked={settings.data.preferences[key]} onChange={event => toggle(key, event.target.checked)}/>{label}</label>)}
    </fieldset>}
    {save.isError && <p role="alert">Could not save preferences. Your previous settings are still active.</p>}
    {device.isPending && <p role="status">Checking device setup…</p>}
    {device.isError && <p role="alert">Device setup is unavailable. <button className="hd-action" onClick={() => device.refetch()}>Retry device setup</button></p>}
    {device.data && (!device.data.available ? <p>Push delivery is not available yet. Your preferences are saved.</p>
      : !supported || (apple && !isInstalled()) ? <p>Open Hundo from your home screen to enable push alerts. On iPhone, add it to your Home Screen first.</p>
        : <button className="hd-action hd-primary" disabled={busy} onClick={enableDevice}>{busy ? 'Enabling…' : deviceEnabled ? 'Refresh this device' : 'Enable on this device'}</button>)}
    {message && <p role="status">{message}</p>}
    <small>Daily preferences are separate from Leago. Device permission is shared; your phone’s quiet hours still apply. Re-enable this device after signing in again.</small>
  </section>;
}

export function DailyNotifications({ session }) {
  const cache = useQueryClient();
  const query = useQuery({ ...dailyRead(session, '/notifications'), refetchInterval: 15_000 });
  const read = useMutation({ mutationFn: body => dailyWrite(session, '/notifications/read', body),
    onSuccess: () => cache.invalidateQueries({ queryKey: dailyKey(session.user.id, '/notifications') }) });
  return <div className="hd-notifications">
    <div className="hd-notifications-title"><h1>Daily notifications</h1><p>Your rooms, your reminders, your results.</p></div>
    <DailyPushSettings session={session}/>
    <section className="hd-notification-inbox" aria-labelledby="daily-inbox-heading">
      <header><h2 id="daily-inbox-heading">Your updates</h2><button className="hd-action" disabled={!query.data?.unreadCount || read.isPending} onClick={() => read.mutate({ all: true })}>Mark all read</button></header>
      {query.isPending && <p role="status">Loading updates…</p>}
      {query.isError && <p role="alert">Could not load updates. <button className="hd-action" onClick={() => query.refetch()}>Retry updates</button></p>}
      {read.isError && <p role="alert">Could not mark updates as read. Try again.</p>}
      {query.data?.notifications.length === 0 && <p>No Daily updates yet. Join a room to get started.</p>}
      <ul>{query.data?.notifications.map(item => <li key={item.id} className={item.readAtMs == null ? 'is-unread' : ''}>
        <Link to={'/daily' + roomPath(item.messageData.roomId)} onClick={() => { if (item.readAtMs == null) read.mutate({ ids: [item.id] }); }}>{dailyNotificationCopy(item)}</Link>
        <div><time dateTime={new Date(item.createdAtMs).toISOString()}>{new Date(item.createdAtMs).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</time>
          {item.readAtMs == null && <button className="hd-action" aria-label={`Mark update for ${item.messageData.roomName} read`} disabled={read.isPending} onClick={() => read.mutate({ ids: [item.id] })}><Check size={14} aria-hidden="true"/>Read</button>}</div>
      </li>)}</ul>
    </section>
  </div>;
}
