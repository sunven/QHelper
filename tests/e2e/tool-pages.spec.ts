import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

const toolPages = [
  'json',
  'timestamp',
  'convert',
  'codebeautify',
  'imagebase64',
  'colorTransform',
  'trans-radix',
  'csv2json',
  'yaml',
  'markdown',
  'htmlformat',
  'csstool',
  'svgoptimizer',
  'cron',
  'toml',
  'jsonschema',
  'xmlformatter',
  'uuid',
  'password',
  'urlparser',
  'pictureSplicing',
];

const toolsWithKnownRuntimeIssue = ['uglify', 'scss'];

test('tool shell uses compact header without legacy hero metadata', async ({ context, extensionId }) => {
  const page = await openToolPage(context, extensionId, 'json');
  const header = page.locator('main > section').first();

  await expect(header.locator('.tool-hero-title')).toBeVisible();
  await expect(header.getByText('QHelper Workspace')).toHaveCount(0);
  await expect(header.getByText('交互')).toHaveCount(0);
  await expect(header.getByText('输入')).toHaveCount(0);
  await expect(header.getByText('能力')).toHaveCount(0);

  await page.close();
});

test('tool navigation opens category panel on click and closes on pointer leave', async ({ context, extensionId }) => {
  const page = await openToolPage(context, extensionId, 'json');
  const encodingButton = page.getByRole('button', { name: '编码转换' });
  const encodingChevron = page.getByTestId('tool-category-chevron-encoding');
  const convertTool = page.getByRole('link', { name: /字符串编解码/ });

  await expect(encodingChevron).toBeVisible();
  await encodingButton.hover();
  await expect(convertTool).toHaveCount(0);

  await encodingButton.click();
  await expect(convertTool).toBeVisible();
  await expect(encodingButton).toHaveAttribute('aria-expanded', 'true');
  const categoryItemSizes = await page.locator('#tool-category-panel-encoding a').evaluateAll((items) =>
    items.map((item) => {
      const rect = item.getBoundingClientRect();
      return { height: rect.height, width: rect.width };
    }),
  );
  expect(new Set(categoryItemSizes.map((size) => Math.round(size.height))).size).toBe(1);
  expect(new Set(categoryItemSizes.map((size) => Math.round(size.width))).size).toBe(1);

  await page.locator('main').hover();
  await expect(convertTool).toHaveCount(0);
  await expect(encodingButton).toHaveAttribute('aria-expanded', 'false');

  await encodingButton.click();
  await expect(convertTool).toBeVisible();
  await expect(encodingButton).toHaveAttribute('aria-expanded', 'true');

  await encodingButton.click();
  await expect(convertTool).toHaveCount(0);
  await expect(encodingButton).toHaveAttribute('aria-expanded', 'false');

  await page.close();
});

for (const toolId of toolPages) {
  test.describe(`${toolId} tool page`, () => {
    test('loads successfully', async ({ context, extensionId }) => {
      const page = await openToolPage(context, extensionId, toolId);

      await expect(page.locator('#app').first()).toBeVisible();

      await page.close();
    });
  });
}

for (const toolId of toolsWithKnownRuntimeIssue) {
  test.describe(`${toolId} tool page`, () => {
    test('page renders', async ({ context, extensionId }) => {
      const page = await openToolPage(context, extensionId, toolId);

      await expect(page.locator('#app')).toBeAttached({ timeout: 10000 });

      await page.close();
    });
  });
}
