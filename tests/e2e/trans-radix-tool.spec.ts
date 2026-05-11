import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('Trans Radix Tool', () => {
  test('page loads with conversion interface', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'trans-radix');

    await expect(page.locator('#tool-page-title-trans-radix')).toContainText('进制转换');

    await page.close();
  });

  test('has input fields and conversion buttons', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'trans-radix');

    const radios = page.locator('input[type="radio"]');
    const count = await radios.count();
    expect(count).toBeGreaterThanOrEqual(4);

    const buttons = page.locator('button').filter({ hasText: '' });
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(2);

    await page.close();
  });
});
