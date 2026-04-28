import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('Markdown Editor Tool', () => {
  test('page loads with editor area', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'markdown');

    await expect(page.locator('.tool-hero-title, h1').first()).toContainText('Markdown');

    await page.close();
  });
});
