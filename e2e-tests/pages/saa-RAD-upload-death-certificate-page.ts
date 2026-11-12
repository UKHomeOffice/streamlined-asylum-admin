import { expect, type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class RADUploadDeathCertificatePage extends BasePage {
  constructor(page: Page) {
    super(page, {
      path: '/changes/upload-death-certificate',
      heading: 'Upload the death certificate',
    });
  }

  async uploadDeathCertificate(fileName: string) {
    const isPhoto = fileName.endsWith('.png');
    await this.page.getByLabel('Upload a file').setInputFiles({
      name: fileName,
      mimeType: isPhoto ? 'image/png' : 'text/plain',
      buffer: isPhoto
        ? Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=', 'base64')
        : Buffer.from('Synthetic death certificate for the Playwright RAD journey.'),
    });
  }

  async assertContentAndLayout() {
    await this.assertOnPage();
    const main = this.page.getByRole('main');
    await expect(main.getByText('Tell us someone has died', { exact: true })).toBeVisible();
    await expect(this.page.getByLabel('Upload a file')).toBeVisible();
    await expect(this.page.getByRole('heading', { name: 'No files uploaded', exact: true })).toBeVisible();
    await expect(main).toContainText('The file must be either:');
    await expect(main).toContainText('a document (.doc, .docx, .pdf, .rtf, .txt, .odt)');
    await expect(main).toContainText('an image (.jpeg, .jpg, .png)');
    await expect(main).toContainText('Each file can be up to 25MB in size.');
    await expect(main).toContainText('You can upload a limit of 6 files.');
    await expect(this.page.getByLabel('Upload a file')).toHaveAttribute('accept', '.doc,.docx,.pdf,.rtf,.txt,.odt,.jpeg,.jpg,.png');
    await expect(this.continueButton).toBeVisible();
  }
}