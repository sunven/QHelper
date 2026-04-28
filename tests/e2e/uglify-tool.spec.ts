import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('Uglify Tool', () => {
  test('page renders without errors', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'uglify');

    await expect(page.locator('#app')).toBeAttached({ timeout: 10000 });

    await page.close();
  });
});
