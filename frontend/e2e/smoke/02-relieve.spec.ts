import { expect, test } from '@playwright/test';

import { loginAsHr, onboardEmployee, uniqueEmployeeId } from '../helpers/auth';

test('login → onboard → relieve → left employees', async ({ page }) => {
  const employeeId = uniqueEmployeeId('REL');
  const name = `Relieve Smoke ${employeeId}`;
  const email = `${employeeId.toLowerCase()}@example.com`;

  await loginAsHr(page);
  await onboardEmployee(page, { employeeId, name, email });

  await page.getByRole('button', { name: 'Relieve' }).click();
  await expect(
    page.getByRole('heading', { name: 'Relieve employee' }),
  ).toBeVisible();
  await page.locator('#relieve-reason').fill('E2E relieve smoke');
  await page.getByRole('button', { name: 'Confirm relieve' }).click();

  await expect(page).toHaveURL(/\/employees\/left/);
  await expect(
    page.getByRole('heading', { name: 'Left employees' }),
  ).toBeVisible();

  await page.locator('#employee-search').fill(employeeId);
  const leftRow = page.getByRole('row', { name: new RegExp(employeeId) });
  await expect(leftRow).toBeVisible({ timeout: 15_000 });
  await expect(leftRow.getByText(name, { exact: true })).toBeVisible();
});
