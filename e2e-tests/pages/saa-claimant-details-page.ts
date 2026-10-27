import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';
import { AUTH_PAGES } from '../utility-helper/constants-lib';

export class ClaimantDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page, AUTH_PAGES['Claimant details']);
  }

  async complete() {
    await this.assertOnPage();
    await this.page.getByLabel('Unique application number (UAN)').fill('1234-5678-9101-1121');
    await this.page.getByLabel('Day', { exact: true }).fill('01');
    await this.page.getByLabel('Month', { exact: true }).fill('09');
    await this.page.getByLabel('Year', { exact: true }).fill('2000');
    await this.continueToNextPage();
  }
}