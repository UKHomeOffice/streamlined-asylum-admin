import { type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class DoYouNeedToSendEvidenceToHelpYourClaimPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: Do you need to send evidence to help your claim? – Send information for your asylum claim – GOV.UK"
      : "Do you need to send evidence to help your claim? – Send information for your asylum claim – GOV.UK";
  }

  async completeDoYouNeedToSendEvidenceToHelpYourClaimPage(answer: string): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());
    
    await this.selectRadioOptionWithText(answer);
    await this.clickContinueButton();
  }
}
