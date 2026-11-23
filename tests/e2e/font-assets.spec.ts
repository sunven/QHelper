import { expect, test } from '../support/fixtures'

test('extension pages load JetBrains Mono font assets without missing-resource errors', async ({
  context,
  extensionId,
}) => {
  const pagePaths = [
    'popup.html',
    'tools/settings.html',
    'bookmarks.html',
    'sidepanel.html',
    'json-string-panel.html',
  ]
  const fontFailures: string[] = []

  for (const pagePath of pagePaths) {
    const page = await context.newPage()

    page.on('requestfailed', (request) => {
      if (request.url().includes('jetbrains-mono')) {
        fontFailures.push(
          `${request.url()} ${request.failure()?.errorText ?? ''}`,
        )
      }
    })
    page.on('response', (response) => {
      if (
        response.url().includes('jetbrains-mono') &&
        response.status() >= 400
      ) {
        fontFailures.push(`${response.url()} HTTP ${response.status()}`)
      }
    })

    await page.goto(`chrome-extension://${extensionId}/${pagePath}`)
    const fontLoaded = await page.evaluate(async () => {
      try {
        const faces = await document.fonts.load(
          '16px "JetBrains Mono Variable"',
        )
        await document.fonts.ready
        return faces.length > 0
      } catch {
        return false
      }
    })
    if (!fontLoaded) {
      fontFailures.push(`${pagePath} JetBrains Mono was not loaded`)
    }
    await page.close()
  }

  expect(fontFailures).toEqual([])
})
