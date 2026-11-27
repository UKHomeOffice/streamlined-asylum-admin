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

  async completeUploadTheDeathCertificatePage(uploadFile: string): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());

    await this.page.locator('input[type=file]').first().setInputFiles(this.getUploadFilePath(uploadFile));
    await this.page.locator('#uploaded-documents a').first().waitFor({ state: 'visible' });
    await this.page.locator("form[name='file-upload-form'] button[class='govuk-button']").click();
  }
}
