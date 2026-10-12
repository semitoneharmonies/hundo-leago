import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { SessionContext } from '../session/sessionContext.js';
import { PushSettings } from './PushSettings.jsx';
import { appRegistration, isInstalled } from './installClient.js';
vi.mock('./installClient.js', () => ({appRegistration:vi.fn(),isInstalled:vi.fn(()=>true)}));
const categories=['trade_received','trade_accepted','trade_closed','auction_bid','auction_result','auction_closing','roster_illegal','roster_lock','schedule_changed','announcement','fad_action','commissioner_action'];
let request, registration, permission, subscription;
function show(status='authenticated') {
  const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
  return render(<QueryClientProvider client={client}><SessionContext.Provider value={{status,user:{id:'user-1'},httpClient:{request}}}><PushSettings /></SessionContext.Provider></QueryClientProvider>);
}
beforeEach(()=>{
  permission=vi.fn().mockResolvedValue('granted');
  vi.stubGlobal('Notification',{requestPermission:permission}); vi.stubGlobal('PushManager',class {});
  subscription={endpoint:'https://fcm.googleapis.com/test',toJSON:()=>({endpoint:'https://fcm.googleapis.com/test',keys:{auth:'test',p256dh:'test'}}),unsubscribe:vi.fn().mockResolvedValue(true)};
  registration={pushManager:{getSubscription:vi.fn().mockResolvedValue(null),subscribe:vi.fn().mockResolvedValue(subscription)}};
  vi.stubGlobal('navigator',{...navigator,userAgent:'Android',serviceWorker:{ready:Promise.resolve(registration)}});
  appRegistration.mockResolvedValue(registration); isInstalled.mockReturnValue(true);
  request=vi.fn(async(path,options)=>({data:path.endsWith('/settings')?{available:true,publicKey:'BA',preferences:options?.body?.preferences||Object.fromEntries(categories.map(k=>[k,true]))}:{enabled:true}}));
});
afterEach(()=>vi.unstubAllGlobals());
it('asks permission only on a tap and saves the browser subscription',async()=>{
  show(); const button=await screen.findByRole('button',{name:'Enable notifications'});
  expect(permission).not.toHaveBeenCalled(); fireEvent.click(button);
  expect(permission).toHaveBeenCalledTimes(1);
  await screen.findByText('Notifications enabled on this device.');
  expect(request).toHaveBeenCalledWith('/api/v1/push/subscriptions',expect.objectContaining({method:'POST',body:{subscription:subscription.toJSON()}}));
});
it('denied permission never subscribes or claims success',async()=>{
  permission.mockResolvedValue('denied'); show(); fireEvent.click(await screen.findByRole('button',{name:'Enable notifications'}));
  await screen.findByText(/Notifications are blocked/); expect(registration.pushManager.subscribe).not.toHaveBeenCalled();
  expect(request.mock.calls.some(([path])=>path.endsWith('/subscriptions'))).toBe(false);
});
it('failed preference saves restore the checkbox',async()=>{
  request.mockImplementation(async(path,options)=>{if(options.method==='POST')throw Error('offline');return {data:{available:false,publicKey:null,preferences:Object.fromEntries(categories.map(k=>[k,true]))}};});
  show(); const option=await screen.findByRole('checkbox',{name:'Trade offers'}); fireEvent.click(option);
  await screen.findByText('Could not save notifications. Please try again.'); await waitFor(()=>expect(option).toBeChecked());
});
it('turning off removes only this browser subscription',async()=>{
  registration.pushManager.getSubscription.mockResolvedValue(subscription); show();
  fireEvent.click(await screen.findByRole('button',{name:'Turn off on this device'}));
  await screen.findByText('Notifications turned off on this device.'); expect(subscription.unsubscribe).toHaveBeenCalledTimes(1);
  expect(request).toHaveBeenCalledWith('/api/v1/push/subscriptions/remove',expect.objectContaining({body:{endpoint:subscription.endpoint}}));
});
it('anonymous visitors can read instructions without private API calls',()=>{
  show('anonymous'); expect(screen.getByText('Sign in to choose your notifications.')).toBeVisible(); expect(request).not.toHaveBeenCalled();
});
it('a server without push support explains availability without allowing changes',async()=>{
  request.mockRejectedValue(Object.assign(new Error('Not found'),{status:404}));
  show(); await screen.findByText('Phone notifications aren’t available yet.');
  expect(screen.queryByRole('button',{name:'Enable notifications'})).not.toBeInTheDocument();
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  expect(permission).not.toHaveBeenCalled();
});
