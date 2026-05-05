import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('Uglify Tool', () => {
  test('compresses JavaScript without runtime import errors', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'uglify');
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await expect(page.locator('#app')).toBeAttached({ timeout: 10000 });
    await page.locator('main textarea').first().fill('function add(a, b) { return a + b; }');
    await page.getByRole('button', { name: /执行压缩/ }).click();

    const result = page.locator('main textarea').last();
    await expect(result).not.toHaveValue('');
    await expect(result).toHaveValue(/function/);
    expect(await result.inputValue()).not.toContain('return a + b');
    expect(pageErrors).toEqual([]);

    await page.close();
  });
});
