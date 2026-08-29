import { test, expect } from './fixtures/fadTest.js'
import { expectNoAxeViolations } from './support/accessibility.js'

test('Candidate Card overview and editor pass automated and keyboard checks', async ({
  accountPage,
  fadFixture,
  freeAgentDraftPage,
  leagueChooserPage,
  page,
}) => {
  const { manifest } = fadFixture
  const beta = manifest.leagues.beta
  const manager = manifest.accounts.betaManager
  const candidate = beta.sentinels.privateCandidates[0]
  const team = beta.teams.find(({ alias }) => alias === candidate.teamAlias)

  await accountPage.signIn(manager)
  await leagueChooserPage.openLeague(beta)
  await freeAgentDraftPage.openFromMainMenu()
  await expect(
    page.getByRole('heading', { name: 'Free Agent Draft', exact: true })
  ).toBeVisible()
  await expectNoAxeViolations(page)
  await freeAgentDraftPage.expectNoHorizontalOverflow()

  await freeAgentDraftPage.openTeamLink(team)
  await freeAgentDraftPage.expectPrivateCard(candidate.playerFullName)
  await expectNoAxeViolations(page)
  await freeAgentDraftPage.exerciseEditorKeyboardFocus()
  await freeAgentDraftPage.expectNoHorizontalOverflow()
})
