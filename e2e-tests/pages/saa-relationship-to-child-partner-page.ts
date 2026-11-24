import { type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class RelationshipToChildPartnerPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: How are they related to you? – Send information for your asylum claim – GOV.UK"
      : "How are they related to you? – Send information for your asylum claim – GOV.UK";
  }

  async completeRelationshipToChildPartnerPage(answer: string): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());

    await this.selectRadioOptionWithText(answer);
    await this.clickContinueButton();
  }
}