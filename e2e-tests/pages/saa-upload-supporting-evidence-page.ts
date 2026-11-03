import { expect, type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';
import { EVIDENCE_PAGES } from '../utility-helper/constants-lib';

export class UploadSupportingEvidencePage extends BasePage {
  constructor(page: Page) {
    super(page, EVIDENCE_PAGES['Upload evidence to help your claim']);
  }

  async assertContentAndLayout() {
    await this.assertOnPage();
    const mainContent = this.page.getByRole('main');
    await expect(mainContent.getByText('Send evidence for your claim', { exact: true })).toBeVisible();
    await expect(this.page.getByLabel('Upload a file')).toBeVisible();
    await expect(this.page.getByRole('heading', { name: 'No files uploaded' })).toBeVisible();
    await expect(this.continueButton).toBeVisible();
    await expect(mainContent).toContainText('The file must be either:');
    await expect(mainContent).toContainText('a document (.doc, .docx, .pdf, .rtf, .txt, .odt)');
    await expect(mainContent).toContainText('an image (.jpeg, .jpg, .png)');
    await expect(mainContent).toContainText('Each file can be up to 25MB in size.');
    await expect(mainContent).toContainText('You can upload a limit of 6 files.');
    await expect(this.page.locator('input[type="file"]')).toHaveAttribute(
      'accept',
      '.doc,.docx,.pdf,.rtf,.txt,.odt,.jpeg,.jpg,.png'
    );
  }

  async uploadEvidenceForJourney(fileName = 'test-evidence.txt') {
    await this.page.locator('input[type="file"]').setInputFiles({
      name: fileName,
      mimeType: 'text/plain',
      buffer: Buffer.from('Test evidence for the Playwright journey.'),
    });
  }

  async uploadEvidenceAndReturnToUploadPage(fileName: string) {
    await this.uploadEvidenceForJourney(fileName);
    await this.continueToNextPage();
    await this.backLink.click();
    await this.assertOnPage();
    await expect(this.page.locator('#uploaded-documents')).toContainText(fileName);
  }

  async removeUploadedEvidence(fileName: string) {
    await this.page.getByRole('link', { name: `Remove ${fileName}` }).click();
    await expect(this.page.locator('#uploaded-documents').getByText(fileName, { exact: true }))
      .toHaveCount(0);
  }

  async assertEvidenceIsNotUploaded(fileName: string) {
    await expect(this.page.locator('#uploaded-documents').getByText(fileName, { exact: true }))
      .toHaveCount(0);
  }

  async assertUploadedFileCount(count: number) {
    await expect(this.page.locator('#uploaded-documents .govuk-grid-row')).toHaveCount(count);
  }

  async assertFileCountLimitError() {
    await this.assertOnPage();
    await expect(this.page.locator('#file-upload-error'))
      .toContainText('You can only upload up to 6 files. Remove a file before uploading another');
  }
}