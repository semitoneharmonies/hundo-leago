import { useEffect, useId, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Sparkles, ThumbsDown, ThumbsUp, X } from 'lucide-react';
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
  const react = useMutation({
    mutationFn: input => dailyWrite(session, path + '/reactions', input, crypto.randomUUID()),
    onSuccess: () => client.invalidateQueries({ queryKey: options.queryKey, exact: true }),
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
      title="Room chat" onClick={() => { follow.current = true; setOpen(true); }}>
      <MessageCircle size={21} aria-hidden="true"/><Sparkles className="hd-chat-sparkle" size={12} aria-hidden="true"/>
    </button>
    <dialog ref={dialog} className="hd-chat" aria-labelledby={titleId} onClose={() => setOpen(false)}>
      <header className="hd-chat-heading"><h2 id={titleId}>{room.name} · Chat</h2>
        <button type="button" className="hd-action" aria-label="Close chat" onClick={() => setOpen(false)}><X size={18} aria-hidden="true"/></button>
      </header>
      <div className="hd-chat-history" ref={history} role="log" aria-label="Room messages" aria-live="polite" aria-relevant="additions"
        onScroll={event => { const el = event.currentTarget; follow.current = el.scrollHeight - el.clientHeight - el.scrollTop < 60; }}>
        {query.isPending && <p role="status">Loading messages…</p>}
        {!forbidden && query.data?.messages.map(message => {
          const reactions = message.reactions || [];
          const mine = reactions.find(item => item.userId === session.user.id)?.reaction;
          const colour = /^#[0-9a-f]{6}$/i.test(message.usernameColour || '') ? message.usernameColour : undefined;
          return <article className="hd-chat-message" key={message.id} tabIndex={0} aria-label={`Message from ${message.username}`}
            onPointerDown={event => { if (event.pointerType === 'touch' && !event.target.closest('button,[data-reaction-badge]')) event.currentTarget.focus(); }}>
            <strong className="hd-chat-username" style={{ color: colour }}>{message.username}</strong>
            <span className="hd-chat-text">{message.text}</span>
            {['like', 'dislike'].map(value => {
              const names = reactions.filter(item => item.reaction === value).map(item => item.username);
              const Icon = value === 'like' ? ThumbsUp : ThumbsDown;
              const label = `${value === 'like' ? 'Liked' : 'Disliked'} by ${names.join(', ')}`;
              return names.length > 0 && <span className="hd-chat-reaction-badge" key={value} tabIndex={0}
                data-reaction-badge aria-label={label} onPointerDown={event => { if (event.pointerType === 'touch') event.currentTarget.focus(); }}>
                <Icon size={10} aria-hidden="true"/><span aria-hidden="true">{names.length}</span>
                <span className="hd-chat-reaction-names" role="tooltip">{label}</span>
              </span>;
            })}
            {!readOnly && message.userId !== session.user.id && <div className="hd-chat-reactions">
              {['like', 'dislike'].map(value => {
                const people = reactions.filter(item => item.reaction === value).map(item => item.username);
                const Icon = value === 'like' ? ThumbsUp : ThumbsDown;
                return <button key={value} type="button" aria-pressed={mine === value}
                  aria-label={`${value === 'like' ? 'Like' : 'Dislike'} message from ${message.username}`}
                  title={people.length ? `${value === 'like' ? 'Liked' : 'Disliked'} by ${people.join(', ')}` : value === 'like' ? 'Like' : 'Dislike'}
                  disabled={react.isPending}
                  onClick={() => react.mutate({ messageId: message.id, reaction: mine === value ? null : value })}>
                  <Icon size={12} aria-hidden="true"/>
                </button>;
              })}
            </div>}
          </article>;
        })}
        {!query.isPending && !forbidden && query.data?.messages.length === 0 && <p className="hd-chat-empty">No messages yet.</p>}
      </div>
      {(query.error || send.error || react.error) && <p className="hd-chat-error" role="alert">{react.error?.message || send.error?.message || query.error?.message}</p>}
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
