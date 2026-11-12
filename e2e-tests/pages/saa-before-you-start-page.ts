import { expect, type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class BeforeYouStartPage extends BasePage {
  constructor(page: Page) {
    super(page, { path: '/before-you-start', heading: 'What you need before you start' });
  }

  async continueToClaimantDetails() {
    await this.assertOnPage();
    await this.continueButton.click();
    await expect(this.page).toHaveURL(url => url.pathname === '/claimant-details');
  }
}