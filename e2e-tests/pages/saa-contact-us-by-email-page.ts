import { type Page, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class ContactUsByEmailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async assertTextDisplayed(text: string): Promise<void> {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async assertLinkDisplayed(text: string, url: string): Promise<void> {
    const link = this.page.getByRole('link', { name: text, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', url);
  }
}