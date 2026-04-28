import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('JSON Schema Validator Tool', () => {
  test('page loads successfully', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'jsonschema');

    await expect(page.locator('.tool-hero-title, h1').first()).toContainText('JSON Schema');

    await page.close();
  });

  test('has two textareas for data and schema', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'jsonschema');

    const textareas = page.locator('textarea');
    const count = await textareas.count();
    expect(count).toBeGreaterThanOrEqual(2);

    await page.close();
  });

  test('has toolbar buttons', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'jsonschema');

    await expect(page.locator('button').filter({ hasText: '格式化' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: '清空' })).toBeVisible();

    await page.close();
  });

  test('clears all fields', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'jsonschema');

    await page.locator('button').filter({ hasText: '清空' }).click();

    const textareas = page.locator('textarea');
    await expect(textareas.first()).toHaveValue('');
    await expect(textareas.nth(1)).toHaveValue('');

    await page.close();
  });
});
