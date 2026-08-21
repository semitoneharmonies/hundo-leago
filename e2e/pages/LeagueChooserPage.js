import { expect } from '@playwright/test'

const FRONTEND_ORIGIN = 'http://127.0.0.1:5173'

export class LeagueChooserPage {
  constructor(page) {
    this.page = page
  }

  async openLeague(league) {
    const destination = `${FRONTEND_ORIGIN}/leagues/${encodeURIComponent(
      league.leagueId
    )}`
    if (this.page.url() === destination) return
    const link = this.page.getByRole('link', {
      name: league.name,
      exact: true,
    })
    await expect
      .poll(async () =>
        this.page.url() === destination || (await link.isVisible())
      )
      .toBe(true)
    if (this.page.url() === destination) return
    await link.click()
    await expect(this.page).toHaveURL(destination)
  }
}
