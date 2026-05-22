import type { Page } from '@playwright/test'
import { expect, test } from '../support/fixtures'
import { openToolPage } from '../support/helpers/extension'

const WORKSPACE_KEY = 'qhelper.text-preview.workspace.v1'

async function fillSourceText(page: Page, value: string) {
  const editor = page.getByTestId('source-text-editor').locator('.cm-content')
  await editor.click()
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
  await page.keyboard.insertText(value)
}

test.describe('Text Preview privacy', () => {
  test('does not send pasted sentinel text in network requests', async ({
    context,
    extensionId,
  }) => {
    const sentinel = 'SENTINEL_NO_UPLOAD_9d2b3e7c'
    const seenPayloads: string[] = []
    const page = await openToolPage(context, extensionId, 'text-preview')
    await page.evaluate(() => {
      window.localStorage.clear()
      window.sessionStorage.clear()
    })
    await page.reload()

    page.on('request', (request) => {
      seenPayloads.push(request.url())
      seenPayloads.push(JSON.stringify(request.headers()))
      seenPayloads.push(request.postData() ?? '')
    })

    await fillSourceText(page, `token=${sentinel}`)
    await page.waitForTimeout(300)

    expect(seenPayloads.join('\n')).not.toContain(sentinel)

    await page.close()
  })

  test('stores pasted sentinel only in the allowed workspace key and clears it', async ({
    context,
    extensionId,
  }) => {
    const sentinel = 'SENTINEL_LOCAL_WORKSPACE_51e4b5'
    const page = await openToolPage(context, extensionId, 'text-preview')
    await page.evaluate(() => {
      window.localStorage.clear()
      window.sessionStorage.clear()
    })
    await page.reload()

    await fillSourceText(page, `password=${sentinel}`)

    const storageDump = await page.evaluate((allowedKey) => {
      const dumpStorage = (storage: Storage) =>
        Array.from({ length: storage.length }, (_, index) => {
          const key = storage.key(index) ?? ''
          return [key, storage.getItem(key)]
        })

      return {
        localStorage: dumpStorage(window.localStorage),
        sessionStorage: dumpStorage(window.sessionStorage),
        workspaceValue: window.localStorage.getItem(allowedKey),
      }
    }, WORKSPACE_KEY)

    expect(storageDump.workspaceValue).toContain(sentinel)
    expect(JSON.stringify(storageDump.sessionStorage)).not.toContain(sentinel)
    expect(
      JSON.stringify(
        storageDump.localStorage.filter(([key]) => key !== WORKSPACE_KEY),
      ),
    ).not.toContain(sentinel)

    const chromeStorageDump = await page.evaluate(
      () =>
        new Promise<unknown>((resolve) => {
          chrome.storage.local.get(null, resolve)
        }),
    )
    expect(JSON.stringify(chromeStorageDump)).not.toContain(sentinel)

    await page.getByRole('button', { name: '清空全部' }).click()

    const clearedStorageDump = await page.evaluate(() =>
      JSON.stringify({
        localStorage: Array.from(
          { length: window.localStorage.length },
          (_, index) => {
            const key = window.localStorage.key(index) ?? ''
            return [key, window.localStorage.getItem(key)]
          },
        ),
        sessionStorage: Array.from(
          { length: window.sessionStorage.length },
          (_, index) => {
            const key = window.sessionStorage.key(index) ?? ''
            return [key, window.sessionStorage.getItem(key)]
          },
        ),
      }),
    )

    expect(clearedStorageDump).not.toContain(sentinel)

    await page.close()
  })
})
