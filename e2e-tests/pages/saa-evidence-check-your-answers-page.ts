import { expect, type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';
import { EVIDENCE_PAGES } from '../utility-helper/constants-lib';

export class EvidenceCheckYourAnswersPage extends BasePage {
  constructor(page: Page) {
    super(page, EVIDENCE_PAGES['Evidence check your answers']);
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
      ? EVIDENCE_PAGES['Upload evidence to help your claim'].path
      : EVIDENCE_PAGES['Violent or upsetting images'].path;
    await expect(this.page).toHaveURL(url => url.pathname === expectedPath);
  }

  async addMoreEvidence() {
    await this.page.getByRole('link', { name: 'Add more evidence' }).click();
    await expect(this.page).toHaveURL(url =>
      url.pathname === EVIDENCE_PAGES['Upload evidence to help your claim'].path
    );
  }

  async continueFromSummary() {
    await this.continueToNextPage();
  }
}