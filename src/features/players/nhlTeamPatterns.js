import { canonicalNhlTeam } from '../../shared/nhlTeams.js';

// User-selected mockups. Speed 1 and diagonals 4 intentionally share the same artwork.
export const NHL_CARD_PATTERN_SELECTIONS = Object.freeze({
  "speed-1": {
    "pattern": "speed-lines",
    "label": "Speed lines · 1"
  },
  "speed-2": {
    "pattern": "paired-lines",
    "label": "Speed lines · 2 — Paired lines"
  },
  "speed-3": {
    "pattern": "speed-trails",
    "label": "Speed lines · 3 — Speed + trailing ribbons"
  },
  "diagonals-4": {
    "pattern": "speed-lines",
    "label": "More diagonals · 4 — Speed lines"
  },
  "diagonals-5": {
    "pattern": "trailing-ribbons",
    "label": "More diagonals · 5 — Trailing ribbons"
  },
  "diagonals-6": {
    "pattern": "full-energy",
    "label": "More diagonals · 6 — Full energy"
  }
});

// Shuffled once on 2026-10-11, balanced across the six selections.
// Keep these assignments fixed: opening a card must not reroll a team's artwork.
export const NHL_TEAM_CARD_SELECTION = Object.freeze({
  "ANA": "speed-3",
  "BOS": "speed-1",
  "BUF": "diagonals-5",
  "CAR": "diagonals-4",
  "CBJ": "diagonals-6",
  "CGY": "diagonals-6",
  "CHI": "speed-3",
  "COL": "speed-1",
  "DAL": "diagonals-4",
  "DET": "speed-2",
  "EDM": "diagonals-5",
  "FLA": "speed-3",
  "LAK": "speed-2",
  "MIN": "diagonals-5",
  "MTL": "speed-2",
  "NJD": "diagonals-4",
  "NSH": "speed-1",
  "NYI": "diagonals-5",
  "NYR": "diagonals-4",
  "OTT": "speed-1",
  "PHI": "diagonals-4",
  "PIT": "speed-3",
  "SEA": "speed-2",
  "SJS": "diagonals-6",
  "STL": "diagonals-6",
  "TBL": "speed-3",
  "TOR": "diagonals-6",
  "UTA": "speed-2",
  "VAN": "speed-1",
  "VGK": "speed-3",
  "WPG": "diagonals-6",
  "WSH": "diagonals-5"
});

export function nhlTeamPattern(team) {
  return NHL_CARD_PATTERN_SELECTIONS[NHL_TEAM_CARD_SELECTION[canonicalNhlTeam(team)]]?.pattern || 'original';
}
