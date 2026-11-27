import { type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class TellUsAboutThePersonWhoHasDiedPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: Tell us about the person who has died – Send information for your asylum claim – GOV.UK"
      : "Tell us about the person who has died – Send information for your asylum claim – GOV.UK";
  }

  async completeTellUsAboutThePersonWhoHasDiedPage(): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());
    await this.clickContinueButton();
  }
}
