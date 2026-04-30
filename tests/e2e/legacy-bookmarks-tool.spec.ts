import { expect, test } from '../support/fixtures'

test.describe('Legacy bookmarks tool', () => {
  test('loads old bookmark table headers', async ({ context, extensionId }) => {
    const page = await context.newPage()
    await page.goto(`chrome-extension://${extensionId}/legacy-bookmarks.html`)

    for (const header of ['Title', 'URL', 'Date Added', 'Date Last Used', 'Date Group Modified']) {
      await expect(page.getByRole('columnheader', { name: header })).toBeVisible()
    }

    await page.close()
  })
})
