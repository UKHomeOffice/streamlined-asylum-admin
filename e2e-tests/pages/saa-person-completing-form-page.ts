import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class PersonCompletingFormPage extends BasePage {
  constructor(page: Page) {
    super(page, {
      path: '/changes/person-completing-form',
      heading: 'Are you completing the form for you or someone else?',
    });
  }

  async answer(answer: string) {
    await this.answerQuestion(answer, 'Are you completing the form for you or someone else?');
  }
}