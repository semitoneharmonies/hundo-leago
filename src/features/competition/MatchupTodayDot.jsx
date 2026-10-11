import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { describeScheduleGame } from './matchupSchedulePresentation.js';

export function MatchupTodayDot({ games, timeZone, playerName }) {
  const [anchor, setAnchor] = useState(null);
  const trigger = useRef(null), popup = useRef(null);
  const id = useId();
  useLayoutEffect(() => {
    if (!anchor || !popup.current) return;
    const { width, height } = popup.current.getBoundingClientRect();
    const x = Math.max(8, Math.min(anchor.x + 10, window.innerWidth - width - 8));
    const y = anchor.y + height + 18 <= window.innerHeight ? anchor.y + 10 : Math.max(8, anchor.y - height - 10);
    popup.current.style.left = `${x}px`;
    popup.current.style.top = `${y}px`;
  }, [anchor]);
  useEffect(() => {
    if (!anchor) return;
    const outside = event => { if (!trigger.current?.contains(event.target) && !popup.current?.contains(event.target)) setAnchor(null); };
    const escape = event => { if (event.key === 'Escape') { setAnchor(null); trigger.current?.focus(); } };
    const close = () => setAnchor(null);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [anchor]);
  return <>
    <button type="button" ref={trigger} className="hl-matchup-today-button"
      aria-label={`Today's game for ${playerName}`} aria-expanded={Boolean(anchor)} aria-describedby={anchor ? id : undefined}
      onClick={event => {
        const rect = event.currentTarget.getBoundingClientRect();
        setAnchor(anchor ? null : { x: event.detail ? event.clientX : rect.right, y: event.detail ? event.clientY : rect.bottom });
      }} />
    {anchor && createPortal(<span ref={popup} id={id} className="hl-matchup-game-popup" role="tooltip" style={{ left: anchor.x, top: anchor.y }}>
      {games.map(game => <span key={game.gameId}>
        <span>{describeScheduleGame(game, timeZone)}</span>
        {['collected', 'awaiting_scoring'].includes(game.status) && <strong>{game.status === 'collected' ? 'Stats collected' : 'Stats pending'}</strong>}
      </span>)}
    </span>, document.body)}
  </>;
}
