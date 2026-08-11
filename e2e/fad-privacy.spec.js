import { AccountPage } from './pages/AccountPage.js'
import { test, expect } from './fixtures/fadTest.js'
import {
  privacyMarkers,
  privateCandidateForTeam,
  teamsForManager,
} from './support/fadScenario.js'
import {
  expectNoPrivateDom,
  expectNoPrivatePersistence,
} from './support/privacy.js'

test('sign-out removes private Candidate Card DOM and leaves no persistent copy', async ({
  accountPage,
  fadFixture,
  freeAgentDraftPage,
  page,
}) => {
  const { manifest } = fadFixture
  const alpha = manifest.leagues.alpha
  const manager = manifest.accounts.alphaMultiTeamManager
  const team = teamsForManager(alpha, manager)[0]
  const candidate = privateCandidateForTeam(alpha, team)
  const markers = privacyMarkers(manifest)

  await accountPage.signIn(manager)
  const privateResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      response.url().includes('/candidate-cards/') &&
      response.url().endsWith('/private')
  )
  await freeAgentDraftPage.openCard(alpha, team)
  await freeAgentDraftPage.expectPrivateCard(candidate.playerFullName)
  const response = await privateResponse
  expect(response.headers()['cache-control'] || '').toMatch(/no-store/i)
  await expectNoPrivatePersistence(page, markers)

  await accountPage.signOut()
  await expectNoPrivateDom(page, markers)
  await expectNoPrivatePersistence(page, markers)
})

test('session replacement purges the first context before another private card loads', async ({
  accountPage,
  browser,
  fadFixture,
  freeAgentDraftPage,
  page,
}) => {
  const { manifest } = fadFixture
  const alpha = manifest.leagues.alpha
  const manager = manifest.accounts.alphaMultiTeamManager
  const managedTeams = teamsForManager(alpha, manager)
  expect(managedTeams).toHaveLength(2)
  const firstCandidate = privateCandidateForTeam(alpha, managedTeams[0])
  const markers = privacyMarkers(manifest)

  await accountPage.signIn(manager)
  await freeAgentDraftPage.openCard(alpha, managedTeams[0])
  await freeAgentDraftPage.expectPrivateCard(firstCandidate.playerFullName)

  const replacementContext = await browser.newContext()
  const replacementPage = await replacementContext.newPage()
  const replacementAccount = new AccountPage(replacementPage, fadFixture)
  await replacementAccount.signIn(manager)

  const secondTeamLink = freeAgentDraftPage.teamLink(managedTeams[1])
  await expect(secondTeamLink).toBeVisible()
  await secondTeamLink.click()
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await expectNoPrivateDom(page, markers)
  await expectNoPrivatePersistence(page, markers)
  await replacementContext.close()
})
