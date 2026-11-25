import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../fixture/fixtures';
import { ConstantsLib as c } from '../utility-helper/constants-lib';
// import { DataTable } from '@cucumber/cucumber';

export const { Given, When, Then } = createBdd(test);


Given('I visit the streamlined asylum admin page', async ({ pages }) => {
  await pages.sendInformationForYourAsylumClaimPage.navigateToUrl();
});


When('I complete the SAA journey pertaining to {string}', async ({ pages }, scenario: string) => {
  await pages.sendInformationForYourAsylumClaimPage.completecompleteSendInformationForYourAsylumClaimPage();

  switch (scenario.toLowerCase()) {
    case "t1: evidence submitted":
    case "t5: add a child as a dependant":
    case "t6: remove a child as a dependant": {
      const isAddChild = scenario.toLowerCase() === "t5: add a child as a dependant";
      const isRemoveChild = scenario.toLowerCase() === "t6: remove a child as a dependant";
      await pages.whatYouNeedBeforeYouStartPage.completeWhatYouNeedBeforeYouStartPage();
      const applicationNumber = pages.aboutThePersonWhoMadeTheClaimPage.getGeneratedUniqueApplicationNumber();
      await pages.aboutThePersonWhoMadeTheClaimPage.completeAboutThePersonWhoMadeTheClaimPage(applicationNumber, c.DOB_1990);
      await pages.hasThereBeenADecisionOnTheAsylumClaimPage.completeHasThereBeenADecisionOnTheAsylumClaimPage(c.OPTION_NO);
      await pages.whatIsYourEmailAddressPage.completeWhatIsYourEmailAddressPage(c.SAS_HOF_EMAIL);
      await pages.continueToYourFormPage.completeContinueToYourFormPage();
      await pages.whichFormDoYouNeedToContinuePage.completeWhichFormDoYouNeedToContinuePage(applicationNumber);
      await pages.informationYouHaveGivenUsPage.completeInformationYouHaveGivenUsPage();
      await pages.claimantsNamePage.completeClaimantsNamePage(c.GIVEN_NAME, c.FAMILY_NAME);
      await pages.claimantsMainLanguagePage.completeClaimantsMainLanguagePage(c.OPTION_ENGLISH);
      await pages.areYouCompletingTheFormForYouOrSomeoneElsePage.completeAreYouCompletingTheFormForYouOrSomeoneElsePage(c.OPTION_FOR_ME);
      await pages.whoAreYouPage.completeWhoAreYouPage(c.OPTION_I_AM_THE_PERSON);
      await pages.doYouNeedToUpdatePersonalDetailsPage.completeDoYouNeedToUpdatePersonalDetailsPage(c.OPTION_NO);
      await pages.doYouNeedToAddOrRemoveAChildOrPartnerAsADependantPage.completeDoYouNeedToAddOrRemoveAChildOrPartnerAsADependantPage(
        isAddChild || isRemoveChild ? c.OPTION_YES : c.OPTION_NO
      );
      if (isAddChild || isRemoveChild) {
        await pages.addRemoveChildPartnerPage.completeAddRemoveChildPartnerPage(
          isRemoveChild ? c.OPTION_REMOVE_CHILD_OR_PARTNER : c.OPTION_ADD_CHILD_OR_PARTNER
        );
        if (isRemoveChild) {
          await pages.reasonForRemovingChildPartnerPage.completeReasonForRemovingChildPartnerPage(c.REASON_FOR_REMOVING_CHILD);
        }
        await pages.relationshipToChildPartnerPage.completeRelationshipToChildPartnerPage(c.OPTION_MY_CHILD);
        await pages.theirNamePage.completeChildPartnerNamePage(c.GIVEN_NAME, c.FAMILY_NAME);
        await pages.theirDateOfBirthPage.completeChildPartnerDateOfBirthPage(c.CHILD_DOB);
        await pages.theirCountryOfNationalityPage.completeChildPartnerNationalityPage(c.CHILD_NATIONALITY);
        await pages.evidenceChildPartnerPage.completeEvidenceChildPartnerPage(c.EVIDENCE_UPLOAD_FILE);
        await pages.checkYourAnswersAddChildPartnerPage.assertChildPartnerAnswers(
          c.OPTION_MY_CHILD, c.GIVEN_NAME, c.FAMILY_NAME, c.CHILD_DOB_DISPLAY, c.CHILD_NATIONALITY, c.EVIDENCE_UPLOAD_FILE
        );
        if (isRemoveChild) {
          await pages.checkYourAnswersAddChildPartnerPage.assertChildPartnerRemoval(c.REASON_FOR_REMOVING_CHILD);
        }
        break;
      }
      await pages.doYouNeedToSendEvidenceToHelpYourClaimPage.completeDoYouNeedToSendEvidenceToHelpYourClaimPage(c.OPTION_YES);
      await pages.prepareYourEvidencePage.completePrepareYourEvidencePage();
      await pages.uploadEvidenceToHelpYourClaimPage.completeUploadEvidenceToHelpYourClaimPage(c.EVIDENCE_UPLOAD_FILE);
      await pages.violentOrUpsettingImagesPage.completeViolentOrUpsettingImagesPage(c.OPTION_NO);
      break;
    }
    case "t2: no evidence required":
    case c.SCENARIO_T3_NO_EVIDENCE_OR_OTHER_REQUEST:
    case "t4: no other request": {
      await pages.whatYouNeedBeforeYouStartPage.completeWhatYouNeedBeforeYouStartPage();
      const applicationNumber = pages.aboutThePersonWhoMadeTheClaimPage.getGeneratedUniqueApplicationNumber();
      await pages.aboutThePersonWhoMadeTheClaimPage.completeAboutThePersonWhoMadeTheClaimPage(applicationNumber, c.DOB_1990);
      await pages.hasThereBeenADecisionOnTheAsylumClaimPage.completeHasThereBeenADecisionOnTheAsylumClaimPage(c.OPTION_NO);
      await pages.whatIsYourEmailAddressPage.completeWhatIsYourEmailAddressPage(c.SAS_HOF_EMAIL);
      await pages.continueToYourFormPage.completeContinueToYourFormPage();
      await pages.whichFormDoYouNeedToContinuePage.completeWhichFormDoYouNeedToContinuePage(applicationNumber);
      await pages.informationYouHaveGivenUsPage.completeInformationYouHaveGivenUsPage();
      await pages.claimantsNamePage.completeClaimantsNamePage(c.GIVEN_NAME, c.FAMILY_NAME);
      await pages.claimantsMainLanguagePage.completeClaimantsMainLanguagePage(c.OPTION_ENGLISH);
      await pages.areYouCompletingTheFormForYouOrSomeoneElsePage.completeAreYouCompletingTheFormForYouOrSomeoneElsePage(c.OPTION_FOR_ME);
      await pages.whoAreYouPage.completeWhoAreYouPage(c.OPTION_I_AM_THE_PERSON);
      await pages.doYouNeedToUpdatePersonalDetailsPage.completeDoYouNeedToUpdatePersonalDetailsPage(c.OPTION_NO);
      await pages.doYouNeedToAddOrRemoveAChildOrPartnerAsADependantPage.completeDoYouNeedToAddOrRemoveAChildOrPartnerAsADependantPage(c.OPTION_NO);
      await pages.doYouNeedToSendEvidenceToHelpYourClaimPage.completeDoYouNeedToSendEvidenceToHelpYourClaimPage(c.OPTION_NO); // different scenario
      await pages.doYouNeedToTellUsSomeoneOnYourClaimHasDiedPage.completeDoYouNeedToTellUsSomeoneOnYourClaimHasDiedPage(c.OPTION_NO);
      await pages.doYouNeedToDoSomethingElsePage.completeDoYouNeedToDoSomethingElsePage(
        scenario.toLowerCase() === c.SCENARIO_T3_NO_EVIDENCE_OR_OTHER_REQUEST ? c.OPTION_YES : c.OPTION_NO
      );
      break;
    }
    default:
      throw new Error(`Invalid scenario: ${scenario}`);
  }
});

Then('I should be on {string} page', async ({ pages }, expectedPageHeaderText: string) => {
  const actualPageHeaderTextLocator = pages.basePage.headerText;
  await expect(actualPageHeaderTextLocator).toHaveText(expectedPageHeaderText);
});

Then('the contact us by email page should pass accessibility and title checks', async ({ pages }) => {
  await pages.contactUsByEmailPage.assertAccessibilityAndPageTitleForContactUsByEmailPage();
});




// ****************************************** Validations ******************************************


When('I choose to navigate to {string} page', async ({ pages }, pageName: string) => {
  await pages.sendInformationForYourAsylumClaimPage.completecompleteSendInformationForYourAsylumClaimPage();

  switch (pageName.toLowerCase()) {
    case "about the person who made the claim": {
      await pages.whatYouNeedBeforeYouStartPage.completeWhatYouNeedBeforeYouStartPage();
      await pages.aboutThePersonWhoMadeTheClaimPage.assertPageTitle(
        pages.basePage.page,
        await pages.aboutThePersonWhoMadeTheClaimPage.expectedPageTitle()
      );
      break;
    }
    default:
      throw new Error(`Invalid scenario: ${pageName}`);
  }
});

When('I select continue', async ({ pages }) => {
  await pages.basePage.clickContinueButton();
});

When('I complete the {string} page', async ({pages}, pageName: string) => {
  switch (pageName.toLowerCase()) {
    case "about the person who made the claim": {
      const applicationNumber = pages.aboutThePersonWhoMadeTheClaimPage.getGeneratedUniqueApplicationNumber();
      await pages.aboutThePersonWhoMadeTheClaimPage.completeAboutThePersonWhoMadeTheClaimPage(applicationNumber, c.DOB_1990);
      break;
    }
    case "has there been a decision on the asylum claim?": 
      await pages.hasThereBeenADecisionOnTheAsylumClaimPage.completeHasThereBeenADecisionOnTheAsylumClaimPage(c.OPTION_NO);
      break;
    case "what is your email address?":
      await pages.whatIsYourEmailAddressPage.completeWhatIsYourEmailAddressPage(c.SAS_HOF_EMAIL);
      break;
    case "continue to your form":
      await pages.continueToYourFormPage.completeContinueToYourFormPage();
      break;
    case "which form do you need to continue?": {
      const applicationNumber = pages.aboutThePersonWhoMadeTheClaimPage.getGeneratedUniqueApplicationNumber();
      await pages.whichFormDoYouNeedToContinuePage.completeWhichFormDoYouNeedToContinuePage(applicationNumber);
      break;
    }
    case "information you have given us":
      await pages.informationYouHaveGivenUsPage.completeInformationYouHaveGivenUsPage();
      break;
    case "claimant's main language":
      await pages.claimantsMainLanguagePage.completeClaimantsMainLanguagePage(c.OPTION_ENGLISH);
      break;
    case "are you completing the form for you or someone else?":
      await pages.areYouCompletingTheFormForYouOrSomeoneElsePage.completeAreYouCompletingTheFormForYouOrSomeoneElsePage(c.OPTION_FOR_ME);
      break;
    case "who are you?":
      await pages.whoAreYouPage.completeWhoAreYouPage(c.OPTION_I_AM_THE_PERSON);
      break;
    case "do you need to update personal details?":
      await pages.doYouNeedToUpdatePersonalDetailsPage.completeDoYouNeedToUpdatePersonalDetailsPage(c.OPTION_NO);
      break;
    case "do you need to add or remove a child or partner as a dependant?":
      await pages.doYouNeedToAddOrRemoveAChildOrPartnerAsADependantPage.completeDoYouNeedToAddOrRemoveAChildOrPartnerAsADependantPage(c.OPTION_YES);
      break;
    case "do you need to add a dependant or remove a dependant?":
      await pages.addRemoveChildPartnerPage.completeAddRemoveChildPartnerPage(c.OPTION_ADD_CHILD_OR_PARTNER);
      break;
    case "how are they related to you?":
      await pages.relationshipToChildPartnerPage.completeRelationshipToChildPartnerPage(c.OPTION_MY_CHILD);
      break;
    case "their date of birth":
      await pages.theirDateOfBirthPage.completeChildPartnerDateOfBirthPage(c.CHILD_DOB);
      break;
    default:
      throw new Error(`Invalid scenario: ${pageName}`);
  }
});

When('I complete the {string} page with {string} and {string}', async ({ pages }, pageName: string, givenName: string, familyName: string) => {
  switch (pageName.toLowerCase()) {
    case "claimant's name":
      await pages.claimantsNamePage.completeClaimantsNamePage(givenName, familyName);
      break;
    case "their name":
      await pages.theirNamePage.completeChildPartnerNamePage(givenName, familyName);
      break;
    default:
      throw new Error(`Invalid scenario: ${pageName}`);
  }
});

When('I submit {string} as my email address', async ({ pages }, emailAddress: string) => {
  await pages.whatIsYourEmailAddressPage.completeWhatIsYourEmailAddressPage(emailAddress);
});

When('I submit my email address without entering it', async ({ pages }) => {
  await pages.whatIsYourEmailAddressPage.completeWhatIsYourEmailAddressPage('');
});

When('I submit day {string} as their date of birth', async ({ pages }, day: string) => {
  await pages.theirDateOfBirthPage.submitDayOnlyForChildPartnerDateOfBirthPage(day);
});

Then('I should see {string} error message displayed', async ({ pages }, expectedErrorMessage: string) => {
  const actualErrorMessageLocator = await pages.basePage.getThereIsAProblemTextErrorText();
  expect(expectedErrorMessage).toEqual(actualErrorMessageLocator!);
});

Then('I should see {string} error summary', async ({ pages }, expectedErrorMessage: string) => {
  const expectedErrorArray = expectedErrorMessage.trim().split('¬');

  const actualText = await pages.basePage.getErrorSummaryListText();
  const actualErrorArray = actualText!
    .replaceAll('\t', '') // remove ALL tabs
    .trim()             // remove leading/trailing whitespace
    .split(/\r?\n/);    // handle all newline types

  expect(actualErrorArray).toEqual(expectedErrorArray);
});

Then('I should see {string} link to {string}', async ({ pages }, linkText: string, expectedUrl: string) => {
  await pages.basePage.assertLinkDisplayed(linkText, expectedUrl);
});