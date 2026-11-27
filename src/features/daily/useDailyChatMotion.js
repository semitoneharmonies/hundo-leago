import { useEffect, useRef } from 'react';

const effects = ['wiggle', 'shimmer', 'balloon', 'spin', 'pulse'];
const intervalMs = 8000;
const durationMs = 1100;

// Only the inner face moves. No motion state is persisted or reported.
export function useDailyChatMotion(launcher, open) {
  const nextEffect = useRef(0);
  useEffect(() => {
    const button = launcher.current;
    if (!button || open || typeof IntersectionObserver !== 'function' || typeof window.matchMedia !== 'function') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let onscreen = false;
    let hovered = button.matches(':hover');
    let focused = document.activeElement === button;
    let nextTimer, endTimer;
    const blocked = () => !onscreen || hovered || focused || document.hidden || reduced.matches;
    function stop() {
      clearTimeout(nextTimer);
      clearTimeout(endTimer);
      button.removeAttribute('data-chat-motion');
    }
    function play() {
      if (blocked()) { stop(); return; }
      button.setAttribute('data-chat-motion', effects[nextEffect.current]);
      nextEffect.current = (nextEffect.current + 1) % effects.length;
      endTimer = setTimeout(() => button.removeAttribute('data-chat-motion'), durationMs);
      nextTimer = setTimeout(play, intervalMs);
    }
    function restart() {
      stop();
      if (!blocked()) nextTimer = setTimeout(play, intervalMs);
    }
    const enter = () => { hovered = true; restart(); };
    const leave = () => { hovered = false; restart(); };
    const focus = () => { focused = true; restart(); };
    const blur = () => { focused = false; restart(); };
    const observer = new IntersectionObserver(entries => {
      const entry = entries.find(item => item.target === button);
      if (!entry) return;
      const next = entry.isIntersecting && entry.intersectionRatio >= 0.1;
      if (next !== onscreen) { onscreen = next; restart(); }
    }, { threshold: 0.1 });
    observer.observe(button);
    button.addEventListener('mouseenter', enter);
    button.addEventListener('mouseleave', leave);
    button.addEventListener('focus', focus);
    button.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', restart);
    if (reduced.addEventListener) reduced.addEventListener('change', restart);
    else reduced.addListener?.(restart);
    return () => {
      stop();
      observer.disconnect();
      button.removeEventListener('mouseenter', enter);
      button.removeEventListener('mouseleave', leave);
      button.removeEventListener('focus', focus);
      button.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', restart);
      if (reduced.removeEventListener) reduced.removeEventListener('change', restart);
      else reduced.removeListener?.(restart);
    };
  }, [launcher, open]);
}
