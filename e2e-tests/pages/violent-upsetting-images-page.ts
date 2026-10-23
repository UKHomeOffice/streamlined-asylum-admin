import { type Page } from '@playwright/test';
import { BasePage } from './base-page';
import { EVIDENCE_PAGES, VIOLENT_IMAGES_QUESTION, VIOLENT_IMAGES_REQUIRED_ERROR } from '../utility-helper/constants-lib';

export class ViolentUpsettingImagesPage extends BasePage {
  constructor(page: Page) {
    super(page, EVIDENCE_PAGES['Violent or upsetting images']);
  }

  async assertContentAndLayout() {
    await this.assertUnansweredQuestion(VIOLENT_IMAGES_QUESTION);
  }

  async answer(answer: string) {
    await this.answerQuestion(answer, VIOLENT_IMAGES_QUESTION);
  }

  async continueWithoutSelectingAnswer() {
    await this.assertOnPage();
    await this.clickContinue();
  }

  async assertRequiredError() {
    await this.assertError(VIOLENT_IMAGES_REQUIRED_ERROR);
  }
}