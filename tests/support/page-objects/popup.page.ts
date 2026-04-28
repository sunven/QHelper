import type { Locator, Page } from '@playwright/test';

export class PopupPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  getToolButton(toolId: string): Locator {
    return this.page.getByTestId(`tool-${toolId}`);
  }

  async clickTool(toolId: string): Promise<Page> {
    const toolButton = this.getToolButton(toolId);
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      toolButton.click(),
    ]);
    return newPage;
  }
}
