function fail(message) {
  throw new TypeError(`Invalid connected FAD scenario: ${message}`)
}

export function accountByAlias(manifest, alias) {
  const account = Object.values(manifest.accounts).find(
    (candidate) => candidate.alias === alias
  )
  if (!account) fail(`account alias ${alias} is unavailable.`)
  return account
}

export function teamByAlias(league, alias) {
  const team = league.teams.find((candidate) => candidate.alias === alias)
  if (!team) fail(`team alias ${alias} is unavailable in ${league.alias}.`)
  return team
}

export function teamsForManager(league, account) {
  return league.teams.filter(
    (team) => team.managerAccountAlias === account.alias
  )
}

export function privateCandidateForTeam(league, team) {
  const candidate = league.sentinels.privateCandidates.find(
    (sentinel) => sentinel.teamAlias === team.alias
  )
  if (!candidate) {
    fail(`private Candidate sentinel for ${team.alias} is unavailable.`)
  }
  return candidate
}

export function privacyMarkers(manifest) {
  const markers = manifest.privacyChecks.privateMarkers
  if (
    !Array.isArray(markers) ||
    markers.length === 0 ||
    markers.some((marker) => typeof marker !== 'string' || !marker)
  ) {
    fail('privacyChecks.privateMarkers is invalid.')
  }
  return markers
}
