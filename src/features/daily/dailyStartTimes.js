import { dailyNow } from "./dailyApi.js";

export const DAILY_AUCTION_MS = 30 * 60_000;

export function dailyStartTimes(slate, now = dailyNow()) {
  if (slate?.status !== "open") return [];
  const timestamp = value => typeof value === "number" ? value : Date.parse(value);
  const latest = timestamp(slate.firstGameAt) - DAILY_AUCTION_MS;
  // The server supplies selectable slots. Older servers can still offer their
  // existing default until both sides of the staging release have arrived.
  const candidates = Array.isArray(slate.auctionStartOptions) ? slate.auctionStartOptions : [slate.auctionStartsAt];
  return [...new Set(candidates.map(value => typeof value === "number" && Number.isFinite(value) ? new Date(value).toISOString() : value))].filter(value => {
    const time = Date.parse(value);
    return Number.isFinite(time) && time > now && time <= latest && time % (15 * 60_000) === 0;
  }).sort((a,b) => Date.parse(a) - Date.parse(b));
}
