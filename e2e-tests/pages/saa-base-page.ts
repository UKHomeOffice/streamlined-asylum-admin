import { expect, type Locator, type Page } from '@playwright/test';

export type PageDetails = { path: string; heading: string };

export class BasePage {
  readonly continueButton: Locator;
  readonly backLink: Locator;
  readonly errorSummary: Locator;

  constructor(readonly page: Page, readonly details?: PageDetails) {
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.backLink = page.getByRole('link', { name: 'Back', exact: true });
    this.errorSummary = page.getByRole('alert');
  }

  get currentPath(): string {
    return new URL(this.page.url()).pathname;
  }

  async navigateTo(path: string) {
    const response = await this.page.goto(path);
    if (response && !response.ok()) {
      throw new Error(
        `Cannot start the journey: HTTP ${response.status()} at ${response.url()}. ` +
        'Check environment access, VPN and UAT allowlisting before running the tests.'
      );
    }
    await this.assertServiceAvailable();
  }

  async assertServiceAvailable() {
    await expect(
      this.page.getByRole('heading', { level: 1, name: /^(Request denied|403 Forbidden)$/i }),
      `The service denied access at ${this.page.url()}; check environment access and WAF configuration`
    ).toHaveCount(0);
  }

  async assertOnPage() {
    if (!this.details) {
      throw new Error('Page details are required to assert the current page');
    }
    await expect(this.page).toHaveURL(url => url.pathname === this.details.path);
    await expect(this.page.getByRole('heading', { level: 1, name: this.details.heading })).toBeVisible();
  }

  async clickContinue() {
    await this.continueButton.click();
    await this.assertServiceAvailable();
  }

  async continueToNextPage() {
    const currentUrl = this.page.url();
    await this.clickContinue();
    await expect(this.page).not.toHaveURL(currentUrl);
  }

  async enterForm() {
    const currentUrl = this.page.url();
    await this.page.getByRole('button', { name: 'Enter form' }).click();
    await this.assertServiceAvailable();
    await expect(this.page).not.toHaveURL(currentUrl);
  }

  async selectRadio(answer: string) {
    await this.page.getByRole('radio', { name: answer, exact: true }).check();
  }

  async answerQuestion(answer: string, question: string) {
    await this.page.getByRole('group', { name: question })
      .getByRole('radio', { name: answer, exact: true }).check();
  }

  async continueWithoutAnswering(question: string) {
    await expect(this.page.getByRole('group', { name: question })).toBeVisible();
    await this.clickContinue();
  }

  async assertUnansweredQuestion(question: string) {
    const group = this.page.getByRole('group', { name: question });
    await expect(group).toBeVisible();
    await expect(group.getByRole('radio', { name: 'Yes', exact: true })).toBeVisible();
    await expect(group.getByRole('radio', { name: 'No', exact: true })).toBeVisible();
    await expect(group.getByRole('radio', { checked: true })).toHaveCount(0);
    await expect(this.continueButton).toBeVisible();
  }

  async assertError(message: string) {
    await expect(this.errorSummary).toContainText(message);
    await expect(this.page.getByRole('link', { name: message })).toBeVisible();
  }

  async assertBackLink() {
    await expect(this.backLink).toBeVisible();
  }

  async assertFeedbackBanner() {
    await expect(this.page.getByText('This is a new service')).toBeVisible();
    await expect(this.page.getByRole('link', { name: 'feedback' })).toBeVisible();
  }

  async assertHeaderAndFooter() {
    const header = this.page.getByRole('banner');
    await expect(header).toBeVisible();
    await expect(header.getByRole('link', { name: 'Logo' })).toHaveAttribute('href', 'https://www.gov.uk');
    await expect(this.page.getByRole('contentinfo')).toBeVisible();
  }

  async assertNotOnPage() {
    if (!this.details) {
      throw new Error('Page details are required to assert a bypassed page');
    }
    await expect(this.page).not.toHaveURL(url => url.pathname === this.details.path);
  }
}