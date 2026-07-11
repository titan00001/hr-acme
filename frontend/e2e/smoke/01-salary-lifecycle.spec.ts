import { expect, test } from '@playwright/test';

import { loginAsHr, onboardEmployee, uniqueEmployeeId } from '../helpers/auth';

test.describe.configure({ mode: 'serial' });

test('login → onboard → assign draft → commit → dashboard', async ({
  page,
}) => {
  const employeeId = uniqueEmployeeId('SAL');
  const name = `Salary Smoke ${employeeId}`;
  const email = `${employeeId.toLowerCase()}@example.com`;

  await loginAsHr(page);
  await onboardEmployee(page, { employeeId, name, email });

  await page.getByRole('link', { name: 'Assign salary' }).click();
  await expect(page.getByRole('heading', { name: 'Assign salary' })).toBeVisible();

  await page.locator('#salary-effective-date').fill('2024-06-01');
  await page.locator('#salary-base').fill('120000');
  await page.locator('#salary-currency').selectOption('INR');
  await page.locator('#salary-reason').fill('E2E assign smoke');
  await page.getByRole('button', { name: 'Save draft' }).click();

  await expect(page).toHaveURL(/\/drafts/);
  await expect(page.getByRole('heading', { name: 'Drafts' })).toBeVisible();
  await expect(page.getByText(employeeId, { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name })).toBeVisible();

  const draftRow = page.locator('tr', { hasText: employeeId });
  await draftRow.getByRole('button', { name: 'Commit' }).click();
  await expect(draftRow).toHaveCount(0, { timeout: 20_000 });

  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByText('Active employees')).toBeVisible();
  await expect(page.getByRole('link', { name })).toBeVisible({
    timeout: 20_000,
  });
});
