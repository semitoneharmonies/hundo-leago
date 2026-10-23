import { useEffect, useRef, useState } from "react";
import { Cat } from "lucide-react";
import { currentKittyReminder, rememberKittyReminder } from "./kittyPaymentReminder.js";
import "./KittyPaymentFlag.css";

// Keep one daily deadline, including across redirects, remounts and refreshes.
export function KittyPaymentFlag({ userId }) {
  const [reminder, setReminder] = useState(() => currentKittyReminder(userId));
  const flagRef = useRef(null);

  useEffect(() => {
    const flag = flagRef.current;
    const header = flag?.closest(".hl-app-header");
    if (!header) return;
    const measure = () => header.style.setProperty("--hl-kitty-height", `${flag.offsetHeight}px`);
    measure();
    const observer = globalThis.ResizeObserver ? new ResizeObserver(measure) : null;
    observer?.observe(flag);
    return () => {
      observer?.disconnect();
      header.style.removeProperty("--hl-kitty-height");
    };
  }, [reminder]);

  useEffect(() => {
    if (!reminder) return;
    rememberKittyReminder(userId, reminder);
    const timer = window.setTimeout(() => setReminder(null), Math.max(0, reminder.expiresAtMs - Date.now()));
    return () => window.clearTimeout(timer);
  }, [userId, reminder]);

  useEffect(() => {
    const onReturn = () => {
      if (document.visibilityState !== "visible") return;
      const next = currentKittyReminder(userId);
      // Save before updating, as focus and visibilitychange can arrive together.
      if (next) rememberKittyReminder(userId, next);
      setReminder(next);
    };
    window.addEventListener("focus", onReturn);
    document.addEventListener("visibilitychange", onReturn);
    return () => {
      window.removeEventListener("focus", onReturn);
      document.removeEventListener("visibilitychange", onReturn);
    };
  }, [userId]);

  if (!reminder) return null;

  return (
    <aside ref={flagRef} className="hl-kitty-flag" aria-label="League kitty payment reminder">
      <Cat className="hl-kitty-flag__cat" aria-hidden="true" />
      <p>{reminder.message}</p>
    </aside>
  );
}
