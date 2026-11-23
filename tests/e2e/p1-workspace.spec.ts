import { expect, test } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test('popup search and favorites are shared with the sidebar', async ({
  context,
  popupPage,
}) => {
  const search = popupPage.getByRole('textbox', { name: '搜索工具' });
  await search.fill('uuid');
  const result = popupPage.getByTestId('discovery-search-uuid');
  const favorite = result.locator('..').getByRole('button', { name: /^收藏/ });
  await favorite.click();
  await expect(
    result.locator('..').getByRole('button', { name: /^取消收藏/ }),
  ).toHaveAttribute('aria-pressed', 'true');
  await search.fill('trans-radix');
  const newPage = context.waitForEvent('page');
  await search.press('Enter');
  const page = await newPage;
  await expect(page).toHaveURL(/\/tools\/trans-radix\.html$/);
  await expect(page.getByTestId('discovery-favorites-uuid')).toBeVisible();
  await popupPage.reload();
  await expect(popupPage.getByTestId('discovery-favorites-uuid')).toBeVisible();
  await page.getByRole('textbox', { name: '搜索工具' }).fill('no-such-tool');
  await expect(page.getByText('没有找到匹配的工具。')).toBeVisible();
})

test('removed 数据格式 tools are absent from discovery', async ({
  context,
  extensionId,
  popupPage,
}) => {
  const page = await openToolPage(context, extensionId, 'uuid');
  for (const view of [popupPage, page]) {
    await expect(view.getByText('数据格式', { exact: true })).toHaveCount(0);
    const search = view.getByRole('textbox', { name: '搜索工具' });
    for (const id of ['cron', 'csv2json', 'yaml', 'toml', 'jsonschema']) {
      await search.fill(id);
      await expect(view.getByText('没有找到匹配的工具。')).toBeVisible();
      await expect(view.getByTestId(`discovery-search-${id}`)).toHaveCount(0);
    }
    await search.press('Escape');
  }

  await page.close();
})