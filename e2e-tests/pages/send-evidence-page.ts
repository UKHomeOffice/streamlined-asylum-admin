import { type Page } from '@playwright/test';
import { BasePage } from './base-page';
import { EVIDENCE_PAGES } from '../utility-helper/constants-lib';

export class SendEvidencePage extends BasePage {
  constructor(page: Page) {
    super(page, EVIDENCE_PAGES['Send evidence for your claim']);
  }

  async assertContentAndLayout() {
    await this.assertUnansweredQuestion(EVIDENCE_PAGES['Send evidence for your claim'].heading);
  }

  async answer(answer: string) {
    await this.answerQuestion(answer, EVIDENCE_PAGES['Send evidence for your claim'].heading);
  }
}