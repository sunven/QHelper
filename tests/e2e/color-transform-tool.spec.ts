import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('Color Transform Tool', () => {
  test('page loads successfully', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'colorTransform');

    await expect(page.locator('.tool-hero-title, h1').first()).toContainText('颜色转换');

    await page.close();
  });

  test('has RGB input fields', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'colorTransform');

    const rInputs = page.getByPlaceholder('R');
    await expect(rInputs.first()).toBeVisible();

    await page.close();
  });

  test('has color picker input', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'colorTransform');

    await expect(page.locator('input[type="color"]')).toBeVisible();

    await page.close();
  });

  test('has conversion buttons', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'colorTransform');

    const buttons = page.locator('button').filter({ hasText: '转换' });
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(2);

    await page.close();
  });
});
