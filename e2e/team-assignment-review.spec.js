import { test, expect } from './fixtures/fadTest.js'
import { navigateToAppPath } from './support/navigation.js'
import { teamsForManager } from './support/fadScenario.js'
import { expectNoAxeViolations } from './support/accessibility.js'

test('an existing member accepts an additional team while keeping their first team', async ({
  accountPage, fadFixture, page,
}) => {
  test.setTimeout(90_000)
  const { manifest } = fadFixture
  const league = manifest.leagues.alpha
  const manager = manifest.accounts.alphaMultiTeamManager
  const [firstTeam, secondTeam] = teamsForManager(league, manager)
  const root = `/leagues/${league.leagueId}`

  await accountPage.signIn(manifest.accounts.alphaCommissioner)
  await navigateToAppPath(page, root)
  const managers = page.locator('.hl-commissioner-access-section')
  const firstRow = managers.getByRole('listitem').filter({ has: page.getByText(firstTeam.name, { exact: true }) })
  const secondRow = managers.getByRole('listitem').filter({ has: page.getByText(secondTeam.name, { exact: true }) })
  const firstManager = await firstRow.locator('small').innerText()
  page.once('dialog', dialog => dialog.accept())
  await secondRow.getByRole('button', { name: /^Unassign / }).click()
  await expect(secondRow).toContainText('No manager assigned')

  await page.getByRole('combobox', { name: 'User', exact: true }).fill(firstManager.replace('Managed by ', ''))
  await page.getByRole('option').filter({ hasText: firstManager.replace('Managed by ', '') }).click()
  await page.getByRole('combobox', { name: 'Team', exact: true }).selectOption(secondTeam.teamId)
  await page.getByRole('button', { name: 'Send team assignment' }).click()
  await expect(page.getByText('Team assignment sent. The user must accept it in Notifications. Their other teams stay assigned.')).toBeVisible()
  await expect(firstRow.locator('small')).toHaveText(firstManager)
  await expect(secondRow).toContainText('No manager assigned')

  await accountPage.signOut()
  await accountPage.signIn(manager)
  await navigateToAppPath(page, '/notifications')
  await expect(page.getByText(`Team assignment: ${secondTeam.name} in ${league.name}`, { exact: true })).toBeVisible()
  await expectNoAxeViolations(page)
  await page.getByRole('button', { name: 'Accept team assignment' }).click()
  await expect(page.getByText(`You now manage ${secondTeam.name}. Your other team assignments stay the same.`)).toBeVisible()
  await page.getByRole('link', { name: 'View team', exact: true }).click()
  await expect(page.getByRole('heading', { name: secondTeam.name, exact: true })).toBeVisible()

  await accountPage.signOut()
  await accountPage.signIn(manifest.accounts.alphaCommissioner)
  await navigateToAppPath(page, root)
  await expect(firstRow.locator('small')).toHaveText(firstManager)
  await expect(secondRow.locator('small')).toHaveText(firstManager)
})
