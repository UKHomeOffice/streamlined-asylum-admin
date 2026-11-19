import { type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class CheckYourAnswersEvidencePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: Check your answers – Send information for your asylum claim – GOV.UK"
      : "Check your answers – Send information for your asylum claim – GOV.UK";
  }
}
