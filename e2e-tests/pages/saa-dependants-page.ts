import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class DependantsPage extends BasePage {
  constructor(page: Page) {
    super(page, {
      path: '/changes/do-you-need-add-remove-dependant',
      heading: 'Do you need to add or remove a child or partner as a dependant?',
    });
  }

  async answer(answer: string) {
    await this.answerQuestion(answer, this.details!.heading);
  }
}