// @vitest-environment node

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const themeCss = readFileSync(
  new URL('../styles/theme-a.css', import.meta.url),
  'utf8'
)

describe('theme A accessibility guards', () => {
  it('uses the dark background token for text on the accent brand mark', () => {
    const brandMark = themeCss.match(/\.hl-brand__mark\s*\{([^}]+)\}/)?.[1]

    expect(brandMark).toMatch(/background:\s*var\(--hl-accent\);/)
    expect(brandMark).toMatch(/color:\s*var\(--hl-background\);/)
  })

  it('keeps danger-button text dark against destructive backgrounds', () => {
    const dangerButton = themeCss.match(
      /\.hl-button--danger\s*\{([^}]+)\}/
    )?.[1]
    const dangerButtonHover = themeCss.match(
      /\.hl-button--danger:hover:not\(:disabled\)\s*\{([^}]+)\}/
    )?.[1]

    expect(dangerButton).toMatch(/background:\s*var\(--hl-destructive\);/)
    expect(dangerButton).toMatch(/color:\s*var\(--hl-background\);/)
    expect(dangerButtonHover).toMatch(/color:\s*var\(--hl-background\);/)
  })
})
