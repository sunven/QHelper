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

test('popup search and favorites are shared with the sidebar', async ({
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
  await search.fill('convert')
  const newPage = context.waitForEvent('page')
  await search.press('Enter')
  const page = await newPage
  await expect(page).toHaveURL(/\/tools\/convert\.html$/)
  await expect(page.getByTestId('discovery-favorites-json')).toBeVisible()
  await popupPage.reload()
  await expect(popupPage.getByTestId('discovery-favorites-json')).toBeVisible()
  await page.getByRole('textbox', { name: '搜索工具' }).fill('no-such-tool')
  await expect(page.getByText('没有找到匹配的工具。')).toBeVisible()
})

test('removed 数据格式 tools are absent from discovery', async ({
  context,
  extensionId,
  popupPage,
}) => {
  const page = await openToolPage(context, extensionId, 'json')
  for (const view of [popupPage, page]) {
    await expect(view.getByText('数据格式', { exact: true })).toHaveCount(0)
    const search = view.getByRole('textbox', { name: '搜索工具' })
    for (const id of ['cron', 'csv2json', 'yaml', 'toml', 'jsonschema']) {
      await search.fill(id)
      await expect(view.getByText('没有找到匹配的工具。')).toBeVisible()
      await expect(view.getByTestId(`discovery-search-${id}`)).toHaveCount(0)
    }
    await search.press('Escape')
  }

  await page.close()
})

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
  await selectTool(page, 'convert')
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
