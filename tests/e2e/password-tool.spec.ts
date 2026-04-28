import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('Password Generator Tool', () => {
  test('page loads and generates a password automatically', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'password');

    const passwordInput = page.locator('input[readonly]').first();
    await expect(passwordInput).not.toHaveValue('');

    await page.close();
  });

  test('generated password has correct default length', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'password');

    const passwordInput = page.locator('input[readonly]').first();
    await expect(passwordInput).not.toHaveValue('');

    const value = await passwordInput.inputValue();
    expect(value.length).toBe(16);

    await page.close();
  });

  test('regenerates password on refresh click', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'password');

    const passwordInput = page.locator('input[readonly]').first();
    const firstPassword = await passwordInput.inputValue();

    await page.getByRole('button').filter({ has: page.locator('svg.lucide-refresh-cw') }).click();

    const secondPassword = await passwordInput.inputValue();
    expect(secondPassword).not.toBe(firstPassword);

    await page.close();
  });

  test('shows strength indicator', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'password');

    await expect(page.getByText(/强/)).toBeVisible();

    await page.close();
  });

  test('shows password length label', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'password');

    await expect(page.getByText('16 位')).toBeVisible();

    await page.close();
  });

  test('toggling options regenerates password', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'password');

    const passwordInput = page.locator('input[readonly]').first();
    const firstPassword = await passwordInput.inputValue();

    await page.getByRole('checkbox', { name: /特殊符号/ }).uncheck();

    const secondPassword = await passwordInput.inputValue();
    expect(secondPassword).not.toBe(firstPassword);

    await page.close();
  });

  test('password contains only lowercase when only lowercase is checked', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'password');

    await page.getByRole('checkbox', { name: /大写字母/ }).uncheck();
    await page.getByRole('checkbox', { name: /数字/ }).uncheck();
    await page.getByRole('checkbox', { name: /特殊符号/ }).uncheck();

    const passwordInput = page.locator('input[readonly]').first();
    const value = await passwordInput.inputValue();
    expect(/^[a-z]+$/.test(value)).toBe(true);

    await page.close();
  });

  test('shows configuration section', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'password');

    await expect(page.getByText(/密码长度/)).toBeVisible();
    await expect(page.getByText(/字符类型/)).toBeVisible();
    await expect(page.getByText(/排除字符/)).toBeVisible();

    await page.close();
  });
});
