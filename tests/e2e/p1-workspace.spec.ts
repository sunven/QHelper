import type { Page } from '@playwright/test'
import { expect, test } from '../support/fixtures'
import { openToolPage } from '../support/helpers/extension'

async function selectTool(page: Page, id: string) {
  const search = page.getByRole('textbox', { name: '搜索工具' })
  await search.fill(id)
  await page.getByTestId(`discovery-search-${id}`).click()
  await search.press('Escape')
  await expect(page).toHaveURL(new RegExp(`/tools/${id}\\.html$`))
}

async function stored(page: Page, key: string) {
  return page.evaluate(
    async (storageKey) =>
      (await chrome.storage.local.get(storageKey))[storageKey],
    key,
  )
}

async function fillTextPreview(page: Page, value: string) {
  const editor = page.getByTestId('source-text-editor').locator('.cm-content')
  await editor.click()
  await page.keyboard.press(
    process.platform === 'darwin' ? 'Meta+A' : 'Control+A',
  )
  await page.keyboard.insertText(value)
}

test('popup search, favorites and recent tools are shared with the sidebar', async ({
  context,
  popupPage,
}) => {
  const search = popupPage.getByRole('textbox', { name: '搜索工具' })
  await search.fill('json')
  const result = popupPage.getByTestId('discovery-search-json')
  const favorite = result.locator('..').getByRole('button', { name: /^收藏/ })
  await favorite.click()
  await expect(
    result.locator('..').getByRole('button', { name: /^取消收藏/ }),
  ).toHaveAttribute('aria-pressed', 'true')
  await search.fill('urlparser')
  const newPage = context.waitForEvent('page')
  await search.press('Enter')
  const page = await newPage
  await expect(page).toHaveURL(/\/tools\/urlparser\.html$/)
  await expect(page.getByTestId('discovery-favorites-json')).toBeVisible()
  await expect(page.getByTestId('discovery-recent-urlparser')).toBeVisible()
  await popupPage.reload()
  await expect(popupPage.getByTestId('discovery-favorites-json')).toBeVisible()
  await expect(
    popupPage.getByTestId('discovery-recent-urlparser'),
  ).toBeVisible()
  await page.getByRole('textbox', { name: '搜索工具' }).fill('no-such-tool')
  await expect(page.getByText('没有找到匹配的工具。')).toBeVisible()
})

for (const handoff of [
  {
    id: 'json',
    raw: '  {"private":"json-handoff"}  ',
    link: '打开 JSON 格式化',
    selector: '[data-testid="json-input"]',
  },
  {
    id: 'urlparser',
    raw: '  https://example.invalid/path?token=url-handoff  ',
    link: '打开 URL 解析器',
    selector: 'textarea[placeholder^="请输入 URL"]',
  },
  {
    id: 'convert',
    raw: '  aGVsbG8gdGVtcG9yYXJ5  ',
    link: '打开字符串编解码',
    selector: 'textarea[placeholder="粘贴需要进行编解码的字符串"]',
  },
]) {
  test(`Context Hub carries exact ${handoff.id} input only in memory`, async ({
    context,
    extensionId,
  }) => {
    const page = await openToolPage(context, extensionId, 'context-hub')
    await page.getByRole('textbox', { name: 'Context input' }).fill(handoff.raw)
    await page.getByRole('link', { name: handoff.link, exact: true }).click()
    await expect(page.locator(`${handoff.selector}:visible`)).toHaveValue(
      handoff.raw,
    )
    await expect(
      page.getByRole('button', { name: '结束临时处理' }),
    ).toBeVisible()
    await expect(page).toHaveURL(
      `chrome-extension://${extensionId}/tools/${handoff.id}.html`,
    )
    const persisted = await page.evaluate(async () =>
      JSON.stringify({
        chrome: await chrome.storage.local.get(null),
        local: { ...localStorage },
        session: { ...sessionStorage },
        state: history.state,
      }),
    )
    expect(persisted).not.toContain(handoff.raw.trim())
    await page.reload()
    await expect(
      page.getByRole('button', { name: '开始临时处理' }),
    ).toBeVisible()
    await expect(page.locator(`${handoff.selector}:visible`)).not.toHaveValue(
      handoff.raw,
    )
  })
}

test('temporary edits survive navigation and snapshots leave the ordinary draft intact', async ({
  context,
  extensionId,
}) => {
  const page = await openToolPage(context, extensionId, 'json')
  const input = page.locator('[data-testid="json-input"]:visible')
  await input.fill('{"ordinary":1}')
  await page.getByRole('button', { name: '开始临时处理' }).click()
  await expect(input).toHaveValue('')
  await input.fill('{"temporary":2}')
  await selectTool(page, 'urlparser')
  await page.getByTestId('tool-settings-link').click()
  await expect(
    page.getByRole('region', { name: '本地数据', exact: true }),
  ).toBeVisible()
  await selectTool(page, 'json')
  await expect(input).toHaveValue('{"temporary":2}')
  await page.getByRole('button', { name: '保存一份', exact: true }).click()
  await expect(
    page.getByText('已保存一份快照，当前编辑模式不变。'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '结束临时处理' })).toBeVisible()
  page.on('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: '结束临时处理' }).click()
  await expect(input).toHaveValue('{"ordinary":1}')
  await page
    .getByRole('button', { name: '已保存快照 (1)', exact: true })
    .click()
  await page.getByRole('button', { name: '恢复', exact: true }).click()
  await expect(input).toHaveValue('{"temporary":2}')
  await page.getByRole('button', { name: '结束临时处理' }).click()
  await expect(input).toHaveValue('{"ordinary":1}')
})

test('clearing data resets visible and hidden drafts in other tabs without clearing preferences', async ({
  context,
  extensionId,
}) => {
  const visible = await openToolPage(context, extensionId, 'convert')
  await visible.getByPlaceholder('粘贴需要进行编解码的字符串').fill('old-draft')
  await expect
    .poll(() => stored(visible, 'tool_convert_srcText'))
    .toBe('old-draft')
  const hidden = await openToolPage(context, extensionId, 'convert')
  await expect(
    hidden.getByPlaceholder('粘贴需要进行编解码的字符串'),
  ).toHaveValue('old-draft')
  await selectTool(hidden, 'json')
  const settings = await openToolPage(context, extensionId, 'settings')
  await settings.evaluate(async () => {
    await chrome.storage.local.set({
      webSummaryConfig: { apiKey: 'test-only-key' },
      tool_qrcode_text: 'keep-me',
      tool_convert_options: 'keep-preference',
    })
    localStorage.setItem(
      'tool_convert_srcText',
      JSON.stringify('stale-fallback'),
    )
  })
  settings.on('dialog', (dialog) => dialog.accept())
  await settings
    .getByTestId('local-data-convert')
    .getByRole('button', { name: '清理', exact: true })
    .click()
  await expect(
    settings.getByRole('status').filter({ hasText: '本地内容已清理' }),
  ).toBeVisible()
  await expect(
    visible.getByPlaceholder('粘贴需要进行编解码的字符串'),
  ).toHaveValue('')
  await selectTool(hidden, 'convert')
  await expect(
    hidden.getByPlaceholder('粘贴需要进行编解码的字符串'),
  ).toHaveValue('')
  expect(await stored(settings, 'tool_convert_srcText')).toBeUndefined()
  expect(
    await settings.evaluate(() => localStorage.getItem('tool_convert_srcText')),
  ).toBeNull()
  expect(await stored(settings, 'webSummaryConfig')).toEqual({
    apiKey: 'test-only-key',
  })
  expect(await stored(settings, 'tool_qrcode_text')).toBe('keep-me')
  expect(await stored(settings, 'tool_convert_options')).toBe('keep-preference')
  await visible.getByPlaceholder('粘贴需要进行编解码的字符串').fill('new-draft')
  await expect
    .poll(() => stored(settings, 'tool_convert_srcText'))
    .toBe('new-draft')
})

test('text preview keeps a separate temporary workspace and restores its snapshot', async ({
  context,
  extensionId,
}) => {
  const page = await openToolPage(context, extensionId, 'text-preview')
  await fillTextPreview(page, '10.0.0.1')
  await expect
    .poll(() =>
      page.evaluate(() =>
        localStorage.getItem('qhelper.text-preview.workspace.v1'),
      ),
    )
    .toContain('10.0.0.1')
  await page.getByRole('button', { name: '开始临时处理' }).click()
  await fillTextPreview(page, '10.0.0.2')
  await page.getByRole('button', { name: '新建标签' }).click()
  await fillTextPreview(page, '10.0.0.3')
  await selectTool(page, 'json')
  await selectTool(page, 'text-preview')
  await expect(page.getByRole('tab')).toHaveCount(2)
  await expect(page.getByTestId('source-text-editor')).toContainText('10.0.0.3')
  expect(
    await page.evaluate(() =>
      localStorage.getItem('qhelper.text-preview.workspace.v1'),
    ),
  ).not.toContain('10.0.0.3')
  await page.getByRole('button', { name: '保存一份', exact: true }).click()
  await expect(
    page.getByText('已保存一份快照，当前编辑模式不变。'),
  ).toBeVisible()
  page.on('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: '结束临时处理' }).click()
  await expect(page.getByRole('tab')).toHaveCount(1)
  await expect(page.getByTestId('source-text-editor')).toContainText('10.0.0.1')
  await page
    .getByRole('button', { name: '已保存快照 (1)', exact: true })
    .click()
  await page.getByRole('button', { name: '恢复', exact: true }).click()
  await expect(page.getByRole('tab')).toHaveCount(2)
  await expect(page.getByTestId('source-text-editor')).toContainText('10.0.0.3')
})

test('text preview snapshots drop file authorization and cleanup leaves the file unchanged', async ({
  context,
  extensionId,
}) => {
  const page = await openToolPage(context, extensionId, 'text-preview')
  await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory()
    const handle = await root.getFileHandle('p1-fixture.txt', { create: true })
    const stream = await handle.createWritable()
    await stream.write('unchanged-file-content')
    await stream.close()
    Object.assign(window, { showOpenFilePicker: async () => [handle] })
  })
  await page.getByRole('button', { name: '开始临时处理' }).click()
  await page.getByRole('button', { name: '打开文件', exact: true }).click()
  await expect(page.getByTestId('source-text-editor')).toContainText(
    'unchanged-file-content',
  )
  await fillTextPreview(page, 'unsaved-temporary-edit')
  await page.getByRole('button', { name: '保存一份', exact: true }).click()
  await expect(
    page.getByText('已保存一份快照，当前编辑模式不变。'),
  ).toBeVisible()
  const snapshots = await stored(page, 'tool_text-preview_snapshots')
  expect(snapshots).toMatchObject([
    {
      values: {
        workspace: {
          tabs: expect.arrayContaining([
            expect.objectContaining({
              input: 'unsaved-temporary-edit',
              source: { kind: 'manual' },
            }),
          ]),
        },
      },
    },
  ])
  expect(JSON.stringify(snapshots)).not.toContain('local-file')
  page.on('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: '结束临时处理' }).click()
  await page
    .getByRole('button', { name: '已保存快照 (1)', exact: true })
    .click()
  await page.getByRole('button', { name: '恢复', exact: true }).click()
  await expect(page.getByTestId('source-text-editor')).toContainText(
    'unsaved-temporary-edit',
  )
  await page.getByRole('button', { name: '结束临时处理' }).click()
  const settings = await openToolPage(context, extensionId, 'settings')
  const row = settings.getByTestId('local-data-text-preview')
  await expect(row).toContainText('文件授权 0 个')
  // Open the same fixture in ordinary mode to create a persistent handle.
  await page.getByRole('button', { name: '打开文件', exact: true }).click()
  await expect(page.getByTestId('source-text-editor')).toContainText(
    'unchanged-file-content',
  )
  await settings.getByRole('button', { name: '刷新数据' }).click()
  await expect(row).toContainText('文件授权 1 个')
  settings.on('dialog', (dialog) => dialog.accept())
  await row.getByRole('button', { name: '清理', exact: true }).click()
  await expect(
    settings.getByRole('status').filter({ hasText: '本地内容已清理' }),
  ).toBeVisible()
  await expect(row).toContainText('文件授权 0 个')
  await expect(page.getByTestId('source-text-editor')).not.toContainText(
    'unchanged-file-content',
  )
  expect(
    await page.evaluate(async () => {
      const root = await navigator.storage.getDirectory()
      return (
        await (await root.getFileHandle('p1-fixture.txt')).getFile()
      ).text()
    }),
  ).toBe('unchanged-file-content')
  expect(await stored(settings, 'tool_text-preview_snapshots')).toBeUndefined()
})
