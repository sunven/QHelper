import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('SCSS Compiler Tool', () => {
  test('page renders without errors', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'scss');

    await expect(page.locator('#app')).toBeAttached({ timeout: 10000 });

    await page.close();
  });
});
