import { expect } from '@playwright/test'

import { navigateToAppPath } from '../support/navigation.js'

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
    const draftsLink = this.page.getByRole('link', {
      name: 'Drafts',
      exact: true,
    })
    await expect(draftsLink).toBeVisible()
    await draftsLink.click()
    await expect(
      this.page.getByRole('heading', { name: 'Drafts', exact: true })
    ).toBeVisible()
    const freeAgentDraftLink = this.page.getByRole('link', {
      name: /Free Agent Draft/,
    })
    await expect(freeAgentDraftLink).toBeVisible()
    await freeAgentDraftLink.click()
    await expect(this.page).toHaveURL(/\/drafts\/free-agent(?:\/|$)/)
  }

  async openCurrent(league) {
    await navigateToAppPath(this.page, this.currentPath(league))
    await expect(this.page).toHaveURL(/\/free-agent-draft(?:\/|$)/)
  }

  async openOverview(league) {
    await navigateToAppPath(this.page, this.overviewPath(league))
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
    await navigateToAppPath(this.page, this.cardPath(league, team))
  }

  async expectPrivateCard(marker) {
    await expect(
      this.page.getByRole('heading', { name: 'Candidate Card', exact: true })
    ).toBeVisible()
    await expect
      .poll(() =>
        this.page
          .locator('input')
          .evaluateAll(
            (inputs, expectedValue) =>
              inputs.some((input) => input.value === expectedValue),
            marker
          )
      )
      .toBe(true)
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
      this.page
        .getByRole('region', { name: 'Forwards' })
        .getByLabel(/^F\d{2} player name$/)
    ).toHaveCount(12)
    await expect(
      this.page
        .getByRole('region', { name: 'Defence' })
        .getByLabel(/^D\d{2} player name$/)
    ).toHaveCount(6)
    await expect(
      this.page
        .getByRole('region', { name: 'Bench' })
        .getByLabel(/^B\d{2} player name$/)
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
    const playerInput = forwards.getByRole('combobox', {
      name: /^F\d{2} player name$/,
    }).first()
    const label = await playerInput.getAttribute('aria-label')
    const slot = /^F\d{2}/.exec(label || '')?.[0]
    if (!slot) throw new Error('An editable forward slot is required.')
    await playerInput.focus()
    await expect(playerInput).toBeFocused()
    await playerInput.press('Tab')
    await expect(forwards.getByLabel(`${slot} AAV`)).toBeFocused()
  }
}
