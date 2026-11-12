import { expect, type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class RADMainClaimantDiedPage extends BasePage {
  constructor(page: Page) {
    super(page, {
      path: '/changes/main-claimant-died',
      heading: 'Did they make the claim?',
    });
  }

  async answer(answer: string) {
    await this.selectRadio(answer === 'No' ? 'No, they are a husband, wife, partner or child on the claim' : answer);
  }

  async assertContentAndLayout() {
    await this.assertOnPage();
    await expect(this.page.getByText('Tell us someone has died', { exact: true })).toBeVisible();
    const yes = this.page.getByRole('radio', { name: 'Yes', exact: true });
    const no = this.page.getByRole('radio', { name: 'No, they are a husband, wife, partner or child on the claim', exact: true });
    await expect(yes).toBeVisible();
    await expect(no).toBeVisible();
    await expect(yes).not.toBeChecked();
    await expect(no).not.toBeChecked();
    await expect(this.backLink).toHaveAttribute('href', '/changes/about-who-has-died');
    await expect(this.continueButton).toBeVisible();
  }
}