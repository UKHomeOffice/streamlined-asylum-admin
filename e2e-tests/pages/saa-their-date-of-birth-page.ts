import { type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class TheirDateOfBirthPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: Their date of birth – Send information for your asylum claim – GOV.UK"
      : "Their date of birth – Send information for your asylum claim – GOV.UK";
  }

  async completeChildPartnerDateOfBirthPage(dateOfBirth: string): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());

    await this.enterDateOrDob(dateOfBirth);
    await this.clickContinueButton();
  }

  async completePersonWhoDiedDateOfBirthPage(dateOfBirth: string): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());

    await this.enterDateOrDob(dateOfBirth);
    await this.clickContinueButton();
  }

  async submitDayOnlyForChildPartnerDateOfBirthPage(day: string): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());

    await this.page.getByLabel('Day').fill(day);
    await this.clickContinueButton();
  }
}
