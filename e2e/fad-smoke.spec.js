import { test, expect } from './fixtures/fadTest.js'
import { teamByAlias, teamsForManager } from './support/fadScenario.js'

test('manager reaches the server-authored Candidate Card workflow', async ({
  accountPage,
  fadFixture,
  freeAgentDraftPage,
  leagueChooserPage,
  page,
}) => {
  const { manifest } = fadFixture
  const beta = manifest.leagues.beta
  const manager = manifest.accounts.betaManager
  const managedTeams = teamsForManager(beta, manager)
  expect(managedTeams.length).toBeGreaterThanOrEqual(2)
  const privateCandidate = beta.sentinels.privateCandidates[0]
  const primaryTeam = teamByAlias(beta, privateCandidate.teamAlias)

  await accountPage.signIn(manager)
  await leagueChooserPage.openLeague(beta)
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
  await expect(page.getByText('Projected cap use', { exact: true })).toBeVisible()
  await expect(page.getByText('Mandatory missing', { exact: true })).toBeVisible()
  await expect(page.getByLabel(/^F\d{2} AAV$/).first()).toBeVisible()
  await expect(page.getByLabel(/^F\d{2} term$/).first()).toBeVisible()
  await expect(
    page.getByLabel(/^F\d{2} total contract value$/).first()
  ).toBeVisible()
  await freeAgentDraftPage.expectNoHorizontalOverflow()
})
