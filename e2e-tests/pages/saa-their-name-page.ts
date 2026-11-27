import { type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class TheirNamePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: Their name – Send information for your asylum claim – GOV.UK"
      : "Their name – Send information for your asylum claim – GOV.UK";
  }

  async completeChildPartnerNamePage(givenName: string, familyName: string): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());

    await this.type(this.page.locator('#child-partner-given-name'), givenName);
    await this.type(this.page.locator('#child-partner-family-name'), familyName);
    await this.clickContinueButton();
  }

  async completePersonWhoDiedNamePage(givenName: string, familyName: string): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());

    await this.type(this.page.locator('#given-name-person-who-died'), givenName);
    await this.type(this.page.locator('#family-name-person-who-died'), familyName);
    await this.clickContinueButton();
  }
}
