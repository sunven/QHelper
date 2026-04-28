import {
  chromium,
  type BrowserContext,
  test as base,
} from '@playwright/test';
import path from 'node:path';

const extensionPath = path.resolve(
  import.meta.dirname,
  '../../../.output/chrome-mv3',
);

export type ExtensionFixtures = {
  context: BrowserContext;
  extensionId: string;
  popupPage: import('@playwright/test').Page;
};

export const test = base.extend<ExtensionFixtures>({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    const sw =
      context.serviceWorkers()[0] ??
      (await context.waitForEvent('serviceworker'));
    const id = sw.url().split('/')[2]!;
    await use(id);
  },

  popupPage: async ({ context, extensionId }, use) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';
