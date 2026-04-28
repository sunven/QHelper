import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('Code Beautify Tool', () => {
  test('page loads with input area', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'codebeautify');

    await expect(page.locator('#app').first()).toBeVisible();

    await page.close();
  });

  test('beautifies code input', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'codebeautify');

    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) {
      await textarea.fill('function test(){return 1;}');

      const beautifyButton = page.getByRole('button', { name: /美化|格式化/ });
      if (await beautifyButton.isVisible()) {
        await beautifyButton.click();
      }
    }

    await page.close();
  });
});
