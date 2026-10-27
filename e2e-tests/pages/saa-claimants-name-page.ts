import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';
import { EVI_JOURNEY_PAGES } from '../utility-helper/constants-lib';

export class ClaimantsNamePage extends BasePage {
  constructor(page: Page) {
    super(page, EVI_JOURNEY_PAGES['Claimant name']);
  }

  async enterName(givenName: string, familyName: string) {
    await this.page.getByLabel('Given name').fill(givenName);
    await this.page.getByLabel('Family name').fill(familyName);
  }
}