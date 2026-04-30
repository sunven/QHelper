import { expect, test } from '../support/fixtures'
import { PopupPage } from '../support/page-objects/popup.page'

test.describe('Bookmarks popup placement', () => {
  test('shows bookmarks under other tools without Front Tools section', async ({ popupPage }) => {
    await expect(popupPage.getByLabel('Front Tools')).toHaveCount(0)

    await popupPage.getByRole('button', { name: /其他/ }).click()

    await expect(popupPage.getByTestId('tool-bookmarks')).toBeVisible()
    await expect(popupPage.getByTestId('tool-bookmarks')).toContainText('书签')
  })

  test('opens bookmarks from the other category', async ({ popupPage, extensionId }) => {
    const popup = new PopupPage(popupPage)

    await popupPage.getByRole('button', { name: /其他/ }).click()
    const page = await popup.clickTool('bookmarks')

    await expect(page).toHaveURL(`chrome-extension://${extensionId}/bookmarks.html`)
    await page.close()
  })
})
