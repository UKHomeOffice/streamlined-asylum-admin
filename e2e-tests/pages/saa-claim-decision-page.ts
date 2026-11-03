import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';
import { AUTH_PAGES } from '../utility-helper/constants-lib';

export class ClaimDecisionPage extends BasePage {
  constructor(page: Page) {
    super(page, AUTH_PAGES['Claim decision']);
  }

  async answer(answer: string) {
    await this.answerQuestion(answer, AUTH_PAGES['Claim decision'].heading);
  }
}