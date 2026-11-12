import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class NoOptionsPage extends BasePage {
  constructor(page: Page) {
    super(page, { path: '/changes/no-options', heading: 'You have not selected any options' });
  }
}