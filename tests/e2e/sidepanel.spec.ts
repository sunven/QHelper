import { test, expect } from '../support/fixtures'
import { sidepanelUrl } from '../support/helpers/extension'

test.describe('Extension Sidepanel', () => {
  test('loads the sidepanel UI shell', async ({ context, extensionId }) => {
    const page = await context.newPage()
    await page.goto(sidepanelUrl(extensionId))

    await expect(page.getByTestId('web-summary-panel')).toBeVisible()
    await expect(page.getByTestId('web-summary-config-toggle')).toBeVisible()
    await expect(page.getByTestId('web-summary-config-drawer')).toHaveAttribute('aria-hidden', 'true')

    await page.getByTestId('web-summary-config-toggle').click()

    await expect(page.getByTestId('web-summary-config-drawer')).toHaveAttribute('aria-hidden', 'false')
    await expect(page.getByTestId('web-summary-endpoint')).toBeVisible()
    await expect(page.getByTestId('web-summary-model')).toBeVisible()
    await expect(page.getByTestId('web-summary-api-key')).toBeVisible()

    await page.close()
  })
})
