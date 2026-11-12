import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class ClaimantDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page, { path: '/claimant-details', heading: 'About the person who made the claim' });
  }

  async complete(day = '01', month = '09', year = '2000') {
    await this.assertOnPage();
    await this.page.getByLabel('Unique application number (UAN)').fill('1234-5678-9101-1121');
    await this.page.getByLabel('Day', { exact: true }).fill(day);
    await this.page.getByLabel('Month', { exact: true }).fill(month);
    await this.page.getByLabel('Year', { exact: true }).fill(year);
    await this.continueToNextPage();
  }
}