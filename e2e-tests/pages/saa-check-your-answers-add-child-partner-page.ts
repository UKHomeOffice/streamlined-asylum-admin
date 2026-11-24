import { expect, type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class CheckYourAnswersAddChildPartnerPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async assertChildPartnerAnswers(relationship: string, givenName: string, familyName: string, dateOfBirth: string, nationality: string, uploadFile: string): Promise<void> {
    await expect(this.page).toHaveURL(/\/check-your-answers-add-child-partner(?:[/?#]|$)/);
    const summary = this.page.locator('.govuk-summary-list');
    await expect(summary).toContainText(relationship);
    await expect(summary).toContainText(givenName);
    await expect(summary).toContainText(familyName);
    await expect(summary).toContainText(dateOfBirth);
    await expect(summary).toContainText(nationality);
    await expect(summary).toContainText(uploadFile);
  }

  async assertChildPartnerRemoval(reason: string): Promise<void> {
    await expect(this.page.locator('.govuk-summary-card__title')).toHaveText('Remove a child or partner as a dependant');
    const reasonRow = this.page.locator('.govuk-summary-list__row').filter({ hasText: 'Why are you removing them?' });
    await expect(reasonRow.locator('.govuk-summary-list__value')).toHaveText(reason);
  }
}