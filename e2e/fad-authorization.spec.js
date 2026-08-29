import { FreeAgentDraftPage } from './pages/FreeAgentDraftPage.js'
import { test, expect } from './fixtures/fadTest.js'
import { teamByAlias } from './support/fadScenario.js'
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
  const manager = manifest.accounts.betaManager
  const betaCandidate = beta.sentinels.privateCandidates[0]
  const ownTeam = teamByAlias(beta, betaCandidate.teamAlias)
  const deniedTeam = beta.teams.find(
    (team) => team.managerAccountAlias !== manager.alias
  )
  const alphaTeam = alpha.teams[0]

  await accountPage.signIn(manager)
  await freeAgentDraftPage.openCard(beta, ownTeam)
  await freeAgentDraftPage.expectPrivateCard(betaCandidate.playerFullName)

  await freeAgentDraftPage.openCard(beta, deniedTeam)
  await freeAgentDraftPage.expectPrivateCardUnavailable()
  await expectNoPrivateDom(page, [betaCandidate.playerFullName])

  await freeAgentDraftPage.openCard(alpha, alphaTeam)
  await freeAgentDraftPage.expectLeagueAccessUnavailable()
  await expectNoPrivateDom(page, [betaCandidate.playerFullName])

  const anonymousContext = await browser.newContext()
  const anonymousPage = await anonymousContext.newPage()
  const anonymousFad = new FreeAgentDraftPage(anonymousPage)
  await anonymousFad.openCard(beta, ownTeam)
  await expect(
    anonymousPage.getByRole('heading', { name: 'Sign in' })
  ).toBeVisible()
  await expectNoPrivateDom(anonymousPage, [betaCandidate.playerFullName])
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

  await accountPage.signIn(commissioner)
  await freeAgentDraftPage.openCard(alpha, deniedTeam)
  await freeAgentDraftPage.expectPrivateCardUnavailable()
  await expectNoPrivateDom(page, manifest.privacyChecks.privateMarkers)

  await freeAgentDraftPage.openCard(alpha, helpTeam)
  await expect(
    page.getByRole('heading', { name: 'Candidate Card', exact: true })
  ).toBeVisible()
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

  await accountPage.signIn(platformAdmin)
  await freeAgentDraftPage.openCard(alpha, deniedTeam)
  await freeAgentDraftPage.expectPrivateCardUnavailable()
  await expectNoPrivateDom(page, manifest.privacyChecks.privateMarkers)
})
