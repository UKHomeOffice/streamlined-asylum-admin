import { type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class WhichFormDoYouNeedToContinuePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: Which form do you need to continue? – Send information for your asylum claim – GOV.UK"
      : "Which form do you need to continue? – Send information for your asylum claim – GOV.UK";
  }

  async completeWhichFormDoYouNeedToContinuePage(uniqueApplicationNumber: string): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());

    await this.selectRadioOptionWithText(uniqueApplicationNumber);
    await this.clickContinueButton();
  }
}
