import type { BrowserContext, Page } from '@playwright/test';

export function toolUrl(extensionId: string, toolName: string): string {
  return `chrome-extension://${extensionId}/${toolName}.html`;
}

export function popupUrl(extensionId: string): string {
  return `chrome-extension://${extensionId}/popup.html`;
}

export function sidepanelUrl(extensionId: string): string {
  return `chrome-extension://${extensionId}/sidepanel.html`;
}

export async function openToolPage(
  context: BrowserContext,
  extensionId: string,
  toolName: string,
): Promise<Page> {
  const page = await context.newPage();
  await page.goto(toolUrl(extensionId, toolName));
  return page;
}
