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

    const textareas = page.locator('textarea');
    const svgInput = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g><!-- comment --><rect id="keep-me" width="100" height="100"/></g></svg>';
    await textareas.first().fill(svgInput);

    await expect(textareas.nth(1)).toHaveValue(/<svg/);
    await expect(textareas.nth(1)).toHaveValue(/viewBox="0 0 100 100"/);
    await expect(textareas.nth(1)).toHaveValue(/id="keep-me"/);
    await expect(textareas.nth(1)).not.toHaveValue(/comment/);

    await page.close();
  });
});
