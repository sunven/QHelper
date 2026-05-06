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

  test('filters bookmarks by title and URL while preserving folder context', async ({ context, extensionId }) => {
    const page = await context.newPage()
    let testFolderId = ''

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
          title: 'QHelper search regression folder',
        })

        await chrome.bookmarks.create({
          parentId: folder.id,
          title: 'QHelper Alpha Search Target',
          url: 'https://example.com/alpha-search-target',
        })

        await chrome.bookmarks.create({
          parentId: folder.id,
          title: 'QHelper Beta Bookmark',
          url: 'https://example.com/beta-url-target',
        })

        await chrome.bookmarks.create({
          parentId: folder.id,
          title: 'QHelper Unrelated Bookmark',
          url: 'https://example.com/unrelated',
        })

        return folder.id
      })

      await page.reload()

      const search = page.getByRole('searchbox', { name: 'Search bookmarks' })

      await search.fill('alpha search')
      await expect(page.getByText('QHelper search regression folder')).toBeVisible()
      await expect(page.getByText('QHelper Alpha Search Target')).toBeVisible()
      await expect(page.locator('mark').filter({ hasText: 'Alpha Search' })).toBeVisible()
      await expect(page.getByText('QHelper Beta Bookmark')).toHaveCount(0)
      await expect(page.getByText('QHelper Unrelated Bookmark')).toHaveCount(0)

      await search.fill('beta-url-target')
      await expect(page.getByText('QHelper search regression folder')).toBeVisible()
      await expect(page.getByText('QHelper Beta Bookmark')).toBeVisible()
      await expect(page.locator('mark').filter({ hasText: 'beta-url-target' })).toBeVisible()
      await expect(page.getByText('QHelper Alpha Search Target')).toHaveCount(0)
      await expect(page.getByText('QHelper Unrelated Bookmark')).toHaveCount(0)

      await search.fill('search regression folder')
      await expect(page.getByText('QHelper search regression folder')).toBeVisible()
      await expect(page.getByText('QHelper Alpha Search Target')).toHaveCount(0)
      await expect(page.getByText('QHelper Beta Bookmark')).toHaveCount(0)
      await expect(page.getByText('QHelper Unrelated Bookmark')).toHaveCount(0)

      await page.getByRole('button', { name: 'Clear bookmark search' }).click()
      await expect(search).toHaveValue('')
      await expect(page.locator('mark')).toHaveCount(0)
      await expect(page.getByText('QHelper Alpha Search Target')).toBeVisible()
      await expect(page.getByText('QHelper Beta Bookmark')).toBeVisible()
      await expect(page.getByText('QHelper Unrelated Bookmark')).toBeVisible()
    } finally {
      if (testFolderId) {
        await page.evaluate((folderId) => chrome.bookmarks.removeTree(folderId), testFolderId)
      }

      await page.close()
    }
  })

  test('copies bookmark titles and URLs from table cells', async ({ context, extensionId }) => {
    const page = await context.newPage()
    let testFolderId = ''
    const targetTitle = 'QHelper copy text target'
    const targetUrl = 'https://example.com/copy-bookmark-url'

    await page.goto(`chrome-extension://${extensionId}/bookmarks.html`)

    try {
      testFolderId = await page.evaluate(async ({ title, url }) => {
        const root = await chrome.bookmarks.getTree()
        const parentId = root[0]?.children?.[0]?.id

        if (!parentId) {
          throw new Error('No writable bookmarks parent found')
        }

        const folder = await chrome.bookmarks.create({
          parentId,
          title: 'QHelper copy URL folder',
        })

        await chrome.bookmarks.create({
          parentId: folder.id,
          title,
          url,
        })

        return folder.id
      }, { title: targetTitle, url: targetUrl })

      await page.reload()
      const copiedTexts: string[] = []
      await page.exposeFunction('captureCopiedBookmarkText', (value: string) => {
        copiedTexts.push(value)
      })
      await page.evaluate(() => {
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: {
            writeText: (value: string) =>
              (
                window as unknown as Window & {
                  captureCopiedBookmarkText: (copiedValue: string) => Promise<void>
                }
              ).captureCopiedBookmarkText(value),
          },
        })
      })

      await page
        .getByRole('button', { name: `Copy bookmark title ${targetTitle}` })
        .click()

      await expect(
        page.getByRole('button', { name: 'Bookmark title copied' }),
      ).toBeVisible()

      await page
        .getByRole('button', { name: `Copy bookmark URL ${targetUrl}` })
        .click()

      await expect(
        page.getByRole('button', { name: 'Bookmark URL copied' }),
      ).toBeVisible()
      await expect.poll(() => copiedTexts).toEqual([targetTitle, targetUrl])
    } finally {
      if (testFolderId) {
        await page.evaluate((folderId) => chrome.bookmarks.removeTree(folderId), testFolderId)
      }

      await page.close()
    }
  })

  test('expands and collapses all bookmark folders', async ({ context, extensionId }) => {
    const page = await context.newPage()
    let testFolderId = ''

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
          title: 'QHelper expand collapse folder',
        })

        await chrome.bookmarks.create({
          parentId: folder.id,
          title: 'QHelper expand collapse child',
          url: 'https://example.com/expand-collapse-child',
        })

        return folder.id
      })

      await page.reload()

      await expect(page.getByText('QHelper expand collapse child')).toBeVisible()

      await page.getByRole('button', { name: 'Collapse all bookmarks' }).click()
      await expect(page.getByText('QHelper expand collapse folder')).toBeVisible()
      await expect(page.getByText('QHelper expand collapse child')).toHaveCount(0)

      await page.getByRole('button', { name: 'Expand all bookmarks' }).click()
      await expect(page.getByText('QHelper expand collapse child')).toBeVisible()
    } finally {
      if (testFolderId) {
        await page.evaluate((folderId) => chrome.bookmarks.removeTree(folderId), testFolderId)
      }

      await page.close()
    }
  })

  test('checks visible bookmark URLs for dead links', async ({ context, extensionId }) => {
    const page = await context.newPage()
    let testFolderId = ''
    const targetUrl = 'https://example.com/qhelper-dead-link-check'

    await page.route(targetUrl, async (route) => {
      await route.fulfill({
        status: 404,
        body: 'missing',
      })
    })

    await page.goto(`chrome-extension://${extensionId}/bookmarks.html`)

    try {
      testFolderId = await page.evaluate(async (url) => {
        const root = await chrome.bookmarks.getTree()
        const parentId = root[0]?.children?.[0]?.id

        if (!parentId) {
          throw new Error('No writable bookmarks parent found')
        }

        const folder = await chrome.bookmarks.create({
          parentId,
          title: 'QHelper dead link check folder',
        })

        await chrome.bookmarks.create({
          parentId: folder.id,
          title: 'QHelper dead link check target',
          url,
        })

        return folder.id
      }, targetUrl)

      await page.reload()
      await page
        .getByRole('searchbox', { name: 'Search bookmarks' })
        .fill('dead link check target')
      await page.getByRole('button', { name: 'Check dead links' }).click()

      await expect(page.getByText('Broken 404')).toBeVisible()
      await expect(page.getByText('1 issues')).toBeVisible()
    } finally {
      if (testFolderId) {
        await page.evaluate((folderId) => chrome.bookmarks.removeTree(folderId), testFolderId)
      }

      await page.close()
    }
  })
})
