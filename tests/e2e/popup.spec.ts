import { test, expect } from '../support/fixtures';
import { PopupPage } from '../support/page-objects/popup.page';

test.describe('Extension Popup', () => {
  test('opens and displays tool buttons', async ({ popupPage }) => {
    const popup = new PopupPage(popupPage);

    await expect(popupPage.getByTestId('web-summary-quick-open')).toBeVisible();
    await expect(popup.getToolButton('json')).toBeVisible();
    await expect(popup.getToolButton('timestamp')).toBeVisible();
    await expect(popup.getToolButton('imagebase64')).toBeVisible();
    await expect(popup.getToolButton('web-summary-launch')).toBeVisible();
  });

  test('clicking JSON tool opens new tab', async ({ popupPage, extensionId }) => {
    const popup = new PopupPage(popupPage);

    const toolPage = await popup.clickTool('json');

    await expect(toolPage).toHaveURL(
      new RegExp(`chrome-extension://${extensionId}/json`),
    );
    await toolPage.close();
  });

  test('clicking timestamp tool opens new tab', async ({ popupPage, extensionId }) => {
    const popup = new PopupPage(popupPage);

    const toolPage = await popup.clickTool('timestamp');

    await expect(toolPage).toHaveURL(
      new RegExp(`chrome-extension://${extensionId}/timestamp`),
    );
    await toolPage.close();
  });

  test('clicking convert tool opens new tab', async ({ popupPage, extensionId }) => {
    const popup = new PopupPage(popupPage);

    const toolPage = await popup.clickTool('convert');

    await expect(toolPage).toHaveURL(
      new RegExp(`chrome-extension://${extensionId}/convert`),
    );
    await toolPage.close();
  });

  test('clicking password tool opens new tab', async ({ popupPage, extensionId }) => {
    const popup = new PopupPage(popupPage);

    const toolPage = await popup.clickTool('password');

    await expect(toolPage).toHaveURL(
      new RegExp(`chrome-extension://${extensionId}/password`),
    );
    await toolPage.close();
  });
});
