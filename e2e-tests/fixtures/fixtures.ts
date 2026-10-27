import { test as base } from 'playwright-bdd';
import { BasePage } from '../pages/saa-base-page';
import { SendEvidencePage } from '../pages/saa-send-evidence-page';
import { PrepareYourEvidencePage } from '../pages/saa-prepare-your-evidence-page';
import { UploadSupportingEvidencePage } from '../pages/saa-upload-supporting-evidence-page';
import { ViolentUpsettingImagesPage } from '../pages/saa-violent-upsetting-images-page';
import { EvidenceCheckYourAnswersPage } from '../pages/saa-evidence-check-your-answers-page';
import { CheckYourAnswersPage } from '../pages/saa-check-your-answers-page';
import { BeforeYouStartPage } from '../pages/saa-before-you-start-page';
import { ClaimantDetailsPage } from '../pages/saa-claimant-details-page';
import { EmailAddressPage } from '../pages/saa-email-address-page';
import { StartPage } from '../pages/saa-start-page';
import { NoOptionsPage } from '../pages/saa-no-options-page';
import { ClaimDecisionPage } from '../pages/saa-claim-decision-page';
import { ContinueToFormPage } from '../pages/saa-continue-to-form-page';
import { WhichFormPage } from '../pages/saa-which-form-page';
import { InformationGivenPage } from '../pages/saa-information-given-page';
import { ClaimantsNamePage } from '../pages/saa-claimants-name-page';
import { ClaimantMainLanguagePage } from '../pages/saa-claimant-main-language-page';
import { PersonCompletingFormPage } from '../pages/saa-person-completing-form-page';
import { WhoAreYouPage } from '../pages/saa-who-are-you-page';
import { PersonalDetailsPage } from '../pages/saa-personal-details-page';
import { DependantsPage } from '../pages/saa-dependants-page';
import { SomeoneOnClaimDiedPage } from '../pages/saa-someone-on-claim-died-page';
import { SomethingElsePage } from '../pages/saa-something-else-page';

export type Pages = {
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
  claimDecisionPage: ClaimDecisionPage;
  emailAddressPage: EmailAddressPage;
  continueToFormPage: ContinueToFormPage;
  whichFormPage: WhichFormPage;
  informationGivenPage: InformationGivenPage;
  claimantsNamePage: ClaimantsNamePage;
  claimantMainLanguagePage: ClaimantMainLanguagePage;
  personCompletingFormPage: PersonCompletingFormPage;
  whoAreYouPage: WhoAreYouPage;
  personalDetailsPage: PersonalDetailsPage;
  dependantsPage: DependantsPage;
  someoneOnClaimDiedPage: SomeoneOnClaimDiedPage;
  somethingElsePage: SomethingElsePage;
  noOptionsPage: NoOptionsPage;
};

export const test = base.extend<{ pages: Pages }>({
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
      claimDecisionPage: new ClaimDecisionPage(page),
      emailAddressPage: new EmailAddressPage(page),
      continueToFormPage: new ContinueToFormPage(page),
      whichFormPage: new WhichFormPage(page),
      informationGivenPage: new InformationGivenPage(page),
      claimantsNamePage: new ClaimantsNamePage(page),
      claimantMainLanguagePage: new ClaimantMainLanguagePage(page),
      personCompletingFormPage: new PersonCompletingFormPage(page),
      whoAreYouPage: new WhoAreYouPage(page),
      personalDetailsPage: new PersonalDetailsPage(page),
      dependantsPage: new DependantsPage(page),
      someoneOnClaimDiedPage: new SomeoneOnClaimDiedPage(page),
      somethingElsePage: new SomethingElsePage(page),
      noOptionsPage: new NoOptionsPage(page),
    });
  },
});

export const expect = test.expect;