import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('UUID Generator Tool', () => {
  test('page loads with generate button', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'uuid');

    await expect(page.locator('main button').filter({ hasText: '生成' })).toBeVisible();

    await page.close();
  });

  test('generates a UUID', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'uuid');

    await page.locator('main button').filter({ hasText: '生成' }).click();

    const codeElements = page.locator('main code');
    const uuidText = await codeElements.first().textContent();
    expect(uuidText).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    await page.close();
  });

  test('generates UUID without hyphens', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'uuid');

    await page.getByRole('checkbox', { name: /无连字符/ }).check();
    await page.locator('main button').filter({ hasText: '生成' }).click();

    const codeElements = page.locator('main code');
    const uuidText = await codeElements.first().textContent();
    expect(uuidText).toMatch(/^[0-9a-f]{32}$/i);
    expect(uuidText).not.toContain('-');

    await page.close();
  });

  test('generates UUID in uppercase', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'uuid');

    await page.getByRole('checkbox', { name: /大写/ }).check();
    await page.locator('main button').filter({ hasText: '生成' }).click();

    const codeElements = page.locator('main code');
    const uuidText = await codeElements.first().textContent();
    expect(uuidText).toMatch(/^[0-9A-F-]+$/);

    await page.close();
  });

  test('generates multiple UUIDs', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'uuid');

    const countInput = page.locator('main input[type="number"]');
    await countInput.fill('3');

    await page.locator('main button').filter({ hasText: '生成' }).click();

    const uuidRows = page.locator('main code').filter({ hasText: /^[0-9a-f]{8}/ });
    const count = await uuidRows.count();
    expect(count).toBe(3);

    await page.close();
  });

  test('clears generated UUIDs', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'uuid');

    await page.locator('main button').filter({ hasText: '生成' }).click();
    await page.locator('main button').filter({ hasText: '清空' }).click();

    const codeElements = page.locator('main code');
    const text = await codeElements.first().textContent();
    expect(text).toContain('点击生成按钮创建 UUID');

    await page.close();
  });
});
