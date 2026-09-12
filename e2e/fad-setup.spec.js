import { test, expect } from '@playwright/test'
import { expectNoAxeViolations } from './support/accessibility.js'

const uuid = n => '00000000-0000-4000-8000-' + String(n).padStart(12, '0')
const leagueId = uuid(1), seasonId = uuid(2)
async function fixture(page, baseURL, { locked = false } = {}) {
  const origin = new URL(baseURL).origin
  expect(new URL(baseURL).hostname).toBe('127.0.0.1')
  const writes = [], unexpected = []
  const league = { id: leagueId, name: 'Inaugural Draft Preview', status: locked ? 'active' : 'setup',
    timezone: 'America/Vancouver', currentSeason: { id: seasonId, status: locked ? 'active' : 'planned', label: '2026-27', version: 1 },
    membership: { id: uuid(3), permissionCategory: 'commissioner', effectiveAuthority: 'commissioner', status: 'active', version: 1 }, version: 3 }
  const settings = { leagueId, tradeDeadlineAtMs: null, version: 1 }
  const reply = (route, data) => route.fulfill({ json: { data, meta: { requestId: 'local-fad-setup' } } })
  await page.clock.setFixedTime(new Date('2026-09-12T07:00:00Z'))
  await page.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname
    if (url.origin === 'https://fonts.googleapis.com') return route.fulfill({ contentType: 'text/css', body: '' })
    if (url.origin !== origin) { unexpected.push(url.origin); return route.abort() }
    if (!path.startsWith('/api/') && !path.startsWith('/socket.io')) return route.continue()
    if (path.startsWith('/socket.io')) return route.abort()
    if (path === '/api/v1/session') return reply(route, { csrfToken: 'D'.repeat(43),
      session: { id: uuid(4), userId: uuid(5), status: 'active', createdAtMs: 1, lastUsedAtMs: 2, idleExpiresAtMs: 3, absoluteExpiresAtMs: 4, version: 1 },
      user: { id: uuid(5), displayName: 'Draft Commissioner', status: 'active', version: 1 } })
    if (path === '/api/v1/leagues') return reply(route, { code: 'LEAGUES_FOUND', leagues: [league] })
    if (path === '/api/v1/notifications') return reply(route, { code: 'NOTIFICATIONS_FOUND', notifications: [], page: { limit: 25, nextCursor: null } })
    const prefix = '/api/v1/leagues/' + leagueId
    if (path === prefix) return reply(route, { code: 'LEAGUE_FOUND', league })
    if (path === prefix + '/settings') return reply(route, { code: 'LEAGUE_SETTINGS_FOUND', settings })
    if (path === prefix + '/teams') return reply(route, { code: 'TEAMS_FOUND', teams: [10, 20, 30, 40].map(n => ({
      id: uuid(n), leagueId, name: 'Team ' + n, status: 'setup', version: 1, currentManager: {
        assignmentId: uuid(n + 1), userId: uuid(n + 2), displayName: 'Manager ' + n, version: 1 } })) })
    if (path === prefix + '/memberships') return reply(route, { code: 'LEAGUE_MEMBERSHIPS_FOUND', memberships: [{
      id: uuid(3), version: 1, status: 'active', user: { id: uuid(5), displayName: 'Draft Commissioner' } }] })
    if (path === prefix + '/seasons') return reply(route, { code: 'LEAGUE_SEASONS_FOUND', leagueId, seasons: [{
      id: seasonId, label: '2026-27', nhlSeasonKey: '20262027', status: league.currentSeason.status, version: 1,
      regularSeasonStartsAtMs: null, regularSeasonEndsAtMs: null, fantasyPlayoffsStartAtMs: null, fantasyPlayoffsEndAtMs: null }] })
    if (path === prefix + '/seasons/' + seasonId + '/matchup-weeks') return reply(route, { code: 'MATCHUP_WEEKS_FOUND', weeks: [], health: {} })
    if (path === prefix + '/free-agent-drafts/navigation') return reply(route, {
      serverNowMs: Date.parse('2026-09-12T07:00:00Z'), timeZone: 'America/Vancouver', fadId: null, seasonId: null, phase: 'inactive', showMainNavigation: false,
      candidateDeadlineAtMs: null, nextRolloverAtMs: null, frozenFadFirstMatchupStartsAtMs: null, competitionFirstMatchupStartsAtMs: null,
      managedCards: [], rosterLinks: [], urgencyCode: 'NONE', availableDrafts: [] })
    if (path === prefix + '/free-agent-drafts/readiness') return reply(route, {
      leagueId, seasonId, operationId: null, operationVersion: null, status: 'not_triggered', triggerKind: null, entryDraftId: null, exemptionId: null,
      serverNowMs: Date.parse('2026-09-12T07:00:00Z'), timeZone: 'America/Vancouver', observedSeasonVersion: 1,
      firstMatchupWeekBefore: null, firstMatchupWeekAfter: null, candidateDeadlineAtMs: null, reminderAtMs: null, helpOpensAtMs: null,
      initialRollovers: [], priorSeasonRollover: null, participatingTeamCount: 0, teamProjections: [], blockers: [], warnings: [], resultFadId: null,
      retryReadiness: { allowed: false, reasonCode: locked ? 'FAD_SEASON_CLOSED' : 'RECOVERY_NOT_AVAILABLE' } })
    if (request.method() !== 'GET') {
      writes.push({ path, body: request.postDataJSON(), headers: request.headers() })
      if (path === prefix + '/setup/trade-deadline') {
        settings.tradeDeadlineAtMs = request.postDataJSON().tradeDeadlineAtMs
        settings.version += 1
        league.version += 1
        return reply(route, { code: 'LEAGUE_TRADE_DEADLINE_RECORDED', league, settings })
      }
      if (path === prefix + '/start') {
        league.status = 'active'; league.currentSeason.status = 'active'
        return reply(route, { code: 'LEAGUE_STARTED', league, activatedTeamCount: 4 })
      }
      if (path === prefix + '/seasons/' + seasonId + '/matchup-schedules' && !request.postDataJSON().confirmed) {
        const startsAtMs = request.postDataJSON().firstWeekStartsAtMs
        return reply(route, { code: 'MATCHUP_SCHEDULE_PREVIEWED', preview: { seasonId, expectedSeasonVersion: 1,
          firstWeekStartsAtMs: startsAtMs, nhlRegularSeasonEndsAtMs: request.postDataJSON().nhlRegularSeasonEndsAtMs,
          participantCount: 4, weekCount: 1, matchupCount: 2, byeCount: 0, weeks: [{ sequence: 1, startsAtMs, endsAtMs: startsAtMs + 604800000 }] } })
      }
    }
    unexpected.push(path)
    return route.abort()
  })
  return { writes, unexpected }
}

test('commissioner prepares the inaugural draft and reviews linked dates', async ({ page, baseURL }, testInfo) => {
  const state = await fixture(page, baseURL)
  await page.goto('/leagues/' + leagueId + '/commissioner')
  await expect(page.getByRole('heading', { name: 'Prepare your first Free Agent Draft' })).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('button', { name: 'Preview schedule generation' })).toBeDisabled()
  await page.getByLabel('Season trade deadline').fill('2027-03-01T00:00')
  await page.getByRole('button', { name: 'Save trade deadline' }).click()
  await page.getByRole('button', { name: 'Prepare league for draft' }).click()
  expect(state.writes).toHaveLength(1)
  await expectNoAxeViolations(page)
  await page.screenshot({ path: testInfo.outputPath('draft-setup.png'), fullPage: true })
  await page.getByRole('button', { name: 'Confirm draft setup' }).click()
  await expect(page.getByRole('heading', { name: 'Prepare your first Free Agent Draft' })).toHaveCount(0)
  await expect(page.getByLabel('Candidate Card deadline')).toHaveValue('2026-09-22T00:00')
  await page.getByLabel('Candidate Card deadline').fill('2026-10-01T00:00')
  await expect(page.getByLabel('Week 1 starts')).toHaveValue('2026-10-08T00:00')
  await page.getByRole('button', { name: 'Preview schedule generation' }).click()
  await expect(page.getByText('Review every matchup week')).toBeVisible()
  expect(state.writes).toHaveLength(3)
  expect(state.writes[1].headers['if-match']).toBe('"4"')
  expect(state.writes[1].headers['x-csrf-token']).toBe('D'.repeat(43))
  expect(state.writes[2].body.firstWeekStartsAtMs).toBe(Date.parse('2026-10-08T07:00:00Z'))
  expect(state.writes[2].body.confirmed).toBe(false)
  expect(state.unexpected).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  await expectNoAxeViolations(page)
  await page.screenshot({ path: testInfo.outputPath('draft-calendar.png'), fullPage: true })
})

test('commissioner sees the annual lock with no write controls enabled', async ({ page, baseURL }, testInfo) => {
  const state = await fixture(page, baseURL, { locked: true })
  await page.goto('/leagues/' + leagueId + '/commissioner')
  await page.getByText('Seasonal tools · Free Agent Draft', { exact: true }).click()
  await page.getByText('Free Agent Draft opening', { exact: true }).click()
  await expect(page.getByText(/Free Agent Draft changes are closed during the season/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Run opening check again' })).toBeDisabled()
  expect(state.writes).toEqual([])
  expect(state.unexpected).toEqual([])
  await expectNoAxeViolations(page)
  await page.screenshot({ path: testInfo.outputPath('annual-lock.png'), fullPage: true })
})
