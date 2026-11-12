import { expect, type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class RADDateOfBirthPersonWhoDiedPage extends BasePage {
  constructor(page: Page) {
    super(page, {
      path: '/changes/date-of-birth-person-who-died',
      heading: 'Their date of birth',
    });
  }

  async enterDateOfBirth(day: string, month: string, year: string) {
    await this.page.getByLabel('Day', { exact: true }).fill(day);
    await this.page.getByLabel('Month', { exact: true }).fill(month);
    await this.page.getByLabel('Year', { exact: true }).fill(year);
  }

  async assertContentAndLayout() {
    await this.assertOnPage();
    await expect(this.page.getByText('Tell us someone has died', { exact: true })).toBeVisible();
    const dateOfBirth = this.page.getByRole('group', { name: 'Their date of birth', exact: true });
    await expect(dateOfBirth).toBeVisible();
    await expect(dateOfBirth.getByText('For example, 27 3 1940', { exact: true })).toBeVisible();
    for (const label of ['Day', 'Month', 'Year']) {
      const input = dateOfBirth.getByLabel(label, { exact: true });
      await expect(input).toBeVisible();
      await expect(input).toHaveValue('');
    }
    await expect(this.continueButton).toBeVisible();
  }
}