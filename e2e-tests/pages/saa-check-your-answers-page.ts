import { expect, type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';
import { EVIDENCE_PAGES } from '../utility-helper/constants-lib';

export class CheckYourAnswersPage extends BasePage {
  constructor(page: Page) {
    super(page, EVIDENCE_PAGES['Check your answers']);
  }

  async assertAnswer(question: string, answer: string) {
    await expect(this.page.getByRole('term').filter({ hasText: question })).toBeVisible();
    await expect(this.page.getByRole('link', { name: `Change ${question} from ${answer}`, exact: true })).toBeVisible();
  }
}