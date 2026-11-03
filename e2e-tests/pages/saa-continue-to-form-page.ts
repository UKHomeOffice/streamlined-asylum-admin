import { type Page } from '@playwright/test';
import { BasePage } from './saa-base-page';
import { EVI_JOURNEY_PAGES } from '../utility-helper/constants-lib';

export class ContinueToFormPage extends BasePage {
  constructor(page: Page) {
    super(page, EVI_JOURNEY_PAGES['Form entry']);
  }
}