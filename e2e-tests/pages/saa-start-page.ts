import { expect, type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class StartPage extends BasePage {
  constructor(page: Page) {
    super(page, { path: '/', heading: 'Send information for your asylum claim' });
  }

  async startJourney() {
    await this.navigateTo(this.details!.path);
    await this.clickStartNow();
  }

  async clickStartNow() {
    await this.page.getByRole('button', { name: 'Start now' }).click();
    await expect(this.page).toHaveURL(url => url.pathname === '/before-you-start');
  }
}