import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class WhoAreYouPage extends BasePage {
  constructor(page: Page) {
    super(page, { path: '/changes/who-are-you', heading: 'Who are you?' });
  }
}