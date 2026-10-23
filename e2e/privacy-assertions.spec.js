import { test, expect } from '@playwright/test'
import { expectNoPrivateDom } from './support/privacy.js'

for (const control of ['input', 'textarea']) {
  test(`privacy check detects a private ${control} value and accepts its removal`, async ({ page }) => {
    const marker = 'Private Candidate Sentinel'
    await page.setContent(`<label>Candidate<${control}></${control}></label>`)
    const field = page.getByLabel('Candidate', { exact: true })
    await field.fill(marker)
    expect(await page.locator('body').textContent()).not.toContain(marker)
    await expect(expectNoPrivateDom(page, [marker], { timeout: 100 })).rejects.toThrow()
    await field.fill('')
    await expectNoPrivateDom(page, [marker])
  })
}
