import { expect, type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class CheckYourAnswersPage extends BasePage {
  constructor(page: Page) {
    super(page, { path: '/changes/confirm', heading: 'Check your answers' });
  }

  async assertAnswer(question: string, answer: string, summaryLabel = question) {
    await expect(this.page.getByRole('term').filter({ hasText: summaryLabel })).toBeVisible();
    await expect(this.page.getByRole('link', { name: `Change ${question} from ${answer}`, exact: true })).toBeVisible();
  }
}