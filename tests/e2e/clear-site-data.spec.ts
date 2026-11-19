import http from 'node:http'
import { expect, test } from '../support/fixtures'
import { toolUrl } from '../support/helpers/extension'

async function startServer() {
  const server = http.createServer((_request, response) => {
    response.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      connection: 'close',
    })
    response.end(
      '<!doctype html><html><body><h1>Site Data E2E</h1></body></html>',
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

  return {
    origin: `http://127.0.0.1:${address.port}`,
    async close() {
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
    },
  }
}

async function seedSiteData(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    document.cookie = 'qhelper_e2e=1; path=/'
    localStorage.setItem('qhelper-e2e', '1')
    sessionStorage.setItem('qhelper-e2e', '1')

    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('qhelper-e2e', 1)
      request.onupgradeneeded = () => {
        request.result.createObjectStore('store')
      }
      request.onsuccess = () => {
        request.result.close()
        resolve()
      }
      request.onerror = () => reject(request.error)
    })

    await caches.open('qhelper-e2e-cache')
  })
}

test('clears cookies and page storage for the launched origin', async ({
  context,
  extensionId,
}) => {
  const server = await startServer()

  try {
    const page = await context.newPage()
    await page.goto(`${server.origin}/page`)
    await seedSiteData(page)

    const toolPage = await context.newPage()
    await toolPage.goto(
      `${toolUrl(extensionId, 'clear-site-data')}?origin=${encodeURIComponent(server.origin)}`,
    )

    await expect(
      toolPage.getByTestId('clear-site-data-target-current'),
    ).toBeChecked()
    await expect(toolPage.getByText(server.origin, { exact: true })).toBeVisible()

    // 计数来自页面注入与 Cookies API
    await expect(toolPage.getByTestId('clear-site-data-count-cookies')).toHaveText(
      '1',
    )
    await expect(
      toolPage.getByTestId('clear-site-data-count-localStorage'),
    ).toHaveText('1')
    await expect(
      toolPage.getByTestId('clear-site-data-count-sessionStorage'),
    ).toHaveText('1')
    await expect(
      toolPage.getByTestId('clear-site-data-count-indexedDB'),
    ).toHaveText('1')
    await expect(
      toolPage.getByTestId('clear-site-data-count-cacheStorage'),
    ).toHaveText('1')

    // 关闭自动刷新以稳定断言
    await toolPage.getByTestId('clear-site-data-refresh-after').click()
    await toolPage.getByTestId('clear-site-data-clear').click()
    await expect(toolPage.getByText('确认清除站点数据')).toBeVisible()
    await toolPage.getByTestId('clear-site-data-confirm').click()

    await expect(
      toolPage.getByTestId('clear-site-data-result-cookies'),
    ).toContainText('成功')
    await expect(
      toolPage.getByTestId('clear-site-data-result-sessionStorage'),
    ).toContainText('成功')

    await expect
      .poll(() => page.evaluate(() => localStorage.length))
      .toBe(0)
    await expect
      .poll(() => page.evaluate(() => sessionStorage.length))
      .toBe(0)
    await expect.poll(() => page.evaluate(() => document.cookie)).toBe('')
    await expect
      .poll(() => page.evaluate(async () => (await indexedDB.databases()).length))
      .toBe(0)
    await expect
      .poll(() => page.evaluate(() => caches.keys().then((keys) => keys.length)))
      .toBe(0)

    await toolPage.close()
    await page.close()
  } finally {
    await server.close()
  }
})

test('reloads affected tabs when refresh is enabled', async ({
  context,
  extensionId,
}) => {
  const server = await startServer()

  try {
    const page = await context.newPage()
    await page.goto(`${server.origin}/page`)
    await page.evaluate(() => {
      localStorage.setItem('qhelper-e2e', '1')
    })

    const toolPage = await context.newPage()
    await toolPage.goto(
      `${toolUrl(extensionId, 'clear-site-data')}?origin=${encodeURIComponent(server.origin)}`,
    )

    await expect(
      toolPage.getByTestId('clear-site-data-count-localStorage'),
    ).toHaveText('1')

    const navigation = page.waitForEvent('load')
    await toolPage.getByTestId('clear-site-data-clear').click()
    await toolPage.getByTestId('clear-site-data-confirm').click()

    await navigation
    await expect
      .poll(() => page.evaluate(() => localStorage.length))
      .toBe(0)

    await toolPage.close()
    await page.close()
  } finally {
    await server.close()
  }
})
