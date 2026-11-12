import { type Page } from '@playwright/test';
import { SomeoneOnClaimDiedPage } from './saa-someone-on-claim-died-page';

export class RADSomeoneOnClaimDiedPage extends SomeoneOnClaimDiedPage {
  constructor(page: Page) {
    super(page);
  }
}