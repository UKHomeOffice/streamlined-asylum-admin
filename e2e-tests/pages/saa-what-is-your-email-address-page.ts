import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class WhatIsYourEmailAddressPage extends BasePage {
  readonly emailInput: Locator;
  readonly SendSecureLinkButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = this.page.locator('#user-email');
    this.SendSecureLinkButton = this.page.locator('input[type="submit"]');
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: What is your email address? – Send information for your asylum claim – GOV.UK"
      : "What is your email address? – Send information for your asylum claim – GOV.UK";
  }

  async completeWhatIsYourEmailAddressPage(email: string): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());

    await this.type(this.emailInput, email);
    await this.click(this.SendSecureLinkButton);
  }
}
