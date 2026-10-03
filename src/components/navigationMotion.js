import { createContext, useContext, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export const NavigationMotionContext = createContext(null);

export function useNavigationMotion() {
  return useContext(NavigationMotionContext);
}

// Animate the actual destination header from the selected card's screen position.
// Keeping routing intact preserves deep links, refresh and browser Back/Forward.
export function usePromotedHeader(identity) {
  const headerRef = useRef(null);
  const motion = useNavigationMotion();
  const location = useLocation();
  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const pending = motion?.selection(identity);
    if (!pending) return;
    if (Date.now() - pending.createdAt > 8000 || !window.matchMedia("(min-width: 1024px)").matches) { motion.complete(pending); return; }
    const top = document.querySelector(".hl-app-header")?.getBoundingClientRect().bottom || 0;
    window.scrollTo({ top: Math.max(0, window.scrollY + header.getBoundingClientRect().top - top), behavior: "instant" });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !header.animate) { motion.complete(pending); return; }
    const destination = header.getBoundingClientRect();
    if (!destination.width || !destination.height) return;
    const source = pending.rect;
    header.dataset.navigationAnimating = "true";
    const flight = header.animate([
      { transform: `translate(${source.left - destination.left}px, ${source.top - destination.top}px) scale(${source.width / destination.width}, ${source.height / destination.height})`, transformOrigin: "top left", borderRadius: "10px" },
      { transform: "translate(0, 0) scale(1, 1)", transformOrigin: "top left" },
    ], { duration: 720, easing: "cubic-bezier(.22, 1, .36, 1)" });
    // Reveal the details as one sheet after the header settles, so individual
    // sections do not wipe in independently or rush ahead of the selection.
    const details = header.parentElement.querySelector(":scope > .hl-navigation-details");
    const reveal = details?.animate([
      { transform: "translateY(-64px)", clipPath: "inset(0 0 100% 0)" },
      { transform: "translateY(0)", clipPath: "inset(0 0 0 0)" },
    ], { duration: 1300, delay: 720, fill: "backwards", easing: "cubic-bezier(.4, 0, .2, 1)" });
    if (reveal) {
      details.dataset.navigationRevealing = "true";
      reveal.finished.then(() => { delete details.dataset.navigationRevealing; }).catch(() => {});
    }
    flight.finished.then(() => { delete header.dataset.navigationAnimating; motion.complete(pending); }).catch(() => {});
    return () => {
      flight.cancel();
      reveal?.cancel();
      if (details) delete details.dataset.navigationRevealing;
      delete header.dataset.navigationAnimating;
    };
  }, [identity, location.key, motion]);
  return headerRef;
}
