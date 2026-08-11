import { expect } from '@playwright/test'

export class NotificationsPage {
  constructor(page) {
    this.page = page
  }

  async open() {
    await this.page.goto('/notifications')
    await expect(
      this.page.getByRole('heading', { name: 'Notifications', exact: true })
    ).toBeVisible()
  }

  async cardReadyLink(copy, expectedHref) {
    const links = this.page.getByRole('link', { name: copy })
    await expect(links.first()).toBeVisible()

    const count = await links.count()
    for (let index = 0; index < count; index += 1) {
      const link = links.nth(index)
      if ((await link.getAttribute('href')) === expectedHref) return link
    }

    throw new Error(
      `No card-ready notification points to the expected destination (${count} matching notification links).`
    )
  }

  async followCardReady(copy, expectedHref) {
    const link = await this.cardReadyLink(copy, expectedHref)
    const href = await link.getAttribute('href')
    if (!href) throw new Error('The card-ready notification has no destination.')
    await link.click()
    await expect(this.page).toHaveURL(new RegExp(`${escapeRegExp(href)}$`))
    return href
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
