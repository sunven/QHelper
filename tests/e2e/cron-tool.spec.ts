import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('Cron Parser Tool', () => {
  test('page loads with default expression', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'cron');

    await expect(page.locator('.tool-hero-title, h1').first()).toContainText('Cron');

    await page.close();
  });

  test('parses valid cron expression and shows next runs', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'cron');

    const input = page.locator('input[type="text"]').first();
    await input.clear();
    await input.fill('0 0 * * *');

    await expect(page.getByText(/下次运行/)).toBeVisible({ timeout: 15000 });

    await page.close();
  });

  test('shows error indicator for invalid cron', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'cron');

    const input = page.locator('input[type="text"]').first();
    await input.clear();
    await input.fill('invalid-cron-xyz!!!');

    const borderInput = page.locator('input[class*="border-red"]');
    await expect(borderInput).toBeVisible({ timeout: 5000 });

    await page.close();
  });

  test('applies preset expression', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'cron');

    await page.locator('button').filter({ hasText: '每分钟' }).click();

    const input = page.locator('input[type="text"]').first();
    await expect(input).toHaveValue('* * * * *');

    await page.close();
  });

  test('has presets section', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'cron');

    await expect(page.locator('button').filter({ hasText: '每分钟' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: '每小时' })).toBeVisible();

    await page.close();
  });
});
