import { expect, type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class CheckYourAnswersDeathPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? "Error: Check your answers – Send information for your asylum claim – GOV.UK"
      : "Check your answers – Send information for your asylum claim – GOV.UK";
  }

  async assertDeathAnswers(claimantAnswer: string, givenName: string, familyName: string, dateOfBirth: string, nationality: string, certificate: string): Promise<void> {
    await expect(this.page).toHaveURL(/\/check-your-answers-death(?:[/?#]|$)/);
    const summary = this.page.locator('.govuk-summary-list');
    const claimantAnswerRow = summary.locator('.govuk-summary-list__row').filter({ hasText: 'Did they make the claim?' });
    await expect(claimantAnswerRow.locator('.govuk-summary-list__value')).toHaveText(claimantAnswer);
    await expect(summary).toContainText(givenName);
    await expect(summary).toContainText(familyName);
    await expect(summary).toContainText(dateOfBirth);
    await expect(summary).toContainText(nationality);
    await expect(summary).toContainText(certificate);
  }
}
