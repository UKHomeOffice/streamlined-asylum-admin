import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class ContinueToFormPage extends BasePage {
  constructor(page: Page) {
    super(page, { path: '/changes/continue-to-form', heading: 'Continue to your form' });
  }
}