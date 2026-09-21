import { test, expect } from './fixtures/fadTest.js'
import { navigateToAppPath } from './support/navigation.js'
import { expectNoAxeViolations } from './support/accessibility.js'

test('spotlight keeps its outer frame still through rotation and delayed scores', async ({ accountPage, fadFixture, page }, testInfo) => {
  test.setTimeout(90_000)
  const { manifest } = fadFixture
  const leagueId = manifest.leagues.alpha.leagueId
  const uuid = value => '00000000-0000-4000-8000-' + String(value).padStart(12, '0')
  const weekId = uuid(901)
  let summaries
  await accountPage.signIn(manifest.accounts.alphaCommissioner)
  await page.route('**/api/v1/leagues/' + leagueId + '/seasons/*/matchup-weeks/current', async route => {
    const seasonId = new URL(route.request().url()).pathname.split('/')[6]
    summaries = [0, 1].map(index => ({ id: uuid(910 + index), leagueId, seasonId, weekId,
      homeTeam: { id: uuid(920 + index), name: index ? 'An Exceptionally Long Home Team Name for the Spotlight' : 'First Home' },
      awayTeam: { id: uuid(930 + index), name: index ? 'Second Away' : 'First Away' }, status: 'scheduled', version: 1 }))
    await route.fulfill({ json: { data: { code: 'CURRENT_MATCHUP_WEEK_FOUND', health: {}, week: {
      id: weekId, leagueId, seasonId, weekKey: 'regular-01', sequence: 1, startsAtMs: 1790665200000,
      baselineAtMs: 1790668800000, locksAtMs: 1790722800000, endsAtMs: 1791183600000,
      rollsOverAtMs: 1791183600000, status: 'scheduled', version: 1, matchups: summaries, byes: [],
    } }, meta: { requestId: 'local-visual-review' } } })
  })
  await page.route('**/api/v1/leagues/' + leagueId + '/seasons/*/matchup-weeks/' + weekId + '/matchups/*', async route => {
    const summary = summaries.find(item => route.request().url().endsWith(item.id))
    await route.fulfill({ json: { data: { code: 'MATCHUP_FOUND', matchup: {
      ...summary, scoring: null, liveScore: null, result: null,
      health: { scoring: { status: summary.id === uuid(910) ? 'fresh' : 'stale' } },
    } }, meta: { requestId: 'local-visual-review' } } })
  })
  await navigateToAppPath(page, '/leagues/' + leagueId)
  const frame = page.locator('.hl-dashboard-matchup--spotlight')
  await expect(frame.getByText('First Home', { exact: true })).toBeVisible()
  const samples = await frame.evaluate(async node => {
    const rows = []
    const end = performance.now() + 6200
    while (performance.now() < end) {
      const box = node.getBoundingClientRect()
      rows.push({ x: box.x, y: box.y, width: box.width, height: box.height,
        name: node.querySelector('.hl-matchup-score__team strong')?.textContent })
      await new Promise(resolve => setTimeout(resolve, 40))
    }
    return rows
  })
  expect(new Set(samples.map(row => row.name)).size).toBe(2)
  for (const field of ['x', 'y', 'width', 'height']) {
    expect(Math.max(...samples.map(row => row[field])) - Math.min(...samples.map(row => row[field]))).toBeLessThan(1)
  }
  await expectNoAxeViolations(page)
  await frame.screenshot({ path: testInfo.outputPath('spotlight.png') })
})

test('commissioner correction forms keep readable spacing and prominent preview actions', async ({ accountPage, fadFixture, page }, testInfo) => {
  test.setTimeout(90_000)
  await accountPage.signIn(fadFixture.manifest.accounts.alphaCommissioner)
  const root = '/leagues/' + fadFixture.manifest.leagues.alpha.leagueId
  await navigateToAppPath(page, root + '/commissioner')
  await page.screenshot({ path: testInfo.outputPath('competition-tools.png'), fullPage: true })
  await navigateToAppPath(page, root + '/commissioner/rosters')
  for (const name of ['Add player', 'Remove player', 'Move or re-slot player', 'Correct contract']) {
    await page.getByRole('tab', { name, exact: true }).click()
    const button = page.getByRole('button', { name: /^Preview / }).first()
    await expect(button).toBeVisible()
    expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(40)
    await expectNoAxeViolations(page)
    await page.screenshot({ path: testInfo.outputPath(name.replaceAll(' ', '-') + '.png'), fullPage: true })
    await button.scrollIntoViewIfNeeded()
    await expect(button).toBeInViewport()
    await page.screenshot({ path: testInfo.outputPath(name.replaceAll(' ', '-') + '-preview.png') })
  }
})
