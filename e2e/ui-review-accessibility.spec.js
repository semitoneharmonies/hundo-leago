import { test, expect } from './fixtures/fadTest.js'
import { readAxeViolations } from './support/accessibility.js'
import { navigateToAppPath } from './support/navigation.js'
import { teamsForManager } from './support/fadScenario.js'

async function expectNoHorizontalOverflow(page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth
      )
    )
    .toBe(true)
}

test('reviewed league surfaces remain usable at desktop and mobile widths', async ({
  accountPage,
  fadFixture,
  page,
}) => {
  const { manifest } = fadFixture
  const league = manifest.leagues.alpha
  const manager = manifest.accounts.alphaMultiTeamManager
  const managedTeam = teamsForManager(league, manager)[0]
  const leagueRoot = `/leagues/${league.leagueId}`
  const destinations = [
    [leagueRoot, league.name],
    [`${leagueRoot}/teams`, 'Teams'],
    [`${leagueRoot}/teams/${managedTeam.teamId}/roster`, managedTeam.name],
    [`${leagueRoot}/players`, 'Players'],
    [`${leagueRoot}/auctions`, 'Auctions'],
    [`${leagueRoot}/trades`, 'Trades'],
    [`${leagueRoot}/matchups`, 'Matchups'],
    [`${leagueRoot}/standings`, 'Standings'],
    [`${leagueRoot}/activity`, 'League Activity'],
    ['/notifications', 'Notifications'],
  ]

  await accountPage.signIn(manager)
  const accessibilityFailures = []

  for (const [path, heading] of destinations) {
    await navigateToAppPath(page, path)
    await expect(
      page.getByRole('heading', { name: heading, exact: true }).first()
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)
    const violations = await readAxeViolations(page)
    if (violations.length > 0) {
      accessibilityFailures.push({ heading, violations })
    }
    await expect(page.getByText(/Request ID|operation version|provider identifiers/i)).toHaveCount(0)
  }
  expect(accessibilityFailures).toEqual([])
})
