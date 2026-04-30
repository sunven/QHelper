import { expect, test } from '../support/fixtures'

test.describe('Bookmarks tool', () => {
  test('loads bookmark table headers', async ({ context, extensionId }) => {
    const page = await context.newPage()
    await page.goto(`chrome-extension://${extensionId}/bookmarks.html`)

    for (const header of ['Title', 'URL', 'Date Added', 'Date Last Used', 'Date Group Modified']) {
      await expect(page.getByRole('columnheader', { name: header })).toBeVisible()
    }

    await page.close()
  })
})
