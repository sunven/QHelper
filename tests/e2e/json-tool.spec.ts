import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('JSON Formatter Tool', () => {
  test('page loads with input area', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'json');

    await expect(page.getByTestId('json-input')).toBeVisible();

    await page.close();
  });

  test('formats valid JSON automatically on input', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'json');
    const input = page.getByTestId('json-input');

    await input.fill('{"name":"test","value":1}');

    const result = page.locator('.react-json-view');
    await expect(result).toBeVisible();

    await page.close();
  });

  test('shows error for invalid JSON', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'json');
    const input = page.getByTestId('json-input');

    await input.fill('{ invalid }');

    await expect(page.getByText(/JSON 解析错误/)).toBeVisible();

    await page.close();
  });

  test('compresses valid JSON', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'json');
    const input = page.getByTestId('json-input');

    const prettyJson = `{
  "name": "test",
  "value": 1
}`;
    await input.fill(prettyJson);

    await page.getByRole('button', { name: /压缩/ }).click();

    const compressedArea = page.locator('textarea.read-only, textarea[readonly]').last();
    await expect(compressedArea).toHaveValue('{"name":"test","value":1}');

    await page.close();
  });

  test('beautifies JSON', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'json');
    const input = page.getByTestId('json-input');

    await input.fill('{"name":"test","value":1}');

    await page.getByRole('button', { name: /美化/ }).click();

    const result = page.locator('.react-json-view');
    await expect(result).toBeVisible();

    await page.close();
  });

  test('clears input and result', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'json');
    const input = page.getByTestId('json-input');

    await input.fill('{"test":1}');

    await page.getByRole('button', { name: /清空/ }).click();

    await expect(input).toHaveValue('');

    await page.close();
  });

  test('switches to diff mode', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'json');
    const input = page.getByTestId('json-input');

    await input.fill('{"a":1}');

    await page.getByRole('button', { name: /^Diff$/ }).click();

    await expect(page.getByPlaceholder(/新的 JSON/)).toBeVisible();

    await page.close();
  });

  test('performs diff between two JSON objects', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'json');
    const input = page.getByTestId('json-input');

    await input.fill('{"a":1,"b":2}');
    await page.getByRole('button', { name: /^Diff$/ }).click();

    const secondInput = page.getByPlaceholder(/新的 JSON/);
    await secondInput.fill('{"a":1,"b":3,"c":4}');

    await page.getByRole('button', { name: /执行 Diff/ }).click();

    await expect(page.getByText(/Diff 结果/)).toBeVisible();
    await expect(page.getByText(/变更/)).toBeVisible();

    await page.close();
  });

  test('shows no differences for identical JSON', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'json');
    const input = page.getByTestId('json-input');

    await input.fill('{"a":1}');
    await page.getByRole('button', { name: /^Diff$/ }).click();

    const secondInput = page.getByPlaceholder(/新的 JSON/);
    await secondInput.fill('{"a":1}');

    await page.getByRole('button', { name: /执行 Diff/ }).click();

    await expect(page.getByText(/没有发现差异/)).toBeVisible();

    await page.close();
  });

  test('shows error for nested invalid JSON', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'json');
    const input = page.getByTestId('json-input');

    await input.fill('{"a": [1, 2, }');

    await expect(page.getByText(/JSON 解析错误/)).toBeVisible();

    await page.close();
  });
});
