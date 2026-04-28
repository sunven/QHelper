import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('CSS Tool', () => {
  test('page loads with input area', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'csstool');

    await expect(page.locator('#app').first()).toBeVisible();

    await page.close();
  });

  test('formats CSS input', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'csstool');

    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) {
      await textarea.fill('body{margin:0;padding:0}');

      const formatButton = page.getByRole('button', { name: /格式化|美化/ });
      if (await formatButton.isVisible()) {
        await formatButton.click();
      }
    }

    await page.close();
  });
});
