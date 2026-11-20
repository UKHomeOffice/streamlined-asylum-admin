import { type Page } from '@playwright/test';
import { BasePage } from './base-page';
import type { Locator } from '@playwright/test';

export class ClaimantsMainLanguagePage extends BasePage {
  readonly mainLanguageInput : Locator;
  constructor(page: Page) {
    super(page);
    this.mainLanguageInput = this.page.locator('#claimant-main-language');
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: Claimant's main language – Send information for your asylum claim – GOV.UK"
      : "Claimant's main language – Send information for your asylum claim – GOV.UK";
  }

  async completeClaimantsMainLanguagePage(mainLanguage: string): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());
    
    await this.type(this.mainLanguageInput, mainLanguage);
    await this.clickContinueButton();
  }
}
