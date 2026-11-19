import { type Page } from '@playwright/test';
import { BasePage } from './base-page';
import type { Locator } from '@playwright/test';

export class ClaimantsNamePage extends BasePage {

  readonly givenNameInput : Locator;
  readonly familyNameInput : Locator;
  constructor(page: Page) {
    super(page);
    this.givenNameInput = this.page.locator('#claimants-given-name');
    this.familyNameInput = this.page.locator('#claimants-family-name');
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: Claimant’s name – Send information for your asylum claim – GOV.UK"
      : "Claimant’s name – Send information for your asylum claim – GOV.UK";
  }

  async completeClaimantsNamePage(givenName: string, familyName: string): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());

    await this.type(this.givenNameInput, givenName);
    await this.type(this.familyNameInput, familyName);
    await this.clickContinueButton();
  }
}
