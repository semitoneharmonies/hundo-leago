import { test, expect } from './fixtures/fadTest.js'
import { expectNoAxeViolations } from './support/accessibility.js'
import {
  privateCandidateForTeam,
  teamsForManager,
} from './support/fadScenario.js'

test('Candidate Card overview and editor pass automated and keyboard checks', async ({
  accountPage,
  fadFixture,
  freeAgentDraftPage,
  leagueChooserPage,
  page,
}) => {
  const { manifest } = fadFixture
  const alpha = manifest.leagues.alpha
  const manager = manifest.accounts.alphaMultiTeamManager
  const team = teamsForManager(alpha, manager)[0]
  const candidate = privateCandidateForTeam(alpha, team)

  await accountPage.signIn(manager)
  await leagueChooserPage.openLeague(alpha)
  const menu = page.getByRole('button', { name: 'Menu', exact: true })
  await menu.focus()
  await menu.press('Enter')
  const fadLink = page.getByRole('link', {
    name: 'Free Agent Draft',
    exact: true,
  })
  await expect(fadLink).toBeVisible()
  await fadLink.focus()
  await fadLink.press('Enter')
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
