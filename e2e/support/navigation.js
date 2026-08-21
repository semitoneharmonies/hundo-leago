import { expect } from '@playwright/test'

const INTERRUPTED_APP_NAVIGATION =
  /NS_BINDING_ABORTED|NS_ERROR_FAILURE|Frame load interrupted/i

function pathWithSearchAndHash(value) {
  const url = new URL(value, 'http://127.0.0.1:5173')
  return `${url.pathname}${url.search}${url.hash}`
}

export async function navigateToAppPath(page, path) {
  const targetUrl = new URL(path, 'http://127.0.0.1:5173')
  const expectedPath = pathWithSearchAndHash(targetUrl.href)
  const currentUrl = new URL(page.url())

  if (currentUrl.origin === targetUrl.origin) {
    await page.evaluate((nextPath) => {
      window.history.pushState({}, '', nextPath)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }, expectedPath)
    await expect
      .poll(() => pathWithSearchAndHash(page.url()))
      .toBe(expectedPath)
    return
  }

  try {
    await page.goto(targetUrl.href, { waitUntil: 'domcontentloaded' })
  } catch (error) {
    if (!INTERRUPTED_APP_NAVIGATION.test(String(error?.message || error))) {
      throw error
    }

    await expect
      .poll(() => pathWithSearchAndHash(page.url()))
      .toBe(expectedPath)
  }
}
