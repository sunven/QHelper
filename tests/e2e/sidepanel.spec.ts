import { expect, test } from '../support/fixtures'
import { sidepanelUrl } from '../support/helpers/extension'

test.beforeAll(() => {
  // Chromium exposes native side panels as "other" targets, not regular tabs.
  process.env.PW_CHROMIUM_ATTACH_TO_OTHER = '1'
})

test.describe('Extension Sidepanel', () => {
  test('loads the sidepanel UI shell', async ({ context, extensionId }) => {
    const page = await context.newPage()
    await page.goto(sidepanelUrl(extensionId))

    await expect(page.getByTestId('web-summary-panel')).toBeVisible()
    await expect(page.getByTestId('web-summary-config-toggle')).toBeVisible()
    await expect(page.getByTestId('web-summary-config-drawer')).toHaveAttribute(
      'aria-hidden',
      'true',
    )

    await page.getByTestId('web-summary-config-toggle').click()

    await expect(page.getByTestId('web-summary-config-drawer')).toHaveAttribute(
      'aria-hidden',
      'false',
    )
    await expect(page.getByTestId('web-summary-endpoint')).toBeVisible()
    await expect(page.getByTestId('web-summary-model')).toBeVisible()
    await expect(page.getByTestId('web-summary-api-key')).toBeVisible()

    await page.close()
  })
})

test('keeps a full-page conversation in the real side panel through navigation and reopening', async ({
  context,
  extensionId,
}) => {
  const { createServer } = await import('node:http')
  const requests: Array<{
    messages: Array<{ role: string; content: string }>
  }> = []
  let holdReply = false
  let heldResponseClosed = false
  const server = createServer(async (request, response) => {
    if (request.method === 'POST') {
      let raw = ''
      for await (const part of request) raw += part
      const body = JSON.parse(raw) as (typeof requests)[number]
      requests.push(body)
      const isReading = body.messages.some((message) =>
        message.content.includes('<网页正文>'),
      )
      if (holdReply && !isReading) {
        response.on('close', () => {
          heldResponseClosed = true
        })
        response.writeHead(200, { 'Content-Type': 'text/event-stream' })
        response.write(
          'data: {"choices":[{"delta":{"content":"尚未完成的回答"}}]}\n\n',
        )
        return
      }
      const text = body.messages.map((message) => message.content).join('\n')
      const content = text.includes('末尾独有事实：42')
        ? '原文末尾独有事实：42。'
        : '该段没有末尾事实。'
      response.writeHead(200, { 'Content-Type': 'application/json' })
      response.end(
        JSON.stringify({
          choices: [{ message: { content }, finish_reason: 'stop' }],
        }),
      )
      return
    }
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    const other = request.url === '/other'
    response.end(
      `<html><head><title>${other ? 'Page B' : 'Full article A'}</title></head><body><article>${other ? '另一页正文。'.repeat(100) : `${'网页正文。'.repeat(4000)}末尾独有事实：42`}</article></body></html>`,
    )
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string')
    throw new Error('Missing test server port')
  const origin = `http://127.0.0.1:${address.port}`
  const control = await context.newPage()
  try {
    await control.goto(`chrome-extension://${extensionId}/popup.html`)
    const article = await control.evaluate(async (origin) => {
      await chrome.storage.local.set({
        webSummaryConfig: {
          endpoint: `${origin}/chat`,
          model: 'test-reader',
          apiKey: 'test-only',
        },
      })
      const tab = await chrome.tabs.create({
        url: `${origin}/article`,
        active: false,
      })
      if (tab.id === undefined) throw new Error('Missing article tab ID')
      return { id: tab.id, windowId: tab.windowId }
    }, origin)
    await expect
      .poll(() =>
        context.pages().some((page) => page.url() === `${origin}/article`),
      )
      .toBe(true)
    const articlePage = context
      .pages()
      .find((page) => page.url() === `${origin}/article`)
    if (!articlePage) throw new Error('Missing article page')
    await articlePage.waitForLoadState()
    await control.evaluate((tabId) => {
      const button = document.createElement('button')
      button.id = 'test-open-panel'
      button.textContent = 'Open panel'
      button.onclick = () => {
        void chrome.tabs.update(tabId, { active: true })
        void chrome.runtime.sendMessage({ type: 'OPEN_WEB_SUMMARY', tabId })
      }
      document.body.prepend(button)
    }, article.id)
    const opened = context.waitForEvent('page')
    await control.locator('#test-open-panel').click()
    let panel = await opened
    await expect(panel.getByTestId('web-summary-output')).toContainText('42')
    await expect(panel.getByTestId('web-summary-send')).toBeDisabled()
    const segments = requests.filter((request) =>
      request.messages.some((message) =>
        message.content.includes('<网页正文>'),
      ),
    )
    expect(segments.length).toBeGreaterThan(3)
    expect(
      segments.some((request) =>
        request.messages.some((message) =>
          message.content.includes('末尾独有事实：42'),
        ),
      ),
    ).toBe(true)

    await panel.getByTestId('web-summary-question').fill('结尾的数字是什么？')
    await panel.getByTestId('web-summary-send').click()
    await expect(panel.getByTestId('web-summary-message')).toHaveCount(3)
    await expect(panel.getByTestId('web-summary-message').last()).toContainText(
      '42',
    )
    await expect(panel.getByTestId('web-summary-stop')).toHaveCount(0)
    const beforeRestore = requests.length

    // Repeating the entry restores the same snapshot without another request.
    await control.evaluate(
      (tabId) =>
        chrome.runtime.sendMessage({ type: 'OPEN_WEB_SUMMARY', tabId }),
      article.id,
    )
    await expect(panel.getByTestId('web-summary-message')).toHaveCount(3)
    expect(requests).toHaveLength(beforeRestore)

    await articlePage.goto(`${origin}/other`)
    await expect(panel.getByText('Page B', { exact: true })).toBeVisible()
    await expect(
      panel.getByText('Full article A', { exact: true }),
    ).toBeVisible()
    await panel
      .getByTestId('web-summary-question')
      .fill('还是依据原来的文章吗？')
    await panel.getByTestId('web-summary-send').click()
    await expect(panel.getByTestId('web-summary-message')).toHaveCount(5)
    await expect(panel.getByTestId('web-summary-message').last()).toContainText(
      '42',
    )
    await expect(panel.getByTestId('web-summary-stop')).toHaveCount(0)

    holdReply = true
    await panel.getByTestId('web-summary-question').fill('继续解释')
    await panel.getByTestId('web-summary-send').click()
    await expect(panel.getByTestId('web-summary-message').last()).toContainText(
      '尚未完成的回答',
    )
    await control.evaluate(
      (windowId) => chrome.sidePanel.close({ windowId }),
      article.windowId,
    )
    await expect.poll(() => heldResponseClosed).toBe(true)
    const stoppedCount = requests.length
    holdReply = false

    // Open the panel without asking to summarize the newly navigated page.
    await control.evaluate((windowId) => {
      const button =
        document.querySelector<HTMLButtonElement>('#test-open-panel')
      if (!button) throw new Error('Missing launcher')
      button.onclick = () => {
        void chrome.sidePanel.open({ windowId })
      }
    }, article.windowId)
    await control.locator('#test-open-panel').click()
    await expect
      .poll(
        () =>
          context
            .pages()
            .filter(
              (page) =>
                page.url().endsWith('/sidepanel.html') && !page.isClosed(),
            ).length,
      )
      .toBe(1)
    const restoredPanel = context
      .pages()
      .find(
        (page) => page.url().endsWith('/sidepanel.html') && !page.isClosed(),
      )
    if (!restoredPanel) throw new Error('Missing restored panel')
    panel = restoredPanel
    await expect(panel.getByTestId('web-summary-message')).toHaveCount(7)
    await expect(panel.getByTestId('web-summary-retry')).toBeVisible()
    await expect(panel.getByTestId('web-summary-message').last()).toContainText(
      '尚未完成的回答',
    )
    expect(requests).toHaveLength(stoppedCount)

    await articlePage.close()
    await expect(
      panel.getByText('Full article A', { exact: true }),
    ).toBeVisible()
    await panel.getByTestId('web-summary-clear').click()
    await expect(panel.getByTestId('web-summary-message')).toHaveCount(0)
    await expect
      .poll(async () =>
        control.evaluate(
          async (windowId) =>
            (
              await chrome.storage.session.get(
                `webSummaryConversation:${windowId}`,
              )
            )[`webSummaryConversation:${windowId}`] ?? null,
          article.windowId,
        ),
      )
      .toBeNull()
  } finally {
    server.closeAllConnections()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
})

test('isolates windows and removes session data when its window closes', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage()
  await page.goto(sidepanelUrl(extensionId))
  const ids = await page.evaluate(async () => {
    const current = await chrome.windows.getCurrent()
    const other = await chrome.windows.create({
      url: 'about:blank',
      focused: false,
    })
    if (current.id === undefined || other?.id === undefined)
      throw new Error('Missing test window')
    const make = (windowId: number, title: string) => ({
      id: title,
      windowId,
      tabId: 900,
      createdAt: 1,
      memory: '',
      memoryThrough: 0,
      page: {
        title,
        url: `https://example.com/${title}`,
        content: 'body',
        charCount: 4,
        source: 'article',
        truncated: false,
      },
      messages: [
        { id: 's', role: 'assistant', content: title, status: 'complete' },
      ],
    })
    await chrome.storage.session.set({
      [`webSummaryConversation:${current.id}`]: make(
        current.id,
        'first-window',
      ),
      [`webSummaryConversation:${other.id}`]: make(other.id, 'second-window'),
    })
    return { first: current.id, second: other.id }
  })
  await page.reload()
  await expect(page.getByTestId('web-summary-output')).toHaveText(
    'first-window',
  )
  await expect(page.getByText('second-window')).toHaveCount(0)
  await page.evaluate((id) => chrome.windows.remove(id), ids.second)
  await expect
    .poll(() =>
      page.evaluate(
        async (id) =>
          (await chrome.storage.session.get(`webSummaryConversation:${id}`))[
            `webSummaryConversation:${id}`
          ] ?? null,
        ids.second,
      ),
    )
    .toBeNull()
  expect(
    await page.evaluate(
      async (id) =>
        !!(await chrome.storage.session.get(`webSummaryConversation:${id}`))[
          `webSummaryConversation:${id}`
        ],
      ids.first,
    ),
  ).toBe(true)
})

test('drops conversation data on browser restart while retaining configuration', async ({
  headless,
}, testInfo) => {
  const { chromium } = await import('@playwright/test')
  const { resolve } = await import('node:path')
  const extensionPath = resolve('.output/chrome-mv3')
  const profile = testInfo.outputPath('restart-profile')
  const options = {
    channel: 'chromium',
    headless,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  }
  let browser = await chromium.launchPersistentContext(profile, options)
  try {
    const worker =
      browser.serviceWorkers()[0] ??
      (await browser.waitForEvent('serviceworker'))
    const extensionId = worker.url().split('/')[2]
    let page = await browser.newPage()
    const url = `chrome-extension://${extensionId}/popup.html`
    await page.goto(url)
    await page.evaluate(async () => {
      const win = await chrome.windows.getCurrent()
      await chrome.storage.local.set({
        webSummaryConfig: { model: 'retained' },
      })
      await chrome.storage.session.set({
        [`webSummaryConversation:${win.id}`]: {
          id: 'restart',
          windowId: win.id,
          tabId: 1,
          createdAt: 1,
          page: {
            title: 'Private page',
            url: 'https://example.com',
            content: 'Private text',
            charCount: 12,
            source: 'article',
            truncated: false,
          },
          memory: 'Earlier agreement',
          memoryThrough: 0,
          messages: [
            {
              id: 's',
              role: 'assistant',
              content: 'Summary',
              status: 'complete',
            },
          ],
        },
      })
    })
    await browser.close()
    browser = await chromium.launchPersistentContext(profile, options)
    page = await browser.newPage()
    await page.goto(url)
    const stored = await page.evaluate(async () => ({
      session: await chrome.storage.session.get(null),
      local: await chrome.storage.local.get('webSummaryConfig'),
    }))
    expect(
      Object.keys(stored.session).filter((key) =>
        key.startsWith('webSummaryConversation:'),
      ),
    ).toEqual([])
    expect(stored.local.webSummaryConfig).toEqual({ model: 'retained' })
    await page.goto(sidepanelUrl(extensionId))
    await expect(page.getByTestId('web-summary-summarize')).toBeEnabled()
    await expect(page.getByTestId('web-summary-message')).toHaveCount(0)
  } finally {
    await browser.close()
  }
})
