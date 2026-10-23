const aliases = Object.freeze({
  LA: 'LAK', MON: 'MTL', NJ: 'NJD', NAS: 'NSH',
  SJ: 'SJS', TB: 'TBL', VEG: 'VGK', WAS: 'WSH',
});

export function canonicalNhlTeam(abbreviation) {
  return aliases[abbreviation] ?? abbreviation;
}
