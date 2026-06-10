import { test, expect } from '../support/fixtures';
import { PopupPage } from '../support/page-objects/popup.page';

test.describe('Extension Popup', () => {
  test('opens and displays tool buttons', async ({ popupPage }) => {
    const popup = new PopupPage(popupPage);

    await expect(popup.getToolButton('json')).toBeVisible();
    await expect(popup.getToolButton('timestamp')).toBeVisible();
    await expect(popup.getToolButton('imagebase64')).toBeVisible();
    await expect(popup.getToolButton('web-summary-launch')).toBeVisible();
    await expect(popup.getToolButton('clear-cookie')).toBeVisible();
  });

  test('clicking JSON tool opens new tab', async ({ popupPage, extensionId }) => {
    const popup = new PopupPage(popupPage);

    const toolPage = await popup.clickTool('json');

    await expect(toolPage).toHaveURL(
      `chrome-extension://${extensionId}/tools/json.html`,
    );
    await toolPage.close();
  });

  test('clicking timestamp tool opens new tab', async ({ popupPage, extensionId }) => {
    const popup = new PopupPage(popupPage);

    const toolPage = await popup.clickTool('timestamp');

    await expect(toolPage).toHaveURL(
      `chrome-extension://${extensionId}/tools/timestamp.html`,
    );
    await toolPage.close();
  });

  test('clicking convert tool opens new tab', async ({ popupPage, extensionId }) => {
    const popup = new PopupPage(popupPage);

    const toolPage = await popup.clickTool('convert');

    await expect(toolPage).toHaveURL(
      `chrome-extension://${extensionId}/tools/convert.html`,
    );
    await toolPage.close();
  });

  test('clicking password tool opens new tab', async ({ popupPage, extensionId }) => {
    const popup = new PopupPage(popupPage);

    const toolPage = await popup.clickTool('password');

    await expect(toolPage).toHaveURL(
      `chrome-extension://${extensionId}/tools/password.html`,
    );
    await toolPage.close();
  });

  test('clicking settings icon opens settings page', async ({ popupPage, extensionId }) => {
    const [settingsPage] = await Promise.all([
      popupPage.context().waitForEvent('page'),
      popupPage.getByTestId('popup-settings-link').click(),
    ]);

    await expect(settingsPage).toHaveURL(
      `chrome-extension://${extensionId}/tools/settings.html`,
    );
    await expect(settingsPage.getByTestId('tool-workspace-navbar')).toContainText(
      '设置',
    );
    await settingsPage.close();
  });

  test('asks before running the clear cookie command', async ({ popupPage }) => {
    const popup = new PopupPage(popupPage);

    await popupPage.evaluate(() => {
      window.confirm = (message?: string) => {
        (
          window as Window & { __qhelperConfirmMessage?: string }
        ).__qhelperConfirmMessage = message ?? '';
        return false;
      };
    });

    await popup.getToolButton('clear-cookie').click();

    const confirmMessage = await popupPage.evaluate(
      () =>
        (window as Window & { __qhelperConfirmMessage?: string })
          .__qhelperConfirmMessage,
    );

    expect(confirmMessage).toContain('这会清除浏览器 Cookie');
  });
});
