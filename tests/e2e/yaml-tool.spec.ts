import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('YAML Converter Tool', () => {
  test('page loads with mode selector', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'yaml');

    await expect(page.getByText(/YAML → JSON/)).toBeVisible();
    await expect(page.getByText(/JSON → YAML/)).toBeVisible();

    await page.close();
  });

  test('converts YAML to JSON', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'yaml');

    const textarea = page.locator('textarea').first();
    await textarea.fill('name: test\nage: 30');

    const output = page.locator('textarea[readonly]');
    await expect(output).not.toHaveValue('');

    const value = await output.inputValue();
    const parsed = JSON.parse(value);
    expect(parsed.name).toBe('test');
    expect(parsed.age).toBe(30);

    await page.close();
  });

  test('switches to JSON to YAML mode', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'yaml');

    await page.getByText(/JSON → YAML/).click();

    const placeholder = page.getByPlaceholder(/JSON/);
    await expect(placeholder).toBeVisible();

    await page.close();
  });

  test('shows error for invalid YAML', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'yaml');

    const textarea = page.locator('textarea').first();
    await textarea.fill(':\n  bad yaml: [unclosed');

    await expect(page.getByText(/error/i).or(page.locator('.text-destructive'))).toBeVisible();

    await page.close();
  });

  test('loads sample data', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'yaml');

    await page.getByRole('button', { name: /示例/ }).click();

    const textarea = page.locator('textarea').first();
    const value = await textarea.inputValue();
    expect(value.length).toBeGreaterThan(0);

    await page.close();
  });
});
