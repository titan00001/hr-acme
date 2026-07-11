import { expect, type Page } from '@playwright/test';

import { e2eCredentials } from './env';

export async function loginAsHr(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Username').fill(e2eCredentials.username);
  await page.getByLabel('Password').fill(e2eCredentials.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}

export function uniqueEmployeeId(prefix = 'E2E'): string {
  return `${prefix}${Date.now().toString(36).toUpperCase()}`;
}

export type OnboardInput = {
  employeeId: string;
  name: string;
  email: string;
  country?: string;
  employmentType?: string;
  joiningDate?: string;
};

export async function onboardEmployee(
  page: Page,
  input: OnboardInput,
): Promise<void> {
  await page.goto('/employees');
  await expect(page.getByRole('heading', { name: 'Employees' })).toBeVisible();
  await page.getByRole('button', { name: 'Onboard employee' }).click();
  await expect(page.getByRole('heading', { name: 'Onboard employee' })).toBeVisible();

  await page.locator('#onboard-employee-id').fill(input.employeeId);
  await page.locator('#onboard-name').fill(input.name);
  await page.locator('#onboard-email').fill(input.email);

  const country = input.country ?? 'India';
  const countryField = page.locator('#onboard-country');
  await expect(countryField).toBeVisible();
  // Settings-backed select appears after GET /settings; fall back to text input.
  await expect
    .poll(async () => countryField.evaluate((el) => el.tagName))
    .toBe('SELECT');
  await countryField.selectOption(country);

  await page
    .locator('#onboard-type')
    .selectOption(input.employmentType ?? 'Permanent');
  await page
    .locator('#onboard-joining-date')
    .fill(input.joiningDate ?? '2024-01-15');

  await page.getByRole('button', { name: 'Onboard', exact: true }).click();
  await expect(page).toHaveURL(/\/employees\/[^/]+$/);
  await expect(page.getByRole('heading', { name: input.name })).toBeVisible();
}
