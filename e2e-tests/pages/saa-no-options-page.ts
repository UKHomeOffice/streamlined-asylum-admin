import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';
import { NO_OPTIONS_PAGE } from '../utility-helper/constants-lib';

export class NoOptionsPage extends BasePage {
  constructor(page: Page) {
    super(page, NO_OPTIONS_PAGE);
  }
}