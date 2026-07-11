import { expect, test } from '@playwright/test';

import { loginAsHr } from '../helpers/auth';
import { demoSeedCount } from '../helpers/env';

test.describe.configure({ mode: 'serial' });

test('settings → clear/seed → directory shows demo count', async ({
  page,
}) => {
  test.setTimeout(10 * 60_000);

  // Demo seed marks every 10th employee as Left (i % 10 === 0).
  const expectedLeft = Math.floor(demoSeedCount / 10);
  const expectedActive = demoSeedCount - expectedLeft;

  await loginAsHr(page);
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await expect(page.getByText(/Status:/)).toBeVisible();

  const clearButton = page.getByRole('button', { name: 'Clear demo' });
  if (await clearButton.isEnabled()) {
    await clearButton.click();
    await page.getByRole('button', { name: 'Confirm clear' }).click();
    await expect(page.getByText('Demo data cleared.')).toBeVisible({
      timeout: 5 * 60_000,
    });
    await expect(page.getByText(/Empty/)).toBeVisible();
  }

  await page.getByRole('button', { name: 'Seed demo' }).click();
  await page.getByRole('button', { name: 'Confirm seed' }).click();
  await expect(
    page.getByText(new RegExp(`Inserted ${demoSeedCount} employees`, 'i')),
  ).toBeVisible({ timeout: 8 * 60_000 });
  await expect(
    page.getByText(new RegExp(`Seeded\\s*·\\s*${demoSeedCount}\\s*employees`)),
  ).toBeVisible();

  await page.goto('/employees');
  await expect(page.getByRole('heading', { name: 'Employees' })).toBeVisible();
  await expect(
    page.getByText(new RegExp(`·\\s*${expectedActive}\\s*total`)),
  ).toBeVisible({ timeout: 60_000 });

  await page.goto('/employees/left');
  await expect(
    page.getByRole('heading', { name: 'Left employees' }),
  ).toBeVisible();
  await expect(
    page.getByText(new RegExp(`·\\s*${expectedLeft}\\s*total`)),
  ).toBeVisible({ timeout: 60_000 });
});
