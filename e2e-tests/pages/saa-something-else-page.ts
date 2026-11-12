import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class SomethingElsePage extends BasePage {
  constructor(page: Page) {
    super(page, { path: '/changes/something-else', heading: 'Do you need to do something else?' });
  }

  async answer(answer: string) {
    await this.answerQuestion(answer, this.details!.heading);
  }
}