import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('Timestamp Converter Tool', () => {
  test('page loads and shows tool title', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'timestamp');

    await expect(page.locator('.tool-hero-title, h1').first()).toContainText('时间戳');

    await page.close();
  });

  test('displays current time values', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'timestamp');

    const disabledInputs = page.locator('input[disabled]');
    const count = await disabledInputs.count();
    expect(count).toBeGreaterThanOrEqual(2);

    const timeValue = await disabledInputs.first().inputValue();
    expect(timeValue).toMatch(/\d{4}/);

    await page.close();
  });

  test('shows conversion sections', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'timestamp');

    const buttons = page.locator('button').filter({ hasText: '转换' });
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(2);

    await page.close();
  });
});
