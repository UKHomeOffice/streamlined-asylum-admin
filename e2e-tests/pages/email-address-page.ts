import { expect, type Page } from '@playwright/test';
import { BasePage } from './base-page';
import { AUTH_PAGES } from '../utility-helper/constants-lib';

export class EmailAddressPage extends BasePage {
  constructor(page: Page) {
    super(page, AUTH_PAGES['Email address']);
  }

  async authenticate(emailAddress: string) {
    await this.assertOnPage();
    await this.page.getByRole('textbox', { name: 'What is your email address?' }).fill(emailAddress);
    await this.page.getByRole('button', { name: 'Send secure link' }).click();
    await expect(this.page).toHaveURL(url =>
      url.pathname === '/changes/continue-to-form' && url.searchParams.get('token') === 'skip'
    );
  }
}