import { useEffect } from "react";
import { dailyNow } from "./dailyApi.js";

// Ask the server for the opening phase at the deadline, rather than waiting
// for the next regular poll. The server still decides when bids are accepted.
export function useDailyOpeningRefresh(startsAt, refetch) {
  useEffect(() => {
    const deadline = Date.parse(startsAt);
    if (!Number.isFinite(deadline)) return;
    let timer;
    const refreshAtOpening = () => {
      const delay = deadline - dailyNow();
      if (delay <= 0) { void refetch(); return; }
      timer = setTimeout(refreshAtOpening, Math.min(delay + 25, 2_147_483_647));
    };
    refreshAtOpening();
    return () => clearTimeout(timer);
  }, [startsAt, refetch]);
}
