import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class WhichFormPage extends BasePage {
  constructor(page: Page) {
    super(page, { path: '/changes/which-form', heading: 'Which form do you need to continue?' });
  }

  async selectApplication(dateOfBirth: string, nationalInsuranceNumber: string) {
    await this.page.locator('.govuk-radios__item')
      .filter({ hasText: nationalInsuranceNumber })
      .filter({ hasText: `Date of birth ${dateOfBirth}` })
      .getByRole('radio')
      .check();
  }
}