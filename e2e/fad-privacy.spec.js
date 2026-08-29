import { AccountPage } from './pages/AccountPage.js'
import { test, expect } from './fixtures/fadTest.js'
import {
  privacyMarkers,
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
  const beta = manifest.leagues.beta
  const manager = manifest.accounts.betaManager
  const candidate = beta.sentinels.privateCandidates[0]
  const team = beta.teams.find(({ alias }) => alias === candidate.teamAlias)
  const markers = privacyMarkers(manifest)

  await accountPage.signIn(manager)
  const privateResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      response.url().includes('/candidate-cards/') &&
      response.url().endsWith('/private')
  )
  await freeAgentDraftPage.openCard(beta, team)
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
  const beta = manifest.leagues.beta
  const manager = manifest.accounts.betaManager
  const managedTeams = teamsForManager(beta, manager)
  expect(managedTeams.length).toBeGreaterThanOrEqual(2)
  const firstCandidate = beta.sentinels.privateCandidates[0]
  const firstTeam = beta.teams.find(({ alias }) => alias === firstCandidate.teamAlias)
  const markers = privacyMarkers(manifest)

  await accountPage.signIn(manager)
  await freeAgentDraftPage.openCard(beta, firstTeam)
  await freeAgentDraftPage.expectPrivateCard(firstCandidate.playerFullName)

  const replacementContext = await browser.newContext()
  const replacementPage = await replacementContext.newPage()
  const replacementAccount = new AccountPage(replacementPage, fadFixture)
  await replacementAccount.signIn(manager)

  const secondTeamLink = freeAgentDraftPage.teamLink(
    managedTeams.find(({ teamId }) => teamId !== firstTeam.teamId)
  )
  await expect(secondTeamLink).toBeVisible()
  await secondTeamLink.click()
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await expectNoPrivateDom(page, markers)
  await expectNoPrivatePersistence(page, markers)
  await replacementContext.close()
})
