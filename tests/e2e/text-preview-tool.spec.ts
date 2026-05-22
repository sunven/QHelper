import type { Page } from '@playwright/test'
import { expect, test } from '../support/fixtures'
import { openToolPage } from '../support/helpers/extension'

async function fillSourceText(page: Page, value: string) {
  const editor = page.getByTestId('source-text-editor').locator('.cm-content')
  await editor.click()
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
  await page.keyboard.insertText(value)
}

async function expectSourceText(page: Page, value: string) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const content = document.querySelector(
          '[data-testid="source-text-editor"] .cm-content',
        )
        if (content?.querySelector('.cm-placeholder')) {
          return ''
        }
        return content?.textContent ?? ''
      }),
    )
    .toBe(value)
}

async function openTextPreview(context: Parameters<typeof openToolPage>[0], extensionId: string) {
  const page = await openToolPage(context, extensionId, 'text-preview')
  await page.evaluate(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })
  await page.reload()
  return page
}

test.describe('Text Preview Tool', () => {
  test('fills sample and shows copyable results', async ({ context, extensionId }) => {
    const page = await openTextPreview(context, extensionId)

    await page.getByRole('button', { name: '填入示例' }).click()

    const results = page.getByLabel('提取结果')
    await expect(results.getByText('192.168.80.45', { exact: true })).toBeVisible()
    await expect(
      results.getByText('ls -l $(which kubectl)', { exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: '复制 192.168.80.45' })).toBeVisible()
    await expect(page.getByRole('button', { name: '复制全部对象' })).toBeVisible()
    await expect(results.getByRole('heading', { name: 'IP 地址' })).toBeVisible()
    await expect(results.getByRole('heading', { name: '命令' })).toBeVisible()

    await page.close()
  })

  test('keeps tab workspaces isolated and restores after refresh', async ({
    context,
    extensionId,
  }) => {
    const page = await openTextPreview(context, extensionId)

    await fillSourceText(page, '10.10.0.1')
    await page.getByRole('button', { name: '重命名 未命名 1' }).click()
    await page.getByLabel('重命名 未命名 1').fill('项目 A')
    await page.keyboard.press('Enter')

    await page.getByRole('button', { name: '新建标签' }).click()
    await fillSourceText(page, 'kubectl get pods')
    await page.getByRole('button', { name: '重命名 未命名 2' }).click()
    await page.getByLabel('重命名 未命名 2').fill('项目 B')
    await page.keyboard.press('Enter')

    await expect(page.getByRole('tab', { name: /项目 A，1 个对象/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: /项目 B，1 个对象/ })).toBeVisible()
    await expect(
      page.getByLabel('提取结果').getByText('kubectl get pods', { exact: true }),
    ).toBeVisible()

    await page.getByRole('tab', { name: /项目 A/ }).click()
    await expect(
      page.getByLabel('提取结果').getByText('10.10.0.1', { exact: true }),
    ).toBeVisible()

    await page.reload()
    await expect(page.getByRole('tab', { name: /项目 A，1 个对象/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: /项目 B，1 个对象/ })).toBeVisible()
    await expectSourceText(page, '10.10.0.1')

    await page.close()
  })

  test('clears saved workspace', async ({ context, extensionId }) => {
    const page = await openTextPreview(context, extensionId)

    await fillSourceText(page, '10.20.0.1')
    await page.getByRole('button', { name: '新建标签' }).click()
    await fillSourceText(page, 'curl https://example.invalid')

    await page.getByRole('button', { name: '清空全部' }).click()

    await expect(page.getByRole('tab', { name: /未命名 1，0 个对象/ })).toBeVisible()
    await expect(page.getByRole('tab')).toHaveCount(1)
    await expectSourceText(page, '')

    await page.reload()
    await expect(page.getByRole('tab', { name: /未命名 1，0 个对象/ })).toBeVisible()
    await expectSourceText(page, '')

    await page.close()
  })
})
