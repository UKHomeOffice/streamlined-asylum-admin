import { BasePage } from '../pages/base-page';
import { BeforeYouStartPage } from '../pages/before-you-start-page';
import { ClaimantDetailsPage } from '../pages/claimant-details-page';
import { EmailAddressPage } from '../pages/email-address-page';
import { StartPage } from '../pages/start-page';
import { UploadSupportingEvidencePage } from '../pages/upload-supporting-evidence-page';
import { EVIDENCE_PAGES, MAX_JOURNEY_STEPS, NO_OPTIONS_PAGE } from './constants-lib';

export class EvidenceJourney {
  constructor(
    private readonly basePage: BasePage,
    private readonly startPage: StartPage,
    private readonly beforeYouStartPage: BeforeYouStartPage,
    private readonly claimantDetailsPage: ClaimantDetailsPage,
    private readonly emailAddressPage: EmailAddressPage,
    private readonly uploadSupportingEvidencePage: UploadSupportingEvidencePage,
    private readonly pages: Record<string, BasePage>,
  ) {}

  pageFor(name: string): BasePage {
    const target = this.pages[name];
    if (!target?.details) {
      throw new Error(`No page mapping defined for "${name}"`);
    }
    return target;
  }

  async navigateTo(name: string, emailAddress: string) {
    const target = this.pageFor(name);
    await this.startPage.startJourney();
    await this.beforeYouStartPage.continueToClaimantDetails();
    await this.claimantDetailsPage.complete();
    await this.basePage.answerQuestion('No', 'Has there been a decision on the asylum claim?');
    await this.basePage.continueToNextPage();
    await this.emailAddressPage.authenticate(emailAddress);
    await this.basePage.enterForm();
    await this.continueUntil(target.details!.path);
    await target.assertOnPage();
  }

  async continueToCheckYourAnswers() {
    await this.basePage.continueToNextPage();
    await this.continueUntil(EVIDENCE_PAGES['Check your answers'].path);
  }

  private async continueUntil(path: string) {
    for (let step = 0; step < MAX_JOURNEY_STEPS; step++) {
      const currentPath = this.basePage.currentPath;
      if (currentPath === path) {
        return;
      }
      if (currentPath === NO_OPTIONS_PAGE.path) {
        return;
      }
      if (currentPath === EVIDENCE_PAGES['Send evidence for your claim'].path) {
        await this.basePage.answerQuestion('Yes', EVIDENCE_PAGES['Send evidence for your claim'].heading);
      }
      if (currentPath === '/changes/personal-details') {
        await this.basePage.answerQuestion('No', 'Do you need to update personal details?');
      }
      if (currentPath === '/changes/claimants-name') {
        await this.basePage.page.getByLabel('Given name').fill('Test');
        await this.basePage.page.getByLabel('Family name').fill('User');
      }
      if (currentPath === '/changes/claimant-main-language') {
        const language = this.basePage.page.getByRole('combobox', { name: 'Main language' });
        await language.fill('English');
        await this.basePage.page.getByRole('option', { name: 'English', exact: true }).click();
      }
      if (currentPath === '/changes/person-completing-form') {
        await this.basePage.answerQuestion(
          'For me',
          'Are you completing the form for you or someone else?'
        );
      }
      if (currentPath === EVIDENCE_PAGES['Upload evidence to help your claim'].path) {
        await this.uploadSupportingEvidencePage.uploadEvidenceForJourney();
      }
      if (currentPath === '/changes/do-you-need-add-remove-dependant' ||
          currentPath === EVIDENCE_PAGES['Violent or upsetting images'].path) {
        await this.basePage.selectRadio('No');
      }
      if (currentPath === EVIDENCE_PAGES['Someone on my claim has died'].path) {
        await this.basePage.answerQuestion(
          'No',
          EVIDENCE_PAGES['Someone on my claim has died'].heading
        );
      }
      if (currentPath === '/changes/something-else') {
        await this.basePage.answerQuestion('No', 'Do you need to do something else?');
      }
      await this.basePage.continueToNextPage();
    }
    throw new Error(`Did not reach ${path} within ${MAX_JOURNEY_STEPS} steps`);
  }
}