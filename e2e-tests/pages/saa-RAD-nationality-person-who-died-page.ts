import { expect, type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class RADNationalityPersonWhoDiedPage extends BasePage {
  constructor(page: Page) {
    super(page, {
      path: '/changes/nationality-person-who-died',
      heading: 'Their country of nationality',
    });
  }

  async selectNationality(countryName: string) {
    await this.page.getByRole('combobox', { name: 'Country of nationality' }).fill(countryName);
    await this.page.getByRole('option', { name: countryName, exact: true }).click();
  }

  async assertContentAndLayout() {
    await this.assertOnPage();
    await expect(this.page.getByText('Tell us someone has died', { exact: true })).toBeVisible();
    const nationality = this.page.getByRole('combobox', { name: 'Country of nationality', exact: true });
    await expect(nationality).toBeVisible();
    await expect(nationality).toHaveValue('');
    await expect(this.continueButton).toBeVisible();
  }
}