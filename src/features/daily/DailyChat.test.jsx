import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeAll, expect, it, vi } from 'vitest';
import { DailyChat } from './DailyChat.jsx';

const api = vi.hoisted(() => ({ read:vi.fn(), write:vi.fn() }));
vi.mock('./dailyApi.js',()=>({ roomPath:id=>'/rooms/'+id,
  dailyRead:(session,path)=>({queryKey:['daily',session.user.id,path],queryFn:api.read}),dailyWrite:api.write }));
beforeAll(()=>{
  HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new Event('close'));};
});
const room={id:'one',name:'Test room',phase:'auction'};
const session={user:{id:'me'}};
function mount() {
  const client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});
  const view=render(<QueryClientProvider client={client}><DailyChat session={session} room={room}/></QueryClientProvider>);
  return {client,...view};
}
it('loads only when opened, renders plain text and preserves a failed draft for idempotent retry',async()=>{
  const data={readOnly:false,messages:[{id:'m1',username:'Other',text:'<img src=x onerror=alert(1)>'}]};
  api.read.mockResolvedValue(data);api.write.mockRejectedValueOnce(Error('Try again')).mockResolvedValueOnce({...data,messages:[...data.messages,{id:'m2',username:'Me',text:'hello'}]});
  const view=mount();expect(api.read).not.toHaveBeenCalled();
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
