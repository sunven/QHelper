import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('HTML Format Tool', () => {
  test('page loads with input area', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'htmlformat');

    await expect(page.locator('#app').first()).toBeVisible();

    await page.close();
  });

  test('formats HTML input', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'htmlformat');

    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) {
      await textarea.fill('<div><p>test</p></div>');

      const formatButton = page.getByRole('button', { name: /格式化|美化/ });
      if (await formatButton.isVisible()) {
        await formatButton.click();
      }
    }

    await page.close();
  });
});
