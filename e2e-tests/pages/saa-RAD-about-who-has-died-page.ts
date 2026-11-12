import { expect, type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class RADAboutWhoHasDiedPage extends BasePage {
  constructor(page: Page) {
    super(page, {
      path: '/changes/about-who-has-died',
      heading: 'Tell us about the person who has died',
    });
  }

  async assertContentAndLayout() {
    await this.assertOnPage();
    const mainContent = this.page.getByRole('main');
    await expect(mainContent.getByText('Tell us someone has died', { exact: true })).toBeVisible();
    await expect(mainContent).toContainText('We need some details so we can update the claim.');
    await expect(mainContent.getByText('We will ask for:', { exact: true })).toBeVisible();
    for (const detail of ['their name', 'their date of birth', 'their nationality', 'their death certificate']) {
      await expect(mainContent.getByRole('listitem').filter({ hasText: detail })).toBeVisible();
    }
    await expect(this.continueButton).toBeVisible();
  }
}