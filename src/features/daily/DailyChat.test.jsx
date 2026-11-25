import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { DailyChat } from './DailyChat.jsx';

const api = vi.hoisted(() => ({ read:vi.fn(), write:vi.fn() }));
vi.mock('./dailyApi.js',()=>({ roomPath:id=>'/rooms/'+id,
  dailyRead:(session,path)=>({queryKey:['daily',session.user.id,path],queryFn:api.read}),dailyWrite:api.write }));
beforeAll(()=>{
  HTMLDialogElement.prototype.show=function(){this.setAttribute('open','');};
  HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new Event('close'));};
});
beforeEach(()=>localStorage.clear());
const room={id:'one',name:'Test room',phase:'auction'};
const session={user:{id:'me'}};
function mount(props = {}) {
  const client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});
  const view=render(<QueryClientProvider client={client}><DailyChat session={session} room={room} {...props}/></QueryClientProvider>);
  return {client,...view};
}
it('subscribes while closed, renders plain text and preserves a failed draft for idempotent retry',async()=>{
  const data={readOnly:false,messages:[{id:'m1',username:'Other',text:'<img src=x onerror=alert(1)>'}]};
  api.read.mockResolvedValue(data);api.write.mockRejectedValueOnce(Error('Try again')).mockResolvedValueOnce({...data,messages:[...data.messages,{id:'m2',username:'Me',text:'hello'}]});
  const view=mount();await waitFor(()=>expect(api.read).toHaveBeenCalled());
  fireEvent.click(screen.getByRole('button',{name:'Chat in Test room'}));
  const log=await screen.findByRole('log');
  await within(log).findByText('<img src=x onerror=alert(1)>');expect(log.querySelector('img')).toBeNull();
  const input=screen.getByLabelText('Message');expect(input).toHaveAttribute('maxlength','280');
  fireEvent.change(input,{target:{value:'   '}});expect(screen.getByRole('button',{name:'Send',exact:true})).toBeDisabled();
  fireEvent.change(input,{target:{value:'hello'}});fireEvent.click(screen.getByRole('button',{name:'Send',exact:true}));
  await screen.findByText('Try again');expect(input).toHaveValue('hello');
  fireEvent.click(screen.getByRole('button',{name:'Send',exact:true}));
  await waitFor(()=>expect(input).toHaveValue(''));
  expect(api.write.mock.calls[0][3]).toBe(api.write.mock.calls[1][3]);
  fireEvent.click(screen.getByRole('button',{name:'Close chat'}));expect(screen.queryByRole('dialog')).toBeNull();
  view.unmount();view.client.clear();
});

it('counts only unseen messages from other members and remembers reading across refreshes',async()=>{
  let data={readOnly:false,messages:[
    {id:'m1',userId:'other',username:'Other',text:'First'},
    {id:'m2',userId:'me',username:'Me',text:'My message'},
  ]};
  api.read.mockImplementation(async()=>data);
  let view=mount();
  const launch=screen.getByRole('button',{name:'Chat in Test room'});
  await waitFor(()=>expect(launch).toHaveAccessibleDescription('1 unread message'));
  data={...data,messages:[...data.messages,{id:'m3',userId:'other',username:'Other',text:'New message'}]};
  await act(()=>view.client.invalidateQueries({queryKey:['daily','me','/rooms/one/chat']}));
  await waitFor(()=>expect(launch).toHaveAccessibleDescription('2 unread messages'));
  data={...data,messages:data.messages.map(message=>({...message,reactions:[{userId:'me',username:'Me',reaction:'like'}]}))};
  await act(()=>view.client.invalidateQueries({queryKey:['daily','me','/rooms/one/chat']}));
  expect(launch).toHaveAccessibleDescription('2 unread messages');
  fireEvent.click(launch);
  await waitFor(()=>expect(launch).not.toHaveAttribute('aria-describedby'));
  fireEvent.click(screen.getByRole('button',{name:'Close chat'}));
  data={...data,readOnly:true,messages:[...data.messages,{id:'m4',userId:'other',username:'Other',text:'Final message'}]};
  view.unmount();view.client.clear();view=mount();
  await waitFor(()=>expect(screen.getByRole('button',{name:'Chat in Test room'})).toHaveAccessibleDescription('1 unread message'));
  fireEvent.click(screen.getByRole('button',{name:'Chat in Test room'}));
  expect(await screen.findByText('Final message')).toBeVisible();
  expect(screen.getByText('Room complete · Chat is read-only.')).toBeVisible();
  view.unmount();view.client.clear();
});

it('keeps read cursors separate for each user and room',async()=>{
  api.read.mockResolvedValue({messages:[{id:'m1',userId:'other',username:'Other',text:'Hello'}]});
  let view=mount();
  fireEvent.click(screen.getByRole('button',{name:'Chat in Test room'}));
  await waitFor(()=>expect(localStorage.getItem('hundo-daily:chat-read:me:one')).toBe('m1'));
  view.unmount();view.client.clear();
  view=mount({room:{...room,id:'two',name:'Second room'}});
  await waitFor(()=>expect(screen.getByRole('button',{name:'Chat in Second room'})).toHaveAccessibleDescription('1 unread message'));
  view.unmount();view.client.clear();
  view=mount({session:{user:{id:'another-member'}}});
  await waitFor(()=>expect(screen.getByRole('button',{name:'Chat in Test room'})).toHaveAccessibleDescription('1 unread message'));
  view.unmount();view.client.clear();
});

it('leaves new messages unread while reading older history, then marks them read at the bottom',async()=>{
  let data={messages:[{id:'m1',userId:'other',username:'Other',text:'Older'}]};
  api.read.mockImplementation(async()=>data);
  const view=mount();
  const launch=screen.getByRole('button',{name:'Chat in Test room'});
  fireEvent.click(launch);
  await waitFor(()=>expect(localStorage.getItem('hundo-daily:chat-read:me:one')).toBe('m1'));
  const log=screen.getByRole('log');
  Object.defineProperties(log,{scrollHeight:{value:1000,configurable:true},clientHeight:{value:100,configurable:true}});
  fireEvent.scroll(log,{target:{scrollTop:0}});
  data={messages:[...data.messages,{id:'m2',userId:'other',username:'Other',text:'Newest'}]};
  await act(()=>view.client.invalidateQueries({queryKey:['daily','me','/rooms/one/chat']}));
  await waitFor(()=>expect(launch).toHaveAccessibleDescription('1 unread message'));
  fireEvent.scroll(log,{target:{scrollTop:900}});
  await waitFor(()=>expect(launch).not.toHaveAttribute('aria-describedby'));
  view.unmount();view.client.clear();
});

it('sends on Enter but preserves Shift+Enter and IME composition; Escape closes and returns focus',async()=>{
  const data={messages:[]};
  api.read.mockResolvedValue(data);api.write.mockResolvedValue(data);
  const view=mount();
  const launch=screen.getByRole('button',{name:'Chat in Test room'});
  fireEvent.click(launch);
  const input=screen.getByRole('textbox');
  await waitFor(()=>expect(input).toBeEnabled());
  fireEvent.change(input,{target:{value:'Ready'}});
  fireEvent.keyDown(input,{key:'Enter',shiftKey:true});
  fireEvent.keyDown(input,{key:'Enter',isComposing:true});
  fireEvent.keyDown(input,{key:'Enter',keyCode:229});
  expect(api.write).not.toHaveBeenCalled();
  fireEvent.keyDown(input,{key:'Enter'});
  await waitFor(()=>expect(api.write).toHaveBeenCalledTimes(1));
  expect(api.write).toHaveBeenCalledWith(session,'/rooms/one/chat',{text:'Ready'},expect.any(String));
  await waitFor(()=>expect(input).toHaveValue(''));
  fireEvent.keyDown(input,{key:'Escape'});
  expect(screen.queryByRole('dialog')).toBeNull();expect(launch).toHaveFocus();
  view.unmount();view.client.clear();
});

it('does not mark messages read when an open room chat has scrolled out of view',async()=>{
  let observeVisibility;
  vi.stubGlobal('IntersectionObserver',class {
    constructor(callback){observeVisibility=callback;}
    observe(){}
    disconnect(){}
  });
  let data={messages:[{id:'m1',userId:'other',username:'Other',text:'First'}]};
  api.read.mockImplementation(async()=>data);
  const view=mount();
  const launch=screen.getByRole('button',{name:'Chat in Test room'});
  fireEvent.click(launch);
  await waitFor(()=>expect(localStorage.getItem('hundo-daily:chat-read:me:one')).toBe('m1'));
  act(()=>observeVisibility([{isIntersecting:false,intersectionRatio:0}]));
  data={messages:[...data.messages,{id:'m2',userId:'other',username:'Other',text:'While away'}]};
  await act(()=>view.client.invalidateQueries({queryKey:['daily','me','/rooms/one/chat']}));
  await waitFor(()=>expect(launch).toHaveAccessibleDescription('1 unread message'));
  act(()=>observeVisibility([{isIntersecting:true,intersectionRatio:1}]));
  await waitFor(()=>expect(launch).not.toHaveAttribute('aria-describedby'));
  view.unmount();view.client.clear();vi.unstubAllGlobals();
});
it('keeps history visible and removes posting controls when the server finalizes standings',async()=>{
  api.read.mockResolvedValue({readOnly:false,messages:[{id:'m1',username:'Other',text:'Saved history'}]});
  const view=mount();fireEvent.click(screen.getByRole('button',{name:'Chat in Test room'}));
  await screen.findByText('Saved history');
  api.read.mockResolvedValue({readOnly:true,messages:[{id:'m1',username:'Other',text:'Saved history'}]});
  await act(()=>view.client.invalidateQueries({queryKey:['daily','me','/rooms/one/chat']}));
  await screen.findByText('Room complete · Chat is read-only.');
  expect(screen.getByText('Saved history')).toBeVisible();expect(screen.queryByRole('textbox')).toBeNull();
  view.unmount();view.client.clear();
});

it('shows each author colour and who reacted, and sets or clears an exclusive reaction',async()=>{
  const message={id:'m1',userId:'other',username:'Other',usernameColour:'#12ab34',text:'Nice signing',reactions:[]};
  let data={readOnly:false,messages:[message,{id:'m2',userId:'me',username:'Me',text:'Thanks'}]};
  api.read.mockImplementation(async()=>data);
  api.write.mockImplementation(async(_session,_path,input)=>{
    data={...data,messages:[{...message,reactions:input.reaction ? [{userId:'me',username:'Me',reaction:input.reaction}] : []},data.messages[1]]};
    return data;
  });
  const view=mount();fireEvent.click(screen.getByRole('button',{name:'Chat in Test room'}));
  expect(await screen.findByText('Other')).toHaveStyle({color:'#12ab34'});
  expect(screen.getByText('Me')).not.toHaveAttribute('style');
  expect(screen.queryByRole('button',{name:'Like message from Me'})).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Like message from Other'}));
  await screen.findByText('Liked by Me');
  expect(screen.getByRole('button',{name:'Like message from Other'})).toHaveAttribute('aria-pressed','true');
  fireEvent.click(screen.getByRole('button',{name:'Dislike message from Other'}));
  await screen.findByText('Disliked by Me');expect(screen.queryByText('Liked by Me')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Dislike message from Other'}));
  await waitFor(()=>expect(screen.queryByText('Disliked by Me')).toBeNull());
  expect(api.write).toHaveBeenLastCalledWith(session,'/rooms/one/chat/reactions',{messageId:'m1',reaction:null},expect.any(String));
  view.unmount();view.client.clear();
});
