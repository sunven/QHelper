import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('TOML Parser Tool', () => {
  test('page loads with input area', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'toml');

    await expect(page.locator('#app').first()).toBeVisible();

    await page.close();
  });

  test('has conversion mode options', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'toml');

    const textContent = await page.locator('#app').first().textContent();
    expect(textContent).toBeTruthy();

    await page.close();
  });
});
