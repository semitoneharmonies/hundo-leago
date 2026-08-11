import { test as base, expect } from '@playwright/test'

import { AccountPage } from '../pages/AccountPage.js'
import { FreeAgentDraftPage } from '../pages/FreeAgentDraftPage.js'
import { LeagueChooserPage } from '../pages/LeagueChooserPage.js'
import { NotificationsPage } from '../pages/NotificationsPage.js'
import { readConnectedFadFixture } from '../support/fadManifest.js'
import { startLocalFadStack } from '../support/localStack.js'

export const test = base.extend({
  fadFixture: [
    async ({ browserName }, provide) => {
      if (!browserName) throw new Error('A Playwright browser is required.')
      const stack = await startLocalFadStack()
      try {
        await provide(readConnectedFadFixture())
      } finally {
        await stack.close()
      }
    },
    { scope: 'worker' },
  ],
  accountPage: async ({ page, fadFixture }, provide) => {
    await provide(new AccountPage(page, fadFixture))
  },
  leagueChooserPage: async ({ page }, provide) => {
    await provide(new LeagueChooserPage(page))
  },
  freeAgentDraftPage: async ({ page }, provide) => {
    await provide(new FreeAgentDraftPage(page))
  },
  notificationsPage: async ({ page }, provide) => {
    await provide(new NotificationsPage(page))
  },
})

export { expect }
