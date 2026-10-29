import { expect, type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';
import { EVIDENCE_PAGES } from '../utility-helper/constants-lib';

export class PrepareYourEvidencePage extends BasePage {
  constructor(page: Page) {
    super(page, EVIDENCE_PAGES['Prepare your evidence']);
  }

  async assertContentAndLayout() {
    await this.assertOnPage();
    await expect(this.page.getByText('Send evidence for your claim', { exact: true })).toBeVisible();
    for (const text of [
      'All evidence must be:',
      'in English, or sent with an English translation',
      'accurate',
      'relevant to the claim',
      'Photographs or scanned information should be clear and easy to read.',
      "Give your evidence a descriptive file name which shows your name and what the file is. For example, 'JohnDoe-statement-2026.pdf'.",
      'We cannot accept any sexually explicit images.',
      'You can save and exit the form if you need time to prepare these documents. We will send you a link so you can get back to the form when you are ready.',
    ]) {
      await expect(this.page.getByText(text, { exact: true })).toBeVisible();
    }
    await expect(this.continueButton).toBeVisible();
  }
}