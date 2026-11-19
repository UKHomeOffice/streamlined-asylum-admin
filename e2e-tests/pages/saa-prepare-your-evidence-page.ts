import { type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class PrepareYourEvidencePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: Prepare your evidence – Send information for your asylum claim – GOV.UK"
      : "Prepare your evidence – Send information for your asylum claim – GOV.UK";
  }

  async completePrepareYourEvidencePage(): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());
    
    await this.clickContinueButton();
  }
}
