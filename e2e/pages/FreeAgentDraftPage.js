import { expect } from '@playwright/test'

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export class FreeAgentDraftPage {
  constructor(page) {
    this.page = page
  }

  currentPath(league) {
    return `/leagues/${encodeURIComponent(
      league.leagueId
    )}/free-agent-draft`
  }

  overviewPath(league) {
    return `${this.currentPath(league)}/${encodeURIComponent(league.fadId)}`
  }

  cardPath(league, team) {
    return `${this.overviewPath(league)}/cards/${encodeURIComponent(team.teamId)}`
  }

  async openFromMainMenu() {
    await this.page
      .getByRole('button', { name: 'Menu', exact: true })
      .click()
    const link = this.page.getByRole('link', {
      name: 'Free Agent Draft',
      exact: true,
    })
    await expect(link).toBeVisible()
    await link.click()
    await expect(this.page).toHaveURL(/\/free-agent-draft(?:\/|$)/)
  }

  async openCurrent(league) {
    await this.page.goto(this.currentPath(league))
    await expect(this.page).toHaveURL(/\/free-agent-draft(?:\/|$)/)
  }

  async openOverview(league) {
    await this.page.goto(this.overviewPath(league))
    await expect(
      this.page.getByRole('heading', { name: 'Free Agent Draft', exact: true })
    ).toBeVisible()
  }

  async openTeamLink(team) {
    const link = this.teamLink(team)
    await expect(link).toBeVisible()
    await link.click()
    await expect(this.page).toHaveURL(this.cardPathFromCurrent(team))
  }

  teamLink(team) {
    return this.page.getByRole('link', {
      name: new RegExp(`^${escapeRegExp(team.name)}\\b`),
    })
  }

  cardPathFromCurrent(team) {
    const url = new URL(this.page.url())
    const base = url.pathname.replace(/\/cards\/[^/]+$/, '')
    return new RegExp(
      `${escapeRegExp(base)}/cards/${escapeRegExp(
        encodeURIComponent(team.teamId)
      )}$`
    )
  }

  async openCard(league, team) {
    await this.page.goto(this.cardPath(league, team))
  }

  async expectPrivateCard(marker) {
    await expect(
      this.page.getByRole('heading', { name: 'Candidate Card', exact: true })
    ).toBeVisible()
    await expect(this.page.getByText(marker, { exact: true })).toBeVisible()
  }

  async expectPrivateCardUnavailable() {
    await expect(
      this.page.getByRole('heading', {
        name: 'Candidate Card access unavailable',
      })
    ).toBeVisible()
    await expect(this.page.getByRole('alert')).toContainText(
      'This private card is not available'
    )
  }

  async expectLeagueAccessUnavailable() {
    await expect(this.page.getByRole('alert')).toContainText(
      'This league is not in your current active memberships.'
    )
  }

  async expectSlotMatrix() {
    await expect(
      this.page.getByRole('region', { name: 'Forwards' }).getByRole('article')
    ).toHaveCount(12)
    await expect(
      this.page.getByRole('region', { name: 'Defence' }).getByRole('article')
    ).toHaveCount(6)
    await expect(
      this.page.getByRole('region', { name: 'Bench' }).getByRole('article')
    ).toHaveCount(4)
  }

  async expectNoHorizontalOverflow() {
    await expect
      .poll(() =>
        this.page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth
        )
      )
      .toBe(true)
  }

  async exerciseEditorKeyboardFocus() {
    const forwards = this.page.getByRole('region', { name: 'Forwards' })
    const article = forwards
      .getByRole('article')
      .filter({
        has: this.page.getByRole('button', { name: 'Add candidate' }),
      })
      .first()
    const add = article.getByRole('button', { name: 'Add candidate' })
    await add.focus()
    await add.press('Enter')
    const editor = this.page.getByRole('region', {
      name: /Add a candidate to/,
    })
    const form = editor.getByRole('form', { name: /Add a candidate to/ })
    await expect(form).toBeVisible()
    const close = editor.getByRole('button', { name: 'Close', exact: true })
    await close.focus()
    await close.press('Enter')
    await expect(article).toBeFocused()
  }
}
