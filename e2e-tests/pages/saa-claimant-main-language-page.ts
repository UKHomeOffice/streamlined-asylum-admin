import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class ClaimantMainLanguagePage extends BasePage {
  constructor(page: Page) {
    super(page, { path: '/changes/claimant-main-language', heading: "Claimant's main language" });
  }

  async selectLanguage(languageName: string) {
    const language = this.page.getByRole('combobox', { name: 'Main language' });
    await language.fill(languageName);
    await this.page.getByRole('option', { name: languageName, exact: true }).click();
  }
}