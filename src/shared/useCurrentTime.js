import { useEffect, useState } from "react";

export function useCurrentTime() {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const refresh = () => setNowMs(Date.now());
    const timer = window.setInterval(refresh, 15_000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return nowMs;
}
