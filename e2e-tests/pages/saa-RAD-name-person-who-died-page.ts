import { expect, type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class RADNamePersonWhoDiedPage extends BasePage {
  constructor(page: Page) {
    super(page, { path: '/changes/name-person-who-died', heading: 'Their name' });
  }

  async enterName(givenName: string, familyName: string) {
    await this.page.getByRole('textbox', { name: 'Given name', exact: true }).fill(givenName);
    await this.page.getByRole('textbox', { name: 'Family name', exact: true }).fill(familyName);
  }

  async assertContentAndLayout() {
    await this.assertOnPage();
    await expect(this.page.getByText('Tell us someone has died', { exact: true })).toBeVisible();
    for (const label of ['Given name', 'Family name']) {
      const input = this.page.getByRole('textbox', { name: label, exact: true });
      await expect(input).toBeVisible();
      await expect(input).toHaveValue('');
    }
    await expect(this.backLink).toHaveAttribute('href', '/changes/main-claimant-died');
    await expect(this.continueButton).toBeVisible();
  }
}