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
  'scss',
  'uglify',
];

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

test('tool navigation uses the left-side antd menu', async ({ context, extensionId }) => {
  const page = await openToolPage(context, extensionId, 'json');
  const navigation = page.getByTestId('tool-side-navigation');
  const main = page.getByTestId('tool-page-main');
  const selectedJsonTool = navigation.getByRole('menuitem', { name: /JSON 格式化/ });

  await expect(navigation).toBeVisible();
  await expect(main).toBeVisible();
  await expect(navigation.getByRole('menuitem', { name: '常用' })).toBeVisible();
  await expect(selectedJsonTool).toBeVisible();
  await expect(selectedJsonTool).toHaveClass(/ant-menu-item-selected/);
  await expect(navigation.getByRole('menuitem', { name: /进制转换/ })).toBeVisible();

  const boxes = await Promise.all([navigation.boundingBox(), main.boundingBox()]);
  expect(boxes[0]).not.toBeNull();
  expect(boxes[1]).not.toBeNull();
  expect(boxes[0]!.x + boxes[0]!.width).toBeLessThanOrEqual(boxes[1]!.x + 1);
  const scrollMetrics = await page.evaluate(() => {
    const main = document.querySelector<HTMLElement>('[data-testid="tool-page-main"]');
    const navigationScroll = document.querySelector<HTMLElement>('[data-testid="tool-side-navigation-scroll"]');
    const spacer = document.createElement('div');
    spacer.style.height = '200vh';
    spacer.dataset.testOnly = 'main-scroll-spacer';
    main?.append(spacer);

    return {
      bodyClientHeight: document.documentElement.clientHeight,
      bodyScrollHeight: document.documentElement.scrollHeight,
      mainCanScroll: main ? main.scrollHeight > main.clientHeight : false,
      mainOverflowY: main ? getComputedStyle(main).overflowY : '',
      navigationOverflowY: navigationScroll ? getComputedStyle(navigationScroll).overflowY : '',
      pageOverflowY: getComputedStyle(document.querySelector<HTMLElement>('.tool-page-shell')!).overflowY,
    };
  });
  expect(scrollMetrics.bodyScrollHeight).toBeLessThanOrEqual(scrollMetrics.bodyClientHeight + 1);
  expect(scrollMetrics.pageOverflowY).toBe('hidden');
  expect(scrollMetrics.mainOverflowY).toBe('auto');
  expect(scrollMetrics.navigationOverflowY).toBe('auto');
  expect(scrollMetrics.mainCanScroll).toBe(true);
  await expect(page.getByTestId('tool-category-chevron-encoding')).toHaveCount(0);

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
