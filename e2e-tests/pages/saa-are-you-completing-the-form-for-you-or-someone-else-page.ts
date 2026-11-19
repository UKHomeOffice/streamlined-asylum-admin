import { type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class AreYouCompletingTheFormForYouOrSomeoneElsePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: Are you completing the form for you or someone else? – Send information for your asylum claim – GOV.UK"
      : "Are you completing the form for you or someone else? – Send information for your asylum claim – GOV.UK";
  }

  async completeAreYouCompletingTheFormForYouOrSomeoneElsePage(answer: string): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());

    await this.selectRadioOptionWithText(answer);
    await this.clickContinueButton();
  }
}
