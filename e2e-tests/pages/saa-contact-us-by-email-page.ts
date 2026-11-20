import { type Locator, type Page, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class ContactUsByEmailPage extends BasePage {
  readonly emailAddressLink: Locator;
  readonly arcEnquiryFormLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailAddressLink = page.getByRole('link', {
      name: 'ahrocentralcommunicationshub@contactus.homeoffice.gov.uk',
      exact: true,
    });
    this.arcEnquiryFormLink = page.getByRole('link', { name: 'ARC enquiry form', exact: true });
  }

  async expectedPageTitle(): Promise<string> {
    const title = await this.page.title();

    return title.startsWith('Error')
      ? 'Error: You should contact the Home Office a different way – Send information for your asylum claim – GOV.UK'
      : 'You should contact the Home Office a different way – Send information for your asylum claim – GOV.UK';
  }

  async assertContactUsByEmailPage(): Promise<void> {
    await this.assertAccessibility();
    await this.assertPageTitle(this.page, await this.expectedPageTitle());
    await expect(this.emailAddressLink).toBeVisible();
    await expect(this.arcEnquiryFormLink).toBeVisible();
  }
}