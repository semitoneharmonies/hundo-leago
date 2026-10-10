import { canonicalNhlTeam } from '../../shared/nhlTeams.js';

// Published HEX equivalents from https://teamcolorcodes.com/nhl-team-color-codes/.
// Checked 2026-10-09. Where the source's RGB and HEX disagree, HEX governs display.
// Utah is absent: use its official NHL SVG palette. Source/Pantone records:
// docs/assets/nhl-branding-sources.json. White also appears in the numeral references.
// [background, stripe, number fill, inner outline, outer outline]
const colours = {
  ANA: ['#F47A38', '#000000', '#FFFFFF', '#000000', '#B9975B'],
  ARI: ['#8C2633', '#E2D6B5', '#FFFFFF', '#111111'],
  BOS: ['#000000', '#FFB81C', '#FFB81C', '#000000', '#FFFFFF'],
  BUF: ['#003087', '#FFB81C', '#FFB81C', '#FFFFFF'],
  CGY: ['#D2001C', '#FAAF19', '#FFFFFF', '#FAAF19'],
  CAR: ['#CE1126', '#000000', '#FFFFFF', '#000000'],
  CHI: ['#CF0A2C', '#000000', '#FFFFFF', '#000000'],
  COL: ['#6F263D', '#236192', '#FFFFFF', '#A2AAAD'],
  CBJ: ['#002654', '#CE1126', '#FFFFFF', '#CE1126'],
  DAL: ['#006847', '#111111', '#FFFFFF', '#111111', '#8F8F8C'],
  DET: ['#CE1126', '#FFFFFF', '#FFFFFF'],
  EDM: ['#041E42', '#FF4C00', '#FFFFFF', '#FF4C00'],
  FLA: ['#C8102E', '#041E42', '#FFFFFF', '#B9975B'],
  LAK: ['#111111', '#A2AAAD', '#FFFFFF', '#111111', '#A2AAAD'],
  MIN: ['#154734', '#DDCBA4', '#DDCBA4', '#A6192E'],
  MTL: ['#AF1E2D', '#192168', '#FFFFFF', '#192168'],
  NSH: ['#FFB81C', '#041E42', '#041E42', '#FFB81C', '#FFFFFF'],
  NJD: ['#CE1126', '#000000', '#FFFFFF', '#000000'],
  NYI: ['#00539B', '#F47D30', '#FFFFFF', '#F47D30'],
  NYR: ['#0038A8', '#CE1126', '#CE1126', '#FFFFFF'],
  OTT: ['#000000', '#DA1A32', '#FFFFFF', '#DA1A32'],
  PHI: ['#F74902', '#000000', '#FFFFFF', '#000000'],
  PIT: ['#000000', '#FCB514', '#FCB514', '#FFFFFF'],
  SJS: ['#006D75', '#000000', '#FFFFFF', '#000000'],
  SEA: ['#001628', '#68A2B9', '#99D9D9', '#68A2B9'],
  STL: ['#002F87', '#FCB514', '#FFFFFF', '#041E42', '#FCB514'],
  TBL: ['#002868', '#FFFFFF', '#FFFFFF'],
  TOR: ['#00205B', '#FFFFFF', '#FFFFFF'],
  UTA: ['#010101', '#6CACE4', '#FFFFFF', '#6CACE4'],
  VAN: ['#00205B', '#00843D', '#FFFFFF'],
  VGK: ['#B4975A', '#333F42', '#333F42', '#FFFFFF', '#000000'],
  WSH: ['#C8102E', '#041E42', '#FFFFFF', '#041E42'],
  WPG: ['#041E42', '#004C97', '#FFFFFF', '#004C97'],
};

export const NHL_CARD_TEAMS = Object.freeze(Object.keys(colours).filter(team => team !== 'ARI'));

export function nhlTeamColours(abbreviation) {
  const [primary, stripe, fill, outline = 'none', outer = 'none'] =
    colours[canonicalNhlTeam(abbreviation)] || ['#2563EB', '#F97316', '#FFFFFF'];
  return {
    '--team-primary': primary, '--team-accent': fill, '--team-stripe': stripe,
    '--team-number-outline': outline, '--team-number-outer': outer,
  };
}
