import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';
import { EVI_JOURNEY_PAGES } from '../utility-helper/constants-lib';

export class SomethingElsePage extends BasePage {
  constructor(page: Page) {
    super(page, EVI_JOURNEY_PAGES['Something else']);
  }

  async answer(answer: string) {
    await this.answerQuestion(answer, EVI_JOURNEY_PAGES['Something else'].heading);
  }
}