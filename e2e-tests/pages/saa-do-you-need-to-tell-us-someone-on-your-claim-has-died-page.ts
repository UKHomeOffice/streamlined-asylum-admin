import { type Page } from '@playwright/test';
import { BasePage } from './base-page';

export const RAD_QUESTION = 'Do you need to tell us someone on your claim has died?';
export const RAD_REQUIRED_ERROR = 'Tell us if someone on your claim has died';

export class DoYouNeedToTellUsSomeoneOnYourClaimHasDiedPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: Do you need to tell us someone on your claim has died? – Send information for your asylum claim – GOV.UK"
      : "Do you need to tell us someone on your claim has died? – Send information for your asylum claim – GOV.UK";
  }

  async completeDoYouNeedToTellUsSomeoneOnYourClaimHasDiedPage(answer: string): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());

    await this.selectRadioOptionWithText(answer);
    await this.clickContinueButton();
  }
}