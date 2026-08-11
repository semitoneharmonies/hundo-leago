import { localFadEnvironmentKeys } from './localStack.js'

function fail(message) {
  throw new TypeError(`Invalid connected FAD fixture: ${message}`)
}

function record(value, location) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${location} must be an object.`)
  }
  return value
}

function text(value, location) {
  if (typeof value !== 'string' || !value.trim()) {
    fail(`${location} must be non-empty text.`)
  }
  return value
}

function stableId(value, location) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '')) {
    fail(`${location} must be a stable UUID.`)
  }
  return value
}

function canonicalId(value, location) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '')) {
    fail(`${location} must be a canonical UUID.`)
  }
  return value
}

function exactKeys(value, keys, location) {
  const actual = Object.keys(record(value, location)).sort()
  const expected = [...keys].sort()
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${location} has an unexpected shape.`)
  }
}

function validateAccount(account, location) {
  exactKeys(account, ['alias', 'userId', 'email'], location)
  text(account.alias, `${location}.alias`)
  stableId(account.userId, `${location}.userId`)
  text(account.email, `${location}.email`)
}

function validateTeam(team, location) {
  exactKeys(
    team,
    ['alias', 'name', 'teamId', 'managerAccountAlias', 'cardId'],
    location
  )
  text(team.alias, `${location}.alias`)
  text(team.name, `${location}.name`)
  stableId(team.teamId, `${location}.teamId`)
  text(team.managerAccountAlias, `${location}.managerAccountAlias`)
  stableId(team.cardId, `${location}.cardId`)
}

function validatePrivateCandidate(candidate, location) {
  exactKeys(
    candidate,
    ['alias', 'playerFullName', 'playerId', 'teamAlias', 'slotKey', 'entryId'],
    location
  )
  text(candidate.alias, `${location}.alias`)
  text(candidate.playerFullName, `${location}.playerFullName`)
  stableId(candidate.playerId, `${location}.playerId`)
  text(candidate.teamAlias, `${location}.teamAlias`)
  text(candidate.slotKey, `${location}.slotKey`)
  canonicalId(candidate.entryId, `${location}.entryId`)
}

function validateCardReadyNotification(notification, location) {
  exactKeys(
    notification,
    [
      'notificationId',
      'eventType',
      'recipientAccountAlias',
      'teamAlias',
      'copy',
    ],
    location
  )
  stableId(notification.notificationId, `${location}.notificationId`)
  text(notification.eventType, `${location}.eventType`)
  text(
    notification.recipientAccountAlias,
    `${location}.recipientAccountAlias`
  )
  text(notification.teamAlias, `${location}.teamAlias`)
  text(notification.copy, `${location}.copy`)
}

function validateSentinels(sentinels, location, { alpha }) {
  exactKeys(
    sentinels,
    alpha
      ? [
          'lockedCarryover',
          'privateCandidates',
          'exactCommissionerHelp',
          'cardReadyNotification',
        ]
      : ['privateCandidates', 'cardReadyNotification'],
    location
  )
  if (!Array.isArray(sentinels.privateCandidates)) {
    fail(`${location}.privateCandidates must be an array.`)
  }
  sentinels.privateCandidates.forEach((candidate, index) =>
    validatePrivateCandidate(candidate, `${location}.privateCandidates[${index}]`)
  )
  validateCardReadyNotification(
    sentinels.cardReadyNotification,
    `${location}.cardReadyNotification`
  )
  if (!alpha) return
  exactKeys(
    sentinels.lockedCarryover,
    ['playerFullName', 'playerId', 'teamAlias', 'slotKey', 'entryId'],
    `${location}.lockedCarryover`
  )
  text(
    sentinels.lockedCarryover.playerFullName,
    `${location}.lockedCarryover.playerFullName`
  )
  stableId(
    sentinels.lockedCarryover.playerId,
    `${location}.lockedCarryover.playerId`
  )
  text(
    sentinels.lockedCarryover.teamAlias,
    `${location}.lockedCarryover.teamAlias`
  )
  text(
    sentinels.lockedCarryover.slotKey,
    `${location}.lockedCarryover.slotKey`
  )
  canonicalId(
    sentinels.lockedCarryover.entryId,
    `${location}.lockedCarryover.entryId`
  )
  exactKeys(
    sentinels.exactCommissionerHelp,
    [
      'teamAlias',
      'cardId',
      'helpRequestId',
      'message',
      'privatePlayerFullName',
      'requestingAccountAlias',
      'commissionerAccountAlias',
    ],
    `${location}.exactCommissionerHelp`
  )
  const help = sentinels.exactCommissionerHelp
  text(help.teamAlias, `${location}.exactCommissionerHelp.teamAlias`)
  stableId(help.cardId, `${location}.exactCommissionerHelp.cardId`)
  stableId(
    help.helpRequestId,
    `${location}.exactCommissionerHelp.helpRequestId`
  )
  for (const key of [
    'message',
    'privatePlayerFullName',
    'requestingAccountAlias',
    'commissionerAccountAlias',
  ]) {
    text(help[key], `${location}.exactCommissionerHelp.${key}`)
  }
}

function validateLeague(league, location) {
  exactKeys(
    league,
    [
      'alias',
      'name',
      'leagueId',
      'seasonId',
      'fadId',
      'phase',
      'openedAtMs',
      'helpOpensAtMs',
      'firstWeekStartsAtMs',
      'candidateDeadlineAtMs',
      'commissionerAccountAlias',
      'teams',
      'sentinels',
    ],
    location
  )
  text(league.alias, `${location}.alias`)
  text(league.name, `${location}.name`)
  stableId(league.leagueId, `${location}.leagueId`)
  stableId(league.seasonId, `${location}.seasonId`)
  stableId(league.fadId, `${location}.fadId`)
  if (league.phase !== 'cards_open') {
    fail(`${location}.phase must be cards_open.`)
  }
  if (
    !Number.isSafeInteger(league.openedAtMs) ||
    !Number.isSafeInteger(league.helpOpensAtMs) ||
    !Number.isSafeInteger(league.firstWeekStartsAtMs) ||
    !Number.isSafeInteger(league.candidateDeadlineAtMs)
  ) {
    fail(`${location} clock values are invalid.`)
  }
  if (
    league.openedAtMs > league.helpOpensAtMs ||
    league.helpOpensAtMs >= league.candidateDeadlineAtMs ||
    league.candidateDeadlineAtMs >= league.firstWeekStartsAtMs
  ) {
    fail(`${location} clock ordering is invalid.`)
  }
  text(
    league.commissionerAccountAlias,
    `${location}.commissionerAccountAlias`
  )
  if (!Array.isArray(league.teams) || league.teams.length !== 6) {
    fail(`${location}.teams must contain exactly six teams.`)
  }
  league.teams.forEach((team, index) =>
    validateTeam(team, `${location}.teams[${index}]`)
  )
  validateSentinels(league.sentinels, `${location}.sentinels`, {
    alpha: location.endsWith('.alpha'),
  })
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value
  }
  Object.values(value).forEach(deepFreeze)
  return Object.freeze(value)
}

function decodeManifest(encoded) {
  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
  } catch {
    fail('the encoded manifest cannot be decoded.')
  }
}

export function readConnectedFadFixture(environment = process.env) {
  const encoded = text(
    environment[localFadEnvironmentKeys.manifest],
    localFadEnvironmentKeys.manifest
  )
  const password = text(
    environment[localFadEnvironmentKeys.password],
    localFadEnvironmentKeys.password
  )
  const manifest = decodeManifest(encoded)
  exactKeys(
    manifest,
    [
      'schemaVersion',
      'fixtureKind',
      'fixedNowMs',
      'accounts',
      'leagues',
      'privacyChecks',
    ],
    'manifest'
  )
  if (
    manifest.schemaVersion !== 1 ||
    manifest.fixtureKind !== 'free_agent_draft_browser' ||
    !Number.isSafeInteger(manifest.fixedNowMs)
  ) {
    fail('the manifest identity is invalid.')
  }
  const accountKeys = [
    'platformAdmin',
    'alphaCommissioner',
    'alphaMultiTeamManager',
    'alphaOtherManager',
    'betaCommissioner',
    'betaManager',
  ]
  exactKeys(manifest.accounts, accountKeys, 'manifest.accounts')
  accountKeys.forEach((key) =>
    validateAccount(manifest.accounts[key], `manifest.accounts.${key}`)
  )
  exactKeys(manifest.leagues, ['alpha', 'beta'], 'manifest.leagues')
  validateLeague(manifest.leagues.alpha, 'manifest.leagues.alpha')
  validateLeague(manifest.leagues.beta, 'manifest.leagues.beta')
  if (
    manifest.leagues.alpha.openedAtMs !==
    manifest.leagues.alpha.helpOpensAtMs
  ) {
    fail('manifest.leagues.alpha must use adaptive immediate help opening.')
  }
  if (
    manifest.leagues.beta.openedAtMs >= manifest.leagues.beta.helpOpensAtMs
  ) {
    fail('manifest.leagues.beta must use a later normal help opening.')
  }
  if (
    manifest.leagues.alpha.firstWeekStartsAtMs ===
    manifest.leagues.beta.firstWeekStartsAtMs
  ) {
    fail('the two fixture leagues must use distinct Week 1 starts.')
  }
  exactKeys(
    manifest.privacyChecks,
    [
      'alphaManagerAccountAlias',
      'alphaManagerManagedTeamAliases',
      'alphaManagerDeniedTeamAlias',
      'alphaManagerExcludedLeagueAlias',
      'commissionerAccountAlias',
      'commissionerDeniedTeamAlias',
      'commissionerHelpTeamAlias',
      'privateMarkers',
    ],
    'manifest.privacyChecks'
  )
  for (const key of [
    'alphaManagerAccountAlias',
    'alphaManagerDeniedTeamAlias',
    'alphaManagerExcludedLeagueAlias',
    'commissionerAccountAlias',
    'commissionerDeniedTeamAlias',
    'commissionerHelpTeamAlias',
  ]) {
    text(manifest.privacyChecks[key], `manifest.privacyChecks.${key}`)
  }
  for (const key of ['alphaManagerManagedTeamAliases', 'privateMarkers']) {
    const values = manifest.privacyChecks[key]
    if (
      !Array.isArray(values) ||
      values.length === 0 ||
      values.some((value) => typeof value !== 'string' || !value)
    ) {
      fail(`manifest.privacyChecks.${key} is invalid.`)
    }
  }
  return Object.freeze({
    manifest: deepFreeze(manifest),
    password,
  })
}
