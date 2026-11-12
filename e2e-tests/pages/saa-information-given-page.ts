import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';

export class InformationGivenPage extends BasePage {
  constructor(page: Page) {
    super(page, { path: '/changes/information-given', heading: 'Information you have given us' });
  }
}