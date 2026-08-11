import { expect } from '@playwright/test'

export class AccountPage {
  constructor(page, fixture) {
    this.page = page
    this.fixture = fixture
  }

  async signIn(account) {
    await this.page.goto('/')
    const form = this.page.getByRole('form', { name: 'Sign in' })
    await expect(form).toBeVisible()
    await form.getByLabel('Email address').fill(account.email)
    await form.getByLabel('Password').fill(this.fixture.password)
    await form.getByRole('button', { name: 'Sign in' }).click()
    await expect(this.page).toHaveURL(/\/leagues(?:\/|$)/)
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
