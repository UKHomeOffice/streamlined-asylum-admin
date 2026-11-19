import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class SendInformationForYourAsylumClaimPage extends BasePage {
  readonly startNowButton: Locator;
  readonly acceptCookieButton: Locator;
  readonly hideThisMessageButton: Locator;

  constructor(page: Page) {
    super(page);
    this.startNowButton = page.locator('a:has-text("Start now")');
    this.acceptCookieButton = page.locator('#accept-cookies-button');
    this.hideThisMessageButton = page.locator('#hide-accept-cookie-banner');
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: Send information for your asylum claim – Send information for your asylum claim – GOV.UK"
      : "Send information for your asylum claim – Send information for your asylum claim – GOV.UK";
  }

  async navigateToUrl() {
    await this.page.goto('/');
  }

  async completecompleteSendInformationForYourAsylumClaimPage() {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());

    if (await this.acceptCookieButton.isVisible()) {
      await this.click(this.acceptCookieButton);
    }

    if (await this.hideThisMessageButton.isVisible()) {
      await this.click(this.hideThisMessageButton);
    }

    await this.click(this.startNowButton);
  }

}
