import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';
import { EVI_JOURNEY_PAGES } from '../utility-helper/constants-lib';

export class PersonCompletingFormPage extends BasePage {
  constructor(page: Page) {
    super(page, EVI_JOURNEY_PAGES['Person completing form']);
  }

  async answer(answer: string) {
    await this.answerQuestion(answer, 'Are you completing the form for you or someone else?');
  }
}