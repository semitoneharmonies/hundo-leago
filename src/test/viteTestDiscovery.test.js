// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { configDefaults } from 'vitest/config'

import viteConfig from '../../vite.config.js'

describe('Vitest discovery boundary', () => {
  it('preserves default exclusions and keeps Playwright specs out of Vitest', () => {
    expect(viteConfig.test.exclude).toEqual([
      ...configDefaults.exclude,
      'e2e/**',
    ])
  })
})
