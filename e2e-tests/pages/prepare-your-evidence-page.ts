import { expect, type Page } from '@playwright/test';
import { BasePage } from './base-page';
import { EVIDENCE_PAGES } from '../utility-helper/constants-lib';

export class PrepareYourEvidencePage extends BasePage {
  constructor(page: Page) {
    super(page, EVIDENCE_PAGES['Prepare your evidence']);
  }

  async assertContentAndLayout() {
    await expect(this.page.getByRole('heading', { level: 1, name: 'Prepare your evidence' })).toBeVisible();
    for (const text of [
      'All evidence must be:',
      'in English, or sent with an English translation',
      'accurate',
      'relevant to the claim',
    ]) {
      await expect(this.page.getByText(text, { exact: true })).toBeVisible();
    }
    await expect(this.continueButton).toBeVisible();
  }
}