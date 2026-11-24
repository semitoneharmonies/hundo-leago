export const dailyAlertOptions = [
  ['reminder', '10 minutes before'], ['start', 'Auction starts'],
  ['idle', '15 minutes left · no players signed'], ['end', 'Auction ends'], ['win', 'You win'],
];

export function dailyNotificationCopy(item) {
  const data = item.messageData ?? {};
  const room = data.roomName || 'Your room';
  switch (item.type) {
    case 'daily_auction_reminder': return `${room} · Auction starts in 10 minutes.`;
    case 'daily_auction_started': return `${room} · Bidding is open.`;
    case 'daily_auction_idle': return `${room} · 15 minutes left. You haven’t signed a player yet.`;
    case 'daily_auction_ended': return `${room} · Auction over. Your roster is locked.`;
    case 'daily_room_won': return `${room} · ${data.tied ? 'You tied for first' : 'You won'}${Number.isFinite(data.points) ? ` with ${data.points.toFixed(2)} FP` : ''}! Final scores are in.`;
    default: return `${room} · ${data.message || 'Room update.'}`;
  }
}
