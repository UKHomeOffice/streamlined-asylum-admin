import { type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class InformationYouHaveGivenUsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: Information you have given us – Send information for your asylum claim – GOV.UK"
      : "Information you have given us – Send information for your asylum claim – GOV.UK";
  }

  async completeInformationYouHaveGivenUsPage(): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());
    await this.clickContinueButton();
  }
}
