import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class ClaimDecisionPage extends BasePage {
  constructor(page: Page) {
    super(page, { path: '/claim-decided', heading: 'Has there been a decision on the asylum claim?' });
  }

  async answer(answer: string) {
    await this.answerQuestion(answer, this.details!.heading);
  }
}