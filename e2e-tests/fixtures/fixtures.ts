import { test as base } from 'playwright-bdd';
import { BasePage } from '../pages/base-page';
import { SendEvidencePage } from '../pages/send-evidence-page';
import { PrepareYourEvidencePage } from '../pages/prepare-your-evidence-page';
import { UploadSupportingEvidencePage } from '../pages/upload-supporting-evidence-page';
import { ViolentUpsettingImagesPage } from '../pages/violent-upsetting-images-page';
import { EvidenceCheckYourAnswersPage } from '../pages/evidence-check-your-answers-page';
import { CheckYourAnswersPage } from '../pages/check-your-answers-page';
import { BeforeYouStartPage } from '../pages/before-you-start-page';
import { ClaimantDetailsPage } from '../pages/claimant-details-page';
import { EmailAddressPage } from '../pages/email-address-page';
import { StartPage } from '../pages/start-page';
import { NoOptionsPage } from '../pages/no-options-page';
import { EvidenceJourney } from '../utility-helper/evidence-journey';
import { EVIDENCE_PAGES } from '../utility-helper/constants-lib';

type Pages = {
  basePage: BasePage;
  sendEvidencePage: SendEvidencePage;
  prepareYourEvidencePage: PrepareYourEvidencePage;
  uploadSupportingEvidencePage: UploadSupportingEvidencePage;
  violentUpsettingImagesPage: ViolentUpsettingImagesPage;
  evidenceCheckYourAnswersPage: EvidenceCheckYourAnswersPage;
  checkYourAnswersPage: CheckYourAnswersPage;
  startPage: StartPage;
  beforeYouStartPage: BeforeYouStartPage;
  claimantDetailsPage: ClaimantDetailsPage;
  emailAddressPage: EmailAddressPage;
  noOptionsPage: NoOptionsPage;
  someoneOnClaimDiedPage: BasePage;
};

export const test = base.extend<{ pages: Pages; journey: EvidenceJourney }>({
  pages: async ({ page }, use) => {
    await use({
      basePage: new BasePage(page),
      sendEvidencePage: new SendEvidencePage(page),
      prepareYourEvidencePage: new PrepareYourEvidencePage(page),
      uploadSupportingEvidencePage: new UploadSupportingEvidencePage(page),
      violentUpsettingImagesPage: new ViolentUpsettingImagesPage(page),
      evidenceCheckYourAnswersPage: new EvidenceCheckYourAnswersPage(page),
      checkYourAnswersPage: new CheckYourAnswersPage(page),
      startPage: new StartPage(page),
      beforeYouStartPage: new BeforeYouStartPage(page),
      claimantDetailsPage: new ClaimantDetailsPage(page),
      emailAddressPage: new EmailAddressPage(page),
      noOptionsPage: new NoOptionsPage(page),
      someoneOnClaimDiedPage: new BasePage(page, EVIDENCE_PAGES['Someone on my claim has died']),
    });
  },
  journey: async ({ pages }, use) => {
    await use(new EvidenceJourney(
      pages.basePage,
      pages.startPage,
      pages.beforeYouStartPage,
      pages.claimantDetailsPage,
      pages.emailAddressPage,
      pages.uploadSupportingEvidencePage,
      {
        'Send evidence for your claim': pages.sendEvidencePage,
        'Prepare your evidence': pages.prepareYourEvidencePage,
        'Upload evidence to help your claim': pages.uploadSupportingEvidencePage,
        'Violent or upsetting images': pages.violentUpsettingImagesPage,
        'Evidence check your answers': pages.evidenceCheckYourAnswersPage,
        'Check your answers': pages.checkYourAnswersPage,
        'Someone on my claim has died': pages.someoneOnClaimDiedPage,
      }
    ));
  },
});

export const expect = test.expect;