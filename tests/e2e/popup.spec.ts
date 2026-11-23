import { test, expect } from '../support/fixtures';
import { toolUrl } from '../support/helpers/extension';
import { PopupPage } from '../support/page-objects/popup.page';

test.describe('Extension Popup', () => {
  test('opens and displays tool buttons', async ({ popupPage }) => {
    const popup = new PopupPage(popupPage);

    await expect(popup.getToolButton('trans-radix')).toBeVisible();
    await expect(popup.getToolButton('qrcode')).toBeVisible();
    await expect(popup.getToolButton('web-summary-launch')).toBeVisible();
    await expect(popup.getToolButton('clear-site-data')).toBeVisible();
  });

  test('shows each complete tool name at popup width', async ({ popupPage }) => {
    await popupPage.setViewportSize({ width: 520, height: 600 });
    const tools = popupPage.getByRole('navigation', { name: '工具目录' }).getByRole('button');
    await expect(tools.first()).toBeVisible();
    await popupPage.evaluate(() => document.fonts.ready);
    const clipped = await tools.evaluateAll((buttons) => buttons.flatMap((button) => {
      const text = document.createTreeWalker(button, NodeFilter.SHOW_TEXT).nextNode();
      if (!text) return [button.getAttribute('aria-label')];
      const range = document.createRange();
      range.selectNodeContents(text);
      const label = range.getBoundingClientRect();
      const bounds = button.getBoundingClientRect();
      return label.left < bounds.left || label.right > Math.min(bounds.right, document.documentElement.clientWidth)
        ? [text.textContent] : [];
    }));
    expect(clipped).toEqual([]);
  });

  test('clicking trans-radix tool opens new tab', async ({ popupPage, extensionId }) => {
    const popup = new PopupPage(popupPage);

    const toolPage = await popup.clickTool('trans-radix');

    await expect(toolPage).toHaveURL(toolUrl(extensionId, 'trans-radix'));
    await toolPage.close();
  });

  test('clicking password tool opens new tab', async ({ popupPage, extensionId }) => {
    const popup = new PopupPage(popupPage);

    const toolPage = await popup.clickTool('password');

    await expect(toolPage).toHaveURL(toolUrl(extensionId, 'password'));
    await toolPage.close();
  });

  test('clicking settings icon opens settings page', async ({ popupPage, extensionId }) => {
    const [settingsPage] = await Promise.all([
      popupPage.context().waitForEvent('page'),
      popupPage.getByTestId('popup-settings-link').click(),
    ]);

    await expect(settingsPage).toHaveURL(toolUrl(extensionId, 'settings'));
    await expect(settingsPage.getByTestId('tool-workspace-navbar')).toContainText(
      '设置',
    );
    await settingsPage.close();
  });

  test('clicking clear-site-data opens the site data cleaner', async ({
    popupPage,
    extensionId,
  }) => {
    const popup = new PopupPage(popupPage);

    const toolPage = await popup.clickTool('clear-site-data');

    await expect(toolPage).toHaveURL(toolUrl(extensionId, 'clear-site-data'));
    await expect(toolPage.getByTestId('tool-workspace-navbar')).toContainText(
      '清除站点数据',
    );
    await expect(
      toolPage.getByTestId('clear-site-data-target-all'),
    ).toBeChecked();
    await expect(
      toolPage.getByTestId('clear-site-data-target-current'),
    ).toBeDisabled();
    await toolPage.close();
  });
});
