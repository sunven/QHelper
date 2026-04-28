import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('Convert Tool', () => {
  test('page loads with input area', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'convert');

    await expect(page.locator('main textarea').first()).toBeVisible();

    await page.close();
  });

  test('HTML escapes special characters', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'convert');

    await page.locator('main textarea').first().fill('<div>hello & "world"</div>');
    await page.locator('main button').filter({ hasText: 'HTML转义' }).click();

    const result = page.locator('main textarea').last();
    const value = await result.inputValue();
    expect(value).toContain('&lt;div&gt;');
    expect(value).toContain('&amp;');

    await page.close();
  });

  test('HTML unescapes entities', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'convert');

    await page.locator('main textarea').first().fill('&lt;div&gt;hello&lt;/div&gt;');
    await page.locator('main button').filter({ hasText: 'HTML反转义' }).click();

    const result = page.locator('main textarea').last();
    const value = await result.inputValue();
    expect(value).toContain('<div>hello</div>');

    await page.close();
  });

  test('URL encodes text', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'convert');

    await page.locator('main textarea').first().fill('hello world');
    await page.locator('main button').filter({ hasText: 'URL编码' }).click();

    const result = page.locator('main textarea').last();
    await expect(result).toHaveValue('hello%20world');

    await page.close();
  });

  test('URL decodes text', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'convert');

    await page.locator('main textarea').first().fill('hello%20world');
    await page.locator('main button').filter({ hasText: 'URL解码' }).click();

    const result = page.locator('main textarea').last();
    await expect(result).toHaveValue('hello world');

    await page.close();
  });

  test('Base64 encodes text', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'convert');

    await page.locator('main textarea').first().fill('hello');
    await page.locator('main button').filter({ hasText: 'Base64编码' }).click();

    const result = page.locator('main textarea').last();
    await expect(result).toHaveValue('aGVsbG8=');

    await page.close();
  });

  test('Base64 decodes text', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'convert');

    await page.locator('main textarea').first().fill('aGVsbG8=');
    await page.locator('main button').filter({ hasText: 'Base64解码' }).click();

    const result = page.locator('main textarea').last();
    await expect(result).toHaveValue('hello');

    await page.close();
  });

  test('Base64 decode shows error for invalid input', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'convert');

    await page.locator('main textarea').first().fill('!!!invalid-base64!!!');
    await page.locator('main button').filter({ hasText: 'Base64解码' }).click();

    const result = page.locator('main textarea').last();
    const value = await result.inputValue();
    expect(value).toContain('Base64');

    await page.close();
  });

  test('MD5 encodes text', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'convert');

    await page.locator('main textarea').first().fill('hello');
    await page.locator('main button').filter({ hasText: 'MD5编码' }).click();

    const result = page.locator('main textarea').last();
    await expect(result).toHaveValue('5d41402abc4b2a76b9719d911017c592');

    await page.close();
  });

  test('Unicode decodes text', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'convert');

    await page.locator('main textarea').first().fill('\\u0041\\u0042');
    await page.locator('main button').filter({ hasText: 'Unicode解码' }).click();

    const result = page.locator('main textarea').last();
    await expect(result).toHaveValue('AB');

    await page.close();
  });
});
