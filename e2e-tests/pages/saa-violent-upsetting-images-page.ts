import { expect, type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';
import { EVIDENCE_PAGES, VIOLENT_IMAGES_QUESTION, VIOLENT_IMAGES_REQUIRED_ERROR } from '../utility-helper/constants-lib';

export class ViolentUpsettingImagesPage extends BasePage {
  constructor(page: Page) {
    super(page, EVIDENCE_PAGES['Violent or upsetting images']);
  }

  async assertContentAndLayout() {
    await this.assertOnPage();
    await expect(this.page.getByText('Send evidence for your claim', { exact: true })).toBeVisible();
    for (const text of [
      'Images that show violence or injury can be very upsetting.',
      'Tell us if your evidence includes images like this. This helps us prepare our staff.',
      'Only upload these images if they are needed for your claim.',
      'Warning You must not upload anything sexually explicit. We will not accept it.',
    ]) {
      await expect(this.page.getByText(text, { exact: true })).toBeVisible();
    }
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