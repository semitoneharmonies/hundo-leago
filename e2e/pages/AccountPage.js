import { expect } from '@playwright/test'
import { navigateToAppPath } from '../support/navigation.js'

export class AccountPage {
  constructor(page, fixture) {
    this.page = page
    this.fixture = fixture
  }

  async signIn(account) {
    await navigateToAppPath(this.page, '/')
    const form = this.page.getByRole('form', { name: 'Sign in' })
    await expect(form).toBeVisible()
    await form.getByLabel('Email address').fill(account.email)
    await form.getByLabel('Password').fill(this.fixture.password)
    await form.getByRole('button', { name: 'Sign in' }).click()
    await expect(this.page).toHaveURL(/\/leagues(?:\/|$)/)
    await expect(
      this.page.getByRole('button', { name: 'Account menu' })
    ).toBeVisible()
  }

  async signOut() {
    const menu = this.page.getByRole('button', { name: 'Account menu' })
    await menu.click()
    await this.page.getByRole('button', { name: 'Sign out' }).click()
    await expect(
      this.page.getByRole('heading', { name: 'Sign in' })
    ).toBeVisible()
  }
}
