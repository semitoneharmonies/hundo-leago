import { useEffect, useRef, useState } from 'react';
import { MINUTE_FLOOR_VERSION } from './dailyBidMinimum.js';
import { dailyNow } from './dailyApi.js';
import './DailyAuctionOpeningBanner.css';

const DURATION = 8_000;
const rememberedWindows = new Map();
const storageKey = (viewerId, room) => 'hundo-daily-opening:' + encodeURIComponent(JSON.stringify([
  viewerId ?? 'anonymous', room.id, room.auctionStartsAt,
]));

function previousDeadline(key) {
  if (rememberedWindows.has(key)) return rememberedWindows.get(key);
  try {
    const saved = Number(sessionStorage.getItem(key));
    if (Number.isFinite(saved) && saved > 0) {
      rememberedWindows.set(key, saved);
      return saved;
    }
  } catch { /* Keep the once-per-room window in memory when storage is unavailable. */ }
  return null;
}

function rememberDeadline(key, deadline) {
  rememberedWindows.set(key, deadline);
  try { sessionStorage.setItem(key, String(deadline)); }
  catch { /* The in-memory copy still survives component remounts. */ }
}

export function DailyAuctionOpeningBanner({ room, viewerId }) {
  const anchor = useRef(null);
  const key = storageKey(viewerId, room);
  const endsAt = Date.parse(room.auctionEndsAt);
  const eligible = room.phase === 'auction' && (!Number.isFinite(endsAt) || dailyNow() < endsAt);
  const [display, setDisplay] = useState({ key: null, deadline: 0, visible: false });
  const active = eligible && display.key === key && display.visible;
  const capNote = room.capBonusRatePercent > 0
    ? `Cap bonus: ${room.capBonusRatePercent}% extra positive team FP per $1 unspent.`
    : 'Cap bonus off · Team score uses hockey FP only.';

  useEffect(() => {
    if (!eligible) return;
    let inView = false;
    let timeout;
    let frame;
    let disposed = false;
    function hide() {
      setDisplay(previous => previous.key === key && previous.visible ? { ...previous, visible: false } : previous);
    }
    function consider() {
      if (disposed) return;
      clearTimeout(timeout);
      const roomTimeLeft = Number.isFinite(endsAt) ? endsAt - dailyNow() : Infinity;
      if (!inView || document.visibilityState !== 'visible' || roomTimeLeft <= 0) { hide(); return; }
      let deadline = previousDeadline(key);
      if (deadline === null) {
        deadline = Date.now() + DURATION;
        rememberDeadline(key, deadline);
      }
      const remaining = Math.min(deadline - Date.now(), roomTimeLeft);
      if (remaining <= 0) { hide(); return; }
      setDisplay({ key, deadline, visible: true });
      timeout = setTimeout(hide, remaining);
    }
    const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
      const entry = entries.find(item => item.target === anchor.current);
      if (!entry) return;
      inView = entry.isIntersecting && entry.intersectionRatio >= 0.1;
      consider();
    }, { threshold: [0, 0.1] }) : null;
    if (observer) observer.observe(anchor.current);
    else frame = requestAnimationFrame(() => { inView = true; consider(); });
    document.addEventListener('visibilitychange', consider);
    return () => {
      disposed = true;
      observer?.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
      document.removeEventListener('visibilitychange', consider);
    };
  }, [eligible, key, endsAt]);

  return <div ref={anchor} className={eligible ? 'hd-opening-slot' : undefined}>
    <p className={'hd-note hd-room-footnote' + (eligible ? ' hd-opening-fallback' : '')}
      aria-hidden={active || undefined}>{capNote}</p>
    {eligible && <div className={'hd-opening-banner' + (active ? ' is-active' : '')}
      role={active ? 'status' : undefined} aria-live={active ? 'polite' : undefined} aria-atomic={active || undefined}
      aria-hidden={!active}>
      <strong className="hd-opening-title">Auction open</strong>
      <p>{room.biddingVersion === MINUTE_FLOOR_VERSION
        ? 'Opening bids start at $1 and rise $1 each minute. Players already up for auction keep their original minimum.'
        : `Minimum bid $${room.rules?.minBid ?? 1}. Each player auction has its own timer.`}</p>
      <p>{room.capBonusRatePercent > 0
        ? `Every $1 of unused cap boosts your team’s positive FP by ${room.capBonusRatePercent}%.`
        : 'Cap bonus off · Team score uses hockey FP only.'}</p>
    </div>}
  </div>;
}
