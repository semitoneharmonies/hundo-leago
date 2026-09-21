import { expect } from '@playwright/test'

export async function expectNoPrivatePersistence(page, markers) {
  const persisted = await page.evaluate(async () => {
    const values = []
    for (const storage of [localStorage, sessionStorage]) {
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index)
        values.push(`${key}:${storage.getItem(key)}`)
      }
    }
    if ('caches' in globalThis) {
      for (const cacheName of await caches.keys()) {
        const cache = await caches.open(cacheName)
        for (const request of await cache.keys()) {
          const response = await cache.match(request)
          let body = ''
          try {
            body = response ? await response.clone().text() : ''
          } catch {
            body = '<unreadable>'
          }
          values.push(`${cacheName}:${request.url}:${body}`)
        }
      }
    }
    return values.join('\n')
  })
  for (const marker of markers) {
    expect(persisted).not.toContain(marker)
  }
}

export async function expectNoPrivateDom(page, markers, options = {}) {
  for (const marker of markers) {
    await expect.poll(
      () => page.locator('body').evaluate(body => [
        body.innerHTML,
        ...Array.from(body.querySelectorAll('input, textarea'), field => field.value),
      ].join('\n')),
      options,
    ).not.toContain(marker)
  }
}
