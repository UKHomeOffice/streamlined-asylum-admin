import { type Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class UploadEvidenceToHelpYourClaimPage extends BasePage {

  readonly continueButton: Locator;
  readonly RemoveUploadedDocumentButton: Locator;

  constructor(page: Page) {
    super(page);
    this.continueButton = page.locator("form[name='file-upload-form'] button[class='govuk-button']");
    this.RemoveUploadedDocumentButton = page.locator("[id='uploaded-documents'] a");
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: Upload evidence to help your claim – Send information for your asylum claim – GOV.UK"
      : "Upload evidence to help your claim – Send information for your asylum claim – GOV.UK";
  }

  async uploadFileFromUserUploadFolder(uploadFile: string) {
    const fileInput = this.page.locator("input[type=file]").first();
    await fileInput.setInputFiles(this.getUploadFilePath(uploadFile));
  }

  async completeUploadEvidenceToHelpYourClaimPage(uploadFile: string): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());

    await this.uploadFileFromUserUploadFolder(uploadFile);
    await this.RemoveUploadedDocumentButton.waitFor({  state: "visible" });

    await this.continueButton.click();
  }
}
