import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class SendEvidencePage extends BasePage {
  constructor(page: Page) {
    super(page, {
      path: '/changes/send-evidence-for-your-claim',
      heading: 'Do you need to send evidence to help your claim?',
    });
  }

  async assertContentAndLayout() {
    await this.assertOnPage();
    await this.assertUnansweredQuestion(this.details!.heading);
  }

  async answer(answer: string) {
    await this.answerQuestion(answer, this.details!.heading);
  }
}