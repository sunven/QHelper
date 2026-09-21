import { expect, test } from '../support/fixtures'
import { openToolPage } from '../support/helpers/extension'

test.describe('Syntax Formatter', () => {
  test('formats HTML on the merged page', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'formatter')
    const input = page.getByTestId('formatter-input')

    await expect(page.getByTestId('tool-workspace-navbar')).toContainText(
      '格式化',
    )
    await expect(page.getByTestId('formatter-language-html')).toBeVisible()
    await input.fill('<div><p>test</p></div>')
    await expect(page.getByTestId('formatter-output')).toContainText('<div>')
    await expect(page.getByTestId('formatter-output')).toContainText(
      '<p>test</p>',
    )

    await page.close()
  })

  test('keeps input when switching language', async ({
    context,
    extensionId,
  }) => {
    const page = await openToolPage(context, extensionId, 'formatter')
    const input = page.getByTestId('formatter-input')

    await input.fill('<root><name>Ada</name></root>')
    await page.getByTestId('formatter-language-xml').click()
    await expect(input).toHaveValue('<root><name>Ada</name></root>')
    await expect(page.getByText('XML 输入')).toBeVisible()

    await page.close()
  })

  test('redirects the HTML alias with language selected', async ({
    context,
    extensionId,
  }) => {
    const page = await openToolPage(context, extensionId, 'htmlformat')

    await expect(page).toHaveURL(/\/tools\/formatter\.html\?language=html/)
    await expect(page.getByTestId('formatter-language-html')).toBeVisible()

    await page.close()
  })

  test('redirects the XML alias with language selected', async ({
    context,
    extensionId,
  }) => {
    const page = await openToolPage(context, extensionId, 'xmlformatter')

    await expect(page).toHaveURL(/\/tools\/formatter\.html\?language=xml/)
    await expect(page.getByText('XML 输入')).toBeVisible()

    await page.close()
  })

  test('redirects the CSS alias with language selected', async ({
    context,
    extensionId,
  }) => {
    const page = await openToolPage(context, extensionId, 'csstool')

    await expect(page).toHaveURL(/\/tools\/formatter\.html\?language=css/)
    await expect(page.getByText('CSS 输入')).toBeVisible()

    await page.close()
  })
})
