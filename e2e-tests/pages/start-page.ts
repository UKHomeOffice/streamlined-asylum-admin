import { expect, type Page } from '@playwright/test';
import { BasePage } from './base-page';
import { AUTH_PAGES, JOURNEY_START } from '../utility-helper/constants-lib';

export class StartPage extends BasePage {
  constructor(page: Page) {
    super(page, AUTH_PAGES.Start);
  }

  async startJourney() {
    await this.navigateTo(JOURNEY_START);
    await this.clickStartNow();
  }

  async clickStartNow() {
    await this.page.getByRole('button', { name: 'Start now' }).click();
    await expect(this.page).toHaveURL(url => url.pathname === AUTH_PAGES['Before you start'].path);
  }
}