// Team colour accents from the NHL's official team marks (September 2026):
// https://assets.nhle.com/logos/nhl/svg/{abbreviation}_light.svg
// A decorative number treatment, not a reproduction of an official sweater.
const colours = {
  ANA: ['#010101', '#cf4520'], BOS: ['#010101', '#ffb81c'],
  BUF: ['#003087', '#ffb81c'], CAR: ['#cd001a', '#ffffff'],
  CBJ: ['#041e42', '#c8102e'], CGY: ['#c8102e', '#f1be48'],
  CHI: ['#c8102e', '#ffffff'], COL: ['#862633', '#236192'],
  DAL: ['#00843d', '#ffffff'], DET: ['#c8102e', '#ffffff'],
  EDM: ['#00205b', '#cf4520'], FLA: ['#041e42', '#b9975b'],
  LAK: ['#010101', '#a2aaad'], MIN: ['#154734', '#ddcba4'],
  MTL: ['#001e62', '#a6192e'], NJD: ['#010101', '#cd001a'],
  NSH: ['#041e42', '#ffb81c'], NYI: ['#003087', '#fc4c02'],
  NYR: ['#0033a0', '#c8102e'], OTT: ['#010101', '#c8102e'],
  PHI: ['#010101', '#dc4405'], PIT: ['#010101', '#ffb81c'],
  SEA: ['#041c2c', '#9cdbd9'], SJS: ['#00778b', '#e57200'],
  STL: ['#006ac6', '#ffb81c'], TBL: ['#00205b', '#ffffff'],
  TOR: ['#00205b', '#ffffff'], UTA: ['#010101', '#6cace4'],
  VAN: ['#00205b', '#ffffff'], VGK: ['#333f48', '#b9975b'],
  WPG: ['#041e42', '#a2aaad'], WSH: ['#041e42', '#c8102e'],
};

export function nhlTeamColours(abbreviation) {
  const [primary, accent] = colours[abbreviation] || ['#2563eb', '#f97316'];
  return { '--team-primary': primary, '--team-accent': accent };
}
