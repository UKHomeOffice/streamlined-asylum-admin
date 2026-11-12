import { expect, type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class RADCheckYourAnswersDeathPage extends BasePage {
  constructor(page: Page) {
    super(page, { path: '/changes/check-your-answers-death', heading: 'Check your answers' });
  }

  async assertAnswer(question: string, answer: string, personName?: string) {
    const summary = personName
      ? this.page.locator('dl').filter({ has: this.page.getByText(personName, { exact: true }) })
      : this.page;
    const row = summary.getByRole('term').filter({ hasText: question }).locator('..');
    await expect(row.getByRole('definition').first()).toContainText(answer);
  }

  async assertContentAndLayout() {
    await this.assertOnPage();
    await expect(this.page.getByText('Tell us someone has died', { exact: true })).toBeVisible();
    const changeLinks = this.page.getByRole('link', { name: 'Change Tell us about the person who died', exact: true });
    const count = await changeLinks.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index++) {
      await expect(changeLinks.nth(index)).toBeVisible();
    }
    for (const question of ['Did they make the claim?', 'Their name', 'Their date of birth', 'Their country of nationality', 'Files uploaded']) {
      await expect(this.page.getByRole('term').filter({ hasText: question })).toHaveCount(count);
    }
    await expect(this.page.getByRole('link', { name: 'Tell us someone else has died', exact: true })).toBeVisible();
    await expect(this.continueButton).toBeVisible();
  }
}