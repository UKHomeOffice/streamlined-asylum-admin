import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class SomeoneOnClaimDiedPage extends BasePage {
  constructor(page: Page) {
    super(page, {
      path: '/changes/someone-on-claim-died',
      heading: 'Do you need to tell us someone on your claim has died?',
    });
  }

  async answer(answer: string) {
    await this.answerQuestion(answer, this.details!.heading);
  }

  async assertContentAndLayout() {
    await this.assertOnPage();
    await this.assertUnansweredQuestion(this.details!.heading);
  }
}
