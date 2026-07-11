import { expect, test } from '@playwright/test';

import { loginAsHr } from '../helpers/auth';

test('login → templates → create → update → delete unused', async ({
  page,
}) => {
  const name = `E2E Template ${Date.now().toString(36).toUpperCase()}`;

  await loginAsHr(page);
  await page.goto('/templates');
  await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();

  await page.getByRole('button', { name: 'Create template' }).click();
  await expect(
    page.getByRole('heading', { name: 'Create template' }),
  ).toBeVisible();

  await page.locator('#template-name').fill(name);
  await expect
    .poll(async () =>
      page.locator('#template-country').evaluate((el) => el.tagName),
    )
    .toBe('SELECT');
  await page.locator('#template-country').selectOption('India');
  await page.locator('#template-currency').selectOption('INR');
  await page.locator('#template-base-pay').fill('900000');
  await page.locator('#template-allowances').fill('50000');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Create template' })
    .click();

  await expect(page).toHaveURL(/\/templates\/[^/]+$/);
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
  await expect(page.getByText(/Version 1/)).toBeVisible();

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(
    page.getByRole('heading', { name: 'Edit template' }),
  ).toBeVisible();
  await page.locator('#template-base-pay').fill('950000');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Save changes' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Edit template' }),
  ).toHaveCount(0);
  await expect(page.getByText(/₹9,50,000/)).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(
    page.getByRole('heading', { name: 'Delete template' }),
  ).toBeVisible();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirm delete' })
    .click();

  await expect(page).toHaveURL(/\/templates$/);
  await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();
  await page.locator('#template-search').fill(name);
  await expect(
    page.getByText('No salary templates match your filters.'),
  ).toBeVisible({ timeout: 15_000 });
});
