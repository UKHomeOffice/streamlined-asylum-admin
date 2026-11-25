import { type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class EvidenceChildPartnerPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async completeEvidenceChildPartnerPage(uploadFile: string): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, 'Upload evidence to support this change – Send information for your asylum claim – GOV.UK');

    await this.page.locator('input[type=file]').first().setInputFiles(this.getUploadFilePath(uploadFile));
    await this.page.locator('#uploaded-documents a').first().waitFor({ state: 'visible' });
    await this.page.locator("form[name='file-upload-form'] button[class='govuk-button']").click();
  }
}