import { expect, type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class EmailAddressPage extends BasePage {
  constructor(page: Page) {
    super(page, { path: '/email-address', heading: 'What is your email address?' });
  }

  async authenticate(emailAddress: string) {
    if (!emailAddress) {
      throw new Error('Set SAA_TEST_EMAIL, SAS_HOF_EMAIL (Drone secret), or SKIP_EMAIL before running end-to-end tests.');
    }
    await this.assertOnPage();
    await this.page.getByRole('textbox', { name: 'What is your email address?' }).fill(emailAddress);
    await this.page.getByRole('button', { name: 'Send secure link' }).click();
    await expect(this.page).toHaveURL(url =>
      url.pathname === '/changes/continue-to-form' && url.searchParams.get('token') === 'skip'
    );
  }
}