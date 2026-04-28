import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('SVG Optimizer Tool', () => {
  test('page loads with input area', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'svgoptimizer');

    await expect(page.locator('#app').first()).toBeVisible();

    await page.close();
  });

  test('optimizes SVG input', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'svgoptimizer');

    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) {
      const svgInput = '<svg xmlns="http://www.w3.org/2000/svg"><g><!-- comment --><rect width="100" height="100"/></g></svg>';
      await textarea.fill(svgInput);

      const optimizeButton = page.getByRole('button', { name: /优化|压缩/ });
      if (await optimizeButton.isVisible()) {
        await optimizeButton.click();
      }
    }

    await page.close();
  });
});
