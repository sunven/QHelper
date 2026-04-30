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

  test('keeps long bookmark tables fixed with internal scrolling', async ({ context, extensionId }) => {
    const page = await context.newPage()
    let testFolderId = ''

    await page.setViewportSize({ width: 900, height: 500 })
    await page.goto(`chrome-extension://${extensionId}/bookmarks.html`)

    try {
      testFolderId = await page.evaluate(async () => {
        const root = await chrome.bookmarks.getTree()
        const parentId = root[0]?.children?.[0]?.id

        if (!parentId) {
          throw new Error('No writable bookmarks parent found')
        }

        const folder = await chrome.bookmarks.create({
          parentId,
          title: 'QHelper fixed table test',
        })

        await Promise.all(
          Array.from({ length: 80 }, (_, index) =>
            chrome.bookmarks.create({
              parentId: folder.id,
              title: `Generated bookmark ${index + 1}`,
              url: `https://example.com/bookmark-${index + 1}`,
            }),
          ),
        )

        return folder.id
      })

      await page.reload()
      await expect(page.getByRole('columnheader', { name: 'Title' })).toBeVisible()

      const metrics = await page.locator('table').evaluate((table) => {
        const scroller = table.parentElement
        const thead = table.querySelector('thead')
        const scrollingElement = document.scrollingElement ?? document.documentElement

        if (!scroller || !thead) {
          throw new Error('Bookmarks table layout was not rendered')
        }

        return {
          documentOverflow: scrollingElement.scrollHeight - scrollingElement.clientHeight,
          tableOverflow: scroller.scrollHeight - scroller.clientHeight,
          headerPosition: getComputedStyle(thead).position,
        }
      })

      expect(metrics.documentOverflow).toBeLessThanOrEqual(1)
      expect(metrics.tableOverflow).toBeGreaterThan(0)
      expect(metrics.headerPosition).toBe('sticky')
    } finally {
      if (testFolderId) {
        await page.evaluate((folderId) => chrome.bookmarks.removeTree(folderId), testFolderId)
      }

      await page.close()
    }
  })
})
