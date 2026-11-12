import { expect, type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class EvidenceCheckYourAnswersPage extends BasePage {
  constructor(page: Page) {
    super(page, { path: '/changes/check-your-answers-evidence', heading: 'Check your answers' });
  }

  async assertContentAndLayout() {
    await this.assertOnPage();
    await expect(this.page.getByText('Send evidence for your claim', { exact: true })).toBeVisible();
    await expect(this.page.getByText('Evidence', { exact: true })).toBeVisible();
    await expect(this.page.getByRole('term').filter({ hasText: 'Files uploaded' })).toBeVisible();
    await expect(this.page.getByRole('term').filter({ hasText: 'Violent or upsetting images' })).toBeVisible();
    await expect(this.page.getByRole('link', { name: 'Add more evidence' })).toBeVisible();
    await expect(this.continueButton).toBeVisible();
  }

  async assertAnswer(summaryLabel: string, answer: string, changeLinkLabel = summaryLabel) {
    await expect(this.page.getByRole('term').filter({ hasText: summaryLabel })).toBeVisible();
    await expect(this.page.getByText(answer, { exact: true })).toBeVisible();
    await expect(this.page.getByRole('link', { name: `Change ${changeLinkLabel} from ${answer}`, exact: true }))
      .toBeVisible();
  }

  async assertValueDisplayed(value: string) {
    await expect(this.page.locator('dd.confirm-value').filter({ hasText: value })).toBeVisible();
  }

  async assertNoRemoveLinks() {
    await expect(this.page.getByRole('link', { name: /^Remove/ })).toHaveCount(0);
  }

  async editAnswer(question: string, answer: string) {
    await this.page.getByRole('link', { name: `Change ${question} from ${answer}`, exact: true }).click();
    const expectedPath = question === 'Files uploaded'
      ? '/changes/upload-supporting-evidence'
      : '/changes/violent-upsetting-images';
    await expect(this.page).toHaveURL(url => url.pathname === expectedPath);
  }

  async addMoreEvidence() {
    await this.page.getByRole('link', { name: 'Add more evidence' }).click();
    await expect(this.page).toHaveURL(url =>
      url.pathname === '/changes/upload-supporting-evidence'
    );
  }

  async continueFromSummary() {
    await this.continueToNextPage();
  }
}