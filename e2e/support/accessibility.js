import AxeBuilder from '@axe-core/playwright'
import { expect } from '@playwright/test'

export async function readAxeViolations(page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    targets: violation.nodes.map((node) => node.target),
  }))
}

export async function expectNoAxeViolations(page) {
  const safeViolations = await readAxeViolations(page)
  expect(safeViolations).toEqual([])
}
