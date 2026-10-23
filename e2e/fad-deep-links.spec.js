import { test, expect } from './fixtures/fadTest.js'
import { accountByAlias, teamByAlias } from './support/fadScenario.js'

test('card-ready notification rechecks access and follows the stable deep link', async ({
  accountPage,
  fadFixture,
  freeAgentDraftPage,
  notificationsPage,
  page,
}) => {
  const { manifest } = fadFixture
  const alpha = manifest.leagues.alpha
  const notification = alpha.sentinels.cardReadyNotification
  const recipient = accountByAlias(manifest, notification.recipientAccountAlias)
  const team = teamByAlias(alpha, notification.teamAlias)

  await accountPage.signIn(recipient)
  await notificationsPage.open()
  const expectedHref = freeAgentDraftPage.cardPath(alpha, team)
  const link = await notificationsPage.cardReadyLink(
    new RegExp(notification.copy, 'i'),
    expectedHref
  )
  await expect(link).toHaveAttribute('href', expectedHref)
  await notificationsPage.followCardReady(
    new RegExp(notification.copy, 'i'),
    expectedHref
  )
  await expect(
    page.getByRole('heading', { name: 'Candidate Card', exact: true })
  ).toBeVisible()
})
