import type { Page } from '@playwright/test'
import { expect, test } from '../support/fixtures'
import { openToolPage } from '../support/helpers/extension'

async function fillEditor(
  page: Page,
  side: 'original' | 'modified',
  value: string,
) {
  const index = side === 'original' ? 0 : 1
  await page.locator('.view-lines').nth(index).click()
  await page.keyboard.press(
    process.platform === 'darwin' ? 'Meta+A' : 'Control+A',
  )
  await page.keyboard.insertText(value)
}

test('compares, swaps, and clears text with Monaco', async ({
  context,
  extensionId,
}) => {
  const page = await openToolPage(context, extensionId, 'text-diff')
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await expect(page.getByText('等待输入', { exact: true })).toBeVisible()

  await fillEditor(page, 'original', 'alpha\nbeta')
  await fillEditor(page, 'modified', 'alpha\ngamma')
  await expect(page.getByText('存在差异', { exact: true })).toBeVisible()
  expect(pageErrors, 'after editing').toEqual([])

  await page.getByRole('button', { name: '交换文本' }).click()
  await expect(page.locator('.view-lines').nth(0)).toContainText('gamma')
  await expect(page.locator('.view-lines').nth(1)).toContainText('beta')
  expect(pageErrors, 'after swapping').toEqual([])

  await page.getByRole('button', { name: '清空文本' }).click()
  await expect(page.getByText('等待输入', { exact: true })).toBeVisible()
  expect(pageErrors, 'after clearing').toEqual([])

  await page.close()
})
