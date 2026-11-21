import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { injuryDetailLines } from '../../shared/playerInjury.js';
import './DailyPlayerName.css';

const stat = value => Number.isFinite(value) ? value : '—';

export function DailyPlayerName({ player, className = '' }) {
  const id = useId();
  const trigger = useRef(null);
  const popup = useRef(null);
  const timer = useRef(null);
  const pinned = useRef(false);
  const focused = useRef(false);
  const hovered = useRef(false);
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState(null);
  const injured = player.injury?.status === 'injured';
  const stats = player.seasonStatistics;
  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    pinned.current = false;
    setOpen(false);
  }, []);

  function show() {
    clearTimeout(timer.current);
    // A body portal would be inert and behind an open auction bid dialog.
    setHost(trigger.current.closest('dialog') || document.body);
    setOpen(true);
  }
  function leave() {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!pinned.current && !focused.current && !hovered.current) dismiss();
    }, 160);
  }
  function enter(event) {
    if (event.pointerType !== 'mouse') return;
    hovered.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(show, 180);
  }
  function pointerLeave(event) {
    if (event.pointerType !== 'mouse') return;
    hovered.current = false;
    leave();
  }

  useEffect(() => () => clearTimeout(timer.current), []);
  useLayoutEffect(() => {
    if (!open) return;
    const node = popup.current;
    function place() {
      const anchor = trigger.current.getBoundingClientRect();
      const viewport = window.visualViewport;
      const left = viewport?.offsetLeft || 0, top = viewport?.offsetTop || 0;
      const width = viewport?.width || window.innerWidth, height = viewport?.height || window.innerHeight;
      node.style.maxHeight = `${Math.max(80, height - 24)}px`;
      node.style.maxWidth = `${Math.max(120, width - 24)}px`;
      const box = node.getBoundingClientRect();
      const x = Math.max(left + 12, Math.min(anchor.left, left + width - box.width - 12));
      const below = anchor.bottom + 8;
      const y = below + box.height <= top + height - 12 ? below : anchor.top - box.height - 8;
      node.style.left = `${x}px`;
      node.style.top = `${Math.max(top + 12, Math.min(y, top + height - box.height - 12))}px`;
    }
    function outside(event) {
      if (!trigger.current.contains(event.target) && !node.contains(event.target)) dismiss();
    }
    function escape(event) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      dismiss();
    }
    function scroll(event) {
      if (!node.contains(event.target)) dismiss();
    }
    place();
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(place) : null;
    resize?.observe(node);
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', escape, true);
    document.addEventListener('scroll', scroll, true);
    window.addEventListener('resize', place);
    window.visualViewport?.addEventListener('resize', place);
    window.visualViewport?.addEventListener('scroll', place);
    return () => {
      resize?.disconnect();
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('keydown', escape, true);
      document.removeEventListener('scroll', scroll, true);
      window.removeEventListener('resize', place);
      window.visualViewport?.removeEventListener('resize', place);
      window.visualViewport?.removeEventListener('scroll', place);
    };
  }, [open, dismiss]);

  return <span className={`hd-player-name ${className}`}>
    <button type="button" ref={trigger}
      className={'hd-player-name-trigger' + (injured ? ' hl-injured-player-name' : '')}
      aria-label={player.name + (injured ? ' — injured' : '')}
      aria-describedby={open ? id : undefined}
      onPointerEnter={enter} onPointerLeave={pointerLeave}
      onFocus={() => { focused.current = true; show(); }}
      onBlur={() => {
        focused.current = false;
        if (!pinned.current && !hovered.current) dismiss();
        else leave();
      }}
      onClick={event => {
        event.stopPropagation();
        if (pinned.current) dismiss();
        else { pinned.current = true; show(); }
      }}>{player.name}</button>
    {open && host && createPortal(<div ref={popup} id={id} role="tooltip" className="hd-player-tooltip"
      onPointerEnter={event => { if (event.pointerType === 'mouse') { hovered.current = true; clearTimeout(timer.current); } }}
      onPointerLeave={pointerLeave}>
      <div className={'hd-player-tooltip-name' + (injured ? ' is-injured' : '')}>{player.name}</div>
      <p className="hd-player-tooltip-team">{player.team} · {player.position === 'D' ? 'D' : 'F'}{player.opponent ? ` vs ${player.opponent}` : ''}</p>
      <p className="hd-player-tooltip-label">Season stats</p>
      <dl className="hd-player-tooltip-stats">
        <div><dt>GP</dt><dd>{stat(stats?.gamesPlayed)}</dd></div>
        <div><dt>Goals</dt><dd>{stat(stats?.goals)}</dd></div>
        <div><dt>Assists</dt><dd>{stat(stats?.assists)}</dd></div>
        <div><dt>FP</dt><dd className="hd-player-tooltip-fp">{Number.isFinite(stats?.fantasyPointsHundredths) ? (stats.fantasyPointsHundredths / 100).toFixed(2) : '—'}</dd></div>
      </dl>
      {!stats && <p className="hd-player-tooltip-note">Season statistics unavailable.</p>}
      <div className="hd-player-tooltip-health" data-injured={injured}>
        <p>{injured ? 'Injured' : player.injury?.status === 'healthy' ? 'Healthy' : 'Injury status unconfirmed'}</p>
        {injuryDetailLines(player.injury).map(line => <p key={line}>{line}</p>)}
        {injured && !player.injury.details?.timeline && <p>Recovery timeline not provided.</p>}
        {player.injury?.needsReview && <p className="hd-player-tooltip-note">Awaiting injury review.</p>}
        {player.injury?.stale && <p className="hd-player-tooltip-note">Last injury report is outdated.</p>}
      </div>
    </div>, host)}
  </span>;
}
