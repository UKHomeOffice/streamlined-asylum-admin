import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../fixture/fixtures';
import { ConstantsLib as c } from '../utility-helper/constants-lib';
// import { DataTable } from '@cucumber/cucumber';

export const { Given, When, Then } = createBdd(test);


Given('I visit the streamlined asylum admin page', async ({ pages }) => {
  await pages.sendInformationForYourAsylumClaimPage.navigateToUrl();
});


When('I complete the supporting evidence journey pertaining to {string}', async ({ pages }, scenario: string) => {
  await pages.sendInformationForYourAsylumClaimPage.completecompleteSendInformationForYourAsylumClaimPage();

  switch (scenario.toLowerCase()) {
    case "t1: evidence submitted": {
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
    default:
      throw new Error(`Invalid scenario: ${pageName}`);
  }
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