import { test, expect } from './fixtures/fadTest.js'
import {
  privateCandidateForTeam,
  teamByAlias,
  teamsForManager,
} from './support/fadScenario.js'

test('manager reaches the server-authored Candidate Card workflow', async ({
  accountPage,
  fadFixture,
  freeAgentDraftPage,
  leagueChooserPage,
  page,
}) => {
  const { manifest } = fadFixture
  const alpha = manifest.leagues.alpha
  const manager = manifest.accounts.alphaMultiTeamManager
  const managedTeams = teamsForManager(alpha, manager)
  expect(managedTeams).toHaveLength(2)
  const carryover = alpha.sentinels.lockedCarryover
  const primaryTeam = teamByAlias(alpha, carryover.teamAlias)
  expect(managedTeams.map((team) => team.alias)).toContain(primaryTeam.alias)
  const privateCandidate = privateCandidateForTeam(alpha, primaryTeam)

  await accountPage.signIn(manager)
  await leagueChooserPage.openLeague(alpha)
  await freeAgentDraftPage.openFromMainMenu()
  await expect(
    page.getByRole('heading', { name: 'Free Agent Draft', exact: true })
  ).toBeVisible()
  for (const team of managedTeams) {
    await expect(freeAgentDraftPage.teamLink(team)).toBeVisible()
  }

  await freeAgentDraftPage.openTeamLink(primaryTeam)
  await freeAgentDraftPage.expectPrivateCard(privateCandidate.playerFullName)
  await freeAgentDraftPage.expectSlotMatrix()
  await expect(
    page.getByRole('complementary', { name: 'Candidate Card controls' })
  ).toContainText('Card status')
  await expect(page.getByText('Maximum cap use', { exact: true })).toBeVisible()
  await expect(page.getByText('Total value', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Term', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('AAV', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Locked carryover', { exact: true })).toBeVisible()
  await expect(page.getByText(carryover.playerFullName, { exact: true })).toBeVisible()
  await freeAgentDraftPage.expectNoHorizontalOverflow()
})
