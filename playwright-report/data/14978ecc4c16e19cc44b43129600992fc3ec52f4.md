# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: color-transform-tool.spec.ts >> Color Transform Tool >> page loads successfully
- Location: tests/e2e/color-transform-tool.spec.ts:5:3

# Error details

```
Error: page.goto: Target page, context or browser has been closed
```

# Test source

```ts
  1  | import type { BrowserContext, Page } from '@playwright/test';
  2  | 
  3  | export function toolUrl(extensionId: string, toolName: string): string {
  4  |   return `chrome-extension://${extensionId}/${toolName}.html`;
  5  | }
  6  | 
  7  | export function popupUrl(extensionId: string): string {
  8  |   return `chrome-extension://${extensionId}/popup.html`;
  9  | }
  10 | 
  11 | export async function openToolPage(
  12 |   context: BrowserContext,
  13 |   extensionId: string,
  14 |   toolName: string,
  15 | ): Promise<Page> {
  16 |   const page = await context.newPage();
> 17 |   await page.goto(toolUrl(extensionId, toolName));
     |              ^ Error: page.goto: Target page, context or browser has been closed
  18 |   return page;
  19 | }
  20 | 
```