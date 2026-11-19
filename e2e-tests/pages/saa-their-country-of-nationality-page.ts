import { type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class TheirCountryOfNationalityPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: Their country of nationality – Send information for your asylum claim – GOV.UK"
      : "Their country of nationality – Send information for your asylum claim – GOV.UK";
  }
}
