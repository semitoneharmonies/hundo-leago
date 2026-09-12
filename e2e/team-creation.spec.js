import { test, expect } from '@playwright/test'
import { expectNoAxeViolations } from './support/accessibility.js'

const leagueId = '11111111-1111-4111-8111-111111111111'
const names = ['QA Normal North', 'QA Late South', 'QA Control East', 'QA Control West']
async function setup(page, baseURL, authority) {
  expect(new URL(baseURL).hostname).toBe('127.0.0.1')
  const teams = [], writes = [], unexpected = []
  const league = { id: leagueId, name: 'Setup League Preview', status: 'setup', timezone: 'America/Vancouver', currentSeason: null, version: 1,
    membership: { id: 'preview-membership', permissionCategory: authority === 'platform_administrator' ? 'member' : authority, effectiveAuthority: authority, status: 'active', version: 1 } }
  const reply = (route, data) => route.fulfill({ json: { data, meta: { requestId: 'team-creation-preview' } } })
  await page.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url())
    if (url.origin === 'https://fonts.googleapis.com') return route.fulfill({ contentType: 'text/css', body: '' })
    if (url.origin !== new URL(baseURL).origin) { unexpected.push(url.origin); return route.abort() }
    const path = url.pathname
    if (!path.startsWith('/api/') && !path.startsWith('/socket.io')) return route.continue()
    if (path.startsWith('/socket.io')) return route.abort()
    if (path === '/api/v1/session') return reply(route, {
      csrfToken: 'D'.repeat(43),
      session: { id: 'preview-session', userId: 'preview-user', status: 'active', createdAtMs: 1, lastUsedAtMs: 2, idleExpiresAtMs: 3, absoluteExpiresAtMs: 4, version: 1 },
      user: { id: 'preview-user', displayName: 'Preview Administrator', status: 'active', version: 1 },
    })
    if (path === '/api/v1/leagues') return reply(route, { code: 'LEAGUES_FOUND', leagues: [league] })
    if (path === `/api/v1/leagues/${leagueId}`) return reply(route, { code: 'LEAGUE_FOUND', league })
    if (path === `/api/v1/leagues/${leagueId}/teams`) {
      if (request.method() === 'GET') return reply(route, { code: 'TEAMS_FOUND', teams })
      expect(request.method()).toBe('POST')
      writes.push({ body: request.postDataJSON(), headers: request.headers() })
      const team = { id: `22222222-2222-4222-8222-${String(teams.length + 1).padStart(12, '0')}`, leagueId,
        name: request.postDataJSON().name, status: 'setup', currentManager: null, version: 1, createdAtMs: 1, updatedAtMs: 1,
        primaryColour: null, secondaryColour: null, tertiaryColour: null, patternTemplate: 'even-two', logoReference: null }
      teams.push(team)
      return reply(route, { code: 'TEAM_CREATED', team })
    }
    if (path === '/api/v1/notifications') return reply(route, { code: 'NOTIFICATIONS_FOUND', notifications: [], page: { limit: 25, nextCursor: null } })
    if (path === `/api/v1/leagues/${leagueId}/free-agent-drafts/navigation`) return reply(route, {
      serverNowMs: 1789188000000, timeZone: 'America/Vancouver', fadId: null, seasonId: null, phase: 'inactive', showMainNavigation: false,
      candidateDeadlineAtMs: null, nextRolloverAtMs: null, frozenFadFirstMatchupStartsAtMs: null, competitionFirstMatchupStartsAtMs: null,
      managedCards: [], rosterLinks: [], urgencyCode: 'NONE', availableDrafts: [],
    })
    unexpected.push(path)
    return route.abort()
  })
  return { teams, writes, unexpected }
}

for (const role of ['platform_administrator', 'commissioner']) {
  test(`${role} can create four empty teams without invitations`, async ({ page, baseURL }, testInfo) => {
    const state = await setup(page, baseURL, role)
    await page.goto(`/leagues/${leagueId}/teams`)
    const panel = page.getByRole('region', { name: 'Create a team' })
    await expect(panel).toBeVisible()
    expect(state.writes).toHaveLength(0)
    await expectNoAxeViolations(page)
    await page.screenshot({ path: testInfo.outputPath('before.png'), fullPage: true })
    for (const name of names) {
      await panel.getByRole('textbox', { name: 'Team name' }).fill(name)
      await panel.getByRole('button', { name: 'Create team' }).click()
      await expect(panel.getByRole('status')).toHaveText(`${name} was created. Its manager is unassigned.`)
      await expect(page.getByRole('link', { name, exact: true })).toBeVisible()
    }
    expect(state.writes.map(write => write.body)).toEqual(names.map(name => ({ name })))
    expect(new Set(state.writes.map(write => write.headers['idempotency-key'])).size).toBe(4)
    for (const write of state.writes) expect(write.headers['x-csrf-token']).toBe('D'.repeat(43))
    expect(state.unexpected).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    await expectNoAxeViolations(page)
    await page.screenshot({ path: testInfo.outputPath('created.png'), fullPage: true })
  })
}

test('a manager sees no team creation control and sends no write', async ({ page, baseURL }) => {
  const state = await setup(page, baseURL, 'manager')
  await page.goto(`/leagues/${leagueId}/teams`)
  await expect(page.getByRole('heading', { name: 'Teams', exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Create a team' })).toHaveCount(0)
  expect(state.writes).toEqual([])
  expect(state.unexpected).toEqual([])
})
