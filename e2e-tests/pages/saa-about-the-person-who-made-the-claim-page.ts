import { randomInt } from 'node:crypto';
import { type Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { get } from 'node:http';

export class AboutThePersonWhoMadeTheClaimPage extends BasePage {
  readonly uniqueApplicationNo: Locator;

  constructor(page: Page) {
    super(page);
    this.uniqueApplicationNo = page.locator('#claimant-unique-application-number');
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: About the person who made the claim – Send information for your asylum claim – GOV.UK"
      : "About the person who made the claim – Send information for your asylum claim – GOV.UK";
  }

  getGeneratedUniqueApplicationNumber(): string {
    if (!this.randomUniqueApplicationNumber()) {
      throw new Error('The unique application number has not been generated.');
    }
    return this.randomUniqueApplicationNumber();
  }

  async completeAboutThePersonWhoMadeTheClaimPage(uniqueApplicationNumber: string, dob: string): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());

    await this.type(this.uniqueApplicationNo, uniqueApplicationNumber);
    await this.enterDateOrDob(dob);
    await this.clickContinueButton();
  }
}
