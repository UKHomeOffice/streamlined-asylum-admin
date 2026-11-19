import { type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class HasThereBeenADecisionOnTheAsylumClaimPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: Has there been a decision on the asylum claim? – Send information for your asylum claim – GOV.UK"
      : "Has there been a decision on the asylum claim? – Send information for your asylum claim – GOV.UK";
  }

  async completeHasThereBeenADecisionOnTheAsylumClaimPage(option: string) {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());

    await this.selectRadioOptionWithText(option); 
    await this.clickContinueButton();
  }
}
