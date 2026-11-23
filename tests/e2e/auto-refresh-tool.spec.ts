import http from 'node:http'
import { expect, test } from '../support/fixtures'
import { openToolPage } from '../support/helpers/extension'

test('adds a persistent rule and shows the in-page indicator', async ({
  context,
  extensionId,
}) => {
  let requestCount = 0
  const server = http.createServer((request, response) => {
    if (request.url === '/dashboard') {
      requestCount += 1
    }
    response.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      connection: 'close',
    })
    response.end(
      '<!doctype html><html><body><h1>Auto Refresh E2E</h1></body></html>',
    )
  })

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve)
  })

  const address = server.address()
  if (!address || typeof address === 'string') {
    server.close()
    throw new Error('无法启动本地测试服务器')
  }

  const pageUrl = `http://127.0.0.1:${address.port}/dashboard`

  try {
    const page = await context.newPage()
    await page.goto(pageUrl)

    const toolPage = await openToolPage(context, extensionId, 'auto-refresh')
    await expect(toolPage.getByText('还没有持久规则')).toBeVisible()

    await toolPage.getByLabel('网页 URL').fill(pageUrl)
    await toolPage.getByRole('button', { name: '添加规则' }).click()

    await expect(toolPage.getByText('规则已添加')).toBeVisible()
    await expect(toolPage.getByText(pageUrl)).toBeVisible()

    await page.bringToFront()
    await expect
      .poll(
        async () =>
          page.evaluate(
            () =>
              document.querySelector('qhelper-auto-refresh')?.shadowRoot
                ?.textContent ?? '',
          ),
        { timeout: 15_000 },
      )
      .toMatch(/\d+s|自动刷新|即将刷新/)

    const startResponse = await toolPage.evaluate(async (targetUrl) => {
      const tabs = await chrome.tabs.query({})
      const targetTab = tabs.find((tab) => tab.url === targetUrl)
      if (!targetTab?.id) {
        return { ok: false, error: '找不到目标标签页' }
      }

      return (await chrome.runtime.sendMessage({
        type: 'AUTO_REFRESH_START_SESSION',
        tabId: targetTab.id,
        intervalSeconds: 5,
      })) as { ok: boolean; error?: string }
    }, pageUrl)

    expect(startResponse.ok).toBe(true)
    await expect
      .poll(() => requestCount, { timeout: 15_000 })
      .toBeGreaterThanOrEqual(2)

    const stopResponse = await toolPage.evaluate(async (targetUrl) => {
      const tabs = await chrome.tabs.query({})
      const targetTab = tabs.find((tab) => tab.url === targetUrl)
      if (!targetTab?.id) {
        return { ok: false, error: '找不到目标标签页' }
      }

      return (await chrome.runtime.sendMessage({
        type: 'AUTO_REFRESH_STOP_SESSION',
        tabId: targetTab.id,
      })) as { ok: boolean; error?: string }
    }, pageUrl)

    expect(stopResponse.ok).toBe(true)
    await expect(page.locator('qhelper-auto-refresh')).toHaveCount(1, {
      timeout: 15_000,
    })

    const stateResponse = (await toolPage.evaluate(async (targetUrl) => {
      const tabs = await chrome.tabs.query({})
      const targetTab = tabs.find((tab) => tab.url === targetUrl)
      if (!targetTab?.id) {
        return { ok: false, error: '找不到目标标签页' }
      }

      return chrome.runtime.sendMessage({
        type: 'AUTO_REFRESH_GET_TAB_STATE',
        tabId: targetTab.id,
      })
    }, pageUrl)) as {
      ok: boolean
      data?: { session: unknown; effective: string }
    }

    expect(stateResponse.ok).toBe(true)
    expect(stateResponse.data?.session).toBeNull()
    expect(stateResponse.data?.effective).toBe('rule')

    const requestsAtStop = requestCount
    await page.waitForTimeout(6_000)
    expect(requestCount).toBe(requestsAtStop)

    await toolPage.close()
    await page.close()
  } finally {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
  }
})
