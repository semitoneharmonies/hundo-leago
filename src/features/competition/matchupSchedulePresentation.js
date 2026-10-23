export function scheduleDay(time, timeZone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(time);
}

export function describeScheduleGame(game, timeZone) {
  const time = game.timeTbd ? 'Time TBD' : new Intl.DateTimeFormat('en-CA', { timeZone, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(game.startsAtMs);
  const opponent = game.opponent ? `${game.isHome ? 'vs' : '@'} ${game.opponent}` : 'Game';
  return `${opponent} · ${time}${game.status === 'live' ? ' · Live' : ''}`;
}
