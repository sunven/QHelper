import { expect, test } from '../support/fixtures'
import { openToolPage, toolUrl } from '../support/helpers/extension'

const toolPages = [
  'trans-radix',
  'uuid',
  'password',
  'aes-gcm',
  'bcrypt-hash',
  'clear-site-data',
]

test('tool shell uses breadcrumb title without a duplicated body title', async ({
  context,
  extensionId,
}) => {
  const page = await openToolPage(context, extensionId, 'trans-radix')
  const pageView = page.locator('main .tool-page-view').first()

  await expect(page.getByTestId('tool-workspace-navbar')).toContainText(
    '进制转换',
  )
  await expect(pageView.locator('.tool-hero-title')).toHaveCount(0)
  await expect(page.locator('#tool-page-title-trans-radix')).toHaveClass(
    /sr-only/,
  )
  await expect(page.locator('#tool-page-title-trans-radix')).toHaveText(
    '进制转换',
  )

  await page.close()
})

test('tool navigation uses the left-side menu', async ({
  context,
  extensionId,
}) => {
  const page = await openToolPage(context, extensionId, 'trans-radix')
  const navbar = page.getByTestId('tool-workspace-navbar')
  const navigation = page.getByTestId('tool-side-navigation')
  const main = page.getByTestId('tool-page-main')
  const selectedTool = navigation.getByRole('menuitem', {
    name: /进制转换/,
  })

  await expect(navbar).toBeVisible()
  await expect(navbar).toContainText('QHelper Tools')
  await expect(navigation).toBeVisible()
  await expect(navigation.getByText('Tools')).toBeVisible()
  await expect(main).toBeVisible()
  await expect(navigation.getByText('常用')).toBeVisible()
  await expect(selectedTool).toBeVisible()
  await expect(selectedTool).toHaveAttribute('data-active', 'true')
  await expect(
    navigation.getByRole('menuitem', { name: /自动刷新/ }),
  ).toBeVisible()

  const boxes = await Promise.all([
    navbar.boundingBox(),
    navigation.boundingBox(),
    main.boundingBox(),
  ])
  expect(boxes[0]).not.toBeNull()
  expect(boxes[1]).not.toBeNull()
  expect(boxes[2]).not.toBeNull()
  expect(boxes[1]!.y).toBeGreaterThanOrEqual(boxes[0]!.y + boxes[0]!.height - 1)
  expect(boxes[1]!.x + boxes[1]!.width).toBeLessThanOrEqual(boxes[2]!.x + 1)
  const scrollMetrics = await page.evaluate(() => {
    const main = document.querySelector<HTMLElement>(
      '[data-testid="tool-page-main"]',
    )
    const navigationScroll = document.querySelector<HTMLElement>(
      '[data-testid="tool-side-navigation-scroll"]',
    )
    const spacer = document.createElement('div')
    spacer.style.height = '200vh'
    spacer.dataset.testOnly = 'main-scroll-spacer'
    main?.append(spacer)

    return {
      bodyClientHeight: document.documentElement.clientHeight,
      bodyScrollHeight: document.documentElement.scrollHeight,
      mainCanScroll: main ? main.scrollHeight > main.clientHeight : false,
      mainOverflowY: main ? getComputedStyle(main).overflowY : '',
      navigationOverflowY: navigationScroll
        ? getComputedStyle(navigationScroll).overflowY
        : '',
      pageOverflowY: getComputedStyle(
        document.querySelector<HTMLElement>('.tool-page-shell')!,
      ).overflowY,
    }
  })
  expect(scrollMetrics.bodyScrollHeight).toBeLessThanOrEqual(
    scrollMetrics.bodyClientHeight + 1,
  )
  expect(scrollMetrics.pageOverflowY).toBe('hidden')
  expect(scrollMetrics.mainOverflowY).toBe('auto')
  expect(['auto', 'visible']).toContain(scrollMetrics.navigationOverflowY)
  expect(scrollMetrics.mainCanScroll).toBe(true)
  await expect(page.getByTestId('tool-category-chevron-encoding')).toHaveCount(
    0,
  )

  await page.close()
})

test('tool navigation keeps form state inside the shared SPA', async ({
  context,
  extensionId,
}) => {
  const page = await openToolPage(context, extensionId, 'trans-radix')
  const input = page.getByPlaceholder('输入10进制数')

  await input.fill('255')
  await expect(input).toHaveValue('255')

  await page
    .getByTestId('tool-side-navigation')
    .getByRole('menuitem', { name: /自动刷新/ })
    .click()
  await expect(page).toHaveURL(toolUrl(extensionId, 'auto-refresh'))
  await expect(page.locator('#tool-page-title-auto-refresh')).toHaveText(
    '自动刷新',
  )

  await page
    .getByTestId('tool-side-navigation')
    .getByRole('menuitem', { name: /进制转换/ })
    .click()
  await expect(page).toHaveURL(toolUrl(extensionId, 'trans-radix'))
  await expect(input).toHaveValue('255')

  await page.close()
})

test('tool settings button opens the settings page', async ({
  context,
  extensionId,
}) => {
  const page = await openToolPage(context, extensionId, 'trans-radix')

  await page.getByTestId('tool-settings-link').click()

  await expect(page).toHaveURL(
    `chrome-extension://${extensionId}/tools/settings.html`,
  )
  await expect(page.getByTestId('tool-workspace-navbar')).toContainText('设置')
  await expect(
    page.getByRole('checkbox', { name: '启用字典划词翻译' }),
  ).toBeVisible()
  await expect(
    page.getByRole('checkbox', { name: '在 Google 搜索结果中显示 Open in' }),
  ).toBeChecked()

  await page.close()
})

for (const toolId of toolPages) {
  test.describe(`${toolId} tool page`, () => {
    test('loads successfully', async ({ context, extensionId }) => {
      const page = await openToolPage(context, extensionId, toolId)

      await expect(page.locator('#app').first()).toBeVisible()

      await page.close()
    })
  })
}
