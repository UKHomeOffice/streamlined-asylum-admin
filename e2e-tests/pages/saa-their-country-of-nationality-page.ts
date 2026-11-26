import { type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class TheirCountryOfNationalityPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: Their country of nationality – Send information for your asylum claim – GOV.UK"
      : "Their country of nationality – Send information for your asylum claim – GOV.UK";
  }

  async completeChildPartnerNationalityPage(nationality: string): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());

    const nationalityInput = this.page.getByRole('combobox', { name: 'Country of nationality' });
    await nationalityInput.fill(nationality);
    await this.page.getByRole('option', { name: nationality, exact: true }).click();
    await this.clickContinueButton();
  }

  async completePersonWhoDiedNationalityPage(nationality: string): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());

    const nationalityInput = this.page.getByRole('combobox', { name: 'Country of nationality' });
    await nationalityInput.fill(nationality);
    await this.page.getByRole('option', { name: nationality, exact: true }).click();
    await this.clickContinueButton();
  }
}
