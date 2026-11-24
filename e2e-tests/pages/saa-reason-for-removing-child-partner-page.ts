import { type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class ReasonForRemovingChildPartnerPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async completeReasonForRemovingChildPartnerPage(reason: string): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, 'Why are you removing a child, partner or dependant from your claim? – Send information for your asylum claim – GOV.UK');

    await this.type(this.page.locator('#reason-removing-child-partner'), reason);
    await this.clickContinueButton();
  }
}