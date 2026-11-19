import { type Page } from '@playwright/test';
import { DoYouNeedToTellUsSomeoneOnYourClaimHasDiedPage } from './saa-do-you-need-to-tell-us-someone-on-your-claim-has-died-page';

export class DoYouNeedToTellUsSomeoneOnYourClaimHasDiedRadPage extends DoYouNeedToTellUsSomeoneOnYourClaimHasDiedPage {
  constructor(page: Page) {
    super(page);
  }
}