import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export const RAD_QUESTION = 'Do you need to tell us someone on your claim has died?';
export const RAD_REQUIRED_ERROR = 'Tell us if someone on your claim has died';

export class SomeoneOnClaimDiedPage extends BasePage {
  constructor(page: Page) {
    super(page, {
      path: '/changes/someone-on-claim-died',
      heading: RAD_QUESTION,
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
