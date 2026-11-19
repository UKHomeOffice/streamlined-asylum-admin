import { type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class YouHaveNotSelectedAnyOptionsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: You have not selected any options – Send information for your asylum claim – GOV.UK"
      : "You have not selected any options – Send information for your asylum claim – GOV.UK";
  }
}
