import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('Picture Splicing Tool', () => {
  test('page loads successfully', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'pictureSplicing');

    await expect(page.locator('h1').filter({ hasText: '图片拼接' })).toBeVisible();

    await page.close();
  });
});
