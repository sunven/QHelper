import { test, expect } from '../support/fixtures';
import { openToolPage } from '../support/helpers/extension';

test.describe('Trans Radix Tool', () => {
  test('page loads with conversion interface', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'trans-radix');

    await expect(page.locator('#tool-page-title-trans-radix')).toContainText('进制转换');

    await page.close();
  });

  test('has input fields and conversion buttons', async ({ context, extensionId }) => {
    const page = await openToolPage(context, extensionId, 'trans-radix');
    const card = page.locator('[data-slot="card"]').first();

    const radios = card.getByRole('radio');
    const count = await radios.count();
    expect(count).toBeGreaterThanOrEqual(4);

    const buttons = card.getByRole('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(2);

    await page.close();
  });

  test('keeps the conversion card top outline visible inside the scroll area', async ({
    context,
    extensionId,
  }) => {
    const page = await openToolPage(context, extensionId, 'trans-radix');
    const main = page.getByTestId('tool-page-main');
    const card = page.locator('[data-slot="card"]').first();

    await expect(card).toBeVisible();

    const [mainBox, cardBox] = await Promise.all([
      main.boundingBox(),
      card.boundingBox(),
    ]);
    expect(mainBox).not.toBeNull();
    expect(cardBox).not.toBeNull();
    expect(cardBox!.y).toBeGreaterThan(mainBox!.y);

    await page.close();
  });
});
