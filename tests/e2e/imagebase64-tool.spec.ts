import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('Image Base64 Tool', () => {
  test('page loads successfully', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'imagebase64');

    await expect(page.locator('h1').filter({ hasText: 'Base64' })).toBeVisible();

    await page.close();
  });
});
