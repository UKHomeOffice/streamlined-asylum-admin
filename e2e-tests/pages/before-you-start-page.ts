import { expect, type Page } from '@playwright/test';
import { BasePage } from './base-page';
import { AUTH_PAGES } from '../utility-helper/constants-lib';

export class BeforeYouStartPage extends BasePage {
  constructor(page: Page) {
    super(page, AUTH_PAGES['Before you start']);
  }

  async continueToClaimantDetails() {
    await this.assertOnPage();
    await this.continueButton.click();
    await expect(this.page).toHaveURL(url => url.pathname === AUTH_PAGES['Claimant details'].path);
  }
}