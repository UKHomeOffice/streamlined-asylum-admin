import { type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class UploadTheDeathCertificatePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: Upload the death certificate – Send information for your asylum claim – GOV.UK"
      : "Upload the death certificate – Send information for your asylum claim – GOV.UK";
  }
}
