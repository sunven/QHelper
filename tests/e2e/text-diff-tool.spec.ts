import type { Page } from '@playwright/test'
import { expect, test } from '../support/fixtures'
import { openToolPage } from '../support/helpers/extension'

async function fillEditor(
  page: Page,
  side: 'original' | 'modified',
  value: string,
) {
  const editor = page.getByRole('textbox', {
    name: side === 'original' ? '原始文本' : '修改后文本',
  })
  await editor.click()
  await page.keyboard.press(
    process.platform === 'darwin' ? 'Meta+A' : 'Control+A',
  )
  await page.keyboard.insertText(value)
}

test('fills the available workspace height by default', async ({
  context,
  extensionId,
}) => {
  const page = await openToolPage(context, extensionId, 'text-diff')
  const main = page.getByTestId('tool-page-main')
  const editor = page.getByRole('textbox', { name: '原始文本' })
  const [mainBox, editorBox, paddingBottom] = await Promise.all([
    main.boundingBox(),
    editor.boundingBox(),
    main.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).paddingBottom),
    ),
  ])
  if (!mainBox || !editorBox) {
    throw new Error('Text Diff layout was not rendered')
  }
  const bottomGap =
    mainBox.y + mainBox.height - paddingBottom - editorBox.y - editorBox.height

  expect(Math.abs(bottomGap)).toBeLessThanOrEqual(2)
  await page.close()
})

test('compares, navigates, swaps, and clears text', async ({
  context,
  extensionId,
}) => {
  const page = await openToolPage(context, extensionId, 'text-diff')
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  const previous = page.getByRole('button', { name: '上一个差异' })
  const next = page.getByRole('button', { name: '下一个差异' })

  await expect(page.getByText('等待输入', { exact: true })).toBeVisible()
  await expect(previous).toBeDisabled()
  await expect(next).toBeDisabled()

  await fillEditor(page, 'original', 'alpha\nbeta')
  await fillEditor(page, 'modified', 'alpha\ngamma')
  await expect(page.getByText('存在差异', { exact: true })).toBeVisible()
  await expect(previous).toBeEnabled()
  await expect(next).toBeEnabled()
  await previous.click()
  await next.click()
  expect(pageErrors, 'after editing').toEqual([])

  await page.getByRole('button', { name: '交换文本' }).click()
  await expect(page.getByRole('textbox', { name: '原始文本' })).toContainText(
    'gamma',
  )
  await expect(page.getByRole('textbox', { name: '修改后文本' })).toContainText(
    'beta',
  )
  expect(pageErrors, 'after swapping').toEqual([])

  await page.getByRole('button', { name: '清空文本' }).click()
  await expect(page.getByText('等待输入', { exact: true })).toBeVisible()
  expect(pageErrors, 'after clearing').toEqual([])

  await page.close()
})
