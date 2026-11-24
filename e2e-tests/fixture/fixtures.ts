import { test as base } from 'playwright-bdd';
import { BasePage } from '../pages/base-page';
import { DoYouNeedToSendEvidenceToHelpYourClaimPage } from '../pages/saa-do-you-need-to-send-evidence-to-help-your-claim-page';
import { PrepareYourEvidencePage } from '../pages/saa-prepare-your-evidence-page';
import { UploadEvidenceToHelpYourClaimPage } from '../pages/saa-upload-evidence-to-help-your-claim-page';
import { ViolentOrUpsettingImagesPage } from '../pages/saa-violent-or-upsetting-images-page';
import { CheckYourAnswersEvidencePage } from '../pages/saa-check-your-answers-evidence-page';
import { CheckYourAnswersFinalPage } from '../pages/saa-check-your-answers-final-page';
import { WhatYouNeedBeforeYouStartPage } from '../pages/saa-what-you-need-before-you-start-page';
import { AboutThePersonWhoMadeTheClaimPage } from '../pages/saa-about-the-person-who-made-the-claim-page';
import { WhatIsYourEmailAddressPage } from '../pages/saa-what-is-your-email-address-page';
import { SendInformationForYourAsylumClaimPage } from '../pages/saa-send-information-for-your-asylum-claim-page';
import { YouHaveNotSelectedAnyOptionsPage } from '../pages/saa-you-have-not-selected-any-options-page';
import { HasThereBeenADecisionOnTheAsylumClaimPage } from '../pages/saa-has-there-been-a-decision-on-the-asylum-claim-page';
import { ContinueToYourFormPage } from '../pages/saa-continue-to-your-form-page';
import { WhichFormDoYouNeedToContinuePage } from '../pages/saa-which-form-do-you-need-to-continue-page';
import { InformationYouHaveGivenUsPage } from '../pages/saa-information-you-have-given-us-page';
import { ClaimantsNamePage } from '../pages/saa-claimants-name-page';
import { ClaimantsMainLanguagePage } from '../pages/saa-claimants-main-language-page';
import { AreYouCompletingTheFormForYouOrSomeoneElsePage } from '../pages/saa-are-you-completing-the-form-for-you-or-someone-else-page';
import { WhoAreYouPage } from '../pages/saa-who-are-you-page';
import { DoYouNeedToUpdatePersonalDetailsPage } from '../pages/saa-do-you-need-to-update-personal-details-page';
import { DoYouNeedToAddOrRemoveAChildOrPartnerAsADependantPage } from '../pages/saa-do-you-need-to-add-or-remove-a-child-or-partner-as-a-dependant-page';
import { DoYouNeedToTellUsSomeoneOnYourClaimHasDiedPage } from '../pages/saa-do-you-need-to-tell-us-someone-on-your-claim-has-died-page';
import { DoYouNeedToDoSomethingElsePage } from '../pages/saa-do-you-need-to-do-something-else-page';
import { ContactUsByEmailPage } from '../pages/saa-contact-us-by-email-page';
import { DoYouNeedToTellUsSomeoneOnYourClaimHasDiedRadPage } from '../pages/saa-do-you-need-to-tell-us-someone-on-your-claim-has-died-rad-page';
import { TellUsAboutThePersonWhoHasDiedPage } from '../pages/saa-tell-us-about-the-person-who-has-died-page';
import { DidTheyMakeTheClaimPage } from '../pages/saa-did-they-make-the-claim-page';
import { TheirNamePage } from '../pages/saa-their-name-page';
import { TheirDateOfBirthPage } from '../pages/saa-their-date-of-birth-page';
import { TheirCountryOfNationalityPage } from '../pages/saa-their-country-of-nationality-page';
import { UploadTheDeathCertificatePage } from '../pages/saa-upload-the-death-certificate-page';
import { CheckYourAnswersDeathPage } from '../pages/saa-check-your-answers-death-page';
import { AddRemoveChildPartnerPage } from '../pages/saa-add-remove-child-partner-page';
import { RelationshipToChildPartnerPage } from '../pages/saa-relationship-to-child-partner-page';
import { EvidenceChildPartnerPage } from '../pages/saa-evidence-child-partner-page';
import { CheckYourAnswersAddChildPartnerPage } from '../pages/saa-check-your-answers-add-child-partner-page';
import { ReasonForRemovingChildPartnerPage } from '../pages/saa-reason-for-removing-child-partner-page';

export type Pages = {
  addRemoveChildPartnerPage: AddRemoveChildPartnerPage;
  relationshipToChildPartnerPage: RelationshipToChildPartnerPage;
  evidenceChildPartnerPage: EvidenceChildPartnerPage;
  checkYourAnswersAddChildPartnerPage: CheckYourAnswersAddChildPartnerPage;
  reasonForRemovingChildPartnerPage: ReasonForRemovingChildPartnerPage;
  doYouNeedToTellUsSomeoneOnYourClaimHasDiedRadPage: DoYouNeedToTellUsSomeoneOnYourClaimHasDiedRadPage;
  tellUsAboutThePersonWhoHasDiedPage: TellUsAboutThePersonWhoHasDiedPage;
  didTheyMakeTheClaimPage: DidTheyMakeTheClaimPage;
  theirNamePage: TheirNamePage;
  theirDateOfBirthPage: TheirDateOfBirthPage;
  theirCountryOfNationalityPage: TheirCountryOfNationalityPage;
  uploadTheDeathCertificatePage: UploadTheDeathCertificatePage;
  checkYourAnswersDeathPage: CheckYourAnswersDeathPage;
  basePage: BasePage;
  doYouNeedToSendEvidenceToHelpYourClaimPage: DoYouNeedToSendEvidenceToHelpYourClaimPage;
  prepareYourEvidencePage: PrepareYourEvidencePage;
  uploadEvidenceToHelpYourClaimPage: UploadEvidenceToHelpYourClaimPage;
  violentOrUpsettingImagesPage: ViolentOrUpsettingImagesPage;
  checkYourAnswersEvidencePage: CheckYourAnswersEvidencePage;
  checkYourAnswersFinalPage: CheckYourAnswersFinalPage;
  sendInformationForYourAsylumClaimPage: SendInformationForYourAsylumClaimPage;
  whatYouNeedBeforeYouStartPage: WhatYouNeedBeforeYouStartPage;
  aboutThePersonWhoMadeTheClaimPage: AboutThePersonWhoMadeTheClaimPage;
  hasThereBeenADecisionOnTheAsylumClaimPage: HasThereBeenADecisionOnTheAsylumClaimPage;
  whatIsYourEmailAddressPage: WhatIsYourEmailAddressPage;
  continueToYourFormPage: ContinueToYourFormPage;
  whichFormDoYouNeedToContinuePage: WhichFormDoYouNeedToContinuePage;
  informationYouHaveGivenUsPage: InformationYouHaveGivenUsPage;
  claimantsNamePage: ClaimantsNamePage;
  claimantsMainLanguagePage: ClaimantsMainLanguagePage;
  areYouCompletingTheFormForYouOrSomeoneElsePage: AreYouCompletingTheFormForYouOrSomeoneElsePage;
  whoAreYouPage: WhoAreYouPage;
  doYouNeedToUpdatePersonalDetailsPage: DoYouNeedToUpdatePersonalDetailsPage;
  doYouNeedToAddOrRemoveAChildOrPartnerAsADependantPage: DoYouNeedToAddOrRemoveAChildOrPartnerAsADependantPage;
  doYouNeedToTellUsSomeoneOnYourClaimHasDiedPage: DoYouNeedToTellUsSomeoneOnYourClaimHasDiedPage;
  doYouNeedToDoSomethingElsePage: DoYouNeedToDoSomethingElsePage;
  contactUsByEmailPage: ContactUsByEmailPage;
  youHaveNotSelectedAnyOptionsPage: YouHaveNotSelectedAnyOptionsPage;
};

export const test = base.extend<{ pages: Pages }>({
  pages: async ({ page }, use) => {
    await use({
      addRemoveChildPartnerPage: new AddRemoveChildPartnerPage(page),
      relationshipToChildPartnerPage: new RelationshipToChildPartnerPage(page),
      evidenceChildPartnerPage: new EvidenceChildPartnerPage(page),
      checkYourAnswersAddChildPartnerPage: new CheckYourAnswersAddChildPartnerPage(page),
      reasonForRemovingChildPartnerPage: new ReasonForRemovingChildPartnerPage(page),
      doYouNeedToTellUsSomeoneOnYourClaimHasDiedRadPage: new DoYouNeedToTellUsSomeoneOnYourClaimHasDiedRadPage(page),
      tellUsAboutThePersonWhoHasDiedPage: new TellUsAboutThePersonWhoHasDiedPage(page),
      didTheyMakeTheClaimPage: new DidTheyMakeTheClaimPage(page),
      theirNamePage: new TheirNamePage(page),
      theirDateOfBirthPage: new TheirDateOfBirthPage(page),
      theirCountryOfNationalityPage: new TheirCountryOfNationalityPage(page),
      uploadTheDeathCertificatePage: new UploadTheDeathCertificatePage(page),
      checkYourAnswersDeathPage: new CheckYourAnswersDeathPage(page),
      basePage: new BasePage(page),
      doYouNeedToSendEvidenceToHelpYourClaimPage: new DoYouNeedToSendEvidenceToHelpYourClaimPage(page),
      prepareYourEvidencePage: new PrepareYourEvidencePage(page),
      uploadEvidenceToHelpYourClaimPage: new UploadEvidenceToHelpYourClaimPage(page),
      violentOrUpsettingImagesPage: new ViolentOrUpsettingImagesPage(page),
      checkYourAnswersEvidencePage: new CheckYourAnswersEvidencePage(page),
      checkYourAnswersFinalPage: new CheckYourAnswersFinalPage(page),
      sendInformationForYourAsylumClaimPage: new SendInformationForYourAsylumClaimPage(page),
      whatYouNeedBeforeYouStartPage: new WhatYouNeedBeforeYouStartPage(page),
      aboutThePersonWhoMadeTheClaimPage: new AboutThePersonWhoMadeTheClaimPage(page),
      hasThereBeenADecisionOnTheAsylumClaimPage: new HasThereBeenADecisionOnTheAsylumClaimPage(page),
      whatIsYourEmailAddressPage: new WhatIsYourEmailAddressPage(page),
      continueToYourFormPage: new ContinueToYourFormPage(page),
      whichFormDoYouNeedToContinuePage: new WhichFormDoYouNeedToContinuePage(page),
      informationYouHaveGivenUsPage: new InformationYouHaveGivenUsPage(page),
      claimantsNamePage: new ClaimantsNamePage(page),
      claimantsMainLanguagePage: new ClaimantsMainLanguagePage(page),
      areYouCompletingTheFormForYouOrSomeoneElsePage: new AreYouCompletingTheFormForYouOrSomeoneElsePage(page),
      whoAreYouPage: new WhoAreYouPage(page),
      doYouNeedToUpdatePersonalDetailsPage: new DoYouNeedToUpdatePersonalDetailsPage(page),
      doYouNeedToAddOrRemoveAChildOrPartnerAsADependantPage: new DoYouNeedToAddOrRemoveAChildOrPartnerAsADependantPage(page),
      doYouNeedToTellUsSomeoneOnYourClaimHasDiedPage: new DoYouNeedToTellUsSomeoneOnYourClaimHasDiedPage(page),
      doYouNeedToDoSomethingElsePage: new DoYouNeedToDoSomethingElsePage(page),
      contactUsByEmailPage: new ContactUsByEmailPage(page),
      youHaveNotSelectedAnyOptionsPage: new YouHaveNotSelectedAnyOptionsPage(page),
    });
  },
});

export const expect = test.expect;