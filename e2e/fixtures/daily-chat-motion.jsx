import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DailyChat } from '../../src/features/daily/DailyChat.jsx';
import '../../src/index.css';
import '../../src/features/daily/daily.css';
import './daily-chat-motion.css';

const room = { id: 'motion-preview', name: 'Pacific ice', phase: 'auction' };
let messages = [
  { id: 'motion-m1', userId: 'alex', username: 'Alex', usernameColour: '#8cebdc', text: 'Anyone leaving cap for the last few players?', reactions: [] },
  { id: 'motion-m2', userId: 'blake', username: 'Blake', text: 'That was the plan. Then McDavid showed up.', reactions: [] },
  { id: 'motion-m3', userId: 'alex', username: 'Alex', usernameColour: '#8cebdc', text: 'Good luck tonight!', reactions: [] },
];
const session = { user: { id: 'motion-preview-manager' }, httpClient: { request: async (_path, options) => {
  if (options.method === 'POST' && options.body?.text) messages = [...messages, { id: 'motion-m' + (messages.length + 1), userId: session.user.id, username: 'You', text: options.body.text, reactions: [] }];
  return { data: { readOnly: false, messages }, meta: { serverNowMs: Date.now() } };
} } };
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
export function Preview() {
  const surface = useRef(null);
  const [events, setEvents] = useState([]);
  useEffect(() => {
    const button = surface.current.querySelector('.hd-chat-launch');
    const started = performance.now();
    const observer = new MutationObserver(() => {
      const effect = button.getAttribute('data-chat-motion');
      if (!effect) return;
      const rect = button.getBoundingClientRect();
      const at = ((performance.now() - started) / 1000).toFixed(1);
      setEvents(previous => [...previous.slice(-9), { at, effect, width: rect.width, height: rect.height }]);
    });
    observer.observe(button, { attributes: true, attributeFilter: ['data-chat-motion'] });
    return () => observer.disconnect();
  }, []);
  return <main className="motion-preview" ref={surface}>
    <header><p>HUNDO · DAILY</p><h1>Chat motion · local application preview</h1>
      <p>Real chat component with sample data. Starts every eight seconds; each effect lasts 1.1 seconds. Hover, focus, open chat, scroll away or hide the tab to pause.</p>
      <a href="#below-preview">Scroll below the room</a>
    </header>
    <article className="hd-room-box motion-preview-room">
      <header className="hd-room-bar"><h2>Pacific ice</h2><span>3/8 managers · Auction live</span></header>
      <DailyChat room={room} session={session}/>
      <p className="motion-preview-games">TOR @ MTL · VAN @ EDM · COL @ DAL</p>
      <section className="motion-preview-panels">
        <div><h3>Player pool</h3><p>A. Matthews · F</p><p>E. Bouchard · D</p><p>J. Robertson · F</p><p>D. Toews · D</p></div>
        <div><h3>Live auctions</h3><p>Nick Suzuki <strong>$14</strong></p><p>C. McDavid <strong>$27</strong></p><p>Cale Makar <strong>$19</strong></p><p>M. Heiskanen <strong>$9</strong></p></div>
        <div><h3>Your roster</h3><p>W. Nylander · $18</p><p>M. Rielly · $12</p><p><strong>$70 cap remaining</strong></p></div>
      </section>
    </article>
    <section className="motion-preview-log"><h2>Observed animation starts</h2>
      <p>Wiggle → shimmer → balloon → spin → pulse. Times below use the real browser clock. Chat and preview actions stay in this fixture.</p>
      <ol>{events.map((event, index) => <li key={index}>{event.at}s · {event.effect} · stationary target {event.width} × {event.height}px</li>)}</ol>
      {!events.length && <p>Waiting for the first eight-second interval…</p>}
    </section>
    <section id="below-preview" className="motion-preview-below"><h2>Room is now offscreen</h2><a href="#">Return to the room</a></section>
  </main>;
}
createRoot(document.getElementById('root')).render(<StrictMode><QueryClientProvider client={client}><Preview/></QueryClientProvider></StrictMode>);
