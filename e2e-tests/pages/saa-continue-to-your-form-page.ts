import { type Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class ContinueToYourFormPage extends BasePage {
  readonly EnterFormButton: Locator;

  constructor(page: Page) {
    super(page);
    this.EnterFormButton = this.page.locator('input[type="submit"]');
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: Continue to your form – Send information for your asylum claim – GOV.UK"
      : "Continue to your form – Send information for your asylum claim – GOV.UK";
  }

  async completeContinueToYourFormPage() {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());

    await this.click(this.EnterFormButton);
  }
}
