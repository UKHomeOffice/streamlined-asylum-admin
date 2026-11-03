import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';
import { EVIDENCE_PAGES } from '../utility-helper/constants-lib';

export class SomeoneOnClaimDiedPage extends BasePage {
  constructor(page: Page) {
    super(page, EVIDENCE_PAGES['Someone on my claim has died']);
  }

  async answer(answer: string) {
    await this.answerQuestion(answer, EVIDENCE_PAGES['Someone on my claim has died'].heading);
  }
}