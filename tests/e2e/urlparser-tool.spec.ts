import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('URL Parser Tool', () => {
  test('page loads with URL input', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'urlparser');

    await expect(page.locator('h1').filter({ hasText: 'URL' })).toBeVisible();

    await page.close();
  });

  test('parses a complete URL and shows results', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'urlparser');

    await page.locator('main textarea').fill('https://example.com:8080/path?q=test#section');

    await expect(page.locator('main').getByText(/解析结果/)).toBeVisible();
    await expect(page.locator('main').getByText(/协议/)).toBeVisible();
    await expect(page.locator('main').getByText(/主机名/)).toBeVisible();

    await page.close();
  });

  test('displays query parameters section', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'urlparser');

    await page.locator('main textarea').fill('https://example.com?foo=bar&baz=qux');

    await expect(page.locator('main').getByText(/查询参数/)).toBeVisible();

    await page.close();
  });

  test('displays hash section', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'urlparser');

    await page.locator('main textarea').fill('https://example.com/page#section-1');

    await expect(page.locator('main').getByText(/哈希/)).toBeVisible();

    await page.close();
  });

  test('shows no results for invalid URL', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'urlparser');

    await page.locator('main textarea').fill('not-a-valid-url');

    await expect(page.locator('main').getByText(/解析结果/)).not.toBeVisible();

    await page.close();
  });
});
