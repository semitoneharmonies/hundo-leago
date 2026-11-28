import { dailyNow } from './dailyApi.js';

export const MINUTE_FLOOR_VERSION = 'minute-floor-v1';
const positiveInteger = value => Number.isSafeInteger(value) && value > 0;

// This advances the server's displayed floor between polls. The server still
// validates the actual receipt time; never change a submitted amount here.
export function nominationMinimum(room, now = dailyNow()) {
  const base = positiveInteger(room.nominationMinimum) ? room.nominationMinimum : room.rules?.minBid ?? 1;
  const next = Date.parse(room.nominationMinimumIncreasesAt);
  if (room.biddingVersion !== MINUTE_FLOOR_VERSION || room.phase !== 'auction' || !Number.isFinite(next)) return base;
  const end = Date.parse(room.auctionEndsAt);
  const elapsed = Math.min(now, Number.isFinite(end) ? end - 1 : now) - next;
  return elapsed < 0 ? base : base + 1 + Math.floor(elapsed / 60_000);
}

export function playerMinimum(room, player, now = dailyNow()) {
  if (player.endsAt) return positiveInteger(player.minimumBid) ? player.minimumBid : room.rules?.minBid ?? 1;
  return nominationMinimum(room, now);
}
