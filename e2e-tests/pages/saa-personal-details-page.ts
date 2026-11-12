import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class PersonalDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page, { path: '/changes/personal-details', heading: 'Do you need to update personal details?' });
  }

  async answer(answer: string) {
    await this.answerQuestion(answer, this.details!.heading);
  }
}