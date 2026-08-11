import { FreeAgentDraftPage } from './pages/FreeAgentDraftPage.js'
import { test, expect } from './fixtures/fadTest.js'
import {
  privateCandidateForTeam,
  teamByAlias,
  teamsForManager,
} from './support/fadScenario.js'
import { expectNoPrivateDom } from './support/privacy.js'

test('manager, cross-league, and anonymous card boundaries fail closed', async ({
  accountPage,
  browser,
  fadFixture,
  freeAgentDraftPage,
  page,
}) => {
  const { manifest } = fadFixture
  const alpha = manifest.leagues.alpha
  const beta = manifest.leagues.beta
  const manager = manifest.accounts.alphaMultiTeamManager
  const managedTeams = teamsForManager(alpha, manager)
  const ownTeam = managedTeams[0]
  const ownCandidate = privateCandidateForTeam(alpha, ownTeam)
  const deniedTeam = teamByAlias(
    alpha,
    manifest.privacyChecks.alphaManagerDeniedTeamAlias
  )
  const deniedCandidate = privateCandidateForTeam(alpha, deniedTeam)
  const betaCandidate = beta.sentinels.privateCandidates[0]
  const betaTeam = teamByAlias(beta, betaCandidate.teamAlias)

  await accountPage.signIn(manager)
  await freeAgentDraftPage.openCard(alpha, ownTeam)
  await freeAgentDraftPage.expectPrivateCard(ownCandidate.playerFullName)

  await freeAgentDraftPage.openCard(alpha, deniedTeam)
  await freeAgentDraftPage.expectPrivateCardUnavailable()
  await expectNoPrivateDom(page, [deniedCandidate.playerFullName])

  await freeAgentDraftPage.openCard(beta, betaTeam)
  await freeAgentDraftPage.expectLeagueAccessUnavailable()
  await expectNoPrivateDom(page, [betaCandidate.playerFullName])

  const anonymousContext = await browser.newContext()
  const anonymousPage = await anonymousContext.newPage()
  const anonymousFad = new FreeAgentDraftPage(anonymousPage)
  await anonymousFad.openCard(alpha, ownTeam)
  await expect(
    anonymousPage.getByRole('heading', { name: 'Sign in' })
  ).toBeVisible()
  await expectNoPrivateDom(anonymousPage, [ownCandidate.playerFullName])
  await anonymousContext.close()
})

test('commissioner sees only the card with an exact active help grant', async ({
  accountPage,
  fadFixture,
  freeAgentDraftPage,
  page,
}) => {
  const { manifest } = fadFixture
  const alpha = manifest.leagues.alpha
  const commissioner = manifest.accounts.alphaCommissioner
  const help = alpha.sentinels.exactCommissionerHelp
  const helpTeam = teamByAlias(alpha, help.teamAlias)
  const deniedTeam = teamByAlias(
    alpha,
    manifest.privacyChecks.commissionerDeniedTeamAlias
  )
  const deniedCandidate = privateCandidateForTeam(alpha, deniedTeam)

  await accountPage.signIn(commissioner)
  await freeAgentDraftPage.openCard(alpha, deniedTeam)
  await freeAgentDraftPage.expectPrivateCardUnavailable()
  await expectNoPrivateDom(page, [deniedCandidate.playerFullName])

  await freeAgentDraftPage.openCard(alpha, helpTeam)
  await freeAgentDraftPage.expectPrivateCard(help.privatePlayerFullName)
})

test('member platform administrator has no implicit card access', async ({
  accountPage,
  fadFixture,
  freeAgentDraftPage,
  page,
}) => {
  const { manifest } = fadFixture
  const alpha = manifest.leagues.alpha
  const platformAdmin = manifest.accounts.platformAdmin
  const deniedTeam = teamByAlias(
    alpha,
    manifest.privacyChecks.commissionerDeniedTeamAlias
  )
  const deniedCandidate = privateCandidateForTeam(alpha, deniedTeam)

  await accountPage.signIn(platformAdmin)
  await freeAgentDraftPage.openCard(alpha, deniedTeam)
  await freeAgentDraftPage.expectPrivateCardUnavailable()
  await expectNoPrivateDom(page, [deniedCandidate.playerFullName])
})
