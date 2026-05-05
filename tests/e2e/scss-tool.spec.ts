import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('SCSS Compiler Tool', () => {
  test('compiles SCSS without CSP runtime errors', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'scss');
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await expect(page.locator('#app')).toBeAttached({ timeout: 10000 });
    const output = page.locator('textarea').last();

    await expect(output).toHaveValue(/background: #3498db/);

    await page.locator('textarea').first().fill('$color: #123456; .box { color: $color; }');
    await expect(output).toHaveValue(/color: #123456/);
    expect(pageErrors).toEqual([]);

    await page.close();
  });
});
