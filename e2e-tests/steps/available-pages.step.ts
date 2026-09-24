import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { When, Then } = createBdd();

When('I click through the available pages', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start now' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
});

Then('I reach the check your email page', async ({ page }) => {
  await expect(page).toHaveURL(/\/check-your-email$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Check your email' })
  ).toBeVisible();
});
