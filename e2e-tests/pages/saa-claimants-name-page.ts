import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class ClaimantsNamePage extends BasePage {
  constructor(page: Page) {
    super(page, { path: '/changes/claimants-name', heading: 'Claimant’s name' });
  }

  async enterName(givenName: string, familyName: string) {
    await this.page.getByLabel('Given name').fill(givenName);
    await this.page.getByLabel('Family name').fill(familyName);
  }
}