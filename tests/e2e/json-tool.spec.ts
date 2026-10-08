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

test('compares response fields, copies evidence and invalidates edited results', async ({
  context,
  extensionId,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const page = await openToolPage(context, extensionId, 'json')
  await page.getByRole('button', { name: 'Diff', exact: true }).click()
  const before = page.getByLabel('基准响应', { exact: true })
  const after = page.getByLabel('待比较响应', { exact: true })
  await before.fill('{"data":{"id":1,"name":"A"}}')
  await after.fill('{"data":{"id":"1","enabled":true}}')
  await after.press(
    process.platform === 'darwin' ? 'Meta+Enter' : 'Control+Enter',
  )
  const result = page.getByTestId('json-diff-result')
  await expect(result.getByText('类型变化 1', { exact: true })).toBeVisible()
  await expect(result.getByText('新增 1', { exact: true })).toBeVisible()
  await expect(result.getByText('删除 1', { exact: true })).toBeVisible()
  await expect(before).toBeVisible()
  await expect(after).toBeVisible()
  await page.getByRole('button', { name: '复制全部差异' }).click()
  await expect(
    page.getByRole('button', { name: '已复制', exact: true }),
  ).toBeVisible()
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toContain('基准响应 → 待比较响应')
  expect(copied).toContain('[类型变化] "data.id" (number → string): 1 → "1"')
  await after.fill('{}')
  await expect(result).toHaveCount(0)
  await after.fill('{invalid')
  await page.getByRole('button', { name: '执行 Diff' }).click()
  await expect(page.getByRole('alert')).toContainText('待比较响应 JSON 无效')
  await page.close()
})

test('stacks response inputs on a narrow viewport', async ({
  context,
  extensionId,
}) => {
  const page = await openToolPage(context, extensionId, 'json')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Diff', exact: true }).click()
  const before = page.getByLabel('基准响应', { exact: true })
  const after = page.getByLabel('待比较响应', { exact: true })
  const first = await before.boundingBox()
  const second = await after.boundingBox()
  if (!first || !second) throw new Error('Response inputs are not visible')
  expect(second.y).toBeGreaterThanOrEqual(first.y + first.height)
  expect(second.x + second.width).toBeLessThanOrEqual(390)
  await before.fill('{"value":null}')
  await after.fill('{"value":{}}')
  await page.getByRole('button', { name: '执行 Diff' }).click()
  await expect(
    page
      .getByTestId('json-diff-result')
      .getByText('类型变化 1', { exact: true }),
  ).toBeVisible()
  await page.close()
})

test('keeps both response inputs across navigation and restores a temporary snapshot', async ({
  context,
  extensionId,
}) => {
  const page = await openToolPage(context, extensionId, 'json')
  await page.getByRole('button', { name: 'Diff', exact: true }).click()
  await page
    .getByRole('textbox', { name: '基准响应', exact: true })
    .fill('{"ordinary":true}')
  await page
    .getByRole('textbox', { name: '待比较响应', exact: true })
    .fill('{"ordinary":false}')
  await page.getByRole('button', { name: '开始临时处理' }).click()
  await page.getByRole('button', { name: 'Diff', exact: true }).click()
  await page
    .getByRole('textbox', { name: '基准响应', exact: true })
    .fill('{"id":1}')
  await page
    .getByRole('textbox', { name: '待比较响应', exact: true })
    .fill('{"id":"1"}')
  const search = page.getByRole('textbox', { name: '搜索工具' })
  await search.fill('urlparser')
  await page.getByTestId('discovery-search-urlparser').click()
  await search.fill('json')
  await page.getByTestId('discovery-search-json').click()
  await search.press('Escape')
  await expect(
    page.getByRole('textbox', { name: '基准响应', exact: true }),
  ).toHaveValue('{"id":1}')
  await expect(
    page.getByRole('textbox', { name: '待比较响应', exact: true }),
  ).toHaveValue('{"id":"1"}')
  await page.getByRole('button', { name: '执行 Diff' }).click()
  await page.getByRole('button', { name: '保存一份', exact: true }).click()
  await expect(
    page.getByText('已保存一份快照，当前编辑模式不变。'),
  ).toBeVisible()
  page.on('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: '结束临时处理' }).click()
  await expect(
    page.getByRole('textbox', { name: '基准响应', exact: true }),
  ).toHaveValue('{"ordinary":true}')
  await expect(
    page.getByRole('textbox', { name: '待比较响应', exact: true }),
  ).toHaveValue('{"ordinary":false}')
  await page
    .getByRole('button', { name: '已保存快照 (1)', exact: true })
    .click()
  await page.getByRole('button', { name: '恢复', exact: true }).click()
  await expect(
    page.getByRole('textbox', { name: '基准响应', exact: true }),
  ).toHaveValue('{"id":1}')
  await expect(
    page.getByRole('textbox', { name: '待比较响应', exact: true }),
  ).toHaveValue('{"id":"1"}')
  await expect(page.getByTestId('json-diff-result')).toHaveCount(0)
  await page.getByRole('button', { name: '执行 Diff' }).click()
  await expect(
    page
      .getByTestId('json-diff-result')
      .getByText('类型变化 1', { exact: true }),
  ).toBeVisible()
  await page.reload()
  await expect(page.getByTestId('json-input')).toHaveValue('')
  await page.close()
})
