import { test, expect } from '@playwright/test'
import { expectNoAxeViolations } from './support/accessibility.js'

const jobId = '11111111-1111-4111-8111-111111111111'
const result = { jobId, status: 'succeeded', playerCount: 2686, capturedAtMs: 1789167600000 }

async function setup(page, baseURL, role = 'administrator') {
  expect(new URL(baseURL).hostname).toMatch(/^(127\.0\.0\.1|localhost)$/)
  const writes = []
  const unexpected = []
  const reply = (route, data) => route.fulfill({ json: { data, meta: { requestId: 'statistics-browser-test' } } })
  await page.route('**/*', async route => {
    const url = new URL(route.request().url())
    // Keep the existing font stylesheet request offline; use the app's fallback fonts.
    if (url.origin === 'https://fonts.googleapis.com') {
      return route.fulfill({ contentType: 'text/css', body: '' })
    }
    if (url.origin !== new URL(baseURL).origin) {
      unexpected.push(url.origin)
      return route.abort()
    }
    const path = url.pathname
    if (!path.startsWith('/api/') && !path.startsWith('/socket.io')) return route.continue()
    if (path.startsWith('/socket.io')) return route.abort()
    if (path === '/api/v1/operations/statistics/refresh') {
      writes.push(route.request())
      return route.fallback()
    }
    if (path === '/api/v1/session') return reply(route, {
      csrfToken: 'D'.repeat(43),
      session: { id: 'session-test', userId: 'user-test', status: 'active', createdAtMs: 1, lastUsedAtMs: 2, idleExpiresAtMs: 3, absoluteExpiresAtMs: 4, version: 1 },
      user: { id: 'user-test', displayName: 'Review Administrator', status: 'active', version: 1 },
    })
    if (path === '/api/v1/leagues') return reply(route, { code: 'LEAGUES_FOUND', leagues: role === 'administrator' ? [] : [{
      id: jobId, name: 'Review League', status: 'setup', timezone: 'America/Vancouver', currentSeason: null, version: 1,
      membership: { id: 'membership-test', permissionCategory: role, status: 'active', version: 1 },
    }] })
    if (path === '/api/v1/admin/users') return role === 'administrator'
      ? reply(route, { code: 'ADMIN_USERS_FOUND', users: [] })
      : route.fulfill({ status: 403, json: { error: { code: 'PLATFORM_ADMINISTRATOR_REQUIRED', message: 'Denied.', requestId: 'denied-test' } } })
    if (path === '/api/v1/notifications') return reply(route, { code: 'NOTIFICATIONS_FOUND', notifications: [], page: { limit: 25, nextCursor: null } })
    if (path === `/api/v1/leagues/${jobId}/free-agent-drafts/navigation`) return reply(route, {
      serverNowMs: result.capturedAtMs, timeZone: 'America/Vancouver', fadId: null, seasonId: null,
      phase: 'inactive', showMainNavigation: false, candidateDeadlineAtMs: null, nextRolloverAtMs: null,
      frozenFadFirstMatchupStartsAtMs: null, competitionFirstMatchupStartsAtMs: null,
      managedCards: [], rosterLinks: [], urgencyCode: 'NONE', availableDrafts: [],
    })
    unexpected.push(path)
    return route.abort()
  })
  return { writes, unexpected }
}

test('administrator refresh is explicit, accessible and prevents duplicate writes', async ({ page, baseURL }, testInfo) => {
  let finish
  await page.route('**/api/v1/operations/statistics/refresh', async route => {
    await new Promise(resolve => { finish = resolve })
    await route.fulfill({ json: { data: result, meta: { requestId: 'completed-test' } } })
  })
  const state = await setup(page, baseURL)
  await page.goto('/leagues')
  const panel = page.getByRole('region', { name: 'NHL statistics' })
  await expect(panel).toBeVisible()
  expect(state.writes).toHaveLength(0)
  await expectNoAxeViolations(page)
  await panel.getByRole('button', { name: 'Refresh now' }).click()
  await expect(panel.getByRole('button', { name: 'Updating NHL statistics…' })).toBeDisabled()
  await expect.poll(() => state.writes.length).toBe(1)
  expect(state.writes[0].postDataJSON()).toEqual({})
  expect(state.writes[0].headers()['x-csrf-token']).toBe('D'.repeat(43))
  await panel.screenshot({ path: testInfo.outputPath('pending.png') })
  finish()
  await expect(panel.getByRole('status')).toContainText('NHL statistics updated for 2,686 players.')
  await expect(panel.getByText(jobId)).toHaveCount(0)
  await expect(panel.getByRole('button', { name: 'Refresh now' })).toBeEnabled()
  await expectNoAxeViolations(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  await panel.screenshot({ path: testInfo.outputPath('success.png') })
  expect(state.writes).toHaveLength(1)
  expect(state.unexpected).toEqual([])
})

test('disabled and uncertain responses remain clear without automatic retries', async ({ page, baseURL }, testInfo) => {
  let mode = 'disabled'
  await page.route('**/api/v1/operations/statistics/refresh', route => mode === 'disabled'
    ? route.fulfill({ status: 503, json: { error: { code: 'STATISTICS_OPERATION_DISABLED', message: 'private diagnostic', requestId: 'disabled-test' } } })
    : route.abort('connectionfailed'))
  const state = await setup(page, baseURL)
  await page.goto('/leagues')
  const panel = page.getByRole('region', { name: 'NHL statistics' })
  await panel.getByRole('button', { name: 'Refresh now' }).click()
  await expect(panel.getByRole('alert')).toContainText('have not been enabled yet')
  expect(state.writes).toHaveLength(1)
  mode = 'uncertain'
  await panel.getByRole('button', { name: 'Refresh now' }).click()
  await expect(panel.getByRole('alert')).toContainText('It may still be running')
  await expect(panel.getByText(/private diagnostic/)).toHaveCount(0)
  await expectNoAxeViolations(page)
  await panel.screenshot({ path: testInfo.outputPath('uncertain.png') })
  expect(state.writes).toHaveLength(2)
  expect(state.unexpected).toEqual([])
})

for (const role of ['manager', 'commissioner']) {
  test(`${role} cannot see the statistics refresh control`, async ({ page, baseURL }) => {
    const state = await setup(page, baseURL, role)
    await page.goto('/leagues')
    await expect(page.getByRole('link', { name: 'Review League', exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: 'NHL statistics' })).toHaveCount(0)
    expect(state.writes).toHaveLength(0)
    expect(state.unexpected).toEqual([])
  })
}
