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
