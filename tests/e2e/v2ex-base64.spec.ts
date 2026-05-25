import type { BrowserContext } from '@playwright/test'
import { expect, test } from '../support/fixtures'

const V2EX_BASE64_STORAGE_KEY = 'v2exBase64Settings'
const V2EX_ROUTE = 'https://www.v2ex.com/**'
const V2EX_URL = 'https://www.v2ex.com/'
const HOST_SELECTOR = '[data-qhelper-v2ex-base64-root="true"]'

type V2exBase64Settings = {
  enabled?: boolean
  entries: string[]
}

async function configureV2exBase64Settings(
  context: BrowserContext,
  extensionId: string,
  settings: V2exBase64Settings,
) {
  const page = await context.newPage()
  await page.goto(`chrome-extension://${extensionId}/tools/settings.html`)
  await page.evaluate(
    async ({ key, nextSettings }) => {
      await chrome.storage.sync.set({ [key]: nextSettings })
      await chrome.storage.local.set({ [key]: nextSettings })
    },
    { key: V2EX_BASE64_STORAGE_KEY, nextSettings: settings },
  )
  await page.close()
}

async function routeV2ex(context: BrowserContext) {
  await context.route(V2EX_ROUTE, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `<!doctype html>
        <html lang="zh-CN">
          <head><title>V2EX fixture</title></head>
          <body>
            <main>
              <h1>V2EX fixture</h1>
              <p>content script target page</p>
            </main>
          </body>
        </html>`,
    })
  })
}

test.describe('V2EX Base64 content script', () => {
  test('injects on V2EX and copies encoded rows from the closed-shadow overlay', async ({
    context,
    extensionId,
  }) => {
    await routeV2ex(context)
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: V2EX_URL,
    })
    await configureV2exBase64Settings(context, extensionId, {
      entries: ['user@example.com'],
    })

    const page = await context.newPage()
    await page.setViewportSize({ width: 900, height: 700 })
    await page.goto(V2EX_URL)

    await expect(page.locator(HOST_SELECTOR)).toHaveCount(1)
    await expect
      .poll(() =>
        page.evaluate((source) => document.body.innerText.includes(source), 'user@example.com'),
      )
      .toBe(false)

    await page.mouse.click(854, 654)
    await page.mouse.click(833, 592)

    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe('dXNlckBleGFtcGxlLmNvbQ==')

    await page.close()
  })

  test('injects for legacy disabled settings when entries exist', async ({
    context,
    extensionId,
  }) => {
    await routeV2ex(context)
    await configureV2exBase64Settings(context, extensionId, {
      enabled: false,
      entries: ['user@example.com'],
    })

    const page = await context.newPage()
    await page.goto(V2EX_URL)
    await expect(page.locator(HOST_SELECTOR)).toHaveCount(1)
    await page.close()
  })

  test('does not inject when empty', async ({ context, extensionId }) => {
    await routeV2ex(context)

    await configureV2exBase64Settings(context, extensionId, {
      entries: [],
    })

    const emptyPage = await context.newPage()
    await emptyPage.goto(V2EX_URL)
    await emptyPage.waitForTimeout(250)
    await expect(emptyPage.locator(HOST_SELECTOR)).toHaveCount(0)
    await emptyPage.close()
  })
})
