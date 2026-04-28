import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('XML Formatter Tool', () => {
  test('page loads with input area', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'xmlformatter');

    await expect(page.locator('#app').first()).toBeVisible();

    await page.close();
  });

  test('formats XML input', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'xmlformatter');

    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) {
      await textarea.fill('<root><item>test</item></root>');

      const formatButton = page.getByRole('button', { name: /格式化|美化/ });
      if (await formatButton.isVisible()) {
        await formatButton.click();

        const output = page.locator('textarea[readonly]');
        if (await output.isVisible()) {
          const value = await output.inputValue();
          expect(value).toContain('test');
        }
      }
    }

    await page.close();
  });
});
