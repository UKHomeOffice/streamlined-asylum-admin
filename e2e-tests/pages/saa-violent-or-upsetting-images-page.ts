import { type Page } from '@playwright/test';
import { BasePage } from './base-page';

export const VIOLENT_IMAGES_QUESTION = 'Does your evidence include violent or upsetting images?';
export const VIOLENT_IMAGES_REQUIRED_ERROR = 'Select if the evidence contains violent or upsetting images';

export class ViolentOrUpsettingImagesPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: Violent or upsetting images – Send information for your asylum claim – GOV.UK"
      : "Violent or upsetting images – Send information for your asylum claim – GOV.UK";
  }

  async completeViolentOrUpsettingImagesPage(answer: string): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());

    await this.selectRadioOptionWithText(answer);
    await this.clickContinueButton();
  }
}
