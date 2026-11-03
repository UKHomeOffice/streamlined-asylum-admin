import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';
import { EVI_JOURNEY_PAGES } from '../utility-helper/constants-lib';

export class ClaimantMainLanguagePage extends BasePage {
  constructor(page: Page) {
    super(page, EVI_JOURNEY_PAGES['Claimant main language']);
  }

  async selectLanguage(languageName: string) {
    const language = this.page.getByRole('combobox', { name: 'Main language' });
    await language.fill(languageName);
    await this.page.getByRole('option', { name: languageName, exact: true }).click();
  }
}