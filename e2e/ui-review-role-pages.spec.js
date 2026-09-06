import { test, expect } from './fixtures/fadTest.js'
import { expectNoAxeViolations } from './support/accessibility.js'
import { navigateToAppPath } from './support/navigation.js'

async function expectUsablePage(page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
      )
    )
    .toBe(true)
  await expectNoAxeViolations(page)
  await expect(page.getByText(/Request ID|operation version|provider identifiers/i)).toHaveCount(0)
}

test('commissioner tools use the reviewed task layout and protect administrator membership', async ({
  accountPage,
  fadFixture,
  page,
}) => {
  test.setTimeout(90_000)
  const { manifest } = fadFixture
  const leagueRoot = `/leagues/${manifest.leagues.alpha.leagueId}`

  await accountPage.signIn(manifest.accounts.alphaCommissioner)
  await navigateToAppPath(page, leagueRoot)
  await expect(page.getByRole('heading', { name: 'Commissioner overview', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Members and team access', exact: true })).toBeVisible()
  const protectedMember = page.getByRole('listitem').filter({
    has: page.getByText('Protected administrator', { exact: true }),
  })
  await expect(protectedMember.first()).toBeVisible()
  await expect(protectedMember.getByRole('button', { name: /Remove from league|Unassign/ })).toHaveCount(0)
  await expectUsablePage(page)

  await navigateToAppPath(page, `${leagueRoot}/commissioner`)
  await expect(page.getByRole('heading', { name: 'Commissioner competition tools', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Preview schedule generation', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: /^(Result correction|Standings rebuild)$/ })).toHaveCount(0)
  await expectUsablePage(page)

  await navigateToAppPath(page, `${leagueRoot}/commissioner/rosters`)
  await expect(page.getByRole('heading', { name: 'Commissioner roster operations', exact: true })).toBeVisible()
  const tasks = page.getByRole('tablist', { name: 'Roster correction tasks' })
  const operations = [
    ['Add player', 'Add a player'],
    ['Remove player', 'Remove a player'],
    ['Move or re-slot player', 'Move or re-slot a player'],
    ['Correct contract', 'Correct a contract'],
  ]
  for (const [label, heading] of operations) {
    const tab = tasks.getByRole('tab', { name: label, exact: true })
    await tab.click()
    await expect(tab).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
    await expectUsablePage(page)
  }
})

test('administrator can see both leagues and the league creation controls', async ({
  accountPage,
  fadFixture,
  page,
}) => {
  test.setTimeout(60_000)
  const { manifest } = fadFixture
  await accountPage.signIn(manifest.accounts.platformAdmin)
  await navigateToAppPath(page, '/leagues')
  await expect(page.getByRole('heading', { name: 'Create a league', exact: true })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'League name', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create league', exact: true })).toBeDisabled()
  for (const league of [manifest.leagues.alpha, manifest.leagues.beta]) {
    await expect(page.getByRole('link', { name: league.name, exact: true })).toBeVisible()
  }
  await expectUsablePage(page)
})

test('manager account and rules stay usable while commissioner controls remain restricted', async ({
  accountPage,
  fadFixture,
  page,
}) => {
  test.setTimeout(90_000)
  const { manifest } = fadFixture
  const leagueRoot = `/leagues/${manifest.leagues.alpha.leagueId}`
  await accountPage.signIn(manifest.accounts.alphaMultiTeamManager)

  for (const path of [`${leagueRoot}/commissioner`, `${leagueRoot}/commissioner/rosters`]) {
    await navigateToAppPath(page, path)
    await expect(page.getByRole('alert')).toContainText('Current commissioner authority is required.')
    await expect(page.getByRole('button', { name: 'Preview schedule generation', exact: true })).toHaveCount(0)
    await expect(page.getByRole('tablist', { name: 'Roster correction tasks' })).toHaveCount(0)
    await expectUsablePage(page)
  }

  await navigateToAppPath(page, '/account')
  await expect(page.getByRole('heading', { name: 'Account and team settings', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Change password', exact: true })).toBeVisible()
  await expectUsablePage(page)
  await page.getByRole('button', { name: 'Account menu', exact: true }).click()
  await expect(page.locator('.hl-account-menu').getByRole('link', { name: /Notifications/ })).toHaveCount(0)

  await navigateToAppPath(page, leagueRoot)
  await expect(page.getByRole('heading', { name: manifest.leagues.alpha.name, exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page.getByRole('button', { name: 'League Rules Approved rules and guidance', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'League rules', exact: true })).toBeVisible()
  await expectUsablePage(page)
  await page.getByRole('button', { name: 'Close League Rules', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'League rules', exact: true })).toHaveCount(0)
})

