import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('CSV to JSON Tool', () => {
  test('page loads with CSV input area', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'csv2json');

    await expect(page.locator('h1').filter({ hasText: 'CSV' })).toBeVisible();

    await page.close();
  });

  test('converts CSV to JSON with headers', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'csv2json');

    await page.locator('main textarea').first().fill('name,age\nAlice,30\nBob,25');
    await page.locator('main button').filter({ hasText: '转换', exact: true }).click();

    const output = page.locator('main textarea[readonly]');
    const value = await output.inputValue();
    const parsed = JSON.parse(value);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].name).toBe('Alice');

    await page.close();
  });

  test('loads sample data', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'csv2json');

    await page.locator('main button').filter({ hasText: '示例' }).click();

    const input = page.locator('main textarea').first();
    const value = await input.inputValue();
    expect(value).toContain('name');
    expect(value).toContain('age');

    await page.close();
  });

  test('clears input and output', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'csv2json');

    await page.locator('main textarea').first().fill('a,b\n1,2');
    await page.locator('main button').filter({ hasText: '清空' }).click();

    const input = page.locator('main textarea').first();
    await expect(input).toHaveValue('');

    await page.close();
  });
});
