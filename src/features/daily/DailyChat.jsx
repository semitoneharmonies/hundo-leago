import { useEffect, useId, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, X } from 'lucide-react';
import { dailyRead, dailyWrite, roomPath } from './dailyApi.js';
import './DailyChat.css';

export function DailyChat({ session, room }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const dialog = useRef(null), history = useRef(null), follow = useRef(true), request = useRef(null);
  const titleId = useId(), inputId = useId();
  const client = useQueryClient();
  const path = roomPath(room.id) + '/chat';
  const options = dailyRead(session, path);
  const query = useQuery({ ...options, enabled: open, refetchInterval: open ? 5000 : false,
    refetchIntervalInBackground: false, retry: false });
  const forbidden = [401, 403, 404].includes(query.error?.status);
  const readOnly = query.data?.readOnly || ['finished', 'void', 'closed'].includes(room.phase);
  const send = useMutation({
    mutationFn: ({ value, key }) => dailyWrite(session, path, { text: value }, key),
    onSuccess: async (data, { value }) => {
      await client.cancelQueries({ queryKey: options.queryKey, exact: true });
      client.setQueryData(options.queryKey, old => old?.messages.length > data.messages.length ? old : data);
      setText(current => current === value ? '' : current);
      request.current = null;
      follow.current = true;
      void client.invalidateQueries({ queryKey: options.queryKey, exact: true });
    },
    onError: () => { void query.refetch(); },
  });
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  useEffect(() => {
    if (open && follow.current && history.current) history.current.scrollTop = history.current.scrollHeight;
  }, [open, query.data?.messages.length]);
  function submit(event) {
    event.preventDefault();
    if (!text.trim() || text.length > 280 || readOnly || forbidden || send.isPending) return;
    if (request.current?.value !== text) request.current = { value: text, key: crypto.randomUUID() };
    send.mutate(request.current);
  }
  return <>
    <button type="button" className="hd-chat-launch" aria-label={`Chat in ${room.name}`} aria-haspopup="dialog"
      onClick={() => { follow.current = true; setOpen(true); }}><MessageCircle size={20} aria-hidden="true"/></button>
    <dialog ref={dialog} className="hd-chat" aria-labelledby={titleId} onClose={() => setOpen(false)}>
      <header className="hd-chat-heading"><h2 id={titleId}>{room.name} · Chat</h2>
        <button type="button" className="hd-action" aria-label="Close chat" onClick={() => setOpen(false)}><X size={18} aria-hidden="true"/></button>
      </header>
      <div className="hd-chat-history" ref={history} role="log" aria-label="Room messages" aria-live="polite" aria-relevant="additions"
        onScroll={event => { const el = event.currentTarget; follow.current = el.scrollHeight - el.clientHeight - el.scrollTop < 60; }}>
        {query.isPending && <p role="status">Loading messages…</p>}
        {!forbidden && query.data?.messages.map(message => <p className="hd-chat-message" key={message.id}>
          <strong>{message.username}</strong><span>{message.text}</span>
        </p>)}
        {!query.isPending && !forbidden && query.data?.messages.length === 0 && <p className="hd-chat-empty">No messages yet.</p>}
      </div>
      {(query.error || send.error) && <p className="hd-chat-error" role="alert">{send.error?.message || query.error?.message}</p>}
      {readOnly ? <p className="hd-chat-readonly">Room complete · Chat is read-only.</p> : <form className="hd-chat-compose" onSubmit={submit}>
        <label htmlFor={inputId}>Message</label>
        <textarea id={inputId} rows={2} maxLength={280} value={text} disabled={forbidden || send.isPending || !query.data}
          onChange={event => { setText(event.target.value); if (send.error) send.reset(); }} />
        <div><small>{text.length}/280</small><button type="submit" className="hd-action hd-primary"
          disabled={!text.trim() || forbidden || send.isPending || !query.data}>{send.isPending ? 'Sending…' : 'Send'}</button></div>
      </form>}
    </dialog>
  </>;
}
