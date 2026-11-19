import { type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class TheirNamePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: Their name – Send information for your asylum claim – GOV.UK"
      : "Their name – Send information for your asylum claim – GOV.UK";
  }
}
